"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { Icon } from "@/components/Icon";

type Tone = CSSProperties & Record<`--${string}`, string | number>;
type Rarity = "Common" | "Rare" | "Epic" | "Legendary";
type Status = "done" | "progress" | "locked";

const RARITY: Record<Rarity, string> = { Common: "#64748b", Rare: "#0284c7", Epic: "#7c3aed", Legendary: "#d97706" };

const BADGES: {
  id: string; title: string; track: string; img: string;
  c: [string, string, string]; rarity: Rarity; status: Status; pct?: number; xp: number; note: string;
}[] = [
  { id: "sec", title: "Security Fundamentals", track: "Security", img: "cybersecurity-fundamentals", c: ["#fef3c7", "#f59e0b", "#92400e"], rarity: "Common", status: "done", xp: 500, note: "Earned 4 days ago" },
  { id: "net", title: "Network Defense Associate", track: "Networking", img: "networking-defense-associate", c: ["#e0f2fe", "#0ea5e9", "#075985"], rarity: "Rare", status: "progress", pct: 64, xp: 750, note: "7 modules to go" },
  { id: "web", title: "Web Application Security", track: "Web", img: "web-application-security", c: ["#ffe4e6", "#f43f5e", "#9f1239"], rarity: "Rare", status: "progress", pct: 22, xp: 750, note: "14 modules to go" },
  { id: "blue", title: "Blue Team Operations", track: "Blue Team", img: "blue-team-operations", c: ["#ccfbf1", "#14b8a6", "#115e59"], rarity: "Epic", status: "progress", pct: 8, xp: 1000, note: "11 modules to go" },
  { id: "off", title: "Offensive Security Basics", track: "Offensive", img: "offensive-security-basics", c: ["#fee2e2", "#dc2626", "#7f1d1d"], rarity: "Epic", status: "locked", xp: 1000, note: "Unlocks at Web 50%" },
  { id: "os", title: "Systems & OS Hardening", track: "Systems", img: "system-os-hardening", c: ["#ede9fe", "#8b5cf6", "#4c1d95"], rarity: "Epic", status: "locked", xp: 1000, note: "Unlocks at OS 50%" },
  { id: "cloud", title: "Cloud Security Practitioner", track: "Cloud", img: "cloud-security-practitioner", c: ["#e0e7ff", "#6366f1", "#312e81"], rarity: "Legendary", status: "locked", xp: 1500, note: "Unlocks at Level 20" },
];

// Badge artwork: circular 512px cut-outs (public/badges/web/*.webp) of the
// full-size originals in public/badges
const art = (b: Badge) => `/badges/web/${b.img}.webp`;
type Badge = (typeof BADGES)[number];

const FILTERS: { id: "all" | Status; label: string }[] = [
  { id: "all", label: "All" },
  { id: "done", label: "Earned" },
  { id: "progress", label: "In progress" },
  { id: "locked", label: "Locked" },
];

// A light collection panel: summary + filters on top, then every badge
// floating on a soft colour glow inside its progress ring, tilting toward
// the pointer on hover
export function SummitBadges() {
  const [filter, setFilter] = useState<"all" | Status>("all");
  const earned = BADGES.filter((b) => b.status === "done");
  const xpEarned = earned.reduce((a, b) => a + b.xp, 0);
  const xpTotal = BADGES.reduce((a, b) => a + b.xp, 0);
  const shown = BADGES.filter((b) => filter === "all" || b.status === filter);
  const count = (id: "all" | Status) => (id === "all" ? BADGES.length : BADGES.filter((b) => b.status === id).length);

  return (
    <section className="sb">
      <span className="sb-mesh" aria-hidden="true"><i /><i /><i /></span>

      <header className="sb-top">
        <div>
          <span className="sb-eyebrow"><Icon name="ic-medal" size={14} />Summit badges</span>
          <h3 className="sb-h">Your badge collection</h3>
          <p className="sb-lead">Finish a track to summit its badge and claim the XP.</p>
        </div>
        <div className="sb-summary">
          <span className="sb-donut" style={{ "--p": `${(earned.length / BADGES.length) * 100}%` } as Tone}>
            <b>{earned.length}<small>/{BADGES.length}</small></b>
          </span>
          <div>
            <span className="sb-sum-k">XP collected</span>
            <b className="sb-sum-v">{xpEarned.toLocaleString()} <small>/ {xpTotal.toLocaleString()}</small></b>
            <Link href="/certificates" className="sb-all">View certificates <Icon name="ic-arrow" size={13} /></Link>
          </div>
        </div>
      </header>

      <div className="sb-filters" role="tablist" aria-label="Filter badges">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" role="tab" aria-selected={filter === f.id} className="sb-chip" onClick={() => setFilter(f.id)}>
            {f.label}<span>{count(f.id)}</span>
          </button>
        ))}
      </div>

      <div className="sb-grid">
        {shown.map((b) => <BadgeTile key={b.id} b={b} />)}
        {shown.length === 0 && <p className="sb-empty">No badges here yet.</p>}
      </div>
    </section>
  );
}

function BadgeTile({ b }: { b: Badge }) {
  const ring = 2 * Math.PI * 47;
  const pct = b.status === "done" ? 100 : b.status === "progress" ? b.pct ?? 0 : 0;
  // tilt toward the pointer (CSS custom props, no re-render)
  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--rx", `${((e.clientY - r.top) / r.height - 0.5) * -14}deg`);
    e.currentTarget.style.setProperty("--ry", `${((e.clientX - r.left) / r.width - 0.5) * 14}deg`);
  };
  const onLeave = (e: React.PointerEvent<HTMLElement>) => {
    e.currentTarget.style.removeProperty("--rx");
    e.currentTarget.style.removeProperty("--ry");
  };

  return (
    <article className={`sb-tile ${b.status}`} style={{ "--c": b.c[1], "--r": RARITY[b.rarity] } as Tone} onPointerMove={onMove} onPointerLeave={onLeave}>
      <div className="sb-medal">
        <svg className="sb-ring" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="47" />
          {pct > 0 && <circle cx="50" cy="50" r="47" className="on" strokeDasharray={`${(pct / 100) * ring} ${ring}`} />}
        </svg>
        <img src={art(b)} alt="" width={112} height={112} loading="lazy" />
        {b.status === "locked" && <span className="sb-lock"><Icon name="ic-lock" size={13} /></span>}
        {b.status === "progress" && <span className="sb-pct">{b.pct}%</span>}
        {b.status === "done" && <span className="sb-pct sb-done"><Icon name="ic-check" size={11} /></span>}
      </div>
      <span className="sb-rarity">{b.rarity}</span>
      <b className="sb-title">{b.title}</b>
      <span className="sb-note">{b.status === "locked" && <Icon name="ic-lock" size={11} />}{b.note}</span>
      <span className={`sb-xp${b.status === "done" ? " gold" : ""}`}>{b.status === "done" ? "+" : ""}{b.xp.toLocaleString()} XP</span>
    </article>
  );
}
