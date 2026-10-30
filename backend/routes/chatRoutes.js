const express = require("express");

const { protect } = require("../Middleware/authMiddleware");
const {
    chatMessageLimiter,
    chatActionLimiter,
    chatTypingLimiter,
    chatGroupCreateLimiter
} = require("../Middleware/rateLimiters");
const c = require("../controllers/chatController");

const router = express.Router();

// Groups, channels and DMs are for signed-in members only
router.use(protect);

router.get("/stream", c.stream);
router.get("/me", c.getOverview);

router.post("/groups", chatGroupCreateLimiter, c.createGroup);
router.get("/groups/discover", c.discoverGroups);
router.get("/groups/:groupId", c.getGroup);
router.put("/groups/:groupId", chatActionLimiter, c.updateGroup);
router.delete("/groups/:groupId", chatActionLimiter, c.deleteGroup);
router.post("/groups/:groupId/join", chatActionLimiter, c.joinGroup);
router.post("/groups/:groupId/leave", chatActionLimiter, c.leaveGroup);
router.post("/groups/:groupId/invite/reset", chatActionLimiter, c.resetInvite);
router.get("/invites/:code", c.previewInvite);
router.post("/invites/:code/join", chatActionLimiter, c.joinByInvite);

router.get("/groups/:groupId/members", c.listMembers);
router.put("/groups/:groupId/members/:uid/role", chatActionLimiter, c.setRole);
router.post("/groups/:groupId/members/:uid/transfer", chatActionLimiter, c.transferOwnership);
router.post("/groups/:groupId/members/:uid/kick", chatActionLimiter, c.kickMember);
router.post("/groups/:groupId/members/:uid/ban", chatActionLimiter, c.banMember);
router.get("/groups/:groupId/bans", c.listBans);
router.delete("/groups/:groupId/bans/:uid", chatActionLimiter, c.unban);

router.post("/groups/:groupId/channels", chatActionLimiter, c.createChannel);
router.put("/channels/:channelId", chatActionLimiter, c.updateChannel);
router.delete("/channels/:channelId", chatActionLimiter, c.deleteChannel);

router.post("/dms", chatActionLimiter, c.openDm);
router.get("/dms/:dmId", c.getDm);
router.post("/dms/:dmId/block", chatActionLimiter, c.blockDm);
router.delete("/dms/:dmId/block", chatActionLimiter, c.unblockDm);

router.get("/rooms/:roomType/:roomId/messages", c.listMessages);
router.post("/rooms/:roomType/:roomId/messages", chatMessageLimiter, c.sendMessage);
router.post("/rooms/:roomType/:roomId/read", c.markRead);
router.post("/rooms/:roomType/:roomId/typing", chatTypingLimiter, c.typing);
router.put("/messages/:messageId", chatMessageLimiter, c.editMessage);
router.delete("/messages/:messageId", chatActionLimiter, c.deleteMessage);
router.post("/messages/:messageId/reactions", chatActionLimiter, c.react);

module.exports = router;
