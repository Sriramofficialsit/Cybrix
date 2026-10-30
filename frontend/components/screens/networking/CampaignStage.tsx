"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

// The living layer of the campaign map, drawn with PixiJS (WebGL):
//   - the learner's avatar standing at the current level, and running the
//     trail to the next one when a level is cleared
//   - residents walking the boardwalks of every unlocked world, now and
//     then saying a line from lib/campaignStory.ts
//   - every painted torch and neon lamp flickering, the molten-data
//     chasms shimmering with bits rising out of them, data packets flowing
//     along the trail, motes drifting through the light, sparks on arrival
//
// The canvas is only as big as the viewport and stays pinned inside the
// scrolling map (position: sticky); each frame it reads the scroll offset
// and draws just what is on screen, in the same map units as the art
// (1000 wide), so the glows sit on the painted candles. It sits above the
// art and trail but below the level buttons, and ignores the pointer.

export type StageWorld = { num: number; top: number; bottom: number; locked: boolean; lines: string[] };

type Pt = { x: number; y: number };

type Props = {
  viewportRef: RefObject<HTMLDivElement | null>;
  bubbleRef: RefObject<HTMLDivElement | null>; // HTML layer over the map for speech bubbles
  mapRef: RefObject<HTMLDivElement | null>;
  mapH: number; // map height in units
  trail: Pt[]; // gate, every level, summit (units)
  currentIdx: number; // index of the current level among the levels; = levels count when complete
  worlds: StageWorld[];
};

const HERO_KEY = "cm-hero-at";
const UNIT_SCALE = 0.4375; // sprite sheet px -> map units (matches the art)
const NPC_TINTS = [0xffffff, 0xd8c8ff, 0xffd6a5, 0xb8f2e6, 0xffc4d6, 0xc7e9ff];

// ---------- the trail as a dense polyline (same curve as the SVG) ----------

function sampleTrail(pts: Pt[], per = 24) {
  const out: Pt[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    for (let k = 0; k < per; k++) {
      const t = k / per, u = 1 - t;
      out.push({
        x: u * u * u * p1.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * p2.x,
        y: u * u * u * p1.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * p2.y,
      });
    }
  }
  out.push(pts[pts.length - 1]);
  const len = [0];
  for (let i = 1; i < out.length; i++) len.push(len[i - 1] + Math.hypot(out[i].x - out[i - 1].x, out[i].y - out[i - 1].y));
  const at = (s: number) => {
    const d = Math.max(0, Math.min(len[len.length - 1], s));
    let lo = 0, hi = len.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (len[mid] <= d) lo = mid;
      else hi = mid;
    }
    const f = (d - len[lo]) / (len[hi] - len[lo] || 1);
    const a = out[lo], b = out[hi];
    return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, dx: b.x - a.x, dy: b.y - a.y };
  };
  // arc length at each original point (point k sits at sample k * per)
  const nodeS = pts.map((_, k) => len[Math.min(k * per, len.length - 1)]);
  return { at, total: len[len.length - 1], nodeS };
}

// 8 facing directions in the sprite sheet: 0 up-left, 1 left, 2 down-left,
// 3 down, 4 down-right, 5 right, 6 up-right, 7 up
const facing = (dx: number, dy: number) => {
  const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
  return (((5 - Math.round(deg / 45)) % 8) + 8) % 8;
};

// seeded randomness so residents start in the same places every visit
const rand = (seed: number) => {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

export default function CampaignStage({ viewportRef, bubbleRef, mapRef, mapH, trail, currentIdx, worlds }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  // canvas follows the viewport's size
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const sync = () => setSize({ w: vp.clientWidth, h: vp.clientHeight });
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(vp);
    return () => ro.disconnect();
  }, [viewportRef]);

  // Everything the scene needs, read once per build
  const sceneKey = `${currentIdx}|${worlds.map((w) => `${w.num}${w.locked ? "l" : "o"}`).join(",")}|${trail.length}`;

  useEffect(() => {
    const host = hostRef.current;
    const vp = viewportRef.current;
    const mapEl = mapRef.current;
    const bubbleHost = bubbleRef.current;
    if (!host || !vp || !mapEl || !bubbleHost || !size.w || !size.h) return;

    let cancelled = false;
    let teardown: (() => void) | null = null;

    (async () => {
      const PIXI = await import("pixi.js");
      if (cancelled) return;

      const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const app = new PIXI.Application();
      await app.init({
        width: size.w,
        height: size.h,
        backgroundAlpha: 0,
        antialias: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
        autoDensity: true,
        preference: "webgl",
      });
      if (cancelled) {
        app.destroy(true);
        return;
      }
      host.appendChild(app.canvas);

      const [sheet, scene] = await Promise.all([
        PIXI.Assets.load("/campaign/hero.json"),
        fetch("/campaign/scene.json").then((r) => r.json()).catch(() => ({ lights: [], lava: [] })),
      ]);
      if (cancelled) {
        app.destroy(true);
        return;
      }

      // soft round glow, drawn once
      const glowCanvas = document.createElement("canvas");
      glowCanvas.width = glowCanvas.height = 64;
      const g2 = glowCanvas.getContext("2d")!;
      const grad = g2.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, "rgba(255,255,255,1)");
      grad.addColorStop(0.35, "rgba(255,255,255,.45)");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      g2.fillStyle = grad;
      g2.fillRect(0, 0, 64, 64);
      const glowTex = PIXI.Texture.from(glowCanvas);

      const path = sampleTrail(trail);
      const worldOf = (y: number) => worlds.find((w) => y >= w.top && y < w.bottom);

      // ---------- layers ----------
      const world = new PIXI.Container(); // map units
      const lightLayer = new PIXI.Container();
      const packetLayer = new PIXI.Container();
      const actorLayer = new PIXI.Container();
      actorLayer.sortableChildren = true;
      const fxLayer = new PIXI.Container();
      world.addChild(lightLayer, packetLayer, actorLayer, fxLayer);
      const screenLayer = new PIXI.Container(); // pixels: motes and speech bubbles
      app.stage.addChild(world, screenLayer);

      // ---------- torches (warm) and neon lamps (cyan) ----------
      const lights = ((scene.lights || []) as [number, number, number?][]).map(([x, y, neon], i) => {
        const s = new PIXI.Sprite(glowTex);
        s.anchor.set(0.5);
        s.position.set(x, y);
        s.blendMode = "add";
        s.tint = neon ? 0x22d3ee : 0xffb347;
        s.scale.set(1.5);
        lightLayer.addChild(s);
        const w = worldOf(y);
        return { s, phase: i * 1.7, speed: neon ? 5 + (i % 3) : 2 + (i % 5) * 0.6, neon: Boolean(neon), dim: !w || w.locked ? 0.25 : 1 };
      });

      // ---------- molten-data chasms: a slow shimmer, bits rising ----------
      const lava = ((scene.lava || []) as [number, number][]).map(([x, y], i) => {
        const s = new PIXI.Sprite(glowTex);
        s.anchor.set(0.5);
        s.position.set(x, y + 14);
        s.blendMode = "add";
        s.tint = i % 3 ? 0x22d3ee : 0xc026d3;
        s.scale.set(1.6, 0.8);
        lightLayer.addChild(s);
        const w = worldOf(y);
        return { s, phase: i * 0.83, dim: !w || w.locked ? 0.35 : 1 };
      });
      type Bit = { s: import("pixi.js").Sprite; vy: number; life: number };
      const bits: Bit[] = [];

      // ---------- data packets along the trail ----------
      // how far along the trail a level is (the avatar runs up to it)
      const heroS = (idx: number) => {
        const node = path.nodeS[Math.min(idx + 1, path.nodeS.length - 1)];
        return idx >= trail.length - 2 ? path.total : Math.max(0, node - 6);
      };
      // where the avatar waits: beside the level, on the side away from the
      // "You are here" banner (which sits toward the map's centre)
      const standAt = (idx: number) => {
        const node = trail[Math.min(idx + 1, trail.length - 1)];
        if (idx >= trail.length - 2) return { x: node.x + 46, y: node.y + 14 };
        return { x: node.x + (node.x > 500 ? 50 : -50), y: node.y + 10 };
      };
      const reached = heroS(currentIdx);
      const packets = Array.from({ length: 22 }, (_, i) => {
        const lit = i < 15;
        const s = new PIXI.Sprite(glowTex);
        s.anchor.set(0.5);
        s.blendMode = "add";
        s.tint = lit ? 0x67e8f9 : 0xffffff;
        s.scale.set(lit ? 0.32 : 0.22);
        s.alpha = lit ? 0.95 : 0.35;
        packetLayer.addChild(s);
        return { s, lit, offset: i / (lit ? 15 : 7) };
      });

      // ---------- characters ----------
      const runFrames = (d: number) => sheet.animations[`run_${d}`] as import("pixi.js").Texture[];
      const idleFrame = (d: number) => sheet.textures[`d${d}_idle`] as import("pixi.js").Texture;

      const makeActor = (scale: number, tint: number) => {
        const shadow = new PIXI.Graphics().ellipse(0, 0, 9, 4.5).fill({ color: 0x000000, alpha: 0.35 });
        const sprite = new PIXI.AnimatedSprite(runFrames(3));
        sprite.anchor.set(0.5, 0.768);
        sprite.scale.set(UNIT_SCALE * scale);
        sprite.tint = tint;
        sprite.animationSpeed = 0.42;
        const box = new PIXI.Container();
        box.addChild(shadow, sprite);
        actorLayer.addChild(box);
        let dir = 3;
        let running = false;
        return {
          box,
          sprite,
          setPos(x: number, y: number) {
            box.position.set(x, y);
            box.zIndex = y;
          },
          run(d: number) {
            if (!running || d !== dir) {
              const frame = running ? sprite.currentFrame : 0;
              sprite.textures = runFrames(d);
              sprite.gotoAndPlay(frame % 10);
              dir = d;
              running = true;
            }
          },
          idle(d = dir) {
            if (running || d !== dir) {
              sprite.stop();
              sprite.texture = idleFrame(d);
              running = false;
              dir = d;
            }
          },
        };
      };

      // the learner: a glowing ring marks them out
      const hero = makeActor(1.75, 0xffffff);
      const ring = new PIXI.Graphics().ellipse(0, 0, 15, 7.5).stroke({ width: 2, color: 0xfbbf24, alpha: 0.9 });
      const ringGlow = new PIXI.Sprite(glowTex);
      ringGlow.anchor.set(0.5);
      ringGlow.scale.set(0.9, 0.45);
      ringGlow.tint = 0xfbbf24;
      ringGlow.blendMode = "add";
      hero.box.addChildAt(ringGlow, 0);
      hero.box.addChildAt(ring, 1);

      let stored = currentIdx;
      try {
        const raw = window.localStorage.getItem(HERO_KEY);
        if (raw !== null && Number.isInteger(Number(raw))) stored = Number(raw);
      } catch {
        // storage blocked: start at the current level
      }
      let heroAt = stored < currentIdx && stored >= -1 ? heroS(stored) : reached;
      let heroWalking = heroAt < reached - 1 && !still;
      if (!heroWalking) heroAt = reached;
      const persist = () => {
        try {
          window.localStorage.setItem(HERO_KEY, String(currentIdx));
        } catch {
          // ignore
        }
      };
      if (!heroWalking) persist();
      if (heroWalking) {
        const p = path.at(heroAt);
        hero.setPos(p.x, p.y);
        hero.idle(facing(p.dx, p.dy));
      } else {
        const p = standAt(currentIdx);
        hero.setPos(p.x, p.y);
        hero.idle(3);
      }
      // after the run: a few steps off the trail to stand beside the level
      let stepAside: { from: Pt; to: Pt; t: number } | null = null;

      // residents: three per unlocked world, pacing the boardwalk's edges
      type Npc = ReturnType<typeof makeActor> & {
        a: Pt; b: Pt; to: 0 | 1; wait: number; speed: number; world: StageWorld; bubble: HTMLDivElement | null; bubbleUntil: number;
      };
      const npcs: Npc[] = [];
      for (const w of worlds) {
        if (w.locked) continue;
        const r = rand(w.num * 7919);
        // the stretch of trail inside this world
        let s0 = -1, s1 = -1;
        for (let s = 0; s <= path.total; s += 8) {
          const p = path.at(s);
          if (p.y >= w.top + 40 && p.y < w.bottom - 40) {
            if (s0 < 0) s0 = s;
            s1 = s;
          }
        }
        if (s0 < 0 || s1 - s0 < 120) continue;
        for (let n = 0; n < 3; n++) {
          const start = s0 + r() * (s1 - s0 - 90);
          const span = 60 + r() * 50;
          const side = r() < 0.5 ? -1 : 1;
          const off = (s: number) => {
            const p = path.at(s);
            const l = Math.hypot(p.dx, p.dy) || 1;
            return { x: Math.max(40, Math.min(960, p.x + (-p.dy / l) * side * 52)), y: p.y + (p.dx / l) * side * 52 };
          };
          const a = off(start), b = off(start + span);
          const actor = makeActor(1.25, NPC_TINTS[(w.num + n) % NPC_TINTS.length]);
          const t0 = r();
          actor.setPos(a.x + (b.x - a.x) * t0, a.y + (b.y - a.y) * t0);
          actor.idle(Math.floor(r() * 8));
          npcs.push(Object.assign(actor, { a, b, to: (r() < 0.5 ? 0 : 1) as 0 | 1, wait: r() * 3, speed: 22 + r() * 10, world: w, bubble: null, bubbleUntil: 0 }));
        }
      }

      // ---------- motes (screen space) ----------
      const motes = Array.from({ length: still ? 0 : 46 }, (_, i) => {
        const s = new PIXI.Sprite(glowTex);
        s.anchor.set(0.5);
        s.blendMode = "add";
        s.tint = i % 3 === 0 ? 0x67e8f9 : 0xffd7a0;
        const sc = 0.05 + (i % 4) * 0.025;
        s.scale.set(sc);
        s.alpha = 0.25 + (i % 5) * 0.08;
        s.position.set(((i * 97) % 1000) / 1000 * size.w, ((i * 211) % 1000) / 1000 * size.h);
        screenLayer.addChild(s);
        return { s, vy: 6 + (i % 7) * 3, vx: ((i % 5) - 2) * 2.5, phase: i };
      });

      // ---------- sparks on arrival ----------
      type Spark = { s: import("pixi.js").Sprite; vx: number; vy: number; life: number };
      const sparks: Spark[] = [];
      const burst = (x: number, y: number) => {
        for (let i = 0; i < 46; i++) {
          const s = new PIXI.Sprite(glowTex);
          s.anchor.set(0.5);
          s.blendMode = "add";
          s.tint = i % 3 ? 0xfbbf24 : 0x67e8f9;
          s.scale.set(0.12 + Math.random() * 0.14);
          s.position.set(x, y);
          fxLayer.addChild(s);
          const a = Math.random() * Math.PI * 2;
          const v = 40 + Math.random() * 90;
          sparks.push({ s, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, life: 1 });
        }
      };

      // ---------- speech bubbles (HTML, above the level buttons) ----------
      const showBubble = (npc: Npc, now: number) => {
        const line = npc.world.lines[Math.floor(Math.random() * npc.world.lines.length)];
        if (!line) return;
        const el = document.createElement("div");
        el.className = "cm-bubble";
        el.textContent = line;
        bubbleHost.appendChild(el);
        npc.bubble = el;
        npc.bubbleUntil = now + 4600;
      };

      // ---------- camera ----------
      let camScale = 1;
      const camera = () => {
        camScale = mapEl.offsetWidth / 1000;
        world.scale.set(camScale);
        world.position.set(-vp.scrollLeft, -vp.scrollTop);
      };
      const toScreen = (x: number, y: number) => ({ x: x * camScale - vp.scrollLeft, y: y * camScale - vp.scrollTop });
      const onScreen = (x: number, y: number, m = 80) => {
        const p = toScreen(x, y);
        return p.x > -m && p.x < size.w + m && p.y > -m && p.y < size.h + m;
      };

      // keep the running avatar in view
      const follow = (x: number, y: number) => {
        const p = toScreen(x, y);
        const band = size.h * 0.3;
        if (p.y < band || p.y > size.h - band) vp.scrollTo({ top: vp.scrollTop + (p.y - size.h / 2) * 0.08, left: vp.scrollLeft });
      };

      let nextBubble = performance.now() + 2500;
      let time = 0;

      const tick = (ticker: import("pixi.js").Ticker) => {
        // time-accurate on slow devices; only a long stall (tab switch) is clamped
        const dt = Math.min(ticker.deltaMS, 250) / 1000;
        const now = performance.now();
        time += dt;
        camera();

        for (const l of lights) {
          l.s.visible = onScreen(l.s.x, l.s.y, 120);
          if (!l.s.visible) continue;
          // torches flicker; neon hums with the odd stutter
          const f = l.neon
            ? 0.75 + 0.08 * Math.sin(time * l.speed + l.phase) - (Math.sin(time * 1.3 + l.phase * 5) > 0.97 ? 0.5 : 0)
            : 0.55 + 0.22 * Math.sin(time * l.speed + l.phase) + 0.12 * Math.sin(time * l.speed * 2.7 + l.phase * 3);
          l.s.alpha = f * (l.neon ? 0.42 : 0.5) * l.dim;
          l.s.scale.set((l.neon ? 0.9 : 1.05) + f * 0.25);
        }

        for (const p of lava) {
          p.s.visible = onScreen(p.s.x, p.s.y, 120);
          if (!p.s.visible) continue;
          p.s.alpha = (0.18 + 0.12 * Math.sin(time * 0.9 + p.phase)) * p.dim;
          // now and then a bit of data floats up out of the chasm
          if (p.dim === 1 && bits.length < 60 && Math.random() < dt * 0.25) {
            const b = new PIXI.Sprite(glowTex);
            b.anchor.set(0.5);
            b.blendMode = "add";
            b.tint = Math.random() < 0.6 ? 0x67e8f9 : 0xe879f9;
            b.scale.set(0.07 + Math.random() * 0.06);
            b.position.set(p.s.x + (Math.random() - 0.5) * 50, p.s.y);
            fxLayer.addChild(b);
            bits.push({ s: b, vy: 14 + Math.random() * 16, life: 1 });
          }
        }
        for (let i = bits.length - 1; i >= 0; i--) {
          const b = bits[i];
          b.life -= dt * 0.45;
          b.s.y -= b.vy * dt;
          b.s.x += Math.sin(time * 3 + i) * 4 * dt;
          b.s.alpha = Math.max(0, Math.min(1, b.life * 1.6)) * 0.9;
          if (b.life <= 0) {
            b.s.destroy();
            bits.splice(i, 1);
          }
        }

        // packets: cyan ones stream along the cleared trail, faint ones ahead
        const ahead = path.total - reached;
        for (const p of packets) {
          const span = p.lit ? Math.max(1, heroAt) : Math.max(1, ahead);
          const u = (p.offset + time * (p.lit ? 0.035 : 0.02) * (900 / Math.max(span, 300))) % 1;
          const pos = path.at(p.lit ? u * heroAt : reached + u * ahead);
          p.s.position.set(pos.x, pos.y);
          p.s.visible = onScreen(pos.x, pos.y) && (p.lit ? heroAt > 20 : ahead > 20);
        }

        // the avatar runs the trail after a level is cleared
        if (heroWalking) {
          heroAt = Math.min(reached, heroAt + 120 * dt);
          const p = path.at(heroAt);
          hero.setPos(p.x, p.y);
          hero.run(facing(p.dx, p.dy));
          follow(p.x, p.y);
          if (heroAt >= reached) {
            heroWalking = false;
            const node = trail[Math.min(currentIdx + 1, trail.length - 1)];
            burst(node.x, node.y);
            stepAside = { from: { x: p.x, y: p.y }, to: standAt(currentIdx), t: 0 };
            persist();
          }
        } else if (stepAside) {
          stepAside.t = Math.min(1, stepAside.t + dt * 1.6);
          const { from, to, t: k } = stepAside;
          hero.setPos(from.x + (to.x - from.x) * k, from.y + (to.y - from.y) * k);
          hero.run(facing(to.x - from.x, to.y - from.y));
          if (k >= 1) {
            hero.idle(3);
            stepAside = null;
          }
        } else {
          // idle bob
          hero.sprite.y = Math.sin(time * 2.4) * 0.6;
        }
        ring.alpha = 0.6 + 0.3 * Math.sin(time * 3);
        ringGlow.alpha = 0.5 + 0.25 * Math.sin(time * 3);

        for (const n of npcs) {
          const vis = onScreen(n.box.x, n.box.y, 160);
          n.box.visible = vis;
          if (n.wait > 0) {
            n.wait -= dt;
            if (n.wait <= 0) n.to = n.to === 0 ? 1 : 0;
          } else {
            const target = n.to ? n.b : n.a;
            const dx = target.x - n.box.x, dy = target.y - n.box.y;
            const d = Math.hypot(dx, dy);
            if (d < 1.5) {
              n.idle();
              n.wait = 1.5 + Math.random() * 3.5;
            } else {
              const step = Math.min(d, n.speed * dt);
              n.setPos(n.box.x + (dx / d) * step, n.box.y + (dy / d) * step);
              n.run(facing(dx, dy));
            }
          }
          if (n.bubble) {
            const sp = toScreen(n.box.x, n.box.y - 30);
            const left = n.bubbleUntil - now;
            n.bubble.style.transform = `translate(${Math.round(sp.x)}px, ${Math.round(sp.y)}px) translate(-50%, -100%)`;
            n.bubble.style.opacity = String(Math.max(0, Math.min(1, left / 400, (4600 - left) / 300)));
            if (left <= 0) {
              n.bubble.remove();
              n.bubble = null;
            }
          }
        }

        if (now > nextBubble) {
          const candidates = npcs.filter((n) => n.box.visible && !n.bubble && onScreen(n.box.x, n.box.y, -40));
          if (candidates.length) showBubble(candidates[Math.floor(Math.random() * candidates.length)], now);
          nextBubble = now + 5500 + Math.random() * 4000;
        }

        for (const m of motes) {
          m.s.y -= m.vy * dt;
          m.s.x += (m.vx + Math.sin(time + m.phase) * 4) * dt;
          if (m.s.y < -10) {
            m.s.y = size.h + 10;
            m.s.x = Math.random() * size.w;
          }
          m.s.alpha = 0.2 + 0.15 * Math.sin(time * 1.3 + m.phase);
        }

        for (let i = sparks.length - 1; i >= 0; i--) {
          const sp = sparks[i];
          sp.life -= dt * 0.9;
          sp.vy += 140 * dt;
          sp.s.x += sp.vx * dt;
          sp.s.y += sp.vy * dt;
          sp.s.alpha = Math.max(0, sp.life);
          if (sp.life <= 0) {
            sp.s.destroy();
            sparks.splice(i, 1);
          }
        }
      };

      if (still) {
        // reduced motion: a still frame, redrawn only when the map scrolls
        camera();
        for (const l of lights) l.s.alpha = 0.5 * l.dim;
        for (const p of lava) p.s.alpha = 0.22 * p.dim;
        for (const p of packets) p.s.visible = false;
        app.ticker.stop();
        app.render();
        const onScroll = () => {
          camera();
          app.render();
        };
        vp.addEventListener("scroll", onScroll, { passive: true });
        teardown = () => {
          vp.removeEventListener("scroll", onScroll);
          app.destroy(true, { children: true });
        };
      } else {
        app.ticker.add(tick);
        teardown = () => app.destroy(true, { children: true });
      }
    })().catch((error) => {
      // the map still works without its animated layer
      console.error("Campaign animation failed to start:", error);
    });

    return () => {
      cancelled = true;
      teardown?.();
      host.replaceChildren();
      bubbleHost.replaceChildren();
    };
    // sceneKey captures everything the scene is built from
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneKey, size.w, size.h, mapH]);

  return (
    <div
      ref={hostRef}
      className="cm-stage"
      aria-hidden="true"
      style={{ width: size.w || undefined, height: size.h || undefined, marginBottom: size.h ? -size.h : undefined }}
    />
  );
}
