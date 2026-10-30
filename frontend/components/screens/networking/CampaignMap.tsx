"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Icon } from "@/components/Icon";
import { pad2, type LearnChest, type LearnModule, type LearnTopic } from "@/lib/learn";
import "./campaign.css";

// The whole course as one painted picture (public/flow.png, 1024 x 1536):
// a path winding down a hillside past nine numbered signs, one per module.
// Each sign is the module's button: a small badge shows its progress, and
// clicking it lists the module's levels. The module tabs and "Find me"
// scroll the picture to the matching sign.

type Pt = { x: number; y: number }; // x: 0..100 (% of width), y: map units from top

export type TopicSpot = { kind: "topic"; topic: LearnTopic; module: LearnModule; index: number } & Pt;
export type ChestSpot = { kind: "chest"; chest: LearnChest; module: LearnModule; after: TopicSpot } & Pt;
export type Spot = TopicSpot | ChestSpot;

export type CampaignMapHandle = {
  scrollToTopic: (key: string, smooth?: boolean) => void;
  scrollToWorld: (num: number, smooth?: boolean) => void;
};

type Props = {
  modules: LearnModule[];
  currentKey: string | null;
  completed: boolean;
  shakeKey: string | null;
  companion: string;
  onSelect: (spot: Spot) => void;
};

// Each module's numbered sign in the picture, in image pixels: left, top, right, bottom
const ART_W = 1024;
const ART_H = 1536;
const SIGNS: Record<number, [number, number, number, number]> = {
  1: [380, 130, 578, 182],
  2: [545, 298, 760, 350],
  3: [166, 408, 410, 460],
  4: [587, 515, 812, 567],
  5: [188, 638, 412, 690],
  6: [665, 757, 912, 809],
  7: [172, 864, 440, 916],
  8: [643, 1003, 902, 1055],
  9: [370, 1175, 640, 1227],
};

const CampaignMap = forwardRef<CampaignMapHandle, Props>(function CampaignMap({ modules, currentKey, onSelect }, ref) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const artRef = useRef<HTMLImageElement>(null);
  const [openNum, setOpenNum] = useState<number | null>(null);
  const currentNum = modules.find((m) => m.topics.some((t) => t.key === currentKey))?.num ?? null;
  const open = modules.find((m) => m.num === openNum) ?? null;

  // Centre the viewport on a module's sign
  const scrollToStop = (num: number, smooth = true) => {
    const vp = viewportRef.current;
    const art = artRef.current;
    const sign = SIGNS[num];
    if (!vp || !art || !sign) return;
    const top = ((sign[1] + sign[3]) / 2 / ART_H) * art.offsetHeight - vp.clientHeight / 2;
    vp.scrollTo({ top: Math.max(0, top), behavior: smooth ? "smooth" : "auto" });
  };

  useImperativeHandle(ref, () => ({
    scrollToTopic: (key, smooth) => {
      const m = modules.find((mod) => mod.topics.some((t) => t.key === key));
      if (m) scrollToStop(m.num, smooth);
    },
    scrollToWorld: scrollToStop,
  }));

  return (
    <div className="cm-frame">
      <div className="cm-viewport" ref={viewportRef} tabIndex={-1}>
        <div className="cm-flow-wrap">
          <img ref={artRef} className="cm-flow" src="/flow.png" width={ART_W} height={ART_H} alt="" draggable={false} />
          {modules.map((m) => {
            const sign = SIGNS[m.num];
            if (!sign) return null;
            const [l, tp, r, b] = sign;
            const here = m.num === currentNum;
            return (
              <button
                key={m.num}
                type="button"
                className="cm-sign"
                data-state={m.state}
                data-here={here ? "1" : undefined}
                style={{ left: `${(l / ART_W) * 100}%`, top: `${(tp / ART_H) * 100}%`, width: `${((r - l) / ART_W) * 100}%`, height: `${((b - tp) / ART_H) * 100}%` }}
                onClick={() => setOpenNum(m.num)}
                aria-label={`Module ${m.num}: ${m.title} (${m.state === "locked" ? "locked" : `${m.done} of ${m.total} levels`})`}
              >
                <span className="cm-sign-badge">
                  {m.state === "done" ? <Icon name="ic-check" size={11} /> : m.state === "locked" ? <Icon name="ic-lock" size={11} /> : here ? <>You are here · {m.done}/{m.total}</> : `${m.done}/${m.total}`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {open && (
        <ModuleInfo
          module={open}
          onClose={() => setOpenNum(null)}
          onTopic={(topic, index) => {
            setOpenNum(null);
            onSelect({ kind: "topic", topic, module: open, index, x: 0, y: 0 });
          }}
        />
      )}
    </div>
  );
});

// ---------- module card (opens on a sign): the module's levels ----------

function ModuleInfo({ module: m, onClose, onTopic }: { module: LearnModule; onClose: () => void; onTopic: (t: LearnTopic, index: number) => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="cm-info-backdrop" onClick={onClose}>
      <div className="cm-info" role="dialog" aria-modal="true" aria-labelledby="cm-mod-title" onClick={(e) => e.stopPropagation()}>
        <div className="cm-info-head">
          <span className="cm-world-no mono">MODULE {pad2(m.num)} · {m.state === "locked" ? "LOCKED" : `${m.done}/${m.total} LEVELS`}</span>
          <h2 id="cm-mod-title" className="disp">{m.title}</h2>
          <button ref={closeRef} type="button" className="cm-info-close" onClick={onClose} aria-label="Close"><Icon name="ic-x" size={16} /></button>
        </div>
        <div className="cm-info-body">
          <p>{m.tagline}</p>
          <ol className="cm-mod-topics">
            {m.topics.map((t, i) => (
              <li key={t.id}>
                <button type="button" data-state={t.status} onClick={() => onTopic(t, i)}>
                  <span className="mono">{t.key}</span>
                  <b>{t.title}</b>
                  <Icon name={t.status === "done" ? "ic-check" : t.status === "locked" ? "ic-lock" : "ic-play"} size={13} />
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

export default CampaignMap;
