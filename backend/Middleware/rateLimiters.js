const { rateLimit, ipKeyGenerator } = require("express-rate-limit");

// Counters are kept in memory by default, which is right for a single
// server process. With several instances behind a load balancer, set
// REDIS_URL so all instances share the same counters.
//
// Per-IP limits are deliberately loose: a whole college campus can share
// one IP. The tight limits are per account / per recipient.

const MINUTE = 60 * 1000;

let redisClient = null;

if (process.env.REDIS_URL) {
    const { createClient } = require("redis");

    redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.on("error", (err) => console.error("Redis error:", err.message));
    redisClient.connect().catch((err) =>
        console.error("Redis connection failed:", err.message)
    );
}

// Each limiter needs its own store (and key prefix)
let storeCount = 0;

const makeStore = () => {
    if (!redisClient) {
        return undefined;
    }

    const { RedisStore } = require("rate-limit-redis");

    storeCount += 1;

    return new RedisStore({
        prefix: `rl:${storeCount}:`,
        sendCommand: (...args) => redisClient.sendCommand(args)
    });
};

const limiter = ({ windowMs, limit, message, keyGenerator, skipSuccessfulRequests = false }) =>
    rateLimit({
        windowMs,
        limit,
        standardHeaders: "draft-7",
        legacyHeaders: false,
        skipSuccessfulRequests,
        store: makeStore(),
        ...(keyGenerator ? { keyGenerator } : {}),
        handler: (req, res, next, options) =>
            res.status(options.statusCode).json({ message })
    });

const ipKey = (req) => ipKeyGenerator(req.ip);

// Key on a body field (email, username, login token) so one account
// can't be hammered from many IPs; falls back to the IP.
const bodyFieldKey = (field) => (req) => {
    const value = req.body && req.body[field];

    return typeof value === "string" && value.trim()
        ? `${field}:${value.trim().toLowerCase()}`
        : `ip:${ipKey(req)}`;
};

const TOO_MANY = "Too many requests. Please try again later";

// Every /api/auth and /api/admin route
const authLimiter = limiter({
    windowMs: 15 * MINUTE,
    limit: 300,
    message: TOO_MANY
});

// Password guessing: per IP, and per account (a soft lockout).
// Successful logins don't count.
const loginIpLimiter = limiter({
    windowMs: 15 * MINUTE,
    limit: 50,
    skipSuccessfulRequests: true,
    message: "Too many login attempts. Please try again in 15 minutes"
});

const loginAccountLimiter = limiter({
    windowMs: 15 * MINUTE,
    limit: 10,
    skipSuccessfulRequests: true,
    keyGenerator: bodyFieldKey("emailOrUsername"),
    message: "Too many login attempts for this account. Please try again in 15 minutes"
});

// OTP guessing (each login challenge also allows only 5 tries)
const otpLimiter = limiter({
    windowMs: 15 * MINUTE,
    limit: 50,
    skipSuccessfulRequests: true,
    message: "Too many attempts. Please try again later"
});

// Anything that sends an email: per IP and per recipient
const emailIpLimiter = limiter({
    windowMs: 60 * MINUTE,
    limit: 40,
    message: "Too many emails requested. Please try again later"
});

const emailTargetLimiter = (field) =>
    limiter({
        windowMs: 60 * MINUTE,
        limit: 5,
        keyGenerator: bodyFieldKey(field),
        message: "Too many emails requested. Please try again later"
    });

// Links opened from emails (verify / confirm / report)
const linkLimiter = limiter({
    windowMs: 15 * MINUTE,
    limit: 30,
    message: TOO_MANY
});

// Flag guessing in the hands-on labs, per signed-in account
const labSubmitLimiter = limiter({
    windowMs: 15 * MINUTE,
    limit: 30,
    keyGenerator: (req) =>
        req.user ? `acct:${req.user.accountType}:${req.user.userId}` : `ip:${ipKey(req)}`,
    message: "Too many flag attempts. Please try again in 15 minutes"
});

// Learn-path progress writes (stage completions, chests), per account.
// A learner clicks through a stage every minute or so; this only stops scripts.
const learnWriteLimiter = limiter({
    windowMs: 15 * MINUTE,
    limit: 300,
    keyGenerator: (req) =>
        req.user ? `acct:${req.user.accountType}:${req.user.userId}` : `ip:${ipKey(req)}`,
    message: TOO_MANY
});

const accountKey = (req) =>
    req.user ? `acct:${req.user.accountType}:${req.user.userId}` : `ip:${ipKey(req)}`;

// Claiming a certificate re-checks every requirement; a few tries is plenty
const certificateClaimLimiter = limiter({
    windowMs: 15 * MINUTE,
    limit: 20,
    keyGenerator: accountKey,
    message: TOO_MANY
});

// Public certificate verification (employers, colleges), per IP
const verifyLimiter = limiter({
    windowMs: 15 * MINUTE,
    limit: 120,
    message: TOO_MANY
});

// Community writes, per account: posts and edits, comments, likes, reports
const communityPostLimiter = limiter({
    windowMs: 60 * MINUTE,
    limit: 20,
    keyGenerator: accountKey,
    message: "You're posting too fast. Please wait a while before posting again"
});

const communityCommentLimiter = limiter({
    windowMs: 10 * MINUTE,
    limit: 30,
    keyGenerator: accountKey,
    message: "You're commenting too fast. Please slow down"
});

const communityReactLimiter = limiter({
    windowMs: 5 * MINUTE,
    limit: 120,
    keyGenerator: accountKey,
    message: TOO_MANY
});

const communityReportLimiter = limiter({
    windowMs: 60 * MINUTE,
    limit: 20,
    keyGenerator: accountKey,
    message: TOO_MANY
});

// Chat, per account. Messages: a fast typist, not a script.
const chatMessageLimiter = limiter({
    windowMs: MINUTE,
    limit: 40,
    keyGenerator: accountKey,
    message: "You're sending messages too fast. Slow down a little"
});

const chatActionLimiter = limiter({
    windowMs: 5 * MINUTE,
    limit: 200,
    keyGenerator: accountKey,
    message: TOO_MANY
});

const chatTypingLimiter = limiter({
    windowMs: MINUTE,
    limit: 40,
    keyGenerator: accountKey,
    message: TOO_MANY
});

const chatGroupCreateLimiter = limiter({
    windowMs: 60 * MINUTE,
    limit: 5,
    keyGenerator: accountKey,
    message: "You've created several groups recently. Please try again later"
});

module.exports = {
    authLimiter,
    labSubmitLimiter,
    learnWriteLimiter,
    certificateClaimLimiter,
    verifyLimiter,
    communityPostLimiter,
    communityCommentLimiter,
    communityReactLimiter,
    communityReportLimiter,
    chatMessageLimiter,
    chatActionLimiter,
    chatTypingLimiter,
    chatGroupCreateLimiter,
    loginIpLimiter,
    loginAccountLimiter,
    otpLimiter,
    emailIpLimiter,
    emailTargetLimiter,
    linkLimiter
};
