const crypto = require("crypto");

const generateVerificationToken = () => {
    return crypto.randomBytes(32).toString("hex");
};

// 6-digit login code
const generateOtp = () => {
    return crypto.randomInt(100000, 1000000).toString();
};

// Tokens and OTPs are stored as SHA-256 hashes, so someone who can read
// the database cannot use them. Random 256-bit tokens don't need a slow hash.
const hashToken = (token) => {
    return crypto
        .createHash("sha256")
        .update(String(token))
        .digest("hex");
};

// Constant-time comparison of two hex hashes
const safeEqual = (a, b) => {
    const bufA = Buffer.from(String(a));
    const bufB = Buffer.from(String(b));

    return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
};

module.exports = {
    generateVerificationToken,
    generateOtp,
    hashToken,
    safeEqual
};
