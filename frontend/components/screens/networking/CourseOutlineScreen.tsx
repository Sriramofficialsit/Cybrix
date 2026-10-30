"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import {
  LearnApiError,
  PROFILE_EVENT,
  STAGES,
  STAGE_LABELS,
  claimChest,
  fetchCourse,
  formatDuration,
  pad2,
  resetCourse,
  stageHref,
  topicHref,
  type LearnModule,
  type LearnProfile,
  type Snapshot,
} from "@/lib/learn";
import CampaignMap, { type CampaignMapHandle, type Spot, type TopicSpot } from "./CampaignMap";
import "./outline-modern.css";
import "./campaign-chrome.css";

// Classic engraved display face for the vintage game chrome

// The Networking course as a campaign map: one trail climbing from the
// gate through nine worlds (modules). Everything shown here (unlocks, XP,
// stars, streak) comes from /api/learn; the server decides every reward.

const STAGE_COLORS = ["#1fb5e0", "#2f8fd0", "#4a63b5", "#6157ae", "#7a52a8"]; // logo cyan -> violet

function companionLine(stage: number) {
  if (stage <= 0) return "Fresh level — tap to start the story.";
  if (stage < 3) return "Good signal so far — keep going.";
  if (stage < 5) return "Almost through — finish the level.";
  return "Level clear — on to the next one.";
}

function readModuleHash() {
  const m = /^#module-(\d+)$/.exec(window.location.hash);
  return m ? Number(m[1]) : null;
}

export default function CourseOutlineScreen() {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [loadError, setLoadError] = useState<LearnApiError | null>(null);
  const [selected, setSelected] = useState<TopicSpot | null>(null);
  const [shakeKey, setShakeKey] = useState<string | null>(null);
  const [toast, setToast] = useState({ msg: "", show: false });
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [focusWorld, setFocusWorld] = useState<number | null>(null);

  const mapRef = useRef<CampaignMapHandle>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const shakeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const claiming = useRef(false);
  const positioned = useRef(false);

  const load = useCallback(() => {
    setLoadError(null);
    fetchCourse()
      .then(setSnap)
      .catch((e) => setLoadError(e instanceof LearnApiError ? e : new LearnApiError(0, "Couldn't load your progress.")));
  }, []);

  useEffect(load, [load]);

  // Progress saved elsewhere (another tab, a lesson page) refreshes the map
  useEffect(() => {
    const onFocus = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", onFocus);
    return () => document.removeEventListener("visibilitychange", onFocus);
  }, [load]);

  // Keep the HUD in step with XP earned while this page is open
  useEffect(() => {
    const onProfile = (e: Event) => {
      const detail = (e as CustomEvent<LearnProfile>).detail;
      setSnap((s) => (s ? { ...s, profile: detail } : s));
    };
    window.addEventListener(PROFILE_EVENT, onProfile);
    return () => window.removeEventListener(PROFILE_EVENT, onProfile);
  }, []);

  const modules = useMemo(() => snap?.course.modules ?? [], [snap]);
  const allTopics = useMemo(() => modules.flatMap((m) => m.topics), [modules]);
  const current = snap?.course.current ?? null;
  const currentKey = current?.key ?? null;
  const completed = Boolean(snap?.course.completedAt);

  // First load: open at #module-N if linked, otherwise at the current level
  useEffect(() => {
    if (!snap || positioned.current) return;
    positioned.current = true;
    requestAnimationFrame(() => {
      const num = readModuleHash();
      if (num) {
        mapRef.current?.scrollToWorld(num, false);
        setFocusWorld(num);
      } else if (currentKey) {
        mapRef.current?.scrollToTopic(currentKey, false);
      } else {
        mapRef.current?.scrollToWorld(modules.length, false);
      }
    });
  }, [snap, currentKey, modules.length]);

  // #module-N links from elsewhere on the site jump to that world
  useEffect(() => {
    const onHash = () => {
      const num = readModuleHash();
      if (num) {
        mapRef.current?.scrollToWorld(num);
        setFocusWorld(num);
      }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const jumpToWorld = (num: number) => {
    history.replaceState(null, "", `#module-${num}`);
    setFocusWorld(num);
    mapRef.current?.scrollToWorld(num);
  };

  const showToast = useCallback((msg: string) => {
    setToast({ msg, show: true });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, show: false })), 2400);
  }, []);

  const shake = useCallback((key: string) => {
    setShakeKey(key);
    clearTimeout(shakeTimer.current);
    shakeTimer.current = setTimeout(() => setShakeKey(null), 400);
  }, []);

  async function onSelect(spot: Spot) {
    if (spot.kind === "topic") {
      setSelected(spot);
      return;
    }

    const c = spot.chest;
    if (c.opened) {
      showToast(`Chest already opened · +${c.xp} XP collected`);
      return;
    }
    if (!c.available) {
      shake(c.id);
      showToast(`Locked — clear Level ${spot.after.topic.key} to open this chest`);
      return;
    }
    if (claiming.current) return;
    claiming.current = true;
    try {
      const result = await claimChest(c.id);
      setSnap(result.snapshot);
      showToast(result.awarded.xp ? `+${result.awarded.xp} XP · reward chest opened` : "Chest already opened");
    } catch (e) {
      shake(c.id);
      showToast(e instanceof Error ? e.message : "Couldn't open the chest");
    } finally {
      claiming.current = false;
    }
  }

  async function restartCourse() {
    if (resetting) return;
    setResetting(true);
    try {
      const result = await resetCourse();
      setSnap(result.snapshot);
      setConfirmReset(false);
      mapRef.current?.scrollToWorld(1);
      showToast(result.removedXp ? `Course restarted · ${result.removedXp} XP removed` : "Course restarted");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Couldn't restart the course");
    } finally {
      setResetting(false);
    }
  }

  const profile = snap?.profile;
  const totals = snap?.course.totals;
  const xp = profile?.xp ?? 0;
  const level = profile?.level ?? 1;
  const levelPct = profile?.levelPct ?? 0;
  const rank = profile?.rank ?? "";
  const streak = profile?.streak ?? { current: 0, best: 0, activeToday: false };
  const resumeHref = current ? topicHref(current) : undefined;

  // Only offered once there's progress to wipe; asks before wiping it
  const hasProgress = allTopics.some((t) => t.stagesDone > 0);
  const restartControl = !hasProgress ? null : confirmReset ? (
    <div className="cm-confirm">
      <span>Restart the whole course? Your progress and its XP will be removed.</span>
      <button type="button" className="nm-ghost danger" onClick={restartCourse} disabled={resetting}>
        {resetting ? "Restarting…" : "Yes, restart"}
      </button>
      <button type="button" className="nm-ghost" onClick={() => setConfirmReset(false)} disabled={resetting}>Cancel</button>
    </div>
  ) : (
    <button type="button" className="nm-ghost" onClick={() => setConfirmReset(true)}>
      <Icon name="ic-replay" size={14} style={{ stroke: "currentColor" }} />Restart course
    </button>
  );

  const statePanel = (
    <div className="wm-state">
      {loadError ? (
        <>
          <Icon name={loadError.status === 401 ? "ic-lock" : "ic-bug"} size={28} />
          <div className="cm-state-title">
            {loadError.status === 401 ? "Sign in to enter the dungeon" : "Couldn't load your map"}
          </div>
          <p>
            {loadError.status === 401 ? "Your XP, stars and unlocked worlds are saved to your account." : loadError.message}
          </p>
          {loadError.status === 401 ? (
            <Link href="/login" className="btn wm-play" style={{ animation: "none" }}>Sign in</Link>
          ) : (
            <button type="button" className="btn wm-play" style={{ animation: "none" }} onClick={load}>Try again</button>
          )}
        </>
      ) : (
        <>
          <span className="wm-spinner" aria-hidden="true" />
          <div className="cm-state-title">Unrolling your map…</div>
        </>
      )}
    </div>
  );

  return (
    <div data-screen className="om cm-page">
      {/* title panel: the dark navy band from the Concept page */}
      <header className="cm-board">
        <nav className="cm-crumbs" aria-label="Breadcrumb">
          <Link href="/learn">Learn</Link>
          <Icon name="ic-chevron" size={12} />
          <span>Networking</span>
        </nav>
        <h1 className="disp">Networking <span className="grad">Fundamentals</span></h1>
        <p className="cm-board-sub">
          From what a network is to defending one. Every level unlocks the next, and each module ends with a hands-on challenge.
        </p>
        <ul className="cm-board-meta">
          <li><Icon name="ic-layers" size={15} />{snap ? modules.length : 9} modules</li>
          {snap && <li><Icon name="ic-list" size={15} />{allTopics.length} levels</li>}
          {snap && <li><Icon name="ic-clock" size={15} />~{formatDuration(totals?.minutes ?? 0)}</li>}
        </ul>
        <div className="cm-board-row">
          <span className="cm-scroll-tag">
            <Icon name="ic-flame" size={14} />
            {streak.current > 0
              ? <><b>{streak.current}-day streak</b> · {streak.activeToday ? "kept today" : "clear a stage today to keep it"}</>
              : <>Clear a stage today to start a streak</>}
          </span>
          {restartControl}
        </div>
      </header>

      {!snap ? statePanel : (
        <>
          {/* HUD */}
          <div className="wm-hud">
            <div className="wm-player">
              <span className="wm-avatar" style={{ "--p": `${levelPct}%` } as CSSProperties}>
                <img src="/bird-mascot.jpg" alt="" />
                <span className="wm-lv mono">LV {level}</span>
              </span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="wm-rank disp">{rank}</div>
                <div className="wm-xpbar"><span style={{ width: `${levelPct}%` }} /></div>
                <div className="wm-xptext">{profile?.levelXp ?? 0} / {profile?.levelGoal ?? 250} XP to LV {level + 1} · {xp} XP total</div>
              </div>
            </div>
            <div className="wm-stats">
              <div className="wm-stat"><Icon name="ic-flag" size={18} /><span><b>{totals?.worldsCleared ?? 0}/{modules.length}</b><small>Worlds</small></span></div>
              <div className="wm-stat"><Icon name="ic-star" size={18} /><span><b>{totals?.stars ?? 0}/{totals?.starsMax ?? modules.length * 3}</b><small>Stars</small></span></div>
              <div className="wm-stat"><Icon name="ic-target" size={18} /><span><b>{totals?.done ?? 0}/{allTopics.length}</b><small>Levels</small></span></div>
              <div className="wm-stat"><Icon name="ic-chest" size={18} /><span><b>{totals?.chestsOpened ?? 0}/{totals?.chests ?? 0}</b><small>Chests</small></span></div>
            </div>
            {resumeHref ? (
              <Link href={resumeHref} className="btn wm-play"><Icon name="ic-play" size={15} />Play {currentKey}</Link>
            ) : completed ? (
              <span className="btn wm-play" style={{ animation: "none", cursor: "default" }}><Icon name="ic-award" size={15} />Course complete</span>
            ) : null}
          </div>

          {/* world strip: jump anywhere on the map */}
          <nav className="cm-strip" aria-label="Worlds">
            {modules.map((m) => (
              <button
                key={m.num}
                type="button"
                data-state={m.state}
                aria-current={focusWorld === m.num ? "true" : undefined}
                onClick={() => jumpToWorld(m.num)}
                title={m.title}
              >
                <i>{m.state === "done" ? <Icon name="ic-check" size={12} style={{ stroke: "#fff", strokeWidth: 3 }} /> : m.state === "locked" ? <Icon name="ic-lock" size={11} style={{ stroke: "#fff" }} /> : m.num}</i>
                {m.title}
              </button>
            ))}
            {currentKey && (
              <button type="button" className="cm-findme" onClick={() => { setFocusWorld(null); mapRef.current?.scrollToTopic(currentKey); }}>
                <i><Icon name="ic-pin" size={12} style={{ stroke: "#fff" }} /></i>Find me
              </button>
            )}
          </nav>

          <CampaignMap
            ref={mapRef}
            modules={modules}
            currentKey={currentKey}
            completed={completed}
            shakeKey={shakeKey}
            companion={companionLine(current?.stagesDone ?? 0)}
            onSelect={onSelect}
          />
        </>
      )}

      {selected && snap && (
        <LevelInfo
          spot={selected}
          modules={modules}
          onClose={() => setSelected(null)}
        />
      )}

      <div className={`qp-toast${toast.show ? " show" : ""}`} role="status" aria-live="polite">
        <Icon name="ic-gem" size={15} style={{ stroke: "none", fill: "#a8790f" }} />
        <span>{toast.msg}</span>
      </div>
    </div>
  );
}

// ---------- level info card (opens on a level node) ----------

function LevelInfo({ spot, modules, onClose }: { spot: TopicSpot; modules: LearnModule[]; onClose: () => void }) {
  // Read the latest state of this topic (the snapshot may have refreshed)
  const module = modules.find((m) => m.num === spot.module.num) || spot.module;
  const t = module.topics.find((x) => x.id === spot.topic.id) || spot.topic;
  const order = modules.flatMap((m) => m.topics);
  const prev = order[order.findIndex((x) => x.id === t.id) - 1];
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const locked = t.status === "locked";
  const done = t.status === "done";

  return (
    <div className="cm-info-backdrop" onClick={onClose}>
      <div
        className="cm-info"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cm-info-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cm-info-head">
          <span className="cm-world-no mono">WORLD {pad2(module.num)} · LEVEL {t.key}</span>
          <h2 id="cm-info-title" className="disp">{t.title}</h2>
          <button ref={closeRef} type="button" className="cm-info-close" onClick={onClose} aria-label="Close"><Icon name="ic-x" size={16} /></button>
        </div>
        <div className="cm-info-body">
          <p>{t.desc}</p>
          <div className="cm-chips">
            <span><Icon name="ic-clock" size={12} />{t.min[0]}–{t.min[1]} min</span>
            <span className="xp"><Icon name="ic-gem" size={12} />+{t.xp} XP</span>
            {t.capstone && <span className="boss"><Icon name="ic-crown" size={12} />Boss level</span>}
            <span>{done ? "Complete" : locked ? "Locked" : `Stage ${Math.min(t.stagesDone + 1, 5)} of 5`}</span>
          </div>

          {/* the five stages of every level; finished ones can be replayed */}
          <div className="cm-stages">
            {STAGES.map((stage, i) => {
              const stageDone = done || i < t.stagesDone;
              const isNext = !done && !locked && i === t.stagesDone;
              const style = { "--c": STAGE_COLORS[i] } as CSSProperties;
              const inner = <><i />{STAGE_LABELS[stage]}</>;
              return stageDone ? (
                <Link key={stage} href={stageHref(t, stage)} className="cm-stage" data-done="1" style={style} title={`Replay ${STAGE_LABELS[stage]}`}>{inner}</Link>
              ) : (
                <span key={stage} className="cm-stage" data-next={isNext ? "1" : undefined} style={style}>{inner}</span>
              );
            })}
          </div>

          {locked ? (
            <div className="cm-locked-note">
              <Icon name="ic-lock" size={16} />
              Clear {prev ? <b>Level {prev.key}: {prev.title}</b> : "the previous level"} to unlock this one.
            </div>
          ) : (
            <div className="cm-info-cta">
              {done ? (
                <Link href={stageHref(t, "story")} className="btn btn-g"><Icon name="ic-replay" size={14} />Replay level</Link>
              ) : (
                <Link href={topicHref(t)} className="btn cm-play">
                  <Icon name="ic-play" size={14} style={{ stroke: "#fff" }} />
                  {t.stagesDone ? `Continue · ${STAGE_LABELS[STAGES[t.stagesDone]]}` : "Play"}
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
