"use client";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Icon } from "@/components/Icon";
import { DashAnalytics } from "@/components/dashboard/DashAnalytics";
import { KpiRow } from "@/components/dashboard/KpiRow";
import "@/components/dashboard/dash.css";

type Tone = CSSProperties & Record<`--${string}`, string | number>;
const v = (o: Record<string, string | number>) => o as Tone;

const PLAYER = { name: "Sriram", level: 14, title: "Packet Hunter", xp: 2480, nextXp: 4000, streak: 7, gems: 340 };
const WEEK = ["M", "T", "W", "T", "F", "S", "S"];

const QUESTS = [
  { icon: "ic-term", text: "Complete 1 lab", done: 1, goal: 1, xp: 50 },
  { icon: "ic-zap", text: "Earn 150 XP", done: 90, goal: 150, xp: 30 },
  { icon: "ic-flag", text: "Capture a CTF flag", done: 0, goal: 1, xp: 80 },
] as const;

/* same podium order, icons and medal colours as /leaderboard */
const LEADER_XP = 14820;
const PODIUM = [
  { rank: 1, n: "m0nkeyk1ng", xp: 14820, icon: "ic-crown", medal: "#f5b301" },
  { rank: 2, n: "sn0wcrash", xp: 13140, icon: "ic-medal", medal: "#b8b8c8" },
  { rank: 3, n: "v0idwalker", xp: 11905, icon: "ic-medal", medal: "#c98a52" },
] as const;

const NEARBY = [
  { rank: 141, n: "d4rkpacket", xp: 2491 },
  { rank: 142, n: "Sriram", xp: 2480, me: true },
  { rank: 143, n: "hexfiend", xp: 2466 },
] as const;

const SKILLS = [
  { label: "Security", icon: "ic-shield", pct: 75, color: "#7c3aed" },
  { label: "Networking", icon: "ic-globe", pct: 35, color: "#38bdf8" },
  { label: "Operating Systems", icon: "ic-cpu", pct: 29, color: "#a78bfa" },
  { label: "Web Exploitation", icon: "ic-bug", pct: 17, color: "#fb7185" },
  { label: "Offensive Ops", icon: "ic-swords", pct: 5, color: "#f43f5e" },
  { label: "Blue Team", icon: "ic-radar", pct: 8, color: "#2dd4a7" },
  { label: "Cloud Security", icon: "ic-cloud", pct: 3, color: "#818cf8" },
] as const;

/** skill level 1–5 from coverage % */
const skillLevel = (pct: number) => Math.min(5, Math.floor(pct / 20) + 1);

function LevelRing({ pct }: { pct: number }) {
  const r = 46, len = 2 * Math.PI * r;
  return (
    <svg className="dq-lvl-ring" viewBox="0 0 104 104" aria-hidden="true">
      <defs>
        <linearGradient id="dq-lvl-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c4b5fd" /><stop offset=".5" stopColor="#7c3aed" /><stop offset="1" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
      <circle cx="52" cy="52" r={r} fill="none" stroke="rgba(124,58,237,.14)" strokeWidth="6" />
      <circle cx="52" cy="52" r={r} fill="none" stroke="url(#dq-lvl-g)" strokeWidth="6" strokeLinecap="round"
        strokeDasharray={`${(pct / 100) * len} ${len}`} transform="rotate(-90 52 52)" className="dq-lvl-arc" />
    </svg>
  );
}

export default function MainScreen() {
  const lvlPct = Math.round((PLAYER.xp / PLAYER.nextXp) * 100);

  return (
    <div data-screen className="dash2">
      <div className="dq-aurora" aria-hidden="true"><i /><i /><i /><i /></div>

      {/* ─── BASE CAMP: player banner (same night-mountain scene as /learn) ─── */}
      <section className="dq-hero">
        <svg viewBox="0 0 1200 300" preserveAspectRatio="none" className="dq-hero-scene" aria-hidden="true">
          <defs>
            <radialGradient id="dqSunGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffd28a" stopOpacity={0.9} /><stop offset="55%" stopColor="#fb9a5a" stopOpacity={0.4} /><stop offset="100%" stopColor="#fb9a5a" stopOpacity={0} />
            </radialGradient>
          </defs>
          {[[90, 40, 1.6, 0], [210, 90, 1.2, .6], [640, 36, 1.6, 1.1], [820, 70, 1.2, 1.7], [1010, 34, 1.6, .3], [1130, 96, 1.2, 2.1], [420, 60, 1.3, 1.4]].map(([x, y, r, d], i) => (
            <circle key={i} className="twinkle" cx={x} cy={y} r={r} fill="#fff" style={{ animationDelay: `${d}s` }} />
          ))}
          {/* scenery mirrored so the summit sits behind the glass panels, not the heading */}
          <g transform="translate(1200 0) scale(-1 1)">
            <circle cx="520" cy="215" r="95" fill="url(#dqSunGlow)" />
            <circle cx="520" cy="215" r="30" fill="#ffe1ab" />
            <path d="M0,240 C120,210 220,170 340,180 C460,190 520,150 640,140 C760,130 860,170 980,160 C1080,152 1150,170 1200,165 L1200,300 L0,300 Z" fill="#5a3a72" opacity={0.55} />
            <path d="M0,260 C90,220 170,170 260,170 C360,170 400,210 470,220 C560,232 620,180 700,160 C790,138 860,190 950,195 C1030,200 1110,170 1200,180 L1200,300 L0,300 Z" fill="#3f2856" opacity={0.8} />
            <path d="M0,300 L0,275 C70,275 90,195 150,170 C210,145 250,135 300,110 C340,90 360,78 390,78 C420,78 450,100 490,130 C540,168 580,195 650,210 C720,225 780,200 840,220 C900,240 960,255 1030,245 C1090,236 1150,255 1200,260 L1200,300 Z" fill="#241a3f" />
            <path d="M362,98 L390,78 L418,98 L400,94 L390,84 L380,94 Z" fill="#fff" opacity={0.92} />
            <path d="M160 70 q6 -6 12 0 q6 -6 12 0" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth={1.6} strokeLinecap="round" />
          </g>
          <line x1="810" y1="78" x2="810" y2="54" stroke="#fff" strokeWidth={2} />
          <path d="M810,54 L832,62 L810,70 Z" fill="#f2b84b" />
        </svg>

        <div className="dq-hero-player">
          <div className="dq-lvl">
            <LevelRing pct={lvlPct} />
            <img src="/bird-head.jpg" alt="" className="dq-lvl-av" />
            <span className="dq-lvl-badge">LV {PLAYER.level}</span>
          </div>
          <div className="dq-hero-id">
            <div className="dq-hero-eyebrow"><Icon name="ic-flag" size={14} />Base camp · Networking track · Week 6</div>
            <h1>Welcome back, <span className="grad dq-hero-grad">{PLAYER.name}</span></h1>
            <div className="dq-hero-xp">
              <div className="dq-xpbar"><i style={{ width: `${lvlPct}%` }} /></div>
              <span><b>{PLAYER.xp.toLocaleString()}</b> XP · {lvlPct}% to Level {PLAYER.level + 1}</span>
            </div>
            <div className="dq-hero-chips">
              <span className="hero-chip"><Icon name="ic-crown" size={14} style={{ stroke: "#ffd28a" }} />{PLAYER.title}</span>
              <span className="hero-chip"><Icon name="ic-star" size={14} style={{ stroke: "#ffd28a" }} />Level {PLAYER.level}</span>
              <span className="hero-chip"><Icon name="ic-gem" size={14} style={{ stroke: "#c9f0e6" }} />{PLAYER.gems} gems</span>
            </div>
          </div>
        </div>

        <div className="dq-hero-side">
          <div className="dq-streak">
            <div className="dq-streak-top">
              <span className="dq-flame"><Icon name="ic-flame" size={20} /></span>
              <div><b>{PLAYER.streak}-day camp streak</b><span>Keep the fire lit today</span></div>
            </div>
            <div className="dq-streak-days">
              {WEEK.map((d, i) => <span key={i} className={i < PLAYER.streak ? "on" : ""}>{d}</span>)}
            </div>
          </div>

          <div className="dq-quests">
            <div className="dq-quests-h"><Icon name="ic-target" size={14} />Trail rations<span>resets in 6h</span></div>
            {QUESTS.map((q) => {
              const done = q.done >= q.goal;
              return (
                <div key={q.text} className={`dq-quest${done ? " done" : ""}`}>
                  <span className="dq-quest-ic"><Icon name={done ? "ic-check" : q.icon} size={13} /></span>
                  <div className="dq-quest-body">
                    <div><b>{q.text}</b><em>{q.done}/{q.goal}</em></div>
                    <div className="dq-quest-bar"><i style={{ width: `${Math.min(100, (q.done / q.goal) * 100)}%` }} /></div>
                  </div>
                  <span className="dq-xp-chip">+{q.xp} XP</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── KPI ROW ─── */}
      <KpiRow />

      <div className="dq-layout">
        <div className="dq-main">
          {/* ─── ANALYTICS ─── */}
          <DashAnalytics />
        </div>

        {/* ── rail ── */}
        <aside className="dq-rail">
          <div className="dq-card dq-panel">
            <div className="dq-lb-head">
              <div>
                <div className="eyebrow">Season 1 · Cold Boot</div>
                <h3 className="disp"><span className="grad">Season leaderboard</span></h3>
                <span>Ranked by total XP · 47 days left</span>
              </div>
              <Link href="/leaderboard" className="gd-link">View all</Link>
            </div>

            <div className="dq-podium">
              {PODIUM.map((p) => (
                <div key={p.n} className={`dq-pod r${p.rank}`} style={v({ "--m": p.medal })}>
                  <img src="/bird-head.jpg" alt="" className="dq-pod-av" />
                  <b>{p.n}</b>
                  <span className="dq-pod-xp">{p.xp.toLocaleString()} XP</span>
                  <div className="dq-pod-step">
                    <Icon name={p.icon} size={18} />
                    <span className="disp">{p.rank}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="dq-lb-list">
              {NEARBY.map((p) => {
                const me = "me" in p && p.me;
                return (
                  <div key={p.n} className={`dq-lb-row${me ? " me" : ""}`}>
                    <span className="n">{p.rank}</span>
                    <img src="/bird-head.jpg" alt="" className="dq-lb-av" />
                    <span className="name">{p.n}{me && " (you)"}</span>
                    <div className="bar dq-lb-bar"><i className="barfx" style={{ width: `${Math.round((p.xp / LEADER_XP) * 100)}%` }} /></div>
                    <span className="pts">{p.xp.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>

            <div className="dq-lb-standing">
              <div><span>Your standing</span><b className="disp">#142</b></div>
              <p><Icon name="ic-zap" size={12} />11 XP to pass d4rkpacket</p>
            </div>
          </div>

          <div className="dq-card dq-panel">
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
              <div><div className="disp" style={{ fontSize: 14, fontWeight: 600 }}>Skill tree</div><div style={{ fontSize: 11, color: "#9a8fb5", marginTop: 2 }}>Across all 7 tracks</div></div>
              <span className="dq-tag">3 of 7 unlocked</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 15 }}>
              {SKILLS.map((n) => (
                <div key={n.label} className="dq-skill-row" style={v({ "--c": n.color })}>
                  <span className="dq-skill-ic"><Icon name={n.icon} size={14} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="dq-skill-h"><span>{n.label}</span><em>LV {skillLevel(n.pct)} · {n.pct}%</em></div>
                    <div className="dq-xpbar sm tint"><i style={{ width: `${Math.max(n.pct, 2)}%` }} /></div>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/learn" className="btn btn-g btn-s" style={{ width: "100%", marginTop: 16 }}>Open full skill tree</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
