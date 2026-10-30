/* Illustrations for: certifications, "More than courses" and the learning-path headers (static, light theme). */
const N = "#0b1544", B = "#1d4ed8", C = "#06b6d4", R = "#dc2626", G = "#16a34a", A = "#f59e0b", L = "#dbe4f3", M = "#526080";
const T = { fontFamily: "sans-serif" } as const;

export type Track = "foundation" | "offensive" | "defensive";
const PAL: Record<Track, [string, string, string]> = { foundation: ["#06b6d4", "#0e7490", "#cffafe"], offensive: ["#ef4444", "#991b1b", "#fee2e2"], defensive: ["#2563eb", "#1e3a8a", "#dbeafe"] };

export function CertBadge({ code, track, stars }: { code: string; track: Track; stars: number }) {
  const [a, b, soft] = PAL[track];
  const id = `cb-${code}`;
  return (
    <svg viewBox="0 0 140 150" className="cbadge" aria-hidden="true">
      <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} /></linearGradient></defs>
      <ellipse cx="70" cy="140" rx="42" ry="6" fill="rgba(11,21,68,.12)" />
      <path d="M70 6l52 18v44c0 30-22 52-52 66C40 120 18 98 18 68V24z" fill={`url(#${id})`} />
      <path d="M70 16l43 15v37c0 25-18 43-43 55-25-12-43-30-43-55V31z" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="2" />
      <path d="M70 6l52 18v44c0 30-22 52-52 66z" fill="#fff" opacity=".12" />
      <circle cx="70" cy="50" r="16" fill="#fff" opacity=".95" />
      {track === "offensive" ? <path d="M70 40v20M60 50h20M62.5 42.5l15 15M77.5 42.5l-15 15" stroke={b} strokeWidth="3" strokeLinecap="round" /> : track === "defensive" ? <path d="M70 39l10 4v8c0 6-4 10-10 13-6-3-10-7-10-13v-8z" fill={b} /> : <path d="M62 51l5.5 5.5L79 44" fill="none" stroke={b} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />}
      <text x="70" y="86" textAnchor="middle" fontSize={code.length > 5 ? 15 : 18} fontWeight="800" letterSpacing=".5" fill="#fff" {...T}>{code}</text>
      {Array.from({ length: 3 }).map((_, i) => <path key={i} transform={`translate(${52 + i * 18} 98)`} d="M0 -5l1.8 3.7 4 .5-3 2.7.8 4L0 3.9l-3.6 2 .8-4-3-2.7 4-.5z" fill={i < stars ? "#fcd34d" : "#fff"} opacity={i < stars ? 1 : 0.4} />)}
      <path d="M50 118l-8 20 12-5 5 9 6-22z" fill={soft} opacity="0" />
    </svg>
  );
}

const F = ({ children, tint }: { children: React.ReactNode; tint: string }) => <div className="mart" style={{ background: tint }} aria-hidden="true"><svg viewBox="0 0 360 200" preserveAspectRatio="xMidYMid meet">{children}</svg></div>;

export function MentorArt() {
  return (
    <F tint="linear-gradient(135deg,#eaf0ff,#f6f9ff)">
      <path d="M96 100 C 140 60, 220 60, 264 100" fill="none" stroke="#b9cbf3" strokeWidth="3" strokeDasharray="3 8" strokeLinecap="round" />
      <g><circle cx="80" cy="112" r="34" fill={B} /><circle cx="80" cy="102" r="12" fill="#fff" /><path d="M58 134c3-13 12-17 22-17s19 4 22 17z" fill="#fff" /><rect x="52" y="152" width="56" height="18" rx="9" fill={N} /><text x="80" y="165" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#fff" {...T}>MENTOR</text></g>
      <g><circle cx="280" cy="112" r="34" fill={C} /><circle cx="280" cy="102" r="12" fill="#fff" /><path d="M258 134c3-13 12-17 22-17s19 4 22 17z" fill="#fff" /><rect x="252" y="152" width="56" height="18" rx="9" fill="#fff" stroke={L} /><text x="280" y="165" textAnchor="middle" fontSize="9.5" fontWeight="700" fill={N} {...T}>YOU</text></g>
      <rect x="126" y="34" width="108" height="34" rx="12" fill="#fff" stroke={L} /><circle cx="146" cy="51" r="4" fill={B} /><circle cx="160" cy="51" r="4" fill={C} /><circle cx="174" cy="51" r="4" fill={A} /><rect x="190" y="47" width="34" height="8" rx="4" fill={L} />
      <path d="M170 68l-6 8 12-4z" fill="#fff" stroke={L} />
      <rect x="130" y="112" width="100" height="26" rx="13" fill={G} /><path d="M148 125l5 5 10-10" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /><text x="196" y="129" textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff" {...T}>Reviewed</text>
    </F>
  );
}
export function WebinarArt() {
  return (
    <F tint="linear-gradient(135deg,#e6f7fb,#f2fbfd)">
      <rect x="70" y="20" width="220" height="124" rx="14" fill={N} /><rect x="84" y="34" width="120" height="70" rx="8" fill="#16245e" />
      <text x="96" y="54" fontSize="10" fontWeight="700" fill="#67e8f9" {...T}>Live · Threat Hunting 101</text>
      {[64, 76, 88].map((y, i) => <rect key={y} x="96" y={y} width={[88, 70, 100][i]} height="5" rx="2.5" fill="#3b4f9a" />)}
      <circle cx="248" cy="62" r="18" fill="#2a3a80" /><circle cx="248" cy="56" r="7" fill="#e6eeff" /><path d="M236 76c2-8 7-10 12-10s10 2 12 10z" fill="#e6eeff" />
      <rect x="84" y="116" width="64" height="18" rx="9" fill="#dc2626" /><circle cx="96" cy="125" r="3.5" fill="#fff" /><text x="106" y="128.5" fontSize="9" fontWeight="800" fill="#fff" {...T}>LIVE</text>
      <rect x="168" y="118" width="110" height="14" rx="7" fill="rgba(255,255,255,.14)" /><text x="223" y="128.5" textAnchor="middle" fontSize="9" fill="#dbe7ff" {...T}>128 learners watching</text>
      {[[100, A], [150, B], [200, C], [250, "#7c3aed"]].map(([x, c], i) => <g key={i}><circle cx={x as number} cy="172" r="13" fill={c as string} /><circle cx={x as number} cy="169" r="5" fill="#fff" /><path d={`M${(x as number) - 9} 181c1-6 5-8 9-8s8 2 9 8z`} fill="#fff" /></g>)}
    </F>
  );
}
export function BoardArt() {
  return (
    <F tint="linear-gradient(135deg,#fff6e0,#fffdf5)">
      {[["2", 96, 50, "#cbd5e1", "#94a3b8"], ["1", 150, 86, "#fcd34d", "#f59e0b"], ["3", 204, 36, "#fdba74", "#f97316"]].map(([r, x, h, c1, c2]) => (
        <g key={r as string}><rect x={x as number} y={170 - (h as number)} width="52" height={h as number} rx="9" fill={c1 as string} /><rect x={x as number} y={170 - (h as number)} width="52" height="8" rx="4" fill={c2 as string} /><text x={(x as number) + 26} y={170 - (h as number) + 32} textAnchor="middle" fontSize="20" fontWeight="800" fill="#fff" {...T}>{r}</text></g>
      ))}
      {[[122, 92, "#94a3b8", "sn0w"], [176, 58, A, "m0nkey"], [230, 104, "#f97316", "void"]].map(([x, y, c, n]) => <g key={n as string}><circle cx={x as number} cy={(y as number) - 8} r="14" fill={c as string} /><text x={x as number} y={(y as number) - 3.5} textAnchor="middle" fontSize="12" fontWeight="800" fill="#fff" {...T}>{(n as string)[0].toUpperCase()}</text></g>)}
      <path d="M176 34l4 8 9 1-6.5 6 1.7 9-8.2-4.5-8.2 4.5 1.7-9L163 43l9-1z" transform="translate(0 -24)" fill={A} />
      <rect x="250" y="40" width="82" height="52" rx="12" fill="#fff" stroke="#f0e2b6" /><text x="291" y="62" textAnchor="middle" fontSize="9" fontWeight="700" fill={M} {...T}>SEASON 1</text><text x="291" y="82" textAnchor="middle" fontSize="18" fontWeight="800" fill={N} {...T}>#142 ▲12</text>
    </F>
  );
}
export function ThreatArt() {
  const nodes = [[70, 60], [150, 36], [230, 64], [110, 128], [200, 138], [290, 120]] as const;
  return (
    <F tint="linear-gradient(135deg,#f0ecff,#f8f6ff)">
      <g stroke="#c9bdf5" strokeWidth="2">{[[0, 1], [1, 2], [0, 3], [1, 3], [2, 4], [3, 4], [2, 5], [4, 5]].map(([a, b]) => <line key={`${a}${b}`} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} />)}</g>
      <path d="M70 60L150 36L230 64L200 138" fill="none" stroke={R} strokeWidth="3" strokeDasharray="6 6" />
      {nodes.map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r="17" fill="#fff" stroke={i === 4 ? G : i === 0 ? R : "#7c3aed"} strokeWidth="3" /><circle cx={x} cy={y} r="6" fill={i === 4 ? G : i === 0 ? R : "#7c3aed"} /></g>)}
      <g transform="translate(200 138)"><path d="M0 -13l12 4v8c0 7-5 11-12 15-7-4-12-8-12-15v-8z" fill={G} transform="translate(22 -8) scale(.9)" /></g>
      <rect x="18" y="150" width="110" height="34" rx="10" fill="#fff" stroke={L} /><text x="30" y="165" fontSize="9.5" fontWeight="700" fill={N} {...T}>Threat card</text><text x="30" y="177" fontSize="9" fill={M} {...T}>Phishing → Foothold</text>
      <rect x="236" y="14" width="106" height="26" rx="13" fill={N} /><text x="289" y="31" textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff" {...T}>Risk score 7.4</text>
    </F>
  );
}

export function OffenseArt() {
  return (
    <svg viewBox="0 0 200 130" className="pill-art" aria-hidden="true">
      <circle cx="120" cy="66" r="52" fill="#fecaca" opacity=".6" /><circle cx="120" cy="66" r="38" fill="none" stroke={R} strokeWidth="3" /><circle cx="120" cy="66" r="22" fill="none" stroke={R} strokeWidth="3" /><circle cx="120" cy="66" r="7" fill={R} />
      <path d="M120 8v28M120 96v28M62 66h28M150 66h28" stroke={R} strokeWidth="3" strokeLinecap="round" />
      <rect x="20" y="20" width="70" height="24" rx="12" fill="#fff" stroke="#fbcaca" /><text x="55" y="36" textAnchor="middle" fontSize="10" fontWeight="700" fill="#991b1b" {...T}>0-day found</text>
      <rect x="10" y="88" width="84" height="24" rx="12" fill={R} /><text x="52" y="104" textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff" {...T}>root access</text>
    </svg>
  );
}
export function DefenseArt() {
  return (
    <svg viewBox="0 0 200 130" className="pill-art" aria-hidden="true">
      <circle cx="120" cy="66" r="52" fill="#c7d7fb" opacity=".6" />
      <path d="M120 14l40 14v32c0 24-17 40-40 52-23-12-40-28-40-52V28z" fill={B} /><path d="M120 24l31 11v25c0 18-13 31-31 40-18-9-31-22-31-40V35z" fill="none" stroke="#fff" strokeOpacity=".6" strokeWidth="2" />
      <path d="M104 62l11 11 21-24" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="10" y="20" width="76" height="24" rx="12" fill="#fff" stroke="#c3d5fb" /><text x="48" y="36" textAnchor="middle" fontSize="10" fontWeight="700" fill={B} {...T}>Alert triaged</text>
      <rect x="10" y="88" width="86" height="24" rx="12" fill={C} /><text x="53" y="104" textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff" {...T}>Threat contained</text>
    </svg>
  );
}
