const bcrypt = require("bcryptjs");
const { db } = require("../../prisma/db.mjs");
const {
    sendInBackground,
    sendLoginOtpEmail,
    sendVerificationEmail
} = require("../../services/emailService");
const {
    findAccountByLogin,
    userTypeOf
} = require("../../services/accountService");
const { createLoginChallenge } = require("../../services/loginOtpService");
const {
    generateVerificationToken,
    hashToken
} = require("../../utils/tokenUtils");
const { toMillis } = require("../../utils/dbTime");
const { isNonEmptyString } = require("../../utils/validation");

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

// Compared against when the account doesn't exist, so a wrong username
// takes as long as a wrong password (no timing leak)
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", 10);

const INVALID_LOGIN = "Invalid email or password";

const login = async (req, res) => {
    try {
        const { emailOrUsername, password } = req.body || {};

        // Check required fields
        if (!isNonEmptyString(emailOrUsername) || !isNonEmptyString(password)) {
            return res.status(400).json({
                message: "Email/username and password are required"
            });
        }

        // Email and username are both matched case-insensitively
        const user = await findAccountByLogin(emailOrUsername);

        // Always run bcrypt, even for unknown accounts
        const isPasswordCorrect = await bcrypt.compare(
            password,
            user ? user.password_hash : DUMMY_HASH
        );

        if (!user || !isPasswordCorrect) {
            return res.status(401).json({
                message: INVALID_LOGIN
            });
        }

        // Status is only revealed to someone who knows the password
        if (user.current_status !== "active") {
            return res.status(403).json({
                message: "Your account is not active"
            });
        }

        // Check email verification.
        // Password is already confirmed here, so it is safe to send a
        // fresh verification link (the old one may have expired).
        if (!user.is_email_verified) {
            await resendVerificationLink(user);

            return res.status(403).json({
                code: "EMAIL_NOT_VERIFIED",
                message: "Your email is not verified. We've sent a new verification link to your email. Please check your inbox."
            });
        }

        // Password is correct: start the OTP step. The loginToken ties the
        // OTP to this password check (verify/resend require it).
        const { loginToken, otp } = await createLoginChallenge(user.id, "user");

        // Send OTP to registered email
        sendInBackground("login OTP", () =>
            sendLoginOtpEmail(user.email, user.username, otp)
        );

        // JWT will be generated after OTP verification
        return res.status(200).json({
            message: "OTP sent to your registered email",
            loginToken
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};

const resendVerificationLink = async (user) => {
    // Remove old tokens and store the new one, unless a link was
    // issued in the last 60 seconds
    const verificationToken = generateVerificationToken();

    const inserted = await db.transaction(async (tx) => {
        const existingTokens = await tx.orm.public.EmailVerificationTokens
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

        await tx.orm.public.EmailVerificationTokens
            .where((r) => r.userId.eq(user.id))
            .deleteAll();

        const expiresAt = toPlainDateTime(new Date(Date.now() + 30 * 60 * 1000));

        await tx.orm.public.EmailVerificationTokens.create({
            userId: user.id,
            token: hashToken(verificationToken),
            userType: userTypeOf(user),
            expiresAt
        });

        return true;
    });

    if (inserted) {
        sendInBackground("verification", () =>
            sendVerificationEmail(
                user.email,
                user.full_name || user.fullName || user.username,
                verificationToken
            )
        );
    }
};

module.exports = {
    login
};
