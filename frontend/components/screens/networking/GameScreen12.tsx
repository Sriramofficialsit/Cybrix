"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { StepTracker } from "@/components/networking/StepTracker";
import { StageContinue } from "@/components/networking/StageContinue";

/*
  Topic 1-2 game: "Route the Packet"
  The player picks the correct next hop at each stage of a data packet's
  journey from Kevin's laptop to his client in London. Wrong hops lose a
  life; three wrong picks end the round.
*/

type HopChoice = { label: string; correct: boolean; feedback: string };
type Hop = {
  n: number;
  title: string;
  from: string;
  question: string;
  choices: HopChoice[];
};

const HOPS: Hop[] = [
  {
    n: 1,
    title: "Leaving the laptop",
    from: "Kevin's laptop",
    question: "Kevin presses Send. Where does the file go first?",
    choices: [
      { label: "Office Wi-Fi router", correct: true, feedback: "Correct! The file travels over Wi-Fi to the office router, the first hop." },
      { label: "Directly to the ISP", correct: false, feedback: "Not quite. Your device can't reach the ISP directly — it has to go through your local router first." },
      { label: "The internet backbone", correct: false, feedback: "The backbone is many hops away. Data starts at the local router." },
    ],
  },
  {
    n: 2,
    title: "Through the router",
    from: "Office router",
    question: "The router received the file. What does it connect to next?",
    choices: [
      { label: "The ISP's street cabinet", correct: true, feedback: "Right! The router forwards data through a cable to the ISP's local equipment." },
      { label: "Another Wi-Fi router", correct: false, feedback: "Routers don't chain through more Wi-Fi. The next hop is a wired connection to the ISP." },
      { label: "The client's device directly", correct: false, feedback: "The client is in another city — data must pass through several more hops first." },
    ],
  },
  {
    n: 3,
    title: "At the ISP",
    from: "ISP street cabinet",
    question: "Your ISP has the data. How does it travel to another city?",
    choices: [
      { label: "Via the internet backbone (fibre-optic trunk lines)", correct: true, feedback: "Exactly! High-capacity fibre-optic backbone cables connect cities and countries." },
      { label: "Through satellite", correct: false, feedback: "Satellites add too much latency. Most internet traffic travels through undersea and underground fibre cables." },
      { label: "Via Wi-Fi repeaters", correct: false, feedback: "Wi-Fi only covers short distances. Long-haul data travels through fibre-optic cables." },
    ],
  },
  {
    n: 4,
    title: "Crossing the backbone",
    from: "Backbone cable",
    question: "The data crossed hundreds of kilometres of fibre. Where does it arrive?",
    choices: [
      { label: "The destination ISP in London", correct: true, feedback: "Correct! The backbone hands data to the destination city's ISP." },
      { label: "Directly to the client's router", correct: false, feedback: "Backbone cables connect to ISPs, not directly to home/office routers." },
      { label: "A government data centre", correct: false, feedback: "Data doesn't route through government centres. It goes to the local ISP." },
    ],
  },
  {
    n: 5,
    title: "Last mile to London",
    from: "London ISP",
    question: "The London ISP has the file. Final hop — where does it go?",
    choices: [
      { label: "The client's router, then to their device", correct: true, feedback: "That's it! The ISP sends it to the client's router, which delivers it over Wi-Fi or cable." },
      { label: "Back to Kevin's ISP for confirmation", correct: false, feedback: "Data doesn't bounce back for delivery. The file goes straight to the client's local network." },
      { label: "To a London backbone node", correct: false, feedback: "We've already left the backbone. The last hop is the client's own local network." },
    ],
  },
];

const MAX_LIVES = 3;

export default function GameScreen12() {
  const [hop, setHop] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [done, setDone] = useState(false);
  const [shakeIdx, setShakeIdx] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cur = HOPS[hop];
  const gameOver = lives <= 0;
  const won = done && !gameOver;
  const progress = Math.round(((hop + (picked !== null ? 1 : 0)) / HOPS.length) * 100);

  const pick = useCallback(
    (idx: number) => {
      if (picked !== null || done || gameOver) return;
      const choice = cur.choices[idx];
      setPicked(idx);
      if (choice.correct) {
        setScore((s) => s + 1);
        setStreak((s) => {
          const next = s + 1;
          setBestStreak((b) => Math.max(b, next));
          return next;
        });
      } else {
        setStreak(0);
        setShakeIdx(idx);
        setLives((l) => l - 1);
      }
    },
    [picked, done, gameOver, cur],
  );

  useEffect(() => {
    if (picked === null) return;
    timerRef.current = setTimeout(() => {
      if (lives <= 0) {
        setDone(true);
        return;
      }
      if (hop >= HOPS.length - 1) {
        setDone(true);
        return;
      }
      if (cur.choices[picked].correct) {
        setHop((h) => h + 1);
      }
      setPicked(null);
      setShakeIdx(null);
    }, 1800);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [picked, hop, lives, cur]);

  const restart = () => {
    setHop(0);
    setLives(MAX_LIVES);
    setPicked(null);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setDone(false);
    setShakeIdx(null);
  };

  return (
    <div className="gm12">
      <style>{`
        .gm12{min-height:100vh;display:flex;flex-direction:column;background:#0b0715;color:#e7defb}
        .gm12 .disp{font-family:var(--font-display,inherit)}
        .gm12-bar{display:flex;align-items:center;gap:14px;padding:12px 20px;flex:none;background:linear-gradient(120deg,#170f2c,#241a4a);border-bottom:1px solid rgba(126,224,245,.16)}
        .gm12-bar-info{flex:1;min-width:0}
        .gm12-bar-kicker{font-size:10.5px;font-weight:700;letter-spacing:.6px;color:#7ee0f5}
        .gm12-bar-title{font-size:15px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .gm12-lives{display:flex;gap:4px}
        .gm12-heart{width:18px;height:18px;transition:transform .2s,opacity .2s}
        .gm12-heart.lost{opacity:.25;transform:scale(.85)}
        .gm12-main{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px 16px;gap:24px;max-width:640px;margin:0 auto;width:100%}
        .gm12-progress{width:100%;height:6px;border-radius:3px;background:rgba(255,255,255,.1);overflow:hidden}
        .gm12-progress i{display:block;height:100%;border-radius:3px;background:linear-gradient(90deg,#38bdf8,#a78bfa);transition:width .4s}
        .gm12-hop{text-align:center}
        .gm12-hop-n{font-size:11px;font-weight:700;letter-spacing:.5px;color:#a78bfa;text-transform:uppercase;margin-bottom:4px}
        .gm12-hop-title{font-size:22px;font-weight:800;color:#fff;margin-bottom:6px}
        .gm12-hop-from{font-size:12.5px;color:rgba(231,222,251,.55)}
        .gm12-question{font-size:16px;font-weight:600;color:#e7defb;text-align:center;line-height:1.5}
        .gm12-choices{display:flex;flex-direction:column;gap:10px;width:100%}
        .gm12-choice{position:relative;display:flex;align-items:center;gap:12px;padding:16px 18px;border-radius:14px;border:1.5px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#e7defb;font-size:14px;font-weight:600;cursor:pointer;text-align:left;transition:border-color .2s,background .2s,transform .15s}
        .gm12-choice:hover:not(:disabled){border-color:rgba(126,224,245,.35);background:rgba(126,224,245,.08)}
        .gm12-choice:disabled{cursor:default}
        .gm12-choice.correct{border-color:#34d399;background:rgba(52,211,153,.12);color:#34d399}
        .gm12-choice.wrong{border-color:#f87171;background:rgba(248,113,113,.1);color:#f87171}
        .gm12-choice.shake{animation:gm12shake .4s ease}
        @keyframes gm12shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
        .gm12-choice-letter{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;flex:none;border:1.5px solid rgba(255,255,255,.2);background:rgba(255,255,255,.05)}
        .gm12-choice.correct .gm12-choice-letter{border-color:#34d399;background:rgba(52,211,153,.2)}
        .gm12-choice.wrong .gm12-choice-letter{border-color:#f87171;background:rgba(248,113,113,.15)}
        .gm12-feedback{font-size:13px;color:rgba(231,222,251,.7);text-align:center;min-height:40px;line-height:1.5;padding:0 12px}
        .gm12-stats{display:flex;gap:24px;justify-content:center;font-size:12px;font-weight:700;letter-spacing:.3px;color:rgba(231,222,251,.55)}
        .gm12-stats b{color:#7ee0f5}
        .gm12-end{text-align:center;padding:32px 20px}
        .gm12-end-h{font-size:28px;font-weight:800;margin-bottom:8px}
        .gm12-end-sub{font-size:14px;color:rgba(231,222,251,.6);margin-bottom:24px;line-height:1.5}
        .gm12-end .gm12-stats{margin-bottom:28px}
        .gm12-end-btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
        .gm12-btn{display:inline-flex;align-items:center;gap:8px;padding:12px 20px;border-radius:10px;font-size:13px;font-weight:700;border:none;cursor:pointer;transition:background .2s}
        .gm12-btn.primary{background:linear-gradient(120deg,#1d4ed8,#38bdf8);color:#fff}
        .gm12-btn.ghost{background:rgba(255,255,255,.08);color:#e7defb;border:1px solid rgba(255,255,255,.16)}
        .gm12-btn.ghost:hover{background:rgba(255,255,255,.14)}
        .gm12-foot{display:flex;align-items:center;justify-content:space-between;padding:12px 20px;flex:none;border-top:1px solid rgba(126,224,245,.1)}
      `}</style>

      <div className="gm12-bar">
        <Link
          href="/learn/modules/networking/1-2/visualize"
          className="btn"
          style={{ padding: "9px 12px", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.16)", color: "#e7defb", fontSize: 11.5 }}
        >
          <Icon name="ic-arrow-l" size={13} style={{ stroke: "currentColor" }} />Back
        </Link>
        <div className="gm12-bar-info">
          <div className="gm12-bar-kicker mono">TOPIC 1.2 &middot; STEP 4 OF 6</div>
          <div className="gm12-bar-title disp">Game &middot; Route the Packet</div>
        </div>
        <div className="gm12-lives" aria-label={`${lives} lives remaining`}>
          {Array.from({ length: MAX_LIVES }, (_, i) => (
            <svg key={i} viewBox="0 0 24 24" className={`gm12-heart${i >= lives ? " lost" : ""}`}>
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill={i >= lives ? "#555" : "#f87171"} />
            </svg>
          ))}
        </div>
      </div>

      {!done && !gameOver ? (
        <div className="gm12-main">
          <div className="gm12-progress"><i style={{ width: `${progress}%` }} /></div>

          <div className="gm12-hop">
            <div className="gm12-hop-n mono">Hop {cur.n} of {HOPS.length}</div>
            <div className="gm12-hop-title disp">{cur.title}</div>
            <div className="gm12-hop-from">From: {cur.from}</div>
          </div>

          <div className="gm12-question">{cur.question}</div>

          <div className="gm12-choices">
            {cur.choices.map((c, i) => {
              const isCorrect = picked !== null && c.correct;
              const isWrong = picked === i && !c.correct;
              const cls = [
                "gm12-choice",
                isCorrect && "correct",
                isWrong && "wrong",
                shakeIdx === i && "shake",
              ].filter(Boolean).join(" ");
              return (
                <button key={c.label} type="button" className={cls} disabled={picked !== null} onClick={() => pick(i)}>
                  <span className="gm12-choice-letter">{String.fromCharCode(65 + i)}</span>
                  {c.label}
                </button>
              );
            })}
          </div>

          <div className="gm12-feedback" aria-live="polite">
            {picked !== null ? cur.choices[picked].feedback : ""}
          </div>

          <div className="gm12-stats">
            <span>Score: <b>{score}/{HOPS.length}</b></span>
            <span>Streak: <b>{streak}</b></span>
            <span>Lives: <b>{lives}/{MAX_LIVES}</b></span>
          </div>
        </div>
      ) : (
        <div className="gm12-main">
          <div className="gm12-end">
            <div className="gm12-end-h disp" style={{ color: won ? "#34d399" : "#f87171" }}>
              {won ? "Packet delivered!" : "Connection lost"}
            </div>
            <div className="gm12-end-sub">
              {won
                ? "You routed Kevin's file through all five hops, from his laptop in the office to the client's device in London."
                : "Too many wrong turns. The packet got lost in the network. Try again!"}
            </div>
            <div className="gm12-stats" style={{ marginBottom: 28 }}>
              <span>Score: <b>{score}/{HOPS.length}</b></span>
              <span>Best streak: <b>{bestStreak}</b></span>
              <span>Lives left: <b>{lives}/{MAX_LIVES}</b></span>
            </div>
            <div className="gm12-end-btns">
              <button type="button" className="gm12-btn ghost" onClick={restart}>
                <Icon name="ic-replay" size={14} style={{ stroke: "currentColor" }} />Play again
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="gm12-foot">
        <Link
          href="/learn/modules/networking/1-2/visualize"
          className="btn"
          style={{ padding: "9px 12px", background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.16)", color: "#e7defb", fontSize: 11.5 }}
        >
          <Icon name="ic-arrow-l" size={13} style={{ stroke: "currentColor" }} />Back to Visualization
        </Link>
        <StageContinue
          topicId="1-2"
          stage="game"
          href="/learn/modules/networking/1-2/quiz"
          style={{ padding: "10px 14px", background: "linear-gradient(120deg,#f2b84b,#fb9a5a)", color: "#1a1030", fontSize: 11.5 }}
        >
          Continue to Quiz<Icon name="ic-arrow" size={13} style={{ stroke: "currentColor" }} />
        </StageContinue>
      </footer>
    </div>
  );
}
