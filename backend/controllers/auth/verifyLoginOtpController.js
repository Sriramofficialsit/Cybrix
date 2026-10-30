const { db } = require("../../prisma/db.mjs");
const {
    ACCOUNT_MODELS,
    findAccountById,
    signUserToken,
    publicUser
} = require("../../services/accountService");
const { verifyLoginChallenge } = require("../../services/loginOtpService");
const { isNonEmptyString } = require("../../utils/validation");
const { setSessionCookie } = require("../../utils/sessionCookie");

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

const verifyLoginOtp = async (req, res) => {
    try {
        const { loginToken, otp } = req.body || {};

        if (!isNonEmptyString(loginToken) || !isNonEmptyString(otp)) {
            return res.status(400).json({
                message: "Login session and OTP are required"
            });
        }

        if (!/^\d{6}$/.test(otp)) {
            return res.status(400).json({
                message: "Invalid OTP"
            });
        }

        const result = await verifyLoginChallenge(loginToken, otp, "user");

        if (!result.ok) {
            return res.status(result.status).json({
                message: result.message,
                attemptsLeft: result.attemptsLeft
            });
        }

        // Re-check the account now: it may have been suspended or changed
        // since the password step
        const user = await findAccountById(result.accountId);

        if (!user || user.current_status !== "active") {
            return res.status(403).json({
                message: "Your account is not active"
            });
        }

        if (!user.is_email_verified) {
            return res.status(403).json({
                code: "EMAIL_NOT_VERIFIED",
                message: "Please verify your email before logging in"
            });
        }

        // Update last active time
        const modelName = ACCOUNT_MODELS[user.account_type] || "Users";
        const model = db.orm.public[modelName];
        if (model) {
            await model
                .where((r) => r.id.eq(user.id))
                .update({
                    lastActiveAt: toPlainDateTime(new Date())
                });
        }

        // The JWT goes in an httpOnly cookie, never in the response body,
        // so page JavaScript can't read or leak it
        setSessionCookie(res, signUserToken(user));

        return res.status(200).json({
            message: "Login successful",
            user: publicUser(user)
        });

    } catch (error) {
        console.error("Verify login OTP error:", error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    verifyLoginOtp
};
