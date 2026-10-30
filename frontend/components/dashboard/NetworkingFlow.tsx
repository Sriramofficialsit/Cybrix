"use client";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import "./nf.css";

const STAGES = [
  { key: "story", label: "Story", sub: "A real-world problem", icon: "ic-book", c: "#1d4ed8" },
  { key: "concept", label: "Concept", sub: "The postal analogy", icon: "ic-bulb", c: "#38bdf8" },
  { key: "viz", label: "Visualize", sub: "Watch the packets move", icon: "ic-eye", c: "#7c3aed" },
  { key: "game", label: "Game", sub: "Do it yourself", icon: "ic-target", c: "#fa7faa" },
  { key: "done", label: "Complete", sub: "XP, streak, next topic", icon: "ic-award", c: "#a8790f" },
] as const;

const SCENES = [
  { img: "/story-1.jpg", cap: "It's 4:55pm at Loop & Ink Studio." },
  { img: "/story-3.jpg", cap: "His laptop, phone, TV and printer are all in the same room. But nothing happens." },
  { img: "/story-4.jpg", cap: "“We're all in the same room,” Kevin mutters, “so why can't any of you just talk to each other?”" },
  { img: "/story-6.jpg", cap: "Humans solved this centuries ago — with the postal system." },
];

const P = {
  home: "M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6",
  road: "M8 3L5 21M16 3l3 18M12 4v3M12 10.5v3M12 17v3",
  office: "M4 21V8l8-5 8 5v13M9 21v-6h6v6M9 11h.01M15 11h.01",
  letter: "M3 6h18v12H3zM3 7l9 6 9-6",
  mailbox: "M4 20v-8a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v8zM8 20v-6h8M12 7V3h4",
  packet: "M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8",
  wifi: "M2 9a15 15 0 0 1 20 0M5.5 12.5a10 10 0 0 1 13 0M9 16a5 5 0 0 1 6 0M12 19.5h.01",
  router: "M4 14h16v6H4zM8 17h.01M12 17h.01M7 14V9M17 14V9M9 6.5a4.2 4.2 0 0 1 6 0",
  hash: "M5 9h14M5 15h14M10 4L8 20M16 4l-2 16",
  laptop: "M4 4h16v11H4zM2 19h20l-2-4H4z",
  tv: "M3 4.5h18v12H3zM9 20.5h6M12 16.5v4",
  mobile: "M7 2.5h10v19H7zM11 18.5h2",
  printer: "M7 8V3.5h10V8M4.5 8h15v8h-15zM7 15.5h10v5H7z",
};
const Ico = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" className="nf-ico"><path d={d} /></svg>
);

const POSTAL = [
  ["Street address", P.home, "Device / IP address", P.hash],
  ["Mail carrier's route", P.road, "Cable or Wi-Fi signal", P.wifi],
  ["Local sorting office", P.office, "Router", P.router],
  ["A letter", P.letter, "A data packet", P.packet],
  ["Recipient's mailbox", P.mailbox, "Receiving device", P.laptop],
] as const;

const REQUESTS = [
  { label: "Laptop", addr: "192.168.1.10", legit: true },
  { label: "Unknown-Device-7F3A", addr: "192.168.1.66", legit: false },
  { label: "Smart TV", addr: "192.168.1.12", legit: true },
  { label: "Guest-Phone-B2", addr: "192.168.1.90", legit: false },
  { label: "Printer", addr: "192.168.1.20", legit: true },
];

/* ───────── panels ───────── */

function StoryPanel() {
  const [i, setI] = useState(0);
  return (
    <div className="nf-story">
      <div className="nf-story-img">
        {SCENES.map((s, k) => (
          <img key={s.img} src={s.img} alt="" className={k === i ? "on" : ""} />
        ))}
        <span className="nf-scene-tag">Scene {i + 1} / {SCENES.length}</span>
      </div>
      <p className="nf-caption">{SCENES[i].cap}</p>
      <div className="nf-dots">
        {SCENES.map((s, k) => (
          <button key={s.img} className={k === i ? "on" : ""} onClick={() => setI(k)} aria-label={`Scene ${k + 1}`} />
        ))}
      </div>
    </div>
  );
}

function ConceptPanel() {
  const [hl, setHl] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setHl((h) => (h + 1) % POSTAL.length), 1800);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="nf-concept">
      <div className="nf-eyebrow">Postal system ⇄ Home network</div>
      <div className="nf-map">
        {POSTAL.map(([p, pi, n, ni], k) => (
          <div key={p} className={`nf-map-row${k === hl ? " on" : ""}`} onMouseEnter={() => setHl(k)}>
            <span className="nf-map-cell"><Ico d={pi} />{p}</span>
            <span className="nf-map-arrow"><Icon name="ic-arrow" size={16} /></span>
            <span className="nf-map-cell net"><Ico d={ni} />{n}</span>
          </div>
        ))}
      </div>
      <div className="nf-flow">
        {["Connect", "Address", "Send", "Deliver"].map((f, k) => (
          <div key={f} className="nf-flow-step">
            <i>{k + 1}</i>{f}
          </div>
        ))}
      </div>
    </div>
  );
}

const DEV = [
  { key: "tv", x: 470, y: 50, c: "#a78bfa", ip: ".30", label: "Smart TV", d: P.tv },
  { key: "mobile", x: 470, y: 150, c: "#f2b84b", ip: ".40", label: "Mobile", d: P.mobile },
  { key: "printer", x: 470, y: 250, c: "#34d399", ip: ".20", label: "Printer", d: P.printer },
] as const;

function VizPanel() {
  const [t, setT] = useState(0);
  const target = DEV[t];
  return (
    <div className="nf-viz">
      <svg viewBox="0 0 560 300" role="img" aria-label="A laptop sends a packet through the router to the chosen device">
        <defs>
          <path id="nf-l2r" d="M96 150 L260 150" />
          <path id="nf-r2tv" d="M300 150 C360 150 380 50 440 50" />
          <path id="nf-r2mobile" d="M300 150 L440 150" />
          <path id="nf-r2printer" d="M300 150 C360 150 380 250 440 250" />
        </defs>
        {DEV.map((d) => (
          <use key={d.key} href={`#nf-r2${d.key}`} fill="none" stroke={d.key === target.key ? d.c : "#3a2f66"} strokeWidth={d.key === target.key ? 3 : 2} strokeDasharray="4 6" />
        ))}
        <use href="#nf-l2r" fill="none" stroke="#38bdf8" strokeWidth="3" strokeDasharray="4 6" />
        <g>
          <circle cx="60" cy="150" r="36" fill="#0f2547" stroke="#38bdf8" strokeWidth="2" />
          <g transform="translate(43 133) scale(1.4)" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={P.laptop} /></g>
          <text x="60" y="206" textAnchor="middle" className="nf-svg-t">Laptop</text>
          <text x="60" y="222" textAnchor="middle" className="nf-svg-s">192.168.1.10</text>
        </g>
        <g>
          <circle cx="280" cy="150" r="34" fill="#241a4f" stroke="#a78bfa" strokeWidth="2" />
          <circle cx="280" cy="150" r="34" fill="none" stroke="#a78bfa" strokeWidth="2" className="nf-ripple" />
          <g transform="translate(264 134) scale(1.35)" fill="none" stroke="#c4b5fd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={P.router} /></g>
          <text x="280" y="206" textAnchor="middle" className="nf-svg-t">Router</text>
        </g>
        {DEV.map((d) => (
          <g key={d.key} opacity={d.key === target.key ? 1 : 0.45}>
            <circle cx={d.x + 30} cy={d.y} r="30" fill="#141033" stroke={d.c} strokeWidth="2" />
            <g transform={`translate(${d.x + 18} ${d.y - 12}) scale(1)`} fill="none" stroke={d.c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={d.d} /></g>
            <text x={d.x + 30} y={d.y + 48} textAnchor="middle" className="nf-svg-t">{d.label}</text>
            <text x={d.x + 30} y={d.y + 62} textAnchor="middle" className="nf-svg-s">192.168.1{d.ip}</text>
          </g>
        ))}
        {/* packet: laptop → router, then router → chosen device (re-keyed so it restarts on change) */}
        <g key={target.key}>
          <rect x="-9" y="-9" width="18" height="18" rx="4" fill="#38bdf8">
            <animateMotion dur="4.4s" repeatCount="indefinite" keyPoints="0;1;1" keyTimes="0;.55;1" calcMode="linear"><mpath href="#nf-l2r" /></animateMotion>
          </rect>
          <rect x="-9" y="-9" width="18" height="18" rx="4" fill={target.c} opacity="0">
            <animateMotion dur="4.4s" repeatCount="indefinite" keyPoints="0;0;1" keyTimes="0;.55;1" calcMode="linear"><mpath href={`#nf-r2${target.key}`} /></animateMotion>
            <animate attributeName="opacity" values="0;0;1;1" keyTimes="0;.55;.56;1" dur="4.4s" repeatCount="indefinite" />
          </rect>
        </g>
      </svg>
      <div className="nf-viz-bar">
        <span>Send to:</span>
        {DEV.map((d, k) => (
          <button key={d.key} className={k === t ? "on" : ""} style={{ "--c": d.c } as CSSProperties} onClick={() => setT(k)}>{d.label}</button>
        ))}
      </div>
      <div className="nf-hops">
        <span><i>1</i>Request sent</span><span><i>2</i>Router forwards</span><span><i>3</i>{target.label} receives</span>
      </div>
    </div>
  );
}

function GamePanel() {
  const [ans, setAns] = useState<Record<number, boolean>>({}); // index -> chose allow?
  const done = Object.keys(ans).length;
  const correct = REQUESTS.filter((r, i) => i in ans && ans[i] === r.legit).length;
  return (
    <div className="nf-game">
      <div className="nf-game-head">
        <div><b>Secure the home network</b><span>Allow real devices, block strangers.</span></div>
        <div className="nf-score"><Icon name="ic-zap" size={14} />{correct * 8} XP</div>
      </div>
      {REQUESTS.map((r, i) => {
        const chosen = i in ans;
        const ok = chosen && ans[i] === r.legit;
        return (
          <div key={r.addr} className={`nf-req${chosen ? (ok ? " ok" : " bad") : ""}`}>
            <div className="nf-req-ic"><Icon name={r.legit ? "ic-cpu" : "ic-bug"} size={18} /></div>
            <div className="nf-req-t"><b>{r.label}</b><span className="mono">{r.addr}</span></div>
            {chosen ? (
              <span className="nf-verdict">{ok ? "Correct" : r.legit ? "That was legit" : "Intruder!"}</span>
            ) : (
              <div className="nf-req-btns">
                <button className="allow" onClick={() => setAns({ ...ans, [i]: true })}>Allow</button>
                <button className="block" onClick={() => setAns({ ...ans, [i]: false })}>Block</button>
              </div>
            )}
          </div>
        );
      })}
      <div className="nf-game-foot">
        {done < REQUESTS.length ? `${done} / ${REQUESTS.length} decided — try it` : `Network secured · ${correct} / ${REQUESTS.length} correct`}
        {done > 0 && <button onClick={() => setAns({})}>Reset</button>}
      </div>
    </div>
  );
}

function DonePanel() {
  return (
    <div className="nf-done">
      <div className="nf-confetti" aria-hidden="true">
        {Array.from({ length: 14 }).map((_, i) => (
          <i key={i} style={{ left: `${6 + i * 6.6}%`, background: ["#ffe27a", "#7ee0a8", "#fff", "#f5a3c7", "#a9c1f7"][i % 5], animationDelay: `${(i % 5) * 0.25}s`, animationDuration: `${2.6 + (i % 4) * 0.3}s` }} />
        ))}
      </div>
      <div className="nf-medal"><Icon name="ic-award" size={40} /></div>
      <h4>Topic 1.1 complete!</h4>
      <p>What is a Network?</p>
      <div className="nf-stats">
        <div><Icon name="ic-gem" size={18} /><b>+40</b><span>topic XP</span></div>
        <div><Icon name="ic-flame" size={18} style={{ fill: "#ffb648", stroke: "none" }} /><b>7-day</b><span>streak kept</span></div>
        <div><Icon name="ic-globe" size={18} /><b>1 / 6</b><span>topics</span></div>
      </div>
      <div className="nf-next">Next up: <b>1.2 · Why Do Computers Communicate?</b></div>
    </div>
  );
}

/* ───────── shell ───────── */

export function NetworkingFlow() {
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto) return;
    const t = setTimeout(() => setStep((s) => (s + 1) % STAGES.length), 9000);
    return () => clearTimeout(t);
  }, [step, auto]);

  const pick = (i: number) => { setAuto(false); setStep(i); };
  const cur = STAGES[step];

  return (
    <div className="nf" onMouseEnter={() => setAuto(false)}>
      <div className="nf-rail" role="tablist" aria-label="Lesson stages">
        {STAGES.map((s, i) => (
          <button key={s.key} role="tab" aria-selected={i === step} className={`nf-stage${i === step ? " on" : ""}${i < step ? " past" : ""}`}
            style={{ "--c": s.c } as CSSProperties} onClick={() => pick(i)}>
            <span className="nf-stage-ic"><Icon name={i < step ? "ic-check" : s.icon} size={18} /></span>
            <span className="nf-stage-t"><b>{s.label}</b><small>{s.sub}</small></span>
          </button>
        ))}
        <div className="nf-rail-foot">
          <span><Icon name="ic-clock" size={13} />8–10 min</span>
          <span><Icon name="ic-gem" size={13} />+40 XP</span>
        </div>
      </div>

      <div className={`nf-stagebox st-${cur.key}`}>
        <div className="nf-stagebar">
          <span className="nf-crumb"><Icon name="ic-globe" size={14} />Networking · Topic 1.1 — What is a Network?</span>
          <span className="nf-count">Step {step + 1} of {STAGES.length}</span>
        </div>
        <div className="nf-prog"><i style={{ width: `${((step + 1) / STAGES.length) * 100}%` }} /></div>
        <div className="nf-panel" key={cur.key}>
          {cur.key === "story" && <StoryPanel />}
          {cur.key === "concept" && <ConceptPanel />}
          {cur.key === "viz" && <VizPanel />}
          {cur.key === "game" && <GamePanel />}
          {cur.key === "done" && <DonePanel />}
        </div>
        <div className="nf-foot">
          <button className="nf-nav" disabled={step === 0} onClick={() => pick(step - 1)}>Back</button>
          {step < STAGES.length - 1 ? (
            <button className="nf-nav go" onClick={() => pick(step + 1)}>Continue <Icon name="ic-arrow" size={15} /></button>
          ) : (
            <Link href="/learn/modules/networking" className="nf-nav go">Try the real module <Icon name="ic-arrow" size={15} /></Link>
          )}
        </div>
      </div>
    </div>
  );
}
