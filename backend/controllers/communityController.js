const community = require("../services/communityService");

const sendError = (res, error) => {
    if (error instanceof community.CommunityError) {
        return res.status(error.status).json({ message: error.message });
    }
    throw error;
};

// Runs a service call and maps CommunityError to its status code
const handle = (fn, status = 200) => async (req, res) => {
    try {
        const result = await fn(req);
        if (status === 204) {
            return res.status(204).end();
        }
        res.status(status).json(result);
    } catch (error) {
        sendError(res, error);
    }
};

const body = (req) => req.body || {};

module.exports = {
    // GET /api/community/posts?kind=&tag=&q=&sort=latest|top&mine=1&cursor=
    listPosts: handle((req) => community.listPosts(req.user, req.query)),
    // GET /api/community/highlights - trending tags, top contributors, my stats
    getHighlights: handle((req) => community.getHighlights(req.user)),
    getPost: handle(async (req) => ({ post: await community.getPost(req.user, req.params.id) })),
    createPost: handle(async (req) => ({ post: await community.createPost(req.user, body(req)) }), 201),
    updatePost: handle(async (req) => ({ post: await community.updatePost(req.user, req.params.id, body(req)) })),
    deletePost: handle((req) => community.deletePost(req.user, req.params.id), 204),
    likePost: handle((req) => community.setLike(req.user, req.params.id, true)),
    unlikePost: handle((req) => community.setLike(req.user, req.params.id, false)),
    reportPost: handle((req) => community.report(req.user, "post", req.params.id, body(req))),
    listComments: handle((req) => community.listComments(req.user, req.params.id, req.query.cursor)),
    addComment: handle(async (req) => ({ comment: await community.addComment(req.user, req.params.id, body(req)) }), 201),
    updateComment: handle(async (req) => ({ comment: await community.updateComment(req.user, req.params.id, body(req)) })),
    deleteComment: handle((req) => community.deleteComment(req.user, req.params.id), 204),
    reportComment: handle((req) => community.report(req.user, "comment", req.params.id, body(req)))
};
