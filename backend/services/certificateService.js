const crypto = require("crypto");
const { ObjectId } = require("mongodb");

const { getMongo } = require("../config/mongodb");
const { TRACKS, findTrack } = require("../certifications/tracks");
const { findCourse } = require("../learn/curriculum");
const { findLab } = require("../labs");
const learn = require("./learnProgressService");
const labProgress = require("./labProgressService");
const { findDisplayNames } = require("./accountService");

// Issued certificates live in MongoDB next to learn-path progress.
// Progress toward a track is never stored: it is recomputed from the
// learn path and lab completions on every request, so it can't drift.
//
// certificates: {
//   _id, serial: "CCSF-4KQ2-8XF1-9MT3", profileId: "<accountType>:<accountId>",
//   accountId, accountType, trackCode, trackTitle, level, holderName,
//   issuedAt, status: "valid" | "revoked", revokedAt, revokedReason, revokedBy
// }
//
// The title and holder name are copied in at issue time, so a certificate
// reads the same forever even if the track or the account changes later.

const CERTIFICATES = "certificates";
const SERIAL_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // no 0/O, 1/I
const SERIAL_RE = /^[A-Z]{3,8}(-[2-9A-HJ-NP-Z]{4}){3}$/;
// Letters (incl. Latin-1 accents), spaces and . ' - only: the PDF uses
// standard fonts, and a name is not a place for markup
const NAME_RE = /^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ .'-]{1,79}$/;

class CertificateError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

const ensureCertificateIndexes = async () => {
    await getMongo().collection(CERTIFICATES).createIndexes([
        { key: { serial: 1 }, name: "serial_unique", unique: true },
        { key: { profileId: 1, trackCode: 1 }, name: "one_per_track", unique: true },
        { key: { trackCode: 1, issuedAt: -1 }, name: "track_recent" },
        { key: { issuedAt: -1 }, name: "recent" }
    ]);
};

const profileId = (account) => `${account.accountType}:${account.userId}`;

const newSerial = (code) => {
    const bytes = crypto.randomBytes(12);
    const chars = [...bytes].map((b) => SERIAL_ALPHABET[b & 31]).join("");
    return `${code}-${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}`;
};

const normalizeSerial = (value) => String(value || "").trim().toUpperCase();
const isValidSerial = (serial) => SERIAL_RE.test(serial);

// ---------- progress ----------

// Everything the requirement checks need, loaded once per request
const loadEvidence = async (account) => {
    const courses = new Map();

    for (const track of TRACKS) {
        for (const req of track.requirements) {
            if (req.type === "module" && !courses.has(req.course)) {
                courses.set(req.course, null);
            }
        }
    }

    await Promise.all([...courses.keys()].map(async (slug) => {
        courses.set(slug, await learn.completedTopicIds(account, findCourse(slug)));
    }));

    const [labRows, issued] = await Promise.all([
        labProgress.listProgress(account),
        getMongo().collection(CERTIFICATES).find({ profileId: profileId(account) }).toArray()
    ]);

    return {
        topicsDone: courses,
        labsDone: new Set(labRows.filter((r) => r.status === "completed").map((r) => r.labSlug)),
        issued: new Map(issued.map((c) => [c.trackCode, c]))
    };
};

const checkRequirement = (req, evidence) => {
    if (req.type === "module") {
        const course = findCourse(req.course);
        const module = course.modules.find((m) => m.num === req.module);
        const doneSet = evidence.topicsDone.get(req.course);
        const done = module.topics.filter((t) => doneSet.has(t.id)).length;
        const total = module.topics.length;

        return {
            type: "module",
            label: `${course.title} · Module ${module.num}: ${module.title}`,
            detail: `${done} / ${total} topics`,
            fraction: done / total,
            done: done === total,
            href: `/learn/modules/${course.slug}#module-${module.num}`
        };
    }

    if (req.type === "lab") {
        const lab = findLab(req.slug);
        const done = evidence.labsDone.has(req.slug);

        return {
            type: "lab",
            label: `Lab: ${lab.metadata.title}`,
            detail: done ? "Flag accepted" : `${lab.metadata.difficulty} · ${lab.metadata.points} pts`,
            fraction: done ? 1 : 0,
            done,
            href: `/learn/lab-${req.slug}`
        };
    }

    // type === "track"
    const prereq = findTrack(req.code);
    const cert = evidence.issued.get(req.code);
    const done = Boolean(cert && cert.status === "valid");

    return {
        type: "track",
        label: `${prereq.code} certificate: ${prereq.title}`,
        detail: done ? "Issued" : "Not issued yet",
        fraction: done ? 1 : 0,
        done,
        href: null
    };
};

const publicCertificate = (cert) => ({
    serial: cert.serial,
    holderName: cert.holderName,
    trackCode: cert.trackCode,
    trackTitle: cert.trackTitle,
    level: cert.level,
    issuedAt: cert.issuedAt,
    status: cert.status,
    revokedAt: cert.revokedAt || null
});

const trackProgress = (track, evidence) => {
    const base = {
        code: track.code,
        title: track.title,
        level: track.level,
        summary: track.summary
    };

    if (track.status === "coming_soon") {
        return { ...base, state: "coming_soon", pct: 0, requirements: [], certificate: null };
    }

    const requirements = track.requirements.map((req) => checkRequirement(req, evidence));
    const pct = Math.floor(
        (requirements.reduce((sum, r) => sum + r.fraction, 0) / requirements.length) * 100
    );
    const cert = evidence.issued.get(track.code) || null;
    const prereqMissing = requirements.some((r) => r.type === "track" && !r.done);
    const allDone = requirements.every((r) => r.done);

    let state;

    if (cert) {
        state = cert.status === "revoked" ? "revoked" : "issued";
    } else if (allDone) {
        state = "ready";
    } else if (prereqMissing) {
        state = "locked";
    } else {
        state = pct > 0 ? "in_progress" : "not_started";
    }

    return {
        ...base,
        state,
        pct: cert && cert.status === "valid" ? 100 : pct,
        requirements: requirements.map(({ fraction, ...r }) => r),
        certificate: cert ? publicCertificate(cert) : null
    };
};

// GET /api/certificates - every track with the account's progress
const getOverview = async (account) => {
    const evidence = await loadEvidence(account);
    const tracks = TRACKS.map((t) => trackProgress(t, evidence));
    const names = await findDisplayNames([{ accountType: account.accountType, id: account.userId }]);
    const me = names.get(profileId(account));

    return {
        tracks,
        // Suggested name for the claim form
        defaultName: me ? me.fullName || me.username : "",
        counts: {
            issued: tracks.filter((t) => t.state === "issued").length,
            inProgress: tracks.filter((t) => ["in_progress", "ready", "locked"].includes(t.state)).length,
            available: tracks.filter((t) => t.state !== "coming_soon").length
        }
    };
};

// ---------- issuing ----------

const validateHolderName = (value) => {
    const name = String(value || "").trim().replace(/\s+/g, " ");

    if (!NAME_RE.test(name)) {
        throw new CertificateError(
            400,
            "Name on the certificate must be 2–80 characters: letters, spaces, apostrophes, hyphens and dots only"
        );
    }

    return name;
};

// POST /api/certificates/tracks/:code/claim
// Issues the certificate if every requirement is met. Claiming again
// returns the certificate already issued.
const claim = async (account, track, requestedName) => {
    if (track.status === "coming_soon") {
        throw new CertificateError(409, "This certification isn't open yet");
    }

    const evidence = await loadEvidence(account);
    const existing = evidence.issued.get(track.code);

    if (existing) {
        if (existing.status === "revoked") {
            throw new CertificateError(409, "This certificate was revoked. Contact support if you believe this is a mistake");
        }
        return { certificate: publicCertificate(existing), created: false };
    }

    const progress = trackProgress(track, evidence);

    if (progress.state !== "ready") {
        const missing = progress.requirements.filter((r) => !r.done).length;
        throw new CertificateError(409, `Not eligible yet: ${missing} requirement${missing === 1 ? "" : "s"} left`);
    }

    let holderName = requestedName;

    if (!holderName) {
        const names = await findDisplayNames([{ accountType: account.accountType, id: account.userId }]);
        const me = names.get(profileId(account));
        holderName = me ? me.fullName || me.username : "";
    }

    holderName = validateHolderName(holderName);

    const collection = getMongo().collection(CERTIFICATES);

    // Retry on the (astronomically unlikely) serial collision
    for (let attempt = 0; attempt < 5; attempt += 1) {
        const doc = {
            _id: new ObjectId(),
            serial: newSerial(track.code),
            profileId: profileId(account),
            accountId: account.userId,
            accountType: account.accountType,
            trackCode: track.code,
            trackTitle: track.title,
            level: track.level,
            holderName,
            issuedAt: new Date(),
            status: "valid"
        };

        try {
            await collection.insertOne(doc);
            return { certificate: publicCertificate(doc), created: true };
        } catch (error) {
            if (!error || error.code !== 11000) {
                throw error;
            }

            // A parallel claim for the same track won the race
            const raced = await collection.findOne({ profileId: profileId(account), trackCode: track.code });
            if (raced) {
                return { certificate: publicCertificate(raced), created: false };
            }
        }
    }

    throw new Error("Could not allocate a unique certificate serial");
};

// ---------- lookups ----------

const findBySerial = async (serial) => {
    const value = normalizeSerial(serial);
    return isValidSerial(value) ? getMongo().collection(CERTIFICATES).findOne({ serial: value }) : null;
};

// The signed-in account's own certificate (for the PDF download)
const findOwned = async (account, serial) => {
    const cert = await findBySerial(serial);
    return cert && cert.profileId === profileId(account) ? cert : null;
};

// Public verification: only what is printed on the certificate itself
const verify = async (serial) => {
    const cert = await findBySerial(serial);
    return cert ? publicCertificate(cert) : null;
};

// ---------- admin ----------

const PAGE_SIZE = 25;

const adminList = async ({ status, track, q, page }) => {
    const filter = {};

    if (["valid", "revoked"].includes(status)) {
        filter.status = status;
    }

    if (track && findTrack(track)) {
        filter.trackCode = findTrack(track).code;
    }

    if (q) {
        const term = String(q).trim().slice(0, 80);
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        filter.$or = [{ serial: normalizeSerial(term) }, { holderName: { $regex: escaped, $options: "i" } }];
    }

    const pageNum = Math.max(1, Math.min(Number.parseInt(page, 10) || 1, 1000));
    const collection = getMongo().collection(CERTIFICATES);
    const [items, total] = await Promise.all([
        collection.find(filter).sort({ issuedAt: -1 }).skip((pageNum - 1) * PAGE_SIZE).limit(PAGE_SIZE).toArray(),
        collection.countDocuments(filter)
    ]);

    return {
        items: items.map((c) => ({ ...publicCertificate(c), accountType: c.accountType, accountId: c.accountId, revokedReason: c.revokedReason || null })),
        page: pageNum,
        pageSize: PAGE_SIZE,
        total
    };
};

const setStatus = async (serial, status, { adminId, reason }) => {
    const value = normalizeSerial(serial);

    if (!isValidSerial(value)) {
        return null;
    }

    const update = status === "revoked"
        ? { $set: { status, revokedAt: new Date(), revokedReason: reason, revokedBy: adminId } }
        : { $set: { status }, $unset: { revokedAt: "", revokedReason: "", revokedBy: "" } };

    const cert = await getMongo().collection(CERTIFICATES).findOneAndUpdate(
        { serial: value },
        update,
        { returnDocument: "after" }
    );

    return cert ? publicCertificate(cert) : null;
};

module.exports = {
    CertificateError,
    ensureCertificateIndexes,
    getOverview,
    claim,
    findOwned,
    verify,
    validateHolderName,
    adminList,
    setStatus,
    normalizeSerial,
    isValidSerial
};
