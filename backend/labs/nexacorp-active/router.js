// NexaCorp active recon lab (port scan + banner grab -> SSH). Ported from
// the standalone lab-nexacorp-active Express app. The target is simulated:
// TEST-NET-1 IP and a .test hostname, nothing leaves the server.
//
// Meta, hints, flag submission and reset are shared by every lab (see
// controllers/labController.js); the simulated SSH login is saved in the
// learner's lab progress state.

const express = require("express");
const progress = require("../../services/labProgressService");
const { TARGET_HOST, TARGET_IP, PORT_MAP, SSH_CREDS, SSH_FILES } = require("./mockHost");

const SLUG = "nexacorp-active";

const router = express.Router();

router.get("/target", (req, res) => {
    res.json({ host: TARGET_HOST, ip: TARGET_IP });
});

// ---------- port scanner ----------
// start/end (inclusive), or preset=common for 1-1024
router.get("/scan", (req, res) => {
    let start = parseInt(req.query.start, 10);
    let end = parseInt(req.query.end, 10);

    if (req.query.preset === "common") {
        start = 1;
        end = 1024;
    }

    if (!Number.isFinite(start) || !Number.isFinite(end) || start < 1 || end > 65535 || start > end) {
        return res.status(400).json({ message: "Invalid port range. Use 1-65535, start <= end." });
    }

    // Ports with no entry are omitted (filtered/no response), like a real
    // scan report that only lists ports that answered
    const results = Object.keys(PORT_MAP)
        .map(Number)
        .filter((port) => port >= start && port <= end)
        .sort((a, b) => a - b)
        .map((port) => {
            const entry = PORT_MAP[port];
            return { port, status: entry.status, service: entry.status === "open" ? entry.service : undefined };
        });

    res.json({ scanned: { start, end }, results });
});

// ---------- banner grabber ----------
router.get("/connect", (req, res) => {
    const port = parseInt(req.query.port, 10);

    if (!Number.isFinite(port) || port < 1 || port > 65535) {
        return res.status(400).json({ message: "Invalid port." });
    }

    const entry = PORT_MAP[port];

    if (!entry || entry.status !== "open") {
        return res.json({ connected: false, message: `Connection to port ${port} refused or timed out.` });
    }

    res.json({ connected: true, service: entry.service, banner: entry.banner, sshLogin: port === 22 });
});

// ---------- SSH (port 22 only) ----------
router.post("/ssh/login", async (req, res) => {
    const { username, password } = req.body || {};

    if (username === SSH_CREDS.username && password === SSH_CREDS.password) {
        await progress.mergeState(req.user, SLUG, { ssh: true });
        return res.json({ ok: true, files: Object.keys(SSH_FILES) });
    }

    res.json({ ok: false, message: "Permission denied (password)." });
});

router.get("/ssh/cat", async (req, res) => {
    const state = await progress.getState(req.user, SLUG);

    if (!state.ssh) {
        return res.status(401).json({ message: "Not authenticated." });
    }

    const name = String(req.query.file || "");

    if (!Object.hasOwn(SSH_FILES, name)) {
        return res.status(404).json({ message: `cat: ${name}: No such file or directory` });
    }

    res.json({ file: name, content: SSH_FILES[name] });
});

module.exports = router;
