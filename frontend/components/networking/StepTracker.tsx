"use client";

import Link from "next/link";
import { Icon } from "@/components/Icon";

export const STEPS = [
  { key: "story", label: "Story", icon: "ic-book", href: "/learn/modules/networking/1-1/story" },
  { key: "concept", label: "Concept", icon: "ic-grid", href: "/learn/modules/networking/1-1/concept" },
  { key: "visualize", label: "Visualize", icon: "ic-eye", href: "/learn/modules/networking/1-1/visualize" },
  { key: "game", label: "Game", icon: "ic-fp", href: "/learn/modules/networking/1-1/game" },
  { key: "quiz", label: "Quiz", icon: "ic-target", href: "/learn/modules/networking/1-1/quiz" },
  { key: "done", label: "Done", icon: "ic-award", href: "/learn/modules/networking/1-1/done" },
] as const;

export type StepKey = (typeof STEPS)[number]["key"];

export function StepTracker({
  current,
  progressPct = 100,
  xp = 40,
  label = "NETWORKING · MODULE 01 · TOPIC 1.1",
  exitHref = "/learn/modules/networking#module-1",
}: {
  current: StepKey;
  progressPct?: number;
  xp?: number;
  label?: string;
  exitHref?: string;
}) {
  const idx = STEPS.findIndex((s) => s.key === current);

  return (
    <>
      <div style={{ height: 66, flex: "none", background: "#fff", borderBottom: "1px solid #e7e5ee", display: "flex", alignItems: "center", gap: 22, padding: "0 30px" }}>
        <Link href={exitHref} style={{ border: 0, background: "transparent", padding: 6, color: "#8b8599", display: "flex" }} aria-label="Exit to course outline">
          <Icon name="ic-x" />
        </Link>
        <div className="mono" style={{ fontSize: 11, fontWeight: 600, color: "#9a8fb5", whiteSpace: "nowrap" }}>
          {label}
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", maxWidth: 480, margin: "0 auto" }}>
          {STEPS.map((step, i) => {
            const state = i < idx ? "done" : i === idx ? "current" : "todo";
            return (
              <div key={step.key} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : "none" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <span
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flex: "none",
                      background: state === "todo" ? "#fff" : "linear-gradient(140deg,#1d4ed8,#38bdf8)",
                      border: state === "todo" ? "2px solid #e6e2ee" : "none",
                      boxShadow: state === "current" ? "0 0 0 4px rgba(29,78,216,.18)" : "none",
                    }}
                  >
                    <Icon name={state === "done" ? "ic-check" : step.icon} size={16} style={{ stroke: state === "todo" ? "#b6b0c6" : "#fff" }} />
                  </span>
                  <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".2px", color: state === "todo" ? "#b6b0c6" : "#1739a8" }}>
                    {step.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div style={{ flex: 1, height: 2, margin: "0 8px 17px", background: i < idx ? "linear-gradient(90deg,#1d4ed8,#38bdf8)" : "#e6e2ee" }} />
                )}
              </div>
            );
          })}
        </div>
        <div className="mono" style={{ display: "flex", alignItems: "center", gap: 6, background: "#eef2fd", borderRadius: 999, padding: "6px 13px", fontSize: 12, fontWeight: 700, color: "#1739a8", whiteSpace: "nowrap" }}>
          +{xp} XP
        </div>
      </div>
      <div style={{ height: 3, background: "#eee9f7" }}>
        <div style={{ height: "100%", background: "linear-gradient(90deg,#1d4ed8,#38bdf8)", width: `${progressPct}%`, transition: "width .3s" }} />
      </div>
    </>
  );
}
