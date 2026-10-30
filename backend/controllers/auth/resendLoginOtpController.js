const { sendInBackground, sendLoginOtpEmail } = require("../../services/emailService");
const { findAccountById } = require("../../services/accountService");
const { resendLoginChallenge } = require("../../services/loginOtpService");
const { isNonEmptyString } = require("../../utils/validation");

// Needs the loginToken from a successful password step, not just a
// username, so it can't be used to skip the password or spam any inbox
const resendLoginOtp = async (req, res) => {
    try {
        const { loginToken } = req.body || {};

        // Check required field
        if (!isNonEmptyString(loginToken)) {
            return res.status(400).json({
                message: "Login session is required"
            });
        }

        const result = await resendLoginChallenge(loginToken, "user");

        if (!result.ok) {
            return res.status(result.status).json({
                message: result.message
            });
        }

        const user = await findAccountById(result.accountId);

        if (
            !user ||
            user.current_status !== "active" ||
            !user.is_email_verified
        ) {
            return res.status(403).json({
                message: "Your account is not active"
            });
        }

        // Send new OTP to registered email
        sendInBackground("login OTP", () =>
            sendLoginOtpEmail(user.email, user.username, result.otp)
        );

        return res.status(200).json({
            message: "A new OTP has been sent to your registered email"
        });

    } catch (error) {
        console.error("Resend login OTP error:", error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    resendLoginOtp
};
