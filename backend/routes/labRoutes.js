const express = require("express");

const { protect } = require("../Middleware/authMiddleware");
const { labSubmitLimiter } = require("../Middleware/rateLimiters");
const { LABS } = require("../labs");
const {
    loadLab,
    listLabs,
    getMeta,
    revealHint,
    submitFlag,
    resetLab
} = require("../controllers/labController");

const router = express.Router();

// Labs are for signed-in learners only; progress is saved per account
router.use(protect);

router.get("/", listLabs);
router.get("/:slug/meta", loadLab, getMeta);
router.post("/:slug/hints/:index", loadLab, revealHint);
router.post("/:slug/submit", loadLab, labSubmitLimiter, submitFlag);
router.post("/:slug/reset", loadLab, resetLab);

// Each lab's simulated tools (scanner, whois, browser, ...)
for (const lab of LABS) {
    router.use(`/${lab.slug}`, lab.router);
}

module.exports = router;
