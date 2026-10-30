const bcrypt = require("bcryptjs");
const { db } = require("../../prisma/db.mjs");
const { and } = require("@prisma/orm-postgres/orm-client");
const { getUserModel } = require("../../services/accountService");
const { hashToken } = require("../../utils/tokenUtils");
const { toMillis } = require("../../utils/dbTime");
const {
    isNonEmptyString,
    validatePassword
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

const resetPassword = async (req, res) => {
    try {
        const {
            token,
            newPassword,
            retypePassword
        } = req.body || {};

        // Check required fields
        if (
            !isNonEmptyString(token) ||
            !isNonEmptyString(newPassword) ||
            !isNonEmptyString(retypePassword)
        ) {
            return res.status(400).json({
                message:
                    "Token, new password and retype password are required"
            });
        }

        // Check password rules
        const passwordError = validatePassword(newPassword);

        if (passwordError) {
            return res.status(400).json({
                message: passwordError
            });
        }

        // Check passwords match
        if (newPassword !== retypePassword) {
            return res.status(400).json({
                message: "Passwords do not match"
            });
        }

        // Hash new password (outside the transaction, it's slow)
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const outcome = await db.transaction(async (tx) => {
            const tokenHash = hashToken(token);

            // Find the token
            const record = await tx.orm.public.PasswordResetTokens
                .where((r) => r.token.eq(tokenHash))
                .first();

            if (!record) {
                return { status: 400, message: "Invalid or expired password reset token" };
            }

            const expiresAtMillis = record.expiresAt
                ? toMillis(record.expiresAt)
                : 0;

            if (!Number.isFinite(expiresAtMillis) || expiresAtMillis <= Date.now()) {
                await tx.orm.public.PasswordResetTokens
                    .where((r) => r.id.eq(record.id))
                    .deleteAll();
                return { status: 400, message: "Invalid or expired password reset token" };
            }

            // Use up the token (single use: only the request that deletes the row wins)
            const deleted = await tx.orm.public.PasswordResetTokens
                .where((r) => r.id.eq(record.id))
                .deleteAll();

            if (deleted.length === 0) {
                return { status: 400, message: "Invalid or expired password reset token" };
            }

            const modelName = getUserModel(record.userType);

            if (!modelName || !tx.orm.public[modelName]) {
                return { status: 400, message: "Invalid user type" };
            }

            const user = await tx.orm.public[modelName]
                .where((r) => r.id.eq(record.userId))
                .first();

            if (!user) {
                return { status: 404, message: "User not found" };
            }

            const nextVersion = (user.tokenVersion ?? 0) + 1;

            // Update password and sign out every existing session
            await tx.orm.public[modelName]
                .where((r) => r.id.eq(record.userId))
                .update({
                    passwordHash: hashedPassword,
                    tokenVersion: nextVersion,
                    updatedAt: toPlainDateTime(new Date())
                });

            // Remove any other reset links and pending logins
            await tx.orm.public.PasswordResetTokens
                .where((r) => r.userId.eq(record.userId))
                .deleteAll();

            await tx.orm.public.LoginOtps
                .where((r) => and(r.accountId.eq(record.userId), r.accountType.eq("user")))
                .deleteAll();

            return { status: 200, message: "Password reset successfully" };
        });

        return res.status(outcome.status).json({
            message: outcome.message
        });

    } catch (error) {
        console.error("Reset password error:", error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    resetPassword
};
