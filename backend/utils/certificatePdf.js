// Renders a certificate as a one-page landscape A4 PDF, with no extra
// dependencies. It only uses the PDF standard fonts (Helvetica and
// Helvetica-Bold, WinAnsi encoding), so text is limited to Latin-1;
// anything else is replaced with "?" (names are validated to Latin-1
// before a certificate is issued).

const PAGE_W = 842;
const PAGE_H = 595;

// Advance widths (per 1000 units) for ASCII 32..126, from the Adobe AFM files
const HELVETICA = [
    278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278,
    556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556,
    1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778,
    667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556,
    333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556,
    556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584
];

const HELVETICA_BOLD = [
    278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278,
    556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611,
    975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778,
    667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556,
    333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611,
    611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584
];

const FONTS = {
    regular: { ref: "F1", widths: HELVETICA, fallback: 556 },
    bold: { ref: "F2", widths: HELVETICA_BOLD, fallback: 611 }
};

// Keep Latin-1 only; WinAnsi maps those code points 1:1 for letters
const toLatin1 = (text) => String(text).replace(/[^\x20-\x7e\xa0-\xff]/g, "?");

const textWidth = (text, font, size) => {
    let units = 0;

    for (const ch of toLatin1(text)) {
        const code = ch.charCodeAt(0);
        units += code >= 32 && code <= 126 ? font.widths[code - 32] : font.fallback;
    }

    return (units * size) / 1000;
};

const escapePdf = (text) => toLatin1(text).replace(/[\\()]/g, (c) => `\\${c}`);

const rgb = (hex) =>
    [1, 3, 5].map((i) => (parseInt(hex.slice(i, i + 2), 16) / 255).toFixed(3)).join(" ");

class Canvas {
    constructor() {
        this.ops = [];
    }

    // Shrinks the font until the text fits maxWidth
    text(value, { x, y, size, font = "regular", color = "#1c1030", align = "left", maxWidth = null, spacing = 0 }) {
        const f = FONTS[font];
        let s = size;
        const extra = (len) => spacing * Math.max(len - 1, 0);
        const width = () => textWidth(value, f, s) + extra(toLatin1(value).length);

        while (maxWidth && width() > maxWidth && s > 6) {
            s -= 0.5;
        }

        const w = width();
        const left = align === "center" ? x - w / 2 : align === "right" ? x - w : x;

        this.ops.push(
            `BT /${f.ref} ${s} Tf ${spacing} Tc ${rgb(color)} rg ${left.toFixed(2)} ${y.toFixed(2)} Td (${escapePdf(value)}) Tj ET`
        );
    }

    rect(x, y, w, h, { fill = null, stroke = null, lineWidth = 1 } = {}) {
        const paint = fill && stroke ? "B" : fill ? "f" : "S";
        this.ops.push(
            [
                fill ? `${rgb(fill)} rg` : "",
                stroke ? `${rgb(stroke)} RG ${lineWidth} w` : "",
                `${x} ${y} ${w} ${h} re ${paint}`
            ].filter(Boolean).join(" ")
        );
    }

    line(x1, y1, x2, y2, { color = "#7c3aed", lineWidth = 1 } = {}) {
        this.ops.push(`${rgb(color)} RG ${lineWidth} w ${x1} ${y1} m ${x2} ${y2} l S`);
    }

    toString() {
        return this.ops.join("\n");
    }
}

const buildPdf = (content, title) => {
    const objects = [
        "<< /Type /Catalog /Pages 2 0 R >>",
        "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
            "/Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
        `<< /Length ${Buffer.byteLength(content, "latin1")} >>\nstream\n${content}\nendstream`,
        `<< /Title (${escapePdf(title)}) /Producer (CyberThulir) >>`
    ];

    let out = "%PDF-1.4\n%\xe2\xe3\xcf\xd3\n";
    const offsets = [];

    objects.forEach((body, i) => {
        offsets.push(Buffer.byteLength(out, "latin1"));
        out += `${i + 1} 0 obj\n${body}\nendobj\n`;
    });

    const xref = Buffer.byteLength(out, "latin1");
    out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    out += offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
    out += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info ${objects.length} 0 R >>\n`;
    out += `startxref\n${xref}\n%%EOF\n`;

    return Buffer.from(out, "latin1");
};

const formatDate = (date) =>
    new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" });

// cert: { serial, holderName, trackCode, trackTitle, level, issuedAt }
const renderCertificatePdf = (cert, verifyUrl) => {
    const c = new Canvas();
    const cx = PAGE_W / 2;
    const violet = "#7c3aed";
    const ink = "#1c1030";
    const muted = "#6b5f80";

    c.rect(0, 0, PAGE_W, PAGE_H, { fill: "#fbf9ff" });
    c.rect(22, 22, PAGE_W - 44, PAGE_H - 44, { stroke: violet, lineWidth: 2.5 });
    c.rect(30, 30, PAGE_W - 60, PAGE_H - 60, { stroke: "#c4b5fd", lineWidth: 0.8 });
    c.rect(30, PAGE_H - 36, PAGE_W - 60, 6, { fill: violet });

    c.text("CYBERTHULIR", { x: cx, y: 500, size: 15, font: "bold", color: violet, align: "center", spacing: 4 });
    c.text("CERTIFICATE OF ACHIEVEMENT", { x: cx, y: 474, size: 10, color: muted, align: "center", spacing: 2.5 });

    c.text("This certifies that", { x: cx, y: 420, size: 13, color: muted, align: "center" });
    c.text(cert.holderName, { x: cx, y: 374, size: 34, font: "bold", color: ink, align: "center", maxWidth: 680 });
    c.line(cx - 200, 360, cx + 200, 360, { color: "#c4b5fd", lineWidth: 0.8 });

    c.text("has completed every requirement of the certification", { x: cx, y: 326, size: 13, color: muted, align: "center" });
    c.text(cert.trackTitle, { x: cx, y: 286, size: 24, font: "bold", color: violet, align: "center", maxWidth: 700 });
    c.text(`${cert.trackCode}  -  ${cert.level} level`, { x: cx, y: 262, size: 11, color: muted, align: "center", spacing: 1 });

    const cols = [
        { label: "SERIAL", value: cert.serial, x: 150 },
        { label: "ISSUED", value: formatDate(cert.issuedAt), x: cx },
        { label: "VERIFY AT", value: verifyUrl, x: PAGE_W - 150 }
    ];

    for (const col of cols) {
        c.text(col.label, { x: col.x, y: 130, size: 8, color: muted, align: "center", spacing: 1.5 });
        c.text(col.value, { x: col.x, y: 112, size: 11, font: "bold", color: ink, align: "center", maxWidth: 230 });
    }

    c.line(80, 160, PAGE_W - 80, 160, { color: "#e4dcf7", lineWidth: 0.8 });
    c.text("The authenticity of this certificate can be confirmed online using its serial number.", {
        x: cx, y: 62, size: 8.5, color: muted, align: "center"
    });

    return buildPdf(c.toString(), `${cert.trackCode} certificate - ${cert.holderName}`);
};

module.exports = {
    renderCertificatePdf
};
