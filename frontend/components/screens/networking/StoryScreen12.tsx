"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { Icon } from "@/components/Icon";
import { StepTracker } from "@/components/networking/StepTracker";
import { StageContinue } from "@/components/networking/StageContinue";

type Panel = { title: string; alt: string };

const PANELS: Panel[] = [
  {
    title: "The Surprise: Upload Complete",
    alt: "Twelve o'clock. Kevin sits at his desk in the office beside Pixel the owl mascot. His laptop shows Upload Complete 100%. Kevin: Uploaded! Now let's see how long it takes to reach the client. CLICK!",
  },
  {
    title: "Five Seconds Later",
    alt: "Five seconds later. Kevin looks shocked at his laptop while Pixel smiles. A notification shows the file was delivered in 05 seconds with a checkmark. Kevin: Five seconds?! London is thousands of kilometres away. How did it get there so fast? Pixel: Got it, thanks! Looks great.",
  },
  {
    title: "The Journey Begins",
    alt: "Kevin and Pixel stand outside the Design Studio. Kevin imagines Wi-Fi signals and satellites. Kevin: A walk? Can't you just tell me? Is it Wi-Fi? Satellites? Pixel: Good question. Let's go for a walk. I'll show you. Wi-Fi only covers the last few metres. Come with me.",
  },
  {
    title: "Fibre-Optic Cables",
    alt: "Kevin crouches near a trench where workers are laying orange cable. A close-up shows glowing fibre-optic threads. Kevin: What are they laying down there? Pixel: A fibre-optic cable. Thin glass threads that carry data as flashes of light. Kevin: So the internet is… in the ground? Pixel: A lot of it, yes.",
  },
  {
    title: "The ISP: The Local Road",
    alt: "Kevin and Pixel stand by a grey street cabinet. Pixel sits on top of it. Pixel: Your router sends your data here first, to your ISP. That's the company that connects you to the internet. Kevin: So this cabinet connects my studio to the internet? Pixel: Exactly. Think of it as your local road, the first stretch of the journey. Now let's follow it out of town.",
  },
  {
    title: "Internet Backbones",
    alt: "Sunset. Pixel perches on a fence post pointing at glowing cables running along railway lines and pylons heading toward a distant city skyline. Pixel: Out of town, the cable follows roads, railways and power lines. These big routes are called backbones, and they carry the internet from city to city. Kevin: Who owns all of the internet?",
  },
];

const N = PANELS.length;
const TITLE = "Five Seconds to London";
const SUBTITLE = "A Kevin & Pixel Adventure";
const panelSrc = (i: number) => `/story/1-2/${i + 1}.jpeg`;

export default function StoryScreen12() {
  const [panel, setPanel] = useState(0);
  const [seen, setSeen] = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const go = useCallback(
    (i: number) => {
      const next = Math.max(0, Math.min(N - 1, i));
      if (next === panel || transitioning) return;
      setTransitioning(true);
      setTimeout(() => {
        setPanel(next);
        setSeen((s) => Math.max(s, next));
        setTransitioning(false);
      }, 280);
    },
    [panel, transitioning],
  );

  const next = useCallback(() => go(panel + 1), [go, panel]);
  const prev = useCallback(() => go(panel - 1), [go, panel]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA") return;
      if (t.tagName === "BUTTON" && (e.key === "Enter" || e.key === " ")) return;
      if (e.key === "ArrowRight") { e.preventDefault(); next(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [next, prev]);

  useEffect(() => {
    PANELS.forEach((_, i) => {
      const img = new Image();
      img.src = panelSrc(i);
    });
  }, []);

  const progressPct = Math.round(((seen + 1) / N) * 100);
  const finished = seen >= N - 1;

  return (
    <div className="s12" style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "#0c0a14", overflow: "hidden" }}>
      <StepTracker
        current="story"
        progressPct={progressPct}
        label="NETWORKING · MODULE 01 · TOPIC 1.2"
        exitHref="/learn/modules/networking#module-1"
      />

      <div className="s12-scene">
        {/* quest badge */}
        <div className="s12-quest" aria-hidden="true">
          <span className="s12-ring" style={{ "--p": `${progressPct}%` } as CSSProperties}>
            <Icon name="ic-book" size={16} />
          </span>
          <span className="s12-quest-text">
            <small>Chapter 1.2 · Story quest</small>
            <b>{seen + 1} / {N} panels read</b>
          </span>
          {finished && <span className="s12-done">Complete</span>}
        </div>

        <main className="s12-main">
          {/* panel viewer */}
          <div className="s12-viewer">
            <div className={`s12-panel-wrap${transitioning ? " out" : " in"}`}>
              <img
                key={panel}
                src={panelSrc(panel)}
                alt={PANELS[panel].alt}
                className="s12-img"
                draggable={false}
              />
            </div>

            {/* panel title overlay */}
            <div className="s12-overlay">
              <span className="s12-panel-num">Panel {panel + 1} of {N}</span>
              <span className="s12-panel-title">{PANELS[panel].title}</span>
            </div>
          </div>

          {/* screen-reader announcement */}
          <p className="sr-only" aria-live="polite">
            Panel {panel + 1} of {N}, {PANELS[panel].title}. {PANELS[panel].alt}
          </p>

          {/* navigation bar */}
          <div className="s12-nav">
            <div className="s12-info">
              <span className="s12-title">{TITLE}</span>
              <span className="s12-sub">{SUBTITLE} · Topic 1.2</span>
            </div>

            <div className="s12-dots" aria-hidden="true">
              {PANELS.map((_, k) => (
                <button
                  key={k}
                  type="button"
                  className={`s12-dot${k === panel ? " on" : ""}${k <= seen ? " seen" : ""}`}
                  onClick={() => go(k)}
                  aria-label={`Go to panel ${k + 1}`}
                />
              ))}
            </div>

            <div className="s12-btns">
              <button className="s12-btn ghost" type="button" onClick={prev} disabled={panel === 0}>
                <Icon name="ic-arrow-l" size={14} style={{ stroke: "currentColor" }} />Back
              </button>
              {finished && panel === N - 1 ? (
                <StageContinue
                  topicId="1-2"
                  stage="story"
                  href="/learn/modules/networking/1-2/concept"
                  className="s12-btn go"
                  style={{ background: "linear-gradient(120deg,#1d4ed8,#1739a8)", color: "#fff" }}
                >
                  Continue to Concept<Icon name="ic-arrow" size={13} style={{ stroke: "#fff" }} />
                </StageContinue>
              ) : (
                <button className="s12-btn go" type="button" onClick={next} disabled={panel >= N - 1}>
                  Next panel<Icon name="ic-arrow" size={13} style={{ stroke: "currentColor" }} />
                </button>
              )}
            </div>
          </div>
        </main>
      </div>

      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
    </div>
  );
}

const STYLES = `
  .s12-scene {
    flex: 1; min-height: 0; position: relative; display: flex; flex-direction: column;
    align-items: center; justify-content: center; padding: 20px 24px 0;
  }
  .s12-quest {
    position: absolute; top: 18px; left: 28px; display: flex; align-items: center; gap: 10px; z-index: 2;
  }
  .s12-ring {
    width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
    background: conic-gradient(#38bdf8 var(--p), rgba(255,255,255,.12) var(--p));
    position: relative;
  }
  .s12-ring::before {
    content: ""; position: absolute; inset: 3px; border-radius: 50%; background: #0c0a14;
  }
  .s12-ring svg { position: relative; z-index: 1; stroke: #38bdf8; }
  .s12-quest-text { display: flex; flex-direction: column; gap: 2px; }
  .s12-quest-text small { font-size: 10px; color: rgba(255,255,255,.45); font-weight: 600; text-transform: uppercase; letter-spacing: .4px; }
  .s12-quest-text b { font-size: 12.5px; color: rgba(255,255,255,.85); font-weight: 700; }
  .s12-done {
    font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .5px;
    background: linear-gradient(120deg,#34d399,#2dd4a7); color: #0c2a1e; padding: 4px 10px; border-radius: 999px;
  }

  .s12-main {
    width: 100%; max-width: 960px; display: flex; flex-direction: column; gap: 16px;
    flex: 1; min-height: 0; padding-bottom: 16px;
  }

  .s12-viewer {
    position: relative; flex: 1; min-height: 0; border-radius: 16px; overflow: hidden;
    background: #1a1726; border: 1px solid rgba(255,255,255,.08);
    box-shadow: 0 30px 60px -20px rgba(0,0,0,.6);
  }
  .s12-panel-wrap {
    position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
    transition: opacity .28s ease, transform .28s ease;
  }
  .s12-panel-wrap.out { opacity: 0; transform: scale(.97); }
  .s12-panel-wrap.in { opacity: 1; transform: scale(1); }
  .s12-img {
    width: 100%; height: 100%; object-fit: contain; display: block; user-select: none;
  }

  .s12-overlay {
    position: absolute; bottom: 0; left: 0; right: 0;
    background: linear-gradient(transparent, rgba(12,10,20,.92));
    padding: 40px 24px 16px; display: flex; align-items: flex-end; justify-content: space-between; gap: 12px;
  }
  .s12-panel-num {
    font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px;
    color: rgba(255,255,255,.5); background: rgba(255,255,255,.1); padding: 4px 10px; border-radius: 999px;
  }
  .s12-panel-title {
    font-size: 15px; font-weight: 700; color: #fff; letter-spacing: -.2px;
  }

  .s12-nav {
    flex: none; display: flex; flex-direction: column; gap: 12px;
    background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08);
    border-radius: 16px; padding: 16px 20px;
  }
  .s12-info { display: flex; flex-direction: column; gap: 2px; }
  .s12-title { font-size: 17px; font-weight: 700; color: #fff; letter-spacing: -.2px; }
  .s12-sub { font-size: 12px; color: rgba(255,255,255,.45); font-weight: 600; }

  .s12-dots {
    display: flex; align-items: center; gap: 6px; justify-content: center;
  }
  .s12-dot {
    width: 10px; height: 10px; border-radius: 50%; border: 2px solid rgba(255,255,255,.2);
    background: transparent; padding: 0; cursor: pointer; transition: all .2s;
  }
  .s12-dot.seen { border-color: #38bdf8; background: rgba(56,189,248,.25); }
  .s12-dot.on { border-color: #38bdf8; background: #38bdf8; transform: scale(1.3); box-shadow: 0 0 8px rgba(56,189,248,.5); }

  .s12-btns { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .s12-btn {
    display: inline-flex; align-items: center; gap: 6px; padding: 11px 18px; border-radius: 12px;
    font-size: 13px; font-weight: 700; border: none; cursor: pointer; transition: opacity .15s;
  }
  .s12-btn:disabled { opacity: .35; cursor: not-allowed; }
  .s12-btn.ghost { background: rgba(255,255,255,.08); color: rgba(255,255,255,.7); border: 1px solid rgba(255,255,255,.12); }
  .s12-btn.ghost:hover:not(:disabled) { background: rgba(255,255,255,.14); }
  .s12-btn.go { background: linear-gradient(120deg,#1d4ed8,#38bdf8); color: #fff; }
  .s12-btn.go:hover:not(:disabled) { opacity: .9; }

  @media (max-width: 640px) {
    .s12-scene { padding: 12px 12px 0; }
    .s12-quest { top: 10px; left: 14px; }
    .s12-quest-text { display: none; }
    .s12-main { gap: 10px; }
    .s12-nav { padding: 12px 14px; gap: 10px; }
    .s12-title { font-size: 14px; }
    .s12-btn { padding: 10px 14px; font-size: 12px; }
    .s12-panel-title { font-size: 13px; }
  }

  @media (prefers-reduced-motion: reduce) {
    .s12-panel-wrap { transition: none !important; }
  }
`;
