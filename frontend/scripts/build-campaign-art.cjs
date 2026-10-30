/*
 * Builds the illustrated backgrounds for the Networking campaign map
 * (public/campaign/*.webp), its animation data (scene.json, hero sprite
 * sheet) and the story reader's library study (public/story/study.webp)
 * from Kenney's CC0 isometric packs.
 *
 * The map is one continuous cyber-dungeon in the spirit of a classic
 * dungeon-crawl campaign map: torch-lit stone terraces and cliffs rising
 * out of chasms of glowing "molten data", aisles of server racks with
 * blinking LEDs, terminals, archways and walls, with the trail as a
 * boardwalk winding up through it. It is drawn on a single global
 * isometric grid and cut into one image per world (plus the entry and the
 * summit). Every random choice is a hash of the cell's position, so
 * anything that crosses a world boundary is drawn identically in both
 * slices. The trail is computed exactly as CampaignMap.tsx lays it out, so
 * the boardwalk sits under it and nothing covers a level.
 *
 * Usage (sharp is only needed for this offline step):
 *   1. Download and unzip into one folder (kenney.nl/assets/...):
 *        isometric-miniature-dungeon, isometric-miniature-library
 *   2. npm i --no-save sharp
 *   3. node scripts/build-campaign-art.cjs <folder-with-the-packs>
 */

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { COURSES } = require("../../backend/learn/curriculum");

const KENNEY = process.argv[2];
const OUT = path.join(__dirname, "..", "public", "campaign");

if (!KENNEY) {
  console.error("Usage: node scripts/build-campaign-art.cjs <kenney-packs-folder>");
  process.exit(1);
}

// Map units (must match CampaignMap.tsx): 1000 wide, worlds 600 tall
const UNITS_W = 1000;
const WORLD_H = 600;
const ENTRY_H = 150;
const SUMMIT_H = 170;
const PX = 2; // output pixels per map unit (2000 px wide images)

// Sprites are 256x512 with the tile's top face centred at (128, 428).
// At 7/16 scale a tile is 112x56 on screen (whole pixels: no seams).
const SCALE = 0.4375;
const TW = 256 * SCALE;
const TH = 128 * SCALE;
const ANCHOR = { x: 128 * SCALE, y: 428 * SCALE };
const SLAB = Math.round(21 * SCALE); // one floor slab's thickness
const SLABS_PER_LEVEL = 2;
const FOUNDATION = 4; // slabs below ground, seen as cliffs over the chasms

// ---------- deterministic randomness ----------

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hash2 = (a, b, seed) => {
  let h = (a * 374761393 + b * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

// Bilinear value noise: smooth blobs for terrain and chasms
const smooth = (x, y, seed) => {
  const xi = Math.floor(x), yi = Math.floor(y);
  const fx = x - xi, fy = y - yi;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const a = hash2(xi, yi, seed), b = hash2(xi + 1, yi, seed), c = hash2(xi, yi + 1, seed), d = hash2(xi + 1, yi + 1, seed);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
};

const pick = (list, u) => {
  const total = list.reduce((s, [, w]) => s + w, 0);
  let x = u * total;
  for (const [item, w] of list) {
    if ((x -= w) <= 0) return item;
  }
  return list[0][0];
};

// ---------- sprites ----------

const D = (name, dir) => ["dungeon", name, dir];
const L = (name, dir) => ["library", name, dir];

const cache = new Map();
// bright: lighting multiplier; kind "rack" re-skins a bookcase as a server
// rack (dark steel, blinking LEDs), "terminal" a display case as a console
async function sprite(pack, name, dir = "S", bright = 1, kind = "") {
  const key = `${pack}/${name}_${dir}@${bright}${kind}`;
  if (cache.has(key)) return cache.get(key);
  const file = path.join(KENNEY, `isometric-miniature-${pack}`, "Isometric", `${name}_${dir}.png`);
  if (!fs.existsSync(file)) throw new Error(`Missing sprite ${file}`);
  const w = Math.round(256 * SCALE), h = Math.round(512 * SCALE);
  let img = sharp(file).resize(w, h);
  if (kind === "rack") img = img.modulate({ brightness: 0.62 * bright, saturation: 0.12, hue: 200 });
  else if (kind === "terminal") img = img.modulate({ brightness: 0.75 * bright, saturation: 0.3, hue: 190 });
  else if (bright !== 1) img = img.modulate({ brightness: bright });
  let buf = await img.png().toBuffer();
  if (kind === "rack" || kind === "terminal") {
    // LEDs (or a screen's glow) painted only where the sprite is opaque
    const r = rng(name.length * 97 + dir.charCodeAt(0));
    const leds = Array.from({ length: kind === "rack" ? 70 : 24 }, () => {
      const x = Math.round(20 + r() * (w - 40)), y = Math.round(h * (kind === "rack" ? 0.52 : 0.7) + r() * h * 0.26);
      const c = ["#22d3ee", "#34d399", "#22d3ee", "#f472b6", "#fbbf24"][Math.floor(r() * 5)];
      return `<rect x="${x}" y="${y}" width="${1 + Math.round(r() * 2)}" height="1.6" fill="${c}"/>`;
    }).join("");
    const overlay = Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${leds}</svg>`);
    buf = await sharp(buf).composite([{ input: overlay, blend: "atop" }]).png().toBuffer();
  }
  cache.set(key, buf);
  return buf;
}

// ---------- the trail, as CampaignMap.tsx lays it out (global units) ----------

const MODULES = COURSES.networking.modules;
const TOTAL_H = ENTRY_H + MODULES.length * WORLD_H + SUMMIT_H;
const worldTop = (w) => TOTAL_H - ENTRY_H - (w + 1) * WORLD_H; // w = 0 is the bottom world

function layoutTrail() {
  const line = [{ x: 500, y: TOTAL_H - 46 }];
  const chests = [];
  let k = 0;
  MODULES.forEach((m, w) => {
    const n = m.topics.length;
    const pad = 92;
    const step = n > 1 ? (WORLD_H - pad * 2) / (n - 1) : 0;
    const bottom = worldTop(w) + WORLD_H;
    m.topics.forEach((t, j) => {
      const jitter = ((k * 37) % 9) - 4;
      const xp = Math.max(12, Math.min(88, 50 + 33 * Math.sin(k * 0.95 + 0.6) + jitter));
      const y = bottom - pad - j * step;
      line.push({ x: xp * 10, y });
      if (m.chests.some((c) => c.after === t.id)) {
        chests.push({ x: Math.max(8, Math.min(92, xp + (xp > 50 ? -19 : 19))) * 10, y: y - step * 0.42 });
      }
      k += 1;
    });
  });
  line.push({ x: 500, y: 92 });
  return { line, chests };
}

const distToSeg = (p, a, b) => {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
};

const distToLine = (p, line) => {
  let d = Infinity;
  for (let i = 0; i < line.length - 1; i++) d = Math.min(d, distToSeg(p, line[i], line[i + 1]));
  return d;
};

// ---------- the dungeon plan ----------

const SEED = 4404;
const GX = (UNITS_W * PX) / 2;
const GY = -(UNITS_W * PX) / 4;
const cellScreen = (i, j) => ({ x: GX + (i - j) * (TW / 2), y: GY + (i + j) * (TH / 2) });

const THEME = {
  floor: D("stone"),
  worn: [D("stoneUneven"), D("stoneInset")],
  road: D("planks"),
  props: [
    [D("stoneColumn"), 5], [D("barrelsStacked"), 2], [D("woodenCrates"), 2], [L("candleStandDouble"), 7],
    [D("chestClosed"), 1], [D("stairsSpiral"), 1], [D("woodenSupports"), 2], [D("stoneWallRound"), 1],
    [D("tableRoundItemsChairs"), 1], [L("displayCase"), 3, "terminal"], [L("displayCaseOpen"), 2, "terminal"],
  ],
  walls: [[D("stoneWall"), 4], [D("stoneWallWindow"), 2], [D("stoneWallArchway"), 2], [D("stoneWallColumn"), 2], [D("stoneWallAged"), 2], [D("stoneWallGateBars"), 1], [D("stoneWallBroken"), 2]],
  racks: [L("bookcaseWideEmpty"), L("bookcaseEmpty"), L("bookcaseGlass"), L("bookcaseWideEmpty")],
};

function buildDungeon() {
  const { line, chests } = layoutTrail();
  const keepOut = [
    ...chests.map((c) => ({ x0: c.x - 55, x1: c.x + 55, y0: c.y - 55, y1: c.y + 55 })),
    ...MODULES.map((m, w) => {
      const top = worldTop(w);
      return w % 2 ? { x0: 690, x1: 1000, y0: top + 430, y1: top + 600 } : { x0: 0, x1: 310, y0: top + 430, y1: top + 600 };
    }),
  ];
  const blocked = (u) => keepOut.some((b) => u.x > b.x0 && u.x < b.x1 && u.y > b.y0 && u.y < b.y1);

  const W = UNITS_W * PX, H = TOTAL_H * PX;
  const cells = new Map();
  const maxA = Math.ceil((H - GY) / (TH / 2)) + 10;
  const maxB = Math.ceil(W / TW) + 3;
  for (let a = Math.floor(-GY / (TH / 2)) - 40; a < maxA; a++) {
    for (let b = -maxB; b <= maxB; b++) {
      if ((a + b) % 2) continue;
      const i = (a + b) / 2, j = (a - b) / 2;
      const s = cellScreen(i, j);
      if (s.x < -TW || s.x > W + TW || s.y < -TH * 2 || s.y > H + TH * 6) continue;
      const u = { x: s.x / PX, y: s.y / PX };
      cells.set(`${i},${j}`, { i, j, s, u, d: distToLine(u, line), blocked: blocked(u) });
    }
  }

  for (const c of cells.values()) {
    // chasms of molten data, well away from the trail
    c.chasm = !c.blocked && c.d > 100 && smooth(c.i / 6, c.j / 6, SEED + 50) < 0.36;
    if (c.chasm || c.d < 92 || c.blocked) {
      c.level = 0;
      continue;
    }
    const n = smooth(c.i / 5, c.j / 5, SEED + 3);
    const raw = n > 0.66 ? 3 : n > 0.52 ? 2 : n > 0.4 ? 1 : 0;
    c.level = Math.min(raw, Math.floor((c.d - 92) / 34) + 1);
  }

  const free = (c) => c && !c.chasm && c.d > 72 && !c.blocked && c.u.y > 4 && c.u.y < TOTAL_H - 4;
  const things = new Map(); // key -> { spec, dir, kind }

  // server-room blocks: rack aisles every other row
  for (const c of cells.values()) {
    if (!free(c)) continue;
    const room = hash2(Math.floor(c.i / 6), Math.floor(c.j / 6), SEED + 60) < 0.32;
    if (!room) continue;
    const alongI = hash2(Math.floor(c.i / 6), Math.floor(c.j / 6), SEED + 61) < 0.5;
    const row = alongI ? c.j : c.i;
    const col = alongI ? c.i : c.j;
    if (row % 2 === 0 && col % 6 !== 0) {
      things.set(`${c.i},${c.j}`, { spec: THEME.racks[Math.floor(hash2(c.i, c.j, SEED + 62) * THEME.racks.length)], dir: alongI ? "E" : "S", kind: "rack" });
    }
  }

  // wall runs
  for (const c of cells.values()) {
    for (const [axis, start] of [["i", c.i % 7 === 0], ["j", c.j % 7 === 0]]) {
      if (!start || hash2(c.i, c.j, SEED + (axis === "i" ? 11 : 13)) > 0.15) continue;
      const len = 3 + Math.floor(hash2(c.i, c.j, SEED + 17) * 4);
      const run = [];
      for (let s = 0; s < len; s++) {
        const cc = cells.get(axis === "i" ? `${c.i + s},${c.j}` : `${c.i},${c.j + s}`);
        if (!free(cc) || cc.level !== c.level || things.has(`${cc.i},${cc.j}`)) break;
        run.push(cc);
      }
      if (run.length < 3) continue;
      for (const cc of run) things.set(`${cc.i},${cc.j}`, { spec: pick(THEME.walls, hash2(cc.i, cc.j, SEED + 37)), dir: axis === "i" ? "S" : "E", kind: "" });
    }
  }

  // props on a checkerboard so they never touch, denser near the trail
  for (const c of cells.values()) {
    const key = `${c.i},${c.j}`;
    if (things.has(key) || !free(c) || (c.i + c.j) % 2) continue;
    if (hash2(c.i, c.j, SEED + 23) < (c.d < 150 ? 0.42 : 0.26)) {
      const u = hash2(c.i, c.j, SEED + 29);
      const total = THEME.props.reduce((s, p) => s + p[1], 0);
      let x = u * total, chosen = THEME.props[0];
      for (const p of THEME.props) {
        if ((x -= p[1]) <= 0) { chosen = p; break; }
      }
      things.set(key, { spec: chosen[0], dir: hash2(c.i, c.j, SEED + 41) < 0.5 ? "S" : "E", kind: chosen[2] || "" });
    }
  }

  // light sources for the animated layer: torches warm, terminals and
  // every few racks cyan
  const lights = [];
  for (const [key, t] of things) {
    const c = cells.get(key);
    const rise = c.level * SLABS_PER_LEVEL * SLAB;
    const isTorch = t.spec[1].startsWith("candleStand");
    if (isTorch || t.kind === "terminal" || (t.kind === "rack" && hash2(c.i, c.j, SEED + 70) < 0.25)) {
      const neon = t.kind !== "" || hash2(c.i, c.j, SEED + 71) < 0.35;
      lights.push([Math.round(c.s.x / PX), Math.round((c.s.y - rise - (isTorch ? 30 : 18)) / PX), neon ? 1 : 0]);
    }
  }
  const lava = [...cells.values()].filter((c) => c.chasm && (c.i + c.j) % 2 === 0).map((c) => [Math.round(c.s.x / PX), Math.round(c.s.y / PX)]);

  return { cells, things, line, lights, lava };
}

// ---------- render one band of the dungeon ----------

async function renderWindow(world, y0, height) {
  const W = UNITS_W * PX;
  const H = Math.round(height * PX);
  const oy = y0 * PX;
  const layers = [];

  const draw = async (spec, c, sub, dir, rise, bright, kind = "") => {
    const [pack, name] = spec;
    const top = Math.round(c.s.y - oy - ANCHOR.y - rise);
    if (top > H || top + 512 * SCALE < 0) return;
    layers.push({ order: c.i + c.j + sub, input: await sprite(pack, name, dir, bright, kind), left: Math.round(c.s.x - ANCHOR.x), top });
  };

  const inView = [];
  for (const c of world.cells.values()) {
    const y = c.s.y - oy;
    if (y < -TH * 3 || y > H + TH * 8) continue;
    inView.push(c);
    if (c.chasm) continue;
    const key = `${c.i},${c.j}`;
    let spec = THEME.floor;
    if (hash2(Math.floor(c.i / 3), Math.floor(c.j / 3), SEED + 5) < 0.12) spec = THEME.worn[Math.floor(hash2(c.i, c.j, SEED + 9) * THEME.worn.length)];
    if (c.d < 30) spec = THEME.road;
    const dir = ["N", "E", "S", "W"][Math.floor(hash2(c.i, c.j, SEED + 31) * 4)];
    const slabs = c.level * SLABS_PER_LEVEL;
    // foundation slabs below ground show as cliffs where a chasm opens
    for (let s = -FOUNDATION; s <= slabs; s++) {
      const isTop = s === slabs;
      const bright = isTop ? [0.86, 1.0, 1.08, 1.15][c.level] : s < 0 ? 0.36 + (s + FOUNDATION) * 0.04 : 0.5 + s * 0.04;
      await draw(isTop ? spec : THEME.floor, c, s * 0.001, isTop ? (spec === THEME.road ? "N" : dir) : "N", s * SLAB, bright);
    }
    const t = world.things.get(key);
    if (t) await draw(t.spec, c, 0.5, t.dir, c.level * SLABS_PER_LEVEL * SLAB, [0.9, 1, 1.06, 1.12][c.level], t.kind);
  }

  layers.sort((a, b) => a.order - b.order);

  // molten data: the chasm floor glows cyan to violet, with a faint
  // binary grain, drawn under everything
  const depth = (FOUNDATION + 1) * SLAB;
  const diamond = (c) => {
    const x = c.s.x, y = c.s.y - oy + depth;
    return `${x},${y - TH / 2 - 2} ${x + TW / 2 + 3},${y} ${x},${y + TH / 2 + 2} ${x - TW / 2 - 3},${y}`;
  };
  const chasms = inView.filter((c) => c.chasm);
  const glyphs = chasms.filter((c) => hash2(c.i, c.j, SEED + 80) < 0.5).map((c) => {
    const x = c.s.x + (hash2(c.i, c.j, SEED + 81) - 0.5) * 50, y = c.s.y - oy + depth + (hash2(c.i, c.j, SEED + 82) - 0.5) * 20;
    return `<text x="${x.toFixed(0)}" y="${y.toFixed(0)}" font-family="monospace" font-size="11" fill="#e0fbff" fill-opacity=".35">${hash2(c.i, c.j, SEED + 83) < 0.5 ? "1010" : "0110"}</text>`;
  }).join("");
  const lava = Buffer.from(`
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lv" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#22d3ee"/><stop offset=".5" stop-color="#6366f1"/><stop offset="1" stop-color="#c026d3"/>
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="10"/></filter>
      </defs>
      <rect width="100%" height="100%" fill="#120a1f"/>
      <g filter="url(#glow)">${chasms.map((c) => `<polygon points="${diamond(c)}" fill="url(#lv)"/>`).join("")}</g>
      <g opacity=".9">${chasms.map((c) => `<polygon points="${diamond(c)}" fill="url(#lv)"/>`).join("")}</g>
      <g filter="url(#glow)" opacity=".7">${chasms.filter((c) => hash2(c.i, c.j, SEED + 84) < 0.55).map((c) => `<ellipse cx="${c.s.x}" cy="${c.s.y - oy + depth}" rx="26" ry="9" fill="#e0fbff"/>`).join("")}</g>
      ${glyphs}
    </svg>`);

  // vintage grade: warm torch light, cool shadows, side vignette, grain
  const grade = Buffer.from(`
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="side" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#140c1c"/><stop offset=".15" stop-color="#fff"/>
          <stop offset=".85" stop-color="#fff"/><stop offset="1" stop-color="#140c1c"/>
        </linearGradient>
        <radialGradient id="lift"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset=".6" stop-color="#fff" stop-opacity=".25"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#side)"/>
      <rect width="100%" height="100%" fill="#3a2852" fill-opacity=".55"/>
      ${world.line.filter((p) => p.y * PX - oy > -500 && p.y * PX - oy < H + 500).map((p) => `<circle cx="${p.x * PX}" cy="${p.y * PX - oy}" r="420" fill="url(#lift)"/>`).join("")}
    </svg>`);
  const glowLights = world.lights
    .map(([x, y, neon]) => ({ x: x * PX, y: y * PX - oy, neon }))
    .filter((l) => l.y > -300 && l.y < H + 300);
  const trailLights = world.line.filter((p) => p.y * PX - oy > -300 && p.y * PX - oy < H + 300);
  const light = Buffer.from(`
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="warm"><stop offset="0" stop-color="#ffc061" stop-opacity=".85"/><stop offset=".35" stop-color="#ff9a2e" stop-opacity=".28"/><stop offset="1" stop-color="#ff9a2e" stop-opacity="0"/></radialGradient>
        <radialGradient id="neon"><stop offset="0" stop-color="#67e8f9" stop-opacity=".8"/><stop offset=".35" stop-color="#22d3ee" stop-opacity=".22"/><stop offset="1" stop-color="#22d3ee" stop-opacity="0"/></radialGradient>
        <radialGradient id="lavaC"><stop offset="0" stop-color="#22d3ee" stop-opacity=".35"/><stop offset="1" stop-color="#22d3ee" stop-opacity="0"/></radialGradient>
        <radialGradient id="lavaM"><stop offset="0" stop-color="#c026d3" stop-opacity=".35"/><stop offset="1" stop-color="#c026d3" stop-opacity="0"/></radialGradient>
        <radialGradient id="path"><stop offset="0" stop-color="#ffd27a" stop-opacity=".45"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>
        <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 .5  0 0 0 0 .45  0 0 0 0 .4  0 0 0 .07 0"/></filter>
      </defs>
      ${trailLights.map((p) => `<circle cx="${p.x * PX}" cy="${p.y * PX - oy}" r="220" fill="url(#path)"/>`).join("")}
      ${glowLights.map((l) => `<circle cx="${l.x}" cy="${l.y}" r="${l.neon ? 120 : 160}" fill="url(#${l.neon ? "neon" : "warm"})"/>`).join("")}
      ${world.lava.map(([x, y]) => ({ x: x * PX, y: y * PX - oy })).filter((p) => p.y > -200 && p.y < H + 200).map((p, k) => `<circle cx="${p.x}" cy="${p.y}" r="150" fill="url(#${k % 3 ? "lavaC" : "lavaM"})"/>`).join("")}
      <rect width="100%" height="100%" filter="url(#grain)"/>
    </svg>`);

  const base = await sharp(lava)
    .composite(layers.map(({ input, left, top }) => ({ input, left, top })))
    .png()
    .toBuffer();
  const graded = await sharp(base).modulate({ brightness: 0.92, saturation: 1.12 }).composite([{ input: grade, blend: "multiply" }]).png().toBuffer();
  return sharp(graded).composite([{ input: light, blend: "screen" }]);
}

// ---------- the animated layer's character sprite sheet ----------
// Kenney's dungeon pack ships one adventurer in 8 facing directions
// (0 up-left, 1 left, 2 down-left, 3 down, 4 down-right, 5 right,
// 6 up-right, 7 up), each with an idle pose and a 10-frame run. They are
// packed into one PixiJS sprite sheet: frames "d{dir}_idle", "d{dir}_run{n}".

async function buildCharacterSheet() {
  const dir = path.join(KENNEY, "isometric-miniature-dungeon", "Characters", "Male");
  const crop = { left: 16, top: 150, width: 224, height: 362 };
  const scale = 0.5;
  const fw = Math.round(crop.width * scale), fh = Math.round(crop.height * scale);
  const cols = 11;
  const comps = [];
  const frames = {};
  const animations = {};
  let n = 0;
  for (let d = 0; d < 8; d++) {
    const names = [["idle", `Male_${d}_Idle0.png`], ...Array.from({ length: 10 }, (_, k) => [`run${k}`, `Male_${d}_Run${k}.png`])];
    animations[`run_${d}`] = [];
    for (const [label, file] of names) {
      const x = (n % cols) * fw, y = Math.floor(n / cols) * fh;
      comps.push({ input: await sharp(path.join(dir, file)).extract(crop).resize(fw, fh).png().toBuffer(), left: x, top: y });
      const name = `d${d}_${label}`;
      frames[name] = { frame: { x, y, w: fw, h: fh }, sourceSize: { w: fw, h: fh }, spriteSourceSize: { x: 0, y: 0, w: fw, h: fh }, anchor: { x: (128 - crop.left) / crop.width, y: (428 - crop.top) / crop.height } };
      if (label !== "idle") animations[`run_${d}`].push(name);
      n += 1;
    }
  }
  const W = cols * fw, H = Math.ceil(n / cols) * fh;
  await sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(comps)
    .png({ compressionLevel: 9, palette: true, quality: 90 })
    .toFile(path.join(OUT, "hero.png"));
  fs.writeFileSync(
    path.join(OUT, "hero.json"),
    JSON.stringify({ frames, animations, meta: { image: "hero.png", format: "RGBA8888", size: { w: W, h: H }, scale: "1" } })
  );
}

// ---------- the story reader's backdrop: a candle-lit library study ----------
// A square room seen from the front corner: bookcases line the two back
// walls, a carpet runner crosses the floor, reading tables, lecterns and
// candle stands fill it. The reader blurs it slightly behind the book.

async function renderStudy() {
  // Full-size sprites, camera inside the room: the back corner sits just
  // above the book and the floor runs off every edge of the frame
  const S = 1;
  const tw = 256 * S, th = 128 * S;
  const anchor = { x: 128 * S, y: 428 * S };
  const W = 2400, H = 1350;
  const N = 16;
  const OX = W / 2;
  const OY = 250;
  const scr = (i, j) => ({ x: OX + (i - j) * (tw / 2), y: OY + (i + j) * (th / 2) });
  const r = rng(4242);
  const big = new Map();
  const spr = async (pack, name, dir, bright = 1) => {
    const key = `${pack}/${name}_${dir}@${bright}`;
    if (!big.has(key)) {
      const file = path.join(KENNEY, `isometric-miniature-${pack}`, "Isometric", `${name}_${dir}.png`);
      let img = sharp(file);
      if (bright !== 1) img = img.modulate({ brightness: bright });
      big.set(key, await img.png().toBuffer());
    }
    return big.get(key);
  };

  const layers = [];
  const glows = [];
  const put = async (pack, name, dir, i, j, sub = 0.5, bright = 1) => {
    const s = scr(i, j);
    if (s.x < -tw || s.x > W + tw || s.y < -th * 4 || s.y > H + th * 4) return;
    layers.push({ order: i + j + sub, input: await spr(pack, name, dir, bright), left: Math.round(s.x - anchor.x), top: Math.round(s.y - anchor.y) });
    if (name.startsWith("candleStand")) glows.push({ x: s.x, y: s.y - 150 });
  };

  // floor: aligned planks
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) await put("dungeon", "planks", "N", i, j, -1000);
  }

  // back walls: bookcases, with a doorway in each
  const cases = ["bookcaseWideBooks", "bookcaseBooksLadder", "bookcaseWideBooksLadder", "bookcaseBooks", "bookcaseHalfWideBooks", "bookcaseWideBooks"];
  for (let k = 0; k < N; k++) {
    await put("library", k === 2 ? "wallDoorway" : cases[Math.floor(r() * cases.length)], "E", k, 0);
    if (k > 0) await put("library", k === 2 ? "wallDoorway" : cases[Math.floor(r() * cases.length)], "S", 0, k);
  }

  // the book covers the middle: furniture lives on the two sides
  const spots = [
    // right side (i large, j small)
    ["library", "longTableDecoratedChairsBooks", "E", 6, 2], ["library", "bookStand", "S", 4, 1], ["library", "displayCaseBooks", "E", 8, 1],
    ["library", "longTableChairs", "E", 9, 4], ["dungeon", "chestClosed", "S", 11, 1], ["library", "displayCaseSword", "E", 7, 5],
    ["library", "libraryChair", "S", 11, 5], ["dungeon", "barrel", "E", 12, 3],
    // left side (i small, j large)
    ["library", "longTableDecoratedChairsBooks", "S", 2, 6], ["library", "bookStand", "E", 1, 4], ["library", "displayCase", "S", 1, 8],
    ["library", "longTableDecoratedChairs", "S", 4, 9], ["dungeon", "woodenCrates", "E", 1, 11], ["library", "bookcaseHalfBooks", "S", 5, 7],
    ["library", "bookStandEmpty", "E", 5, 11], ["dungeon", "barrels", "S", 3, 12],
  ];
  for (const [pack, name, dir, i, j] of spots) await put(pack, name, dir, i, j);

  // candles along the runners and by the tables
  for (const [i, j] of [[1, 1], [3, 3], [5, 1], [1, 5], [8, 3], [3, 8], [10, 2], [2, 10], [9, 6], [6, 9], [12, 5], [5, 12]]) {
    await put("library", "candleStandDouble", "S", i, j, 0.6);
  }

  layers.sort((a, b) => a.order - b.order);

  const glowSvg = Buffer.from(`
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="c"><stop offset="0" stop-color="#ffb24a" stop-opacity=".75"/><stop offset=".35" stop-color="#ff9a2e" stop-opacity=".25"/><stop offset="1" stop-color="#ff9a2e" stop-opacity="0"/></radialGradient>
        <radialGradient id="pool" cx="50%" cy="55%" r="45%"><stop offset="0" stop-color="#ffcf7a" stop-opacity=".35"/><stop offset="1" stop-color="#ffcf7a" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#pool)"/>
      ${glows.map((g) => `<circle cx="${g.x}" cy="${g.y}" r="300" fill="url(#c)"/>`).join("")}
    </svg>`);
  const gradeSvg = Buffer.from(`
    <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="v" cx="50%" cy="55%" r="75%"><stop offset="40%" stop-color="#fff"/><stop offset="100%" stop-color="#1c0d05"/></radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#v)"/>
      <rect width="100%" height="100%" fill="#5a2e0e" fill-opacity=".28"/>
    </svg>`);

  // the room's upper wall fades into shadow above the bookcases
  const ceiling = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d0603" stop-opacity=".95"/><stop offset=".2" stop-color="#0d0603" stop-opacity="0"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`);
  const base = await sharp({ create: { width: W, height: H, channels: 4, background: "#120a06" } })
    .composite(layers.map(({ input, left, top }) => ({ input, left, top })))
    .png()
    .toBuffer();
  const graded = await sharp(base).modulate({ brightness: 0.78, saturation: 1.05 }).composite([{ input: gradeSvg, blend: "multiply" }]).png().toBuffer();
  return sharp(graded).composite([{ input: glowSvg, blend: "screen" }, { input: ceiling }]);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const world = buildDungeon();

  for (let w = 0; w < MODULES.length; w++) {
    const scene = await renderWindow(world, worldTop(w), WORLD_H);
    await scene.webp({ quality: 76, effort: 5 }).toFile(path.join(OUT, `world-${MODULES[w].num}.webp`));
    console.log(`world-${MODULES[w].num}.webp`);
  }
  await (await renderWindow(world, TOTAL_H - ENTRY_H, ENTRY_H)).webp({ quality: 76, effort: 5 }).toFile(path.join(OUT, "entry.webp"));
  await (await renderWindow(world, 0, SUMMIT_H)).webp({ quality: 76, effort: 5 }).toFile(path.join(OUT, "summit.webp"));
  console.log("entry.webp, summit.webp");

  // light sources [x, y, neon] and chasm points for the animated layer
  fs.writeFileSync(path.join(OUT, "scene.json"), JSON.stringify({ lights: world.lights, lava: world.lava }));
  await buildCharacterSheet();
  console.log(`scene.json (${world.lights.length} lights, ${world.lava.length} chasm points), hero.*`);

  const storyOut = path.join(__dirname, "..", "public", "story");
  const study = await renderStudy();
  await study.webp({ quality: 76, effort: 5 }).toFile(path.join(storyOut, "study.webp"));
  console.log("story/study.webp");

  fs.writeFileSync(
    path.join(OUT, "CREDITS.txt"),
    "Campaign map art, characters (and public/story/study.webp) composed from Kenney's Isometric Miniature Dungeon and Library packs.\n" +
      "Created by Kenney (www.kenney.nl), licensed CC0 1.0 (public domain): https://creativecommons.org/publicdomain/zero/1.0/\n" +
      "Regenerate with: node scripts/build-campaign-art.cjs <kenney-packs-folder>\n"
  );
  console.log("done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
