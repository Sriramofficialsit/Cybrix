const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    // Keep a slow query or an unreachable DB from hanging requests forever
    max: Number(process.env.DB_POOL_MAX) || 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    statement_timeout: 10000,
    query_timeout: 15000
});

pool.on("error", (err) => {
    console.error("Unexpected PostgreSQL error:", err);
});

// Run fn(client) inside a transaction; rolls back if it throws
const withTransaction = async (fn) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");
        const result = await fn(client);
        await client.query("COMMIT");
        return result;
    } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        throw error;
    } finally {
        client.release();
    }
};

module.exports = pool;
module.exports.withTransaction = withTransaction;
