"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { StepTracker } from "@/components/networking/StepTracker";
import {
  LearnApiError,
  completeStage,
  fetchCourse,
  findTopic,
  moduleHref,
  pad2,
  stageHref,
  topicHref,
  type LearnModule,
  type LearnTopic,
  type StageResult,
} from "@/lib/learn";

const CONFETTI = [
  { left: "8%", w: 8, h: 14, bg: "#ffe27a", dur: "2.6s", delay: ".1s" },
  { left: "20%", w: 7, h: 12, bg: "#7ee0a8", dur: "3.1s", delay: ".5s" },
  { left: "34%", w: 9, h: 15, bg: "#ffffff", dur: "2.8s", delay: ".2s" },
  { left: "48%", w: 8, h: 13, bg: "#f5a3c7", dur: "3.4s", delay: ".8s" },
  { left: "61%", w: 7, h: 12, bg: "#ffe27a", dur: "2.9s", delay: ".35s" },
  { left: "74%", w: 9, h: 15, bg: "#a9c1f7", dur: "3.2s", delay: ".6s" },
  { left: "87%", w: 8, h: 13, bg: "#7ee0a8", dur: "2.7s", delay: ".15s" },
  { left: "94%", w: 7, h: 12, bg: "#ffffff", dur: "3.05s", delay: ".45s" },
];

type Blocked = { message: string; href: string; cta: string };

// The last stage of a topic: records it on the server, then celebrates
// what was earned and points at the next topic (into the next world when
// this one is cleared).
export default function CompletionScreen({ topicId }: { topicId: string }) {
  const router = useRouter();
  const [result, setResult] = useState<StageResult | null>(null);
  const [blocked, setBlocked] = useState<Blocked | null>(null);
  const started = useRef(false);

  useEffect(() => {
    // StrictMode runs effects twice in development; save only once
    if (started.current) return;
    started.current = true;

    completeStage(topicId, "done")
      .then(setResult)
      .catch(async (e) => {
        if (e instanceof LearnApiError && e.status === 401) {
          router.replace("/login");
          return;
        }
        // Earlier stages still open, or the topic is locked: point the way
        let href = "/learn/modules/networking";
        let cta = "Back to the world map";
        try {
          const snap = await fetchCourse();
          const found = findTopic(snap.course, topicId);
          if (found && found.topic.status === "current") {
            href = topicHref(found.topic);
            cta = "Go to the next stage";
          }
        } catch {
          // keep the map link
        }
        setBlocked({ message: e instanceof Error ? e.message : "Couldn't save your progress.", href, cta });
      });
  }, [topicId, router]);

  const found = result ? findTopic(result.snapshot.course, topicId) : null;
  const topic: LearnTopic | undefined = found?.topic;
  const mod: LearnModule | undefined = found?.module;
  const profile = result?.snapshot.profile;
  const firstTime = Boolean(result && result.completed.topic);
  const earned = firstTime ? result!.awarded.xp : topic?.xp ?? 0;

  // Next topic: from this completion, or the learner's current topic on a replay
  const course = result?.snapshot.course;
  const next = result?.next
    ? findTopic(course!, result.next.id)
    : course?.current
      ? findTopic(course, course.current.id)
      : null;
  const newWorld = Boolean(next && mod && next.module.num !== mod.num);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <StepTracker
        current="done"
        progressPct={100}
        xp={topic?.xp ?? 40}
        label={topic && mod ? `NETWORKING · MODULE ${pad2(mod.num)} · TOPIC ${topic.key}` : "NETWORKING"}
        exitHref={mod ? moduleHref(mod.num) : "/learn/modules/networking"}
      />

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "44px 24px", position: "relative", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute", width: 640, height: 640, borderRadius: "50%",
            background: "radial-gradient(circle,#1d4ed8,transparent 70%)", opacity: 0.28, filter: "blur(100px)",
            animation: "glowpulse 5s ease-in-out infinite",
          }}
        />

        <div
          style={{
            position: "relative", width: "100%", maxWidth: 720, borderRadius: 28, overflow: "hidden",
            background: "linear-gradient(150deg,#12224f,#1d4ed8 55%,#38bdf8)", padding: "56px 52px", textAlign: "center",
            boxShadow: "0 44px 90px -30px rgba(20,40,100,.4)",
          }}
          className="cs-card"
        >
          <div style={{ position: "absolute", inset: 0, opacity: 0.35, backgroundImage: "radial-gradient(circle,rgba(255,255,255,.5) 1px,transparent 1.2px)", backgroundSize: "22px 22px" }} />

          {!result && !blocked && (
            <div style={{ position: "relative", padding: "40px 0", color: "#dbe6ff", fontWeight: 600 }}>Saving your progress…</div>
          )}

          {blocked && (
            <div style={{ position: "relative", padding: "20px 0" }}>
              <Icon name="ic-lock" size={30} style={{ stroke: "#fff" }} />
              <h1 className="disp" style={{ fontSize: 26, fontWeight: 600, color: "#fff", marginTop: 12 }}>Not quite there yet</h1>
              <p style={{ fontSize: 15, color: "#dbe6ff", marginTop: 10 }}>{blocked.message}</p>
              <Link href={blocked.href} className="btn" style={{ background: "#fff", color: "#12224f", marginTop: 22 }}>
                {blocked.cta}<Icon name="ic-arrow" size={15} style={{ stroke: "#12224f" }} />
              </Link>
            </div>
          )}

          {result && topic && mod && profile && (
            <>
              {firstTime && (
                <div aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
                  {CONFETTI.map((c, i) => (
                    <i key={i} style={{ position: "absolute", left: c.left, top: 0, width: c.w, height: c.h, background: c.bg, borderRadius: 2, animation: `confetti ${c.dur} ease-in ${c.delay} infinite` }} />
                  ))}
                </div>
              )}

              <div style={{ position: "relative" }}>
                <div style={{ position: "relative", width: 92, height: 92, margin: "0 auto", animation: "popin .5s cubic-bezier(.2,.8,.3,1.2) both" }}>
                  <img
                    src="/bird-head.jpg"
                    alt="CyberThulir mascot celebrating"
                    className="float"
                    style={{
                      width: 92, height: 92, borderRadius: "50%", objectFit: "cover", display: "block",
                      border: "4px solid rgba(255,255,255,.92)", background: "#fff",
                      boxShadow: "0 0 0 8px rgba(255,255,255,.1), 0 18px 34px -12px rgba(8,15,40,.55)",
                    }}
                  />
                  <span
                    style={{
                      position: "absolute", right: -2, bottom: -2, width: 30, height: 30, borderRadius: "50%",
                      background: "#2dd4a7", display: "flex", alignItems: "center", justifyContent: "center",
                      border: "3px solid #12224f", boxShadow: "0 4px 10px -2px rgba(0,0,0,.4)",
                    }}
                  >
                    <Icon name="ic-check" size={14} style={{ stroke: "#fff", strokeWidth: 3 }} />
                  </span>
                </div>
                <div className="mono" style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: ".6px", textTransform: "uppercase", color: "#bcd4ff", marginTop: 20 }}>
                  {topic.capstone ? "Capstone" : "Topic"} {topic.key} {firstTime ? "complete" : "· already completed"}
                </div>
                <h1 className="disp" style={{ fontSize: 32, fontWeight: 600, color: "#fff", marginTop: 8, letterSpacing: "-.3px" }}>{topic.title}</h1>
                <p style={{ fontSize: 15, color: "#dbe6ff", marginTop: 14, maxWidth: 460, marginLeft: "auto", marginRight: "auto", lineHeight: 1.6 }}>
                  {topic.desc}
                </p>

                {/* big moments: course, world, level */}
                {(result.completed.course || result.completed.module || result.levelUp) && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 22 }}>
                    {result.completed.course && (
                      <div className="cs-banner" style={{ background: "linear-gradient(120deg,#f2b84b,#fb7185)", color: "#1a1030" }}>
                        <Icon name="ic-crown" size={18} style={{ stroke: "#1a1030" }} />Course complete. You cleared all {course!.totals.worlds} worlds.
                      </div>
                    )}
                    {result.completed.module && (
                      <div className="cs-banner" style={{ background: "rgba(255,255,255,.16)", color: "#fff" }}>
                        <Icon name="ic-flag" size={18} style={{ stroke: "#ffe27a" }} />
                        World {pad2(result.completed.module)} cleared · {"★".repeat(mod.stars)}{"☆".repeat(3 - mod.stars)}
                      </div>
                    )}
                    {result.levelUp && (
                      <div className="cs-banner" style={{ background: "rgba(255,255,255,.16)", color: "#fff" }}>
                        <Icon name="ic-star" size={18} style={{ stroke: "#ffe27a", fill: "#ffe27a" }} />
                        Level up! LV {result.levelUp.level}{result.levelUp.newRank ? ` · New rank: ${result.levelUp.rank}` : ""}
                      </div>
                    )}
                  </div>
                )}

                <div className="cs-stats" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginTop: 26 }}>
                  <div className="cs-stat">
                    <Icon name="ic-gem" size={20} style={{ stroke: "none", fill: "#fff" }} />
                    <div className="disp cs-stat-v">+{earned}</div>
                    <div className="cs-stat-l">{firstTime ? "XP earned" : "topic XP"}</div>
                  </div>
                  <div className="cs-stat">
                    <Icon name="ic-flame" size={20} style={{ stroke: "none", fill: "#ffb648", animation: "floaty 3.4s ease-in-out infinite" }} />
                    <div className="disp cs-stat-v">{profile.streak.current}-day</div>
                    <div className="cs-stat-l">streak{profile.streak.activeToday ? " kept" : ""}</div>
                  </div>
                  <div className="cs-stat">
                    <Icon name={mod.icon} size={20} style={{ stroke: "#fff" }} />
                    <div className="disp cs-stat-v">{mod.done} / {mod.total}</div>
                    <div className="cs-stat-l">world {pad2(mod.num)} topics</div>
                  </div>
                </div>

                {firstTime && result.awarded.items.length > 1 && (
                  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 14 }}>
                    {result.awarded.items.map((it) => (
                      <span key={it.label} className="mono" style={{ fontSize: 11, fontWeight: 700, color: "#dbe6ff", background: "rgba(8,13,28,.25)", borderRadius: 999, padding: "5px 10px" }}>
                        {it.label} +{it.xp}
                      </span>
                    ))}
                  </div>
                )}

                {/* level progress */}
                <div style={{ marginTop: 22, textAlign: "left" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, fontWeight: 700, color: "#dbe6ff" }}>
                    <span>LV {profile.level} · {profile.rank}</span>
                    <span className="mono">{profile.xp} XP</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 6, background: "rgba(8,13,28,.3)", marginTop: 7, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${profile.levelPct}%`, borderRadius: 6, background: "linear-gradient(90deg,#ffe27a,#fff)", transition: "width .6s" }} />
                  </div>
                  <div style={{ fontSize: 11, color: "#bcd4ff", marginTop: 5 }}>
                    {profile.levelGoal - profile.levelXp} XP to LV {profile.level + 1}
                    {profile.nextRank ? ` · ${profile.nextRank.title} at LV ${profile.nextRank.level}` : ""}
                  </div>
                </div>

                {next && (
                  <div style={{ marginTop: 24, background: "rgba(8,13,28,.28)", border: "1px solid rgba(255,255,255,.16)", borderRadius: 16, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, textAlign: "left" }}>
                    <span style={{ width: 38, height: 38, borderRadius: 11, background: "rgba(255,255,255,.16)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                      <Icon name={next.topic.icon} size={18} style={{ stroke: "#fff" }} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 9.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".3px", color: "#bcd4ff" }}>
                        {newWorld ? `New world unlocked · World ${pad2(next.module.num)}` : `Up next · Topic ${next.topic.key}`}
                      </div>
                      <div className="disp" style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginTop: 2 }}>
                        {newWorld ? `${next.module.title}: ${next.topic.title}` : next.topic.title}
                      </div>
                    </div>
                    <span style={{ fontSize: 11, color: "#bcd4ff", fontWeight: 600, whiteSpace: "nowrap" }}>{next.topic.min[0]}–{next.topic.min[1]} min</span>
                  </div>
                )}

                <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 26, flexWrap: "wrap" }}>
                  {next ? (
                    <Link href={stageHref(next.topic, next.topic.nextStage ?? "story")} className="btn" style={{ background: "#fff", color: "#12224f" }}>
                      {newWorld ? `Enter World ${pad2(next.module.num)}` : `Start Topic ${next.topic.key}`}
                      <Icon name="ic-arrow" size={15} style={{ stroke: "#12224f" }} />
                    </Link>
                  ) : null}
                  <Link
                    href={newWorld && next ? moduleHref(next.module.num) : moduleHref(mod.num)}
                    className="btn"
                    style={next ? { background: "rgba(255,255,255,.12)", color: "#fff", border: "1px solid rgba(255,255,255,.28)" } : { background: "#fff", color: "#12224f" }}
                  >
                    {newWorld ? "See the new world" : "Back to the trail"}
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .cs-banner { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 14px; border-radius: 12px; font-size: 13.5px; font-weight: 700; animation: popin .5s cubic-bezier(.2,.8,.3,1.2) both; }
        .cs-stat { background: rgba(255,255,255,.14); backdrop-filter: blur(6px); border-radius: 16px; padding: 18px 10px; border: 1px solid rgba(255,255,255,.18); }
        .cs-stat-v { font-size: 22px; font-weight: 700; color: #fff; margin-top: 8px; }
        .cs-stat-l { font-size: 10.5px; color: #bcd4ff; margin-top: 2px; }
        @media (max-width: 560px) { .cs-card { padding: 40px 20px !important; } .cs-stats { grid-template-columns: 1fr !important; } }
        @keyframes confetti { 0% { transform: translateY(-40px) rotate(0deg); opacity: 0; } 10% { opacity: 1; } 100% { transform: translateY(460px) rotate(320deg); opacity: 0; } }
        @keyframes popin { 0% { opacity: 0; transform: scale(.75); } 70% { transform: scale(1.06); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes floaty { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes glowpulse { 0%, 100% { opacity: .35; } 50% { opacity: .6; } }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
      ` }} />
    </div>
  );
}
