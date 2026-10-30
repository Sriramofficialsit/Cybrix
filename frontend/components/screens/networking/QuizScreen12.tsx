"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { StepTracker } from "@/components/networking/StepTracker";

/*
  Topic 1-2 quiz: multiple-choice questions about how data travels the
  internet — ISPs, fibre-optic cables, backbones, and the hops a packet
  takes. Passing (>= 4/6) unlocks the done stage.
*/

type Question = {
  id: string;
  q: string;
  options: string[];
  answer: number;
  explanation: string;
};

const QUESTIONS: Question[] = [
  {
    id: "q1",
    q: "What is the very first hop when you send a file from your laptop over Wi-Fi?",
    options: ["Your ISP's street cabinet", "Your local Wi-Fi router", "The internet backbone", "The destination device"],
    answer: 1,
    explanation: "Data first travels over Wi-Fi to your local router before it goes anywhere else.",
  },
  {
    id: "q2",
    q: "What does ISP stand for?",
    options: ["Internet Security Protocol", "Internet Service Provider", "Internal Server Process", "Internet Signal Port"],
    answer: 1,
    explanation: "ISP stands for Internet Service Provider — the company that connects your router to the wider internet.",
  },
  {
    id: "q3",
    q: "Fibre-optic cables carry data as:",
    options: ["Electrical signals through copper", "Radio waves through the air", "Pulses of light through glass threads", "Magnetic pulses through iron"],
    answer: 2,
    explanation: "Fibre-optic cables use thin glass or plastic threads to carry data as pulses of light, allowing very high speeds over long distances.",
  },
  {
    id: "q4",
    q: "What is the internet backbone?",
    options: [
      "The Wi-Fi signal inside a building",
      "A single cable connecting two computers",
      "High-capacity trunk lines connecting cities and countries",
      "The physical case of a server",
    ],
    answer: 2,
    explanation: "The backbone consists of high-capacity fibre-optic trunk lines that connect cities, countries, and continents — the spine of the internet.",
  },
  {
    id: "q5",
    q: "Why is understanding the physical path of data important for cybersecurity?",
    options: [
      "It helps you pick a faster browser",
      "Every hop is a potential interception point",
      "It makes Wi-Fi signals stronger",
      "It reduces the cost of your ISP plan",
    ],
    answer: 1,
    explanation: "Each hop — router, ISP, backbone cable — is a point where data could be intercepted, delayed, or corrupted. Understanding this is key to knowing why encryption matters.",
  },
  {
    id: "q6",
    q: "In Kevin's story, how long did it take for his file to reach London?",
    options: ["About 30 seconds", "About 5 seconds", "About 5 minutes", "About 1 minute"],
    answer: 1,
    explanation: "Kevin's file arrived in about five seconds — crossing Wi-Fi, cables, and fibre-optic backbone lines at close to the speed of light.",
  },
];

const PASS_THRESHOLD = 4;

export default function QuizScreen12() {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [picked, setPicked] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const q = QUESTIONS[current];
  const total = QUESTIONS.length;
  const answered = Object.keys(answers).length;
  const finished = showResult;

  const score = QUESTIONS.reduce((s, qq) => s + (answers[qq.id] === qq.answer ? 1 : 0), 0);
  const passed = finished && score >= PASS_THRESHOLD;

  const choose = (idx: number) => {
    if (picked !== null) return;
    setPicked(idx);
    setAnswers((a) => ({ ...a, [q.id]: idx }));
  };

  const next = () => {
    if (current < total - 1) {
      setCurrent((c) => c + 1);
      setPicked(null);
    } else {
      setShowResult(true);
    }
  };

  const restart = () => {
    setCurrent(0);
    setAnswers({});
    setPicked(null);
    setShowResult(false);
  };

  const progressPct = Math.round(((answered + (picked !== null ? 0 : 0)) / total) * 100);

  return (
    <div className="qz12">
      <style>{`
        .qz12{min-height:100vh;display:flex;flex-direction:column;background:#f4f2f9;color:#12224f}
        .qz12 .disp{font-family:var(--font-display,inherit)}
        .qz12-wrap{flex:1;display:flex;flex-direction:column;align-items:center;padding:24px 16px 40px;max-width:680px;margin:0 auto;width:100%}
        .qz12-eyebrow{font-size:11px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:#a78bfa;margin-bottom:6px}
        .qz12-h1{font-size:24px;font-weight:800;margin-bottom:8px}
        .qz12-sub{font-size:14px;color:#726c86;margin-bottom:24px;line-height:1.5}
        .qz12-progress{width:100%;display:flex;align-items:center;gap:12px;margin-bottom:28px}
        .qz12-progress-bar{flex:1;height:6px;border-radius:3px;background:#e0dce8;overflow:hidden}
        .qz12-progress-bar i{display:block;height:100%;border-radius:3px;background:linear-gradient(90deg,#a78bfa,#38bdf8);transition:width .4s}
        .qz12-progress-label{font-size:12px;font-weight:700;color:#726c86;flex:none}
        .qz12-card{background:#fff;border-radius:18px;border:1px solid #e0dce8;padding:28px 24px;width:100%;box-shadow:0 4px 24px rgba(18,34,79,.06)}
        .qz12-qn{font-size:11px;font-weight:700;letter-spacing:.4px;color:#a78bfa;margin-bottom:8px;text-transform:uppercase}
        .qz12-question{font-size:17px;font-weight:700;line-height:1.5;margin-bottom:20px}
        .qz12-options{display:flex;flex-direction:column;gap:10px;margin-bottom:20px}
        .qz12-opt{display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:12px;border:1.5px solid #e0dce8;background:#faf9fc;font-size:14px;font-weight:600;cursor:pointer;text-align:left;transition:border-color .2s,background .2s}
        .qz12-opt:hover:not(:disabled){border-color:#a78bfa;background:#f0ecfa}
        .qz12-opt:disabled{cursor:default}
        .qz12-opt.correct{border-color:#34d399;background:#ecfdf5;color:#065f46}
        .qz12-opt.wrong{border-color:#f87171;background:#fef2f2;color:#991b1b}
        .qz12-opt.dimmed{opacity:.55}
        .qz12-opt-letter{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex:none;border:1.5px solid #d0cbe0;background:#f4f2f9;color:#726c86}
        .qz12-opt.correct .qz12-opt-letter{border-color:#34d399;background:#d1fae5;color:#065f46}
        .qz12-opt.wrong .qz12-opt-letter{border-color:#f87171;background:#fee2e2;color:#991b1b}
        .qz12-explain{font-size:13px;color:#4b4560;line-height:1.6;padding:14px 16px;border-radius:10px;background:#f8f6fc;border-left:3px solid #a78bfa;margin-bottom:16px}
        .qz12-next{display:inline-flex;align-items:center;gap:8px;padding:12px 22px;border-radius:10px;font-size:13px;font-weight:700;border:none;cursor:pointer;background:linear-gradient(120deg,#1d4ed8,#38bdf8);color:#fff;transition:opacity .2s}
        .qz12-next:disabled{opacity:.4;cursor:default}
        .qz12-result{text-align:center;padding:20px 0}
        .qz12-score{font-size:48px;font-weight:800;margin-bottom:4px}
        .qz12-score-sub{font-size:14px;color:#726c86;margin-bottom:20px}
        .qz12-result-msg{font-size:15px;font-weight:600;margin-bottom:24px;line-height:1.6}
        .qz12-result-btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
        .qz12-btn{display:inline-flex;align-items:center;gap:8px;padding:12px 20px;border-radius:10px;font-size:13px;font-weight:700;border:none;cursor:pointer;transition:background .2s}
        .qz12-btn.primary{background:linear-gradient(120deg,#1d4ed8,#38bdf8);color:#fff}
        .qz12-btn.ghost{background:#f4f2f9;color:#4b4560;border:1px solid #e0dce8}
        .qz12-btn.ghost:hover{background:#e8e4f0}
        .qz12-foot{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-top:1px solid #e0dce8;background:#fff}
        .qz12-lock{font-size:12px;color:#726c86;font-weight:600}
      `}</style>

      <StepTracker current="quiz" progressPct={progressPct} label="NETWORKING · MODULE 01 · TOPIC 1.2" exitHref="/learn/modules/networking#module-1" />

      <div className="qz12-wrap">
        <div className="qz12-eyebrow">Quiz &middot; Topic 1.2</div>
        <h1 className="qz12-h1 disp">How Data Travels the Internet</h1>
        <p className="qz12-sub">Test what you learned about ISPs, fibre-optic cables, backbones, and the journey your data takes.</p>

        {!finished ? (
          <>
            <div className="qz12-progress">
              <div className="qz12-progress-bar"><i style={{ width: `${progressPct}%` }} /></div>
              <span className="qz12-progress-label">{answered}/{total}</span>
            </div>

            <div className="qz12-card">
              <div className="qz12-qn">Question {current + 1} of {total}</div>
              <div className="qz12-question">{q.q}</div>

              <div className="qz12-options">
                {q.options.map((opt, i) => {
                  const isAnswer = i === q.answer;
                  const isPicked = i === picked;
                  const cls = [
                    "qz12-opt",
                    picked !== null && isAnswer && "correct",
                    picked !== null && isPicked && !isAnswer && "wrong",
                    picked !== null && !isAnswer && !isPicked && "dimmed",
                  ].filter(Boolean).join(" ");
                  return (
                    <button key={opt} type="button" className={cls} disabled={picked !== null} onClick={() => choose(i)}>
                      <span className="qz12-opt-letter">{String.fromCharCode(65 + i)}</span>
                      {opt}
                      {picked !== null && isAnswer && <Icon name="ic-check" size={16} style={{ marginLeft: "auto", stroke: "#34d399", flex: "none" }} />}
                      {picked !== null && isPicked && !isAnswer && <Icon name="ic-x" size={16} style={{ marginLeft: "auto", stroke: "#f87171", flex: "none" }} />}
                    </button>
                  );
                })}
              </div>

              {picked !== null && (
                <>
                  <div className="qz12-explain">{q.explanation}</div>
                  <button type="button" className="qz12-next" onClick={next}>
                    {current < total - 1 ? "Next question" : "See results"}
                    <Icon name="ic-arrow" size={14} style={{ stroke: "#fff" }} />
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="qz12-card">
            <div className="qz12-result">
              <div className="qz12-score disp" style={{ color: passed ? "#059669" : "#dc2626" }}>
                {score}/{total}
              </div>
              <div className="qz12-score-sub">{passed ? "You passed!" : "Not quite there yet"}</div>
              <div className="qz12-result-msg">
                {passed
                  ? "You understand how data travels across the internet — from your device through ISPs and backbone cables to its destination. On to the next topic!"
                  : `You need at least ${PASS_THRESHOLD} correct answers to pass. Review the concept page and try again.`}
              </div>
              <div className="qz12-result-btns">
                {!passed && (
                  <button type="button" className="qz12-btn ghost" onClick={restart}>
                    <Icon name="ic-replay" size={14} style={{ stroke: "currentColor" }} />Try again
                  </button>
                )}
                {!passed && (
                  <Link href="/learn/modules/networking/1-2/concept" className="qz12-btn ghost">
                    <Icon name="ic-arrow-l" size={14} style={{ stroke: "currentColor" }} />Review concept
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="qz12-foot">
        <Link href="/learn/modules/networking/1-2/game" className="btn" style={{ padding: "9px 12px", background: "#f4f2f9", border: "1px solid #e0dce8", color: "#4b4560", fontSize: 11.5 }}>
          <Icon name="ic-arrow-l" size={13} style={{ stroke: "currentColor" }} />Back to Game
        </Link>
        {passed ? (
          <Link href="/learn/modules/networking/1-2/done" className="btn" style={{ padding: "10px 16px", background: "linear-gradient(120deg,#1d4ed8,#1739a8)", color: "#fff", fontSize: 12, fontWeight: 700, borderRadius: 10 }}>
            Continue to Completion<Icon name="ic-arrow" size={15} style={{ stroke: "#fff" }} />
          </Link>
        ) : (
          <span className="qz12-lock">Score {PASS_THRESHOLD}+ to unlock the next stage</span>
        )}
      </footer>
    </div>
  );
}
