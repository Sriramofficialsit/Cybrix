// Runs once, when the mongo_data volume is first created.
// The backend connects as this user, which can only read and write the
// app database; the root account is kept for administration.
const dbName = process.env.MONGO_INITDB_DATABASE;
const user = process.env.MONGO_APP_USER;
const pwd = process.env.MONGO_APP_PASSWORD;

if (!dbName || !user || !pwd) {
    throw new Error("MONGO_INITDB_DATABASE, MONGO_APP_USER and MONGO_APP_PASSWORD must be set");
}

db.getSiblingDB(dbName).createUser({
    user,
    pwd,
    roles: [{ role: "readWrite", db: dbName }]
});
