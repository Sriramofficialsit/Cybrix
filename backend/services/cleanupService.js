const { db } = require("../prisma/db.mjs");

const HOUR = 60 * 60 * 1000;

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

const toPlainDateTime = (date) => ({
    toString: () => date.toISOString().replace("T", " ").replace("Z", ""),
    [Symbol.toStringTag]: "Temporal.PlainDateTime",
    calendarId: "iso8601"
});

// Expired OTPs and tokens are useless; delete them so the tables
// don't grow forever
const cleanupExpired = async () => {
    try {
        const now = toPlainDateTime(new Date());

        await db.orm.public.LoginOtps
            .where((r) => r.expiresAt.lt(now))
            .deleteAll();

        await db.orm.public.EmailVerificationTokens
            .where((r) => r.expiresAt.lt(now))
            .deleteAll();

        await db.orm.public.PasswordResetTokens
            .where((r) => r.expiresAt.lt(now))
            .deleteAll();

        await db.orm.public.AdminEmailVerificationTokens
            .where((r) => r.expiresAt.lt(now))
            .deleteAll();

        for (const model of ["Users", "Organisation", "Professionals"]) {
            await db.orm.public[model]
                .where((r) => r.emailChangeExpiresAt && r.emailChangeExpiresAt.lt(now))
                .update({
                    pendingEmail: null,
                    emailChangeToken: null,
                    emailChangeReportToken: null,
                    emailChangeExpiresAt: null
                });
        }
    } catch (error) {
        console.error("Token cleanup failed:", error.message);
    }
};

const startCleanupJob = () => {
    cleanupExpired();

    // unref: don't keep the process alive just for this timer
    setInterval(cleanupExpired, HOUR).unref();
};

module.exports = {
    cleanupExpired,
    startCleanupJob
};
