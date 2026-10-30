const chat = require("../services/chatService");
const realtime = require("../services/realtime");

// Runs a service call and maps ChatError to its status code
const handle = (fn, status = 200) => async (req, res) => {
    try {
        const result = await fn(req);
        if (status === 204) {
            return res.status(204).end();
        }
        res.status(status).json(result === undefined ? { ok: true } : result);
    } catch (error) {
        if (error instanceof chat.ChatError) {
            return res.status(error.status).json({ message: error.message });
        }
        throw error;
    }
};

const body = (req) => req.body || {};
const p = (req) => req.params;

module.exports = {
    // GET /api/chat/stream - Server-Sent Events for this account
    stream: (req, res) => realtime.openStream(req, res, chat.keyOf(req.user)),

    getOverview: handle((req) => chat.getOverview(req.user)),

    // groups
    createGroup: handle(async (req) => ({ group: await chat.createGroup(req.user, body(req)) }), 201),
    discoverGroups: handle(async (req) => ({ groups: await chat.discoverGroups(req.user, req.query.q) })),
    getGroup: handle((req) => chat.getGroup(req.user, p(req).groupId)),
    updateGroup: handle(async (req) => ({ group: await chat.updateGroup(req.user, p(req).groupId, body(req)) })),
    deleteGroup: handle((req) => chat.deleteGroup(req.user, p(req).groupId), 204),
    joinGroup: handle(async (req) => ({ group: await chat.joinPublic(req.user, p(req).groupId) })),
    leaveGroup: handle((req) => chat.leaveGroup(req.user, p(req).groupId), 204),
    resetInvite: handle(async (req) => ({ group: await chat.resetInvite(req.user, p(req).groupId) })),
    previewInvite: handle(async (req) => ({ group: await chat.previewInvite(req.user, p(req).code) })),
    joinByInvite: handle(async (req) => ({ group: await chat.joinByInvite(req.user, p(req).code) })),

    // members
    listMembers: handle(async (req) => ({ members: await chat.listMembers(req.user, p(req).groupId) })),
    setRole: handle((req) => chat.setRole(req.user, p(req).groupId, p(req).uid, body(req).role), 204),
    transferOwnership: handle((req) => chat.transferOwnership(req.user, p(req).groupId, p(req).uid), 204),
    kickMember: handle((req) => chat.kick(req.user, p(req).groupId, p(req).uid, { ban: false }), 204),
    banMember: handle((req) => chat.kick(req.user, p(req).groupId, p(req).uid, { ban: true }), 204),
    listBans: handle(async (req) => ({ bans: await chat.listBans(req.user, p(req).groupId) })),
    unban: handle((req) => chat.unban(req.user, p(req).groupId, p(req).uid), 204),

    // channels
    createChannel: handle(async (req) => ({ channel: await chat.createChannel(req.user, p(req).groupId, body(req)) }), 201),
    updateChannel: handle(async (req) => ({ channel: await chat.updateChannel(req.user, p(req).channelId, body(req)) })),
    deleteChannel: handle((req) => chat.deleteChannel(req.user, p(req).channelId), 204),

    // direct messages
    openDm: handle(async (req) => ({ dm: await chat.openDm(req.user, body(req).username) })),
    getDm: handle(async (req) => ({ dm: await chat.getDm(req.user, p(req).dmId) })),
    blockDm: handle((req) => chat.setBlock(req.user, p(req).dmId, true)),
    unblockDm: handle((req) => chat.setBlock(req.user, p(req).dmId, false)),

    // messages (roomType is "channel" or "dm")
    listMessages: handle((req) => chat.listMessages(req.user, p(req).roomType, p(req).roomId, req.query.before)),
    sendMessage: handle(async (req) => ({ message: await chat.sendMessage(req.user, p(req).roomType, p(req).roomId, body(req)) }), 201),
    markRead: handle((req) => chat.markRead(req.user, p(req).roomType, p(req).roomId), 204),
    typing: handle((req) => chat.typing(req.user, p(req).roomType, p(req).roomId), 204),
    editMessage: handle(async (req) => ({ message: await chat.editMessage(req.user, p(req).messageId, body(req)) })),
    deleteMessage: handle((req) => chat.deleteMessage(req.user, p(req).messageId), 204),
    react: handle(async (req) => ({ message: await chat.toggleReaction(req.user, p(req).messageId, body(req).emoji) }))
};
