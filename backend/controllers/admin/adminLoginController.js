const bcrypt = require("bcryptjs");
const pool = require("../../config/db");
const { sendInBackground, sendLoginOtpEmail } = require("../../services/emailService");
const { createLoginChallenge } = require("../../services/loginOtpService");
const { isNonEmptyString } = require("../../utils/validation");

// See loginController.js: keeps unknown admins as slow as wrong passwords
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", 10);

const adminLogin = async (req, res) => {
    try {
        const { emailOrUsername, password } = req.body || {};

        if (!isNonEmptyString(emailOrUsername) || !isNonEmptyString(password)) {
            return res.status(400).json({
                message: "Email/username and password are required"
            });
        }

        // Find admin using email or username (case-insensitive)
        const result = await pool.query(
            `SELECT id, name, email, password_hash, is_email_verified
             FROM admins
             WHERE LOWER(email) = $1
                OR LOWER(username) = $1`,
            [emailOrUsername.trim().toLowerCase()]
        );

        const admin = result.rows[0];

        // Check password
        const isPasswordCorrect = await bcrypt.compare(
            password,
            admin ? admin.password_hash : DUMMY_HASH
        );

        if (!admin || !isPasswordCorrect) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // Check email verification
        if (!admin.is_email_verified) {
            return res.status(403).json({
                message: "Please verify your email before logging in"
            });
        }

        const { loginToken, otp } = await createLoginChallenge(admin.id, "admin");

        // Send OTP to registered admin email
        sendInBackground("admin login OTP", () =>
            sendLoginOtpEmail(admin.email, admin.name, otp)
        );

        return res.status(200).json({
            message: "OTP sent to your registered email",
            loginToken
        });

    } catch (error) {
        console.error("Admin login error:", error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    adminLogin
};
