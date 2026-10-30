/* Large isometric scenes for the four feature deep-dives (static, light theme). */
import type { ReactNode } from "react";
import { Box, Flag, Star, BLUE, CYAN, NAVY, RED, GOLD, SILV, BRON, GRAY, WHITE, GREEN } from "./FeatureArt";

const F = "sans-serif";

function Scene({ tint, glow, children }: { tint: string; glow: string; children: ReactNode }) {
  return (
    <div className="dscene" style={{ background: tint }} aria-hidden="true">
      <div className="dglow" style={{ background: glow }} />
      <svg viewBox="0 0 560 440" preserveAspectRatio="xMidYMid meet">
        <ellipse cx="280" cy="398" rx="232" ry="28" fill="rgba(11,21,68,.12)" />
        <Box x={280} y={332} a={232} h={22} c={WHITE} />
        {children}
      </svg>
    </div>
  );
}

function Chip({ x, y, w, text, dot, bg = "#fff", fg = "#0b1544", stroke = "#dbe4f3" }: { x: number; y: number; w: number; text: string; dot?: string; bg?: string; fg?: string; stroke?: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height="30" rx="15" fill={bg} stroke={stroke} filter="url(#sh)" />
      {dot && <circle cx={x + 16} cy={y + 15} r="5" fill={dot} />}
      <text x={x + (dot ? 28 : w / 2)} y={y + 19.5} textAnchor={dot ? "start" : "middle"} fontSize="12" fontWeight="700" fill={fg} fontFamily={F}>{text}</text>
    </g>
  );
}
const Defs = () => (
  <defs><filter id="sh" x="-20%" y="-30%" width="140%" height="180%"><feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#0b1544" floodOpacity=".18" /></filter></defs>
);
/** Screen on a plane that rises to the right (matches the right face of a Box). */
const ScreenR = ({ x, y, w, h, fill = "#0b1544", children }: { x: number; y: number; w: number; h: number; fill?: string; children?: ReactNode }) => (
  <g><polygon points={`${x},${y} ${x + w},${y - w / 2} ${x + w},${y - w / 2 + h} ${x},${y + h}`} fill={fill} />{children}</g>
);
const LineR = ({ x, y, len, c, sw = 4 }: { x: number; y: number; len: number; c: string; sw?: number }) => <line x1={x} y1={y} x2={x + len} y2={y - len / 2} stroke={c} strokeWidth={sw} strokeLinecap="round" />;
/** Screen on a plane that falls to the right (left face of a Box). */
const LineL = ({ x, y, len, c, sw = 4 }: { x: number; y: number; len: number; c: string; sw?: number }) => <line x1={x} y1={y} x2={x + len} y2={y + len / 2} stroke={c} strokeWidth={sw} strokeLinecap="round" />;

export function LabVisual() {
  return (
    <Scene tint="linear-gradient(140deg,#dff5fb,#eef3ff)" glow="radial-gradient(circle,rgba(6,182,212,.35),transparent 68%)">
      <Defs />
      {/* dashed data links */}
      <g fill="none" stroke="#7dd3e8" strokeWidth="3" strokeDasharray="2 9" strokeLinecap="round"><path d="M250 250 C 300 190, 330 190, 372 210" /><path d="M420 120 C 420 90, 420 80, 420 70" /></g>
      {/* server racks */}
      <Box x={168} y={326} a={44} h={132} c={NAVY}>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => <g key={i}><polygon points={`${130},${326 - 122 + i * 17} ${162},${326 - 122 + i * 17 + 16} ${162},${326 - 122 + i * 17 + 25} ${130},${326 - 122 + i * 17 + 9}`} fill="#26397f" /><circle cx="139" cy={326 - 122 + i * 17 + 11} r="2.4" fill={i % 3 ? "#4ade80" : "#22d3ee"} /></g>)}
      </Box>
      <Box x={236} y={352} a={44} h={96} c={NAVY}>
        {[0, 1, 2, 3, 4].map((i) => <g key={i}><polygon points={`198,${352 - 88 + i * 17} 230,${352 - 88 + i * 17 + 16} 230,${352 - 88 + i * 17 + 25} 198,${352 - 88 + i * 17 + 9}`} fill="#26397f" /><circle cx="207" cy={352 - 88 + i * 17 + 11} r="2.4" fill={i % 2 ? "#22d3ee" : "#4ade80"} /></g>)}
      </Box>
      {/* desk + monitor */}
      <Box x={388} y={344} a={78} h={12} c={WHITE} />
      <polygon points="386,332 398,326 410,332 398,338" fill="#c4cddd" /><rect x="394" y="292" width="8" height="40" fill="#aab5c9" />
      <ScreenR x={330} y={290} w={130} h={106}>
        <rect x="0" y="0" width="0" height="0" />
        <LineR x={344} y={286} len={70} c="#4ade80" /><LineR x={344} y={300} len={96} c="#67e8f9" /><LineR x={344} y={314} len={54} c="#67e8f9" /><LineR x={344} y={328} len={84} c="#fbbf24" /><LineR x={344} y={342} len={40} c="#4ade80" /><LineR x={344} y={356} len={62} c="#67e8f9" />
      </ScreenR>
      <polygon points="330,290 460,225 460,231 330,296" fill="#3b4f9a" />
      {/* floating chips */}
      <Chip x={60} y={70} w={168} text="Kali terminal · live" dot="#22c55e" />
      <Chip x={330} y={44} w={188} text="DVWA · SQL injection" dot="#ef4444" />
      <Chip x={44} y={150} w={92} text="+60 XP" bg="#1d4ed8" fg="#fff" stroke="#1d4ed8" />
      <Chip x={410} y={128} w={116} text="Flag found ✓" bg="#16a34a" fg="#fff" stroke="#16a34a" />
      <Star x={300} y={84} s={1.6} /><Star x={220} y={40} s={1} c="#67e8f9" />
    </Scene>
  );
}

export function CtfVisual() {
  return (
    <Scene tint="linear-gradient(140deg,#ffe9ec,#fff6ee)" glow="radial-gradient(circle,rgba(244,63,94,.3),transparent 68%)">
      <Defs />
      <ellipse cx="280" cy="308" rx="176" ry="46" fill="none" stroke="#f9b5bd" strokeWidth="2.5" strokeDasharray="5 8" />
      <ellipse cx="280" cy="308" rx="112" ry="30" fill="none" stroke="#f9b5bd" strokeWidth="2.5" strokeDasharray="5 8" />
      <Box x={188} y={346} a={58} h={70} c={SILV} />
      <Box x={372} y={346} a={58} h={44} c={BRON} />
      <Box x={280} y={332} a={62} h={108} c={GOLD} />
      <text x="188" y="322" textAnchor="middle" fontSize="26" fontWeight="800" fill="#fff" fontFamily={F} transform="skewY(0)">2</text>
      <text x="372" y="338" textAnchor="middle" fontSize="26" fontWeight="800" fill="#fff" fontFamily={F}>3</text>
      <Flag x={280} y={332 - 108} h={92} />
      <g transform="translate(280 148)"><Star x={0} y={-6} s={0} /></g>
      {/* trophy */}
      <g transform="translate(188 262)"><path d="M-14 -22h28v14c0 10-6 16-14 18-8-2-14-8-14-18z" fill="#fbbf24" /><rect x="-4" y="10" width="8" height="8" fill="#f59e0b" /><rect x="-12" y="18" width="24" height="6" rx="2" fill="#d97706" /></g>
      {/* category chips */}
      <g stroke="#f4b6bd" strokeWidth="2" strokeDasharray="3 6" fill="none"><path d="M120 120 L 240 250" /><path d="M440 110 L 320 250" /><path d="M70 230 L 190 300" /><path d="M492 236 L 380 300" /></g>
      <Chip x={64} y={88} w={112} text="WEB · 120" dot="#16a34a" />
      <Chip x={392} y={78} w={120} text="PWN · 350" dot="#dc2626" />
      <Chip x={26} y={206} w={128} text="CRYPTO · 220" dot="#f59e0b" />
      <Chip x={410} y={214} w={140} text="FORENSICS · 100" dot="#7c3aed" />
      <Chip x={200} y={28} w={160} text="FLAG CAPTURED" bg="#dc2626" fg="#fff" stroke="#dc2626" />
      <Chip x={222} y={372} w={116} text="+120 XP" bg="#fff" fg="#b91c1c" />
      <Star x={150} y={48} s={1.4} /><Star x={430} y={170} s={1.1} /><Star x={330} y={80} s={0.8} c="#fb7185" />
    </Scene>
  );
}

export function BattleVisual() {
  return (
    <Scene tint="linear-gradient(120deg,#ffe9ec 0%,#eef3ff 100%)" glow="radial-gradient(circle,rgba(29,78,216,.3),transparent 68%)">
      <Defs />
      {/* attack path */}
      <path d="M190 262 C 240 190, 320 190, 372 262" fill="none" stroke="#ef4444" strokeWidth="4" strokeDasharray="8 8" strokeLinecap="round" />
      <path d="M372 296 C 320 350, 240 350, 190 296" fill="none" stroke="#3b74ee" strokeWidth="4" strokeDasharray="2 9" strokeLinecap="round" opacity=".8" />
      {/* back nodes */}
      <Box x={130} y={286} a={26} h={34} c={GRAY} /><Box x={430} y={286} a={26} h={34} c={GRAY} />
      {/* red base */}
      <Box x={150} y={344} a={62} h={104} c={RED}>
        <g transform="translate(150 240)"><circle r="20" fill="#fff" opacity=".95" /><path d="M0 -13v26M-13 0h26" stroke="#b91c1c" strokeWidth="3.5" strokeLinecap="round" /><circle r="9" fill="none" stroke="#b91c1c" strokeWidth="3" /></g>
      </Box>
      {/* blue base */}
      <Box x={410} y={344} a={62} h={104} c={BLUE}>
        <g transform="translate(410 240)"><circle r="20" fill="#fff" opacity=".95" /><path d="M0 -12l11 4v8c0 7-5 11-11 14-6-3-11-7-11-14v-8z" fill="#1d4ed8" /><path d="M-5 0l4 4 7-8" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></g>
      </Box>
      {/* bolt + vs */}
      <polygon points="292,196 262,260 284,260 268,318 318,240 294,240 306,196" fill="#fbbf24" stroke="#f59e0b" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="280" cy="150" r="30" fill="#0b1544" /><text x="280" y="158" textAnchor="middle" fontSize="20" fontWeight="800" fill="#fff" fontFamily={F}>VS</text>
      {/* packets */}
      {[[214, 214], [252, 194], [312, 194], [346, 214]].map(([x, y], i) => <rect key={i} x={x - 6} y={y - 6} width="12" height="12" rx="3" fill="#ef4444" transform={`rotate(45 ${x} ${y})`} />)}
      <Chip x={40} y={64} w={150} text="RED TEAM · 1,240" dot="#ef4444" />
      <Chip x={366} y={64} w={158} text="BLUE TEAM · 1,410" dot="#1d4ed8" />
      <Chip x={196} y={30} w={168} text="LIVE · Match #482" bg="#0b1544" fg="#fff" stroke="#0b1544" />
      <Chip x={40} y={372} w={190} text="SQLi payload delivered" dot="#ef4444" />
      <Chip x={340} y={372} w={182} text="Host isolated ✓" dot="#16a34a" />
    </Scene>
  );
}

export function SocVisual() {
  const bars = [30, 52, 40, 66, 48, 78, 58];
  return (
    <Scene tint="linear-gradient(140deg,#dcf3fa,#eaf1ff)" glow="radial-gradient(circle,rgba(6,182,212,.35),transparent 68%)">
      <Defs />
      {/* radar */}
      <ellipse cx="190" cy="318" rx="128" ry="42" fill="#fff" opacity=".7" /><ellipse cx="190" cy="318" rx="128" ry="42" fill="none" stroke="#7dd3e8" strokeWidth="2.5" />
      <ellipse cx="190" cy="318" rx="86" ry="28" fill="none" stroke="#7dd3e8" strokeWidth="2.5" /><ellipse cx="190" cy="318" rx="44" ry="14" fill="none" stroke="#7dd3e8" strokeWidth="2.5" />
      <line x1="62" y1="318" x2="318" y2="318" stroke="#bfe6f0" strokeWidth="1.5" /><line x1="190" y1="276" x2="190" y2="360" stroke="#bfe6f0" strokeWidth="1.5" />
      <path d="M190 318L288 292A104 34 0 0 0 190 284z" fill="#06b6d4" opacity=".3" /><line x1="190" y1="318" x2="288" y2="292" stroke="#0891b2" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="250" cy="304" r="7" fill="#ef4444" /><circle cx="250" cy="304" r="15" fill="none" stroke="#ef4444" strokeWidth="2.5" opacity=".5" /><circle cx="128" cy="330" r="5.5" fill="#22c55e" /><circle cx="162" cy="298" r="5" fill="#f59e0b" /><circle cx="226" cy="340" r="5" fill="#22c55e" />
      {/* monitor wall */}
      <Box x={410} y={346} a={70} h={150} c={NAVY} />
      <polygon points="340,196 410,231 410,336 340,301" fill="#101d5c" />
      <g><LineL x={352} y={222} len={46} c="#67e8f9" sw="5" /><LineL x={352} y={236} len={30} c="#3b4f9a" sw="4" /></g>
      {bars.map((h, i) => <polygon key={i} points={`${350 + i * 8.2},${300 + i * 4.1} ${356 + i * 8.2},${303 + i * 4.1} ${356 + i * 8.2},${303 + i * 4.1 - h * 0.5} ${350 + i * 8.2},${300 + i * 4.1 - h * 0.5}`} fill={i === 5 ? "#ef4444" : "#22d3ee"} />)}
      <polygon points="410,231 480,196 480,301 410,336" fill="#0b1544" />
      <polyline points="420,300 436,286 448,294 462,268 474,276" fill="none" stroke="#22d3ee" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" transform="translate(0 -12)" />
      {/* shield */}
      <g transform="translate(280 96)"><path d="M0 -50l50 18v34c0 26-21 46-50 58-29-12-50-32-50-58v-34z" fill="#1d4ed8" /><path d="M0 -36l36 13v25c0 19-15 33-36 42-21-9-36-23-36-42v-25z" fill="#3b74ee" /><path d="M-15 -2l11 11 24-27" fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" /></g>
      <Chip x={40} y={150} w={172} text="Brute-force · HIGH" dot="#ef4444" />
      <Chip x={40} y={190} w={196} text="PowerShell · MEDIUM" dot="#f59e0b" />
      <Chip x={372} y={70} w={150} text="Incident contained" dot="#16a34a" />
      <Chip x={392} y={384} w={130} text="Sigma · 14 rules" bg="#0b1544" fg="#fff" stroke="#0b1544" />
    </Scene>
  );
}
