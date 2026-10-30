const express = require("express");

const router = express.Router();

const {adminLogin} = require("../controllers/admin/adminLoginController");

const {sendAdminVerification} = require("../controllers/admin/adminSendVerificationController");

const {showVerifyAdminEmail, verifyAdminEmail} = require("../controllers/admin/adminEmailVerificationController");
const {verifyAdminLoginOtp} = require("../controllers/admin/verifyAdminLoginOtpController");

const { adminProtect } = require("../Middleware/adminAuthMiddleware");
const moderation = require("../controllers/admin/adminModerationController");

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

router.post("/login", loginIpLimiter, loginAccountLimiter, adminLogin);

router.post("/send-verification", emailIpLimiter, emailTargetLimiter("email"), sendAdminVerification);

router.get("/verify-email", linkLimiter, showVerifyAdminEmail);
router.post("/verify-email", linkLimiter, verifyAdminEmail);

router.post("/verify-login-otp", otpLimiter, verifyAdminLoginOtp);

// Community moderation
router.get("/community/queue", adminProtect, moderation.getModerationQueue);
router.post("/community/posts/:id/moderate", adminProtect, moderation.moderatePost);
router.post("/community/comments/:id/moderate", adminProtect, moderation.moderateComment);
router.post("/community/announcements", adminProtect, moderation.createAnnouncement);

// Issued certificates
router.get("/certificates", adminProtect, moderation.listCertificates);
router.post("/certificates/:serial/revoke", adminProtect, moderation.revokeCertificate);
router.post("/certificates/:serial/reinstate", adminProtect, moderation.reinstateCertificate);

module.exports = router;
