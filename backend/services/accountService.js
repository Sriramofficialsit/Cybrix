const { db } = require("../prisma/db.mjs");
const { or } = require("@prisma/orm-postgres/orm-client");
const { buildOperation } = require("@prisma/orm-postgres/relational-core");
const { signToken } = require("../utils/jwt");

// Accounts live in three tables/models. accountType (stored in the JWT) specifies which.
const ACCOUNT_TABLES = {
    learner: "users",
    organisation: "organisation",
    professionals: "professionals"
};

const ACCOUNT_MODELS = {
    learner: "Users",
    organisation: "Organisation",
    professionals: "Professionals"
};

// Determine the correct table from user type or account type
const getUserTable = (userType) => {
    if (userType === "learner") {
        return "users";
    }

    if (userType === "student" || userType === "faculty") {
        return "organisation";
    }

    if (userType === "professional" || userType === "recruiter") {
        return "professionals";
    }

    return ACCOUNT_TABLES[userType] || null;
};

// Determine the correct Prisma model name from user type or account type
const getUserModel = (userType) => {
    if (userType === "learner") {
        return "Users";
    }

    if (userType === "student" || userType === "faculty") {
        return "Organisation";
    }

    if (userType === "professional" || userType === "recruiter") {
        return "Professionals";
    }

    return ACCOUNT_MODELS[userType] || null;
};

// Helper to resolve the active ORM client (standalone db or existing transaction)
const getOrmPublic = (client) => {
    if (client && client.orm && client.orm.public) {
        return client.orm.public;
    }
    return db.orm.public;
};

// Format rows into backward-compatible account objects
const formatLearner = (row) => row ? ({
    account_type: "learner",
    accountType: "learner",
    id: row.id,
    username: row.username,
    email: row.email,
    password_hash: row.passwordHash,
    passwordHash: row.passwordHash,
    is_email_verified: row.isEmailVerified,
    isEmailVerified: row.isEmailVerified,
    current_status: row.currentStatus,
    currentStatus: row.currentStatus,
    token_version: row.tokenVersion,
    tokenVersion: row.tokenVersion,
    user_type: null,
    userType: null,
    full_name: null,
    fullName: null
}) : null;

const formatOrganisation = (row) => row ? ({
    account_type: "organisation",
    accountType: "organisation",
    id: row.id,
    username: row.username,
    email: row.email,
    password_hash: row.passwordHash,
    passwordHash: row.passwordHash,
    is_email_verified: row.isEmailVerified,
    isEmailVerified: row.isEmailVerified,
    current_status: row.currentStatus,
    currentStatus: row.currentStatus,
    token_version: row.tokenVersion,
    tokenVersion: row.tokenVersion,
    user_type: row.userType,
    userType: row.userType,
    full_name: null,
    fullName: null
}) : null;

const formatProfessionals = (row) => row ? ({
    account_type: "professionals",
    accountType: "professionals",
    id: row.id,
    username: row.username,
    email: row.email,
    password_hash: row.passwordHash,
    passwordHash: row.passwordHash,
    is_email_verified: row.isEmailVerified,
    isEmailVerified: row.isEmailVerified,
    current_status: row.currentStatus,
    currentStatus: row.currentStatus,
    token_version: row.tokenVersion,
    tokenVersion: row.tokenVersion,
    user_type: row.userType,
    userType: row.userType,
    full_name: row.fullName || row.name || null,
    fullName: row.fullName || row.name || null
}) : null;

// Login accepts an email or a username, both case-insensitive.
// Deterministic precedence: learner -> organisation -> professionals.
const findAccountByLogin = async (emailOrUsername, client = null) => {
    const term = (emailOrUsername || "").trim().toLowerCase();
    if (!term) return null;

    const orm = getOrmPublic(client);

    const [learner, org, prof] = await Promise.all([
        orm.Users
            .where((u) => or(u.email.ilike(term), u.username.ilike(term)))
            .select("id", "username", "email", "passwordHash", "isEmailVerified", "currentStatus", "tokenVersion")
            .first(),
        orm.Organisation
            .where((o) => or(o.email.ilike(term), o.username.ilike(term)))
            .select("id", "username", "email", "passwordHash", "isEmailVerified", "currentStatus", "tokenVersion", "userType")
            .first(),
        orm.Professionals
            .where((p) => or(p.email.ilike(term), p.username.ilike(term)))
            .select("id", "username", "email", "passwordHash", "isEmailVerified", "currentStatus", "tokenVersion", "userType", "fullName", "name")
            .first()
    ]);

    if (learner) return formatLearner(learner);
    if (org) return formatOrganisation(org);
    if (prof) return formatProfessionals(prof);
    return null;
};

// Deterministic precedence: learner -> organisation -> professionals.
const findAccountByEmail = async (email, client = null) => {
    const term = (email || "").trim().toLowerCase();
    if (!term) return null;

    const orm = getOrmPublic(client);

    const [learner, org, prof] = await Promise.all([
        orm.Users
            .where((u) => u.email.ilike(term))
            .select("id", "username", "email", "passwordHash", "isEmailVerified", "currentStatus", "tokenVersion")
            .first(),
        orm.Organisation
            .where((o) => o.email.ilike(term))
            .select("id", "username", "email", "passwordHash", "isEmailVerified", "currentStatus", "tokenVersion", "userType")
            .first(),
        orm.Professionals
            .where((p) => p.email.ilike(term))
            .select("id", "username", "email", "passwordHash", "isEmailVerified", "currentStatus", "tokenVersion", "userType", "fullName", "name")
            .first()
    ]);

    if (learner) return formatLearner(learner);
    if (org) return formatOrganisation(org);
    if (prof) return formatProfessionals(prof);
    return null;
};

// Account ids are UUIDs, unique across the three tables.
// Deterministic precedence: learner -> organisation -> professionals.
const findAccountById = async (id, client = null) => {
    if (!id) return null;

    const orm = getOrmPublic(client);

    const [learner, org, prof] = await Promise.all([
        orm.Users
            .where({ id })
            .select("id", "username", "email", "passwordHash", "isEmailVerified", "currentStatus", "tokenVersion")
            .first(),
        orm.Organisation
            .where({ id })
            .select("id", "username", "email", "passwordHash", "isEmailVerified", "currentStatus", "tokenVersion", "userType")
            .first(),
        orm.Professionals
            .where({ id })
            .select("id", "username", "email", "passwordHash", "isEmailVerified", "currentStatus", "tokenVersion", "userType", "fullName", "name")
            .first()
    ]);

    if (learner) return formatLearner(learner);
    if (org) return formatOrganisation(org);
    if (prof) return formatProfessionals(prof);
    return null;
};

// Is this email used by any account other than excludeId?
// includePending also counts an email another account is changing to.
const isEmailTaken = async (
    email,
    { excludeId = null, includePending = true, client = null } = {}
) => {
    const term = (email || "").trim().toLowerCase();
    if (!term) return false;

    const orm = getOrmPublic(client);

    let usersQuery = includePending
        ? orm.Users.where((u) => or(u.email.ilike(term), u.pendingEmail.ilike(term)))
        : orm.Users.where((u) => u.email.ilike(term));
    if (excludeId) {
        usersQuery = usersQuery.where((u) => u.id.neq(excludeId));
    }

    let orgQuery = includePending
        ? orm.Organisation.where((o) => or(o.email.ilike(term), o.pendingEmail.ilike(term)))
        : orm.Organisation.where((o) => o.email.ilike(term));
    if (excludeId) {
        orgQuery = orgQuery.where((o) => o.id.neq(excludeId));
    }

    // Professionals table has no pending_email column in schema/live DB
    let profQuery = orm.Professionals.where((p) => p.email.ilike(term));
    if (excludeId) {
        profQuery = profQuery.where((p) => p.id.neq(excludeId));
    }

    const [uMatch, oMatch, pMatch] = await Promise.all([
        usersQuery.select("id").first(),
        orgQuery.select("id").first(),
        profQuery.select("id").first()
    ]);

    return Boolean(uMatch || oMatch || pMatch);
};

const isUsernameTaken = async (username, excludeId = null, client = null) => {
    const term = (username || "").trim().toLowerCase();
    if (!term) return false;

    const orm = getOrmPublic(client);

    let usersQuery = orm.Users.where((u) => u.username.ilike(term));
    let orgQuery = orm.Organisation.where((o) => o.username.ilike(term));
    let profQuery = orm.Professionals.where((p) => p.username.ilike(term));
    let adminQuery = orm.Admins.where((a) => a.username.ilike(term));

    if (excludeId) {
        usersQuery = usersQuery.where((u) => u.id.neq(excludeId));
        orgQuery = orgQuery.where((o) => o.id.neq(excludeId));
        profQuery = profQuery.where((p) => p.id.neq(excludeId));
        adminQuery = adminQuery.where((a) => a.id.neq(excludeId));
    }

    const [uMatch, oMatch, pMatch, aMatch] = await Promise.all([
        usersQuery.select("id").first(),
        orgQuery.select("id").first(),
        profQuery.select("id").first(),
        adminQuery.select("id").first()
    ]);

    return Boolean(uMatch || oMatch || pMatch || aMatch);
};

// Exact, case-insensitive username match across the account tables (never
// email, so it can't be used to probe which emails are registered).
// Returns { accountType, id, username } or null.
const findAccountByUsername = async (username, client = null) => {
    const term = String(username || "").trim();
    if (!/^[A-Za-z0-9_]{3,20}$/.test(term)) return null;

    // "_" is a LIKE wildcard; match it literally
    const pattern = term.replace(/_/g, "\\_");
    const orm = getOrmPublic(client);

    const [learner, org, prof] = await Promise.all([
        orm.Users.where((u) => u.username.ilike(pattern)).select("id", "username", "currentStatus").first(),
        orm.Organisation.where((o) => o.username.ilike(pattern)).select("id", "username", "currentStatus").first(),
        orm.Professionals.where((p) => p.username.ilike(pattern)).select("id", "username", "currentStatus").first()
    ]);

    const [accountType, row] = learner ? ["learner", learner] : org ? ["organisation", org] : prof ? ["professionals", prof] : [];

    return row && row.currentStatus === "active" ? { accountType, id: row.id, username: row.username } : null;
};

// Public display info for many accounts in one query per account table.
// keys: [{ accountType, id }]. Returns Map("<accountType>:<id>" ->
// { username, fullName, userType }); accounts that no longer exist are absent.
const findDisplayNames = async (keys, client = null) => {
    const orm = getOrmPublic(client);
    const idsByType = new Map();

    for (const { accountType, id } of keys) {
        if (!ACCOUNT_MODELS[accountType] || !id) continue;
        if (!idsByType.has(accountType)) idsByType.set(accountType, new Set());
        idsByType.get(accountType).add(id);
    }

    const columns = {
        learner: ["id", "username"],
        organisation: ["id", "username", "userType"],
        professionals: ["id", "username", "userType", "fullName"]
    };

    const result = new Map();

    await Promise.all([...idsByType].map(async ([accountType, ids]) => {
        const list = [...ids];
        const rows = await orm[ACCOUNT_MODELS[accountType]]
            .where((r) => (list.length === 1 ? r.id.eq(list[0]) : or(...list.map((id) => r.id.eq(id)))))
            .select(...columns[accountType])
            .all();

        for (const row of rows) {
            result.set(`${accountType}:${row.id}`, {
                username: row.username,
                fullName: row.fullName || null,
                userType: row.userType || (accountType === "learner" ? "learner" : null)
            });
        }
    }));

    return result;
};

// learner accounts have no user_type column
const userTypeOf = (account) => account.user_type || account.userType || "learner";

// JWT for a normal account. `tv` must match token_version in the DB,
// so bumping token_version logs out every existing session.
const signUserToken = (account) =>
    signToken({
        userId: account.id,
        accountType: account.account_type || account.accountType,
        userType: account.user_type || account.userType || null,
        tv: account.token_version ?? account.tokenVersion ?? 0
    });

// Invalidate every JWT issued for this account. Returns the new version.
// Atomically increments token_version directly in the database (UPDATE ... SET token_version = token_version + 1 RETURNING token_version).
// Reuses existing transaction if passed; creates a new one only if none is provided.
const bumpTokenVersion = async (accountType, id, client = null) => {
    const table = ACCOUNT_TABLES[accountType];
    if (!table || !id) return null;

    const execute = async (context) => {
        const plan = context.sql.public[table]
            .update((f) => ({
                token_version: buildOperation({
                    method: "increment",
                    args: [f.token_version.buildAst()],
                    lowering: { template: "{{self}} + 1" }
                })
            }))
            .where((f, fns) => fns.eq(f.id, id))
            .returning("token_version")
            .build();

        const res = await (context.query ? context.query(plan) : context.runtime().query(plan));
        const row = res[0];
        return row ? row.token_version : null;
    };

    if (client && client.sql && client.sql.public) {
        return execute(client);
    }

    return db.transaction(async (tx) => execute(tx));
};

// Public user object returned by login endpoints
const publicUser = (account) => ({
    id: account.id,
    username: account.username,
    email: account.email,
    accountType: account.account_type || account.accountType,
    userType: account.user_type || account.userType || null
});

module.exports = {
    ACCOUNT_TABLES,
    ACCOUNT_MODELS,
    getUserTable,
    getUserModel,
    findAccountByLogin,
    findAccountByEmail,
    findAccountById,
    isEmailTaken,
    isUsernameTaken,
    findDisplayNames,
    findAccountByUsername,
    userTypeOf,
    signUserToken,
    bumpTokenVersion,
    publicUser
};
