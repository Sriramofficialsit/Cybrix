const { db } = require("../prisma/db.mjs");

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

const getColleges = async (req, res) => {
    try {
        const result = await db.orm.public.Colleges
            .orderBy((c) => c.collegeName.asc())
            .select("id", "collegeName")
            .all();

        const colleges = result.map((row) => ({
            id: row.id,
            college_name: row.collegeName,
            collegeName: row.collegeName
        }));

        return res.status(200).json({
            colleges
        });
    } catch (error) {
        console.error("Error fetching colleges:", error);

        return res.status(500).json({
            message: "Failed to fetch colleges"
        });
    }
};

module.exports = {
    getColleges
};