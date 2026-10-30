"use client";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { s } from "@/lib/style";
import { LinkPending } from "@/components/LinkPending";
import { apiFetch } from "@/lib/auth";


const SUBJECTS = [
  {
    n: "01",
    level: "Beginner",
    dashoffset: "26.7",
    pct: "75%",
    eyebrow: "Start here",
    title: "Security Foundations & GRC",
    desc: "CIA triad, security teams, risk scoring, phishing & social engineering.",
    tags: ["CIA triad", "Risk scoring", "Phishing"],
    count: "9 / 12 modules",
    cta: "Continue",
    href: null,
    accent: "#7c3aed",
    illo: (
      <>
        <path d="M0,128 C40,128 50,90 90,74 C130,58 150,30 190,30 C230,30 250,64 290,80 C330,96 360,90 400,100 L400,128Z" fill="#a78bfa" fillOpacity={0.22} />
        <path d="M0,128 L60,96 L110,112 L190,30 L260,92 L330,66 L400,100 L400,128Z" fill="#1c1030" />
        <path d="M170,54 L190,30 L210,54 L198,50 L190,38 L182,50Z" fill="#fff" fillOpacity={0.95} />
        <path d="M300,84 L330,66 L358,82 L344,79 L330,72 L318,79Z" fill="#fff" fillOpacity={0.7} />
        <line x1="190" y1="30" x2="190" y2="10" stroke="#a78bfa" strokeWidth={2} style={s(`filter:drop-shadow(0 0 5px rgba(167,139,250,.8))`)} />
        <path d="M190,10 L212,18 L190,26Z" fill="#a78bfa" />
        <circle cx="60" cy="20" r="1.6" fill="#a78bfa" /><circle cx="340" cy="24" r="1.4" fill="#38bdf8" />
      </>
    ),
  },
  {
    n: "02",
    level: "Beginner",
    dashoffset: "69.4",
    pct: "35%",
    eyebrow: "How the wire works",
    title: "Networking",
    desc: "20-checkpoint mountain trail — OSI, TCP/IP, ARP, DNS, packet analysis, Nmap, IDS/IPS.",
    tags: ["OSI & TCP/IP", "Packet analysis", "Nmap"],
    count: "7 / 20 modules",
    cta: "Continue",
    href: "/learn/modules/networking",
    accent: "#38bdf8",
    illo: (
      <>
        <path d="M0,128 C50,128 60,86 110,66 C160,46 180,20 220,20 C260,20 280,52 320,72 C360,92 380,88 400,96 L400,128Z" fill="#38bdf8" fillOpacity={0.24} />
        <path d="M0,128 L70,90 L120,108 L220,20 L290,84 L340,58 L400,96 L400,128Z" fill="#07131c" />
        <circle cx="220" cy="20" r="34" fill="rgba(56,189,248,.16)" style={s(`filter:drop-shadow(0 0 10px rgba(56,189,248,.8))`)} />
        <line x1="220" y1="20" x2="220" y2="-4" stroke="#38bdf8" strokeWidth={2.4} />
        <circle cx="220" cy="-4" r="3" fill="#38bdf8" />
        <path d="M208 6 q12 -12 24 0" fill="none" stroke="#7ee0f5" strokeWidth={2} strokeLinecap="round" />
        <path d="M200 14 q20 -20 40 0" fill="none" stroke="#7ee0f5" strokeWidth={1.6} strokeLinecap="round" opacity={0.6} />
        <path d="M198,42 L220,20 L242,42 L228,38 L220,28 L212,38Z" fill="#fff" fillOpacity={0.85} />
        <rect x="60" y="70" width="30" height="22" rx="5" fill="rgba(255,255,255,.06)" stroke="#38bdf8" strokeWidth={1.6} />
        <rect x="310" y="60" width="30" height="22" rx="5" fill="rgba(255,255,255,.06)" stroke="#38bdf8" strokeWidth={1.6} />
        <line x1="90" y1="80" x2="198" y2="30" stroke="rgba(56,189,248,.35)" strokeWidth={1.4} strokeDasharray="2 4" />
        <line x1="310" y1="70" x2="242" y2="30" stroke="rgba(56,189,248,.35)" strokeWidth={1.4} strokeDasharray="2 4" />
      </>
    ),
  },
  {
    n: "03",
    level: "Beginner",
    dashoffset: "75.8",
    pct: "29%",
    eyebrow: "Linux & Windows",
    title: "Operating Systems",
    desc: "Linux, Windows, AD basics, Kerberoasting, privesc, lateral movement, EDR evasion.",
    tags: ["Linux & AD", "Privesc", "Kerberoasting"],
    count: "4 / 14 modules",
    cta: "Continue",
    href: null,
    accent: "#7c3aed",
    illo: (
      <>
        <path d="M0,128 C50,128 60,92 110,76 C160,60 180,34 220,34 C260,34 280,66 320,84 C360,102 380,96 400,104 L400,128Z" fill="#a78bfa" fillOpacity={0.2} />
        <path d="M0,128 L70,94 L120,110 L220,34 L290,88 L340,62 L400,104 L400,128Z" fill="#150f23" />
        <rect x="176" y="46" width="88" height="46" rx="6" fill="#0a0614" stroke="rgba(167,139,250,.4)" />
        <rect x="176" y="46" width="88" height="12" rx="6" fill="#1c1330" />
        <circle cx="185" cy="52" r="1.6" fill="#fb7185" /><circle cx="191" cy="52" r="1.6" fill="#f2b84b" />
        <text x="182" y="76" fontFamily="Monaco,Menlo,monospace" fontSize={9} fill="#7ee0a8">root@peak:~#_</text>
        <path d="M198,32 L220,10 L242,32 L228,28 L220,18 L212,28Z" fill="#fff" fillOpacity={0.8} />
      </>
    ),
  },
  {
    n: "04",
    level: "Intermediate",
    dashoffset: "88.6",
    pct: "17%",
    eyebrow: "Where most bugs live",
    title: "Web Exploitation",
    desc: "OWASP, injection, auth, IDOR, SSRF, XXE, file upload, API, JWT, Burp, WAF bypass.",
    tags: ["OWASP Top 10", "IDOR & SSRF", "Burp Suite"],
    count: "3 / 18 modules",
    cta: "Continue",
    href: null,
    accent: "#fb7185",
    illo: (
      <>
        <path d="M0,128 C50,128 60,104 110,94 C160,84 180,66 220,66 C260,66 280,88 320,100 C360,112 380,108 400,114 L400,128Z" fill="#fb7185" fillOpacity={0.2} />
        <path d="M0,128 L70,100 L120,116 L220,66 L290,104 L340,84 L400,114 L400,128Z" fill="#1c0d10" />
        <path d="M220 66 L206 88 L226 92 L204 118" fill="none" stroke="#fb7185" strokeWidth={2.2} strokeLinecap="round" style={s(`filter:drop-shadow(0 0 5px rgba(251,113,133,.8))`)} />
        <circle cx="266" cy="96" r="16" fill="rgba(251,113,133,.16)" />
        <g fill="none" stroke="#fb7185" strokeWidth={2} strokeLinecap="round">
          <rect x="258" y="90" width="16" height="18" rx="6" />
          <path d="M266 90v-5M258 96h-5M258 103h-5M274 96h5M274 103h5" />
        </g>
        <path d="M198,86 L220,66 L242,86 L228,83 L220,74 L212,83Z" fill="#fff" fillOpacity={0.35} />
      </>
    ),
  },
  {
    n: "05",
    level: "Advanced",
    dashoffset: "106.8",
    pct: "0%",
    eyebrow: "Red & purple team",
    title: "Offensive Operations",
    desc: "Red team ops, adversary sim, pentest sim, purple team, reverse engineering.",
    tags: ["Adversary sim", "Red team ops", "Reverse eng."],
    count: "0 / 10 modules",
    cta: "Start",
    href: null,
    accent: "#f43f5e",
    locked: true,
    illo: (
      <>
        <path d="M0,128 L70,88 L120,106 L220,18 L290,86 L340,58 L400,100 L400,128Z" fill="#1a0c10" fillOpacity={0.9} />
        <line x1="220" y1="18" x2="220" y2="-2" stroke="#f43f5e" strokeWidth={2} opacity={0.7} />
        <path d="M220,-2 L242,6 L220,14Z" fill="#f43f5e" opacity={0.6} />
        <ellipse cx="200" cy="60" rx="110" ry="26" fill="#f4f2f9" opacity={0.9} />
        <ellipse cx="150" cy="82" rx="90" ry="22" fill="#f4f2f9" opacity={0.8} />
        <ellipse cx="290" cy="76" rx="80" ry="20" fill="#f4f2f9" opacity={0.85} />
      </>
    ),
  },
  {
    n: "06",
    level: "Advanced",
    dashoffset: "98.3",
    pct: "8%",
    eyebrow: "Detect and respond",
    title: "Blue Team & SOC",
    desc: "SIEM, SOC ops, log analysis, threat hunting, IR, threat intel, DFIR, malware analysis.",
    tags: ["SIEM & logs", "Threat hunting", "DFIR"],
    count: "1 / 12 modules",
    cta: "Continue",
    href: null,
    accent: "#2dd4a7",
    illo: (
      <>
        <path d="M0,128 C50,128 60,80 110,60 C160,40 180,16 220,16 C260,16 280,50 320,70 C360,90 380,86 400,94 L400,128Z" fill="#2dd4a7" fillOpacity={0.2} />
        <path d="M0,128 L70,86 L120,104 L220,16 L290,82 L340,56 L400,94 L400,128Z" fill="#08120f" />
        <circle cx="220" cy="16" r="24" fill="none" stroke="#2dd4a7" strokeWidth={1.6} opacity={0.6} />
        <circle cx="220" cy="16" r="14" fill="none" stroke="#2dd4a7" strokeWidth={1.6} opacity={0.6} />
        <path d="M220 16 L238 4" stroke="#7ee0a8" strokeWidth={2.2} strokeLinecap="round" style={s(`filter:drop-shadow(0 0 5px rgba(126,224,168,.8))`)} />
        <circle cx="220" cy="16" r="3" fill="#7ee0a8" />
        <path d="M198,38 L220,16 L242,38 L228,34 L220,24 L212,34Z" fill="#fff" fillOpacity={0.55} />
      </>
    ),
  },
  {
    n: "07",
    level: "Advanced",
    dashoffset: "106.8",
    pct: "0%",
    eyebrow: "AWS, Azure & containers",
    title: "Cloud Security",
    desc: "Cloud security, AWS, Azure, containers, Kubernetes hardening & attacks.",
    tags: ["AWS & Azure", "Kubernetes", "Container sec."],
    count: "0 / 8 modules",
    cta: "Start",
    href: null,
    accent: "#818cf8",
    locked: true,
    illo: (
      <>
        <path d="M0,128 L70,90 L120,108 L220,20 L290,86 L340,60 L400,100 L400,128Z" fill="#0d0c1a" fillOpacity={0.9} />
        <g fill="#e7e2fb" opacity={0.92}>
          <ellipse cx="170" cy="58" rx="34" ry="16" /><ellipse cx="200" cy="48" rx="30" ry="18" /><ellipse cx="232" cy="58" rx="34" ry="16" />
          <ellipse cx="255" cy="70" rx="40" ry="16" /><ellipse cx="150" cy="72" rx="36" ry="16" />
        </g>
        <svg x="188" y="46" width="24" height="24" viewBox="0 0 24 24"><path d="M5 11v9h14v-9" fill="none" stroke="#818cf8" strokeWidth={2} /><path d="M8 11V7a4 4 0 0 1 8 0v4" fill="none" stroke="#818cf8" strokeWidth={2} /></svg>
      </>
    ),
  },
];

const PATH_NODES = [
  { n: 1, icon: "ic-shield", label: "Security", label2: "Foundations", pct: "75%", state: "done", mt: 69, href: null, snow: true },
  { n: 2, icon: "ic-globe", label: "Networking", label2: null, pct: "35%", state: "current", mt: 4, href: "/learn/modules/networking", snow: true },
  { n: 3, icon: "ic-cpu", label: "Operating", label2: "Systems", pct: "29%", state: "done", mt: 69, href: null, snow: true },
  { n: 4, icon: "ic-bug", label: "Web", label2: "Exploitation", pct: "17%", state: "done", mt: 134, href: null, snow: false },
  { n: 5, icon: "ic-swords", label: "Offensive", label2: "Ops", pct: "Locked", state: "locked", mt: 69, href: null, snow: false },
  { n: 6, icon: "ic-radar", label: "Blue Team", label2: "& SOC", pct: "8%", state: "done", mt: 4, href: null, snow: true },
  { n: 7, icon: "ic-cloud", label: "Cloud", label2: "Security", pct: "Locked", state: "locked", mt: 69, href: null, snow: false },
];



// Saved progress for every lab, keyed by slug (empty until loaded / signed out)
const ACTIVITY = [
  { icon: "ic-term", color: "#38bdf8", text: "Completed lab: SQL Injection Basics", time: "2 hours ago", xp: 120 },
  { icon: "ic-flag", color: "#fb7185", text: "Solved CTF challenge: Baby RSA (Crypto)", time: "Yesterday", xp: 200 },
  { icon: "ic-book", color: "#7c3aed", text: "Started module: TCP Deep Dive", time: "2 days ago", xp: 20 },
  { icon: "ic-cert", color: "#f5a524", text: "Earned certificate: Security Fundamentals", time: "4 days ago", xp: 500 },
  { icon: "ic-chart", color: "#2dd4a7", text: "Reached season rank #142 (▲12)", time: "5 days ago" },
];



function Ic({ name, cls, style }: { name: string; cls?: string; style?: CSSProperties }) {
  return (
    <svg className={cls || "ic"} viewBox="0 0 24 24" style={style}>
      <use href={`#${name}`} />
    </svg>
  );
}

function ProgressBadge({ dashoffset, pct }: { dashoffset: string; pct: string }) {
  return (
    <span
      style={s(
        `position:absolute;right:16px;top:-22px;width:46px;height:46px;border-radius:50%;background:rgba(255,255,255,.9);backdrop-filter:blur(8px) saturate(1.6);-webkit-backdrop-filter:blur(8px) saturate(1.6);border:1px solid rgba(255,255,255,.95);box-shadow:inset 0 1.5px 2px rgba(255,255,255,.95),inset 0 -2px 4px rgba(124,58,237,.08),0 8px 18px -8px rgba(70,40,120,.4);display:flex;align-items:center;justify-content:center`
      )}
    >
      <svg viewBox="0 0 44 44" style={s(`width:38px;height:38px;position:absolute`)}>
        <circle cx="22" cy="22" r="17" fill="none" stroke="rgba(124,58,237,.15)" strokeWidth={4} />
        <circle
          cx="22"
          cy="22"
          r="17"
          fill="none"
          stroke="#7c3aed"
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray="106.8"
          strokeDashoffset={dashoffset}
          transform="rotate(-90 22 22)"
        />
      </svg>
      <span style={s(`font-size:10px;font-weight:700;color:#7c3aed`)}>{pct}</span>
    </span>
  );
}

function SubjectCard({ subj }: { subj: (typeof SUBJECTS)[number] }) {
  const Tag = subj.href ? Link : "div";
  const tagProps = subj.href ? { href: subj.href } : {};
  return (
    <Tag
      {...(tagProps as any)}
      className="subj-card lift"
      style={s(`display:flex;flex-direction:column;text-decoration:none;color:inherit${subj.href ? ";cursor:pointer" : ""}`)}
    >
      <div className="subj-illo">
        <div className="subj-illo-dots" aria-hidden="true"></div>
        <svg viewBox="0 0 400 128" width="100%" height="128" preserveAspectRatio="none" aria-hidden="true">
          {subj.illo}
        </svg>
        <div className="subj-illo-vignette" aria-hidden="true"></div>
        <span className="illo-badge" style={s(`left:10px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.24);color:#e7defb`)}>{subj.n}</span>
        <span className="illo-badge" style={s(`right:10px;text-transform:uppercase;letter-spacing:.3px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);color:rgba(255,255,255,.8)`)}>{subj.level}</span>
      </div>
      <div style={s(`padding:20px 20px 20px;position:relative;display:flex;flex-direction:column;flex:1`)}>
        {!subj.locked && <ProgressBadge dashoffset={subj.dashoffset} pct={subj.pct} />}
        <div className="eyebrow" style={s(`color:${subj.accent};font-size:10px`)}>{subj.eyebrow}</div>
        <h3 className="disp" style={s(`font-size:16px;font-weight:600;letter-spacing:-.2px;margin-top:4px${subj.locked ? ";color:#4b4560" : ""}`)}>{subj.title}</h3>
        <p style={s(`font-size:12.5px;color:#726c86;margin-top:6px;line-height:1.55;flex:1`)}>{subj.desc}</p>
        <div style={s(`display:flex;gap:6px;flex-wrap:wrap;margin-top:11px`)}>
          {subj.tags.map((t) => (
            <span key={t} className="tag" style={s(`color:#5b21b6;background:rgba(124,58,237,.1);border-color:rgba(124,58,237,.22)`)}>{t}</span>
          ))}
        </div>
        <div style={s(`display:flex;align-items:center;justify-content:space-between;margin-top:15px;padding-top:13px;border-top:1px solid rgba(124,58,237,.14);font-size:11px;color:#9a8fb5`)}>
          <span>{subj.count}</span>
          {subj.locked ? (
            <span style={s(`display:flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:#b3abc7`)}>
              <Ic name="ic-lock" style={s(`width:11px;height:11px;stroke:#b3abc7`)} />Clouds haven&apos;t lifted
            </span>
          ) : (
            <span style={s(`display:flex;align-items:center;gap:4px;color:#fff;background:linear-gradient(120deg,${subj.accent},#5b21b6);font-weight:700;font-size:11px;padding:6px 12px;border-radius:999px;box-shadow:0 6px 14px -6px rgba(124,58,237,.55)`)}>
              {subj.cta}
              <Ic name="ic-arrow" style={s(`width:11px;height:11px;stroke:#fff`)} />
              {subj.href && <LinkPending />}
            </span>
          )}
        </div>
      </div>
    </Tag>
  );
}

export default function LearnScreen() {
  
  return (
    <div data-screen>
      {/* HERO: base-camp banner */}
      <div className="learn-hero">
        <svg viewBox="0 0 1200 280" preserveAspectRatio="none" className="learn-hero-svg" aria-hidden="true">
          <defs>
            <radialGradient id="learnSunGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffd28a" stopOpacity={0.95} />
              <stop offset="55%" stopColor="#fb9a5a" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#fb9a5a" stopOpacity={0} />
            </radialGradient>
          </defs>
          <circle cx="330" cy="185" r="90" fill="url(#learnSunGlow)" />
          <circle cx="330" cy="185" r="30" fill="#ffe1ab" />
          <circle className="twinkle" cx="120" cy="40" r="1.6" fill="#fff" />
          <circle className="twinkle" cx="200" cy="70" r="1.2" fill="#fff" style={s(`animation-delay:.6s`)} />
          <circle className="twinkle" cx="760" cy="35" r="1.6" fill="#fff" style={s(`animation-delay:1.1s`)} />
          <circle className="twinkle" cx="900" cy="60" r="1.2" fill="#fff" style={s(`animation-delay:1.7s`)} />
          <circle className="twinkle" cx="1050" cy="30" r="1.6" fill="#fff" style={s(`animation-delay:.3s`)} />
          <path d="M0,220 C120,190 220,150 340,160 C460,170 520,130 640,120 C760,110 860,150 980,140 C1080,132 1150,150 1200,145 L1200,280 L0,280 Z" fill="#5a3a72" opacity={0.55} />
          <path d="M0,240 C90,200 170,150 260,150 C360,150 400,190 470,200 C560,212 620,160 700,140 C790,118 860,170 950,175 C1030,180 1110,150 1200,160 L1200,280 L0,280 Z" fill="#3f2856" opacity={0.8} />
          <path d="M0,280 L0,255 C70,255 90,175 150,150 C210,125 250,115 300,90 C340,70 360,58 390,58 C420,58 450,80 490,110 C540,148 580,175 650,190 C720,205 780,180 840,200 C900,220 960,235 1030,225 C1090,216 1150,235 1200,240 L1200,280 Z" fill="#241a3f" />
          <path d="M362,78 L390,58 L418,78 L400,74 L390,64 L380,74 Z" fill="#fff" opacity={0.92} />
          <line x1="390" y1="58" x2="390" y2="34" stroke="#fff" strokeWidth={2} />
          <path d="M390,34 L412,42 L390,50 Z" fill="#f2b84b" />
          <path d="M150 60 q6 -6 12 0 q6 -6 12 0" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth={1.6} strokeLinecap="round" />
          <path d="M980 90 q5 -5 10 0 q5 -5 10 0" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth={1.4} strokeLinecap="round" />
        </svg>
        <img src="/bird-head.jpg" alt="mascot" className="float learn-hero-bird" />
        <div className="learn-hero-inner">
          <div>
            <div style={s(`display:flex;align-items:center;gap:6px;font-size:11px;font-weight:700;letter-spacing:.3px;text-transform:uppercase;color:#ffd9a8;margin-bottom:10px`)}>
              <Ic name="ic-flag" style={s(`width:14px;height:14px;stroke:#ffd9a8`)} />
              Base Camp · Learn
            </div>
            <h1 className="disp" style={s(`font-size:30px;font-weight:600;color:#fff`)}>Climb to <span className="grad">cyber mastery</span></h1>
            <p className="lead" style={s(`margin-top:8px;max-width:520px;color:rgba(255,255,255,.78)`)}>87 guided modules across 7 peaks · Level 14 · 2,480 XP · 62% to Level 15</p>
          </div>
          <div style={s(`display:flex;gap:10px;flex-wrap:wrap`)}>
            <span className="hero-chip"><Ic name="ic-flame" style={s(`width:14px;height:14px;stroke:none;fill:#fb7185`)} />7-day streak</span>
            <span className="hero-chip"><Ic name="ic-star" style={s(`width:14px;height:14px;stroke:#ffd28a`)} />Level 14</span>
            <span className="hero-chip"><Ic name="ic-gem" style={s(`width:14px;height:14px;stroke:#c9f0e6`)} />2,480 XP</span>
          </div>
        </div>
      </div>

      {/* YOUR ASCENT: mountain ridge path */}
      <div className="glass" style={s(`border-radius:18px;padding:24px 28px 14px;margin-top:20px`)}>
        <div style={s(`display:flex;align-items:center;justify-content:space-between;margin-bottom:6px`)}>
          <div className="eyebrow">Your ascent</div>
          <span style={s(`font-size:11px;color:#9a8fb5`)}>7 peaks · recommended order</span>
        </div>
        <div style={s(`position:relative;padding-bottom:8px;height:230px`)}>
          <svg viewBox="0 0 1120 220" preserveAspectRatio="none" style={s(`position:absolute;left:0;top:0;width:100%;height:210px`)} aria-hidden="true">
            <defs>
              <linearGradient id="ridgeFront" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#c4b5fd" /><stop offset="1" stopColor="#ede9fe" />
              </linearGradient>
              <linearGradient id="pathGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#c4b5fd" /><stop offset=".5" stopColor="#7c3aed" /><stop offset="1" stopColor="#c4b5fd" />
              </linearGradient>
            </defs>
            <path d="M0,220 C60,208 120,150 200,140 C280,130 340,168 420,160 C500,152 560,112 640,102 C720,92 800,130 880,122 C960,114 1040,150 1120,142 L1120,220 Z" fill="#ddd6fe" opacity={0.55} />
            <path d="M0,200 C40,200 40,132 80,112 C130,88 190,52 240,52 C290,52 350,92 400,112 C460,136 520,168 560,168 C610,168 670,130 720,112 C770,92 830,52 880,52 C930,52 990,86 1040,112 C1080,128 1120,150 1120,168 L1120,220 L0,220 Z" fill="url(#ridgeFront)" opacity={0.75} />
            <ellipse cx="720" cy="128" rx="70" ry="26" fill="#fff" opacity={0.55} />
            <ellipse cx="1040" cy="128" rx="70" ry="26" fill="#fff" opacity={0.55} />
            <path
              d="M0,95 C58,95 58,30 116.7,30 C175,30 175,95 233,95 C291,95 291,160 350,160 C408,160 408,95 467,95 C525,95 525,30 583,30 C641,30 641,95 700,95"
              transform="translate(80,10) scale(1.086,1)"
              fill="none"
              stroke="url(#pathGrad)"
              strokeWidth={3}
              strokeDasharray="1 11"
              strokeLinecap="round"
              opacity={0.85}
            />
            <path d="M62,124 L80,108 L98,124 L86,120 L80,114 L74,120 Z" fill="#fff" />
            <path d="M382,124 L400,108 L418,124 L406,120 L400,114 L394,120 Z" fill="#fff" />
            <path d="M862,64 L880,48 L898,64 L886,60 L880,54 L874,60 Z" fill="#fff" />
            <circle cx="240" cy="52" r="34" fill="#7ee0f5" opacity={0.18} />
            <path d="M215,66 L240,44 L265,66 L250,61 L240,50 L230,61 Z" fill="#fff" />
            <path d="M180,150 l6,-12 6,12Z M186,144 l5,-10 5,10Z" fill="#7c3aed" opacity={0.28} />
            <path d="M480,178 l6,-12 6,12Z M486,172 l5,-10 5,10Z" fill="#7c3aed" opacity={0.28} />
          </svg>

          <div style={s(`position:relative;display:flex;justify-content:space-between`)}>
            {PATH_NODES.map((node) => {
              const NodeTag = node.href ? Link : "div";
              const nodeProps = node.href ? { href: node.href } : {};
              const locked = node.state === "locked";
              const current = node.state === "current";
              return (
                <div key={node.n} style={s(`display:flex;flex-direction:column;align-items:center;gap:7px;width:84px;margin-top:${node.mt}px;position:relative`)}>
                  {current && (
                    <div className="float" style={s(`position:absolute;top:-38px;left:50%;transform:translateX(-50%);background:#150f23;color:#fff;font-size:10px;font-weight:700;padding:6px 12px;border-radius:999px;white-space:nowrap;box-shadow:0 10px 20px -8px rgba(21,15,35,.5);z-index:2`)}>
                      Continue here
                      <span style={s(`position:absolute;left:50%;bottom:-3px;transform:translateX(-50%) rotate(45deg);width:7px;height:7px;background:#150f23`)}></span>
                    </div>
                  )}
                  {/* @ts-expect-error href only present on Link */}
                  <NodeTag {...nodeProps} style={s(`text-decoration:none;color:inherit;display:contents`)}>
                    <span
                      className={current ? "ping" : undefined}
                      style={s(
                        locked
                          ? `position:relative;width:52px;height:52px;border-radius:50%;background:rgba(124,58,237,.1);display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:inset 0 1.5px 2px rgba(255,255,255,.55),0 6px 14px -8px rgba(124,58,237,.22)`
                          : current
                          ? `position:relative;width:52px;height:52px;border-radius:50%;background:linear-gradient(140deg,#0369a1,#38bdf8);display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:inset 0 2px 3px rgba(255,255,255,.6),inset 0 -5px 9px rgba(0,0,0,.16),0 0 0 4px rgba(14,165,233,.2),0 10px 20px -8px rgba(14,165,233,.55);color:#0ea5e9;cursor:pointer`
                          : `position:relative;width:52px;height:52px;border-radius:50%;background:linear-gradient(140deg,#7c3aed,#a78bfa);display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:inset 0 2px 3px rgba(255,255,255,.6),inset 0 -5px 9px rgba(0,0,0,.16),0 10px 20px -8px rgba(124,58,237,.5)`
                      )}
                    >
                      {node.snow && (
                        <svg viewBox="0 0 40 18" style={s(`position:absolute;top:-15px;left:50%;transform:translateX(-50%);width:34px;height:15px;overflow:visible`)} aria-hidden="true">
                          <path d="M8,18 L20,4 L32,18 L26,15 L20,9 L14,15Z" fill="#fff" opacity={current ? 1 : 0.85} />
                        </svg>
                      )}
                      <span
                        style={s(
                          `position:absolute;left:-4px;top:-4px;width:18px;height:18px;border-radius:50%;background:${locked ? "#c7c0dc" : current ? "#0369a1" : "#7c3aed"};color:#fff;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center;border:2px solid #fff${locked ? "" : ";box-shadow:0 2px 4px rgba(0,0,0,.2)"}`
                        )}
                      >
                        {node.n}
                      </span>
                      <Ic name={node.icon} style={s(`width:21px;height:21px;stroke:${locked ? "#a79fbe" : "#fff"}`)} />
                      {locked && (
                        <span style={s(`position:absolute;right:-3px;bottom:-3px;width:19px;height:19px;border-radius:50%;background:#fff;border:1px solid rgba(124,58,237,.25);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 5px rgba(0,0,0,.14)`)}>
                          <Ic name="ic-lock" style={s(`width:10px;height:10px;stroke:#8a7fa8;stroke-width:2.2`)} />
                        </span>
                      )}
                    </span>
                  </NodeTag>
                  <div style={s(`font-size:10.5px;font-weight:${current ? 700 : 600};text-align:center;line-height:1.25;color:${locked ? "#9a8fb5" : current ? "#1f1633" : "#3d3653"}`)}>
                    {node.label}{node.label2 ? <><br />{node.label2}</> : null}
                  </div>
                  <div style={s(`font-size:9.5px;font-weight:700;color:${locked ? "#b3abc7" : current ? "#0ea5e9" : "#7c3aed"}`)}>{node.pct}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CONTINUE LEARNING */}
      <div className="glass" style={s(`border-radius:18px;padding:24px;position:relative;overflow:hidden;margin-top:20px`)}>
        <div style={s(`position:absolute;right:-60px;top:-60px;width:200px;height:200px;border-radius:50%;background:radial-gradient(circle,rgba(56,189,248,.28),transparent 68%);filter:blur(24px)`)}></div>
        <div style={s(`position:relative;display:flex;align-items:center;gap:22px`)}>
          <div style={s(`flex:1;min-width:0`)}>
            <div className="eyebrow">Continue climbing</div>
            <h2 className="disp" style={s(`font-size:22px;font-weight:600;margin-top:8px`)}>TCP Deep Dive</h2>
            <p style={s(`font-size:13px;color:#6a6480;margin-top:4px`)}>Networking · Camp 2 of 2 on this ridge · Concepts</p>
            <div style={s(`display:flex;justify-content:space-between;font-size:11px;color:#9a8fb5;margin:16px 0 6px`)}><span>Progress up the slope</span><span>60%</span></div>
            <div className="bar" style={s(`height:9px`)}><i className="barfx" style={s(`width:60%`)}></i></div>
            <div style={s(`display:flex;align-items:center;gap:14px;margin-top:18px`)}>
              <Link href="/learn/modules/networking" className="btn btn-v">
                Resume climb <Ic name="ic-arrow" style={s(`width:15px;height:15px`)} /><LinkPending />
              </Link>
              <span style={s(`font-size:12px;color:#9a8fb5`)}>Next: UDP, DNS &amp; DHCP</span>
            </div>
          </div>
          <div style={s(`width:172px;flex:none;height:150px;position:relative;display:flex;align-items:center;justify-content:center`)}>
            <svg viewBox="0 0 180 150" style={s(`width:100%;height:100%`)}>
              <path d="M0,150 L20,110 L55,130 L90,60 L130,95 L180,40 L180,150Z" fill="#0b0715" opacity={0.9} />
              <path d="M60,86 L90,60 L118,80 L102,76 L90,66 L80,76Z" fill="#fff" opacity={0.9} />
              <circle cx="150" cy="30" r="16" fill="rgba(56,189,248,.18)" />
              <path d="M150 30 q5 -5 10 0 q5 -5 10 0" fill="none" stroke="#38bdf8" strokeWidth={1.6} strokeLinecap="round" />
              <line x1="90" y1="60" x2="90" y2="38" stroke="#38bdf8" strokeWidth={2} />
              <path d="M90,38 L110,46 L90,54Z" fill="#38bdf8" />
            </svg>
          </div>
        </div>
      </div>

      {/* HANDS-ON LABS */}
      <div style={s(`margin-top:20px`)}>
        <div style={s(`display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin-bottom:12px`)}>
          <div className="eyebrow">Hands-on labs · Footprinting &amp; Reconnaissance</div>
          <span style={s(`font-size:11px;color:#9a8fb5`)}>Simulated target — nothing leaves the lab</span>
        </div>
        <div style={s(`display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px`)}>

        </div>
      </div>

      {/* GRID: peak cards + side panel */}
      <div style={s(`display:grid;grid-template-columns:1fr 320px;gap:20px;align-items:start;margin-top:20px`)}>
        <div>
          <div style={s(`display:grid;grid-template-columns:repeat(2,1fr);gap:18px`)}>
            {SUBJECTS.map((subj) => (
              <SubjectCard key={subj.n} subj={subj} />
            ))}
          </div>
        </div>

        <div style={s(`display:flex;flex-direction:column;gap:16px`)}>
          <div className="card" style={s(`padding:20px;position:relative;overflow:hidden`)}>
            <div style={s(`position:absolute;right:-30px;top:-30px;width:120px;height:120px;border-radius:50%;background:radial-gradient(circle,rgba(251,113,133,.22),transparent 70%);filter:blur(14px)`)}></div>
            <div style={s(`display:flex;align-items:center;gap:12px;position:relative`)}>
              <span style={s(`width:44px;height:44px;border-radius:12px;background:rgba(251,113,133,.12);display:flex;align-items:center;justify-content:center;flex:none`)}>
                <Ic name="ic-flame" cls="ic flame-ic" style={s(`stroke:none;fill:#fb7185;width:22px;height:22px`)} />
              </span>
              <div><div className="disp" style={s(`font-size:17px;font-weight:700`)}>7-day camp streak</div><div style={s(`font-size:11px;color:#9a8fb5`)}>Best: 12 nights</div></div>
            </div>
            <div style={s(`display:flex;justify-content:space-between;margin-top:14px`)}>
              {["M", "T", "W", "T", "F"].map((d, i) => (
                <span key={i} style={s(`width:28px;height:28px;border-radius:999px;background:#7c3aed;color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600`)}>{d}</span>
              ))}
              {["S", "S"].map((d, i) => (
                <span key={i} style={s(`width:28px;height:28px;border-radius:999px;background:rgba(124,58,237,.14);color:#9a8fb5;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600`)}>{d}</span>
              ))}
            </div>
          </div>
          <div className="card" style={s(`padding:20px`)}>
            <div className="eyebrow" style={s(`margin-bottom:12px`)}>Trail rations (daily quests)</div>
            <div style={s(`display:flex;flex-direction:column;gap:13px`)}>
              <div>
                <div style={s(`display:flex;justify-content:space-between;font-size:12px;margin-bottom:5px`)}><span>Earn 50 XP</span><span style={s(`color:#9a8fb5`)}>30/50</span></div>
                <div className="bar" style={s(`height:7px`)}><i className="barfx" style={s(`width:60%`)}></i></div>
              </div>
              <div>
                <div style={s(`display:flex;justify-content:space-between;font-size:12px;margin-bottom:5px`)}><span>Complete 1 lesson</span><span style={s(`color:#9a8fb5`)}>0/1</span></div>
                <div className="bar" style={s(`height:7px`)}><i className="barfx" style={s(`width:4%`)}></i></div>
              </div>
              <div>
                <div style={s(`display:flex;justify-content:space-between;font-size:12px;margin-bottom:5px`)}><span>3 activities</span><span style={s(`color:#9a8fb5`)}>1/3</span></div>
                <div className="bar" style={s(`height:7px`)}><i className="barfx" style={s(`width:33%`)}></i></div>
              </div>
            </div>
          </div>
          <div className="card" style={s(`padding:20px`)}>
            <div className="eyebrow" style={s(`margin-bottom:6px`)}>Recent activity</div>
            {ACTIVITY.map((a, i) => (
              <div key={a.text} style={s(`display:flex;align-items:flex-start;gap:11px;padding:11px 0;${i ? "border-top:1px solid rgba(124,58,237,.1)" : ""}`)}>
                <span style={s(`width:30px;height:30px;border-radius:9px;background:${a.color}22;display:flex;align-items:center;justify-content:center;flex:none`)}>
                  <Ic name={a.icon} style={s(`width:15px;height:15px;stroke:${a.color}`)} />
                </span>
                <div style={s(`flex:1;min-width:0`)}>
                  <div style={s(`font-size:12.5px;font-weight:600;color:#150f23;line-height:1.4`)}>{a.text}</div>
                  <div style={s(`font-size:11px;color:#9a8fb5`)}>{a.time}</div>
                </div>
                {a.xp !== undefined && <span style={s(`flex:none;font-size:10px;font-weight:800;color:#92400e;padding:3px 8px;border-radius:999px;background:linear-gradient(180deg,#fde68a,#fbbf24);white-space:nowrap`)}>+{a.xp}</span>}
              </div>
            ))}
          </div>
          <div className="card lift" style={s(`padding:20px;overflow:hidden`)}>
            <div style={s(`display:flex;align-items:flex-start;justify-content:space-between;gap:8px`)}>
              <div>
                <div className="disp" style={s(`font-size:14px;font-weight:600`)}>Badges earned</div>
                <div style={s(`font-size:11px;color:#9a8fb5;margin-top:2px`)}>3 of 7 summit badges</div>
              </div>
            </div>
            <div style={s(`display:flex;gap:10px;margin-top:15px;flex-wrap:wrap`)}>
              <span style={s(`width:44px;height:44px;border-radius:12px;background:linear-gradient(140deg,#7c3aed,#a78bfa);display:flex;align-items:center;justify-content:center;box-shadow:0 8px 16px -8px rgba(124,58,237,.5)`)}><Ic name="ic-shield" style={s(`stroke:#fff;width:20px;height:20px`)} /></span>
              <span style={s(`width:44px;height:44px;border-radius:12px;background:linear-gradient(140deg,#0d9488,#2dd4a7);display:flex;align-items:center;justify-content:center;box-shadow:0 8px 16px -8px rgba(13,148,136,.5)`)}><Ic name="ic-radar" style={s(`stroke:#fff;width:20px;height:20px`)} /></span>
              <span style={s(`width:44px;height:44px;border-radius:12px;background:linear-gradient(140deg,#0369a1,#38bdf8);display:flex;align-items:center;justify-content:center;box-shadow:0 8px 16px -8px rgba(14,165,233,.5)`)}><Ic name="ic-globe" style={s(`stroke:#fff;width:20px;height:20px`)} /></span>
              <span style={s(`width:44px;height:44px;border-radius:12px;background:rgba(124,58,237,.08);display:flex;align-items:center;justify-content:center;border:1.5px dashed rgba(124,58,237,.3)`)}><Ic name="ic-lock" style={s(`stroke:#b3abc7;width:18px;height:18px`)} /></span>
            </div>
            <button className="btn btn-g btn-s" style={s(`width:100%;margin-top:16px`)}>View all badges</button>
          </div>
          <div className="card lift" style={s(`padding:20px;overflow:hidden`)}>
            <div style={s(`display:flex;align-items:flex-start;justify-content:space-between;gap:8px`)}>
              <div>
                <div className="disp" style={s(`font-size:14px;font-weight:600`)}>Skill progress</div>
                <div style={s(`font-size:11px;color:#9a8fb5;margin-top:2px`)}>Coverage across all 7 tracks</div>
              </div>
              <span style={s(`font-size:9.5px;font-weight:700;letter-spacing:.3px;text-transform:uppercase;color:#5b21b6;background:rgba(124,58,237,.12);border:1px solid rgba(124,58,237,.2);border-radius:999px;padding:4px 9px;white-space:nowrap`)}>3 of 7</span>
            </div>

            <div style={s(`display:flex;flex-direction:column;gap:12px;margin-top:15px`)}>
              {[
                { key: "sec", label: "Security", icon: "ic-shield", pct: 75, color: "#7c3aed" },
                { key: "net", label: "Networking", icon: "ic-globe", pct: 35, color: "#38bdf8" },
                { key: "os", label: "Operating Systems", icon: "ic-cpu", pct: 29, color: "#a78bfa" },
                { key: "web", label: "Web Exploitation", icon: "ic-bug", pct: 17, color: "#fb7185" },
                { key: "off", label: "Offensive Ops", icon: "ic-swords", pct: 0, color: "#f43f5e" },
                { key: "blue", label: "Blue Team", icon: "ic-radar", pct: 8, color: "#2dd4a7" },
                { key: "cloud", label: "Cloud Security", icon: "ic-cloud", pct: 0, color: "#818cf8" },
              ].map((n) => (
                <div key={n.key} style={s(`display:flex;align-items:center;gap:10px`)}>
                  <span style={s(`width:28px;height:28px;border-radius:9px;background:rgba(124,58,237,.09);display:flex;align-items:center;justify-content:center;flex:none`)}>
                    <Ic name={n.icon} style={s(`width:14px;height:14px;stroke:${n.color}`)} />
                  </span>
                  <div style={s(`flex:1;min-width:0`)}>
                    <div style={s(`display:flex;align-items:center;justify-content:space-between;font-size:11.5px;margin-bottom:5px`)}>
                      <span style={s(`font-weight:600;color:#3d3653`)}>{n.label}</span>
                      <span className="mono" style={s(`color:#9a8fb5;font-weight:700;font-size:10.5px`)}>{n.pct}%</span>
                    </div>
                    <div className="bar" style={s(`height:6px`)}>
                      <i className="barfx" style={s(`width:${n.pct}%;background:${n.pct > 0 ? n.color : "transparent"}`)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="btn btn-g btn-s" style={s(`width:100%;margin-top:16px`)}>Open full skill tree</button>
          </div>
        </div>
      </div>
    </div>
  );
}
