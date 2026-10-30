const { db } = require("../../prisma/db.mjs");
const { FRONTEND_URL } = require("../../config/env");
const { isEmailTaken } = require("../../services/accountService");
const { hashToken } = require("../../utils/tokenUtils");
const { toMillis } = require("../../utils/dbTime");
const { confirmPage, resultPage } = require("../../utils/htmlPages");

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

// Helper to resolve the active ORM client (standalone db or existing transaction)
const getOrmPublic = (client) => {
    if (client && client.orm && client.orm.public) {
        return client.orm.public;
    }
    return db.orm.public;
};

const isNotExpired = (expiresAt) => {
    if (!expiresAt) return false;
    const millis = toMillis(expiresAt);
    return Number.isFinite(millis) && millis > Date.now();
};

// Find the account holding a (hashed) email change token, in Users or Organisation
const findByToken = async (kind, token, client = null) => {
    if (!token) return null;

    const orm = getOrmPublic(client);
    const hashed = hashToken(token);
    const tokenField = kind === "report" ? "emailChangeReportToken" : "emailChangeToken";

    const [userRecord, orgRecord] = await Promise.all([
        orm.Users
            .where((u) => u[tokenField].eq(hashed))
            .select("id", "email", "pendingEmail", "emailChangeExpiresAt", "tokenVersion")
            .first(),
        orm.Organisation
            .where((o) => o[tokenField].eq(hashed))
            .select("id", "email", "pendingEmail", "emailChangeExpiresAt", "tokenVersion")
            .first()
    ]);

    const checkRecord = (record, modelName, tableName) => {
        if (!record) return null;
        if (!isNotExpired(record.emailChangeExpiresAt)) {
            return null;
        }
        return {
            id: record.id,
            email: record.email,
            modelName,
            tableName,
            table_name: tableName,
            pendingEmail: record.pendingEmail,
            pending_email: record.pendingEmail,
            tokenVersion: record.tokenVersion
        };
    };

    return checkRecord(userRecord, "Users", "users") || checkRecord(orgRecord, "Organisation", "organisation") || null;
};

const INVALID_LINK = {
    title: "Link expired",
    message: "This link is invalid or has expired. You can request the change again from your settings.",
    error: true,
    link: `${FRONTEND_URL}/settings`,
    linkLabel: "Go to settings"
};

const ERROR_PAGE = {
    title: "Something went wrong",
    message: "Please try again in a moment.",
    error: true
};

// GET links from the emails only show a confirm button (see htmlPages.js)
const showConfirmEmailChange = async (req, res) => {
    try {
        const { token } = req.query;

        if (!token || !(await findByToken("confirm", token))) {
            return res.status(400).send(resultPage(INVALID_LINK));
        }

        return res.send(confirmPage({
            title: "Confirm your new email",
            message: "Click below to start using this email address for your CyberThulir account.",
            action: "/api/user/email-change/confirm",
            token,
            buttonLabel: "Confirm new email"
        }));
    } catch (error) {
        console.error("Confirm email change error:", error);
        return res.status(500).send(resultPage(ERROR_PAGE));
    }
};

const showReportEmailChange = async (req, res) => {
    try {
        const { token } = req.query;

        if (!token || !(await findByToken("report", token))) {
            return res.status(400).send(resultPage(INVALID_LINK));
        }

        return res.send(confirmPage({
            title: "Didn't request this?",
            message: "We'll cancel the email change and sign out every session on your account. Afterwards, reset your password.",
            action: "/api/user/email-change/report",
            token,
            buttonLabel: "Cancel the change"
        }));
    } catch (error) {
        console.error("Report email change error:", error);
        return res.status(500).send(resultPage(ERROR_PAGE));
    }
};

// Confirm email change (POST from the link sent to the NEW address)
const confirmEmailChange = async (req, res) => {
    try {
        const { token } = req.body || {};

        if (!token) {
            return res.status(400).send(resultPage(INVALID_LINK));
        }

        const outcome = await db.transaction(async (tx) => {
            const user = await findByToken("confirm", token, tx);

            if (!user || !user.pendingEmail) {
                return "invalid";
            }

            // Someone may have registered this email in the meantime
            if (await isEmailTaken(user.pendingEmail, {
                excludeId: user.id,
                includePending: false,
                client: tx
            })) {
                return "taken";
            }

            // Change email. The new address has just been proven, so it
            // counts as verified. The token check is repeated here so two
            // clicks can't both succeed.
            const updated = await tx.orm.public[user.modelName]
                .where((u) => u.id.eq(user.id))
                .where((u) => u.emailChangeToken.eq(hashToken(token)))
                .update({
                    email: user.pendingEmail,
                    pendingEmail: null,
                    emailChangeToken: null,
                    emailChangeReportToken: null,
                    emailChangeExpiresAt: null,
                    isEmailVerified: true,
                    updatedAt: toPlainDateTime(new Date())
                });

            return updated ? "ok" : "invalid";
        });

        if (outcome === "taken") {
            return res.status(409).send(resultPage({
                title: "Email already in use",
                message: "This email address now belongs to another account, so the change was cancelled.",
                error: true
            }));
        }

        if (outcome !== "ok") {
            return res.status(400).send(resultPage(INVALID_LINK));
        }

        return res.send(resultPage({
            title: "Email changed",
            message: "Your CyberThulir account now uses this email address.",
            link: `${FRONTEND_URL}/login`,
            linkLabel: "Go to CyberThulir"
        }));

    } catch (error) {
        // Unique constraint lost a race with another signup
        const errorText = `${error.code || ""} ${error.constraint || ""} ${error.message || ""} ${error.why || ""}`;
        if (error.code === "23505" || error.code === "P2002" || /unique/i.test(errorText)) {
            return res.status(409).send(resultPage({
                title: "Email already in use",
                message: "This email address now belongs to another account.",
                error: true
            }));
        }

        console.error("Confirm email change error:", error);

        return res.status(500).send(resultPage(ERROR_PAGE));
    }
};

// Report email change (POST from the alert sent to the OLD address)
const reportEmailChange = async (req, res) => {
    try {
        const { token } = req.body || {};

        if (!token) {
            return res.status(400).send(resultPage(INVALID_LINK));
        }

        const user = await findByToken("report", token);

        if (!user) {
            return res.status(400).send(resultPage(INVALID_LINK));
        }

        const nextTokenVersion = (user.tokenVersion || 0) + 1;

        // Cancel email change and sign out every session, in case
        // someone else was logged in to the account
        await db.orm.public[user.modelName]
            .where((u) => u.id.eq(user.id))
            .where((u) => u.emailChangeReportToken.eq(hashToken(token)))
            .update({
                pendingEmail: null,
                emailChangeToken: null,
                emailChangeReportToken: null,
                emailChangeExpiresAt: null,
                tokenVersion: nextTokenVersion,
                updatedAt: toPlainDateTime(new Date())
            });

        return res.send(resultPage({
            title: "Change cancelled",
            message: "The email change was cancelled and all sessions were signed out. Please reset your password now.",
            link: `${FRONTEND_URL}/forgot-password`,
            linkLabel: "Reset password"
        }));

    } catch (error) {
        console.error("Report email change error:", error);

        return res.status(500).send(resultPage(ERROR_PAGE));
    }
};

module.exports = {
    showConfirmEmailChange,
    showReportEmailChange,
    confirmEmailChange,
    reportEmailChange
};
