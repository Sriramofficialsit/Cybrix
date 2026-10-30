const pool = require("../config/db");
const { verifyToken } = require("../utils/jwt");

const adminProtect = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Admin authentication required"
        });
    }

    const token = authHeader.slice(7).trim();

    let decoded;

    try {
        decoded = verifyToken(token);
    } catch {
        return res.status(401).json({
            message: "Invalid or expired admin token"
        });
    }

    if (!decoded.adminId || !Number.isInteger(decoded.tv)) {
        return res.status(403).json({
            message: "Admin access required"
        });
    }

    try {
        // Trust the database, not the token: the admin must still exist,
        // be verified, and the token must not have been revoked.
        // The role always comes from the DB.
        const result = await pool.query(
            `SELECT admin_role, token_version, is_email_verified
             FROM admins
             WHERE id = $1`,
            [decoded.adminId]
        );

        const admin = result.rows[0];

        if (
            !admin ||
            !admin.is_email_verified ||
            admin.token_version !== decoded.tv ||
            !["admin", "superior_admin"].includes(admin.admin_role)
        ) {
            return res.status(401).json({
                message: "Invalid or expired admin token"
            });
        }

        req.admin = {
            adminId: decoded.adminId,
            adminRole: admin.admin_role
        };

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    adminProtect
};
