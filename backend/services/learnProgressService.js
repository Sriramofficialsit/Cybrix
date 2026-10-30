const { getMongo } = require("../config/mongodb");
const {
    STAGES,
    REWARDS,
    XP_PER_LEVEL,
    RANKS,
    LESSON_ROUTES
} = require("../learn/curriculum");

// One profile document per account holds XP, the daily streak and every
// course's progress. Each write is a single conditional update, so a
// double click or a replayed request can never award XP twice.
//
// learn_profiles: {
//   _id: "<accountType>:<accountId>", accountId, accountType, xp,
//   streak: { current, best, lastDay: "YYYY-MM-DD" },
//   courses: { <slug>: {
//     topics: { "<topicId>": { stages: ["story", ...], startedAt, completedAt } },
//     chests: ["chest-1-2"], modulesCleared: [1], completedAt
//   } },
//   createdAt, updatedAt
// }
// learn_events: an append-only log of every reward, kept for a year

const PROFILES = "learn_profiles";
const EVENTS = "learn_events";
const EVENT_TTL_SECONDS = 365 * 24 * 60 * 60;

class LearnError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

const ensureLearnIndexes = async () => {
    const db = getMongo();

    await db.collection(EVENTS).createIndexes([
        { key: { profileId: 1, at: -1 }, name: "profile_recent" },
        { key: { at: 1 }, name: "expire_after_1y", expireAfterSeconds: EVENT_TTL_SECONDS }
    ]);
};

const profileId = (account) => `${account.accountType}:${account.userId}`;

// ---------- days and streaks ----------

// Minutes behind UTC, as the browser's Date#getTimezoneOffset() reports
// (IST is -330). Anything unusable falls back to UTC.
const parseTzOffset = (value) => {
    const n = Number(value);
    return Number.isInteger(n) && n >= -840 && n <= 840 ? n : 0;
};

const dayKey = (tzOffset, now = Date.now()) =>
    new Date(now - tzOffset * 60 * 1000).toISOString().slice(0, 10);

const previousDay = (day) => {
    const d = new Date(`${day}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
};

const advanceStreak = (streak, today) => {
    const current = streak && streak.current ? streak.current : 0;
    const best = streak && streak.best ? streak.best : 0;
    const lastDay = streak ? streak.lastDay : null;

    if (lastDay === today) {
        return { current, best, lastDay };
    }

    const next = lastDay === previousDay(today) ? current + 1 : 1;
    return { current: next, best: Math.max(best, next), lastDay: today };
};

// A streak only counts while it was kept up today or yesterday
const liveStreak = (streak, today) => {
    if (!streak || !streak.lastDay) {
        return { current: 0, best: streak ? streak.best || 0 : 0, activeToday: false };
    }

    const alive = streak.lastDay === today || streak.lastDay === previousDay(today);

    return {
        current: alive ? streak.current : 0,
        best: streak.best || 0,
        activeToday: streak.lastDay === today
    };
};

// ---------- profile ----------

const getProfile = async (account) => {
    const db = getMongo();
    const _id = profileId(account);
    const now = new Date();

    const upsert = () =>
        db.collection(PROFILES).findOneAndUpdate(
            { _id },
            {
                $setOnInsert: {
                    accountId: account.userId,
                    accountType: account.accountType,
                    xp: 0,
                    streak: { current: 0, best: 0, lastDay: null },
                    courses: {},
                    createdAt: now,
                    updatedAt: now
                }
            },
            { upsert: true, returnDocument: "after" }
        );

    try {
        return await upsert();
    } catch (error) {
        // Two first requests raced to create the profile; the other won
        if (error && error.code === 11000) {
            return upsert();
        }
        throw error;
    }
};

const courseState = (profile, slug) =>
    (profile.courses && profile.courses[slug]) || {};

const topicState = (profile, slug, topicId) => {
    const topics = courseState(profile, slug).topics || {};
    return topics[topicId] || { stages: [] };
};

const isDone = (profile, slug, topicId) => Boolean(topicState(profile, slug, topicId).completedAt);

const isUnlocked = (course, profile, topic) =>
    topic.order === 0 || isDone(profile, course.slug, course.topics[topic.order - 1].id);

// ---------- snapshot sent to the browser ----------

const levelInfo = (xp) => {
    const level = Math.floor(xp / XP_PER_LEVEL) + 1;
    const into = xp % XP_PER_LEVEL;
    const rank = RANKS.filter((r) => r.from <= level).pop();
    const nextRank = RANKS.find((r) => r.from > level) || null;

    return {
        level,
        rank: rank.title,
        nextRank: nextRank ? { title: nextRank.title, level: nextRank.from } : null,
        levelXp: into,
        levelGoal: XP_PER_LEVEL,
        levelPct: Math.round((into / XP_PER_LEVEL) * 100)
    };
};

const starsFor = (pct) => (pct >= 100 ? 3 : pct >= 66 ? 2 : pct >= 33 ? 1 : 0);
const avgMinutes = (topic) => (topic.min[0] + topic.min[1]) / 2;

const profileSummary = (profile, tzOffset) => ({
    xp: profile.xp || 0,
    ...levelInfo(profile.xp || 0),
    streak: liveStreak(profile.streak, dayKey(tzOffset))
});

const buildSnapshot = (course, profile, tzOffset) => {
    const slug = course.slug;
    const state = courseState(profile, slug);
    const openedChests = new Set(state.chests || []);
    let current = null;

    const modules = course.modules.map((m) => {
        const topics = m.topics.map((t) => {
            const ts = topicState(profile, slug, t.id);
            const done = Boolean(ts.completedAt);
            const unlocked = isUnlocked(course, profile, course.topicById.get(t.id));
            const status = done ? "done" : unlocked ? "current" : "locked";
            const stagesDone = done ? STAGES.length : ts.stages.length;

            const topic = {
                id: t.id,
                key: t.key,
                title: t.title,
                desc: t.desc,
                min: t.min,
                icon: t.icon,
                capstone: t.capstone,
                xp: t.xp,
                status,
                stagesDone,
                nextStage: done ? null : STAGES[stagesDone],
                lesson: LESSON_ROUTES[t.id] || null,
                completedAt: ts.completedAt || null
            };

            if (status === "current" && !current) {
                current = { ...topic, module: m.num, moduleTitle: m.title };
            }

            return topic;
        });

        const progress = (t) => t.stagesDone / STAGES.length;
        const doneCount = topics.filter((t) => t.status === "done").length;
        const pct = Math.round((topics.reduce((s, t) => s + progress(t), 0) / topics.length) * 100);
        const moduleState =
            doneCount === topics.length ? "done" : topics.some((t) => t.status !== "locked") ? "current" : "locked";

        return {
            num: m.num,
            title: m.title,
            tagline: m.tagline,
            icon: m.icon,
            accent: m.accent,
            state: moduleState,
            done: doneCount,
            total: topics.length,
            pct,
            stars: starsFor(pct),
            xpTotal: m.topics.reduce((s, t) => s + t.xp, 0),
            minutes: Math.round(m.topics.reduce((s, t) => s + avgMinutes(t), 0)),
            minutesLeft: Math.round(m.topics.reduce((s, t, i) => s + avgMinutes(t) * (1 - progress(topics[i])), 0)),
            chests: m.chests.map((c) => ({
                id: c.id,
                after: c.after,
                xp: c.xp,
                opened: openedChests.has(c.id),
                available: !openedChests.has(c.id) && isDone(profile, slug, c.after)
            })),
            topics
        };
    });

    const allTopics = modules.flatMap((m) => m.topics);
    const doneTopics = allTopics.filter((t) => t.status === "done").length;

    return {
        profile: profileSummary(profile, tzOffset),
        course: {
            slug,
            title: course.title,
            stages: STAGES,
            completedAt: state.completedAt || null,
            current,
            totals: {
                topics: allTopics.length,
                done: doneTopics,
                pct: Math.round((allTopics.reduce((s, t) => s + t.stagesDone / STAGES.length, 0) / allTopics.length) * 100),
                worlds: modules.length,
                worldsCleared: modules.filter((m) => m.state === "done").length,
                stars: modules.reduce((s, m) => s + m.stars, 0),
                starsMax: modules.length * 3,
                chests: course.chestById.size,
                chestsOpened: openedChests.size,
                minutes: modules.reduce((s, m) => s + m.minutes, 0),
                minutesLeft: modules.reduce((s, m) => s + m.minutesLeft, 0)
            },
            modules
        }
    };
};

// ---------- reads ----------

const getCourseProgress = async (account, course, tzOffset) => {
    const profile = await getProfile(account);
    return buildSnapshot(course, profile, tzOffset);
};

const getSummary = async (account, tzOffset) => {
    const profile = await getProfile(account);
    return profileSummary(profile, tzOffset);
};

// Ids of the course's finished topics (certification requirements read this)
const completedTopicIds = async (account, course) => {
    const profile = await getProfile(account);
    return new Set(course.topics.filter((t) => isDone(profile, course.slug, t.id)).map((t) => t.id));
};

// ---------- writes ----------

const logEvent = (profile, event) =>
    getMongo()
        .collection(EVENTS)
        .insertOne({ profileId: profile._id, at: new Date(), ...event })
        .catch((error) => console.error("Learn event log failed:", error.message));

// Mark one stage of a topic complete and award its XP.
// Returns { snapshot, awarded, completed, levelUp, next }.
const completeStage = async (account, course, topic, stage, tzOffset) => {
    const slug = course.slug;
    const profile = await getProfile(account);
    const ts = topicState(profile, slug, topic.id);
    const stageIndex = STAGES.indexOf(stage);
    const noChange = () => ({
        snapshot: buildSnapshot(course, profile, tzOffset),
        awarded: { xp: 0, items: [] },
        completed: { topic: false, module: null, course: false },
        levelUp: null,
        next: null
    });

    if (ts.completedAt || ts.stages.includes(stage)) {
        return noChange();
    }

    if (!isUnlocked(course, profile, topic)) {
        const prev = course.topics[topic.order - 1];
        throw new LearnError(403, `Locked: finish Topic ${prev.key} first`);
    }

    if (ts.stages.length !== stageIndex) {
        const needed = STAGES[ts.stages.length];
        throw new LearnError(409, `Complete the ${needed} stage first`);
    }

    const finishing = stage === "done";
    const items = [];

    if (finishing) {
        items.push({ label: topic.capstone ? "Capstone complete" : "Topic complete", xp: topic.xp });
    } else {
        items.push({ label: `${stage[0].toUpperCase()}${stage.slice(1)} stage`, xp: REWARDS.stage });
    }

    const module = course.modules.find((m) => m.num === topic.module);
    const othersDone = (topics) => topics.every((t) => t.id === topic.id || isDone(profile, slug, t.id));
    const clearsModule = finishing && othersDone(module.topics);
    const clearsCourse = finishing && othersDone(course.topics);

    if (clearsModule) {
        items.push({ label: `World ${String(module.num).padStart(2, "0")} cleared`, xp: REWARDS.module });
    }

    if (clearsCourse) {
        items.push({ label: "Course complete", xp: REWARDS.course });
    }

    const xp = items.reduce((s, i) => s + i.xp, 0);
    const now = new Date();
    const base = `courses.${slug}`;
    const tpath = `${base}.topics.${topic.id}`;

    const set = {
        updatedAt: now,
        streak: advanceStreak(profile.streak, dayKey(tzOffset))
    };

    if (stageIndex === 0) set[`${tpath}.startedAt`] = now;
    if (finishing) set[`${tpath}.completedAt`] = now;
    if (clearsCourse) set[`${base}.completedAt`] = now;

    const update = { $push: { [`${tpath}.stages`]: stage }, $inc: { xp }, $set: set };

    if (clearsModule) {
        update.$addToSet = { [`${base}.modulesCleared`]: module.num };
    }

    // Only applies if no other request recorded a stage in the meantime
    const filter = {
        _id: profile._id,
        [`${tpath}.stages`]: stageIndex === 0 ? { $exists: false } : { $size: stageIndex }
    };

    const updated = await getMongo()
        .collection(PROFILES)
        .findOneAndUpdate(filter, update, { returnDocument: "after" });

    if (!updated) {
        return {
            ...noChange(),
            snapshot: buildSnapshot(course, await getProfile(account), tzOffset)
        };
    }

    logEvent(profile, { type: "stage", course: slug, topic: topic.id, stage, xp });

    const before = levelInfo(profile.xp || 0).level;
    const after = levelInfo(updated.xp || 0);
    const nextTopic = finishing ? course.topics[topic.order + 1] : null;

    return {
        snapshot: buildSnapshot(course, updated, tzOffset),
        awarded: { xp, items },
        completed: {
            topic: finishing,
            module: clearsModule ? module.num : null,
            course: clearsCourse
        },
        levelUp: after.level > before
            ? { level: after.level, rank: after.rank, newRank: after.rank !== levelInfo(profile.xp || 0).rank }
            : null,
        next: nextTopic
            ? {
                id: nextTopic.id,
                key: nextTopic.key,
                title: nextTopic.title,
                module: nextTopic.module,
                newModule: nextTopic.module !== topic.module,
                lesson: LESSON_ROUTES[nextTopic.id] || null
            }
            : null
    };
};

// Open a reward chest once the topic before it is done
const claimChest = async (account, course, chest, tzOffset) => {
    const slug = course.slug;
    const profile = await getProfile(account);
    const opened = courseState(profile, slug).chests || [];

    if (opened.includes(chest.id)) {
        return { snapshot: buildSnapshot(course, profile, tzOffset), awarded: { xp: 0, items: [] } };
    }

    if (!isDone(profile, slug, chest.after)) {
        const after = course.topicById.get(chest.after);
        throw new LearnError(403, `Locked: finish Topic ${after.key} first`);
    }

    const chestsPath = `courses.${slug}.chests`;
    const updated = await getMongo()
        .collection(PROFILES)
        .findOneAndUpdate(
            { _id: profile._id, [chestsPath]: { $ne: chest.id } },
            {
                $push: { [chestsPath]: chest.id },
                $inc: { xp: chest.xp },
                $set: { updatedAt: new Date(), streak: advanceStreak(profile.streak, dayKey(tzOffset)) }
            },
            { returnDocument: "after" }
        );

    if (!updated) {
        return { snapshot: buildSnapshot(course, await getProfile(account), tzOffset), awarded: { xp: 0, items: [] } };
    }

    logEvent(profile, { type: "chest", course: slug, chest: chest.id, xp: chest.xp });

    return {
        snapshot: buildSnapshot(course, updated, tzOffset),
        awarded: { xp: chest.xp, items: [{ label: "Reward chest", xp: chest.xp }] }
    };
};

// XP a learner has earned from one course, so restarting it takes that
// XP back (otherwise replaying the course would award it twice)
const courseXp = (course, state) => {
    const topics = state.topics || {};
    let xp = 0;

    for (const topic of course.topics) {
        const ts = topics[topic.id];
        if (!ts) continue;
        xp += (ts.stages || []).filter((s) => s !== "done").length * REWARDS.stage;
        if (ts.completedAt) xp += topic.xp;
    }

    for (const id of state.chests || []) {
        const chest = course.chestById.get(id);
        if (chest) xp += chest.xp;
    }

    xp += (state.modulesCleared || []).length * REWARDS.module;
    if (state.completedAt) xp += REWARDS.course;

    return xp;
};

// Wipe one course's progress so the learner starts it fresh.
// The streak is kept; the course's XP is removed.
const resetCourse = async (account, course, tzOffset) => {
    const slug = course.slug;
    const profile = await getProfile(account);
    const state = courseState(profile, slug);

    if (!profile.courses || !profile.courses[slug]) {
        return { snapshot: buildSnapshot(course, profile, tzOffset), removedXp: 0 };
    }

    const removedXp = Math.min(courseXp(course, state), profile.xp || 0);

    // Only applies if nothing else changed the profile since it was read,
    // so a stage finished at the same moment can't be lost or miscounted
    const updated = await getMongo()
        .collection(PROFILES)
        .findOneAndUpdate(
            { _id: profile._id, updatedAt: profile.updatedAt },
            {
                $unset: { [`courses.${slug}`]: "" },
                $inc: { xp: -removedXp },
                $set: { updatedAt: new Date() }
            },
            { returnDocument: "after" }
        );

    if (!updated) {
        throw new LearnError(409, "Your progress just changed. Please try again");
    }

    logEvent(profile, { type: "reset", course: slug, xp: -removedXp });

    return { snapshot: buildSnapshot(course, updated, tzOffset), removedXp };
};

module.exports = {
    completedTopicIds,
    LearnError,
    ensureLearnIndexes,
    parseTzOffset,
    getCourseProgress,
    getSummary,
    completeStage,
    claimChest,
    resetCourse,
    // exported for tests
    advanceStreak,
    liveStreak,
    dayKey
};
