const express = require("express");

const { protect } = require("../Middleware/authMiddleware");
const { learnWriteLimiter } = require("../Middleware/rateLimiters");
const {
    loadCourse,
    getSummary,
    getCourse,
    completeStage,
    claimChest,
    resetCourse
} = require("../controllers/learnController");

const router = express.Router();

// The learn path tracks progress per account, so it needs a signed-in learner
router.use(protect);

router.get("/me", getSummary);
router.get("/courses/:course", loadCourse, getCourse);
router.post("/courses/:course/topics/:topicId/stages/:stage", loadCourse, learnWriteLimiter, completeStage);
router.post("/courses/:course/chests/:chestId", loadCourse, learnWriteLimiter, claimChest);
router.post("/courses/:course/reset", loadCourse, learnWriteLimiter, resetCourse);

module.exports = router;
