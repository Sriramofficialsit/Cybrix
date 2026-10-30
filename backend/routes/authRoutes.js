const express = require("express");

const router = express.Router();

const { signup } = require("../controllers/auth/signupController");
const { login } = require("../controllers/auth/loginController");
const { showVerifyEmail, verifyEmail } = require("../controllers/auth/verifyEmailController");
const { forgotPassword } = require("../controllers/auth/forgotpass");
const { resetPassword } = require("../controllers/auth/resetPassword");
const { logout } = require("../controllers/auth/logoutController");
const { verifyLoginOtp } = require("../controllers/auth/verifyLoginOtpController");
const { resendLoginOtp } = require("../controllers/auth/resendLoginOtpController");

const {
    authLimiter,
    loginIpLimiter,
    loginAccountLimiter,
    otpLimiter,
    emailIpLimiter,
    emailTargetLimiter,
    linkLimiter
} = require("../Middleware/rateLimiters");

router.use(authLimiter);

router.post("/signup", emailIpLimiter, emailTargetLimiter("email"), signup);
router.post("/login", loginIpLimiter, loginAccountLimiter, login);
router.get("/verify-email", linkLimiter, showVerifyEmail);
router.post("/verify-email", linkLimiter, verifyEmail);
router.post("/forgot-password", emailIpLimiter, emailTargetLimiter("email"), forgotPassword);
router.post("/reset-password", linkLimiter, resetPassword);
router.post("/logout", logout);
router.post("/verify-login-otp", otpLimiter, verifyLoginOtp);
router.post("/resend-login-otp", emailIpLimiter, emailTargetLimiter("loginToken"), resendLoginOtp);

module.exports = router;
