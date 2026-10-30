// Registry of hands-on labs. Each lab has a metadata.json (title, points,
// hints, flag) and a router with its simulated tools. The shared endpoints
// (meta, hints, submit, reset, progress) live in controllers/labController.js.

const LABS = [
    {
        slug: "nexacorp-passive",
        metadata: require("./nexacorp-passive/metadata.json"),
        router: require("./nexacorp-passive/router")
    },
    {
        slug: "nexacorp-active",
        metadata: require("./nexacorp-active/metadata.json"),
        router: require("./nexacorp-active/router")
    }
];

const findLab = (slug) => LABS.find((lab) => lab.slug === slug) || null;

module.exports = { LABS, findLab };
