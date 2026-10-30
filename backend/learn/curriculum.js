// Networking course content: the single source of truth for modules,
// topics, rewards and unlock order. The frontend renders whatever this
// returns, and every XP/unlock rule in learnProgressService reads it,
// so progress can't be faked from the browser.
//
// Topic keys are "<module>.<topic>" for display; ids ("1-1") are used in
// URLs and as MongoDB field names (which can't contain dots).

const MODULES = [
    {
        num: 1, title: "Introduction to Networking", tagline: "What a network is, why it exists, and the one already running in your home.",
        icon: "ic-globe", accent: ["#1d4ed8", "#38bdf8"],
        topics: [
            { key: "1.1", title: "What is a Network?", desc: "Two-plus devices, one shared connection point.", min: [8, 10], icon: "ic-globe" },
            { key: "1.2", title: "Why Do Computers Need to Communicate?", desc: "Sharing files, printers, the internet and services.", min: [7, 9], icon: "ic-msg" },
            { key: "1.3", title: "The Internet: How It Began and Who Runs It", desc: "From ARPANET to today, and the groups that keep it running.", min: [9, 11], icon: "ic-cloud" },
            { key: "1.4", title: "A Simple Home Network", desc: "Router, Wi-Fi and devices: everything above, running quietly at home.", min: [10, 12], icon: "ic-house", capstone: true },
        ],
    },
    {
        num: 2, title: "How Network Communication Works", tagline: "How data is chopped up, sent, and agreed on by every device.",
        icon: "ic-zap", accent: ["#7c3aed", "#a78bfa"],
        topics: [
            { key: "2.1", title: "Data, Bits and Packets", desc: "How a message becomes ones and zeros travelling in small parcels.", min: [8, 10], icon: "ic-grid" },
            { key: "2.2", title: "Why Networks Need Agreed Rules (Protocols)", desc: "Protocols: the shared language every device speaks.", min: [7, 9], icon: "ic-book" },
            { key: "2.3", title: "Client–Server vs Peer-to-Peer", desc: "One asks and one answers, or everyone shares.", min: [8, 10], icon: "ic-users" },
            { key: "2.4", title: "Bandwidth, Latency and Throughput", desc: "How much, how fast, and how much actually arrives.", min: [9, 11], icon: "ic-chart" },
            { key: "2.5", title: "Unicast, Broadcast and Multicast", desc: "Sending to one, to everyone, or to a chosen group.", min: [7, 9], icon: "ic-radar" },
        ],
    },
    {
        num: 3, title: "Network Types and Components", tagline: "The sizes, shapes and hardware that hold a network together.",
        icon: "ic-cpu", accent: ["#0d9488", "#5eead4"],
        topics: [
            { key: "3.1", title: "Network Types: PAN, LAN, MAN, WAN", desc: "Same idea, bigger circle, from your desk to the whole world.", min: [8, 10], icon: "ic-scale" },
            { key: "3.2", title: "Network Topologies", desc: "Star, bus, ring and mesh, plus how topologies differ from types.", min: [9, 11], icon: "ic-target" },
            { key: "3.3", title: "Connecting to the Outside: Modem, Router, Access Point", desc: "The boxes that sit between your home and the internet.", min: [9, 11], icon: "ic-zap" },
            { key: "3.4", title: "Connecting Inside: NIC, Hub, Switch, Repeater, Bridge", desc: "The devices that link machines inside one network.", min: [10, 12], icon: "ic-cpu" },
            { key: "3.5", title: "Cables and Media: Ethernet, Fibre, Wireless", desc: "Copper, light and radio: how signals actually travel.", min: [8, 10], icon: "ic-slider" },
        ],
    },
    {
        num: 4, title: "Network Models", tagline: "The layered maps engineers use to explain every connection.",
        icon: "ic-layers", accent: ["#4f46e5", "#818cf8"],
        topics: [
            { key: "4.1", title: "The OSI Model", desc: "Seven layers, from the cable all the way up to the app.", min: [10, 12], icon: "ic-layers" },
            { key: "4.2", title: "The TCP/IP Model", desc: "The four-layer model the internet runs on, compared with OSI.", min: [9, 11], icon: "ic-list" },
            { key: "4.3", title: "Encapsulation: How Data Moves Through the Layers", desc: "Each layer wraps the data on the way down and unwraps it on the way up.", min: [9, 11], icon: "ic-download" },
            { key: "4.4", title: "Mapping Devices and Protocols to Layers", desc: "Where switches, routers, IP and HTTP sit on the map.", min: [8, 10], icon: "ic-map" },
        ],
    },
    {
        num: 5, title: "IP and MAC Addressing", tagline: "How every device gets found, on your network and across the internet.",
        icon: "ic-pin", accent: ["#db2777", "#fa7faa"],
        topics: [
            { key: "5.1", title: "What is an IP Address?", desc: "A device's address on a network, and how to read one.", min: [8, 10], icon: "ic-pin" },
            { key: "5.2", title: "MAC vs IP: Why a Device Needs Both", desc: "A built-in name tag and a changeable address, working together.", min: [8, 10], icon: "ic-fp" },
            { key: "5.3", title: "IPv4 vs IPv6", desc: "Why we ran out of addresses and what replaced them.", min: [8, 10], icon: "ic-hash" },
            { key: "5.4", title: "Public vs Private, Static vs Dynamic, and NAT", desc: "Which addresses the world sees, and how NAT lets many share one.", min: [10, 12], icon: "ic-eye" },
            { key: "5.5", title: "Subnet Mask Basics", desc: "What a mask tells a device about its neighbours (concept only, no maths).", min: [7, 9], icon: "ic-filter" },
        ],
    },
    {
        num: 6, title: "Ports and Protocols", tagline: "The numbered doors on every device, and the rules for using them.",
        icon: "ic-key", accent: ["#a8790f", "#f2b84b"],
        topics: [
            { key: "6.1", title: "What is a Port?", desc: "Numbered doors that deliver traffic to the right app.", min: [7, 9], icon: "ic-key" },
            { key: "6.2", title: "TCP vs UDP", desc: "Reliable and ordered, or fast and fire-and-forget.", min: [8, 10], icon: "ic-scale" },
            { key: "6.3", title: "The Three-Way Handshake", desc: "SYN, SYN-ACK, ACK: how every TCP connection begins.", min: [8, 10], icon: "ic-replay" },
            { key: "6.4", title: "Well-Known Ports", desc: "22, 53, 80, 443 and the other numbers worth knowing by heart.", min: [8, 10], icon: "ic-list" },
            { key: "6.5", title: "Open vs Closed Ports: Why Attackers Care", desc: "Every open port is a door someone might try.", min: [9, 11], icon: "ic-lock" },
        ],
    },
    {
        num: 7, title: "Switching and Routing", tagline: "How data finds its way, across the room and across the world.",
        icon: "ic-map", accent: ["#0369a1", "#38bdf8"],
        topics: [
            { key: "7.1", title: "How a Switch Works", desc: "Learning MAC addresses so frames only go where they belong.", min: [9, 11], icon: "ic-cpu" },
            { key: "7.2", title: "ARP: Finding the MAC from an IP", desc: "Asking the local network: who has this IP?", min: [8, 10], icon: "ic-search" },
            { key: "7.3", title: "How Routing Works", desc: "Routers, routes, and the default gateway out of your network.", min: [10, 12], icon: "ic-map" },
            { key: "7.4", title: "Data Moving Within and Out of a Network", desc: "Follow one packet from your laptop all the way to the internet.", min: [11, 13], icon: "ic-crown", capstone: true },
        ],
    },
    {
        num: 8, title: "Everyday Network Services", tagline: "The quiet services working behind every single click.",
        icon: "ic-cloud", accent: ["#7c3aed", "#38bdf8"],
        topics: [
            { key: "8.1", title: "DHCP: How Devices Get an IP", desc: "How a device is handed an address the moment it joins.", min: [8, 10], icon: "ic-plus" },
            { key: "8.2", title: "DNS: Why We Don't Type IP Addresses", desc: "The internet's phone book: turning names into addresses.", min: [9, 11], icon: "ic-book" },
            { key: "8.3", title: "HTTP and HTTPS: Watching a Website Load", desc: "Requests, responses, and what the padlock really means.", min: [9, 11], icon: "ic-code" },
            { key: "8.4", title: "Wi-Fi Basics and Security", desc: "Radio networks, WPA2/WPA3, and staying safe on public Wi-Fi.", min: [9, 11], icon: "ic-radar" },
            { key: "8.5", title: "What Happens When You Type a Website Name", desc: "DHCP, DNS, TCP and HTTP, all in one journey.", min: [11, 13], icon: "ic-crown", capstone: true },
        ],
    },
    {
        num: 9, title: "Network Security Basics", tagline: "Your first steps from understanding networks to defending them.",
        icon: "ic-shield", accent: ["#be123c", "#fb7185"],
        topics: [
            { key: "9.1", title: "Firewalls and the DMZ", desc: "Rules that decide what gets in, and a buffer zone for public servers.", min: [9, 11], icon: "ic-shield" },
            { key: "9.2", title: "VPNs", desc: "Private, encrypted tunnels across a public network.", min: [8, 10], icon: "ic-lock" },
            { key: "9.3", title: "IDS, IPS and WAF: An Overview", desc: "Systems that watch for attacks, and some that block them.", min: [9, 11], icon: "ic-eye" },
            { key: "9.4", title: "Common Network Attacks: A First Look", desc: "Sniffing, spoofing, man-in-the-middle and DoS at a glance.", min: [10, 12], icon: "ic-bug" },
            { key: "9.5", title: "Network Commands Every Analyst Uses", desc: "ping, ipconfig, traceroute, nslookup and netstat.", min: [9, 11], icon: "ic-term" },
            { key: "9.6", title: "Your First Look in Wireshark", desc: "Spotting normal versus suspicious traffic in a real capture.", min: [12, 15], icon: "ic-award", capstone: true },
        ],
    },
];

// Each topic is played in these stages, in order
const STAGES = ["story", "concept", "visualize", "game", "done"];

const REWARDS = {
    stage: 8,          // each of the first four stages
    topic: 40,         // finishing a topic ("done" stage)
    capstone: 60,      // finishing a capstone topic
    chest: 10,         // opening a reward chest
    module: 100,       // clearing every topic in a module
    course: 250        // clearing the whole course
};

const XP_PER_LEVEL = 250;
// Rank titles by level; the full course takes a learner to about level 18
const RANKS = [
    { from: 1, title: "Packet Scout" },
    { from: 3, title: "Signal Runner" },
    { from: 6, title: "Route Ranger" },
    { from: 9, title: "Port Warden" },
    { from: 12, title: "Net Defender" },
    { from: 16, title: "Network Guardian" }
];

// Topics with built lesson pages; every other topic uses the generic lesson
const LESSON_ROUTES = {
    "1-1": "/learn/modules/networking/1-1"
};

const toId = (key) => key.replace(".", "-");

const buildCourse = () => {
    const modules = MODULES.map((m) => ({
        ...m,
        topics: m.topics.map((t) => ({
            ...t,
            id: toId(t.key),
            capstone: Boolean(t.capstone),
            xp: t.capstone ? REWARDS.capstone : REWARDS.topic,
            module: m.num
        }))
    }));

    // A reward chest after every second topic of a module (not after the last)
    for (const m of modules) {
        m.chests = m.topics
            .filter((t, i) => i % 2 === 1 && i < m.topics.length - 1)
            .map((t) => ({ id: `chest-${t.id}`, after: t.id, xp: REWARDS.chest }));
    }

    const topics = modules.flatMap((m) => m.topics);

    return {
        slug: "networking",
        title: "Networking Fundamentals",
        modules,
        topics,
        topicById: new Map(topics.map((t, i) => [t.id, { ...t, order: i }])),
        chestById: new Map(modules.flatMap((m) => m.chests).map((c) => [c.id, c]))
    };
};

const COURSES = { networking: buildCourse() };

const findCourse = (slug) => (Object.prototype.hasOwnProperty.call(COURSES, slug) ? COURSES[slug] : null);

module.exports = {
    STAGES,
    REWARDS,
    XP_PER_LEVEL,
    RANKS,
    LESSON_ROUTES,
    COURSES,
    findCourse
};
