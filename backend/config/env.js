require("dotenv").config();

// Fail fast on a missing or weak JWT secret: anyone who knows it can
// sign their own tokens for any user or admin.
const JWT_SECRET = process.env.JWT_SECRET || "";

if (JWT_SECRET.length < 32) {
    throw new Error(
        "JWT_SECRET must be set to a random value of at least 32 characters. " +
        "Generate one with: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
    );
}

const PORT = Number(process.env.PORT) || 5001;

const stripSlash = (url) => url.replace(/\/+$/, "");

const FRONTEND_URL = stripSlash(
    process.env.FRONTEND_URL || "http://localhost:10300"
);

const BACKEND_URL = stripSlash(
    process.env.BACKEND_URL || `http://localhost:${PORT}`
);

// Origins allowed to call the API from a browser (comma separated)
const CORS_ORIGINS = (process.env.CORS_ORIGINS || FRONTEND_URL)
    .split(",")
    .map((origin) => stripSlash(origin.trim()))
    .filter(Boolean);

// Number of reverse proxies in front of the app (0 = none).
// Needed so rate limiting sees the real client IP.
const TRUST_PROXY = Number(process.env.TRUST_PROXY) || 0;

// Session cookie. Secure (HTTPS only) whenever the API is served over
// HTTPS. SameSite=Lax works when the frontend and API share a site
// (localhost:10300 + localhost:5001, or app.example.com + api.example.com).
const COOKIE_SECURE = process.env.COOKIE_SECURE
    ? process.env.COOKIE_SECURE === "true"
    : BACKEND_URL.startsWith("https://");

const COOKIE_SAMESITE = process.env.COOKIE_SAMESITE || "lax";

// e.g. ".example.com" to share the cookie between subdomains (optional)
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;

module.exports = {
    JWT_SECRET,
    COOKIE_SECURE,
    COOKIE_SAMESITE,
    COOKIE_DOMAIN,
    PORT,
    FRONTEND_URL,
    BACKEND_URL,
    CORS_ORIGINS,
    TRUST_PROXY
};
