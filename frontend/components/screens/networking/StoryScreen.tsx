"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { PageFlip as PageFlipType } from "page-flip";
import { Icon } from "@/components/Icon";
import { StepTracker } from "@/components/networking/StepTracker";
import { StageContinue } from "@/components/networking/StageContinue";
import { Rye } from "next/font/google";
import { StudyBackdrop } from "./StudyBackdrop";
import "./comic.css";
import "./vintage.css";

// Old-time display face for the reader's chrome
const vintage = Rye({ subsets: ["latin"], weight: "400", variable: "--font-vintage", display: "swap" });

// Topic 1.1 story, bound as an old storybook and read by turning real,
// curling pages (StPageFlip). Art lives in /public/story/1-1. Each panel is
// printed as a double-page spread so its lettering stays readable; on
// phones the book shows one page, and a whole panel, at a time. Reaching
// the last panel unlocks "Continue to Concept", which records the stage.

type Panel = { title: string; alt: string };

const PANELS: Panel[] = [
  { title: "The Disconnect", alt: "Kevin sits at his desk, hand on his forehead, staring at a monitor that reads NO CONNECTION. The router's green power light is on. Kevin: Ugh, no connection?! Not right now, I have a deadline!" },
  { title: "The False Assumption", alt: "Kevin points at the glowing router. Kevin: But wait… the power light is ON! That means it's working, right?!" },
  { title: "Pixel's Arrival", alt: "Pixel the owl mascot appears on the desk holding a laptop. Pixel: Hold on, Kevin! 'ON' just means it has electricity. It doesn't mean you're actually connected! Kevin: Pixel?! Where did you… Wait, what do you mean?" },
  { title: "The Discussion", alt: "Pixel: Not at all! Power just means the brain is awake. Data needs a physical pathway to travel on, what we call Layer 1! Kevin: But if it has power, doesn't that mean it's sending and receiving data?!" },
  { title: "The LED Diagnostic", alt: "Pixel points at the router's lights. Pixel: See? The power light is on, but WAN and INTERNET are completely dark! Kevin: So it's getting power, but no data is actually coming through?!" },
  { title: "The Conceptual Split", alt: "A split diagram. Left: a lightning bolt and plug labelled POWER, raw electricity. Right: a signal wave running into an Ethernet port, labelled LINK, physical data pathway. Pixel: Think of it like this: power just wakes up the hardware… but you need a physical link, Layer 1, to actually transport data!" },
  { title: "The Realization", alt: "A light bulb flashes over Kevin. Pixel: Exactly! Power is just electricity. For data, you need a physical connection, Layer 1. Check the cables! Kevin: Oh! So just because it's plugged into the wall and has power, doesn't mean it's physically connected to the network?!" },
  { title: "Tracing the Physical Path", alt: "Kevin crouches behind the desk, following a blue Ethernet cable. Kevin: Let's see… the blue Ethernet cable goes from the router, goes behind the desk… Pixel: Yep! Follow that physical Layer 1 path! Where does the other end go?" },
  { title: "The Loose Connector", alt: "Close-up of a blue Ethernet plug hanging half out of the computer's port. Kevin: Aha! Found it! The blue Ethernet cable is barely plugged into the port… It must have slipped out! Pixel: A classic Layer 1 break! If the RJ45 latch isn't clicked in, you have no connection!" },
  { title: "The Click", alt: "Kevin pushes the plug into the port with a loud CLICK. Kevin: There! Felt the snap! It clicked right into place! Pixel: Perfect! That physical latch locks Layer 1 into place!" },
  { title: "Link Lights Return", alt: "Green and amber lights glow beside the port. Kevin: Oh, look! The tiny link lights by the port just came on! Green and amber! Pixel: Boom! We have a physical link! Layer 1 is officially up and running!" },
  { title: "The Logic Verified", alt: "Pixel checks a laptop at the desk. Pixel: Now verifying the logic layer… Yes! IP address assigned and packets are flowing! We're back in business! Kevin: So resolving the physical connection at Layer 1 fixed everything above it!" },
  { title: "Connection Restored", alt: "The monitor shows a live dashboard marked ONLINE. Kevin: Wow, look at that! The workstation is reloading… the dashboard is back fully connected! Pixel: Yes! Telemetry is live, we have logical data flow!" },
  { title: "Celebrative High-Five!", alt: "Kevin and Pixel high-five beside a screen marked ONLINE. Pixel: Teamwork, Kevin! Never underestimate the power of Layer 1! Kevin: We did it, Pixel! The physical layer is solid, and we are officially back online!" },
  { title: "Understanding the Layers", alt: "A chart of three stacked layers. Layer 0, power: raw electricity, is the device actually on? Layer 1, physical link: is the cable connected and latched? Layer 2/3 and up, logic: data and configuration, are IP and data actually flowing? Pixel: Remember: ON is not connected! Each layer must be verified one by one! Kevin: I get it now! You can't just see a power light and assume you have a network connection!" },
  { title: "The Final Payoff", alt: "Neon title: ON ISN'T CONNECTED! Kevin stands with arms folded beside Pixel. Pixel: Yep! Don't get fooled by a glowing power light! Always check Layer 1! Kevin: Because power is only half the battle. You have to ensure the physical link is solid!" },
];

const N = PANELS.length;
const TITLE = "On Isn't Connected";
const SUBTITLE = "A Kevin & Pixel Adventure";
const COVER_ALT = `Cover: ${TITLE}, ${SUBTITLE}. A worried Kevin sits at his desk beside a router while Pixel holds a laptop; a screen behind them warns of a connection problem.`;
const panelSrc = (i: number) => `/story/1-1/panel-${String(i + 1).padStart(2, "0")}.png`;
const COVER_SRC = "/story/1-1/cover.webp";
const ART = 1600 / 893; // panel width / height

// Book metrics; keep in step with .book* in comic.css
const BOARD = 15; // leather showing round the open pages
const HEAD = 30; // running-head band
const FOOT = 30; // folio band
const OUTER = 0.045; // outer page margin, as a share of the page width
const FLIP_MS = 900;

// Page order. Spread (two pages showing): cover | endpaper, title |
// panel k on pages 3+2k (left half) and 4+2k (right half) | the end,
// endpaper | back cover. Single page: cover | title | panel k at 2+k |
// the end | back cover.
type Mode = "spread" | "single";
const pageCount = (m: Mode) => (m === "spread" ? 2 * N + 6 : N + 4);
const firstPanelPage = (m: Mode) => (m === "spread" ? 3 : 2);
const pageOfPanel = (m: Mode, k: number) => (m === "spread" ? 3 + 2 * k : 2 + k);
// Panel showing at page index i: -1 for the front matter, N for the end
function panelAt(m: Mode, i: number) {
  if (i < firstPanelPage(m)) return -1;
  return Math.min(m === "spread" ? Math.floor((i - 3) / 2) : i - 2, N);
}

type Size = { w: number; h: number };

// Largest page that fits the stage. In a spread a panel runs across both
// pages, edge to edge but for the outer margins, so the art fixes the page
// height; a single page carries a whole panel.
function fitPage(avail: Size, m: Mode): Size {
  const w = avail.w - 2 * BOARD;
  const artH = avail.h - 2 * BOARD - HEAD - FOOT;
  const pw = Math.floor(m === "spread" ? Math.min(w / 2, (artH * ART) / (2 * (1 - OUTER))) : Math.min(w, (artH * ART) / (1 - 2 * OUTER)));
  const margin = Math.round(pw * OUTER);
  const art = m === "spread" ? (2 * (pw - margin)) / ART : (pw - 2 * margin) / ART;
  return { w: pw, h: Math.round(art) + HEAD + FOOT };
}

export default function StoryScreen() {
  const [phone, setPhone] = useState(false);
  const [avail, setAvail] = useState<Size | null>(null);
  const [page, setPage] = useState(0); // current page index in the book
  const [seen, setSeen] = useState(-1); // furthest panel reached
  const [busy, setBusy] = useState(false); // a page is turning or being dragged
  const stageRef = useRef<HTMLDivElement>(null);
  const tplRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef<PageFlipType | null>(null);
  const panelRef = useRef<number | null>(null); // where to reopen after a rebuild

  const mode: Mode = phone ? "single" : "spread";
  const size = avail ? fitPage(avail, mode) : null;
  const pw = size?.w ?? 0;
  const ph = size?.h ?? 0;
  const total = pageCount(mode);
  const panel = panelAt(mode, page);
  const closed = page === 0 && !busy;
  const shut = page >= total - 1 && !busy;

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 700px)");
    const sync = () => setPhone(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Space the book fits into, once a resize settles (rebuilding the book on
  // every frame of a window drag would stutter)
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    let t: ReturnType<typeof setTimeout> | undefined;
    const measure = () => setAvail({ w: el.clientWidth, h: el.clientHeight });
    const settle = () => {
      clearTimeout(t);
      t = setTimeout(measure, 120);
    };
    measure();
    const ro = new ResizeObserver(settle);
    ro.observe(el);
    return () => {
      clearTimeout(t);
      ro.disconnect();
    };
  }, []);

  // Build the flipbook from the pages React rendered into the hidden
  // template. StPageFlip re-parents the nodes it is given, so it gets copies
  // in a container React never touches, and is rebuilt when the page size
  // or layout changes, reopening at the same panel.
  useLayoutEffect(() => {
    const host = hostRef.current;
    const tpl = tplRef.current;
    if (!host || !tpl || !pw || !ph) return;
    let pf: PageFlipType | null = null;
    let gone = false;
    (async () => {
      const { PageFlip } = await import("page-flip");
      if (gone) return;
      const root = document.createElement("div");
      host.appendChild(root);
      const k = panelRef.current;
      const start = k === null ? 0 : k < 0 ? firstPanelPage(mode) - 1 : k >= N ? pageCount(mode) - 2 : pageOfPanel(mode, k);
      const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      pf = new PageFlip(root, {
        width: pw,
        height: ph,
        size: "fixed",
        showCover: true,
        usePortrait: mode === "single",
        startPage: Math.max(0, Math.min(start, pageCount(mode) - 1)),
        flippingTime: still ? 250 : FLIP_MS,
        drawShadow: true,
        maxShadowOpacity: 0.45,
        showPageCorners: true,
        mobileScrollSupport: true,
        autoSize: false,
      });
      pf.loadFromHTML(Array.from(tpl.children).map((n) => n.cloneNode(true) as HTMLElement));
      pf.on("flip", (e) => {
        const i = Number(e.data);
        const kk = panelAt(mode, i);
        panelRef.current = i === 0 ? null : kk;
        setPage(i);
        setSeen((s) => Math.max(s, Math.min(kk, N - 1)));
      });
      pf.on("changeState", (e) => setBusy(e.data !== "read"));
      flipRef.current = pf;
      setPage(pf.getCurrentPageIndex());
    })();
    return () => {
      gone = true;
      flipRef.current = null;
      pf?.destroy();
      host.replaceChildren();
    };
  }, [mode, pw, ph]);

  const next = useCallback(() => flipRef.current?.flipNext(), []);
  const prev = useCallback(() => flipRef.current?.flipPrev(), []);
  const toCover = () => flipRef.current?.flip(0);
  const restart = () => flipRef.current?.flip(firstPanelPage(mode));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA") return;
      if (t.tagName === "BUTTON" && (e.key === "Enter" || e.key === " ")) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [next, prev]);

  const progressPct = Math.round(((seen + 1) / N) * 100);
  const inStory = panel >= 0 && panel < N;
  const heading = inStory ? PANELS[panel].title : TITLE;
  const where = page === 0 ? "Cover" : inStory ? `Panel ${panel + 1} of ${N}` : panel < 0 ? "Title page" : "The End";
  const margin = Math.round(pw * OUTER);

  // ---- the pages, rendered once per layout into the template ----
  const endpaper = (side: "left" | "right") => (
    <div className={`pg endpaper ${side}`} data-density="hard" key={`endpaper-${side}`}>
      <div className="pg-in">{side === "left" && <div className="pg-plate"><small>Ex Libris</small><b>CyberThulir</b></div>}</div>
    </div>
  );
  const pages: ReactNode[] = [
    <div className="pg cover front" data-density="hard" key="cover">
      <div className="pg-cover-plate">
        <img src={COVER_SRC} alt="" draggable={false} />
      </div>
    </div>,
  ];
  if (mode === "spread") pages.push(endpaper("left"));
  pages.push(
    <div className={`pg paper ${mode === "spread" ? "right" : "single"}`} key="title">
      <div className="pg-in pg-title">
        <small>Networking Fundamentals · Chapter 1.1</small>
        <i className="orn">❦</i>
        <b>{TITLE}</b>
        <i className="rule" />
        <span>{SUBTITLE}</span>
        <em>Layer 1 · The Physical Link</em>
      </div>
    </div>,
  );
  PANELS.forEach((p, k) => {
    if (mode === "spread") {
      (["left", "right"] as const).forEach((side, h) =>
        pages.push(
          <div className={`pg paper ${side}`} key={`p${k}-${side}`}>
            <div className="pg-in">
              <div className="pg-run">{side === "left" ? TITLE : p.title}</div>
              <div className={`pg-art half ${side}`} style={side === "left" ? { marginLeft: margin } : { marginRight: margin }}>
                <img src={panelSrc(k)} alt="" draggable={false} style={{ left: h ? "-100%" : 0 }} />
              </div>
              <div className="pg-folio">{2 * k + 1 + h}</div>
            </div>
          </div>,
        ),
      );
    } else {
      pages.push(
        <div className="pg paper single" key={`p${k}`}>
          <div className="pg-in">
            <div className="pg-run">{p.title}</div>
            <div className="pg-art whole" style={{ margin: `0 ${margin}px` }}>
              <img src={panelSrc(k)} alt="" draggable={false} />
            </div>
            <div className="pg-folio">{k + 1}</div>
          </div>
        </div>,
      );
    }
  });
  pages.push(
    <div className={`pg paper ${mode === "spread" ? "left" : "single"}`} key="fin">
      <div className="pg-in pg-title">
        <i className="orn">✦ ❦ ✦</i>
        <b>The End</b>
        <span>of Chapter 1.1</span>
        <i className="rule" />
        <em>Power wakes the hardware. Layer 1 carries the data.</em>
      </div>
    </div>,
  );
  if (mode === "spread") pages.push(endpaper("right"));
  pages.push(
    <div className="pg cover back" data-density="hard" key="back">
      <div className="pg-in pg-back">
        <i className="orn">✦</i>
        <span>CyberThulir</span>
      </div>
    </div>,
  );

  return (
    <div className={vintage.variable} style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "#140a05", overflow: "hidden" }}>
      <StepTracker current="story" progressPct={progressPct} />

      <div className="story-scene">
        <StudyBackdrop />

        {/* quest badge: how much of the story has been found */}
        <div className="story-quest" aria-hidden="true">
          <span className="sq-ring" style={{ "--p": `${progressPct}%` } as CSSProperties}>
            <Icon name="ic-book" size={16} />
          </span>
          <span className="sq-text">
            <small>Chapter 1.1 · Story quest</small>
            <b>{Math.max(0, seen + 1)} / {N} pages found</b>
          </span>
          {seen >= N - 1 && <span className="sq-done">Complete</span>}
        </div>

        <main className="comic">
          <div className="comic-stage" ref={stageRef}>
            {size && (
              <div
                className={`book ${mode}${closed ? " closed" : ""}${shut ? " shut" : ""}`}
                style={{ "--pw": `${pw}px`, "--ph": `${ph}px` } as CSSProperties}
              >
                <div className="book-board" aria-hidden="true" />
                <div className="book-closed-shadow" aria-hidden="true" />
                <div className="book-host" ref={hostRef} aria-hidden="true" />
              </div>
            )}
            {/* the pages StPageFlip copies; never shown itself */}
            <div ref={tplRef} className="book-template" aria-hidden="true" key={`${mode}-${pw}-${ph}`}>
              {pages}
            </div>
          </div>

          {/* what the turned-to page shows, for screen readers */}
          <p className="sr-only" aria-live="polite">
            {page === 0 ? COVER_ALT : inStory ? `Panel ${panel + 1} of ${N}, ${PANELS[panel].title}. ${PANELS[panel].alt}` : where}
          </p>

          {/* one control bar under the book, so the book gets the height */}
          <div className="comic-nav">
            <div className="comic-pg">
              <span className="pt">{heading}</span>
              <span className="pc">{where}</span>
            </div>
            <div className="comic-dots" aria-hidden="true">
              {PANELS.map((_, k) => (
                <i key={k} className={k <= seen ? "on" : undefined} />
              ))}
            </div>
            <div className="btns">
              <button className="c-alt" type="button" onClick={toCover} disabled={page === 0}>Cover</button>
              <button className="c-alt" type="button" onClick={restart} disabled={seen < 0}>Start over</button>
              <button className="c-alt" type="button" onClick={prev} disabled={page === 0}>← Back</button>
              {seen >= N - 1 && panel >= N - 1 ? (
                <StageContinue
                  topicId="1-1"
                  stage="story"
                  href="/learn/modules/networking/1-1/concept"
                  style={{ background: "linear-gradient(120deg,#1d4ed8,#1739a8)", color: "#fff", padding: "12px 20px", fontSize: 12.5, boxShadow: "0 16px 30px -14px rgba(29,78,216,.5)" }}
                >
                  Continue to Concept<Icon name="ic-arrow" size={13} style={{ stroke: "#fff" }} />
                </StageContinue>
              ) : (
                <button className="c-go" type="button" onClick={next} disabled={page >= total - 1}>
                  {page === 0 ? "Open the book" : "Turn the page →"}
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
