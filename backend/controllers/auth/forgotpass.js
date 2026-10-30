const { db } = require("../../prisma/db.mjs");

const {
    generateVerificationToken,
    hashToken
} = require("../../utils/tokenUtils");
const { toMillis } = require("../../utils/dbTime");

const {
    sendInBackground,
    sendPasswordResetEmail
} = require("../../services/emailService");

const {
    findAccountByEmail,
    userTypeOf
} = require("../../services/accountService");

const {
    isNonEmptyString,
    normalizeEmail
} = require("../../utils/validation");

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

const GENERIC_RESPONSE = {
    message: "If the email exists, a password reset link has been sent"
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body || {};

        // Check email
        if (!isNonEmptyString(email)) {
            return res.status(400).json({
                message: "Email is required"
            });
        }

        const user = await findAccountByEmail(normalizeEmail(email));

        // Always return the same response, whether or not the email exists
        if (!user) {
            return res.status(200).json(GENERIC_RESPONSE);
        }

        const resetToken = generateVerificationToken();

        // Replace old reset tokens for this account, unless one was sent
        // in the last 60 seconds (stops inbox flooding)
        const inserted = await db.transaction(async (tx) => {
            const existingTokens = await tx.orm.public.PasswordResetTokens
                .where((r) => r.userId.eq(user.id))
                .all();

            const isRecent = existingTokens.some((t) => {
                if (!t.createdAt) return false;
                const createdMillis = toMillis(t.createdAt);
                return Number.isFinite(createdMillis) && (Date.now() - createdMillis) < 60 * 1000;
            });

            if (isRecent) {
                return false;
            }

            await tx.orm.public.PasswordResetTokens
                .where((r) => r.userId.eq(user.id))
                .deleteAll();

            const expiresAt = toPlainDateTime(new Date(Date.now() + 30 * 60 * 1000));

            await tx.orm.public.PasswordResetTokens.create({
                userId: user.id,
                token: hashToken(resetToken),
                userType: userTypeOf(user),
                expiresAt
            });

            return true;
        });

        // Send after responding, so response time doesn't reveal
        // whether the email exists
        if (inserted) {
            sendInBackground("password reset", () =>
                sendPasswordResetEmail(user.email, user.username, resetToken)
            );
        }

        return res.status(200).json(GENERIC_RESPONSE);

    } catch (error) {
        console.error("Forgot password error:", error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    forgotPassword
};
