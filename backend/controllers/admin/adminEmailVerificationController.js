const pool = require("../../config/db");
const { withTransaction } = require("../../config/db");
const { hashToken } = require("../../utils/tokenUtils");
const { confirmPage, resultPage } = require("../../utils/htmlPages");

const INVALID_LINK = {
    title: "Link expired",
    message: "This verification link is invalid or has expired. Ask for a new one.",
    error: true
};

const ERROR_PAGE = {
    title: "Something went wrong",
    message: "Please try again in a moment.",
    error: true
};

// GET from the email: show a confirm button only (see htmlPages.js)
const showVerifyAdminEmail = async (req, res) => {
    try {
        const { token } = req.query;

        const result = token
            ? await pool.query(
                `SELECT 1
                 FROM admin_email_verification_tokens
                 WHERE token = $1
                   AND expires_at > NOW()`,
                [hashToken(token)]
            )
            : { rows: [] };

        if (result.rows.length === 0) {
            return res.status(400).send(resultPage(INVALID_LINK));
        }

        return res.send(confirmPage({
            title: "Verify your admin email",
            message: "Confirm your email address to activate your CyberThulir admin account.",
            action: "/api/admin/verify-email",
            token,
            buttonLabel: "Verify admin email"
        }));

    } catch (error) {
        console.error("Admin email verification error:", error);
        return res.status(500).send(resultPage(ERROR_PAGE));
    }
};

// POST from the confirm button
const verifyAdminEmail = async (req, res) => {
    try {
        const { token } = req.body || {};

        if (!token) {
            return res.status(400).send(resultPage(INVALID_LINK));
        }

        const verified = await withTransaction(async (client) => {
            // Use up the token (single use)
            const result = await client.query(
                `DELETE FROM admin_email_verification_tokens
                 WHERE token = $1
                   AND expires_at > NOW()
                 RETURNING admin_id`,
                [hashToken(token)]
            );

            if (result.rows.length === 0) {
                return false;
            }

            // Verify admin email
            await client.query(
                `UPDATE admins
                 SET is_email_verified = TRUE,
                     updated_at = NOW()
                 WHERE id = $1`,
                [result.rows[0].admin_id]
            );

            return true;
        });

        if (!verified) {
            return res.status(400).send(resultPage(INVALID_LINK));
        }

        return res.send(resultPage({
            title: "Email verified",
            message: "Your admin email is verified. You can now log in."
        }));

    } catch (error) {
        console.error("Admin email verification error:", error);

        return res.status(500).send(resultPage(ERROR_PAGE));
    }
};

module.exports = {
    showVerifyAdminEmail,
    verifyAdminEmail
};
