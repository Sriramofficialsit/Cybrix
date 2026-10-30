const pool = require("../../config/db");
const {
    sendInBackground,
    sendAdminVerificationEmail
} = require("../../services/emailService");
const {
    generateVerificationToken,
    hashToken
} = require("../../utils/tokenUtils");
const {
    isNonEmptyString,
    normalizeEmail
} = require("../../utils/validation");

// Same answer whether or not the email belongs to an admin
const GENERIC_RESPONSE = {
    message: "If this is an unverified admin email, a verification link has been sent"
};

const sendAdminVerification = async (req, res) => {
    try {
        const { email } = req.body || {};

        // Check email
        if (!isNonEmptyString(email)) {
            return res.status(400).json({
                message: "Email is required"
            });
        }

        // Find admin
        const result = await pool.query(
            `SELECT id, name, email, is_email_verified
             FROM admins
             WHERE LOWER(email) = $1`,
            [normalizeEmail(email)]
        );

        const admin = result.rows[0];

        if (!admin || admin.is_email_verified) {
            return res.status(200).json(GENERIC_RESPONSE);
        }

        const verificationToken = generateVerificationToken();

        // Replace old tokens, unless one was sent in the last 60 seconds
        const inserted = await pool.query(
            `WITH recent AS (
                 SELECT 1
                 FROM admin_email_verification_tokens
                 WHERE admin_id = $1
                   AND created_at > NOW() - INTERVAL '60 seconds'
             ),
             removed AS (
                 DELETE FROM admin_email_verification_tokens
                 WHERE admin_id = $1
                   AND NOT EXISTS (SELECT 1 FROM recent)
             )
             INSERT INTO admin_email_verification_tokens
             (admin_id, token, expires_at)
             SELECT $1, $2, NOW() + INTERVAL '30 minutes'
             WHERE NOT EXISTS (SELECT 1 FROM recent)
             RETURNING id`,
            [admin.id, hashToken(verificationToken)]
        );

        if (inserted.rows.length > 0) {
            sendInBackground("admin verification", () =>
                sendAdminVerificationEmail(admin.email, admin.name, verificationToken)
            );
        }

        return res.status(200).json(GENERIC_RESPONSE);

    } catch (error) {
        console.error("Admin send verification error:", error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    sendAdminVerification
};
