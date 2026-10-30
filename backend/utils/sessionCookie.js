const {
    COOKIE_SECURE,
    COOKIE_SAMESITE,
    COOKIE_DOMAIN
} = require("../config/env");

// The login JWT lives in an httpOnly cookie, so page JavaScript (and any
// XSS) can never read it. It is only sent to /api.
const SESSION_COOKIE = "ct_session";

// State-changing requests authenticated by the cookie must carry this
// header. A custom header can't be added cross-origin without a CORS
// preflight, and CORS only allows the frontend, so this blocks CSRF.
const CSRF_HEADER = "x-csrf-protection";

const cookieOptions = {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAMESITE,
    domain: COOKIE_DOMAIN,
    path: "/api"
};

const setSessionCookie = (res, token) => {
    res.cookie(SESSION_COOKIE, token, {
        ...cookieOptions,
        maxAge: 24 * 60 * 60 * 1000 // same as the JWT expiry
    });
};

const clearSessionCookie = (res) => {
    res.clearCookie(SESSION_COOKIE, cookieOptions);
};

const readSessionCookie = (req) => {
    const header = req.headers.cookie;

    if (!header) {
        return null;
    }

    for (const part of header.split(";")) {
        const index = part.indexOf("=");

        if (index > 0 && part.slice(0, index).trim() === SESSION_COOKIE) {
            try {
                return decodeURIComponent(part.slice(index + 1).trim()) || null;
            } catch {
                return null;
            }
        }
    }

    return null;
};

module.exports = {
    CSRF_HEADER,
    setSessionCookie,
    clearSessionCookie,
    readSessionCookie
};
