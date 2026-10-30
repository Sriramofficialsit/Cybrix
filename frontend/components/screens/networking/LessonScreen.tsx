"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/Icon";
import { StepTracker } from "@/components/networking/StepTracker";
import { StageContinue } from "@/components/networking/StageContinue";
import CompletionScreen from "@/components/screens/networking/CompletionScreen";
import {
  LearnApiError,
  STAGES,
  STAGE_LABELS,
  fetchCourse,
  findTopic,
  moduleHref,
  pad2,
  stageHref,
  topicHref,
  type LearnModule,
  type LearnTopic,
  type Stage,
} from "@/lib/learn";

// The lesson player for topics that don't have purpose-built lesson pages
// yet. It runs the same five stages and saves progress the same way, so
// the whole path can be completed today; a topic's interactive content
// can replace a stage here later without touching progress tracking.

const STAGE_COPY: Record<Exclude<Stage, "done">, { icon: string; eyebrow: string; prompt: string }> = {
  story: { icon: "ic-book", eyebrow: "Story", prompt: "Read the scenario and picture where this shows up in real life." },
  concept: { icon: "ic-grid", eyebrow: "Concept", prompt: "Take in the key idea. Try explaining it in one sentence before you move on." },
  visualize: { icon: "ic-eye", eyebrow: "Visualize", prompt: "Sketch how the pieces connect: which device talks to which, and in what order." },
  game: { icon: "ic-fp", eyebrow: "Game", prompt: "Test yourself: could you spot this in a network you use every day?" },
};

type State =
  | { kind: "loading" }
  | { kind: "error"; message: string; signIn?: boolean }
  | { kind: "ready"; topic: LearnTopic; module: LearnModule };

export default function LessonScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const topicId = params.get("topic") || "";
  const stageParam = params.get("stage") || "story";
  const stage = (STAGES as readonly string[]).includes(stageParam) ? (stageParam as Stage) : "story";
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    if (stage === "done") return;
    let cancelled = false;
    setState({ kind: "loading" });
    fetchCourse()
      .then((snap) => {
        if (cancelled) return;
        const found = findTopic(snap.course, topicId);
        if (!found) {
          setState({ kind: "error", message: "That topic doesn't exist." });
          return;
        }
        // Topics with their own lesson pages always use them
        if (found.topic.lesson) {
          router.replace(stageHref(found.topic, stage));
          return;
        }
        setState({ kind: "ready", topic: found.topic, module: found.module });
      })
      .catch((e) => {
        if (cancelled) return;
        const signIn = e instanceof LearnApiError && e.status === 401;
        setState({ kind: "error", message: e instanceof Error ? e.message : "Couldn't load this lesson.", signIn });
      });
    return () => {
      cancelled = true;
    };
  }, [topicId, stage, router]);

  if (stage === "done") {
    return <CompletionScreen topicId={topicId} />;
  }

  if (state.kind !== "ready") {
    return (
      <div className="ls-center">
        {state.kind === "loading" ? (
          <span className="wm-spinner" aria-label="Loading" />
        ) : (
          <div className="ls-panel">
            <Icon name={state.signIn ? "ic-lock" : "ic-bug"} size={26} style={{ stroke: "#1d4ed8" }} />
            <p style={{ fontSize: 15, fontWeight: 600, marginTop: 10 }}>{state.message}</p>
            <Link href={state.signIn ? "/login" : "/learn/modules/networking"} className="btn" style={{ marginTop: 16, background: "linear-gradient(120deg,#1d4ed8,#1739a8)", color: "#fff" }}>
              {state.signIn ? "Sign in" : "Back to the world map"}
            </Link>
          </div>
        )}
        <LessonStyles />
      </div>
    );
  }

  const { topic, module } = state;
  const stageIdx = STAGES.indexOf(stage);
  const label = `NETWORKING · MODULE ${pad2(module.num)} · TOPIC ${topic.key}`;

  // Locked topic, or a stage further ahead than the learner has reached
  const locked = topic.status === "locked";
  const ahead = topic.status === "current" && stageIdx > topic.stagesDone;

  if (locked || ahead) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <StepTracker current={topic.nextStage ?? "story"} progressPct={(topic.stagesDone / 5) * 100} xp={topic.xp} label={label} exitHref={moduleHref(module.num)} />
        <div className="ls-center">
          <div className="ls-panel">
            <Icon name="ic-lock" size={26} style={{ stroke: "#1d4ed8" }} />
            <p style={{ fontSize: 15, fontWeight: 600, marginTop: 10 }}>
              {locked ? "This topic is still locked. Finish the topic before it first." : `Finish the ${STAGE_LABELS[topic.nextStage ?? "story"]} stage first.`}
            </p>
            <Link href={locked ? moduleHref(module.num) : topicHref(topic)} className="btn" style={{ marginTop: 16, background: "linear-gradient(120deg,#1d4ed8,#1739a8)", color: "#fff" }}>
              {locked ? "Back to the trail" : "Go there"}
            </Link>
          </div>
        </div>
        <LessonStyles />
      </div>
    );
  }

  const copy = STAGE_COPY[stage as Exclude<Stage, "done">];
  const nextStage = STAGES[stageIdx + 1];
  const prevStage = stageIdx > 0 ? STAGES[stageIdx - 1] : null;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <StepTracker current={stage} progressPct={(stageIdx / 5) * 100} xp={topic.xp} label={label} exitHref={moduleHref(module.num)} />

      <div className="ls-center">
        <div className="ls-card" style={{ ["--a1" as string]: module.accent[0], ["--a2" as string]: module.accent[1] }}>
          <div className="ls-head">
            <span className="ls-icon"><Icon name={topic.icon} size={26} style={{ stroke: "#fff" }} /></span>
            <div>
              <div className="mono ls-eyebrow">{copy.eyebrow.toUpperCase()} · STAGE {stageIdx + 1} OF 5</div>
              <h1 className="disp ls-title">{topic.title}</h1>
            </div>
          </div>

          <p className="ls-desc">{topic.desc}</p>

          <div className="ls-prompt">
            <Icon name={copy.icon} size={18} style={{ stroke: "var(--a1)" }} />
            <span>{copy.prompt}</span>
          </div>

          <div className="ls-note">
            <Icon name="ic-flask" size={15} style={{ stroke: "#a8790f" }} />
            The interactive {copy.eyebrow.toLowerCase()} for this topic is in production. Completing the stage still earns XP and unlocks the next one.
          </div>

          <div className="ls-foot">
            {prevStage ? (
              <Link href={stageHref(topic, prevStage)} className="btn btn-g">Back</Link>
            ) : (
              <Link href={moduleHref(module.num)} className="btn btn-g">Trail</Link>
            )}
            <StageContinue
              topicId={topic.id}
              stage={stage}
              href={stageHref(topic, nextStage)}
              style={{ background: "linear-gradient(120deg,#1d4ed8,#1739a8)", color: "#fff" }}
            >
              {nextStage === "done" ? "Finish topic" : `Continue to ${STAGE_LABELS[nextStage]}`}
              <Icon name="ic-arrow" size={15} style={{ stroke: "#fff" }} />
            </StageContinue>
          </div>
        </div>
      </div>
      <LessonStyles />
    </div>
  );
}

function LessonStyles() {
  return (
    <style dangerouslySetInnerHTML={{ __html: `
      .ls-center { flex: 1; min-height: 60vh; display: flex; align-items: center; justify-content: center; padding: 40px 20px; }
      .ls-panel { text-align: center; max-width: 420px; padding: 30px; border-radius: 20px; background: #fff; border: 1px solid #ece9f4; box-shadow: 0 20px 40px -26px rgba(70,40,120,.3); }
      .ls-card { position: relative; width: 100%; max-width: 680px; border-radius: 24px; padding: 34px 34px 26px; overflow: hidden;
        background: #fff; border: 1px solid #ece9f4; box-shadow: 0 30px 60px -34px rgba(30,40,90,.35); }
      .ls-card::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 5px; background: linear-gradient(90deg, var(--a1), var(--a2)); }
      .ls-head { display: flex; align-items: center; gap: 16px; }
      .ls-icon { flex: none; width: 56px; height: 56px; border-radius: 16px; display: grid; place-items: center; background: linear-gradient(135deg, var(--a1), var(--a2)); box-shadow: 0 12px 22px -12px var(--a1); }
      .ls-eyebrow { font-size: 11px; font-weight: 700; letter-spacing: .6px; color: var(--a1); }
      .ls-title { font-size: 26px; font-weight: 600; color: #150f23; margin-top: 4px; line-height: 1.2; }
      .ls-desc { font-size: 16px; line-height: 1.65; color: #4b4560; margin-top: 20px; }
      .ls-prompt { display: flex; gap: 10px; align-items: flex-start; margin-top: 18px; padding: 14px 16px; border-radius: 14px; font-size: 14px; font-weight: 600; color: #1f1633;
        background: color-mix(in srgb, var(--a1) 7%, #fff); border: 1px solid color-mix(in srgb, var(--a1) 20%, #fff); }
      .ls-note { display: flex; gap: 8px; align-items: flex-start; margin-top: 14px; font-size: 12.5px; line-height: 1.5; color: #8a6a1c; }
      .ls-foot { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-top: 26px; padding-top: 18px; border-top: 1px solid #f0edf6; }
      @media (max-width: 560px) { .ls-card { padding: 26px 20px 20px; } .ls-title { font-size: 21px; } }
    ` }} />
  );
}
