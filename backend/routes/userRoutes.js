const express = require("express");

const router = express.Router();
const {
    showConfirmEmailChange,
    showReportEmailChange,
    confirmEmailChange,
    reportEmailChange
} = require("../controllers/user/emailChangeController");

const {
    getProfile,
    updateProfile,
    changePassword
} = require("../controllers/user/userController");

const { protect } = require("../Middleware/authMiddleware");
const { linkLimiter, loginIpLimiter } = require("../Middleware/rateLimiters");

router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, loginIpLimiter, changePassword);

// Links from emails: GET shows a confirm button, POST does the change
router.get("/email-change/confirm", linkLimiter, showConfirmEmailChange);
router.post("/email-change/confirm", linkLimiter, confirmEmailChange);
router.get("/email-change/report", linkLimiter, showReportEmailChange);
router.post("/email-change/report", linkLimiter, reportEmailChange);

module.exports = router;
