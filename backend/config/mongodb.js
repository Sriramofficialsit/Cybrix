const { MongoClient } = require("mongodb");
require("dotenv").config();

// MongoDB holds learn-path progress. MONGODB_URI wins if set; otherwise
// the URI is built from the same MONGO_* values docker-compose.yml uses.
const buildUri = () => {
    if (process.env.MONGODB_URI) {
        return process.env.MONGODB_URI;
    }

    const { MONGO_HOST, MONGO_PORT, MONGO_DB, MONGO_APP_USER, MONGO_APP_PASSWORD } = process.env;

    if (!MONGO_DB || !MONGO_APP_USER || !MONGO_APP_PASSWORD) {
        throw new Error("Set MONGODB_URI, or MONGO_DB, MONGO_APP_USER and MONGO_APP_PASSWORD, in .env");
    }

    const auth = `${encodeURIComponent(MONGO_APP_USER)}:${encodeURIComponent(MONGO_APP_PASSWORD)}`;
    const host = `${MONGO_HOST || "127.0.0.1"}:${MONGO_PORT || 27017}`;

    // The app user is created in the app database, so authenticate there
    return `mongodb://${auth}@${host}/${MONGO_DB}?authSource=${MONGO_DB}`;
};

let client = null;
let database = null;

const connectMongo = async () => {
    if (database) {
        return database;
    }

    client = new MongoClient(buildUri(), {
        // Keep an unreachable DB from hanging requests forever
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
        maxPoolSize: Number(process.env.MONGO_POOL_MAX) || 10
    });

    await client.connect();
    database = client.db(process.env.MONGO_DB || undefined);

    return database;
};

// The connected database; connectMongo() must have finished first
const getMongo = () => {
    if (!database) {
        throw new Error("MongoDB is not connected");
    }

    return database;
};

const closeMongo = async () => {
    if (client) {
        await client.close();
    }

    client = null;
    database = null;
};

module.exports = {
    connectMongo,
    getMongo,
    closeMongo
};
