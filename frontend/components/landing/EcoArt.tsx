/* Isometric scenes for the "More than courses" cards (static, light theme). */
import type { ReactNode } from "react";
import { Box, Star, BLUE, CYAN, NAVY, RED, GOLD, SILV, BRON, GRAY, WHITE, GREEN } from "./FeatureArt";

const F = "sans-serif";
const PURPLE = { t: "#c4b5fd", l: "#8b5cf6", r: "#6d28d9" };

function Scene({ tint, children }: { tint: string; children: ReactNode }) {
  return (
    <div className="mart" style={{ background: tint }} aria-hidden="true">
      <svg viewBox="0 0 400 290" preserveAspectRatio="xMidYMid meet">
        <defs><filter id="esh" x="-20%" y="-30%" width="140%" height="180%"><feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#0b1544" floodOpacity=".16" /></filter></defs>
        <ellipse cx="200" cy="262" rx="150" ry="20" fill="rgba(11,21,68,.12)" />
        <Box x={200} y={228} a={150} h={16} c={WHITE} />
        {children}
      </svg>
    </div>
  );
}
const Chip = ({ x, y, w, text, dot, bg = "#fff", fg = "#0b1544", stroke = "#dbe4f3" }: { x: number; y: number; w: number; text: string; dot?: string; bg?: string; fg?: string; stroke?: string }) => (
  <g>
    <rect x={x} y={y} width={w} height="26" rx="13" fill={bg} stroke={stroke} filter="url(#esh)" />
    {dot && <circle cx={x + 14} cy={y + 13} r="4.5" fill={dot} />}
    <text x={x + (dot ? 25 : w / 2)} y={y + 17} textAnchor={dot ? "start" : "middle"} fontSize="10.5" fontWeight="700" fill={fg} fontFamily={F}>{text}</text>
  </g>
);
/** Simple person: head + rounded torso standing on (x,y) = feet centre. */
const Person = ({ x, y, s = 1, body, head = "#fde2c8" }: { x: number; y: number; s?: number; body: string; head?: string }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-15 0c0-20 6-30 15-30s15 10 15 30z" fill={body} />
    <circle cy="-40" r="12" fill={head} />
    <path d="M-12 -44c2-9 22-9 24 0-6-4-18-4-24 0z" fill="#1b2a6b" />
  </g>
);

export function MentorArt() {
  return (
    <Scene tint="linear-gradient(140deg,#e4ecff,#f6f9ff)">
      <path d="M150 128 C 180 84, 230 84, 262 122" fill="none" stroke="#9db6ea" strokeWidth="3" strokeDasharray="2 9" strokeLinecap="round" />
      <Box x={128} y={214} a={44} h={16} c={BLUE} />
      <Person x={128} y={198} s={1.25} body="#1d4ed8" />
      <Box x={272} y={220} a={40} h={14} c={CYAN} />
      <Person x={272} y={206} s={1.05} body="#0891b2" head="#f3d0b0" />
      {/* review board */}
      <g transform="translate(176 96)"><polygon points="0,0 60,-30 60,20 0,50" fill="#fff" stroke="#c9d8f7" strokeWidth="2" filter="url(#esh)" />
        <line x1="10" y1="10" x2="46" y2="-8" stroke="#dbe4f3" strokeWidth="4" strokeLinecap="round" /><line x1="10" y1="22" x2="38" y2="8" stroke="#dbe4f3" strokeWidth="4" strokeLinecap="round" /><circle cx="46" cy="24" r="10" fill="#16a34a" /><path d="M41 24l4 4 7-8" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></g>
      <rect x="48" y="60" width="120" height="30" rx="14" fill="#fff" stroke="#dbe4f3" filter="url(#esh)" /><circle cx="70" cy="75" r="4" fill="#1d4ed8" /><circle cx="84" cy="75" r="4" fill="#06b6d4" /><circle cx="98" cy="75" r="4" fill="#f59e0b" /><rect x="112" y="71" width="42" height="8" rx="4" fill="#dbe4f3" />
      <Chip x={252} y={70} w={112} text="Code reviewed" dot="#16a34a" />
      <Chip x={40} y={136} w={72} text="MENTOR" bg="#0b1544" fg="#fff" stroke="#0b1544" />
      <Chip x={300} y={148} w={56} text="YOU" />
      <Star x={196} y={44} s={1.2} /><Star x={350} y={124} s={0.9} c="#67e8f9" />
    </Scene>
  );
}

export function WebinarArt() {
  return (
    <Scene tint="linear-gradient(140deg,#dff5fb,#f0f9fd)">
      {/* screen on stand */}
      <Box x={210} y={214} a={20} h={8} c={GRAY} />
      <polygon points="126,200 296,115 296,25 126,110" fill="#16245e" />
      <polygon points="134,196 288,119 288,32 134,109" fill="#0b1544" />
      <g transform="translate(228 66)"><circle r="14" fill="#3b4f9a" /><path d="M-25 38c2-17 12-21 25-21s23 4 25 21z" fill="#3b4f9a" /></g>
      <g strokeLinecap="round" strokeWidth="5"><line x1="150" y1="128" x2="196" y2="105" stroke="#22d3ee" /><line x1="150" y1="144" x2="186" y2="126" stroke="#3b4f9a" /><line x1="150" y1="160" x2="202" y2="134" stroke="#3b4f9a" /></g>
      <circle cx="152" cy="98" r="5" fill="#ef4444" />
      {/* audience */}
      {[[100, 226, "#f59e0b"], [156, 244, "#1d4ed8"], [212, 248, "#06b6d4"], [268, 240, "#8b5cf6"]].map(([x, y, c], i) => (
        <g key={i}><Box x={x as number} y={y as number} a={22} h={9} c={GRAY} /><Person x={x as number} y={(y as number) - 8} s={0.62} body={c as string} /></g>
      ))}
      <Chip x={36} y={44} w={92} text="LIVE" bg="#dc2626" fg="#fff" stroke="#dc2626" />
      <Chip x={252} y={20} w={130} text="128 learners" dot="#06b6d4" />
      <Chip x={292} y={172} w={92} text="Q&A open" dot="#16a34a" />
      <Star x={90} y={110} s={1.1} c="#67e8f9" />
    </Scene>
  );
}

export function BoardArt() {
  return (
    <Scene tint="linear-gradient(140deg,#fff2d6,#fffaf0)">
      {/* rank panel behind */}
      <polygon points="96,150 200,98 304,150 200,202" fill="none" />
      <polygon points="230,118 322,72 322,142 230,188" fill="#fff" stroke="#f0dfae" strokeWidth="2" filter="url(#esh)" />
      {[0, 1, 2].map((i) => <g key={i}><circle cx="244" cy={128 + i * 18 - i * 6} r="4.5" fill={["#f59e0b", "#94a3b8", "#f97316"][i]} /><line x1="254" y1={126 + i * 12} x2={296 - i * 6} y2={104 + i * 12 - 4 - i * 3} stroke="#eadfbd" strokeWidth="5" strokeLinecap="round" /></g>)}
      <Box x={130} y={232} a={44} h={46} c={SILV} /><Box x={270} y={232} a={44} h={30} c={BRON} /><Box x={200} y={222} a={48} h={78} c={GOLD} />
      <text x="130" y="200" textAnchor="middle" fontSize="20" fontWeight="800" fill="#fff" fontFamily={F}>2</text><text x="270" y="216" textAnchor="middle" fontSize="20" fontWeight="800" fill="#fff" fontFamily={F}>3</text><text x="200" y="176" textAnchor="middle" fontSize="24" fontWeight="800" fill="#fff" fontFamily={F}>1</text>
      <Person x={200} y={144} s={1} body="#f59e0b" /><Person x={130} y={186} s={0.85} body="#64748b" /><Person x={270} y={202} s={0.8} body="#f97316" />
      <path d="M182 76l10 12 8-14 8 14 10-12-3 22h-30z" fill="#fbbf24" stroke="#f59e0b" strokeWidth="2" strokeLinejoin="round" />
      <Chip x={30} y={56} w={104} text="SEASON 1" bg="#0b1544" fg="#fff" stroke="#0b1544" />
      <Chip x={272} y={176} w={104} text="#142 ▲ 12" dot="#16a34a" />
      {[[70, 120], [340, 60], [352, 210], [56, 190]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="4" fill={["#f43f5e", "#06b6d4", "#f59e0b", "#8b5cf6"][i]} />)}
      <Star x={100} y={90} s={1.1} /><Star x={330} y={110} s={0.8} c="#fb7185" />
    </Scene>
  );
}

export function ThreatArt() {
  const nodes: [number, number, typeof BLUE][] = [[86, 206, RED as typeof BLUE], [150, 174, PURPLE], [214, 206, PURPLE], [278, 174, PURPLE], [330, 210, GREEN as typeof BLUE]];
  return (
    <Scene tint="linear-gradient(140deg,#ece8ff,#f8f6ff)">
      <g stroke="#c9bdf5" strokeWidth="3" fill="none"><polyline points="86,190 150,158 214,190 278,158 330,194" /><polyline points="150,158 214,126 278,158" /></g>
      <polyline points="86,190 150,158 214,190 278,158" fill="none" stroke="#ef4444" strokeWidth="4" strokeDasharray="8 8" strokeLinecap="round" />
      <Box x={214} y={150} a={26} h={28} c={PURPLE} />
      {nodes.map(([x, y, c], i) => <Box key={i} x={x} y={y} a={i === 4 || i === 0 ? 26 : 24} h={i === 4 ? 30 : 22} c={c} />)}
      <g transform="translate(330 150)"><path d="M0 -20l17 6v12c0 10-7 16-17 21-10-5-17-11-17-21v-12z" fill="#16a34a" /><path d="M-6 -3l5 5 9-11" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" /></g>
      <g transform="translate(86 152)"><circle r="14" fill="#fff" stroke="#ef4444" strokeWidth="3" /><path d="M-5 -5l10 10M5 -5l-10 10" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" /></g>
      <rect x="140" y="52" width="122" height="46" rx="12" fill="#fff" stroke="#dcd3fa" filter="url(#esh)" /><text x="154" y="70" fontSize="10.5" fontWeight="700" fill="#0b1544" fontFamily={F}>Threat card</text><text x="154" y="86" fontSize="10" fill="#526080" fontFamily={F}>Phishing → Foothold → Exfil</text>
      <Chip x={28} y={66} w={96} text="Attacker" dot="#ef4444" />
      <Chip x={286} y={108} w={96} text="Risk 7.4" bg="#0b1544" fg="#fff" stroke="#0b1544" />
      
      <Star x={112} y={40} s={1} c="#8b5cf6" /><Star x={330} y={44} s={0.9} />
    </Scene>
  );
}
