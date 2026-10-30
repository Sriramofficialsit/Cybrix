const express = require("express");

const { protect } = require("../Middleware/authMiddleware");
const { certificateClaimLimiter, verifyLimiter } = require("../Middleware/rateLimiters");
const {
    loadTrack,
    getOverview,
    claimCertificate,
    downloadPdf,
    verifyCertificate
} = require("../controllers/certificateController");

const router = express.Router();

// Anyone (an employer, a college) can check a serial without signing in
router.get("/verify/:serial", verifyLimiter, verifyCertificate);

router.get("/", protect, getOverview);
router.post("/tracks/:code/claim", protect, certificateClaimLimiter, loadTrack, claimCertificate);
router.get("/:serial/pdf", protect, downloadPdf);

module.exports = router;
