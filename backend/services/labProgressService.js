const { db } = require("../prisma/db.mjs");
const { buildOperation, param } = require("@prisma/orm-postgres/relational-core");

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

const toInstant = (date) => ({
    toString: () => date.toISOString(),
    [Symbol.toStringTag]: "Temporal.Instant"
});

// Lab progress is stored per platform account (see lab_progress in
// database/schema.sql). `user` is the decoded session from protect().

const getProgress = async (user, slug) => {
    return await db.orm.public.LabProgress
        .where({
            accountId: user.userId,
            accountType: user.accountType,
            labSlug: slug
        })
        .first();
};

// Opening a lab starts it; later calls just return the existing row
const startLab = async (user, slug) => {
    const existing = await getProgress(user, slug);

    if (!existing) {
        try {
            await db.orm.public.LabProgress.create({
                accountId: user.userId,
                accountType: user.accountType,
                labSlug: slug
            });
        } catch (err) {
            const isDuplicateKey = err.code === "23505" ||
                err.code === "P2002" ||
                (err.message && (err.message.includes("duplicate key") || err.message.includes("unique constraint")));
            if (!isDuplicateKey) {
                throw err;
            }
        }
    }

    return getProgress(user, slug);
};

const listProgress = async (user) => {
    return await db.orm.public.LabProgress
        .where({
            accountId: user.userId,
            accountType: user.accountType
        })
        .orderBy((r) => r.startedAt.desc())
        .all();
};

const getState = async (user, slug) => {
    const row = await getProgress(user, slug);
    return row && row.state ? row.state : {};
};

// Merges `patch` into the lab's state, e.g. { ssh: true }
const mergeState = async (user, slug, patch) => {
    await startLab(user, slug);

    const plan = db.sql.public.lab_progress
        .update((f) => ({
            state: buildOperation({
                method: "jsonb_merge",
                args: [f.state.buildAst(), param(patch || {}, { codecId: "pg/jsonb@1" })],
                lowering: { template: "COALESCE({{self}}, '{}'::jsonb) || {{arg0}}" }
            }),
            updated_at: buildOperation({
                method: "now",
                args: [f.updated_at.buildAst()],
                lowering: { template: "CURRENT_TIMESTAMP" }
            })
        }))
        .where((f, fns) => fns.and(
            fns.eq(f.account_id, user.userId),
            fns.eq(f.account_type, user.accountType),
            fns.eq(f.lab_slug, slug)
        ))
        .build();

    await db.runtime().query(plan);
};

const clearState = async (user, slug) => {
    await db.orm.public.LabProgress
        .where({
            accountId: user.userId,
            accountType: user.accountType,
            labSlug: slug
        })
        .update({
            state: {},
            updatedAt: toInstant(new Date())
        });
};

// Reveals hint `index` only if it is the next unrevealed one, so hints open
// in order and each cost is charged once. Hints opened after the lab is
// completed are free. Returns the updated row.
const revealHint = async (user, slug, index, cost) => {
    await startLab(user, slug);

    const penaltyCost = Number(cost || 0);
    const plan = db.sql.public.lab_progress
        .update((f) => ({
            hints_revealed: buildOperation({
                method: "increment",
                args: [f.hints_revealed.buildAst()],
                lowering: { template: "{{self}} + 1" }
            }),
            hint_penalty: buildOperation({
                method: "update_penalty",
                args: [f.hint_penalty.buildAst(), param(penaltyCost, { codecId: "pg/int4@1" })],
                lowering: { template: "{{self}} + CASE WHEN status = 'completed' THEN 0 ELSE {{arg0}} END" }
            }),
            updated_at: buildOperation({
                method: "now",
                args: [f.updated_at.buildAst()],
                lowering: { template: "CURRENT_TIMESTAMP" }
            })
        }))
        .where((f, fns) => fns.and(
            fns.eq(f.account_id, user.userId),
            fns.eq(f.account_type, user.accountType),
            fns.eq(f.lab_slug, slug),
            fns.eq(f.hints_revealed, Number(index))
        ))
        .build();

    await db.runtime().query(plan);
    return getProgress(user, slug);
};

// Counts the attempt; the first correct one completes the lab and fixes
// the score at points minus hint penalties.
const recordSubmission = async (user, slug, correct, points) => {
    await startLab(user, slug);

    const isCorrect = Boolean(correct);
    const pts = Number(points || 0);

    const plan = db.sql.public.lab_progress
        .update((f) => ({
            attempts: buildOperation({
                method: "increment",
                args: [f.attempts.buildAst()],
                lowering: { template: "{{self}} + 1" }
            }),
            score: buildOperation({
                method: "update_score",
                args: [
                    f.score.buildAst(),
                    param(isCorrect, { codecId: "pg/bool@1" }),
                    param(pts, { codecId: "pg/int4@1" })
                ],
                lowering: { template: "CASE WHEN {{arg0}} AND status <> 'completed' THEN GREATEST({{arg1}} - hint_penalty, 0) ELSE {{self}} END" }
            }),
            completed_at: buildOperation({
                method: "update_completed_at",
                args: [
                    f.completed_at.buildAst(),
                    param(isCorrect, { codecId: "pg/bool@1" })
                ],
                lowering: { template: "CASE WHEN {{arg0}} AND status <> 'completed' THEN CURRENT_TIMESTAMP ELSE {{self}} END" }
            }),
            status: buildOperation({
                method: "update_status",
                args: [
                    f.status.buildAst(),
                    param(isCorrect, { codecId: "pg/bool@1" })
                ],
                lowering: { template: "CASE WHEN {{arg0}} THEN 'completed' ELSE {{self}} END" }
            }),
            updated_at: buildOperation({
                method: "now",
                args: [f.updated_at.buildAst()],
                lowering: { template: "CURRENT_TIMESTAMP" }
            })
        }))
        .where((f, fns) => fns.and(
            fns.eq(f.account_id, user.userId),
            fns.eq(f.account_type, user.accountType),
            fns.eq(f.lab_slug, slug)
        ))
        .returning(
            "account_id",
            "account_type",
            "lab_slug",
            "status",
            "hints_revealed",
            "hint_penalty",
            "attempts",
            "score",
            "state",
            "started_at",
            "completed_at",
            "updated_at"
        )
        .build();

    const rows = await db.runtime().query(plan);
    if (!rows || rows.length === 0) {
        return null;
    }

    const row = rows[0];
    return {
        accountId: row.account_id,
        accountType: row.account_type,
        labSlug: row.lab_slug,
        status: row.status,
        hintsRevealed: row.hints_revealed,
        hintPenalty: row.hint_penalty,
        attempts: row.attempts,
        score: row.score,
        state: row.state,
        startedAt: row.started_at,
        completedAt: row.completed_at,
        updatedAt: row.updated_at
    };
};

// What the frontend sees (no account ids, no lab state)
const toPublic = (row) =>
    row
        ? {
            status: row.status,
            hintsRevealed: row.hintsRevealed ?? 0,
            hintPenalty: row.hintPenalty ?? 0,
            attempts: row.attempts ?? 0,
            score: row.score ?? null,
            startedAt: row.startedAt ?? null,
            completedAt: row.completedAt ?? null
        }
        : null;

module.exports = {
    getProgress,
    startLab,
    listProgress,
    getState,
    mergeState,
    clearState,
    revealHint,
    recordSubmission,
    toPublic
};
