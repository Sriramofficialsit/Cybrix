const community = require("../../services/communityService");
const certificates = require("../../services/certificateService");

// Community moderation and certificate revocation for signed-in admins
// (adminProtect sets req.admin)

const sendError = (res, error) => {
    if (error instanceof community.CommunityError || error instanceof certificates.CertificateError) {
        return res.status(error.status).json({ message: error.message });
    }
    throw error;
};

const action = (req) => String((req.body && req.body.action) || "").toLowerCase();

// GET /api/admin/community/queue - reported posts and comments
const getModerationQueue = async (req, res) => {
    res.json({ items: await community.moderationQueue() });
};

// POST /api/admin/community/posts/:id/moderate { action: remove|restore|dismiss|pin|unpin }
const moderatePost = async (req, res) => {
    try {
        res.json(await community.moderatePost(req.admin.adminId, req.params.id, action(req)));
    } catch (error) {
        sendError(res, error);
    }
};

// POST /api/admin/community/comments/:id/moderate { action: remove|restore|dismiss }
const moderateComment = async (req, res) => {
    try {
        res.json(await community.moderateComment(req.admin.adminId, req.params.id, action(req)));
    } catch (error) {
        sendError(res, error);
    }
};

// POST /api/admin/community/announcements { title, body, tags, pinned: "true"? }
// Posted as "CyberThulir Team"
const createAnnouncement = async (req, res) => {
    try {
        const post = await community.createPost(
            { isAdmin: true, adminId: req.admin.adminId },
            { ...(req.body || {}), kind: "announcement" }
        );
        res.status(201).json({ post });
    } catch (error) {
        sendError(res, error);
    }
};

// GET /api/admin/certificates?status=&track=&q=&page=
const listCertificates = async (req, res) => {
    res.json(await certificates.adminList(req.query));
};

// POST /api/admin/certificates/:serial/revoke { reason }
const revokeCertificate = async (req, res) => {
    const reason = String((req.body && req.body.reason) || "").trim();

    if (reason.length < 5 || reason.length > 300) {
        return res.status(400).json({ message: "Give a reason for revoking (5–300 characters)" });
    }

    const certificate = await certificates.setStatus(req.params.serial, "revoked", { adminId: req.admin.adminId, reason });

    if (!certificate) {
        return res.status(404).json({ message: "Certificate not found" });
    }

    res.json({ certificate });
};

// POST /api/admin/certificates/:serial/reinstate
const reinstateCertificate = async (req, res) => {
    const certificate = await certificates.setStatus(req.params.serial, "valid", { adminId: req.admin.adminId });

    if (!certificate) {
        return res.status(404).json({ message: "Certificate not found" });
    }

    res.json({ certificate });
};

module.exports = {
    getModerationQueue,
    moderatePost,
    moderateComment,
    createAnnouncement,
    listCertificates,
    revokeCertificate,
    reinstateCertificate
};
