const { authenticate } = require("../../Middleware/authMiddleware");
const { bumpTokenVersion } = require("../../services/accountService");
const { clearSessionCookie } = require("../../utils/sessionCookie");

// Revokes the token on the server (a JWT alone can't be "deleted").
// Bumping token_version signs out every session of this account.
const logout = async (req, res) => {
    try {
        const decoded = await authenticate(req);

        if (decoded) {
            await bumpTokenVersion(decoded.accountType, decoded.userId);
        }

        clearSessionCookie(res);

        // Always succeed: the client clears its copy either way
        return res.status(200).json({
            message: "Logout successful"
        });
    } catch (error) {
        console.error("Logout error:", error);

        return res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    logout
};
