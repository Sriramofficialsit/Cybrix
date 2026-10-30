const express = require("express");

const { protect } = require("../Middleware/authMiddleware");
const {
    communityPostLimiter,
    communityCommentLimiter,
    communityReactLimiter,
    communityReportLimiter
} = require("../Middleware/rateLimiters");
const c = require("../controllers/communityController");

const router = express.Router();

// The community is for signed-in members only
router.use(protect);

router.get("/highlights", c.getHighlights);

router.get("/posts", c.listPosts);
router.post("/posts", communityPostLimiter, c.createPost);
router.get("/posts/:id", c.getPost);
router.put("/posts/:id", communityPostLimiter, c.updatePost);
router.delete("/posts/:id", c.deletePost);

router.post("/posts/:id/like", communityReactLimiter, c.likePost);
router.delete("/posts/:id/like", communityReactLimiter, c.unlikePost);
router.post("/posts/:id/report", communityReportLimiter, c.reportPost);

router.get("/posts/:id/comments", c.listComments);
router.post("/posts/:id/comments", communityCommentLimiter, c.addComment);
router.put("/comments/:id", communityCommentLimiter, c.updateComment);
router.delete("/comments/:id", c.deleteComment);
router.post("/comments/:id/report", communityReportLimiter, c.reportComment);

module.exports = router;
