"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { StageContinue } from "@/components/networking/StageContinue";

// Topic 1.1's game stage is hosted separately for now and embedded here.
const GAME_URL = "https://astounding-tapioca-b1c6f3.netlify.app";

export default function GameScreen() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", background: "#0b0715", color: "#e7defb" }}>
      <div
        style={{
          display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", flex: "none",
          background: "linear-gradient(120deg,#170f2c,#241a4a)", borderBottom: "1px solid rgba(126,224,245,.16)",
        }}
      >
        <Link
          href="/learn/modules/networking/1-1/visualize"
          className="btn"
          style={{ padding: "9px 12px", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.16)", color: "#e7defb", fontSize: 11.5 }}
        >
          <Icon name="ic-arrow-l" size={13} style={{ stroke: "currentColor" }} />Back
        </Link>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="mono" style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".6px", color: "#7ee0f5" }}>TOPIC 1.1 · STEP 4 OF 6</div>
          <div className="disp" style={{ fontSize: 15, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            Game · What is a Network?
          </div>
        </div>
        <a
          href={GAME_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="btn"
          style={{ padding: "9px 12px", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.16)", color: "#e7defb", fontSize: 11.5 }}
        >
          <Icon name="ic-eye" size={13} style={{ stroke: "currentColor" }} />New tab
        </a>
        <StageContinue
          topicId="1-1"
          stage="game"
          href="/learn/modules/networking/1-1/quiz"
          style={{ padding: "10px 14px", background: "linear-gradient(120deg,#f2b84b,#fb9a5a)", color: "#1a1030", fontSize: 11.5 }}
        >
          Continue<Icon name="ic-arrow" size={13} style={{ stroke: "currentColor" }} />
        </StageContinue>
      </div>

      <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
        {!loaded && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: "rgba(231,222,251,.6)" }}>
            Loading game…
          </div>
        )}
        <iframe
          src={GAME_URL}
          title="Topic 1.1 game: What is a Network?"
          onLoad={() => setLoaded(true)}
          allow="fullscreen; autoplay; gamepad; pointer-lock"
          allowFullScreen
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0, display: "block" }}
        />
      </div>
    </div>
  );
}
