const { db } = require("../prisma/db.mjs");
const { and } = require("@prisma/orm-postgres/orm-client");
const { buildOperation } = require("@prisma/orm-postgres/relational-core");
const {
    generateVerificationToken,
    generateOtp,
    hashToken,
    safeEqual
} = require("../utils/tokenUtils");
const { toMillis } = require("../utils/dbTime");

// Minimal Temporal polyfill for Node.js runtime when using @prisma/orm-postgres
// timestamp-temporal and timestamptz-temporal codecs
if (typeof Temporal === "undefined") {
    globalThis.Temporal = {
        PlainDateTime: {
            from(str) {
                return { toString: () => str, [Symbol.toStringTag]: "Temporal.PlainDateTime" };
            }
        },
        Instant: {
            from(str) {
                return { toString: () => str, [Symbol.toStringTag]: "Temporal.Instant" };
            }
        }
    };
}

const toPlainDateTime = (date) => ({
    toString: () => date.toISOString().replace("T", " ").replace("Z", ""),
    [Symbol.toStringTag]: "Temporal.PlainDateTime",
    calendarId: "iso8601"
});

const toInstant = (date) => ({
    toString: () => date.toISOString(),
    [Symbol.toStringTag]: "Temporal.Instant",
    calendarId: "iso8601"
});

const getOrmPublic = (context) => (context?.orm?.public ? context.orm.public : db.orm.public);
const getSqlPublic = (context) => (context?.sql?.public ? context.sql.public : db.sql.public);
const executePlan = async (context, plan) => {
    if (context && typeof context.query === "function") {
        return context.query(plan);
    }
    return db.runtime().query(plan);
};

// A login "challenge" is created only after the password is correct.
// The client gets a random loginToken and must send it back with the OTP,
// so the OTP step can never be reached with just a username.

const OTP_TTL_MINUTES = 5;
const MAX_ATTEMPTS = 5;
const MAX_RESENDS = 3;
const RESEND_COOLDOWN_SECONDS = 30;

const EXPIRED_MESSAGE =
    "Your login session has expired. Please log in again";

// accountType is 'user' or 'admin' (login_otps.account_type)
const createLoginChallenge = async (accountId, accountType, client = null) => {
    const loginToken = generateVerificationToken();
    const otp = generateOtp();

    const orm = getOrmPublic(client);

    // One active challenge per account
    await orm.LoginOtps
        .where((r) => and(r.accountId.eq(accountId), r.accountType.eq(accountType)))
        .deleteAll();

    await orm.LoginOtps.create({
        accountId,
        accountType,
        otp: hashToken(otp),
        loginTokenHash: hashToken(loginToken),
        expiresAt: toPlainDateTime(new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000))
    });

    return { loginToken, otp };
};

// Returns { ok: true, accountId } or { ok: false, status, message, attemptsLeft? }
const verifyLoginChallenge = async (loginToken, otp, accountType, client = null) => {
    const tokenHash = hashToken(loginToken);
    const sql = getSqlPublic(client);
    const orm = getOrmPublic(client);

    // Use up one attempt before comparing, atomically, so parallel
    // guesses can never get more than MAX_ATTEMPTS tries
    const plan = sql.login_otps
        .update((f) => ({
            attempts: buildOperation({
                method: "increment",
                args: [f.attempts.buildAst()],
                lowering: { template: "{{self}} + 1" }
            })
        }))
        .where((f, fns) => fns.and(
            fns.eq(f.login_token_hash, tokenHash),
            fns.eq(f.account_type, accountType),
            fns.lt(f.attempts, MAX_ATTEMPTS)
        ))
        .returning("id", "account_id", "otp", "attempts", "expires_at")
        .build();

    const rows = await executePlan(client, plan);

    if (rows.length === 0) {
        // Unknown token, or attempts already used up
        await orm.LoginOtps
            .where((r) => r.loginTokenHash.eq(tokenHash))
            .deleteAll();

        return { ok: false, status: 400, message: EXPIRED_MESSAGE };
    }

    const challenge = rows[0];
    const expiresAtMillis = challenge.expires_at
        ? toMillis(challenge.expires_at)
        : 0;
    const isValid = Number.isFinite(expiresAtMillis) && expiresAtMillis > Date.now();

    if (!isValid) {
        await orm.LoginOtps
            .where((r) => r.id.eq(challenge.id))
            .deleteAll();

        return {
            ok: false,
            status: 400,
            message: "OTP has expired. Please log in again to receive a new OTP"
        };
    }

    if (!safeEqual(hashToken(otp), challenge.otp)) {
        const attemptsLeft = MAX_ATTEMPTS - challenge.attempts;

        if (attemptsLeft <= 0) {
            await orm.LoginOtps
                .where((r) => r.id.eq(challenge.id))
                .deleteAll();

            return {
                ok: false,
                status: 400,
                message: "Too many incorrect codes. Please log in again"
            };
        }

        return {
            ok: false,
            status: 400,
            message: "Invalid OTP",
            attemptsLeft
        };
    }

    // Single use: only the request that deletes the row wins
    const consumed = await orm.LoginOtps
        .where((r) => r.id.eq(challenge.id))
        .deleteAll();

    if (consumed.length === 0) {
        return { ok: false, status: 400, message: EXPIRED_MESSAGE };
    }

    return { ok: true, accountId: challenge.account_id || challenge.accountId };
};

// New code for an existing challenge.
// Returns { ok: true, accountId, otp } or { ok: false, status, message }
const resendLoginChallenge = async (loginToken, accountType, client = null) => {
    const otp = generateOtp();
    const tokenHash = hashToken(loginToken);

    const execute = async (context) => {
        const orm = getOrmPublic(context);

        const existing = await orm.LoginOtps
            .where((r) => and(r.loginTokenHash.eq(tokenHash), r.accountType.eq(accountType)))
            .first();

        if (!existing) {
            return { ok: false, status: 400, message: EXPIRED_MESSAGE };
        }

        if (existing.resendCount >= MAX_RESENDS) {
            return {
                ok: false,
                status: 429,
                message: "Too many codes requested. Please log in again"
            };
        }

        const lastSentTime = existing.lastSentAt
            ? toMillis(existing.lastSentAt)
            : 0;
        const elapsedSeconds = (Date.now() - lastSentTime) / 1000;

        if (elapsedSeconds < RESEND_COOLDOWN_SECONDS) {
            return {
                ok: false,
                status: 429,
                message: `Please wait ${RESEND_COOLDOWN_SECONDS} seconds before requesting a new code`
            };
        }

        const updated = await orm.LoginOtps
            .where((r) => and(r.id.eq(existing.id), r.resendCount.eq(existing.resendCount)))
            .update({
                otp: hashToken(otp),
                attempts: 0,
                resendCount: existing.resendCount + 1,
                lastSentAt: toInstant(new Date()),
                expiresAt: toPlainDateTime(new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000))
            });

        if (!updated) {
            return {
                ok: false,
                status: 429,
                message: `Please wait ${RESEND_COOLDOWN_SECONDS} seconds before requesting a new code`
            };
        }

        return { ok: true, accountId: updated.accountId || existing.accountId, otp };
    };

    if (client && client.orm && client.orm.public) {
        return execute(client);
    }

    return db.transaction(async (tx) => execute(tx));
};

module.exports = {
    createLoginChallenge,
    verifyLoginChallenge,
    resendLoginChallenge
};
