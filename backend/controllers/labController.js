const { LABS, findLab } = require("../labs");
const progress = require("../services/labProgressService");

// Only revealed hints carry their text
const hintsFor = (metadata, row) => {
    const revealed = row ? row.hints_revealed : 0;
    return metadata.hints.map((hint, i) => ({
        cost: hint.cost,
        text: i < revealed ? hint.text : null
    }));
};

const labSummary = (lab) => ({
    slug: lab.slug,
    title: lab.metadata.title,
    topic: lab.metadata.topic,
    difficulty: lab.metadata.difficulty,
    points: lab.metadata.points,
    hintCount: lab.metadata.hints.length
});

// Resolves :slug to a lab (req.lab) or 404s
const loadLab = (req, res, next) => {
    const lab = findLab(req.params.slug);

    if (!lab) {
        return res.status(404).json({ message: "Lab not found" });
    }

    req.lab = lab;
    next();
};

// GET /api/labs - every lab with the learner's progress (null = not started)
const listLabs = async (req, res) => {
    const rows = await progress.listProgress(req.user);
    const bySlug = Object.fromEntries(rows.map((row) => [row.lab_slug, row]));

    res.json({
        labs: LABS.map((lab) => ({
            ...labSummary(lab),
            progress: progress.toPublic(bySlug[lab.slug])
        }))
    });
};

// GET /api/labs/:slug/meta - opening a lab starts it
const getMeta = async (req, res) => {
    const { metadata } = req.lab;
    const row = await progress.startLab(req.user, req.lab.slug);

    res.json({
        ...labSummary(req.lab),
        companion_lab: metadata.companion_lab,
        hints: hintsFor(metadata, row),
        progress: progress.toPublic(row)
    });
};

// POST /api/labs/:slug/hints/:index - reveal the next hint (costs points)
const revealHint = async (req, res) => {
    const { metadata } = req.lab;
    const index = Number(req.params.index);

    if (!Number.isInteger(index) || index < 0 || index >= metadata.hints.length) {
        return res.status(400).json({ message: "Invalid hint" });
    }

    const row = await progress.revealHint(req.user, req.lab.slug, index, metadata.hints[index].cost);

    if (row.hints_revealed <= index) {
        return res.status(409).json({ message: "Reveal the earlier hints first" });
    }

    res.json({ hints: hintsFor(metadata, row), progress: progress.toPublic(row) });
};

// POST /api/labs/:slug/submit { answer }
const submitFlag = async (req, res) => {
    const { metadata } = req.lab;
    const answer = String((req.body && req.body.answer) || "").trim();

    if (!answer) {
        return res.status(400).json({ message: "Enter a flag" });
    }

    const correct = answer === metadata.flag;
    const row = await progress.recordSubmission(req.user, req.lab.slug, correct, metadata.points);

    res.json({
        correct,
        message: correct ? undefined : metadata.wrong_answer_message || "Not the flag yet.",
        progress: progress.toPublic(row)
    });
};

// POST /api/labs/:slug/reset - sign out of the simulated services.
// Completion, score and hints are kept.
const resetLab = async (req, res) => {
    await progress.clearState(req.user, req.lab.slug);
    res.json({ ok: true });
};

module.exports = {
    loadLab,
    listLabs,
    getMeta,
    revealHint,
    submitFlag,
    resetLab
};
