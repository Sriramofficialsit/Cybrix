// Real-time delivery for chat over Server-Sent Events (one long-lived GET
// per browser tab, authenticated by the normal session cookie).
//
// publish(keys, event) sends an event to every open stream of the given
// accounts ("<accountType>:<id>"). With one server process the hub is
// in-memory. With several instances, set REDIS_URL: every publish goes
// through a Redis channel and each instance delivers to its own streams.

const CHANNEL = "chat:events";
const HEARTBEAT_MS = 25 * 1000;
const MAX_STREAMS_PER_ACCOUNT = 8;

// accountKey -> Set<res>
const streams = new Map();

let publisher = null;
let subscriber = null;

const deliverLocal = (keys, event) => {
    const payload = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;

    for (const key of new Set(keys)) {
        const set = streams.get(key);
        if (!set) continue;
        for (const res of set) {
            res.write(payload);
        }
    }
};

const initRealtime = async () => {
    if (!process.env.REDIS_URL || publisher) {
        return;
    }

    const { createClient } = require("redis");

    publisher = createClient({ url: process.env.REDIS_URL });
    subscriber = publisher.duplicate();

    for (const client of [publisher, subscriber]) {
        client.on("error", (err) => console.error("Realtime Redis error:", err.message));
    }

    await Promise.all([publisher.connect(), subscriber.connect()]);
    await subscriber.subscribe(CHANNEL, (message) => {
        try {
            const { keys, event } = JSON.parse(message);
            deliverLocal(keys, event);
        } catch (error) {
            console.error("Realtime: bad message", error.message);
        }
    });
};

const publish = (keys, event) => {
    if (!keys.length) return;

    if (publisher && publisher.isReady) {
        publisher.publish(CHANNEL, JSON.stringify({ keys, event })).catch((err) => {
            console.error("Realtime publish failed, delivering locally:", err.message);
            deliverLocal(keys, event);
        });
        return;
    }

    deliverLocal(keys, event);
};

const isOnline = (key) => streams.has(key);

// GET handler body: keeps the response open as an event stream
const openStream = (req, res, key) => {
    const set = streams.get(key) || new Set();

    // A runaway client opening tabs in a loop: drop its oldest stream
    if (set.size >= MAX_STREAMS_PER_ACCOUNT) {
        const oldest = set.values().next().value;
        set.delete(oldest);
        oldest.end();
    }

    res.set({
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        // Stop nginx and similar proxies from buffering the stream
        "X-Accel-Buffering": "no"
    });
    res.flushHeaders();
    res.write("retry: 3000\n\n");
    res.write(`event: ready\ndata: {"type":"ready"}\n\n`);

    set.add(res);
    streams.set(key, set);

    const heartbeat = setInterval(() => res.write(": ping\n\n"), HEARTBEAT_MS);

    req.on("close", () => {
        clearInterval(heartbeat);
        set.delete(res);
        if (!set.size) streams.delete(key);
    });
};

// Close every stream so the server can shut down
const closeAllStreams = () => {
    for (const set of streams.values()) {
        for (const res of set) res.end();
    }
    streams.clear();

    for (const client of [subscriber, publisher]) {
        if (client) client.quit().catch(() => {});
    }
};

module.exports = {
    initRealtime,
    publish,
    isOnline,
    openStream,
    closeAllStreams
};
