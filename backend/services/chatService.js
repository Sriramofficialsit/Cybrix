const crypto = require("crypto");
const { ObjectId } = require("mongodb");

const { getMongo } = require("../config/mongodb");
const { findDisplayNames, findAccountByUsername } = require("./accountService");
const { cleanText, toObjectId } = require("./communityService");
const realtime = require("./realtime");

// Discord-style chat: groups with text channels, direct messages, replies,
// reactions and real-time delivery (services/realtime.js).
//
// chat_groups:   { _id, name, description, visibility: "public"|"private",
//                  ownerKey, memberCount, inviteCode, createdAt, updatedAt }
// chat_members:  { _id, groupId, memberKey, uid, role: "owner"|"moderator"|"member", joinedAt }
// chat_bans:     { _id, groupId, memberKey, uid, name, bannedBy, at }
// chat_channels: { _id, groupId, name, topic, position, createdAt, lastMessageAt }
// chat_dms:      { _id, pairKey: "<keyA>|<keyB>" (sorted), participants: [a, b], createdAt, lastMessageAt }
// chat_messages: { _id, roomType: "channel"|"dm", roomId, groupId?, authorKey, body,
//                  replyTo: { id, authorKey, excerpt }?, sharedPost: { id, title, kind }?,
//                  reactions: [{ emoji, keys: [] }], createdAt, editedAt, deleted }
// chat_reads:    { _id: "<roomId>:<memberKey>", lastReadAt }
// chat_blocks:   { _id: "<blockerKey>|<blockedKey>", at }
//
// Accounts are never exposed by id: every account is shown as a "uid",
// a one-way hash of its key, which is stable and safe to put in URLs.

const C = {
    groups: "chat_groups",
    members: "chat_members",
    bans: "chat_bans",
    channels: "chat_channels",
    dms: "chat_dms",
    messages: "chat_messages",
    reads: "chat_reads",
    blocks: "chat_blocks"
};

const LIMITS = {
    groupName: [3, 40],
    groupDescription: [0, 300],
    channelName: [2, 30],
    channelTopic: [0, 200],
    message: [1, 2000],
    ownedGroups: 10,
    joinedGroups: 100,
    groupMembers: 2000,
    channelsPerGroup: 30
};

const PAGE = 50;
const REACTIONS = ["👍", "❤️", "😂", "🎉", "🔥", "🤔", "👀", "✅"];
const ROLE_RANK = { member: 0, moderator: 1, owner: 2 };

class ChatError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

const ensureChatIndexes = async () => {
    const db = getMongo();

    await Promise.all([
        db.collection(C.groups).createIndexes([
            { key: { inviteCode: 1 }, name: "invite_unique", unique: true },
            { key: { visibility: 1, memberCount: -1 }, name: "discover" },
            { key: { name: "text", description: "text" }, name: "search" }
        ]),
        db.collection(C.members).createIndexes([
            { key: { groupId: 1, memberKey: 1 }, name: "member_unique", unique: true },
            { key: { groupId: 1, uid: 1 }, name: "by_uid" },
            { key: { memberKey: 1, joinedAt: 1 }, name: "my_groups" }
        ]),
        db.collection(C.bans).createIndexes([
            { key: { groupId: 1, memberKey: 1 }, name: "ban_unique", unique: true }
        ]),
        db.collection(C.channels).createIndexes([
            { key: { groupId: 1, position: 1 }, name: "by_group" }
        ]),
        db.collection(C.dms).createIndexes([
            { key: { pairKey: 1 }, name: "pair_unique", unique: true },
            { key: { participants: 1, lastMessageAt: -1 }, name: "my_dms" }
        ]),
        db.collection(C.messages).createIndexes([
            { key: { roomId: 1, _id: -1 }, name: "history" },
            { key: { groupId: 1 }, name: "by_group", partialFilterExpression: { groupId: { $exists: true } } }
        ])
    ]);
};

// ---------- identity ----------

const keyOf = (account) => `${account.accountType}:${account.userId}`;
const uidOf = (key) => crypto.createHash("sha256").update(`chat:${key}`).digest("hex").slice(0, 16);

const splitKey = (key) => {
    const i = key.indexOf(":");
    return { accountType: key.slice(0, i), id: key.slice(i + 1) };
};

const namesFor = async (keys) => findDisplayNames([...new Set(keys)].map(splitKey));

const personView = (key, names) => {
    const info = names.get(key);
    return { uid: uidOf(key), name: info ? info.username : "deleted-account" };
};

const newInviteCode = () => crypto.randomBytes(6).toString("base64url");

// ---------- validation ----------

const requireLength = (text, [min, max], label) => {
    if (text.length < min || text.length > max) {
        throw new ChatError(400, min === 0 ? `${label} can be at most ${max} characters` : `${label} must be ${min}–${max} characters`);
    }
};

const cleanName = (value, limits, label) => {
    const text = cleanText(value, { multiline: false });
    requireLength(text, limits, label);
    return text;
};

// Channel names look like Discord's: lowercase, hyphens instead of spaces
const cleanChannelName = (value) => {
    const name = String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9_-]/g, "")
        .replace(/-{2,}/g, "-")
        .replace(/^-|-$/g, "");
    requireLength(name, LIMITS.channelName, "Channel name");
    return name;
};

const id = (value, what) => {
    const oid = toObjectId(value);
    if (!oid) throw new ChatError(404, `${what} not found`);
    return oid;
};

// ---------- membership and permissions ----------

const getMembership = (groupId, memberKey) =>
    getMongo().collection(C.members).findOne({ groupId, memberKey });

// Loads the group and the caller's membership; 404 unless they are a member
const requireMember = async (account, groupIdValue) => {
    const groupId = id(groupIdValue, "Group");
    const [group, membership] = await Promise.all([
        getMongo().collection(C.groups).findOne({ _id: groupId }),
        getMembership(groupId, keyOf(account))
    ]);

    if (!group || !membership) {
        throw new ChatError(404, "Group not found");
    }

    return { group, membership };
};

const requireRole = (membership, role) => {
    if (ROLE_RANK[membership.role] < ROLE_RANK[role]) {
        throw new ChatError(403, role === "owner" ? "Only the group owner can do that" : "Only moderators can do that");
    }
};

const memberKeysOf = async (groupId) =>
    (await getMongo().collection(C.members).find({ groupId }, { projection: { memberKey: 1 } }).toArray())
        .map((m) => m.memberKey);

const notifyGroup = async (groupId, event) => publishTo(await memberKeysOf(groupId), event);
const publishTo = (keys, event) => realtime.publish(keys, event);

// ---------- rooms (a channel or a DM) ----------

// Resolves a room and checks the caller can use it.
// Returns { roomType, room, group?, membership?, keys() }
const requireRoom = async (account, roomType, roomIdValue) => {
    const me = keyOf(account);
    const roomId = id(roomIdValue, "Conversation");
    const db = getMongo();

    if (roomType === "channel") {
        const channel = await db.collection(C.channels).findOne({ _id: roomId });
        if (!channel) throw new ChatError(404, "Channel not found");

        const { group, membership } = await requireMember(account, channel.groupId);

        return {
            roomType,
            room: channel,
            group,
            membership,
            keys: () => memberKeysOf(group._id)
        };
    }

    if (roomType === "dm") {
        const dm = await db.collection(C.dms).findOne({ _id: roomId, participants: me });
        if (!dm) throw new ChatError(404, "Conversation not found");

        return { roomType, room: dm, keys: async () => dm.participants };
    }

    throw new ChatError(404, "Conversation not found");
};

// ---------- presenting ----------

const reactionsView = (reactions, names) =>
    (reactions || [])
        .filter((r) => r.keys.length)
        .map((r) => ({ emoji: r.emoji, users: r.keys.map((k) => personView(k, names)) }));

const messageView = (m, names) => ({
    id: String(m._id),
    roomType: m.roomType,
    roomId: String(m.roomId),
    author: personView(m.authorKey, names),
    body: m.deleted ? "" : m.body,
    deleted: Boolean(m.deleted),
    replyTo: m.replyTo && !m.deleted
        ? { id: String(m.replyTo.id), author: personView(m.replyTo.authorKey, names), excerpt: m.replyTo.excerpt }
        : null,
    sharedPost: m.deleted ? null : m.sharedPost || null,
    reactions: m.deleted ? [] : reactionsView(m.reactions, names),
    createdAt: m.createdAt,
    editedAt: m.editedAt || null
});

const presentMessages = async (messages) => {
    const keys = messages.flatMap((m) => [
        m.authorKey,
        ...(m.replyTo ? [m.replyTo.authorKey] : []),
        ...(m.reactions || []).flatMap((r) => r.keys)
    ]);
    const names = await namesFor(keys);
    return messages.map((m) => messageView(m, names));
};

const groupView = (g, membership) => ({
    id: String(g._id),
    name: g.name,
    description: g.description,
    visibility: g.visibility,
    memberCount: g.memberCount,
    role: membership ? membership.role : null,
    inviteCode: membership && ROLE_RANK[membership.role] >= ROLE_RANK.moderator ? g.inviteCode : null,
    createdAt: g.createdAt
});

const channelView = (ch, unread = 0) => ({
    id: String(ch._id),
    groupId: String(ch.groupId),
    name: ch.name,
    topic: ch.topic || "",
    position: ch.position,
    lastMessageAt: ch.lastMessageAt || null,
    unread
});

// ---------- unread ----------

const readsFor = async (memberKey, roomIds) => {
    if (!roomIds.length) return new Map();
    const rows = await getMongo().collection(C.reads)
        .find({ _id: { $in: roomIds.map((r) => `${r}:${memberKey}`) } })
        .toArray();
    return new Map(rows.map((r) => [r._id.slice(0, r._id.indexOf(":")), r.lastReadAt]));
};

// Messages from others since the last read, capped at 99
const unreadCount = (roomId, memberKey, lastReadAt) =>
    getMongo().collection(C.messages).countDocuments(
        {
            roomId,
            authorKey: { $ne: memberKey },
            deleted: { $ne: true },
            ...(lastReadAt ? { createdAt: { $gt: lastReadAt } } : {})
        },
        { limit: 99 }
    );

// ---------- overview ----------

// GET /api/chat/me - the sidebar: my groups and DMs with unread flags
const getOverview = async (account) => {
    const me = keyOf(account);
    const db = getMongo();

    const [memberships, dms, names] = await Promise.all([
        db.collection(C.members).find({ memberKey: me }).sort({ joinedAt: 1 }).toArray(),
        db.collection(C.dms).find({ participants: me }).sort({ lastMessageAt: -1 }).limit(50).toArray(),
        namesFor([me])
    ]);

    const groupIds = memberships.map((m) => m.groupId);
    const [groups, channels] = await Promise.all([
        db.collection(C.groups).find({ _id: { $in: groupIds } }).toArray(),
        db.collection(C.channels).find({ groupId: { $in: groupIds } }, { projection: { groupId: 1, lastMessageAt: 1 } }).toArray()
    ]);

    const reads = await readsFor(me, [...channels.map((c) => String(c._id)), ...dms.map((d) => String(d._id))]);
    const isUnread = (roomId, lastMessageAt) => {
        const read = reads.get(String(roomId));
        return Boolean(lastMessageAt && (!read || lastMessageAt > read));
    };

    const groupById = new Map(groups.map((g) => [String(g._id), g]));
    const otherKeys = dms.map((d) => d.participants.find((p) => p !== me) || me);
    const dmNames = await namesFor(otherKeys);

    const dmViews = await Promise.all(dms.map(async (d, i) => {
        const lastRead = reads.get(String(d._id));
        const unread = isUnread(d._id, d.lastMessageAt) ? await unreadCount(d._id, me, lastRead) : 0;
        return {
            id: String(d._id),
            other: { ...personView(otherKeys[i], dmNames), online: realtime.isOnline(otherKeys[i]) },
            lastMessageAt: d.lastMessageAt || null,
            unread
        };
    }));

    return {
        me: personView(me, names),
        reactions: REACTIONS,
        groups: memberships
            .filter((m) => groupById.has(String(m.groupId)))
            .map((m) => ({
                ...groupView(groupById.get(String(m.groupId)), m),
                unread: channels.some((c) => String(c.groupId) === String(m.groupId) && isUnread(c._id, c.lastMessageAt))
            })),
        dms: dmViews
    };
};

// ---------- groups ----------

const createGroup = async (account, input) => {
    const me = keyOf(account);
    const db = getMongo();
    const name = cleanName(input.name, LIMITS.groupName, "Group name");
    const description = cleanText(input.description, { multiline: true });
    requireLength(description, LIMITS.groupDescription, "Description");
    const visibility = input.visibility === "private" ? "private" : "public";

    const [owned, joined] = await Promise.all([
        db.collection(C.members).countDocuments({ memberKey: me, role: "owner" }),
        db.collection(C.members).countDocuments({ memberKey: me })
    ]);

    if (owned >= LIMITS.ownedGroups) {
        throw new ChatError(409, `You can own at most ${LIMITS.ownedGroups} groups`);
    }
    if (joined >= LIMITS.joinedGroups) {
        throw new ChatError(409, `You can be in at most ${LIMITS.joinedGroups} groups`);
    }

    const now = new Date();
    const group = {
        _id: new ObjectId(),
        name,
        description,
        visibility,
        ownerKey: me,
        memberCount: 1,
        inviteCode: newInviteCode(),
        createdAt: now,
        updatedAt: now
    };
    const membership = { _id: new ObjectId(), groupId: group._id, memberKey: me, uid: uidOf(me), role: "owner", joinedAt: now };

    await db.collection(C.groups).insertOne(group);
    await Promise.all([
        db.collection(C.members).insertOne(membership),
        db.collection(C.channels).insertOne({ _id: new ObjectId(), groupId: group._id, name: "general", topic: "Say hello 👋", position: 0, createdAt: now })
    ]);

    return groupView(group, membership);
};

// GET /groups/:id - group, channels with unread counts, my role.
// Public groups can be previewed (no channels) before joining.
const getGroup = async (account, groupIdValue) => {
    const me = keyOf(account);
    const db = getMongo();
    const groupId = id(groupIdValue, "Group");
    const [group, membership] = await Promise.all([
        db.collection(C.groups).findOne({ _id: groupId }),
        getMembership(groupId, me)
    ]);

    if (!group || (!membership && group.visibility !== "public")) {
        throw new ChatError(404, "Group not found");
    }

    if (!membership) {
        return { group: groupView(group, null), channels: [], member: false };
    }

    const channels = await db.collection(C.channels).find({ groupId }).sort({ position: 1, _id: 1 }).toArray();
    const reads = await readsFor(me, channels.map((c) => String(c._id)));
    const counts = await Promise.all(channels.map((c) => {
        const read = reads.get(String(c._id));
        return c.lastMessageAt && (!read || c.lastMessageAt > read) ? unreadCount(c._id, me, read) : 0;
    }));

    return {
        group: groupView(group, membership),
        channels: channels.map((c, i) => channelView(c, counts[i])),
        member: true
    };
};

const updateGroup = async (account, groupIdValue, input) => {
    const { group, membership } = await requireMember(account, groupIdValue);
    requireRole(membership, "moderator");

    const set = { updatedAt: new Date() };

    if (input.name !== undefined) set.name = cleanName(input.name, LIMITS.groupName, "Group name");
    if (input.description !== undefined) {
        set.description = cleanText(input.description, { multiline: true });
        requireLength(set.description, LIMITS.groupDescription, "Description");
    }
    if (input.visibility !== undefined) {
        requireRole(membership, "owner");
        set.visibility = input.visibility === "private" ? "private" : "public";
    }

    const updated = await getMongo().collection(C.groups).findOneAndUpdate({ _id: group._id }, { $set: set }, { returnDocument: "after" });
    await notifyGroup(group._id, { type: "group.updated", groupId: String(group._id) });
    return groupView(updated, membership);
};

const deleteGroup = async (account, groupIdValue) => {
    const { group, membership } = await requireMember(account, groupIdValue);
    requireRole(membership, "owner");

    const db = getMongo();
    const keys = await memberKeysOf(group._id);
    const channelIds = (await db.collection(C.channels).find({ groupId: group._id }, { projection: { _id: 1 } }).toArray()).map((c) => c._id);

    await db.collection(C.groups).deleteOne({ _id: group._id });
    await Promise.all([
        db.collection(C.members).deleteMany({ groupId: group._id }),
        db.collection(C.bans).deleteMany({ groupId: group._id }),
        db.collection(C.channels).deleteMany({ groupId: group._id }),
        db.collection(C.messages).deleteMany({ groupId: group._id }),
        db.collection(C.reads).deleteMany({ _id: { $in: keys.flatMap((k) => channelIds.map((c) => `${c}:${k}`)) } })
    ]);

    publishTo(keys, { type: "group.removed", groupId: String(group._id) });
};

const discoverGroups = async (account, q) => {
    const me = keyOf(account);
    const db = getMongo();
    const search = cleanText(q, { multiline: false }).slice(0, 60);
    const filter = { visibility: "public" };

    if (search.length >= 3) {
        filter.$text = { $search: search };
    } else if (search) {
        filter.name = { $regex: `^${search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, $options: "i" };
    }

    const groups = await db.collection(C.groups).find(filter).sort({ memberCount: -1, _id: -1 }).limit(30).toArray();
    const mine = await db.collection(C.members)
        .find({ memberKey: me, groupId: { $in: groups.map((g) => g._id) } }, { projection: { groupId: 1 } })
        .toArray();
    const joined = new Set(mine.map((m) => String(m.groupId)));

    return groups.map((g) => ({ ...groupView(g, null), joined: joined.has(String(g._id)) }));
};

const addMember = async (account, group) => {
    const me = keyOf(account);
    const db = getMongo();

    if (await db.collection(C.bans).findOne({ groupId: group._id, memberKey: me })) {
        throw new ChatError(403, "You've been banned from this group");
    }

    const existing = await getMembership(group._id, me);
    if (existing) return groupView(group, existing);

    if (group.memberCount >= LIMITS.groupMembers) {
        throw new ChatError(409, "This group is full");
    }
    if (await db.collection(C.members).countDocuments({ memberKey: me }) >= LIMITS.joinedGroups) {
        throw new ChatError(409, `You can be in at most ${LIMITS.joinedGroups} groups`);
    }

    const membership = { _id: new ObjectId(), groupId: group._id, memberKey: me, uid: uidOf(me), role: "member", joinedAt: new Date() };

    try {
        await db.collection(C.members).insertOne(membership);
    } catch (error) {
        if (error && error.code === 11000) return groupView(group, await getMembership(group._id, me));
        throw error;
    }

    const updated = await db.collection(C.groups).findOneAndUpdate({ _id: group._id }, { $inc: { memberCount: 1 } }, { returnDocument: "after" });
    await notifyGroup(group._id, { type: "members.changed", groupId: String(group._id) });
    return groupView(updated || group, membership);
};

const joinPublic = async (account, groupIdValue) => {
    const groupId = id(groupIdValue, "Group");
    const group = await getMongo().collection(C.groups).findOne({ _id: groupId, visibility: "public" });
    if (!group) throw new ChatError(404, "Group not found");
    return addMember(account, group);
};

const findByInvite = async (code) => {
    const value = String(code || "").trim();
    if (!/^[A-Za-z0-9_-]{8}$/.test(value)) return null;
    return getMongo().collection(C.groups).findOne({ inviteCode: value });
};

const previewInvite = async (account, code) => {
    const group = await findByInvite(code);
    if (!group) throw new ChatError(404, "This invite link is invalid or has been reset");
    const membership = await getMembership(group._id, keyOf(account));
    return { ...groupView(group, null), joined: Boolean(membership) };
};

const joinByInvite = async (account, code) => {
    const group = await findByInvite(code);
    if (!group) throw new ChatError(404, "This invite link is invalid or has been reset");
    return addMember(account, group);
};

const resetInvite = async (account, groupIdValue) => {
    const { group, membership } = await requireMember(account, groupIdValue);
    requireRole(membership, "moderator");
    const updated = await getMongo().collection(C.groups).findOneAndUpdate(
        { _id: group._id },
        { $set: { inviteCode: newInviteCode() } },
        { returnDocument: "after" }
    );
    return groupView(updated, membership);
};

const removeMembership = async (group, memberKey) => {
    const db = getMongo();
    const { deletedCount } = await db.collection(C.members).deleteOne({ groupId: group._id, memberKey });
    if (deletedCount) {
        await db.collection(C.groups).updateOne({ _id: group._id }, { $inc: { memberCount: -1 } });
    }
    return deletedCount > 0;
};

const leaveGroup = async (account, groupIdValue) => {
    const { group, membership } = await requireMember(account, groupIdValue);

    if (membership.role === "owner") {
        throw new ChatError(409, "Transfer ownership to another member, or delete the group, before leaving");
    }

    await removeMembership(group, membership.memberKey);
    await notifyGroup(group._id, { type: "members.changed", groupId: String(group._id) });
};

// ---------- members ----------

const listMembers = async (account, groupIdValue) => {
    const { group } = await requireMember(account, groupIdValue);
    const members = await getMongo().collection(C.members)
        .find({ groupId: group._id })
        .sort({ joinedAt: 1 })
        .limit(LIMITS.groupMembers)
        .toArray();
    const names = await namesFor(members.map((m) => m.memberKey));

    return members
        .map((m) => ({
            ...personView(m.memberKey, names),
            role: m.role,
            online: realtime.isOnline(m.memberKey),
            joinedAt: m.joinedAt
        }))
        .sort((a, b) => ROLE_RANK[b.role] - ROLE_RANK[a.role] || Number(b.online) - Number(a.online) || a.name.localeCompare(b.name));
};

// Loads the target member by uid and checks the actor outranks them
const requireTarget = async (actor, group, uid) => {
    const target = await getMongo().collection(C.members).findOne({ groupId: group._id, uid: String(uid || "") });

    if (!target) throw new ChatError(404, "Member not found");
    if (target.memberKey === actor.memberKey) throw new ChatError(400, "You can't do that to yourself");
    if (ROLE_RANK[actor.role] <= ROLE_RANK[target.role]) {
        throw new ChatError(403, "You can only manage members below your role");
    }

    return target;
};

const setRole = async (account, groupIdValue, uid, role) => {
    const { group, membership } = await requireMember(account, groupIdValue);
    requireRole(membership, "owner");

    if (!["moderator", "member"].includes(role)) throw new ChatError(400, "Role must be moderator or member");

    const target = await requireTarget(membership, group, uid);
    await getMongo().collection(C.members).updateOne({ _id: target._id }, { $set: { role } });
    await notifyGroup(group._id, { type: "members.changed", groupId: String(group._id) });
};

const transferOwnership = async (account, groupIdValue, uid) => {
    const { group, membership } = await requireMember(account, groupIdValue);
    requireRole(membership, "owner");

    const target = await requireTarget(membership, group, uid);
    const db = getMongo();

    await db.collection(C.members).updateOne({ _id: target._id }, { $set: { role: "owner" } });
    await db.collection(C.members).updateOne({ _id: membership._id }, { $set: { role: "moderator" } });
    await db.collection(C.groups).updateOne({ _id: group._id }, { $set: { ownerKey: target.memberKey } });
    await notifyGroup(group._id, { type: "members.changed", groupId: String(group._id) });
};

const kick = async (account, groupIdValue, uid, { ban }) => {
    const { group, membership } = await requireMember(account, groupIdValue);
    requireRole(membership, "moderator");

    const target = await requireTarget(membership, group, uid);
    const db = getMongo();

    if (ban) {
        const names = await namesFor([target.memberKey]);
        await db.collection(C.bans).updateOne(
            { groupId: group._id, memberKey: target.memberKey },
            { $set: { uid: target.uid, name: personView(target.memberKey, names).name, bannedBy: membership.memberKey, at: new Date() } },
            { upsert: true }
        );
    }

    await removeMembership(group, target.memberKey);
    publishTo([target.memberKey], { type: "group.removed", groupId: String(group._id), reason: ban ? "banned" : "kicked" });
    await notifyGroup(group._id, { type: "members.changed", groupId: String(group._id) });
};

const listBans = async (account, groupIdValue) => {
    const { group, membership } = await requireMember(account, groupIdValue);
    requireRole(membership, "moderator");
    const bans = await getMongo().collection(C.bans).find({ groupId: group._id }).sort({ at: -1 }).limit(500).toArray();
    return bans.map((b) => ({ uid: b.uid, name: b.name, at: b.at }));
};

const unban = async (account, groupIdValue, uid) => {
    const { group, membership } = await requireMember(account, groupIdValue);
    requireRole(membership, "moderator");
    const { deletedCount } = await getMongo().collection(C.bans).deleteOne({ groupId: group._id, uid: String(uid || "") });
    if (!deletedCount) throw new ChatError(404, "Ban not found");
};

// ---------- channels ----------

const createChannel = async (account, groupIdValue, input) => {
    const { group, membership } = await requireMember(account, groupIdValue);
    requireRole(membership, "moderator");

    const db = getMongo();
    const existing = await db.collection(C.channels).find({ groupId: group._id }).toArray();

    if (existing.length >= LIMITS.channelsPerGroup) {
        throw new ChatError(409, `A group can have at most ${LIMITS.channelsPerGroup} channels`);
    }

    const name = cleanChannelName(input.name);
    if (existing.some((c) => c.name === name)) throw new ChatError(409, `#${name} already exists`);

    const topic = cleanText(input.topic, { multiline: false });
    requireLength(topic, LIMITS.channelTopic, "Topic");

    const channel = {
        _id: new ObjectId(),
        groupId: group._id,
        name,
        topic,
        position: existing.reduce((max, c) => Math.max(max, c.position), -1) + 1,
        createdAt: new Date()
    };

    await db.collection(C.channels).insertOne(channel);
    await notifyGroup(group._id, { type: "group.updated", groupId: String(group._id) });
    return channelView(channel);
};

const requireChannelMod = async (account, channelIdValue) => {
    const channelId = id(channelIdValue, "Channel");
    const channel = await getMongo().collection(C.channels).findOne({ _id: channelId });
    if (!channel) throw new ChatError(404, "Channel not found");

    const { group, membership } = await requireMember(account, channel.groupId);
    requireRole(membership, "moderator");
    return { channel, group };
};

const updateChannel = async (account, channelIdValue, input) => {
    const { channel, group } = await requireChannelMod(account, channelIdValue);
    const db = getMongo();
    const set = {};

    if (input.name !== undefined) {
        set.name = cleanChannelName(input.name);
        if (await db.collection(C.channels).findOne({ groupId: group._id, name: set.name, _id: { $ne: channel._id } })) {
            throw new ChatError(409, `#${set.name} already exists`);
        }
    }
    if (input.topic !== undefined) {
        set.topic = cleanText(input.topic, { multiline: false });
        requireLength(set.topic, LIMITS.channelTopic, "Topic");
    }

    const updated = await db.collection(C.channels).findOneAndUpdate({ _id: channel._id }, { $set: set }, { returnDocument: "after" });
    await notifyGroup(group._id, { type: "group.updated", groupId: String(group._id) });
    return channelView(updated);
};

const deleteChannel = async (account, channelIdValue) => {
    const { channel, group } = await requireChannelMod(account, channelIdValue);
    const db = getMongo();

    if (await db.collection(C.channels).countDocuments({ groupId: group._id }) <= 1) {
        throw new ChatError(409, "A group needs at least one channel");
    }

    await db.collection(C.channels).deleteOne({ _id: channel._id });
    await db.collection(C.messages).deleteMany({ roomId: channel._id });
    await notifyGroup(group._id, { type: "group.updated", groupId: String(group._id) });
};

// ---------- direct messages ----------

const isBlocked = async (a, b) =>
    Boolean(await getMongo().collection(C.blocks).findOne({ _id: { $in: [`${a}|${b}`, `${b}|${a}`] } }));

const openDm = async (account, username) => {
    const me = keyOf(account);
    const target = await findAccountByUsername(username);

    if (!target) throw new ChatError(404, "No member with that username");

    const other = `${target.accountType}:${target.id}`;
    if (other === me) throw new ChatError(400, "You can't message yourself");

    const participants = [me, other].sort();
    const db = getMongo();
    const now = new Date();

    const dm = await db.collection(C.dms).findOneAndUpdate(
        { pairKey: participants.join("|") },
        { $setOnInsert: { participants, createdAt: now } },
        { upsert: true, returnDocument: "after" }
    ).catch(async (error) => {
        // Both sides opened the DM at once; the other insert won
        if (error && error.code === 11000) return db.collection(C.dms).findOne({ pairKey: participants.join("|") });
        throw error;
    });

    const names = await namesFor([other]);
    return { id: String(dm._id), other: { ...personView(other, names), online: realtime.isOnline(other) }, lastMessageAt: dm.lastMessageAt || null, unread: 0 };
};

const setBlock = async (account, dmIdValue, blocked) => {
    const me = keyOf(account);
    const { room } = await requireRoom(account, "dm", dmIdValue);
    const other = room.participants.find((p) => p !== me);
    const col = getMongo().collection(C.blocks);

    if (blocked) {
        await col.updateOne({ _id: `${me}|${other}` }, { $setOnInsert: { at: new Date() } }, { upsert: true });
    } else {
        await col.deleteOne({ _id: `${me}|${other}` });
    }

    return { blocked };
};

const getDm = async (account, dmIdValue) => {
    const me = keyOf(account);
    const { room } = await requireRoom(account, "dm", dmIdValue);
    const other = room.participants.find((p) => p !== me) || me;
    const [names, blockedByMe, blockedEither] = await Promise.all([
        namesFor([other]),
        getMongo().collection(C.blocks).findOne({ _id: `${me}|${other}` }),
        isBlocked(me, other)
    ]);

    return {
        id: String(room._id),
        other: { ...personView(other, names), online: realtime.isOnline(other) },
        blockedByMe: Boolean(blockedByMe),
        canMessage: !blockedEither
    };
};

// ---------- messages ----------

const listMessages = async (account, roomType, roomIdValue, before) => {
    const { room } = await requireRoom(account, roomType, roomIdValue);
    const filter = { roomId: room._id };
    const beforeId = toObjectId(before);

    if (beforeId) filter._id = { $lt: beforeId };

    const docs = await getMongo().collection(C.messages).find(filter).sort({ _id: -1 }).limit(PAGE + 1).toArray();
    const hasMore = docs.length > PAGE;
    const page = docs.slice(0, PAGE).reverse();

    return {
        messages: await presentMessages(page),
        nextBefore: hasMore && page.length ? String(page[0]._id) : null
    };
};

const sendMessage = async (account, roomType, roomIdValue, input) => {
    const me = keyOf(account);
    const ctx = await requireRoom(account, roomType, roomIdValue);
    const db = getMongo();

    if (roomType === "dm") {
        const other = ctx.room.participants.find((p) => p !== me);
        if (other && await isBlocked(me, other)) {
            throw new ChatError(403, "You can't message this member");
        }
    }

    const body = cleanText(input.body, { multiline: true });
    let sharedPost = null;

    if (input.sharePostId) {
        const postId = toObjectId(input.sharePostId);
        const post = postId ? await db.collection("community_posts").findOne({ _id: postId, status: "visible" }) : null;
        if (!post) throw new ChatError(404, "That post is no longer available");
        sharedPost = { id: String(post._id), title: post.title, kind: post.kind };
    }

    if (!sharedPost) requireLength(body, LIMITS.message, "Message");
    else requireLength(body, [0, LIMITS.message[1]], "Message");

    let replyTo = null;
    if (input.replyTo) {
        const replyId = toObjectId(input.replyTo);
        const original = replyId ? await db.collection(C.messages).findOne({ _id: replyId, roomId: ctx.room._id, deleted: { $ne: true } }) : null;
        if (original) {
            replyTo = { id: original._id, authorKey: original.authorKey, excerpt: (original.body || original.sharedPost?.title || "").slice(0, 120) };
        }
    }

    const now = new Date();
    const doc = {
        _id: new ObjectId(),
        roomType,
        roomId: ctx.room._id,
        ...(ctx.group ? { groupId: ctx.group._id } : {}),
        authorKey: me,
        body,
        replyTo,
        sharedPost,
        reactions: [],
        createdAt: now,
        deleted: false
    };

    await db.collection(C.messages).insertOne(doc);
    await Promise.all([
        db.collection(roomType === "channel" ? C.channels : C.dms).updateOne({ _id: ctx.room._id }, { $set: { lastMessageAt: now } }),
        db.collection(C.reads).updateOne({ _id: `${ctx.room._id}:${me}` }, { $set: { lastReadAt: now } }, { upsert: true })
    ]);

    const [message] = await presentMessages([doc]);
    publishTo(await ctx.keys(), {
        type: "message.created",
        roomType,
        roomId: String(ctx.room._id),
        groupId: ctx.group ? String(ctx.group._id) : null,
        message
    });

    return message;
};

// The message plus room access; authors edit, moderators may delete
const requireMessage = async (account, messageIdValue) => {
    const messageId = id(messageIdValue, "Message");
    const message = await getMongo().collection(C.messages).findOne({ _id: messageId });
    if (!message) throw new ChatError(404, "Message not found");

    const ctx = await requireRoom(account, message.roomType, message.roomId);
    return { message, ctx };
};

const editMessage = async (account, messageIdValue, input) => {
    const { message, ctx } = await requireMessage(account, messageIdValue);

    if (message.authorKey !== keyOf(account) || message.deleted) {
        throw new ChatError(403, "You can only edit your own messages");
    }

    const body = cleanText(input.body, { multiline: true });
    requireLength(body, message.sharedPost ? [0, LIMITS.message[1]] : LIMITS.message, "Message");

    const updated = await getMongo().collection(C.messages).findOneAndUpdate(
        { _id: message._id },
        { $set: { body, editedAt: new Date() } },
        { returnDocument: "after" }
    );

    const [view] = await presentMessages([updated]);
    publishTo(await ctx.keys(), { type: "message.updated", roomType: message.roomType, roomId: String(message.roomId), message: view });
    return view;
};

const deleteMessage = async (account, messageIdValue) => {
    const { message, ctx } = await requireMessage(account, messageIdValue);
    const mine = message.authorKey === keyOf(account);
    const canModerate = ctx.membership && ROLE_RANK[ctx.membership.role] >= ROLE_RANK.moderator;

    if (!mine && !canModerate) {
        throw new ChatError(403, "You can only delete your own messages");
    }

    const updated = await getMongo().collection(C.messages).findOneAndUpdate(
        { _id: message._id },
        { $set: { deleted: true, body: "", sharedPost: null, reactions: [], deletedAt: new Date(), deletedBy: keyOf(account) } },
        { returnDocument: "after" }
    );

    const [view] = await presentMessages([updated]);
    publishTo(await ctx.keys(), { type: "message.updated", roomType: message.roomType, roomId: String(message.roomId), message: view });
};

const toggleReaction = async (account, messageIdValue, emoji) => {
    if (!REACTIONS.includes(emoji)) throw new ChatError(400, "Unsupported reaction");

    const me = keyOf(account);
    const { message, ctx } = await requireMessage(account, messageIdValue);
    if (message.deleted) throw new ChatError(404, "Message not found");

    const col = getMongo().collection(C.messages);
    const has = (message.reactions || []).some((r) => r.emoji === emoji && r.keys.includes(me));

    if (has) {
        await col.updateOne({ _id: message._id, "reactions.emoji": emoji }, { $pull: { "reactions.$.keys": me } });
    } else {
        // Add to the emoji's entry, creating it if this is the first reaction
        const res = await col.updateOne({ _id: message._id, "reactions.emoji": emoji }, { $addToSet: { "reactions.$.keys": me } });
        if (!res.matchedCount) {
            await col.updateOne(
                { _id: message._id, "reactions.emoji": { $ne: emoji } },
                { $push: { reactions: { emoji, keys: [me] } } }
            );
        }
    }

    const updated = await col.findOne({ _id: message._id });
    const [view] = await presentMessages([updated]);
    publishTo(await ctx.keys(), { type: "message.updated", roomType: message.roomType, roomId: String(message.roomId), message: view });
    return view;
};

const markRead = async (account, roomType, roomIdValue) => {
    const { room } = await requireRoom(account, roomType, roomIdValue);
    await getMongo().collection(C.reads).updateOne(
        { _id: `${room._id}:${keyOf(account)}` },
        { $set: { lastReadAt: new Date() } },
        { upsert: true }
    );
};

const typing = async (account, roomType, roomIdValue) => {
    const me = keyOf(account);
    const ctx = await requireRoom(account, roomType, roomIdValue);
    const names = await namesFor([me]);
    const keys = (await ctx.keys()).filter((k) => k !== me);

    publishTo(keys, { type: "typing", roomType, roomId: String(ctx.room._id), user: personView(me, names) });
};

module.exports = {
    ChatError,
    REACTIONS,
    ensureChatIndexes,
    keyOf,
    getOverview,
    createGroup,
    getGroup,
    updateGroup,
    deleteGroup,
    discoverGroups,
    joinPublic,
    previewInvite,
    joinByInvite,
    resetInvite,
    leaveGroup,
    listMembers,
    setRole,
    transferOwnership,
    kick,
    listBans,
    unban,
    createChannel,
    updateChannel,
    deleteChannel,
    openDm,
    getDm,
    setBlock,
    listMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
    markRead,
    typing
};
