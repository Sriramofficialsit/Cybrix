// Certification tracks: the single source of truth for what each
// certificate requires. Every requirement points at real progress the
// backend already tracks (learn-path topics in MongoDB, lab completions in
// PostgreSQL), so a certificate can only be claimed once the work is done.
//
// Requirement types:
//   { type: "module", course: "networking", module: 3 }   every topic of a learn-path module
//   { type: "lab", slug: "nexacorp-passive" }             a hands-on lab, completed (flag accepted)
//   { type: "track", code: "CCSF" }                       another certificate already issued
//
// A track with status "coming_soon" has no content yet: it is listed but
// can't be started or claimed.

const { findCourse } = require("../learn/curriculum");
const { findLab } = require("../labs");

const networkingModules = (from, to) =>
    Array.from({ length: to - from + 1 }, (_, i) => ({ type: "module", course: "networking", module: from + i }));

const TRACKS = [
    {
        code: "CCSF",
        title: "Certified Security Foundations",
        level: "Beginner",
        status: "available",
        summary: "Networking fundamentals from first principles, then real passive reconnaissance against a simulated target.",
        requirements: [
            ...networkingModules(1, 5),
            { type: "lab", slug: "nexacorp-passive" }
        ]
    },
    {
        code: "CCNSE",
        title: "Certified Network Security Expert",
        level: "Advanced",
        status: "available",
        summary: "The complete networking course plus passive and active reconnaissance labs, building on CCSF.",
        requirements: [
            { type: "track", code: "CCSF" },
            ...networkingModules(6, 9),
            { type: "lab", slug: "nexacorp-active" }
        ]
    },
    {
        code: "CWPT",
        title: "Web Penetration Tester",
        level: "Intermediate",
        status: "coming_soon",
        summary: "OWASP Top 10, authentication flaws, IDOR, SSRF and API attacks in guided labs.",
        requirements: []
    },
    {
        code: "CCDO",
        title: "Certified Cyber Defense Operator",
        level: "Intermediate",
        status: "coming_soon",
        summary: "SOC workflows, SIEM triage, detection engineering and incident response.",
        requirements: []
    },
    {
        code: "CMASS",
        title: "Mobile Application Security Specialist",
        level: "Advanced",
        status: "coming_soon",
        summary: "Android and iOS app analysis, insecure storage, and runtime instrumentation.",
        requirements: []
    },
    {
        code: "CASEP",
        title: "API Security & Exploitation Professional",
        level: "Advanced",
        status: "coming_soon",
        summary: "REST and GraphQL attack surface, broken object-level authorization and token abuse.",
        requirements: []
    },
    {
        code: "CETDRS",
        title: "Endpoint Threat Detection & Response",
        level: "Advanced",
        status: "coming_soon",
        summary: "EDR telemetry, threat hunting and endpoint forensics.",
        requirements: []
    }
];

// Fail at startup, not on a learner's request, if a track points at
// content that doesn't exist
const validateTracks = () => {
    const codes = new Set(TRACKS.map((t) => t.code));

    for (const track of TRACKS) {
        if (!/^[A-Z]{3,8}$/.test(track.code)) {
            throw new Error(`Certification ${track.code}: code must be 3-8 capital letters`);
        }

        for (const req of track.requirements) {
            if (req.type === "module") {
                const course = findCourse(req.course);
                if (!course || !course.modules.some((m) => m.num === req.module && m.topics.length)) {
                    throw new Error(`Certification ${track.code}: unknown module ${req.course}/${req.module}`);
                }
            } else if (req.type === "lab") {
                if (!findLab(req.slug)) {
                    throw new Error(`Certification ${track.code}: unknown lab ${req.slug}`);
                }
            } else if (req.type === "track") {
                if (!codes.has(req.code) || req.code === track.code) {
                    throw new Error(`Certification ${track.code}: unknown prerequisite ${req.code}`);
                }
            } else {
                throw new Error(`Certification ${track.code}: unknown requirement type ${req.type}`);
            }
        }
    }
};

validateTracks();

const findTrack = (code) => TRACKS.find((t) => t.code === String(code || "").toUpperCase()) || null;

module.exports = {
    TRACKS,
    findTrack
};
