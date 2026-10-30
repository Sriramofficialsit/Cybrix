import type { CSSProperties } from "react";

// Backdrop for the Topic 1.1 story: the Adventurer's Study. A candle-lit
// library hall (public/story/study.webp, built by
// scripts/build-campaign-art.cjs from Kenney's CC0 packs, the same art as
// the campaign map) sits slightly out of focus behind the book, with a warm
// reading lamp on the book, drifting dust motes, film grain and a vignette.
// Purely decorative; styles and motion live in vintage.css under .sb.

// Fixed, not random, so server and browser render the same markup
const MOTES = Array.from({ length: 28 }, (_, i) => ({
  left: (i * 37 + 11) % 100,
  size: 2 + (i % 3),
  dur: 13 + ((i * 7) % 11),
  delay: -((i * 2.3) % 18),
  drift: ((i * 13) % 50) - 25,
  glow: i % 4 === 0,
}));

export function StudyBackdrop() {
  return (
    <div className="sb" aria-hidden="true">
      <img className="sb-art" src="/story/study.webp" alt="" draggable={false} />
      <div className="sb-lamp" />
      <div className="sb-motes">
        {MOTES.map((m, i) => (
          <i
            key={i}
            className={m.glow ? "glow" : undefined}
            style={{
              left: `${m.left}%`,
              width: m.size,
              height: m.size,
              animationDuration: `${m.dur}s`,
              animationDelay: `${m.delay}s`,
              "--dx": `${m.drift}px`,
            } as CSSProperties}
          />
        ))}
      </div>
      <div className="sb-grain" />
      <div className="sb-vignette" />
    </div>
  );
}
