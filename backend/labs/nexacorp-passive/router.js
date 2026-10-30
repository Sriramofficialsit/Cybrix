// NexaCorp passive recon lab (OSINT -> access). Ported from the standalone
// lab-nexacorp-passive Express app. All data is fictional: nexacorp.test
// uses the reserved .test TLD and every IP is in TEST-NET-1.
//
// Meta, hints, flag submission and reset are shared by every lab (see
// controllers/labController.js); the simulated Jenkins sign-in is saved in
// the learner's lab progress state.

const express = require("express");
const progress = require("../../services/labProgressService");
const { WHOIS_DB, DNS_ZONES, JOB_POSTINGS, PEOPLE, PASTES, STAGING } = require("./mockData");

const SLUG = "nexacorp-passive";

const router = express.Router();

const normalize = (s) => String(s || "").trim().toLowerCase().replace(/[.\s]+$/, "");
const domainOf = (s) => normalize(s).replace(/^https?:\/\//, "");

// ---------- whois ----------
router.get("/whois", (req, res) => {
    const record = WHOIS_DB[domainOf(req.query.domain)];

    if (!record) {
        return res.json({ found: false, raw: `No match for "${req.query.domain || ""}".` });
    }

    const raw = [
        `Domain Name: ${record.domain}`,
        `Registrar: ${record.registrar}`,
        `Registrant Organization: ${record.registrantOrg}`,
        `Registrant Email: ${record.registrantEmail}`,
        `Creation Date: ${record.createdDate}`,
        `Updated Date: ${record.updatedDate}`,
        `Registry Expiry Date: ${record.expiryDate}`,
        `Domain Status: ${record.status}`,
        ...record.nameServers.map((ns) => `Name Server: ${ns.toUpperCase()}`)
    ].join("\n");

    res.json({ found: true, raw });
});

// ---------- dig / DNS zone ----------
router.get("/dns", (req, res) => {
    const zone = DNS_ZONES[domainOf(req.query.domain)];

    if (!zone) {
        return res.json({
            found: false,
            raw: `;; connection timed out; no servers could be reached for ${req.query.domain || ""}`
        });
    }

    const raw = zone.map((r) => `${r.name.padEnd(26)} IN  ${r.type.padEnd(6)} ${r.value}`).join("\n");
    res.json({ found: true, raw });
});

// ---------- searchable sources ----------
const search = (list, q, fields) => {
    const t = String(q || "").trim().toLowerCase();

    if (!t) {
        return list;
    }

    return list.filter((x) => fields.some((f) => String(x[f] || "").toLowerCase().includes(t)));
};

router.get("/jobs", (req, res) =>
    res.json(search(JOB_POSTINGS, req.query.q, ["company", "title", "location", "body"]))
);

// Contact details only come with a single profile view, not in search results
router.get("/people", (req, res) => {
    const list = search(PEOPLE, req.query.q, ["name", "headline", "company", "location", "about"]);
    res.json(list.map(({ contact, experience, ...p }) => p));
});

router.get("/people/:id", (req, res) => {
    const person = PEOPLE.find((x) => x.id === req.params.id);

    if (!person) {
        return res.status(404).json({ message: "Profile not found" });
    }

    res.json(person);
});

router.get("/pastes", (req, res) =>
    res.json(search(PASTES, req.query.q, ["title", "author"]).map(({ body, ...p }) => p))
);

router.get("/pastes/:id", (req, res) => {
    const paste = PASTES.find((x) => x.id === req.params.id);

    if (!paste) {
        return res.status(404).json({ message: "Paste not found" });
    }

    res.json(paste);
});

// ---------- simulated browser ----------
const HOSTS = {
    "nexacorp.test": { type: "site" },
    "www.nexacorp.test": { type: "site" },
    "mail.nexacorp.test": { type: "login", product: "NexaCorp Webmail", version: "" },
    "vpn.nexacorp.test": { type: "error", code: 403, message: "Access restricted to the corporate network." },
    "ns1.nexacorp.test": { type: "error", code: 0, message: "Connection refused." },
    "ns2.nexacorp.test": { type: "error", code: 0, message: "Connection refused." }
};

const consoleFor = (job, n) => {
    const head = `Started by timer\nRunning as SYSTEM\nBuilding in workspace /var/jenkins/workspace/${job}\n`;

    if (job === "customer-portal-deploy" && n === 214) {
        return head + `[Pipeline] sh\n+ docker build -t portal:214 .\nSuccessfully built 7f3a9c1e2b44\n[Pipeline] withEnv\n+ export DEPLOY_TOKEN=${STAGING.flag}\n+ ./deploy.sh staging\nDeploy complete.\nFinished: SUCCESS`;
    }

    return head + `[Pipeline] sh\n+ ./run.sh ${n}\nDone.\nFinished: ${job === "nightly-cleanup" ? "FAILURE" : "SUCCESS"}`;
};

router.get("/browse", async (req, res) => {
    const host = normalize(req.query.host);
    const path = String(req.query.path || "/").replace(/\/+$/, "") || "/";

    if (host === STAGING.host) {
        const state = await progress.getState(req.user, SLUG);

        if (!state.jenkins) {
            return res.json({ type: "login", product: "Jenkins", version: "2.263.1" });
        }

        if (path === "/") {
            return res.json({
                type: "dashboard",
                jobs: Object.entries(STAGING.jobs).map(([name, j]) => ({ name, status: j.status }))
            });
        }

        let m = path.match(/^\/job\/([\w-]+)$/);

        if (m && STAGING.jobs[m[1]]) {
            return res.json({ type: "job", name: m[1], builds: STAGING.jobs[m[1]].builds });
        }

        m = path.match(/^\/job\/([\w-]+)\/(\d+)\/console$/);

        if (m && STAGING.jobs[m[1]] && STAGING.jobs[m[1]].builds.includes(Number(m[2]))) {
            return res.json({ type: "console", name: m[1], build: Number(m[2]), text: consoleFor(m[1], Number(m[2])) });
        }

        return res.json({ type: "error", code: 404, message: "Not Found" });
    }

    const page = HOSTS[host];

    if (!page) {
        return res.json({ type: "error", code: 0, message: `Server not found: ${req.query.host || ""} could not be resolved.` });
    }

    res.json(page);
});

router.post("/login", async (req, res) => {
    const { host, username, password } = req.body || {};

    if (normalize(host) === STAGING.host && username === STAGING.user && password === STAGING.pass) {
        await progress.mergeState(req.user, SLUG, { jenkins: true });
        return res.json({ ok: true });
    }

    res.json({ ok: false, message: "Invalid username or password." });
});

module.exports = router;
