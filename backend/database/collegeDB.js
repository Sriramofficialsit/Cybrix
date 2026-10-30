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

const colleges = [
    "St. Joseph's College of Engineering",
    "SRM valliammai engineering college (Cybersecurity Dept)",
    "SRM valliammai engineering college (Computer science)",
    "Alagappa University",
    "Arunai College of Engineering",
    "Dr. N.G.P. Institute of Technology",
    "Stekom University",
    "Sri Raaja Raajan College of Engineering and Technology",
    "Sri Sairam Engineering College -chennai",
    "Nehru Institute of Engineering and Technology",
    "Sri Sairam Engineering College -Banglore",
    "Paavai Engineering College",
    "Fatima Michael College of Engineering & Technology (FMCET) Poovanthi Campus",
    "SSM Institute of Engineering and Technology",
    "University of Venda",
    "Dr. Umayal Ramanathan College for Women, Karaikudi (IT Dept)",
    "Dr. Umayal Ramanathan College for Women, Karaikudi (CS Dept)",
    "NPR College of Engineering & Technology, Dindigul",
    "Mahendra Engineering College",
    "Kings College of Engineering and Technology, Thanjavur"
];

const initializeDatabase = async () => {
    try {
        const existing = await db.orm.public.Colleges.select("collegeName").all();
        const existingNames = new Set(existing.map((c) => c.collegeName));
        const missing = colleges.filter((name) => !existingNames.has(name));

        if (missing.length > 0) {
            try {
                await db.orm.public.Colleges.createAll(
                    missing.map((name) => ({ collegeName: name }))
                );
            } catch (err) {
                const isUniqueViolation = err.code === "23505" ||
                    err.code === "P2002" ||
                    (err.message && (err.message.includes("unique constraint") || err.message.includes("duplicate key")));
                if (isUniqueViolation) {
                    for (const name of missing) {
                        try {
                            await db.orm.public.Colleges.create({ collegeName: name });
                        } catch (singleErr) {
                            const isSingleDup = singleErr.code === "23505" ||
                                singleErr.code === "P2002" ||
                                (singleErr.message && (singleErr.message.includes("unique constraint") || singleErr.message.includes("duplicate key")));
                            if (!isSingleDup) {
                                throw singleErr;
                            }
                        }
                    }
                } else {
                    throw err;
                }
            }
        }

        console.log("College list initialized.");
    } catch (error) {
        console.error("Database initialization failed:", error);
    }
};

module.exports = initializeDatabase;
