const pool = require("../../config/db");
const { signToken } = require("../../utils/jwt");
const { verifyLoginChallenge } = require("../../services/loginOtpService");
const { isNonEmptyString } = require("../../utils/validation");

const verifyAdminLoginOtp = async (req, res) => {
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

        const result = await verifyLoginChallenge(loginToken, otp, "admin");

        if (!result.ok) {
            return res.status(result.status).json({
                message: result.message,
                attemptsLeft: result.attemptsLeft
            });
        }

        // Re-check the admin now
        const adminResult = await pool.query(
            `SELECT id, name, username, email, admin_role,
                    is_email_verified, token_version
             FROM admins
             WHERE id = $1`,
            [result.accountId]
        );

        const admin = adminResult.rows[0];

        if (!admin || !admin.is_email_verified) {
            return res.status(403).json({
                message: "Admin account is not active"
            });
        }

        // Generate JWT using actual role from database
        const token = signToken({
            adminId: admin.id,
            adminRole: admin.admin_role,
            tv: admin.token_version
        });

        return res.status(200).json({
            message: "Admin login successful",
            token: token,
            admin: {
                id: admin.id,
                name: admin.name,
                username: admin.username,
                email: admin.email,
                adminRole: admin.admin_role
            }
        });

    } catch (error) {
        console.error("Verify admin OTP error:", error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    verifyAdminLoginOtp
};
