const { FRONTEND_URL } = require("../config/env");
const { findTrack } = require("../certifications/tracks");
const certificates = require("../services/certificateService");
const { renderCertificatePdf } = require("../utils/certificatePdf");

const sendError = (res, error) => {
    if (error instanceof certificates.CertificateError) {
        return res.status(error.status).json({ message: error.message });
    }
    throw error;
};

const verifyUrlFor = (serial) => `${FRONTEND_URL}/verify?serial=${encodeURIComponent(serial)}`;

// Resolves :code to req.track or 404s
const loadTrack = (req, res, next) => {
    const track = findTrack(req.params.code);

    if (!track) {
        return res.status(404).json({ message: "Certification not found" });
    }

    req.track = track;
    next();
};

// GET /api/certificates - every track with the learner's progress
const getOverview = async (req, res) => {
    res.json(await certificates.getOverview(req.user));
};

// POST /api/certificates/tracks/:code/claim  { name? }
const claimCertificate = async (req, res) => {
    const name = req.body && req.body.name ? req.body.name : null;

    try {
        const result = await certificates.claim(req.user, req.track, name);
        res.status(result.created ? 201 : 200).json(result);
    } catch (error) {
        sendError(res, error);
    }
};

// GET /api/certificates/:serial/pdf - the owner's certificate as a PDF
const downloadPdf = async (req, res) => {
    const cert = await certificates.findOwned(req.user, req.params.serial);

    if (!cert) {
        return res.status(404).json({ message: "Certificate not found" });
    }

    if (cert.status !== "valid") {
        return res.status(410).json({ message: "This certificate was revoked" });
    }

    // Shown on the PDF without the scheme, e.g. cyberthulir.com/verify
    const shownUrl = `${FRONTEND_URL.replace(/^https?:\/\//, "")}/verify`;
    const pdf = renderCertificatePdf(cert, shownUrl);

    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="CyberThulir-${cert.serial}.pdf"`,
        "Content-Length": pdf.length,
        "Cache-Control": "private, no-store"
    });
    res.send(pdf);
};

// GET /api/certificates/verify/:serial - public, no sign-in
const verifyCertificate = async (req, res) => {
    const serial = certificates.normalizeSerial(req.params.serial);

    if (!certificates.isValidSerial(serial)) {
        return res.status(400).json({ message: "That doesn't look like a certificate serial (e.g. CCSF-4KQ2-8XF1-9MT3)" });
    }

    const certificate = await certificates.verify(serial);

    if (!certificate) {
        return res.status(404).json({ message: "No certificate with this serial was issued by CyberThulir" });
    }

    res.set("Cache-Control", "no-store");
    res.json({ certificate, verifyUrl: verifyUrlFor(certificate.serial) });
};

module.exports = {
    loadTrack,
    getOverview,
    claimCertificate,
    downloadPdf,
    verifyCertificate
};
