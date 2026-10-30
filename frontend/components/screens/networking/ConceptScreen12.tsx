"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { StepTracker } from "@/components/networking/StepTracker";
import { StageContinue } from "@/components/networking/StageContinue";

const P = {
  laptop: "M4 4h16v11H4zM2 19h20l-2-4H4z",
  router: "M4 13.5h16a2 2 0 0 1 2 2v2.5a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2.5a2 2 0 0 1 2-2zM6.5 13.5L5 7.5M17.5 13.5l1.5-6M6 16.75h.01M9 16.75h.01M12 16.75h.01M15 16.75h3M10.2 9.6a2.6 2.6 0 0 1 3.6 0M8.4 7.4a5.2 5.2 0 0 1 7.2 0",
  cable: "M6 3v6M10 3v6M4 9h8v4a4 4 0 0 1-8 0zM8 17v4M16 5v14",
  globe: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10M12 2a15 15 0 0 0-4 10 15 15 0 0 0 4 10",
  server: "M4 4h16v5H4zM4 13h16v5H4zM8 6.5h.01M8 15.5h.01M12 6.5h.01M12 15.5h.01",
  fibre: "M12 2v4M12 18v4M4 12h4M16 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M6.3 17.7l2.8-2.8M14.9 9.1l2.8-2.8",
  building: "M4 21V8l8-5 8 5v13M9 21v-6h6v6M9 11h.01M15 11h.01",
  wifi: "M2 9a15 15 0 0 1 20 0M5.5 12.5a10 10 0 0 1 13 0M9 16a5 5 0 0 1 6 0M12 19.5h.01",
};

const Ico = ({ d, stroke = "currentColor", size }: { d: string; stroke?: string; size?: number }) => (
  <svg viewBox="0 0 24 24" style={{ stroke, fill: "none", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", ...(size ? { width: size, height: size, flex: "none" } : {}) }}><path d={d} /></svg>
);

const TERMS = [
  { title: "ISP", icon: "ic-globe", body: "Internet Service Provider: the company that connects your home or office router to the wider internet. Your data's first stop after it leaves your building.", ex: "Your router sends data to your ISP's local cabinet before it goes anywhere else." },
  { title: "Fibre-Optic Cable", icon: "ic-layers", body: "Thin glass or plastic threads that carry data as pulses of light, moving at close to the speed of light over long distances.", ex: "The orange cable being laid under the street carries your upload as light flashes." },
  { title: "Backbone", icon: "ic-radar", body: "High-capacity trunk lines that connect cities, countries and continents. Run by large carriers, they form the spine of the internet.", ex: "Your file from the office crossed a backbone cable running alongside a railway to reach London." },
] as const;

const HOPS = [
  { n: 1, short: "Wi-Fi", title: "Your device connects via Wi-Fi to the router", detail: "Kevin's laptop sends the file over Wi-Fi to the office router, just a few metres away. Wi-Fi is only the last mile, the short wireless hop from device to router.", ex: "Like stepping out of your front door onto the pavement." },
  { n: 2, short: "Router → ISP", title: "The router passes data to your ISP", detail: "The router forwards the file through a cable to the ISP's street cabinet. This is the first stretch of the wired journey, the local road.", ex: "Like driving from your street onto the main road." },
  { n: 3, short: "Backbone", title: "Data crosses the internet backbone", detail: "The ISP hands the file to backbone cables, high-capacity fibre-optic lines that run alongside railways, roads and under oceans, connecting cities and countries.", ex: "Like taking the motorway between two cities." },
  { n: 4, short: "Destination ISP", title: "The destination ISP receives the data", detail: "At the other end of the backbone, the destination ISP picks up the data and routes it to the client's local network.", ex: "Like exiting the motorway onto the local streets of the destination city." },
  { n: 5, short: "Delivered", title: "The client's device receives the file", detail: "The destination router delivers the file over Wi-Fi or cable to the client's device. Five seconds, thousands of kilometres, data travelling as light.", ex: "Like the letter arriving at the front door of the destination." },
];

const STEP_MS = 3800;

function DataJourney() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const last = HOPS.length - 1;
  const cur = HOPS[step];

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

  const go = (i: number) => { setPlaying(false); setStep(Math.max(0, Math.min(last, i))); };
  const togglePlay = () => {
    if (playing) { setPlaying(false); return; }
    if (step === last) setStep(0);
    setPlaying(true);
  };

  const pct = (step / last) * 100;

  return (
    <div className="dj" ref={rootRef}>
      <div className="dj-head">
        <div>
          <div className="dj-kicker">Follow Kevin's file</div>
          <div className="disp dj-title">Office <span>&rarr;</span> London, in 5 hops</div>
        </div>
        <div className="dj-ctrl">
          <button className="dj-btn" onClick={() => go(step - 1)} disabled={step === 0} aria-label="Previous step">&lsaquo;</button>
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
          <button className="dj-btn" onClick={() => go(step + 1)} disabled={step === last} aria-label="Next step">&rsaquo;</button>
          <span className="dj-count">{step + 1}<i>/{HOPS.length}</i></span>
        </div>
      </div>

      <div className="dj-track" role="tablist" aria-label="Data journey hops">
        <div className="dj-rail"><i style={{ width: `${pct}%` }} /></div>
        {HOPS.map((s, i) => (
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
              <Ico d={i === 0 ? P.wifi : i === 1 ? P.router : i === 2 ? P.fibre : i === 3 ? P.server : P.laptop} size={18} />
            </span>
            <span className="dj-lbl">{s.short}</span>
          </button>
        ))}
      </div>

      <div className="dj-panel" key={step} role="tabpanel">
        <div className="dj-num">{String(step + 1).padStart(2, "0")}</div>
        <div>
          <div className="disp dj-step-title">{cur.title}</div>
          <p className="dj-detail">{cur.detail}</p>
          <p className="dj-ex"><b>Real life:</b> {cur.ex}</p>
        </div>
      </div>

      {playing && <div className="dj-timer" key={`t${step}`} style={{ animationDuration: `${STEP_MS}ms` }} />}
    </div>
  );
}

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

function DataPathDiagram() {
  return (
    <Figure n={1} title="The path a file takes from office to client">
      <svg viewBox="0 0 720 200" className="tc-d-svg" role="img" aria-label="Data path from laptop through router, ISP, backbone, destination ISP, to client device">
        {/* connection lines */}
        <line x1="80" y1="100" x2="200" y2="100" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 6" style={{ animation: "flow 1.2s linear infinite" }} />
        <line x1="240" y1="100" x2="320" y2="100" stroke="#a78bfa" strokeWidth="2" strokeDasharray="4 6" style={{ animation: "flow 1.4s linear infinite" }} />
        <line x1="360" y1="100" x2="440" y2="100" stroke="#f2b84b" strokeWidth="2.5" strokeDasharray="4 6" style={{ animation: "flow 1s linear infinite" }} />
        <line x1="480" y1="100" x2="560" y2="100" stroke="#a78bfa" strokeWidth="2" strokeDasharray="4 6" style={{ animation: "flow 1.4s linear infinite" }} />
        <line x1="600" y1="100" x2="680" y2="100" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 6" style={{ animation: "flow 1.2s linear infinite" }} />

        {/* nodes */}
        {[
          { x: 60, label: "Laptop", sub: "Kevin's device", d: P.laptop, color: "#38bdf8" },
          { x: 220, label: "Router", sub: "office Wi-Fi", d: P.router, color: "#38bdf8" },
          { x: 340, label: "ISP", sub: "local provider", d: P.building, color: "#a78bfa" },
          { x: 460, label: "Backbone", sub: "fibre trunk", d: P.fibre, color: "#f2b84b" },
          { x: 580, label: "Dest ISP", sub: "London ISP", d: P.building, color: "#a78bfa" },
          { x: 700, label: "Client", sub: "London device", d: P.laptop, color: "#34d399" },
        ].map((n) => (
          <g key={n.label}>
            <circle cx={n.x} cy={100} r={28} fill="#fff" stroke={n.color} strokeWidth="1.6" />
            <g transform={`translate(${n.x - 12},${100 - 12})`}><path d={n.d} fill="none" stroke={n.color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></g>
            <text x={n.x} y={148} textAnchor="middle" fontSize="12" fontWeight="700" fill="#12224f">{n.label}</text>
            <text x={n.x} y={163} textAnchor="middle" fontSize="10" fill="#726c86">{n.sub}</text>
          </g>
        ))}

        {/* labels on connections */}
        <text x="140" y="86" textAnchor="middle" fontSize="9" fontWeight="700" fill="#38bdf8">Wi-Fi</text>
        <text x="280" y="86" textAnchor="middle" fontSize="9" fontWeight="700" fill="#a78bfa">Cable</text>
        <text x="400" y="86" textAnchor="middle" fontSize="9" fontWeight="700" fill="#f2b84b">Fibre</text>
        <text x="520" y="86" textAnchor="middle" fontSize="9" fontWeight="700" fill="#a78bfa">Fibre</text>
        <text x="640" y="86" textAnchor="middle" fontSize="9" fontWeight="700" fill="#34d399">Wi-Fi</text>

        {/* travelling packet */}
        <circle r="5" fill="#fbbf24">
          <animateMotion dur="3s" repeatCount="indefinite" path="M60,100 L220,100 L340,100 L460,100 L580,100 L700,100" />
        </circle>
      </svg>
    </Figure>
  );
}

function MediaComparison() {
  return (
    <Figure n={2} title="Transmission media compared">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, padding: "16px 0" }}>
        {[
          { title: "Wi-Fi", range: "~50 m", speed: "Up to 1 Gbps", note: "Wireless radio signals; covers the last hop from router to device.", color: "#38bdf8" },
          { title: "Copper cable", range: "~100 m", speed: "Up to 10 Gbps", note: "Ethernet or phone line; used inside buildings and to the ISP street cabinet.", color: "#a78bfa" },
          { title: "Fibre optic", range: "1000s of km", speed: "Up to 100+ Tbps", note: "Glass threads carrying light; the medium of choice for backbones and undersea cables.", color: "#f2b84b" },
        ].map((m) => (
          <div key={m.title} style={{ background: "#f8f6fc", borderRadius: 14, padding: "18px 16px", border: `1px solid ${m.color}33` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: m.color, flex: "none" }} />
              <span style={{ fontSize: 15, fontWeight: 700, color: "#12224f" }}>{m.title}</span>
            </div>
            <div style={{ fontSize: 12.5, color: "#4b4560", lineHeight: 1.6 }}>{m.note}</div>
            <div style={{ display: "flex", gap: 12, marginTop: 10, fontSize: 11.5, fontWeight: 700 }}>
              <span style={{ color: m.color }}>Range: {m.range}</span>
              <span style={{ color: "#726c86" }}>Speed: {m.speed}</span>
            </div>
          </div>
        ))}
      </div>
    </Figure>
  );
}

const SECTIONS = [
  { id: "intro", n: "01", kicker: "Introduction", title: "Your file arrived in five seconds. Here's how." },
  { id: "path", n: "02", kicker: "The path", title: "Six hops from your desk to London" },
  { id: "terms", n: "03", kicker: "Important terminology", title: "ISP, fibre optics and the backbone" },
  { id: "how", n: "04", kicker: "How it works", title: "Follow Kevin's file, hop by hop" },
  { id: "media", n: "05", kicker: "Transmission media", title: "Wi-Fi, copper and fibre compared" },
  { id: "security", n: "06", kicker: "Cybersecurity relevance", title: "Every hop is a potential interception point" },
] as const;

type SecId = (typeof SECTIONS)[number]["id"];

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

const TERM_TONE: Record<string, string> = { ISP: "violet", "Fibre-Optic Cable": "teal", Backbone: "blue" };

export default function ConceptScreen12() {
  return (
    <div className="tc-page">
      <StepTracker current="concept" label="NETWORKING · MODULE 01 · TOPIC 1.2" exitHref="/learn/modules/networking#module-1" />

      <section className="tc-hero-band">
        <div className="tc-hero">
          <div>
            <div className="tc-pill"><i />Technical concept · Topic 1.2</div>
            <h1 className="disp tc-h1">
              How does data <span className="grad">travel</span>?
            </h1>
            <p className="tc-lead">
              <b>When you press Send, your data doesn't fly through the air to its destination.</b> It hops from your device to your router, out to your ISP, across fibre-optic backbones, and into the destination network, all in milliseconds.
            </p>
            <ul className="tc-meta">
              <li><Icon name="ic-clock" size={15} />8 min read</li>
              <li><Icon name="ic-list" size={15} />6 sections</li>
              <li><Icon name="ic-layers" size={15} />Beginner</li>
            </ul>
            <div className="tc-quote">
              <img src="/bird-mascot.jpg" alt="CyberThulir mascot" />
              <span>&ldquo;Wi-Fi only covers the last few metres. The real journey happens underground.&rdquo;</span>
            </div>
          </div>
        </div>
      </section>

      <div className="tc-wrap">
        <div className="tc-layout">
          <article className="tc-in">
            <section className="tc-sec" id="intro">
              <SecHead id="intro" />
              <p className="tc-p">
                Kevin uploaded a file at noon and his client in London had it five seconds later. That file didn&rsquo;t just vanish from one screen and appear on another. It made a physical journey: through the air as a Wi-Fi signal, down a cable to a street cabinet, along fibre-optic threads under the road, across a high-capacity backbone linking two cities, and back out through the client&rsquo;s ISP to their device.
              </p>
            </section>

            <section className="tc-sec" id="path">
              <SecHead id="path" />
              <p className="tc-p">
                Every piece of data you send makes the same kind of trip. From your device to your router (Wi-Fi or cable), from the router to your ISP (the company that connects you), from the ISP across the backbone (high-capacity trunk lines), and then back down through the destination ISP to the receiving device.
              </p>
              <DataPathDiagram />
            </section>

            <section className="tc-sec" id="terms">
              <SecHead id="terms" />
              <div className="tc-two tc-terms" style={{ marginTop: 16 }}>
                {TERMS.map((t) => (
                  <div className={`tc-term ${TERM_TONE[t.title]}`} key={t.title}>
                    <span className="tc-ico"><Icon name={t.icon} /></span>
                    <div className="disp tc-term-t">{t.title}</div>
                    <p className="tc-term-b">{t.body}</p>
                    <p className="tc-term-ex"><b>e.g.</b> {t.ex}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="tc-sec" id="how">
              <SecHead id="how" />
              <DataJourney />
            </section>

            <section className="tc-sec" id="media">
              <SecHead id="media" />
              <p className="tc-p">
                Data uses different physical media at different stages of its journey. Wi-Fi covers the short hop inside a building. Copper carries it to the street. Fibre optics, thin glass threads carrying pulses of light, do the heavy lifting over long distances.
              </p>
              <MediaComparison />
            </section>

            <section className="tc-sec" id="security">
              <SecHead id="security" />
              <p className="tc-p">
                Every hop between your device and the destination is a point where data could potentially be intercepted, delayed, or corrupted. Understanding the physical path data takes is the first step in understanding why encryption, secure protocols and network monitoring matter. If someone taps a fibre-optic cable or compromises an ISP, every file on that route is exposed.
              </p>
            </section>

            <aside className="tc-take">
              <span className="tc-take-ic"><Icon name="ic-check" size={20} /></span>
              <div>
                <div className="tc-take-h">Key takeaway</div>
                <p>
                  Your data makes a physical journey through cables and switches. Wi-Fi is just the last hop. The backbone, miles of fibre-optic cable running between cities, is what carries the internet at the speed of light.
                </p>
              </div>
            </aside>
          </article>
        </div>
      </div>

      <footer className="tc-foot">
        <div className="tc-foot-next">
          <span>Up next</span>
          <b>Visualize the data path</b>
        </div>
        <StageContinue topicId="1-2" stage="concept" href="/learn/modules/networking/1-2/visualize" style={{ background: "linear-gradient(120deg,#1d4ed8,#1739a8)", color: "#fff" }}>
          Continue to Visualization<Icon name="ic-arrow" size={15} style={{ stroke: "#fff" }} />
        </StageContinue>
      </footer>
    </div>
  );
}
