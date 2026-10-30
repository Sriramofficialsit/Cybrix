"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";

type Step =
  | { kind: "concept" }
  | { kind: "quiz"; prompt: string; options: string[]; answer: number; explain: string };

const STEPS: Step[] = [
  { kind: "concept" },
  {
    kind: "quiz",
    prompt: "An unpatched web server is running a version with a known remote-code-execution bug. What is the unpatched software itself?",
    options: ["A threat", "A vulnerability", "An exploit", "A risk"],
    answer: 1,
    explain: "The weakness that could be taken advantage of is the vulnerability. The attacker who might use it is the threat; the code that uses it is the exploit.",
  },
  {
    kind: "quiz",
    prompt: "Which statement best describes risk?",
    options: [
      "Any weakness in a system",
      "The likelihood a threat exploits a vulnerability, times the impact if it does",
      "A tool used to attack a system",
      "The group that wants to cause harm",
    ],
    answer: 1,
    explain: "Risk is the combination — likelihood × impact — not any single factor on its own.",
  },
];

const CARDS = [
  { t: "Threat", d: "something that could cause harm: a ransomware crew, a careless insider, a flood." },
  { t: "Vulnerability", d: "a weakness a threat could use: an unpatched server, a reused password." },
  { t: "Exploit", d: "the actual technique or code that takes advantage of a vulnerability." },
  { t: "Risk", d: "the combination: the likelihood that a threat exploits a vulnerability, times the impact if it does." },
];

const XP = 30;

export default function LessonScreen() {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [hearts, setHearts] = useState(5);
  const done = i >= STEPS.length;
  const step = done ? null : STEPS[i];
  const total = STEPS.length;
  const progPct = done ? 100 : Math.round((i / total) * 100);
  const correct = step?.kind === "quiz" && picked === step.answer;
  const answered = picked !== null;

  function pick(n: number) {
    if (answered || step?.kind !== "quiz") return;
    setPicked(n);
    if (n !== step.answer) setHearts((h) => Math.max(0, h - 1));
  }
  function next() {
    setPicked(null);
    setI((v) => v + 1);
  }
  function restart() {
    setPicked(null);
    setI(0);
    setHearts(5);
  }

  const cellBg = "rgba(255,255,255,.8)";
  const glass = {
    background: cellBg,
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    border: "1px solid rgba(255,255,255,.7)",
    borderRadius: 13,
  } as const;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{ height: 66, flex: "none", background: "#fff", borderBottom: "1px solid #e7e5ee", display: "flex", alignItems: "center", gap: 22, padding: "0 30px" }}>
        <button style={{ border: 0, background: "transparent", padding: 6, cursor: "pointer", color: "#8b8599" }} aria-label="Exit lesson">
          <Icon name="ic-x" />
        </button>
        <div style={{ flex: 1, maxWidth: 640, height: 12, borderRadius: 999, background: "#ebe1fa", overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: 999, background: "#7c3aed", width: `${progPct}%`, transition: "width .25s" }} />
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          {[0, 1, 2, 3, 4].map((h) => (
            <Icon key={h} name="ic-heart" style={{ width: 21, height: 21, stroke: "none", fill: h < hearts ? "#fa7faa" : "#e7dff5" }} />
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f5f0fc", borderRadius: 999, padding: "5px 12px", fontSize: 12, fontWeight: 700, color: "#5b21b6" }}>
          <Icon name="ic-zap" style={{ width: 14, height: 14, stroke: "#7c3aed" }} />+{XP} XP
        </div>
      </header>

      <div style={{ flex: 1, display: "flex", justifyContent: "center", padding: "44px 24px 140px" }}>
        <div style={{ width: "100%", maxWidth: 680 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 26 }}>
            {STEPS.map((_, n) => (
              <div key={n} style={{ flex: 1, height: 4, borderRadius: 999, background: n < i || done ? "#7c3aed" : n === i ? "#c4a6f2" : "#e7dff5" }} />
            ))}
          </div>

          {step?.kind === "concept" && (
            <div>
              <div className="eyebrow" style={{ marginBottom: 12 }}>Concept · Security Foundations — Cyber Fundamentals</div>
              <h1 className="disp" style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-.4px", lineHeight: 1.2 }}>
                The four words that anchor <span className="lime">everything</span>
              </h1>
              <p style={{ marginTop: 18, fontSize: 16, color: "#3d345c" }}>
                Most confusion in security comes from blurring four terms. Get them straight and the rest of the field gets much easier.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 22 }}>
                {CARDS.map((c) => (
                  <div key={c.t} style={{ ...glass, padding: "16px 18px" }}>
                    <b className="disp" style={{ fontSize: 15 }}>{c.t}</b>
                    <span style={{ color: "#5b5470", fontSize: 14 }}> — {c.d}</span>
                  </div>
                ))}
              </div>
              <p style={{ marginTop: 20, fontSize: 15, color: "#3d345c" }}>
                <b>Risk = likelihood × impact</b> — the combination, not any single factor. Using the four terms precisely makes every later topic clearer.
              </p>
            </div>
          )}

          {step?.kind === "quiz" && (
            <div>
              <div className="eyebrow" style={{ marginBottom: 14 }}>Checkpoint · Question {i} of {total - 1}</div>
              <h1 className="disp" style={{ fontSize: 23, fontWeight: 600, lineHeight: 1.3, letterSpacing: "-.2px" }}>{step.prompt}</h1>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
                {step.options.map((opt, n) => {
                  const isAns = n === step.answer;
                  const isPick = n === picked;
                  let bg = "rgba(255,255,255,.8)";
                  let border = "1px solid rgba(124,58,237,.18)";
                  let color = "#2a2140";
                  if (answered && isAns) {
                    bg = "#150f23";
                    border = "1px solid #150f23";
                    color = "#fff";
                  } else if (answered && isPick && !isAns) {
                    bg = "#fdeef3";
                    border = "1px solid #fa7faa";
                    color = "#a23b60";
                  }
                  return (
                    <div
                      key={n}
                      onClick={() => pick(n)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                        padding: "15px 18px", borderRadius: 12, fontSize: 15, fontWeight: 500,
                        cursor: answered ? "default" : "pointer", background: bg, border, color,
                        backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
                      }}
                    >
                      <span>{opt}</span>
                      {answered && isAns && <Icon name="ic-check" style={{ width: 20, height: 20, stroke: "#fff" }} />}
                      {answered && isPick && !isAns && <Icon name="ic-x" style={{ width: 18, height: 18, stroke: "#fa7faa" }} />}
                    </div>
                  );
                })}
              </div>
              {answered && (
                <div
                  style={{
                    borderRadius: 12, padding: "15px 18px", marginTop: 18,
                    background: correct ? "#eef7e6" : "#fdeef3",
                    border: `1px solid ${correct ? "#a9d178" : "#fa7faa"}`,
                    color: correct ? "#3f5b23" : "#a23b60",
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: ".2px", marginBottom: 5 }}>
                    {correct ? "Correct" : "Not quite"}
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.55 }}>{step.explain}</div>
                </div>
              )}
            </div>
          )}

          {done && (
            <div style={{ textAlign: "center", paddingTop: 36 }}>
              <div style={{ width: 80, height: 80, borderRadius: 999, background: "#150f23", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 22px" }}>
                <Icon name="ic-check" style={{ width: 38, height: 38, stroke: "#fff", strokeWidth: 2 }} />
              </div>
              <h1 className="disp" style={{ fontSize: 30, fontWeight: 600, letterSpacing: "-.4px" }}>Checkpoint cleared</h1>
              <p style={{ marginTop: 12, color: "#6a6480", fontSize: 15 }}>Security Foundations — Cyber Fundamentals, Lesson 1 complete.</p>
              <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 26, flexWrap: "wrap" }}>
                {[
                  { n: `+${XP}`, l: "checkpoint XP" },
                  { n: "+50", l: "lesson bonus" },
                  { n: "1 / 3", l: "daily quest" },
                ].map((k) => (
                  <div key={k.l} style={{ ...glass, padding: "16px 22px" }}>
                    <div className="disp" style={{ fontSize: 22, fontWeight: 700 }}>{k.n}</div>
                    <div style={{ fontSize: 11, color: "#9a94ab" }}>{k.l}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 30, flexWrap: "wrap" }}>
                <button className="btn" style={{ background: "#150f23", color: "#fff", padding: "14px 26px" }}>
                  Next lesson <Icon name="ic-arrow" style={{ width: 16, height: 16, stroke: "#fff" }} />
                </button>
                <button className="btn btn-g" style={{ padding: "14px 22px" }}>
                  Practise in the Range <Icon name="ic-term" style={{ width: 15, height: 15, stroke: "#1f1633" }} />
                </button>
              </div>
              <button onClick={restart} style={{ marginTop: 18, background: "transparent", border: 0, cursor: "pointer", color: "#9a94ab", fontFamily: "inherit", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Icon name="ic-replay" style={{ width: 13, height: 13, stroke: "#9a94ab" }} />Replay this lesson
              </button>
            </div>
          )}
        </div>
      </div>

      {!done && (
        <footer style={{ position: "fixed", left: 0, right: 0, bottom: 0, background: "#fff", borderTop: "1px solid #e7e5ee", padding: "16px 30px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ minWidth: 60 }}>
            {step?.kind === "quiz" && !answered && (
              <button onClick={next} className="btn" style={{ background: "transparent", color: "#9a94ab", padding: "14px 8px" }}>Skip</button>
            )}
          </div>
          <button
            onClick={next}
            disabled={step?.kind === "quiz" && !answered}
            className="btn"
            style={{
              padding: "14px 34px", fontSize: 13,
              background: step?.kind === "quiz" && !answered ? "#e7dff5" : "#150f23",
              color: step?.kind === "quiz" && !answered ? "#a99fc4" : "#fff",
              cursor: step?.kind === "quiz" && !answered ? "not-allowed" : "pointer",
            }}
          >
            {step?.kind === "concept" ? "Got it" : correct ? "Continue" : answered ? "Continue" : "Check"}
          </button>
        </footer>
      )}
    </div>
  );
}
