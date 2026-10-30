"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { StepTracker } from "@/components/networking/StepTracker";
import "./quiz.css";

// Topic 1.1 quiz, after the game: link everything on Priya's network map to
// Node or Not a Node. Drag a chain from an item's port to a hub (or tap the
// item, then the hub); tap a linked item to unhook it. Checking runs a packet
// down every chain one at a time: right links light green, wrong ones break
// and go back to be relinked. A fully correct map unlocks the completion
// stage. (Front end only: the backend's stage list is shared by every topic,
// so the quiz isn't a recorded stage.)

type Bucket = "node" | "notnode";
type Item = { id: string; text: string; icon: string; correct: Bucket };
type Pt = { x: number; y: number };

// Interleaved so the answers don't follow the list order
const ITEMS: Item[] = [
  { id: "cable", text: "The ethernet cable running to the switch", icon: "ic-layers", correct: "notnode" },
  { id: "router", text: "The office Wi-Fi router", icon: "ic-globe", correct: "node" },
  { id: "signal", text: "The office Wi-Fi signal broadcasting the SSID", icon: "ic-radar", correct: "notnode" },
  { id: "tv", text: "The conference room smart TV", icon: "ic-play", correct: "node" },
  { id: "rules", text: "The addressing rules each device follows to be reached", icon: "ic-list", correct: "notnode" },
  { id: "laptop", text: "Priya's work laptop", icon: "ic-term", correct: "node" },
];

const HUBS: { key: Bucket; label: string; hint: string; icon: string }[] = [
  { key: "node", label: "Node", hint: "Sends or receives data on its own", icon: "ic-cpu" },
  { key: "notnode", label: "Not a Node", hint: "The medium or the protocol", icon: "ic-zap" },
];

// Pointer travel before a press on an item counts as a drag, not a tap
const DRAG_PX = 6;
// Gap between each chain's verdict while checking
const REVEAL_MS = 420;

// Cable-style curve: leaves the item port heading right, enters the hub port from the left
const curve = (a: Pt, b: Pt) => {
  const dx = Math.max(40, Math.abs(b.x - a.x) * 0.5);
  return `M${a.x},${a.y} C${a.x + dx},${a.y} ${b.x - dx},${b.y} ${b.x},${b.y}`;
};

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function QuizScreen() {
  // Which hub each item is chained to (absent = unlinked)
  const [links, setLinks] = useState<Record<string, Bucket>>({});
  const [selected, setSelected] = useState<string | null>(null);
  // Result of the last check: item id -> right or wrong
  const [marks, setMarks] = useState<Record<string, boolean> | null>(null);
  // How many chains have had their verdict shown so far during a check
  const [revealed, setRevealed] = useState(0);
  // Live chain while dragging: from item id to the pointer
  const [drag, setDrag] = useState<{ id: string; at: Pt; over: Bucket | null } | null>(null);
  // Port centres, measured relative to the board
  const [ports, setPorts] = useState<{ items: Record<string, Pt>; hubs: Record<string, Pt> }>({ items: {}, hubs: {} });

  const boardRef = useRef<HTMLDivElement>(null);
  const itemPortRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const hubPortRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const justDragged = useRef(false);

  const linkedCount = Object.keys(links).length;
  const allLinked = linkedCount === ITEMS.length;
  const checking = marks !== null && revealed < ITEMS.length;
  const right = marks ? Object.values(marks).filter(Boolean).length : 0;
  const passed = marks !== null && !checking && right === ITEMS.length;
  const locked = marks !== null;

  const measure = useCallback(() => {
    const board = boardRef.current;
    if (!board) return;
    const origin = board.getBoundingClientRect();
    const centre = (el: HTMLElement | null): Pt | null => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2 - origin.left, y: r.top + r.height / 2 - origin.top };
    };
    const items: Record<string, Pt> = {};
    const hubs: Record<string, Pt> = {};
    for (const i of ITEMS) {
      const p = centre(itemPortRefs.current[i.id]);
      if (p) items[i.id] = p;
    }
    for (const h of HUBS) {
      const p = centre(hubPortRefs.current[h.key]);
      if (p) hubs[h.key] = p;
    }
    setPorts({ items, hubs });
  }, []);

  useLayoutEffect(() => {
    measure();
    const board = boardRef.current;
    if (!board) return;
    const ro = new ResizeObserver(measure);
    ro.observe(board);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  // Step through the verdicts one chain at a time
  useEffect(() => {
    if (!marks || revealed >= ITEMS.length) return;
    const t = window.setTimeout(() => setRevealed((n) => n + 1), REVEAL_MS);
    return () => window.clearTimeout(t);
  }, [marks, revealed]);

  const link = (id: string, hub: Bucket) => {
    if (locked) return;
    setLinks((l) => ({ ...l, [id]: hub }));
    setSelected(null);
  };

  const unlink = (id: string) => {
    setLinks((l) => {
      const next = { ...l };
      delete next[id];
      return next;
    });
  };

  // Tap an item: pick it up, or unhook it if it's already chained
  const tapItem = (id: string) => {
    if (locked || justDragged.current) return;
    if (links[id]) {
      unlink(id);
      setSelected(id);
      return;
    }
    setSelected((s) => (s === id ? null : id));
  };

  const hubAt = (x: number, y: number): Bucket | null => {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-hub]");
    return (el?.dataset.hub as Bucket) ?? null;
  };

  const startDrag = (e: React.PointerEvent, id: string) => {
    if (locked || e.button !== 0) return;
    const board = boardRef.current;
    if (!board) return;
    const sx = e.clientX;
    const sy = e.clientY;
    let moved = false;

    const toBoard = (x: number, y: number): Pt => {
      const r = board.getBoundingClientRect();
      return { x: x - r.left, y: y - r.top };
    };

    const move = (ev: PointerEvent) => {
      if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < DRAG_PX) return;
      moved = true;
      ev.preventDefault();
      setDrag({ id, at: toBoard(ev.clientX, ev.clientY), over: hubAt(ev.clientX, ev.clientY) });
    };

    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      setDrag(null);
      if (!moved) return; // a plain tap is handled by onClick
      const hub = ev.type === "pointerup" ? hubAt(ev.clientX, ev.clientY) : null;
      if (hub) link(id, hub);
      // The click that may follow a drag shouldn't toggle selection
      justDragged.current = true;
      window.setTimeout(() => (justDragged.current = false), 0);
    };

    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  const check = () => {
    if (!allLinked) return;
    setSelected(null);
    setMarks(Object.fromEntries(ITEMS.map((i) => [i.id, links[i.id] === i.correct])));
    setRevealed(reducedMotion() ? ITEMS.length : 0);
  };

  // Keep the right chains, drop the broken ones to relink
  const retry = () => {
    if (!marks) return;
    setLinks((l) => Object.fromEntries(Object.entries(l).filter(([id]) => marks[id])) as Record<string, Bucket>);
    setMarks(null);
    setRevealed(0);
  };

  const reset = () => {
    setLinks({});
    setSelected(null);
    setMarks(null);
    setRevealed(0);
  };

  // Verdict for an item once its chain has been checked
  const verdict = (id: string): "right" | "wrong" | "" => {
    if (!marks) return "";
    const idx = ITEMS.findIndex((i) => i.id === id);
    if (idx >= revealed) return "";
    return marks[id] ? "right" : "wrong";
  };

  const how = marks
    ? checking
      ? "Sending a packet down each chain…"
      : passed
        ? "Every chain carries data to the right place."
        : "Broken chains went to the wrong hub."
    : drag
      ? "Drop the chain on a hub."
      : selected
        ? "Now tap the hub it belongs to."
        : allLinked
          ? "Everything is linked. Check your map when you're ready."
          : "Drag from an item's port to a hub, or tap the item and then the hub.";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f4f2f9" }}>
      <StepTracker current="quiz" progressPct={Math.round((linkedCount / ITEMS.length) * 100)} />

      <main className="qz">
        <div className="qz-in">
          <div className="qz-eyebrow">Quiz · Topic 1.1</div>
          <h1 className="qz-h1">The Node Priya Almost Miscounted</h1>
          <p className="qz-story">
            When Solmark&apos;s office network started dropping connections, Priya pulled up the network map before touching anything else. To find the
            fault, she first had to separate every actual device on the network from the cables and signals that only carry their data. Mixing the two up
            would mean checking the wrong thing entirely.
          </p>

          <section className="qz-card">
            <div className="qz-top">
              <div>
                <h2 className="qz-h2">Chain it: Node or Not a Node?</h2>
                <p className="qz-context">
                  A <b>node</b> is any device that can send or receive data on its own. The <b>medium</b> (cables, wireless signals) and the <b>protocol</b>{" "}
                  (the addressing rules devices follow) support that exchange, but neither one is a node itself.
                </p>
              </div>
              <div className="qz-meter" aria-label={`${linkedCount} of ${ITEMS.length} linked`}>
                <div className="qz-meter-ring" style={{ ["--p" as string]: linkedCount / ITEMS.length }}>
                  <span>
                    {linkedCount}
                    <small>/{ITEMS.length}</small>
                  </span>
                </div>
                <span className="qz-meter-l">linked</span>
              </div>
            </div>

            <p className={`qz-how${checking ? " busy" : ""}`} aria-live="polite">
              {how}
            </p>

            <div ref={boardRef} className={`qz-board${drag ? " dragging" : ""}${passed ? " passed" : ""}`}>
              <svg className="qz-wires" aria-hidden="true">
                <defs>
                  <filter id="qz-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="b" />
                    <feMerge>
                      <feMergeNode in="b" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {ITEMS.map((i) => {
                  const hub = links[i.id];
                  const a = ports.items[i.id];
                  const b = hub && ports.hubs[hub];
                  if (!a || !b) return null;
                  const v = verdict(i.id);
                  const d = curve(a, b);
                  return (
                    <g key={i.id} className={`qz-chain ${v || (marks ? "pending" : "")}`}>
                      <path id={`qz-path-${i.id}`} d={d} className="qz-chain-outer" />
                      <path d={d} className="qz-chain-inner" />
                      {v === "right" && (
                        <circle r="5" className="qz-packet" filter="url(#qz-glow)">
                          <animateMotion dur="1.6s" repeatCount="indefinite">
                            <mpath href={`#qz-path-${i.id}`} />
                          </animateMotion>
                        </circle>
                      )}
                    </g>
                  );
                })}

                {drag && ports.items[drag.id] && (
                  <g className={`qz-chain live${drag.over ? " snap" : ""}`}>
                    {(() => {
                      const end = drag.over && ports.hubs[drag.over] ? ports.hubs[drag.over] : drag.at;
                      const d = curve(ports.items[drag.id], end);
                      return (
                        <>
                          <path d={d} className="qz-chain-outer" />
                          <path d={d} className="qz-chain-inner" />
                          <circle cx={end.x} cy={end.y} r="7" className="qz-cursor" />
                        </>
                      );
                    })()}
                  </g>
                )}
              </svg>

              <ul className="qz-items">
                {ITEMS.map((i) => {
                  const v = verdict(i.id);
                  const isLinked = !!links[i.id];
                  const cls = ["qz-item", isLinked && "linked", selected === i.id && "sel", drag?.id === i.id && "lifting", v].filter(Boolean).join(" ");
                  return (
                    <li key={i.id}>
                      <button
                        type="button"
                        className={cls}
                        aria-pressed={selected === i.id}
                        disabled={locked}
                        onPointerDown={(e) => startDrag(e, i.id)}
                        onClick={() => tapItem(i.id)}
                        title={locked ? undefined : isLinked ? "Tap to unhook and relink" : "Drag to a hub, or tap to pick up"}
                      >
                        <span className="qz-item-ic">
                          <Icon name={i.icon} size={17} />
                        </span>
                        <span className="qz-item-t">{i.text}</span>
                        {v && <Icon name={v === "right" ? "ic-check" : "ic-x"} size={16} className="ic qz-item-v" />}
                        {v && <span className="sr-only">{v === "right" ? "correct" : "incorrect"}</span>}
                        {isLinked && !v && <span className="sr-only">linked to {HUBS.find((h) => h.key === links[i.id])?.label}</span>}
                        <span ref={(el) => { itemPortRefs.current[i.id] = el; }} className="qz-port" />
                      </button>
                    </li>
                  );
                })}
              </ul>

              <div className="qz-hubs">
                {HUBS.map((h) => {
                  const count = ITEMS.filter((i) => links[i.id] === h.key).length;
                  const ready = !locked && (!!selected || !!drag);
                  const cls = ["qz-hub", h.key, ready && "ready", drag?.over === h.key && "over", count > 0 && "has"].filter(Boolean).join(" ");
                  return (
                    <button
                      key={h.key}
                      type="button"
                      data-hub={h.key}
                      className={cls}
                      disabled={locked || !selected}
                      onClick={() => selected && link(selected, h.key)}
                      aria-label={`${h.label}: ${h.hint}. ${count} linked.`}
                    >
                      <span ref={(el) => { hubPortRefs.current[h.key] = el; }} className="qz-port hub" />
                      <span className="qz-hub-ic">
                        <Icon name={h.icon} size={22} />
                      </span>
                      <span className="qz-hub-name">{h.label}</span>
                      <span className="qz-hub-hint">{h.hint}</span>
                      <span className="qz-hub-count">{count} linked</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {marks && !checking && (
              <div className={`qz-result ${passed ? "good" : "mixed"}`} role="status">
                <div className="qz-verdict">{passed ? "Network mapped. All six chains hold." : `${right} of ${ITEMS.length} chains hold.`}</div>
                <p>
                  {passed
                    ? "With every device confirmed as an actual node, Priya could rule out the cable and the Wi-Fi signal as suspects and focus only on the devices themselves, which is exactly where the real fault turned out to be."
                    : "The broken chains point at the wrong hub. Remember: cables and wireless signals are the medium, and addressing rules are the protocol. Neither sends or receives data on its own, so neither is a node."}
                </p>
              </div>
            )}

            <div className="qz-actions">
              <button type="button" className="qz-btn ghost" onClick={reset} disabled={(!linkedCount && !marks) || checking}>
                <Icon name="ic-replay" size={15} style={{ stroke: "currentColor" }} />
                Reset
              </button>
              {!marks && (
                <button type="button" className="qz-btn" onClick={check} disabled={!allLinked}>
                  Send test packet
                  <Icon name="ic-zap" size={15} style={{ stroke: "currentColor" }} />
                </button>
              )}
              {marks && !checking && !passed && (
                <button type="button" className="qz-btn" onClick={retry}>
                  Relink the broken chains
                </button>
              )}
            </div>
          </section>
        </div>
      </main>

      <footer className="qz-foot">
        <Link href="/learn/modules/networking/1-1/game" className="btn qz-back">
          <Icon name="ic-arrow-l" size={14} style={{ stroke: "currentColor" }} />Back to game
        </Link>
        {passed ? (
          <Link href="/learn/modules/networking/1-1/done" className="btn" style={{ background: "linear-gradient(120deg,#1d4ed8,#1739a8)", color: "#fff" }}>
            Continue to Completion<Icon name="ic-arrow" size={15} style={{ stroke: "#fff" }} />
          </Link>
        ) : (
          <span className="qz-lock">Link all six correctly to finish the topic</span>
        )}
      </footer>
    </div>
  );
}
