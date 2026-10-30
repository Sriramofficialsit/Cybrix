"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { StepTracker } from "@/components/networking/StepTracker";
import { StageContinue } from "@/components/networking/StageContinue";
import "./concept.css";

type Hl = "connection" | "data" | "address";

const P = {
  laptop: "M4 4h16v11H4zM2 19h20l-2-4H4z",
  tv: "M3 4.5h18v12H3zM9 20.5h6M12 16.5v4",
  printer: "M7 8V3.5h10V8M4.5 8h15v8h-15zM7 15.5h10v5H7z",
  phone: "M9 4.5h6a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H9A1.5 1.5 0 0 1 7.5 18V6A1.5 1.5 0 0 1 9 4.5zM11 17.2h2",
  home: "M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6",
  road: "M8 3L5 21M16 3l3 18M12 4v3M12 10.5v3M12 17v3",
  office: "M4 21V8l8-5 8 5v13M9 21v-6h6v6M9 11h.01M15 11h.01",
  letter: "M3 6h18v12H3zM3 7l9 6 9-6",
  mailbox: "M4 20v-8a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v8zM8 20v-6h8M12 7V3h4",
  packet: "M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8",
  wifi: "M2 9a15 15 0 0 1 20 0M5.5 12.5a10 10 0 0 1 13 0M9 16a5 5 0 0 1 6 0M12 19.5h.01",
  // flat body, antennas angled outward, status lights and Wi-Fi waves (reads as a router, not a lock)
  router: "M4 13.5h16a2 2 0 0 1 2 2v2.5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2.5a2 2 0 0 1 2-2zM6.5 13.5L5 7.5M17.5 13.5l1.5-6M6 16.75h.01M9 16.75h.01M12 16.75h.01M15 16.75h3M10.2 9.6a2.6 2.6 0 0 1 3.6 0M8.4 7.4a5.2 5.2 0 0 1 7.2 0",
  cable: "M6 3v6M10 3v6M4 9h8v4a4 4 0 0 1-8 0zM8 17v4M16 5v14",
  hash: "M5 9h14M5 15h14M10 4L8 20M16 4l-2 16",
};

const Ico = ({ d, stroke = "currentColor", size }: { d: string; stroke?: string; size?: number }) => (
  <svg viewBox="0 0 24 24" style={{ stroke, ...(size ? { width: size, height: size, flex: "none" } : {}) }}><path d={d} /></svg>
);

/** places a 24×24 path icon centred at (x, y) at the given pixel size */
function IconAt({ x, y, d, size = 26, cls = "ico" }: { x: number; y: number; d: string; size?: number; cls?: string }) {
  const k = size / 24;
  return <g transform={`translate(${x - 12 * k},${y - 12 * k}) scale(${k})`}><path className={cls} d={d} /></g>;
}

const TERMS = [
  { title: "Node", icon: "ic-cpu", body: "Any device that can send or receive data on the network — a phone, laptop, smart TV, printer, or the router itself.", ex: "Your phone and laptop are both nodes on your home Wi-Fi." },
  { title: "Protocol", icon: "ic-scale", body: "The agreed set of rules two devices follow so data sent by one is understood by the other.", ex: "Your phone and a website follow the same rules so a page loads correctly." },
  { title: "Medium", icon: "", body: "The physical path data actually travels through — a cable, or a wireless radio signal.", ex: "Wi-Fi is the medium connecting your phone to your router." },
] as const;

const STEPS = [
  {
    icon: "ic-globe", d: null, short: "Connect",
    t: "Device connects to the network",
    detail: "The laptop joins the Wi-Fi (or gets plugged in). The router gives it an address — 192.168.1.10 — so other devices know where to find it.",
    ex: "Like moving into a house and getting a street address.",
  },
  {
    icon: null, d: P.packet, short: "Create",
    t: "Device creates data to send — a message, a request, a file",
    detail: "You press Print. The laptop turns the document into data and splits it into small pieces called packets, each labelled with where it's going.",
    ex: "Like writing a letter and putting the address on the envelope.",
  },
  {
    icon: null, d: P.wifi, short: "Travel",
    t: "Data travels through the medium — Wi-Fi or cable",
    detail: "The packets leave as radio waves over Wi-Fi, or as signals down a cable. The medium just carries them — it never looks inside.",
    ex: "Like the road the postal van drives on.",
  },
  {
    icon: null, d: P.router, short: "Forward",
    t: "Router or switch forwards it toward the right destination",
    detail: "The router reads only the destination address — 192.168.1.20 — and sends each packet toward the printer. It never opens the file.",
    ex: "Like a post office sorting letters without reading them.",
  },
  {
    icon: "ic-flag", d: null, short: "Deliver",
    t: "Destination device receives and understands the data",
    detail: "The printer collects the packets, puts them back in order and — because both devices follow the same protocol — understands the data and prints it.",
    ex: "Like the letter arriving and being read by the right person.",
  },
] as const;

const STEP_MS = 3600;

/** Section 4 — the five-step journey as an interactive, auto-playing track */
function DataJourney() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const last = STEPS.length - 1;
  const cur = STEPS[step];

  // start playing the first time the journey scrolls into view
  useEffect(() => {
    const el = rootRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) { setPlaying(true); return; }
    const obs = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) { setPlaying(true); obs.disconnect(); }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!playing) return;
    if (step === last) { setPlaying(false); return; }
    const t = setTimeout(() => setStep((s) => s + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [playing, step, last]);

  // any manual choice takes over from autoplay
  const go = (i: number) => { setPlaying(false); setStep(Math.max(0, Math.min(last, i))); };
  const togglePlay = () => {
    if (playing) { setPlaying(false); return; }
    if (step === last) setStep(0);
    setPlaying(true);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(step + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); go(step - 1); }
  };

  const pct = (step / last) * 100;

  return (
    <div className="dj" ref={rootRef}>
      <div className="dj-head">
        <div>
          <div className="dj-kicker">Follow one print job</div>
          <div className="disp dj-title">Laptop <span>→</span> Printer, in 5 steps</div>
        </div>
        <div className="dj-ctrl">
          <button className="dj-btn" onClick={() => go(step - 1)} disabled={step === 0} aria-label="Previous step">‹</button>
          <button className="dj-btn dj-play" onClick={togglePlay} aria-label={playing ? "Pause" : step === last ? "Replay" : "Play"}>
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
              {playing ? (
                <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" />
              ) : step === last ? (
                <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v5h5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />
              )}
            </svg>
          </button>
          <button className="dj-btn" onClick={() => go(step + 1)} disabled={step === last} aria-label="Next step">›</button>
          <span className="dj-count">{step + 1}<i>/{STEPS.length}</i></span>
        </div>
      </div>

      <div className="dj-track" role="tablist" aria-label="Data journey steps" onKeyDown={onKey}>
        <div className="dj-rail"><i style={{ width: `${pct}%` }} /></div>
        <div className="dj-packet" style={{ left: `${pct}%` }} aria-hidden>
          <Ico d={P.packet} stroke="#12224f" size={14} />
        </div>
        {STEPS.map((s, i) => (
          <button
            key={s.short}
            role="tab"
            aria-selected={i === step}
            tabIndex={i === step ? 0 : -1}
            className={`dj-stop${i < step ? " done" : ""}${i === step ? " on" : ""}`}
            style={{ left: `${(i / last) * 100}%` }}
            onClick={() => go(i)}
          >
            <span className="dj-dot">
              {s.icon ? <Icon name={s.icon} size={18} /> : <Ico d={s.d!} size={18} />}
            </span>
            <span className="dj-lbl">{s.short}</span>
          </button>
        ))}
      </div>

      <div className="dj-panel" key={step} role="tabpanel">
        <div className="dj-num">{String(step + 1).padStart(2, "0")}</div>
        <div>
          <div className="disp dj-step-title">{cur.t}</div>
          <p className="dj-detail">{cur.detail}</p>
          <p className="dj-ex"><b>Real life:</b> {cur.ex}</p>
        </div>
      </div>

      {playing && <div className="dj-timer" key={`t${step}`} style={{ animationDuration: `${STEP_MS}ms` }} />}
    </div>
  );
}

const CHIPS: { key: Hl; label: string; tip: string }[] = [
  { key: "connection", label: "Connection", tip: "The link between two devices — wired or wireless. This is the line the file travels along." },
  { key: "data", label: "Data", tip: "What actually travels — files, messages, requests. Shown here as the document icon in transit." },
  { key: "address", label: "Address", tip: "Identifies a device, so the network knows exactly where to deliver something." },
];

/* one device node drawn inside the dark topology SVG */
function Node({ x, y, d, label, sub, ip, r = 40, hub }: { x: number; y: number; d: string; label: string; sub: string; ip?: string; r?: number; hub?: boolean }) {
  const s = 32 / 24;
  return (
    <g>
      <circle className={`node${hub ? " hub" : ""}`} cx={x} cy={y} r={r} />
      <g transform={`translate(${x - 12 * s},${y - 12 * s}) scale(${s})`}><path className={`ico${hub ? " ico-w" : ""}`} d={d} /></g>
      <text className="lbl" x={x} y={y + r + 20} textAnchor="middle">{label}</text>
      <text className="sub" x={x} y={y + r + 36} textAnchor="middle">{sub}</text>
      {ip && <>
        <rect className="ip-bg" x={x - 52} y={y + r + 44} width={104} height={24} rx={12} />
        <text className="ip-txt" x={x} y={y + r + 60} textAnchor="middle">{ip}</text>
      </>}
    </g>
  );
}

/** laptop → router → printer, the file bending through the router on its way */
function Topology({ vertical, cls }: { vertical?: boolean; cls: string }) {
  const id = vertical ? "docPathM" : "docPathD";
  const L = vertical ? { x: 150, y: 50 } : { x: 100, y: 130 };
  const H = vertical ? { x: 150, y: 250 } : { x: 360, y: 130 };
  const R = vertical ? { x: 150, y: 450 } : { x: 620, y: 130 };
  return (
    <svg className={`tc-svg ${cls}`} viewBox={vertical ? "0 0 300 610" : "0 0 720 260"} role="img" aria-label="A file travelling from a laptop, through a router, to a printer">
      <path id={id} d={`M${L.x},${L.y} L${H.x},${H.y} L${R.x},${R.y}`} fill="none" stroke="none" />
      <line className="link live" x1={L.x} y1={L.y} x2={H.x} y2={H.y} />
      <line className="link live" x1={H.x} y1={H.y} x2={R.x} y2={R.y} />
      <Node x={L.x} y={L.y} d={P.laptop} label="Laptop" sub="sending node" ip="192.168.1.10" r={vertical ? 34 : 40} />
      <Node x={H.x} y={H.y} d={P.router} label="Router" sub="forwards the file" r={vertical ? 32 : 38} hub />
      <Node x={R.x} y={R.y} d={P.printer} label="Printer" sub="receiving node" ip="192.168.1.20" r={vertical ? 34 : 40} />
      <g>
        <rect className="doc" x={-8} y={-10} width={16} height={20} rx={3} />
        <path d="M-4,-3H4M-4,1H4M-4,5H1" stroke="#12224f" strokeWidth={1.4} />
        <animateMotion className="pk" dur="2.4s" begin="indefinite" fill="freeze"><mpath href={`#${id}`} /></animateMotion>
      </g>
    </svg>
  );
}

function HeroArt() {
  return (
    <svg viewBox="0 0 420 320" style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label="Devices connected through a router">
      <defs>
        <linearGradient id="hg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#1d4ed8" /><stop offset="1" stopColor="#38bdf8" /></linearGradient>
      </defs>
      <circle cx="210" cy="160" r="140" fill="rgba(56,189,248,.1)" />
      <circle cx="210" cy="160" r="100" fill="none" stroke="rgba(29,78,216,.18)" strokeDasharray="4 7" />
      {[[70, 80], [350, 80], [70, 250], [350, 250]].map(([x, y], i) => (
        <line key={i} x1="210" y1="160" x2={x} y2={y} stroke="#1d4ed8" strokeWidth="2.5" strokeDasharray="6 8" style={{ animation: "flow 1.4s linear infinite" }} />
      ))}
      <circle cx="210" cy="160" r="46" fill="url(#hg)" />
      <g transform="translate(184,134) scale(2.17)"><path d={P.router} fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></g>
      {[[70, 80, P.laptop, "Laptop"], [350, 80, P.tv, "Smart TV"], [70, 250, P.printer, "Printer"], [350, 250, P.phone, "Phone"]].map(([x, y, d, t]) => (
        <g key={t as string}>
          <circle cx={x as number} cy={y as number} r="34" fill="#fff" stroke="#1d4ed8" strokeWidth="1.6" />
          <g transform={`translate(${(x as number) - 14},${(y as number) - 14}) scale(1.17)`}><path d={d as string} fill="none" stroke="#1d4ed8" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></g>
          <text x={x as number} y={(y as number) + 52} textAnchor="middle" fontSize="13.5" fontWeight="700" fill="#12224f">{t as string}</text>
        </g>
      ))}
      <text x="210" y="228" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#1739a8" letterSpacing=".6">ONE NETWORK</text>
      {[0, 1, 2].map((i) => (
        <circle key={i} r="5" fill="#fbbf24">
          <animateMotion dur={`${2.4 + i * 0.5}s`} repeatCount="indefinite" path={["M70,80 L210,160", "M350,80 L210,160", "M210,160 L70,250"][i]} />
        </circle>
      ))}
    </svg>
  );
}

/** wireless card art: a router broadcasting waves that reach a laptop and a phone */
function WifiScene() {
  return (
    <>
      {/* signal paths from the router to each device */}
      <path d="M68,62 Q48,52 30,56" fill="none" stroke="#38bdf8" strokeWidth="1.6" strokeDasharray="3 5" style={{ animation: "flow 1.2s linear infinite" }} />
      <path d="M82,62 Q102,48 118,50" fill="none" stroke="#38bdf8" strokeWidth="1.6" strokeDasharray="3 5" style={{ animation: "flow 1.2s linear infinite" }} />

      {/* broadcast waves, pulsing outward one after another */}
      {[9, 16, 23].map((r, i) => (
        <path
          key={r}
          className="wifi-wave"
          d={`M${75 - r},${58 - r * 0.55} A${r},${r} 0 0 1 ${75 + r},${58 - r * 0.55}`}
          fill="none" stroke="#38bdf8" strokeWidth="2.6" strokeLinecap="round"
          style={{ animationDelay: `${i * 0.35}s` }}
        />
      ))}

      {/* router: body, angled antennas, status lights */}
      <path d="M63,68 L59,50 M87,68 L91,50" stroke="#1d4ed8" strokeWidth="2.6" strokeLinecap="round" />
      <rect x="54" y="66" width="42" height="15" rx="5" fill="#1d4ed8" />
      {[62, 68, 74].map((x) => <circle key={x} cx={x} cy="73.5" r="1.8" fill="#7ee0a8" />)}
      <rect x="80" y="72.3" width="9" height="2.4" rx="1.2" fill="#9fd8f7" />

      {/* laptop */}
      <rect x="14" y="44" width="30" height="20" rx="2.5" fill="#fff" stroke="#1d4ed8" strokeWidth="1.6" />
      <rect x="18" y="48" width="22" height="12" rx="1" fill="#dbe7fd" />
      <path d="M10,66 H48 L45,70 H13 Z" fill="#1d4ed8" />

      {/* phone */}
      <rect x="117" y="36" width="19" height="33" rx="4" fill="#fff" stroke="#1d4ed8" strokeWidth="1.6" />
      <rect x="120" y="40" width="13" height="22" rx="1.5" fill="#dbe7fd" />
      <circle cx="126.5" cy="65.5" r="1.3" fill="#1d4ed8" />

      {/* small "connected" wifi badges above each device */}
      {[[29, 36], [126.5, 28]].map(([x, y]) => (
        <g key={x} fill="none" stroke="#1d4ed8" strokeWidth="1.5" strokeLinecap="round">
          <path d={`M${x - 5},${y} a7,7 0 0 1 10,0`} />
          <path d={`M${x - 2.5},${y + 2.6} a3.5,3.5 0 0 1 5,0`} />
          <circle cx={x} cy={y + 5} r="0.9" fill="#1d4ed8" stroke="none" />
        </g>
      ))}
    </>
  );
}

function ConnCard({ title, sub, kind }: { title: string; sub: string; kind: "wired" | "wireless" }) {
  return (
    <div className="card tc-lift" style={{ padding: 20, display: "flex", gap: 18, alignItems: "center" }}>
      <svg viewBox="0 0 150 100" style={{ width: 172, flex: "none" }} aria-hidden>
        <rect x="6" y="6" width="138" height="88" rx="14" fill="#eef2fd" />
        {kind === "wired" ? (
          <>
            <rect x="12" y="38" width="34" height="24" rx="5" fill="#fff" stroke="#1d4ed8" strokeWidth="1.6" />
            <rect x="104" y="30" width="34" height="40" rx="5" fill="#1d4ed8" />
            {[38, 50, 62].map((y) => <circle key={y} cx="121" cy={y} r="3" fill="#7ee0a8" />)}
            <path d="M46,50 C70,50 80,44 104,50" fill="none" stroke="#1d4ed8" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M46,50 C70,50 80,44 104,50" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 6" style={{ animation: "flow 1.2s linear infinite" }} />
          </>
        ) : (
          <WifiScene />
        )}
      </svg>
      <div>
        <div className="disp" style={{ fontSize: 19, fontWeight: 700, color: "#12224f" }}>{title}</div>
        <div style={{ fontSize: 14.5, color: "#726c86", marginTop: 4, lineHeight: 1.5 }}>{sub}</div>
      </div>
    </div>
  );
}

/** a captioned figure frame for the light diagrams */
function Figure({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <figure className="tc-diagram">
      <figcaption className="tc-fig-cap">
        <span className="tc-fig-n">Fig {n}</span>
        <span>{title}</span>
      </figcaption>
      <div className="tc-fig-body">{children}</div>
    </figure>
  );
}

/** Section 1 — one isolated device vs. a small networked cluster */
function IsolatedVsNetworked() {
  return (
    <Figure n={1} title="Isolated device vs. networked device">
      <svg viewBox="0 0 640 232" className="tc-d-svg" role="img" aria-label="An isolated device compared with a networked device">
        <text className="lbl" x="150" y="26" textAnchor="middle">Isolated</text>
        <circle cx="150" cy="114" r="52" fill="none" stroke="#c7d7f7" strokeWidth="1.5" strokeDasharray="5 5" />
        <circle className="node" cx="150" cy="114" r="30" />
        <IconAt x={150} y={114} d={P.laptop} size={30} />
        <text className="sub" x="150" y="198" textAnchor="middle">Only its own storage,</text>
        <text className="sub" x="150" y="213" textAnchor="middle">software and processing power</text>

        <line x1="320" y1="10" x2="320" y2="222" stroke="rgba(29,78,216,.14)" />

        <text className="lbl" x="480" y="26" textAnchor="middle">Networked</text>
        <line className="link live" x1="398" y1="66" x2="480" y2="114" />
        <line className="link live" x1="562" y1="66" x2="480" y2="114" />
        <line className="link live" x1="398" y1="162" x2="480" y2="114" />
        <line className="link live" x1="562" y1="162" x2="480" y2="114" />
        <circle className="node" cx="398" cy="66" r="24" /><IconAt x={398} y={66} d={P.laptop} size={24} />
        <circle className="node" cx="562" cy="66" r="24" /><IconAt x={562} y={66} d={P.phone} size={24} />
        <circle className="node" cx="398" cy="162" r="24" /><IconAt x={398} y={162} d={P.tv} size={24} />
        <circle className="node" cx="562" cy="162" r="24" /><IconAt x={562} y={162} d={P.printer} size={24} />
        <circle className="hub" cx="480" cy="114" r="26" /><IconAt x={480} y={114} d={P.router} size={26} cls="ico ico-w" />
        <text className="sub" x="480" y="198" textAnchor="middle">Can also use what other devices</text>
        <text className="sub" x="480" y="213" textAnchor="middle">and services on the network offer</text>
      </svg>
    </Figure>
  );
}

/** Section 3 — node / medium / protocol, one small hop-chain */
function NodeMediumProtocol() {
  return (
    <Figure n={2} title="Node, medium and protocol on one network">
      <svg viewBox="0 0 640 208" className="tc-d-svg" role="img" aria-label="Node, medium and protocol on one small network">
        <line className="link amber" x1="126" y1="92" x2="290" y2="92" />
        <line className="link live" x1="350" y1="92" x2="514" y2="92" />
        {[100, 320, 540].map((x) => (
          <g key={x}><rect className="tag" x={x - 26} y="20" width="52" height="22" rx="11" /><text className="tagtxt" x={x} y="35" textAnchor="middle">Node</text></g>
        ))}
        <circle className="node" cx="100" cy="92" r="24" /><IconAt x={100} y={92} d={P.phone} size={24} />
        <circle className="hub" cx="320" cy="92" r="28" /><IconAt x={320} y={92} d={P.router} size={28} cls="ico ico-w" />
        <circle className="node" cx="540" cy="92" r="24" /><IconAt x={540} y={92} d={P.laptop} size={24} />
        <text className="sub" x="100" y="146" textAnchor="middle">Phone</text>
        <text className="sub" x="320" y="146" textAnchor="middle">Router</text>
        <text className="sub" x="540" y="146" textAnchor="middle">Laptop</text>
        <rect className="tag-amber" x="133" y="106" width="150" height="24" rx="12" /><text className="tagtxt-amber" x="208" y="122" textAnchor="middle">Medium: Wi-Fi</text>
        <rect className="tag-amber" x="357" y="106" width="150" height="24" rx="12" /><text className="tagtxt-amber" x="432" y="122" textAnchor="middle">Medium: cable</text>
        <rect x="70" y="166" width="500" height="30" rx="8" fill="#eef2fd" stroke="rgba(29,78,216,.2)" />
        <text className="tagtxt" x="320" y="185" textAnchor="middle">Protocol: the shared rules every node follows</text>
      </svg>
    </Figure>
  );
}

/** Section 5 — three independent streams reaching one router at once */
function ParallelStreams() {
  return (
    <Figure n={3} title="Three independent streams through one router">
      <svg viewBox="0 0 640 258" className="tc-d-svg" role="img" aria-label="Three devices sharing one router at the same time">
        <rect className="tag" x="200" y="6" width="240" height="26" rx="13" /><text className="tagtxt" x="320" y="23" textAnchor="middle">Shared medium: Wi-Fi</text>
        <line className="link live" x1="70" y1="50" x2="560" y2="129" />
        <line className="link amber" x1="70" y1="129" x2="560" y2="129" />
        <line className="link idle" x1="70" y1="208" x2="560" y2="129" />
        <circle className="node" cx="70" cy="50" r="24" /><IconAt x={70} y={50} d={P.laptop} size={24} />
        <circle className="node" cx="70" cy="129" r="24" /><IconAt x={70} y={129} d={P.phone} size={24} />
        <circle className="node" cx="70" cy="208" r="24" /><IconAt x={70} y={208} d={P.tv} size={24} />
        <text className="sub" x="70" y="92" textAnchor="middle">Laptop</text>
        <text className="sub" x="70" y="171" textAnchor="middle">Phone</text>
        <text className="sub" x="70" y="250" textAnchor="middle">Smart TV</text>
        <rect className="tag" x="220" y="72" width="170" height="24" rx="12" /><text className="tagtxt" x="305" y="88" textAnchor="middle">Video call data</text>
        <rect className="tag-amber" x="220" y="117" width="170" height="24" rx="12" /><text className="tagtxt-amber" x="305" y="133" textAnchor="middle">Music stream</text>
        <rect className="tag-idle" x="220" y="162" width="170" height="24" rx="12" /><text className="sub" x="305" y="178" textAnchor="middle">Idle, still connected</text>
        <circle className="hub" cx="560" cy="129" r="30" /><IconAt x={560} y={129} d={P.router} size={30} cls="ico ico-w" />
        <text className="sub" x="560" y="183" textAnchor="middle">Router</text>
        <text className="sub" x="546" y="198" textAnchor="middle">keeps each stream separate</text>
      </svg>
    </Figure>
  );
}

/** Section 6 — a router with three known devices and one flagged unknown one */
function UnknownDeviceMap() {
  return (
    <Figure n={4} title="An unrecognised node on the device map">
      <svg viewBox="0 0 640 226" className="tc-d-svg" role="img" aria-label="An unknown device on a network">
        <line className="link live" x1="110" y1="56" x2="320" y2="112" />
        <line className="link live" x1="110" y1="168" x2="320" y2="112" />
        <line className="link live" x1="530" y1="56" x2="320" y2="112" />
        <line className="link amber" x1="530" y1="168" x2="320" y2="112" />
        <circle className="hub" cx="320" cy="112" r="28" /><IconAt x={320} y={112} d={P.router} size={28} cls="ico ico-w" />
        <circle className="node" cx="110" cy="56" r="24" /><IconAt x={110} y={56} d={P.laptop} size={24} />
        <circle className="node" cx="110" cy="168" r="24" /><IconAt x={110} y={168} d={P.phone} size={24} />
        <circle className="node" cx="530" cy="56" r="24" /><IconAt x={530} y={56} d={P.tv} size={24} />
        <circle className="alert-ring" cx="530" cy="168" r="24" />
        <circle cx="530" cy="168" r="24" fill="#fff4e5" stroke="#d9531f" strokeWidth="1.8" />
        <text x="530" y="176" textAnchor="middle" fontSize="20" fontWeight="700" fill="#d9531f">?</text>
        <text className="sub" x="110" y="96" textAnchor="middle">Laptop</text>
        <text className="sub" x="110" y="208" textAnchor="middle">Phone</text>
        <text className="sub" x="530" y="96" textAnchor="middle">Smart TV</text>
        <text className="warn" x="530" y="208" textAnchor="middle">Unknown device</text>
        <text className="sub" x="530" y="222" textAnchor="middle">not on the device list</text>
      </svg>
    </Figure>
  );
}

// Numbered sections of the article
const SECTIONS = [
  { id: "intro", n: "01", kicker: "Introduction", title: "One device alone, versus one device connected" },
  { id: "core", n: "02", kicker: "Core explanation", title: "Every connection follows a protocol" },
  { id: "terms", n: "03", kicker: "Important terminology", title: "Node, medium and protocol on one small network" },
  { id: "how", n: "04", kicker: "How it works", title: "A file, forwarded from a laptop to a printer" },
  { id: "example", n: "05", kicker: "Real-world technical example", title: "Three devices, one router, at the same time" },
  { id: "security", n: "06", kicker: "Cybersecurity relevance", title: "Every device is a potential entry point" },
] as const;

type SecId = (typeof SECTIONS)[number]["id"];

/** numbered section header */
function SecHead({ id }: { id: SecId }) {
  const s = SECTIONS.find((x) => x.id === id)!;
  return (
    <header className="tc-sh">
      <span className="tc-sh-n">{s.n}</span>
      <div>
        <div className="tc-sh-k">{s.kicker}</div>
        <h2 className="disp tc-h2">{s.title}</h2>
      </div>
    </header>
  );
}

// Per-term accent for the terminology cards
const TERM_TONE: Record<string, string> = { Node: "blue", Protocol: "violet", Medium: "teal" };

export default function ConceptScreen() {
  const [open, setOpen] = useState<Hl | null>(null);
  const [hover, setHover] = useState<Hl | null>(null);
  const topoRef = useRef<HTMLDivElement>(null);
  const active = open ?? hover;
  const cls = active ? `hl-${active}` : "";

  const play = () => {
    topoRef.current?.querySelectorAll<SVGAnimationElement>("animateMotion.pk").forEach((a) => {
      try { a.beginElement(); } catch {}
    });
  };

  useEffect(() => {
    const el = topoRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) { play(); return; }
    const obs = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) { play(); obs.disconnect(); }
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (!(e.target as HTMLElement).closest(".tc-chip")) setOpen(null); };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  return (
    <div className="tc-page">
      <StepTracker current="concept" />

      {/* hero */}
      <section className="tc-hero-band">
        <div className="tc-hero">
          <div>
            <div className="tc-pill"><i />Technical concept · Topic 1.1</div>
            <h1 className="disp tc-h1">
              What is a <span className="grad">network</span>?
            </h1>
            <p className="tc-lead">
              <b>A node is any device — a laptop, a printer, a phone.</b> When nodes connect to each other, they form a network. When many networks connect, they form the internet.
            </p>
            <ul className="tc-meta">
              <li><Icon name="ic-clock" size={15} />8 min read</li>
              <li><Icon name="ic-list" size={15} />6 sections</li>
              <li><Icon name="ic-layers" size={15} />Beginner</li>
            </ul>
            <div className="tc-quote">
              <img src="/bird-mascot.jpg" alt="CyberThulir mascot" />
              <span>&ldquo;Every device is a node — whether it&rsquo;s a laptop or a smart fridge.&rdquo;</span>
            </div>
          </div>
          <div className="tc-hero-art float">
            <HeroArt />
          </div>
        </div>
      </section>

      <div className="tc-wrap">
        <div className="tc-layout">
          <article className="tc-in">
            {/* 1 — introduction */}
            <section className="tc-sec" id="intro">
              <SecHead id="intro" />
              <p className="tc-p">
                An isolated device can only use its own storage, software and processing power. The moment it&rsquo;s networked, it can also use what other devices and services on that network offer.
              </p>
              <IsolatedVsNetworked />
            </section>

            {/* 2 — core explanation: wired / wireless */}
            <section className="tc-sec" id="core">
              <SecHead id="core" />
              <p className="tc-p">
                To reach another device, data has to travel through something — a cable or the air. A <b className="tc-em">protocol</b> is the set of rules both devices follow while it travels, a bit like the manners of a conversation: cut the data into pieces, address each piece, send it, and check it arrived. What changes is the extra care needed, because a cable and the air behave very differently.
              </p>
              <div className="tc-two" style={{ marginTop: 20 }}>
                <ConnCard kind="wired" title="Wired: a private line" sub="Only these two devices use the wire — nobody else to talk over." />
                <ConnCard kind="wireless" title="Wireless: a shared room" sub="Every device in range shares the same air, so they take turns." />
              </div>
            </section>

            {/* 3 — terminology */}
            <section className="tc-sec" id="terms">
              <SecHead id="terms" />
              <NodeMediumProtocol />
              <div className="tc-two tc-terms" style={{ marginTop: 16 }}>
                {TERMS.map((t) => (
                  <div className={`tc-term ${TERM_TONE[t.title]}`} key={t.title}>
                    <span className="tc-ico">{t.title === "Medium" ? <Ico d={P.wifi} /> : <Icon name={t.icon} />}</span>
                    <div className="disp tc-term-t">{t.title}</div>
                    <p className="tc-term-b">{t.body}</p>
                    <p className="tc-term-ex"><b>e.g.</b> {t.ex}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 4 — how it works: router forwarding simulation */}
            <section className="tc-sec" id="how">
              <SecHead id="how" />
              <div className="tc-dark" ref={topoRef} style={{ marginTop: 20 }}>
                <div className="tc-dark-bar">
                  <span className="tc-live"><i />Live simulation</span>
                  <button className="tc-replay" onClick={play}>↻ Replay</button>
                </div>
                <div className="tc-desktop"><Topology cls={cls} /></div>
                <div className="tc-mobile" style={{ maxWidth: 320, margin: "0 auto" }}><Topology vertical cls={cls} /></div>
                <p className="tc-dark-note">
                  The router doesn&rsquo;t open the file — it just reads the address and forwards it toward the right device.
                </p>
                <div className="tc-chips">
                  <span className="tc-chips-l">Tap a term</span>
                  {CHIPS.map((c) => (
                    <div
                      key={c.key}
                      className={`tc-chip${open === c.key ? " open" : ""}`}
                      onClick={() => setOpen(open === c.key ? null : c.key)}
                      onMouseEnter={() => !open && setHover(c.key)}
                      onMouseLeave={() => setHover(null)}
                    >
                      {c.label}
                      <div className="tc-tip">{c.tip}</div>
                    </div>
                  ))}
                </div>
              </div>
              <DataJourney />
            </section>

            {/* 5 — real-world example */}
            <section className="tc-sec" id="example">
              <SecHead id="example" />
              <span className="tc-scenario"><Icon name="ic-house" size={14} />Home Wi-Fi scenario</span>
              <p className="tc-p">
                You&rsquo;re at home. Your laptop, phone and smart TV are all connected to the same Wi-Fi router — each having its own independent conversation, without needing to know anything about the others.
              </p>
              <ParallelStreams />
              <p className="tc-p tc-p-sm">
                What makes this possible: each device is a <b className="tc-em">node</b> with its own address, the Wi-Fi signal is the shared <b className="tc-em">medium</b> all three use, and <b className="tc-em">protocols</b> keep the laptop&rsquo;s video call from getting confused with the phone&rsquo;s music stream — even on the same router, at the same moment.
              </p>
            </section>

            {/* 6 — security relevance */}
            <section className="tc-sec" id="security">
              <SecHead id="security" />
              <p className="tc-p">
                A security analyst&rsquo;s job includes identifying every node on a network — including ones that shouldn&rsquo;t be there. Understanding how devices communicate is the foundation for later topics like traffic monitoring and spotting unauthorized devices.
              </p>
              <UnknownDeviceMap />
            </section>

            {/* takeaway */}
            <aside className="tc-take">
              <span className="tc-take-ic"><Icon name="ic-check" size={20} /></span>
              <div>
                <div className="tc-take-h">Key takeaway</div>
                <p>
                  A network exists so multiple devices can communicate and share data at the same time, using a shared medium and a common set of rules — without needing to understand each other directly.
                </p>
              </div>
            </aside>
          </article>
        </div>
      </div>

      <footer className="tc-foot">
        <div className="tc-foot-next">
          <span>Up next</span>
          <b>Visualize the network</b>
        </div>
        <StageContinue topicId="1-1" stage="concept" href="/learn/modules/networking/1-1/visualize" style={{ background: "linear-gradient(120deg,#1d4ed8,#1739a8)", color: "#fff" }}>
          Continue to Visualization<Icon name="ic-arrow" size={15} style={{ stroke: "#fff" }} />
        </StageContinue>
      </footer>
    </div>
  );
}
