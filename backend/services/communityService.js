const { ObjectId } = require("mongodb");

const { getMongo } = require("../config/mongodb");
const { findDisplayNames } = require("./accountService");

// Community feed: posts, comments, likes and reports, in MongoDB.
//
// community_posts: {
//   _id, authorKey: "<accountType>:<id>" (or "admin:<id>"), authorType, authorId,
//   kind: "writeup" | "question" | "announcement", title, body, tags: [],
//   likeCount, commentCount, reportCount, openReports,
//   status: "visible" | "hidden" (auto, by reports) | "removed",
//   pinned, createdAt, editedAt, lastActivityAt
// }
// community_comments: { _id, postId, authorKey, authorType, authorId, body,
//   status, reportCount, openReports, createdAt, editedAt }
// community_likes:   { _id: "<postId>:<authorKey>", postId, authorKey, createdAt }
// community_reports: { _id: "<targetType>:<targetId>:<authorKey>", targetType,
//   targetId, postId, authorKey, reason, details, createdAt, resolvedAt }
//
// Author names are not stored: usernames can change, so they are looked up
// (in one batched query per account table) whenever posts are read.
// Counters are updated with $inc right after the like/comment/report write,
// and a unique _id per (target, account) makes likes and reports idempotent.

const POSTS = "community_posts";
const COMMENTS = "community_comments";
const LIKES = "community_likes";
const REPORTS = "community_reports";

const KINDS = ["writeup", "question", "announcement"];
const REPORT_REASONS = ["spam", "harassment", "spoiler", "off_topic", "unsafe", "other"];
const AUTO_HIDE_REPORTS = 5;
const PAGE_SIZE = 15;
const COMMENT_PAGE_SIZE = 50;
const EXCERPT_LENGTH = 420;

const LIMITS = {
    title: [5, 140],
    body: [10, 10000],
    comment: [1, 3000],
    details: [0, 500],
    tags: 5
};

const TAG_RE = /^[a-z0-9][a-z0-9-]{1,23}$/;

const ROLE_LABELS = {
    learner: "Learner",
    student: "Student",
    faculty: "Faculty",
    professional: "Professional",
    recruiter: "Recruiter"
};

class CommunityError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

const ensureCommunityIndexes = async () => {
    const db = getMongo();

    await Promise.all([
        db.collection(POSTS).createIndexes([
            { key: { status: 1, pinned: -1, createdAt: -1, _id: -1 }, name: "feed_latest" },
            { key: { status: 1, kind: 1, createdAt: -1, _id: -1 }, name: "feed_kind" },
            { key: { status: 1, likeCount: -1, _id: -1 }, name: "feed_top" },
            { key: { tags: 1, createdAt: -1 }, name: "by_tag" },
            { key: { authorKey: 1, createdAt: -1 }, name: "by_author" },
            { key: { openReports: -1 }, name: "moderation_queue", partialFilterExpression: { openReports: { $gt: 0 } } },
            {
                key: { title: "text", body: "text", tags: "text" },
                name: "search",
                weights: { title: 10, tags: 5, body: 1 },
                default_language: "english"
            }
        ]),
        db.collection(COMMENTS).createIndexes([
            { key: { postId: 1, createdAt: 1, _id: 1 }, name: "thread" },
            { key: { authorKey: 1, createdAt: -1 }, name: "by_author" },
            { key: { openReports: -1 }, name: "moderation_queue", partialFilterExpression: { openReports: { $gt: 0 } } }
        ]),
        db.collection(LIKES).createIndexes([
            { key: { postId: 1 }, name: "by_post" }
        ]),
        db.collection(REPORTS).createIndexes([
            { key: { targetType: 1, targetId: 1, resolvedAt: 1 }, name: "by_target" }
        ])
    ]);
};

// ---------- helpers ----------

const authorKeyOf = (account) => `${account.accountType}:${account.userId}`;
const adminKeyOf = (adminId) => `admin:${adminId}`;

const toObjectId = (value) => (ObjectId.isValid(value) && String(value).length === 24 ? new ObjectId(value) : null);

// Strip control characters (keep newlines and tabs), normalise line breaks
const cleanText = (value, { multiline }) => {
    let text = String(value || "").replace(/\r\n?/g, "\n");
    // eslint-disable-next-line no-control-regex
    text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F​-‏‪-‮⁦-⁩]/g, "");

    if (!multiline) {
        return text.replace(/\s+/g, " ").trim();
    }

    return text.replace(/[ \t]+\n/g, "\n").replace(/\n{4,}/g, "\n\n\n").trim();
};

const requireLength = (text, [min, max], label) => {
    if (text.length < min || text.length > max) {
        throw new CommunityError(400, `${label} must be ${min}–${max} characters`);
    }
};

// "sqli, #JWT  privesc" -> ["sqli", "jwt", "privesc"]
const parseTags = (value) => {
    const tags = [...new Set(
        String(value || "")
            .split(/[\s,]+/)
            .map((t) => t.replace(/^#/, "").toLowerCase())
            .filter(Boolean)
    )];

    if (tags.length > LIMITS.tags) {
        throw new CommunityError(400, `Use at most ${LIMITS.tags} tags`);
    }

    const bad = tags.find((t) => !TAG_RE.test(t));

    if (bad) {
        throw new CommunityError(400, `Invalid tag "${bad}": use 2–24 lowercase letters, digits or hyphens`);
    }

    return tags;
};

// Announcements come from staff, recruiters and faculty
const canAnnounce = (account) =>
    account.isAdmin || ["recruiter", "faculty"].includes(account.userType);

const validatePostInput = (account, input, { partial = false } = {}) => {
    const out = {};

    if (!partial || input.kind !== undefined) {
        const kind = String(input.kind || "").toLowerCase();

        if (!KINDS.includes(kind)) {
            throw new CommunityError(400, "Choose a post type: write-up, question or announcement");
        }

        if (kind === "announcement" && !canAnnounce(account)) {
            throw new CommunityError(403, "Only staff, recruiters and faculty can post announcements");
        }

        out.kind = kind;
    }

    if (!partial || input.title !== undefined) {
        out.title = cleanText(input.title, { multiline: false });
        requireLength(out.title, LIMITS.title, "Title");
    }

    if (!partial || input.body !== undefined) {
        out.body = cleanText(input.body, { multiline: true });
        requireLength(out.body, LIMITS.body, "Post");
    }

    if (!partial || input.tags !== undefined) {
        out.tags = parseTags(input.tags);
    }

    return out;
};

// Cursor = "<sortValue>_<objectId>", base64url so it is opaque to clients
const encodeCursor = (value, id) => Buffer.from(`${value}_${id}`).toString("base64url");

const decodeCursor = (cursor) => {
    if (!cursor) return null;

    try {
        const [value, id] = Buffer.from(String(cursor), "base64url").toString().split("_");
        const n = Number(value);
        const oid = toObjectId(id);
        return Number.isFinite(n) && oid ? { value: n, id: oid } : null;
    } catch {
        return null;
    }
};

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ---------- presenting ----------

const resolveAuthors = async (docs) => {
    const keys = docs
        .map((d) => d.authorKey)
        .filter((k) => !k.startsWith("admin:"))
        .map((k) => {
            const i = k.indexOf(":");
            return { accountType: k.slice(0, i), id: k.slice(i + 1) };
        });

    return findDisplayNames(keys);
};

const authorView = (key, names) => {
    if (key.startsWith("admin:")) {
        return { name: "CyberThulir Team", role: "Staff", staff: true };
    }

    const info = names.get(key);

    if (!info) {
        return { name: "deleted-account", role: null, staff: false };
    }

    return { name: info.username, role: ROLE_LABELS[info.userType] || "Member", staff: false };
};

const excerptOf = (body) =>
    body.length > EXCERPT_LENGTH ? `${body.slice(0, EXCERPT_LENGTH).replace(/\s+\S*$/, "")}…` : body;

const postView = (post, { viewerKey, names, liked, full }) => ({
    id: String(post._id),
    kind: post.kind,
    title: post.title,
    body: full ? post.body : excerptOf(post.body),
    truncated: !full && post.body.length > EXCERPT_LENGTH,
    tags: post.tags || [],
    author: authorView(post.authorKey, names),
    likeCount: post.likeCount || 0,
    commentCount: post.commentCount || 0,
    likedByMe: liked.has(String(post._id)),
    mine: post.authorKey === viewerKey,
    pinned: Boolean(post.pinned),
    status: post.status,
    createdAt: post.createdAt,
    editedAt: post.editedAt || null
});

const commentView = (comment, { viewerKey, names }) => ({
    id: String(comment._id),
    postId: String(comment.postId),
    body: comment.body,
    author: authorView(comment.authorKey, names),
    mine: comment.authorKey === viewerKey,
    status: comment.status,
    createdAt: comment.createdAt,
    editedAt: comment.editedAt || null
});

const presentPosts = async (posts, viewerKey, { full = false } = {}) => {
    if (!posts.length) return [];

    const [names, likes] = await Promise.all([
        resolveAuthors(posts),
        getMongo().collection(LIKES)
            .find({ _id: { $in: posts.map((p) => `${p._id}:${viewerKey}`) } }, { projection: { postId: 1 } })
            .toArray()
    ]);

    const liked = new Set(likes.map((l) => String(l.postId)));
    return posts.map((p) => postView(p, { viewerKey, names, liked, full }));
};

// Visible to everyone; hidden ones still visible to their own author
const visibleTo = (viewerKey) => ({
    $or: [{ status: "visible" }, { status: "hidden", authorKey: viewerKey }]
});

// ---------- feed ----------

const listPosts = async (account, query) => {
    const viewerKey = authorKeyOf(account);
    const sort = query.sort === "top" ? "top" : "latest";
    const kind = KINDS.includes(query.kind) ? query.kind : null;
    const tag = query.tag ? String(query.tag).replace(/^#/, "").toLowerCase() : null;
    const search = query.q ? cleanText(query.q, { multiline: false }).slice(0, 100) : "";
    const mine = query.mine === "1" || query.mine === "true";
    const cursor = decodeCursor(query.cursor);

    if (tag && !TAG_RE.test(tag)) {
        return { pinned: [], posts: [], nextCursor: null };
    }

    const filter = { $and: [visibleTo(viewerKey)] };

    if (kind) filter.$and.push({ kind });
    if (tag) filter.$and.push({ tags: tag });
    if (mine) filter.$and.push({ authorKey: viewerKey });

    if (search) {
        // $text needs whole words; fall back to a title prefix match for one short word
        filter.$and.push(
            search.length >= 3
                ? { $text: { $search: search } }
                : { title: { $regex: `^${escapeRegex(search)}`, $options: "i" } }
        );
    }

    // Pinned posts lead the plain latest feed (first page only) and are
    // left out of its later pages; every other view lists them inline
    const pinnedFeed = sort === "latest" && !tag && !search && !mine;
    const showPinned = pinnedFeed && !cursor;
    let pinnedDocs = [];

    if (showPinned) {
        pinnedDocs = await getMongo().collection(POSTS)
            .find({ $and: [...filter.$and, { pinned: true }] })
            .sort({ createdAt: -1 })
            .limit(5)
            .toArray();
    }

    const sortField = sort === "top" ? "likeCount" : "createdAt";
    const sortSpec = { [sortField]: -1, _id: -1 };

    if (pinnedFeed) {
        filter.$and.push({ pinned: { $ne: true } });
    }

    if (cursor) {
        const value = sort === "top" ? cursor.value : new Date(cursor.value);
        filter.$and.push({
            $or: [
                { [sortField]: { $lt: value } },
                { [sortField]: value, _id: { $lt: cursor.id } }
            ]
        });
    }

    const docs = await getMongo().collection(POSTS)
        .find(filter)
        .sort(sortSpec)
        .limit(PAGE_SIZE + 1)
        .toArray();

    const hasMore = docs.length > PAGE_SIZE;
    const page = docs.slice(0, PAGE_SIZE);
    const last = page[page.length - 1];
    const nextCursor = hasMore && last
        ? encodeCursor(sort === "top" ? last.likeCount || 0 : last.createdAt.getTime(), last._id)
        : null;

    const presented = await presentPosts([...pinnedDocs, ...page], viewerKey);

    return {
        pinned: presented.slice(0, pinnedDocs.length),
        posts: presented.slice(pinnedDocs.length),
        nextCursor
    };
};

const findPostFor = async (viewerKey, id) => {
    const _id = toObjectId(id);
    if (!_id) return null;
    return getMongo().collection(POSTS).findOne({ $and: [{ _id }, visibleTo(viewerKey)] });
};

const getPost = async (account, id) => {
    const viewerKey = authorKeyOf(account);
    const post = await findPostFor(viewerKey, id);

    if (!post) {
        throw new CommunityError(404, "Post not found");
    }

    const [view] = await presentPosts([post], viewerKey, { full: true });
    return view;
};

// ---------- posts: write ----------

const createPost = async (account, input) => {
    const fields = validatePostInput(account, input);
    const now = new Date();
    const authorKey = account.isAdmin ? adminKeyOf(account.adminId) : authorKeyOf(account);
    const doc = {
        _id: new ObjectId(),
        authorKey,
        authorType: account.isAdmin ? "admin" : account.accountType,
        authorId: account.isAdmin ? account.adminId : account.userId,
        ...fields,
        likeCount: 0,
        commentCount: 0,
        reportCount: 0,
        openReports: 0,
        status: "visible",
        pinned: Boolean(account.isAdmin && input.pinned === "true"),
        createdAt: now,
        lastActivityAt: now
    };

    await getMongo().collection(POSTS).insertOne(doc);

    const [view] = await presentPosts([doc], authorKey, { full: true });
    return view;
};

const ownPost = async (account, id) => {
    const _id = toObjectId(id);
    const post = _id
        ? await getMongo().collection(POSTS).findOne({ _id, authorKey: authorKeyOf(account), status: { $ne: "removed" } })
        : null;

    if (!post) {
        throw new CommunityError(404, "Post not found");
    }

    return post;
};

const updatePost = async (account, id, input) => {
    const post = await ownPost(account, id);
    const fields = validatePostInput(account, input, { partial: true });

    if (!Object.keys(fields).length) {
        throw new CommunityError(400, "Nothing to update");
    }

    const updated = await getMongo().collection(POSTS).findOneAndUpdate(
        { _id: post._id, status: { $ne: "removed" } },
        { $set: { ...fields, editedAt: new Date() } },
        { returnDocument: "after" }
    );

    if (!updated) {
        throw new CommunityError(404, "Post not found");
    }

    const [view] = await presentPosts([updated], authorKeyOf(account), { full: true });
    return view;
};

// Authors remove their own posts; the document stays for moderation history
const deletePost = async (account, id) => {
    const post = await ownPost(account, id);

    await getMongo().collection(POSTS).updateOne(
        { _id: post._id },
        { $set: { status: "removed", removedAt: new Date(), removedBy: "author", pinned: false } }
    );
};

// ---------- likes ----------

const likeState = async (postId, viewerKey) => {
    const post = await getMongo().collection(POSTS).findOne({ _id: postId }, { projection: { likeCount: 1 } });
    const liked = await getMongo().collection(LIKES).countDocuments({ _id: `${postId}:${viewerKey}` }, { limit: 1 });
    return { liked: liked > 0, likeCount: post ? post.likeCount || 0 : 0 };
};

const setLike = async (account, id, liked) => {
    const viewerKey = authorKeyOf(account);
    const post = await findPostFor(viewerKey, id);

    if (!post || post.status !== "visible") {
        throw new CommunityError(404, "Post not found");
    }

    const db = getMongo();
    const likeId = `${post._id}:${viewerKey}`;

    if (liked) {
        try {
            await db.collection(LIKES).insertOne({ _id: likeId, postId: post._id, authorKey: viewerKey, createdAt: new Date() });
            await db.collection(POSTS).updateOne({ _id: post._id }, { $inc: { likeCount: 1 } });
        } catch (error) {
            // Already liked: nothing to do
            if (!error || error.code !== 11000) throw error;
        }
    } else {
        const { deletedCount } = await db.collection(LIKES).deleteOne({ _id: likeId });
        if (deletedCount) {
            await db.collection(POSTS).updateOne({ _id: post._id, likeCount: { $gt: 0 } }, { $inc: { likeCount: -1 } });
        }
    }

    return likeState(post._id, viewerKey);
};

// ---------- comments ----------

const listComments = async (account, postId, cursorValue) => {
    const viewerKey = authorKeyOf(account);
    const post = await findPostFor(viewerKey, postId);

    if (!post) {
        throw new CommunityError(404, "Post not found");
    }

    const cursor = decodeCursor(cursorValue);
    const filter = { $and: [{ postId: post._id }, visibleTo(viewerKey)] };

    if (cursor) {
        const at = new Date(cursor.value);
        filter.$and.push({ $or: [{ createdAt: { $gt: at } }, { createdAt: at, _id: { $gt: cursor.id } }] });
    }

    const docs = await getMongo().collection(COMMENTS)
        .find(filter)
        .sort({ createdAt: 1, _id: 1 })
        .limit(COMMENT_PAGE_SIZE + 1)
        .toArray();

    const hasMore = docs.length > COMMENT_PAGE_SIZE;
    const page = docs.slice(0, COMMENT_PAGE_SIZE);
    const last = page[page.length - 1];
    const names = await resolveAuthors(page);

    return {
        comments: page.map((c) => commentView(c, { viewerKey, names })),
        nextCursor: hasMore && last ? encodeCursor(last.createdAt.getTime(), last._id) : null
    };
};

const addComment = async (account, postId, input) => {
    const viewerKey = authorKeyOf(account);
    const post = await findPostFor(viewerKey, postId);

    if (!post || post.status !== "visible") {
        throw new CommunityError(404, "Post not found");
    }

    const body = cleanText(input.body, { multiline: true });
    requireLength(body, LIMITS.comment, "Comment");

    const now = new Date();
    const doc = {
        _id: new ObjectId(),
        postId: post._id,
        authorKey: viewerKey,
        authorType: account.accountType,
        authorId: account.userId,
        body,
        status: "visible",
        reportCount: 0,
        openReports: 0,
        createdAt: now
    };

    const db = getMongo();
    await db.collection(COMMENTS).insertOne(doc);
    await db.collection(POSTS).updateOne({ _id: post._id }, { $inc: { commentCount: 1 }, $set: { lastActivityAt: now } });

    const names = await resolveAuthors([doc]);
    return commentView(doc, { viewerKey, names });
};

const ownComment = async (account, id) => {
    const _id = toObjectId(id);
    const comment = _id
        ? await getMongo().collection(COMMENTS).findOne({ _id, authorKey: authorKeyOf(account), status: { $ne: "removed" } })
        : null;

    if (!comment) {
        throw new CommunityError(404, "Comment not found");
    }

    return comment;
};

const updateComment = async (account, id, input) => {
    const comment = await ownComment(account, id);
    const body = cleanText(input.body, { multiline: true });
    requireLength(body, LIMITS.comment, "Comment");

    const updated = await getMongo().collection(COMMENTS).findOneAndUpdate(
        { _id: comment._id, status: { $ne: "removed" } },
        { $set: { body, editedAt: new Date() } },
        { returnDocument: "after" }
    );

    if (!updated) {
        throw new CommunityError(404, "Comment not found");
    }

    const names = await resolveAuthors([updated]);
    return commentView(updated, { viewerKey: authorKeyOf(account), names });
};

// Removing a visible comment takes it out of the post's count
const removeComment = async (filter, removedBy) => {
    const db = getMongo();
    const before = await db.collection(COMMENTS).findOneAndUpdate(
        { ...filter, status: { $ne: "removed" } },
        { $set: { status: "removed", removedAt: new Date(), removedBy } },
        { returnDocument: "before" }
    );

    if (before && before.status === "visible") {
        await db.collection(POSTS).updateOne(
            { _id: before.postId, commentCount: { $gt: 0 } },
            { $inc: { commentCount: -1 } }
        );
    }

    return before;
};

const deleteComment = async (account, id) => {
    const comment = await ownComment(account, id);
    await removeComment({ _id: comment._id }, "author");
};

// ---------- reports ----------

const report = async (account, targetType, id, input) => {
    const viewerKey = authorKeyOf(account);
    const collection = targetType === "post" ? POSTS : COMMENTS;
    const _id = toObjectId(id);
    const target = _id ? await getMongo().collection(collection).findOne({ _id, status: "visible" }) : null;

    if (!target) {
        throw new CommunityError(404, `${targetType === "post" ? "Post" : "Comment"} not found`);
    }

    if (target.authorKey === viewerKey) {
        throw new CommunityError(400, "You can't report your own content");
    }

    const reason = String(input.reason || "").toLowerCase();

    if (!REPORT_REASONS.includes(reason)) {
        throw new CommunityError(400, "Choose a reason for the report");
    }

    const details = cleanText(input.details, { multiline: true });
    requireLength(details, LIMITS.details, "Details");

    const db = getMongo();

    try {
        await db.collection(REPORTS).insertOne({
            _id: `${targetType}:${target._id}:${viewerKey}`,
            targetType,
            targetId: target._id,
            postId: targetType === "post" ? target._id : target.postId,
            authorKey: viewerKey,
            reason,
            details,
            createdAt: new Date(),
            resolvedAt: null
        });
    } catch (error) {
        // Reported before: count it once
        if (error && error.code === 11000) return { reported: true };
        throw error;
    }

    const updated = await db.collection(collection).findOneAndUpdate(
        { _id: target._id },
        { $inc: { reportCount: 1, openReports: 1 } },
        { returnDocument: "after" }
    );

    // Enough independent reports hide it until a moderator looks
    if (updated && updated.openReports >= AUTO_HIDE_REPORTS && updated.status === "visible") {
        if (targetType === "comment") {
            const hidden = await db.collection(COMMENTS).findOneAndUpdate(
                { _id: target._id, status: "visible" },
                { $set: { status: "hidden", hiddenAt: new Date() } }
            );
            if (hidden) {
                await db.collection(POSTS).updateOne({ _id: target.postId, commentCount: { $gt: 0 } }, { $inc: { commentCount: -1 } });
            }
        } else {
            await db.collection(POSTS).updateOne(
                { _id: target._id, status: "visible" },
                { $set: { status: "hidden", hiddenAt: new Date() } }
            );
        }
    }

    return { reported: true };
};

// ---------- sidebar ----------

let highlightsCache = { at: 0, value: null };
const HIGHLIGHTS_TTL_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const sharedHighlights = async () => {
    if (highlightsCache.value && Date.now() - highlightsCache.at < HIGHLIGHTS_TTL_MS) {
        return highlightsCache.value;
    }

    const db = getMongo();
    const since14 = new Date(Date.now() - 14 * DAY_MS);
    const since30 = new Date(Date.now() - 30 * DAY_MS);

    const [tags, contributors, totals] = await Promise.all([
        db.collection(POSTS).aggregate([
            { $match: { status: "visible", createdAt: { $gte: since14 } } },
            { $unwind: "$tags" },
            { $group: { _id: "$tags", count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } },
            { $limit: 10 }
        ]).toArray(),
        db.collection(POSTS).aggregate([
            { $match: { status: "visible", createdAt: { $gte: since30 }, authorType: { $ne: "admin" } } },
            { $group: { _id: "$authorKey", posts: { $sum: 1 }, likes: { $sum: "$likeCount" } } },
            { $addFields: { score: { $add: [{ $multiply: ["$posts", 3] }, "$likes"] } } },
            { $sort: { score: -1, posts: -1 } },
            { $limit: 5 }
        ]).toArray(),
        db.collection(POSTS).aggregate([
            { $match: { status: "visible" } },
            { $group: { _id: null, posts: { $sum: 1 }, comments: { $sum: "$commentCount" } } }
        ]).toArray()
    ]);

    const names = await resolveAuthors(contributors.map((c) => ({ authorKey: c._id })));

    const value = {
        trendingTags: tags.map((t) => ({ tag: t._id, count: t.count })),
        topContributors: contributors
            .map((c) => ({ ...authorView(c._id, names), posts: c.posts, likes: c.likes }))
            .filter((c) => c.role !== null),
        totals: totals[0] ? { posts: totals[0].posts, comments: totals[0].comments } : { posts: 0, comments: 0 }
    };

    highlightsCache = { at: Date.now(), value };
    return value;
};

const getHighlights = async (account) => {
    const viewerKey = authorKeyOf(account);
    const db = getMongo();

    const [shared, mine, comments] = await Promise.all([
        sharedHighlights(),
        db.collection(POSTS).aggregate([
            { $match: { authorKey: viewerKey, status: { $ne: "removed" } } },
            { $group: { _id: null, posts: { $sum: 1 }, likes: { $sum: "$likeCount" } } }
        ]).toArray(),
        db.collection(COMMENTS).countDocuments({ authorKey: viewerKey, status: { $ne: "removed" } })
    ]);

    return {
        ...shared,
        me: {
            posts: mine[0] ? mine[0].posts : 0,
            likesReceived: mine[0] ? mine[0].likes : 0,
            comments,
            canAnnounce: canAnnounce(account)
        }
    };
};

// ---------- moderation (admins) ----------

const moderationQueue = async () => {
    const db = getMongo();
    const filter = { openReports: { $gt: 0 } };

    const [posts, comments] = await Promise.all([
        db.collection(POSTS).find(filter).sort({ openReports: -1, createdAt: -1 }).limit(50).toArray(),
        db.collection(COMMENTS).find(filter).sort({ openReports: -1, createdAt: -1 }).limit(50).toArray()
    ]);

    const targets = [...posts.map((p) => ({ type: "post", doc: p })), ...comments.map((c) => ({ type: "comment", doc: c }))];
    const reasons = targets.length
        ? await db.collection(REPORTS).aggregate([
            { $match: { targetId: { $in: targets.map((t) => t.doc._id) }, resolvedAt: null } },
            { $group: { _id: { id: "$targetId", reason: "$reason" }, count: { $sum: 1 }, details: { $push: "$details" } } }
        ]).toArray()
        : [];

    const names = await resolveAuthors(targets.map((t) => t.doc));

    return targets.map(({ type, doc }) => ({
        type,
        id: String(doc._id),
        postId: String(type === "post" ? doc._id : doc.postId),
        title: doc.title || null,
        body: doc.body,
        status: doc.status,
        author: authorView(doc.authorKey, names),
        authorKey: doc.authorKey,
        openReports: doc.openReports,
        reasons: reasons
            .filter((r) => String(r._id.id) === String(doc._id))
            .map((r) => ({ reason: r._id.reason, count: r.count, details: r.details.filter(Boolean).slice(0, 5) })),
        createdAt: doc.createdAt
    }));
};

const resolveReports = (targetId, adminId) =>
    getMongo().collection(REPORTS).updateMany(
        { targetId, resolvedAt: null },
        { $set: { resolvedAt: new Date(), resolvedBy: adminId } }
    );

const moderatePost = async (adminId, id, action) => {
    const _id = toObjectId(id);
    const db = getMongo();
    const post = _id ? await db.collection(POSTS).findOne({ _id }) : null;

    if (!post) {
        throw new CommunityError(404, "Post not found");
    }

    const updates = {
        remove: { $set: { status: "removed", removedAt: new Date(), removedBy: `admin:${adminId}`, pinned: false, openReports: 0 } },
        restore: { $set: { status: "visible", openReports: 0 }, $unset: { hiddenAt: "", removedAt: "", removedBy: "" } },
        dismiss: { $set: { openReports: 0 } },
        pin: { $set: { pinned: true } },
        unpin: { $set: { pinned: false } }
    };

    if (!updates[action]) {
        throw new CommunityError(400, "Unknown action");
    }

    if (action === "pin" && post.status !== "visible") {
        throw new CommunityError(409, "Only visible posts can be pinned");
    }

    await db.collection(POSTS).updateOne({ _id }, updates[action]);

    if (["remove", "restore", "dismiss"].includes(action)) {
        await resolveReports(_id, adminId);
    }

    highlightsCache = { at: 0, value: null };
    return { id: String(_id), action };
};

const moderateComment = async (adminId, id, action) => {
    const _id = toObjectId(id);
    const db = getMongo();
    const comment = _id ? await db.collection(COMMENTS).findOne({ _id }) : null;

    if (!comment) {
        throw new CommunityError(404, "Comment not found");
    }

    if (action === "remove") {
        await removeComment({ _id }, `admin:${adminId}`);
        await db.collection(COMMENTS).updateOne({ _id }, { $set: { openReports: 0 } });
    } else if (action === "restore") {
        const before = await db.collection(COMMENTS).findOneAndUpdate(
            { _id },
            { $set: { status: "visible", openReports: 0 }, $unset: { hiddenAt: "", removedAt: "", removedBy: "" } },
            { returnDocument: "before" }
        );
        if (before && before.status !== "visible") {
            await db.collection(POSTS).updateOne({ _id: before.postId }, { $inc: { commentCount: 1 } });
        }
    } else if (action === "dismiss") {
        await db.collection(COMMENTS).updateOne({ _id }, { $set: { openReports: 0 } });
    } else {
        throw new CommunityError(400, "Unknown action");
    }

    await resolveReports(_id, adminId);
    return { id: String(_id), action };
};

module.exports = {
    cleanText,
    toObjectId,
    KINDS,
    REPORT_REASONS,
    CommunityError,
    ensureCommunityIndexes,
    listPosts,
    getPost,
    createPost,
    updatePost,
    deletePost,
    setLike,
    listComments,
    addComment,
    updateComment,
    deleteComment,
    report,
    getHighlights,
    moderationQueue,
    moderatePost,
    moderateComment
};
