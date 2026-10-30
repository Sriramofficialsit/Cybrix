"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { StepTracker } from "@/components/networking/StepTracker";
import { StageContinue } from "@/components/networking/StageContinue";
import "./visualize.css";

// Topic 1.1 visualization, laid out as a network operations console: the
// topology canvas in the middle (click a device to send it the packet), a
// toolbar to pick the destination, pause or replay, the hop-by-hop
// journey under it, and a side panel with a live packet inspector and the
// packet log. Sized to fit one screen without scrolling.

const CYCLE = 4.4; // seconds: 1.7s laptop→router, 0.7s router lookup, 2s router→device
const PHASE_AT = [0, 1.7, 2.4]; // when each hop starts within a cycle

type Target = "all" | "tv" | "mobile" | "printer";
const TARGETS: { key: Target; label: string; color: string; ip: string; pathId: string }[] = [
  { key: "all", label: "All devices", color: "#38bdf8", ip: "3 destinations", pathId: "" },
  { key: "tv", label: "Smart TV", color: "#a78bfa", ip: "192.168.1.30", pathId: "r2t" },
  { key: "mobile", label: "Mobile", color: "#f2b84b", ip: "192.168.1.40", pathId: "r2m" },
  { key: "printer", label: "Printer", color: "#34d399", ip: "192.168.1.20", pathId: "r2p" },
];

const HOPS = [
  { n: 1, title: "Request sent", sub: (t: string) => `Laptop addresses the router for ${t}`, icon: "ic-globe" },
  { n: 2, title: "Router forwards", sub: () => "Reads the address, picks the path", icon: "ic-radar" },
  { n: 3, title: "Delivered", sub: (t: string) => `${t} receives the data`, icon: "ic-check" },
];

const DEVICE_PATHS: Record<"laptop" | "tv" | "mobile" | "printer", string> = {
  laptop: "M4 4h16v11H4zM2 19h20l-2-4H4z",
  tv: "M3 4.5h18v12H3zM9 20.5h6M12 16.5v4",
  mobile: "M7 2.5h10v19H7zM11 18.5h2",
  printer: "M7 8V3.5h10V8M4.5 8h15v8h-15zM7 15.5h10v5H7z",
};

const DEVICES = [
  { kind: "laptop", cx: 140, cy: 90, label: "Laptop", ip: "192.168.1.10", color: "#38bdf8" },
  { kind: "tv", cx: 620, cy: 90, label: "Smart TV", ip: "192.168.1.30", color: "#a78bfa" },
  { kind: "mobile", cx: 140, cy: 330, label: "Mobile", ip: "192.168.1.40", color: "#f2b84b" },
  { kind: "printer", cx: 620, cy: 330, label: "Printer", ip: "192.168.1.20", color: "#34d399" },
] as const;

function DeviceNode({
  kind, cx, cy, label, ip, color, pulseBegin, dim, selected, onPick,
}: {
  kind: keyof typeof DEVICE_PATHS; cx: number; cy: number; label: string; ip: string; color: string; pulseBegin: string; dim?: boolean; selected?: boolean; onPick?: () => void;
}) {
  const s = 34 / 24;
  return (
    <g
      className={`vz-dev${onPick ? " pick" : ""}${selected ? " sel" : ""}`}
      opacity={dim ? 0.35 : 1}
      onClick={onPick}
      role={onPick ? "button" : undefined}
      tabIndex={onPick ? 0 : undefined}
      aria-label={onPick ? `Send to ${label}` : undefined}
      onKeyDown={onPick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onPick(); } } : undefined}
    >
      <circle cx={cx} cy={cy} r={44} fill="none" stroke={color} strokeWidth={2}>
        <animate attributeName="r" values="44;70" dur="2.4s" begin={pulseBegin} repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.55;0" dur="2.4s" begin={pulseBegin} repeatCount="indefinite" />
      </circle>
      {selected && <rect x={cx - 52} y={cy - 52} width={104} height={104} rx={32} fill="none" stroke={color} strokeWidth={2} strokeDasharray="4 6" className="vz-sel-ring" />}
      <rect x={cx - 44} y={cy - 44} width={88} height={88} rx={26} fill="url(#tile)" stroke={color} strokeOpacity={0.55} strokeWidth={1.5} filter="url(#shadow)" />
      <rect x={cx - 44} y={cy - 44} width={88} height={44} rx={26} fill="url(#sheen)" />
      <g transform={`translate(${cx - 12 * s},${cy - 12 * s}) scale(${s})`}>
        <path d={DEVICE_PATHS[kind]} fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g transform={`translate(${cx},${cy + 66})`}>
        <rect x={-52} y={-13} width={104} height={38} rx={12} fill="#fff" stroke="#dbe3f5" />
        <text y={2} textAnchor="middle" fontSize={12.5} fontWeight={700} fill="#12224f">{label}</text>
        <text y={17} textAnchor="middle" fontSize={9.5} fill="#5b6789" fontFamily="Monaco, Menlo, monospace">{ip}</text>
      </g>
    </g>
  );
}

// One log line per hop, numbered k = cycle * 3 + hop index
function logLine(k: number, t: (typeof TARGETS)[number]) {
  const c = Math.floor(k / 3);
  const p = k % 3;
  const at = c * CYCLE + PHASE_AT[p];
  const all = t.key === "all";
  const text = [
    `laptop .10 → router  seq=${1204 + c}`,
    `router: lookup ${all ? "3 dests" : t.ip}, ttl 63`,
    `${all ? "tv · mobile · printer" : t.label.toLowerCase()} ← data  ✓ ack`,
  ][p];
  const color = ["#38bdf8", "#f2b84b", p === 2 && !all ? t.color : "#34d399"][p];
  return { k, at: `+${at.toFixed(1).padStart(5, "0")}s`, text, color };
}

export default function VisualizeScreen() {
  const [replayKey, setReplayKey] = useState(0);
  const [target, setTarget] = useState<Target>("all");
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);
  const pausedRef = useRef(false);
  const logRef = useRef<HTMLDivElement>(null);

  const tgt = TARGETS.find((x) => x.key === target)!;
  const on = (id: string) => id === "p2r" || target === "all" || tgt.pathId === id;
  const targetName = target === "all" ? "every device" : tgt.label;

  // Timeline clock, in step with the SVG animations; restarts with them on
  // replay or a new destination, and stands still while paused
  useEffect(() => {
    setElapsed(0);
    setPaused(false);
    pausedRef.current = false;
    let acc = 0;
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      if (!pausedRef.current) {
        acc += (now - last) / 1000;
        setElapsed(acc);
      }
      last = now;
    }, 80);
    return () => clearInterval(id);
  }, [replayKey, target]);

  const togglePause = () => {
    const next = !paused;
    setPaused(next);
    pausedRef.current = next;
    const svg = svgRef.current;
    if (!svg) return;
    if (next) svg.pauseAnimations();
    else svg.unpauseAnimations();
  };

  const cycles = Math.floor(elapsed / CYCLE);
  const t = elapsed % CYCLE;
  const hop = t < PHASE_AT[1] ? 1 : t < PHASE_AT[2] ? 2 : 3;
  const progress = hop === 1 ? t / 1.7 : hop === 2 ? (t - 1.7) / 0.7 : (t - 2.4) / 2;
  const routed = 1204 + cycles * (target === "all" ? 3 : 1);

  const lastK = cycles * 3 + hop - 1;
  const log = Array.from({ length: Math.min(lastK + 1, 8) }, (_, i) => logLine(lastK - Math.min(lastK, 7) + i, tgt));

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lastK]);

  // What the packet's header says at this hop
  const fields: [string, string, string?][] = [
    ["Source", "192.168.1.10", "laptop"],
    ["Destination", target === "all" ? "×3 copies" : tgt.ip, target === "all" ? "tv · mobile · printer" : tgt.label.toLowerCase()],
    ["Next hop", hop === 1 ? "192.168.1.1" : target === "all" ? "3 devices" : tgt.ip, hop === 1 ? "router" : "final"],
    ["TTL", hop === 1 ? "64" : "63", hop === 1 ? "fresh" : "−1 at router"],
    ["Protocol", "TCP / IPv4"],
    ["Medium", hop === 1 ? "Wi-Fi" : target === "printer" ? "Ethernet" : "Wi-Fi"],
  ];

  return (
    <div className="vz">
      <StepTracker current="visualize" />

      <div className="vz-main">
        {/* ---- canvas column ---- */}
        <section className="vz-stage">
          <header className="vz-top">
            <div className="vz-title">
              <div className="vz-kicker"><i />Visualization · Topic 1.1</div>
              <h1 className="disp">Watch a request travel the network</h1>
              <p>The laptop reaches every device the same way: never directly, always through the router. Click any device to send it the packet.</p>
            </div>
          </header>

          <div className={`vz-canvas${paused ? " paused" : ""}`}>
            <div className="vz-canvas-bar">
              <span className="vz-live"><i />{paused ? "Paused" : "Live"}</span>
                <div className="vz-tools">
                  <div className="vz-seg" role="radiogroup" aria-label="Send to">
                    {TARGETS.map((x) => (
                      <button
                        key={x.key}
                        type="button"
                        role="radio"
                        aria-checked={x.key === target}
                        className={x.key === target ? "on" : undefined}
                        style={{ ["--c" as string]: x.color }}
                        onClick={() => setTarget(x.key)}
                      >
                        <i />{x.label}
                      </button>
                    ))}
                  </div>
                  <div className="vz-ctrl">
                    <button type="button" className="vz-icbtn" onClick={togglePause} aria-label={paused ? "Play" : "Pause"} title={paused ? "Play" : "Pause"}>
                      <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
                        {paused ? <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" /> : <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" />}
                      </svg>
                    </button>
                    <button type="button" className="vz-icbtn" onClick={() => setReplayKey((k) => k + 1)} aria-label="Replay" title="Replay">
                      <Icon name="ic-replay" size={15} />
                    </button>
                  </div>
                </div>
              <span className="vz-count mono">{routed.toLocaleString("en-US")} routed</span>
            </div>

            <div className="vz-svg-wrap">
              <svg ref={svgRef} key={`${replayKey}-${target}`} viewBox="0 0 760 440" className="vz-svg">
                <defs>
                  <path id="p2r" d="M140,90 C250,90 290,210 380,210" fill="none" />
                  <path id="r2t" d="M380,210 C470,210 510,90 620,90" fill="none" />
                  <path id="r2m" d="M380,210 C290,210 250,330 140,330" fill="none" />
                  <path id="r2p" d="M380,210 C470,210 510,330 620,330" fill="none" />
                  <radialGradient id="hubg" cx="35%" cy="30%" r="80%"><stop offset="0" stopColor="#7dd3fc" /><stop offset=".5" stopColor="#3b82f6" /><stop offset="1" stopColor="#1d4ed8" /></radialGradient>
                  <radialGradient id="aura" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#38bdf8" stopOpacity=".22" /><stop offset="1" stopColor="#38bdf8" stopOpacity="0" /></radialGradient>
                  <linearGradient id="tile" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#f1f5ff" /></linearGradient>
                  <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".13" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
                  <filter id="shadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="10" stdDeviation="9" floodColor="#1e3a8a" floodOpacity=".16" /></filter>
                  <filter id="glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                </defs>

                <circle cx={380} cy={210} r={170} fill="url(#aura)" />
                <circle cx={380} cy={210} r={112} fill="none" stroke="rgba(29,78,216,.16)" strokeDasharray="3 9" className="vz-spin" />
                <circle cx={380} cy={210} r={168} fill="none" stroke="rgba(29,78,216,.1)" strokeDasharray="2 12" className="vz-spin rev" />

                {[["p2r", "#38bdf8"], ["r2t", "#a78bfa"], ["r2m", "#f2b84b"], ["r2p", "#34d399"]].map(([id, c]) => (
                  <g key={id} opacity={on(id) ? 1 : 0.18} style={{ transition: "opacity .3s" }}>
                    <use href={`#${id}`} stroke="#e4eaf8" strokeWidth={8} strokeLinecap="round" fill="none" />
                    <use href={`#${id}`} stroke={c} strokeOpacity={0.9} strokeWidth={2.5} strokeLinecap="round" strokeDasharray="2 12" fill="none" className="vz-flow" />
                  </g>
                ))}

                {DEVICES.map((d, i) => (
                  <DeviceNode
                    key={d.kind}
                    {...d}
                    dim={target !== "all" && d.kind !== "laptop" && target !== d.kind}
                    selected={d.kind !== "laptop" && target === d.kind}
                    pulseBegin={i === 0 ? "0s" : "2.4s"}
                    onPick={d.kind === "laptop" ? undefined : () => setTarget(target === d.kind ? "all" : (d.kind as Target))}
                  />
                ))}

                <g>
                  <circle cx={380} cy={210} r={52} fill="none" stroke="#38bdf8" strokeWidth={2}>
                    <animate attributeName="r" values="52;86" dur="2.6s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.6;0" dur="2.6s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={380} cy={210} r={50} fill="none" stroke="rgba(125,211,252,.4)" strokeWidth={1.5} />
                  <circle cx={380} cy={210} r={44} fill="url(#hubg)" filter="url(#shadow)" />
                  <g transform="translate(356,186) scale(2)"><path d="M4 14h16v6H4zM8 17h.01M12 17h.01M7 14V9M17 14V9" fill="none" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" /></g>
                  {[16, 26, 36].map((r, i) => (
                    <path key={r} d={`M${380 - r},${162 - r * 0.15} A${r},${r} 0 0 1 ${380 + r},${162 - r * 0.15}`} transform={`translate(0,${-4 - i * 3})`} fill="none" stroke="#38bdf8" strokeWidth={2.4} strokeLinecap="round" opacity={0.9 - i * 0.25} className="vz-twinkle" style={{ animationDelay: `${i * 0.25}s` }} />
                  ))}
                  <g transform="translate(380,286)">
                    <rect x={-58} y={-13} width={116} height={38} rx={12} fill="#eaf6fe" stroke="rgba(14,116,190,.35)" />
                    <text y={2} textAnchor="middle" fontSize={12.5} fontWeight={700} fill="#12224f">Router</text>
                    <text y={17} textAnchor="middle" fontSize={9.5} fill="#0e74be" fontFamily="Monaco, Menlo, monospace">192.168.1.1</text>
                  </g>
                </g>

                {[
                  ["p2r", "#38bdf8", "2.4s", "0s"],
                  ["r2t", "#a78bfa", "2s", "2.4s"],
                  ["r2m", "#f2b84b", "2s", "2.4s"],
                  ["r2p", "#34d399", "2s", "2.4s"],
                ].filter(([id]) => on(id)).map(([id, c, dur, begin]) => (
                  <g key={id}>
                    {[0.16, 0.08].map((lag, k) => (
                      <circle key={k} r={5 - k * 1.2} fill={c} opacity={0.4 - k * 0.15}>
                        <animateMotion dur={dur} begin={`${parseFloat(begin) + lag}s`} repeatCount="indefinite"><mpath href={`#${id}`} /></animateMotion>
                      </circle>
                    ))}
                    <circle r={7} fill="#fff" stroke={c} strokeWidth={3} filter="url(#glow)">
                      <animateMotion dur={dur} begin={begin} repeatCount="indefinite"><mpath href={`#${id}`} /></animateMotion>
                    </circle>
                  </g>
                ))}
              </svg>
            </div>

            {/* the journey, hop by hop */}
            <ol className="vz-steps">
              {HOPS.map((h) => {
                const state = h.n < hop ? "done" : h.n === hop ? "active" : "todo";
                return (
                  <li key={h.n} className={state}>
                    <span className="vz-step-ic"><Icon name={state === "done" ? "ic-check" : h.icon} size={15} /></span>
                    <div>
                      <b>{h.n}. {h.title}</b>
                      <span>{h.sub(targetName)}</span>
                    </div>
                    <div className="vz-step-bar"><i style={{ width: `${state === "done" ? 100 : state === "active" ? Math.min(100, progress * 100) : 0}%` }} /></div>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* ---- side panel ---- */}
        <aside className="vz-side">
          <div className="vz-panel">
            <div className="vz-ph">
              Packet inspector
              <span className="vz-tag" style={{ ["--c" as string]: hop === 1 ? "#38bdf8" : tgt.color }}>hop {Math.min(hop, 2)}/2</span>
            </div>
            <dl className="vz-fields">
              {fields.map(([k, v, note]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd><span className="mono">{v}</span>{note && <em>{note}</em>}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className={`vz-panel vz-term${paused ? " paused" : ""}`}>
            <div className="vz-ph">
              Packet log
              <span className="vz-live sm"><i />{paused ? "paused" : "live"}</span>
            </div>
            <div className="vz-log mono" ref={logRef} aria-live="off">
              {log.map((l) => (
                <div key={l.k}>
                  <span className="at">{l.at}</span>
                  <span style={{ color: l.color }}>{l.text}</span>
                </div>
              ))}
            </div>
            <div className="vz-stats">
              <span>Round-trip <b className="mono">~2 ms</b></span>
              <span>Loss <b className="mono">0%</b></span>
              <span>Hops <b className="mono">2</b></span>
            </div>
          </div>

          <div className="vz-note">
            <Icon name="ic-bulb" size={16} />
            <p>Devices don&rsquo;t talk directly. They talk through a shared connection point, and the router only reads the address, never the contents.</p>
          </div>
        </aside>
      </div>

      <footer className="vz-foot">
        <Link href="/learn/modules/networking/1-1/concept" className="btn vz-back">
          <Icon name="ic-arrow-l" size={14} style={{ stroke: "currentColor" }} />Back to Concept
        </Link>
        <StageContinue topicId="1-1" stage="visualize" href="/learn/modules/networking/1-1/game" style={{ background: "linear-gradient(120deg,#1d4ed8,#38bdf8)", color: "#fff" }}>
          Continue to Game<Icon name="ic-arrow" size={15} style={{ stroke: "#fff" }} />
        </StageContinue>
      </footer>
    </div>
  );
}
