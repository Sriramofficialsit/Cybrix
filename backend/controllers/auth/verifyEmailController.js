const { db } = require("../../prisma/db.mjs");
const { FRONTEND_URL } = require("../../config/env");
const { getUserModel } = require("../../services/accountService");
const { hashToken } = require("../../utils/tokenUtils");
const { toMillis } = require("../../utils/dbTime");
const { confirmPage, resultPage } = require("../../utils/htmlPages");

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

const INVALID_LINK = {
    title: "Link expired",
    message: "This verification link is invalid or has expired. Log in with your email and password and we'll send you a new one.",
    error: true,
    link: `${FRONTEND_URL}/login`,
    linkLabel: "Go to login"
};

// GET: opened from the email. Only shows a confirm button, so a mail
// scanner pre-opening the link doesn't use up the token.
const showVerifyEmail = async (req, res) => {
    try {
        const { token } = req.query;

        // Check if token was provided
        if (!token) {
            return res.status(400).send(resultPage(INVALID_LINK));
        }

        // Find verification token
        const hashed = hashToken(token);
        const record = await db.orm.public.EmailVerificationTokens
            .where((r) => r.token.eq(hashed))
            .first();

        if (!record) {
            return res.status(400).send(resultPage(INVALID_LINK));
        }

        const expiresAtMillis = record.expiresAt
            ? toMillis(record.expiresAt)
            : 0;
        const isValid = Number.isFinite(expiresAtMillis) && expiresAtMillis > Date.now();

        if (!isValid) {
            return res.status(400).send(resultPage(INVALID_LINK));
        }

        return res.send(confirmPage({
            title: "Verify your email",
            message: "Confirm your email address to activate your CyberThulir account.",
            action: "/api/auth/verify-email",
            token,
            buttonLabel: "Verify email"
        }));

    } catch (error) {
        console.error("Email verification error:", error);

        return res.status(500).send(resultPage({
            title: "Something went wrong",
            message: "Please try again in a moment.",
            error: true
        }));
    }
};

// POST: sent by the confirm button
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.body || {};

        if (!token) {
            return res.status(400).send(resultPage(INVALID_LINK));
        }

        const hashed = hashToken(token);

        const verified = await db.transaction(async (tx) => {
            // Find token first
            const record = await tx.orm.public.EmailVerificationTokens
                .where((r) => r.token.eq(hashed))
                .first();

            if (!record) {
                return false;
            }

            const expiresAtMillis = record.expiresAt
                ? toMillis(record.expiresAt)
                : 0;
            const isValid = Number.isFinite(expiresAtMillis) && expiresAtMillis > Date.now();

            if (!isValid) {
                // Delete expired token
                await tx.orm.public.EmailVerificationTokens
                    .where((r) => r.id.eq(record.id))
                    .deleteAll();
                return false;
            }

            // Single use: only the request that deletes this token wins
            const deleted = await tx.orm.public.EmailVerificationTokens
                .where((r) => r.id.eq(record.id))
                .deleteAll();

            if (deleted.length === 0) {
                return false;
            }

            const modelName = getUserModel(record.userType);
            if (!modelName || !tx.orm.public[modelName]) {
                return false;
            }

            // Update email verification status
            const updateResult = await tx.orm.public[modelName]
                .where((r) => r.id.eq(record.userId))
                .update({
                    isEmailVerified: true,
                    updatedAt: toPlainDateTime(new Date())
                });

            // Remove any other verification links for this account
            await tx.orm.public.EmailVerificationTokens
                .where((r) => r.userId.eq(record.userId))
                .deleteAll();

            return Boolean(updateResult);
        });

        if (!verified) {
            return res.status(400).send(resultPage(INVALID_LINK));
        }

        return res.redirect(303, `${FRONTEND_URL}/login?verified=true`);

    } catch (error) {
        console.error("Email verification error:", error);

        return res.status(500).send(resultPage({
            title: "Something went wrong",
            message: "Please try again in a moment.",
            error: true
        }));
    }
};

module.exports = {
    showVerifyEmail,
    verifyEmail
};
