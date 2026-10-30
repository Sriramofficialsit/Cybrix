const { db } = require("../prisma/db.mjs");
const { verifyToken } = require("../utils/jwt");
const { ACCOUNT_MODELS, getUserModel } = require("../services/accountService");
const { CSRF_HEADER, readSessionCookie } = require("../utils/sessionCookie");

// Minimal Temporal polyfill for Node.js runtime when using @prisma/orm-postgres
// timestamp-temporal and timestamptz-temporal codecs
if (typeof Temporal === "undefined") {
    globalThis.Temporal = {
        PlainDateTime: {
            from(str) {
                return { toString: () => str, [Symbol.toStringTag]: "Temporal.PlainDateTime" };
            }
        },
        Instant: {
            from(str) {
                return { toString: () => str, [Symbol.toStringTag]: "Temporal.Instant" };
            }
        }
    };
}

const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];

const bearerToken = (req) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
    }

    return authHeader.slice(7).trim() || null;
};

// Returns the decoded token if it is valid AND still matches the account
// in the database, otherwise null. The DB check is what makes logout,
// password change/reset and suspension take effect immediately.
//
// The browser app sends the session as an httpOnly cookie; API clients
// may still send "Authorization: Bearer <token>".
const authenticate = async (req) => {
    let token = bearerToken(req);

    if (!token) {
        token = readSessionCookie(req);

        // Browsers attach cookies to cross-site requests too, so a
        // cookie alone is not enough for anything that changes data
        if (token && !SAFE_METHODS.includes(req.method) && req.headers[CSRF_HEADER] !== "1") {
            return null;
        }
    }

    if (!token) {
        return null;
    }

    let decoded;

    try {
        decoded = verifyToken(token);
    } catch {
        return null;
    }

    const modelName = ACCOUNT_MODELS[decoded.accountType] || getUserModel(decoded.accountType);

    if (!decoded.userId || !modelName || !db.orm.public[modelName] || !Number.isInteger(decoded.tv)) {
        return null;
    }

    const account = await db.orm.public[modelName]
        .where((r) => r.id.eq(decoded.userId))
        .select("tokenVersion", "currentStatus", "isEmailVerified")
        .first();

    if (!account) {
        return null;
    }

    const tokenVersion = account.tokenVersion ?? account.token_version;
    const currentStatus = account.currentStatus ?? account.current_status;
    const isEmailVerified = account.isEmailVerified ?? account.is_email_verified;

    if (
        tokenVersion !== decoded.tv ||
        currentStatus !== "active" ||
        !isEmailVerified
    ) {
        return null;
    }

    return decoded;
};

const protect = async (req, res, next) => {
    try {
        const decoded = await authenticate(req);

        if (!decoded) {
            return res.status(401).json({
                message: "Invalid or expired token"
            });
        }

        req.user = decoded;

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    protect,
    authenticate
};
