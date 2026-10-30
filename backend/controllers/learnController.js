const { findCourse, STAGES } = require("../learn/curriculum");
const learn = require("../services/learnProgressService");

// The browser sends its timezone offset so streak days follow the
// learner's local midnight (query string on GET, body on POST)
const tzOf = (req) => learn.parseTzOffset((req.body && req.body.tz) || (req.query && req.query.tz));

const sendError = (res, error) => {
    if (error instanceof learn.LearnError) {
        return res.status(error.status).json({ message: error.message });
    }
    throw error;
};

// Resolves :course to req.course or 404s
const loadCourse = (req, res, next) => {
    const course = findCourse(req.params.course);

    if (!course) {
        return res.status(404).json({ message: "Course not found" });
    }

    req.course = course;
    next();
};

// GET /api/learn/me - XP, level and streak for the top bar
const getSummary = async (req, res) => {
    res.json({ profile: await learn.getSummary(req.user, tzOf(req)) });
};

// GET /api/learn/courses/:course - the full path with the learner's progress
const getCourse = async (req, res) => {
    res.json(await learn.getCourseProgress(req.user, req.course, tzOf(req)));
};

// POST /api/learn/courses/:course/topics/:topicId/stages/:stage
const completeStage = async (req, res) => {
    const topic = req.course.topicById.get(req.params.topicId);

    if (!topic) {
        return res.status(404).json({ message: "Topic not found" });
    }

    if (!STAGES.includes(req.params.stage)) {
        return res.status(404).json({ message: "Stage not found" });
    }

    try {
        res.json(await learn.completeStage(req.user, req.course, topic, req.params.stage, tzOf(req)));
    } catch (error) {
        sendError(res, error);
    }
};

// POST /api/learn/courses/:course/chests/:chestId
const claimChest = async (req, res) => {
    const chest = req.course.chestById.get(req.params.chestId);

    if (!chest) {
        return res.status(404).json({ message: "Chest not found" });
    }

    try {
        res.json(await learn.claimChest(req.user, req.course, chest, tzOf(req)));
    } catch (error) {
        sendError(res, error);
    }
};

// POST /api/learn/courses/:course/reset - start the course over
const resetCourse = async (req, res) => {
    try {
        res.json(await learn.resetCourse(req.user, req.course, tzOf(req)));
    } catch (error) {
        sendError(res, error);
    }
};

module.exports = {
    loadCourse,
    getSummary,
    getCourse,
    completeStage,
    claimChest,
    resetCourse
};
