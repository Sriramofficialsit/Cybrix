// Loads .env and checks required settings before anything else
const { PORT, FRONTEND_URL, CORS_ORIGINS, TRUST_PROXY } = require("./config/env");

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const initializeDatabase = require("./database/collegeDB");
const collegeRoutes = require("./routes/collegeRoutes");
const labRoutes = require("./routes/labRoutes");
const learnRoutes = require("./routes/learnRoutes");
const certificateRoutes = require("./routes/certificateRoutes");
const communityRoutes = require("./routes/communityRoutes");
const chatRoutes = require("./routes/chatRoutes");
const { connectMongo, closeMongo } = require("./config/mongodb");
const { ensureLearnIndexes } = require("./services/learnProgressService");
const { ensureCertificateIndexes } = require("./services/certificateService");
const { ensureCommunityIndexes } = require("./services/communityService");
const { ensureChatIndexes } = require("./services/chatService");
const { initRealtime, closeAllStreams } = require("./services/realtime");
const { startCleanupJob } = require("./services/cleanupService");
const { requireStringFields } = require("./Middleware/validateInput");


const app = express();

// Behind a reverse proxy, use its X-Forwarded-For so rate limits
// apply to the real client IP
app.set("trust proxy", TRUST_PROXY);

// Security headers (HSTS, nosniff, frame options, CSP, ...) and no
// X-Powered-By. The confirm pages POST a form and then redirect to the
// frontend, so the frontend must be allowed as a form target.
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            formAction: ["'self'", FRONTEND_URL],
            // Would turn the confirm pages' form POST into https on a
            // plain-http dev server; HSTS already covers https deployments
            upgradeInsecureRequests: null
        }
    }
}));

// Only the frontend may call the API from a browser. credentials lets it
// send the httpOnly session cookie; X-CSRF-Protection is the anti-CSRF
// header (see utils/sessionCookie.js).
app.use(cors({
    origin: CORS_ORIGINS,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Protection"]
}));

app.use(express.json({ limit: "100kb" }));
// Confirm pages (email links) submit a plain HTML form
app.use(express.urlencoded({ extended: false, limit: "10kb" }));
app.use(requireStringFields);

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/colleges", collegeRoutes);
app.use("/api/labs", labRoutes);
app.use("/api/learn", learnRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/chat", chatRoutes);


app.get("/", (req, res) => {
    res.json({
        message: "Cybersecurity Learning Platform Backend is running"
    });
});

// Unknown routes
app.use((req, res) => {
    res.status(404).json({
        message: "Not found"
    });
});

// Errors (invalid JSON, body too large, unexpected failures) as JSON
// instead of Express's HTML error page
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed") {
        return res.status(400).json({ message: "Invalid JSON body" });
    }

    if (err.type === "entity.too.large") {
        return res.status(413).json({ message: "Request body is too large" });
    }

    console.error("Unhandled error:", err);

    return res.status(err.status || 500).json({
        message: "Server error"
    });
});


const start = async () => {
    // Finish DB setup before accepting requests
    await initializeDatabase();

    try {
        await connectMongo();
        await ensureLearnIndexes();
        await ensureCertificateIndexes();
        await ensureCommunityIndexes();
        await ensureChatIndexes();
    } catch (error) {
        console.error(
            "MongoDB connection failed (learn path, certificates, community). Is it running? " +
            "Start it with: docker compose up -d mongo\n",
            error.message
        );
        process.exit(1);
    }

    startCleanupJob();

    // Chat events go through Redis when REDIS_URL is set (several instances)
    try {
        await initRealtime();
    } catch (error) {
        console.error("Realtime Redis unavailable, using in-process delivery:", error.message);
    }

    const server = app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });

    // Finish in-flight requests and close DB connections on shutdown
    const shutdown = (signal) => {
        console.log(`${signal} received, shutting down`);
        // Open chat streams would otherwise keep server.close() waiting
        closeAllStreams();
        server.close(() => {
            closeMongo().finally(() => process.exit(0));
        });
        setTimeout(() => process.exit(1), 10000).unref();
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
};

start();
