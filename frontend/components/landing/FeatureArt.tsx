/* Isometric "glass tile" scenes for the platform feature cards (static, light theme). */
import type { ReactNode } from "react";

export type Tone = { t: string; l: string; r: string };
export const BLUE: Tone = { t: "#7fb0ff", l: "#3b74ee", r: "#1d4ed8" };
export const CYAN: Tone = { t: "#67e8f9", l: "#0ea5c6", r: "#0e7490" };
export const NAVY: Tone = { t: "#3b4f9a", l: "#1b2a6b", r: "#0b1544" };
export const RED: Tone = { t: "#fca5a5", l: "#ef4444", r: "#b91c1c" };
export const GOLD: Tone = { t: "#fde68a", l: "#f5b62c", r: "#d97706" };
export const SILV: Tone = { t: "#e2e8f0", l: "#a9b6c9", r: "#8494ab" };
export const BRON: Tone = { t: "#fed7aa", l: "#f59e5b", r: "#d9691f" };
export const GRAY: Tone = { t: "#e5eaf3", l: "#c4cddd", r: "#aab5c9" };
export const WHITE: Tone = { t: "#ffffff", l: "#dbe6fb", r: "#c3d3f2" };
export const GREEN: Tone = { t: "#86efac", l: "#22c55e", r: "#15803d" };

/** Isometric box. (x,y) = centre of the base rhombus; a = half-width; h = height. */
export function Box({ x, y, a, h, c, children }: { x: number; y: number; a: number; h: number; c: Tone; children?: ReactNode }) {
  const ty = y - h;
  return (
    <g>
      <polygon points={`${x - a},${ty} ${x},${ty + a / 2} ${x},${y + a / 2} ${x - a},${y}`} fill={c.l} />
      <polygon points={`${x + a},${ty} ${x},${ty + a / 2} ${x},${y + a / 2} ${x + a},${y}`} fill={c.r} />
      <polygon points={`${x},${ty - a / 2} ${x + a},${ty} ${x},${ty + a / 2} ${x - a},${ty}`} fill={c.t} />
      {children}
    </g>
  );
}

function Scene({ tint, children }: { tint: string; children: ReactNode }) {
  return (
    <div className="fart" style={{ background: tint }} aria-hidden="true">
      <svg viewBox="0 0 320 244" preserveAspectRatio="xMidYMid meet">
        <ellipse cx="160" cy="212" rx="120" ry="19" fill="rgba(11,21,68,.13)" />
        <Box x={160} y={176} a={122} h={14} c={WHITE} />
        <polygon points="160,120 282,162 160,176 38,162" fill="none" />
        {children}
      </svg>
    </div>
  );
}

export const Flag = ({ x, y, h = 46, c = "#ef4444" }: { x: number; y: number; h?: number; c?: string }) => (
  <g><line x1={x} y1={y} x2={x} y2={y - h} stroke="#0b1544" strokeWidth="3" strokeLinecap="round" /><polygon points={`${x},${y - h} ${x + 26},${y - h + 8} ${x},${y - h + 17}`} fill={c} /></g>
);
export const Star = ({ x, y, s = 1, c = "#fbbf24" }: { x: number; y: number; s?: number; c?: string }) => (
  <path transform={`translate(${x} ${y}) scale(${s})`} d="M0 -8l2.4 5 5.6.7-4.1 3.8 1.1 5.5L0 4.2l-5 2.8 1.1-5.5L-8 -2.3l5.6-.7z" fill={c} />
);

export function ArtSkillTree() {
  const steps = [
    { x: 74, y: 176, h: 14, c: BLUE }, { x: 126, y: 154, h: 32, c: BLUE }, { x: 178, y: 132, h: 50, c: CYAN }, { x: 230, y: 110, h: 68, c: GRAY },
  ];
  return (
    <Scene tint="linear-gradient(140deg,#e4eeff,#f5f9ff)">
      {[...steps].reverse().map((s, i) => (
        <Box key={i} x={s.x} y={s.y - 8} a={27} h={s.h} c={s.c}>
          {i === 3 && <path d={`M${s.x - 6} ${s.y - 8 - s.h + 2}l4 4 8-9`} fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
        </Box>
      ))}
      <g fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d={`M${steps[0].x - 5} ${steps[0].y - 8 - 14 + 2}l4 4 8-9`} /><path d={`M${steps[1].x - 5} ${steps[1].y - 8 - 32 + 2}l4 4 8-9`} />
      </g>
      <g transform={`translate(${steps[3].x} ${steps[3].y - 8 - 68})`}><rect x="-8" y="-4" width="16" height="12" rx="3" fill="#8a97b5" /><path d="M-4 -4v-4a4 4 0 0 1 8 0v4" fill="none" stroke="#8a97b5" strokeWidth="2.5" /></g>
      <Flag x={steps[2].x} y={steps[2].y - 8 - 50} h={40} c="#1d4ed8" />
      <Star x={98} y={62} s={1.2} /><Star x={252} y={58} s={0.9} /><Star x={214} y={30} s={0.7} c="#67e8f9" />
      <rect x="112" y="98" width="64" height="20" rx="10" fill="#0b1544" /><text x="144" y="112" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#fff" fontFamily="sans-serif">LEVEL 3</text>
    </Scene>
  );
}

export function ArtLab() {
  const leds = [0, 1, 2, 3, 4];
  return (
    <Scene tint="linear-gradient(140deg,#dff5fb,#eef5ff)">
      {/* server rack */}
      <Box x={92} y={168} a={34} h={92} c={NAVY}>
        {leds.map((i) => (
          <g key={i}><polygon points={`${58 + 6},${168 - 84 + i * 16 + 3} ${92 - 6},${168 - 84 + i * 16 + 3 + 14} ${92 - 6},${168 - 84 + i * 16 + 3 + 21} ${58 + 6},${168 - 84 + i * 16 + 3 + 7}`} fill="#26397f" /><circle cx={66} cy={168 - 84 + i * 16 + 8} r="2" fill={i % 2 ? "#4ade80" : "#22d3ee"} /></g>
        ))}
      </Box>
      {/* laptop */}
      <Box x={200} y={170} a={46} h={7} c={WHITE} />
      <polygon points="154,140 200,118 246,140 246,88 200,66 154,88" fill="none" />
      <polygon points="202,120 246,142 246,86 202,64" fill="#0b1544" />
      <polygon points="206,72 240,90 240,132 206,114" fill="#101d5c" />
      <g strokeLinecap="round" strokeWidth="3.2">
        <line x1="210" y1="82" x2="234" y2="94" stroke="#4ade80" /><line x1="210" y1="94" x2="228" y2="103" stroke="#67e8f9" /><line x1="210" y1="106" x2="232" y2="117" stroke="#67e8f9" /><line x1="210" y1="118" x2="222" y2="124" stroke="#fbbf24" />
      </g>
      <rect x="120" y="46" width="70" height="22" rx="11" fill="#fff" stroke="#c6e3ee" /><circle cx="134" cy="57" r="4" fill="#22c55e" /><text x="144" y="61" fontSize="10" fontWeight="700" fill="#0b1544" fontFamily="sans-serif">DVWA · live</text>
      <rect x="236" y="38" width="62" height="22" rx="11" fill="#1d4ed8" /><text x="267" y="52.5" textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff" fontFamily="sans-serif">+60 XP</text>
    </Scene>
  );
}

export function ArtCtf() {
  return (
    <Scene tint="linear-gradient(140deg,#ffe9ec,#fff6ee)">
      <ellipse cx="160" cy="166" rx="92" ry="20" fill="none" stroke="#f9b5bd" strokeWidth="2" strokeDasharray="4 6" />
      <Box x={106} y={168} a={30} h={26} c={SILV}><text x={106 + 15} y={168 - 26 + 22} fontSize="14" fontWeight="800" fill="#fff" fontFamily="sans-serif" textAnchor="middle" transform={`skewY(0)`}>2</text></Box>
      <Box x={214} y={168} a={30} h={16} c={BRON} />
      <Box x={160} y={158} a={34} h={54} c={GOLD} />
      <text x="160" y="122" textAnchor="middle" fontSize="20" fontWeight="800" fill="#fff" fontFamily="sans-serif" opacity=".95">1</text>
      <Flag x={160} y={158 - 54} h={52} />
      <Star x={98} y={70} s={1.1} /><Star x={228} y={56} s={0.9} />
      <rect x="40" y="40" width="82" height="24" rx="12" fill="#fff" stroke="#f6c9ce" /><text x="81" y="56" textAnchor="middle" fontSize="10" fontWeight="700" fill="#b91c1c" fontFamily="sans-serif">FLAG CAPTURED</text>
      <rect x="226" y="96" width="60" height="22" rx="11" fill="#dc2626" /><text x="256" y="110.5" textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff" fontFamily="sans-serif">+120 XP</text>
    </Scene>
  );
}

export function ArtBattle() {
  return (
    <Scene tint="linear-gradient(120deg,#ffe9ec 0%,#eef3ff 100%)">
      <Box x={92} y={170} a={38} h={62} c={RED}>
        <path d="M74 132l14 6 14-6v10c0 8-6 13-14 17-8-4-14-9-14-17z" fill="#fff" transform="translate(-6 -6) scale(.9)" opacity=".95" />
      </Box>
      <Box x={228} y={170} a={38} h={62} c={BLUE}>
        <path d="M74 132l14 6 14-6v10c0 8-6 13-14 17-8-4-14-9-14-17z" fill="#fff" transform="translate(140 -6) scale(.9)" opacity=".95" />
      </Box>
      <polygon points="168,84 148,122 162,122 154,152 184,110 168,110 178,84" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="160" cy="70" r="20" fill="#0b1544" /><text x="160" y="75" textAnchor="middle" fontSize="13" fontWeight="800" fill="#fff" fontFamily="sans-serif">VS</text>
      <rect x="34" y="34" width="62" height="20" rx="10" fill="#fff" stroke="#f6c9ce" /><text x="65" y="48" textAnchor="middle" fontSize="10" fontWeight="800" fill="#b91c1c" fontFamily="sans-serif">RED 1,240</text>
      <rect x="224" y="34" width="66" height="20" rx="10" fill="#fff" stroke="#c3d5fb" /><text x="257" y="48" textAnchor="middle" fontSize="10" fontWeight="800" fill="#1d4ed8" fontFamily="sans-serif">BLUE 1,410</text>
    </Scene>
  );
}

export function ArtSoc() {
  return (
    <Scene tint="linear-gradient(140deg,#dcf3fa,#eaf1ff)">
      <ellipse cx="160" cy="160" rx="96" ry="30" fill="#fff" opacity=".65" /><ellipse cx="160" cy="160" rx="68" ry="21" fill="none" stroke="#7dd3e8" strokeWidth="2" /><ellipse cx="160" cy="160" rx="38" ry="12" fill="none" stroke="#7dd3e8" strokeWidth="2" />
      <path d="M160 160L232 140A78 26 0 0 0 160 134z" fill="#06b6d4" opacity=".28" />
      <line x1="160" y1="160" x2="232" y2="140" stroke="#0891b2" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="198" cy="150" r="5" fill="#ef4444" /><circle cx="198" cy="150" r="10" fill="none" stroke="#ef4444" strokeWidth="2" opacity=".5" /><circle cx="120" cy="164" r="4" fill="#22c55e" /><circle cx="140" cy="148" r="3.5" fill="#f59e0b" />
      <Box x={82} y={160} a={30} h={40} c={NAVY}>
        <polyline points="58,132 68,126 74,134 80,120 88,128" fill="none" stroke="#22d3ee" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" transform="translate(-4 2)" />
      </Box>
      <path d="M160 26l26 9v18c0 14-11 24-26 31-15-7-26-17-26-31V35z" fill="#1d4ed8" /><path d="M160 34l19 7v12c0 10-8 17-19 22-11-5-19-12-19-22V41z" fill="#3b74ee" />
      <path d="M150 54l7 7 14-15" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="216" y="70" width="72" height="20" rx="10" fill="#fff" stroke="#c6e3ee" /><circle cx="229" cy="80" r="4" fill="#ef4444" /><text x="238" y="84" fontSize="9.5" fontWeight="700" fill="#0b1544" fontFamily="sans-serif">Threat found</text>
    </Scene>
  );
}

export function ArtCert() {
  return (
    <Scene tint="linear-gradient(140deg,#fff3d6,#fffaf0)">
      <polygon points="92,144 200,102 248,124 140,166" fill="#fff" stroke="#f0dfae" strokeWidth="2" />
      <polygon points="92,144 200,102 200,60 92,102" fill="#fff" stroke="#f0dfae" strokeWidth="2" />
      <polygon points="200,102 248,124 248,82 200,60" fill="#fff7e0" stroke="#f0dfae" strokeWidth="2" />
      <g transform="matrix(1 -.39 0 1 0 0)">
        <text x="103" y="130" fontSize="8" fontWeight="700" letterSpacing="2.2" fill="#b45309" fontFamily="sans-serif">CERTIFICATE</text>
        <text x="103" y="152" fontSize="19" fontWeight="800" fill="#0b1544" fontFamily="sans-serif">CCSF</text>
        <rect x="103" y="160" width="70" height="4" rx="2" fill="#e9dcb4" /><rect x="103" y="169" width="48" height="4" rx="2" fill="#e9dcb4" />
      </g>
      <g transform="translate(232 120)"><path d="M-12 14l-7 24 14-7 6 10 4-26z" fill="#1d4ed8" /><path d="M12 14l7 24-14-7-6 10-4-26z" fill="#3b74ee" /><circle r="24" fill="#f59e0b" /><circle r="18" fill="#fbbf24" /><circle r="18" fill="none" stroke="#fff" strokeWidth="2" opacity=".7" /><path d="M-8 0l6 6 11-12" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></g>
      <Star x={80} y={54} s={1.2} /><Star x={270} y={60} s={0.9} /><Star x={120} y={34} s={0.7} c="#f59e0b" />
      <rect x="42" y="150" width="60" height="20" rx="10" fill="#16a34a" /><text x="72" y="164" textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff" fontFamily="sans-serif">VERIFIED</text>
    </Scene>
  );
}
