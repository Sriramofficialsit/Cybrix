"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { StepTracker } from "@/components/networking/StepTracker";
import { StageContinue } from "@/components/networking/StageContinue";

const NODES = [
  { id: "laptop", label: "Laptop", sub: "Kevin's device", x: 80, y: 210, color: "#38bdf8" },
  { id: "router", label: "Router", sub: "office Wi-Fi", x: 220, y: 210, color: "#38bdf8" },
  { id: "isp", label: "ISP", sub: "local provider", x: 380, y: 120, color: "#a78bfa" },
  { id: "backbone", label: "Backbone", sub: "fibre trunk", x: 540, y: 210, color: "#f2b84b" },
  { id: "dest-isp", label: "Dest ISP", sub: "London ISP", x: 380, y: 300, color: "#a78bfa" },
  { id: "client", label: "Client", sub: "London device", x: 700, y: 210, color: "#34d399" },
] as const;

const EDGES: [string, string][] = [
  ["laptop", "router"],
  ["router", "isp"],
  ["isp", "backbone"],
  ["backbone", "dest-isp"],
  ["dest-isp", "client"],
];

const HOPS = [
  { n: 1, from: "laptop", to: "router", title: "Wi-Fi hop", detail: "Laptop sends the file over Wi-Fi to the office router." },
  { n: 2, from: "router", to: "isp", title: "Cable to ISP", detail: "Router forwards the file through cable to the ISP street cabinet." },
  { n: 3, from: "isp", to: "backbone", title: "Backbone transit", detail: "ISP hands the data to a high-capacity fibre-optic backbone." },
  { n: 4, from: "backbone", to: "dest-isp", title: "Destination ISP", detail: "Backbone delivers the data to the London ISP." },
  { n: 5, from: "dest-isp", to: "client", title: "Final delivery", detail: "London ISP routes the file to the client's device." },
];

function nodeById(id: string) {
  return NODES.find((n) => n.id === id)!;
}

export default function VisualizeScreen12() {
  const [hop, setHop] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [replayKey, setReplayKey] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setHop((h) => {
        if (h >= HOPS.length - 1) { setPlaying(false); return h; }
        return h + 1;
      });
    }, 2400);
    return () => clearInterval(t);
  }, [playing, replayKey]);

  const replay = () => {
    setHop(0);
    setPlaying(true);
    setReplayKey((k) => k + 1);
  };

  const togglePause = () => {
    if (!playing && hop >= HOPS.length - 1) { replay(); return; }
    setPlaying((p) => !p);
  };

  const curHop = HOPS[hop];

  return (
    <div className="vz">
      <StepTracker current="visualize" label="NETWORKING · MODULE 01 · TOPIC 1.2" exitHref="/learn/modules/networking#module-1" />

      <div className="vz-main">
        <section className="vz-stage">
          <header className="vz-top">
            <div className="vz-title">
              <div className="vz-kicker"><i />Visualization · Topic 1.2</div>
              <h1 className="disp">Watch data travel from office to London</h1>
              <p>Follow a file as it hops through routers, ISPs and backbone cables to reach its destination thousands of kilometres away.</p>
            </div>
          </header>

          <div className={`vz-canvas${!playing ? " paused" : ""}`}>
            <div className="vz-canvas-bar">
              <span className="vz-live"><i />{playing ? "Live" : "Paused"}</span>
              <div className="vz-tools">
                <div className="vz-ctrl">
                  <button type="button" className="vz-icbtn" onClick={() => setHop((h) => Math.max(0, h - 1))} aria-label="Previous hop">
                    <Icon name="ic-arrow-l" size={14} />
                  </button>
                  <button type="button" className="vz-icbtn" onClick={togglePause} aria-label={playing ? "Pause" : "Play"}>
                    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
                      {playing ? <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" /> : <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />}
                    </svg>
                  </button>
                  <button type="button" className="vz-icbtn" onClick={() => setHop((h) => Math.min(HOPS.length - 1, h + 1))} aria-label="Next hop">
                    <Icon name="ic-arrow" size={14} />
                  </button>
                  <button type="button" className="vz-icbtn" onClick={replay} aria-label="Replay">
                    <Icon name="ic-replay" size={15} />
                  </button>
                </div>
              </div>
              <span className="vz-count mono">Hop {hop + 1} / {HOPS.length}</span>
            </div>

            <div className="vz-svg-wrap">
              <svg ref={svgRef} key={replayKey} viewBox="0 0 780 420" className="vz-svg">
                <defs>
                  <radialGradient id="aura12" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#38bdf8" stopOpacity=".15" /><stop offset="1" stopColor="#38bdf8" stopOpacity="0" /></radialGradient>
                  <filter id="shadow12" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#1e3a8a" floodOpacity=".14" /></filter>
                  <filter id="glow12" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
                </defs>

                <circle cx="390" cy="210" r="180" fill="url(#aura12)" />

                {EDGES.map(([a, b], i) => {
                  const na = nodeById(a);
                  const nb = nodeById(b);
                  const active = i <= hop;
                  return (
                    <g key={`${a}-${b}`}>
                      <line x1={na.x} y1={na.y} x2={nb.x} y2={nb.y} stroke={active ? "#38bdf8" : "#2a2540"} strokeWidth={active ? 3 : 1.5} strokeDasharray={active ? "none" : "4 8"} style={{ transition: "stroke .3s, stroke-width .3s" }} />
                      {active && (
                        <line x1={na.x} y1={na.y} x2={nb.x} y2={nb.y} stroke={na.color} strokeWidth={1.5} strokeDasharray="4 8" style={{ animation: "flow 1.2s linear infinite" }} />
                      )}
                    </g>
                  );
                })}

                {NODES.map((n) => {
                  const active = hop >= EDGES.findIndex(([a]) => a === n.id) || n.id === "laptop";
                  return (
                    <g key={n.id} opacity={active ? 1 : 0.35} style={{ transition: "opacity .3s" }}>
                      <circle cx={n.x} cy={n.y} r={36} fill="#fff" stroke={n.color} strokeWidth={1.6} filter="url(#shadow12)" />
                      <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize="11" fontWeight="800" fill={n.color}>{n.label}</text>
                      <text x={n.x} y={n.y + 56} textAnchor="middle" fontSize="10" fill="#8b8599">{n.sub}</text>
                    </g>
                  );
                })}

                {/* travelling packet */}
                {(() => {
                  const from = nodeById(curHop.from);
                  const to = nodeById(curHop.to);
                  return (
                    <circle r={8} fill="#fff" stroke={to.color} strokeWidth={3} filter="url(#glow12)">
                      <animateMotion dur="2s" repeatCount="indefinite" path={`M${from.x},${from.y} L${to.x},${to.y}`} />
                    </circle>
                  );
                })()}
              </svg>
            </div>

            <ol className="vz-steps">
              {HOPS.map((h, i) => {
                const state = i < hop ? "done" : i === hop ? "active" : "todo";
                return (
                  <li key={h.n} className={state}>
                    <span className="vz-step-ic"><Icon name={state === "done" ? "ic-check" : "ic-globe"} size={15} /></span>
                    <div>
                      <b>{h.n}. {h.title}</b>
                      <span>{h.detail}</span>
                    </div>
                    <div className="vz-step-bar"><i style={{ width: `${state === "done" ? 100 : state === "active" ? 50 : 0}%` }} /></div>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        <aside className="vz-side">
          <div className="vz-panel">
            <div className="vz-ph">
              Current hop
              <span className="vz-tag" style={{ ["--c" as string]: nodeById(curHop.to).color }}>hop {hop + 1}/{HOPS.length}</span>
            </div>
            <dl className="vz-fields">
              {[
                ["From", nodeById(curHop.from).label],
                ["To", nodeById(curHop.to).label],
                ["Medium", hop === 0 ? "Wi-Fi" : hop === 1 ? "Copper cable" : "Fibre optic"],
                ["Distance", hop === 0 ? "~10 m" : hop === 1 ? "~2 km" : hop === 2 ? "~500 km" : hop === 3 ? "~500 km" : "~5 km"],
                ["Latency", hop === 0 ? "<1 ms" : hop === 1 ? "~2 ms" : hop === 2 ? "~8 ms" : hop === 3 ? "~8 ms" : "~1 ms"],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd><span className="mono">{v}</span></dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="vz-note">
            <Icon name="ic-bulb" size={16} />
            <p>Most of the journey happens underground in fibre-optic cables. Wi-Fi is just the first and last hop.</p>
          </div>
        </aside>
      </div>

      <footer className="vz-foot">
        <Link href="/learn/modules/networking/1-2/concept" className="btn vz-back">
          <Icon name="ic-arrow-l" size={14} style={{ stroke: "currentColor" }} />Back to Concept
        </Link>
        <StageContinue topicId="1-2" stage="visualize" href="/learn/modules/networking/1-2/game" style={{ background: "linear-gradient(120deg,#1d4ed8,#38bdf8)", color: "#fff" }}>
          Continue to Game<Icon name="ic-arrow" size={15} style={{ stroke: "#fff" }} />
        </StageContinue>
      </footer>
    </div>
  );
}
