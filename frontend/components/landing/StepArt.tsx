/* Compact illustrations for the CyberPro mastery-path timeline (static, light theme). */
const B = "#1d4ed8", C = "#06b6d4", G = "#16a34a", A = "#f59e0b", R = "#dc2626", N = "#0b1544", L = "#dbe4f3", M = "#526080";
const T = { fontFamily: "sans-serif" } as const;

function S({ children, tint }: { children: React.ReactNode; tint: string }) {
  return <div className="sart" style={{ background: tint }} aria-hidden="true"><svg viewBox="0 0 320 120" preserveAspectRatio="xMidYMid meet">{children}</svg></div>;
}

export const STEP_ART = [
  // 1 onboarding: profile + roadmap checklist
  () => (
    <S tint="linear-gradient(135deg,#e8f0ff,#f6f9ff)">
      <rect x="30" y="16" width="260" height="88" rx="12" fill="#fff" stroke={L} />
      <circle cx="62" cy="46" r="16" fill={B} /><text x="62" y="51" textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff" {...T}>You</text>
      <text x="88" y="42" fontSize="11.5" fontWeight="700" fill={N} {...T}>Your learning roadmap</text><text x="88" y="56" fontSize="9.5" fill={M} {...T}>Personalised · 7 milestones</text>
      {[["Profile created", 1], ["Skill assessment", 1], ["Roadmap unlocked", 0]].map(([t, d], i) => (
        <g key={t as string} transform={`translate(${52 + i * 84} 80)`}><circle r="7" fill={d ? G : "#fff"} stroke={d ? G : "#b7c5e2"} strokeWidth="2" />{d ? <path d="M-3 0l2.5 2.5 4-5" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /> : null}<text x="12" y="3.5" fontSize="8.5" fill={M} {...T}>{t}</text></g>
      ))}
    </S>
  ),
  // 2 live session
  () => (
    <S tint="linear-gradient(135deg,#e6f7fb,#f4fbfd)">
      <rect x="28" y="14" width="190" height="92" rx="12" fill={N} />
      <circle cx="123" cy="52" r="15" fill="#2a3a80" /><path d="M96 92c2-18 15-22 27-22s25 4 27 22z" fill="#2a3a80" />
      <rect x="40" y="24" width="52" height="16" rx="8" fill="#dc2626" /><circle cx="50" cy="32" r="3" fill="#fff" /><text x="58" y="35.5" fontSize="8.5" fontWeight="800" fill="#fff" {...T}>LIVE</text>
      <rect x="150" y="82" width="56" height="16" rx="8" fill="rgba(255,255,255,.16)" /><text x="178" y="93" textAnchor="middle" fontSize="8.5" fill="#fff" {...T}>Demo · Nmap</text>
      <rect x="230" y="14" width="66" height="92" rx="10" fill="#fff" stroke={L} />
      {[26, 48, 70].map((y, i) => <g key={i}><circle cx="244" cy={y + 8} r="6" fill={[B, C, A][i]} /><rect x="254" y={y + 3} width="34" height="4" rx="2" fill={L} /><rect x="254" y={y + 11} width="24" height="4" rx="2" fill={L} /></g>)}
    </S>
  ),
  // 3 labs terminal
  () => (
    <S tint="linear-gradient(135deg,#e6f7fb,#eef3ff)">
      <rect x="30" y="14" width="260" height="92" rx="10" fill={N} /><rect x="30" y="14" width="260" height="18" rx="10" fill="#16245e" /><rect x="30" y="24" width="260" height="8" fill="#16245e" />
      {[42, 52, 62].map((x, i) => <circle key={x} cx={x} cy="23" r="2.8" fill={["#f87171", "#fbbf24", "#34d399"][i]} />)}
      <g fontFamily="Menlo,monospace" fontSize="10"><text x="42" y="50" fill="#4ade80">$ ./exploit.py --target lab-01</text><text x="42" y="66" fill="#67e8f9">[+] shell obtained</text><text x="42" y="82" fill="#4ade80">$ whoami</text><text x="42" y="97" fill="#fbbf24">root</text></g>
      <rect x="226" y="70" width="52" height="18" rx="9" fill="#fff" /><text x="252" y="82.5" textAnchor="middle" fontSize="9" fontWeight="700" fill={B} {...T}>+60 XP</text>
    </S>
  ),
  // 4 scenario incident timeline
  () => (
    <S tint="linear-gradient(135deg,#fff3e6,#fffaf3)">
      <line x1="44" y1="60" x2="276" y2="60" stroke="#f0d9b8" strokeWidth="3" strokeLinecap="round" />
      {[["Phish", R, 44], ["Foothold", A, 108], ["Lateral", A, 172], ["Contain", G, 236]].map(([t, c, x]) => (
        <g key={t as string}><circle cx={x as number} cy="60" r="11" fill="#fff" stroke={c as string} strokeWidth="3.5" /><circle cx={x as number} cy="60" r="4" fill={c as string} /><rect x={(x as number) - 30} y="80" width="60" height="20" rx="10" fill="#fff" stroke="#f0e0c4" /><text x={x as number} y="93.5" textAnchor="middle" fontSize="9.5" fontWeight="700" fill={N} {...T}>{t}</text></g>
      ))}
      <rect x="120" y="14" width="80" height="20" rx="10" fill={N} /><text x="160" y="27.5" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#fff" {...T}>Incident #482</text>
    </S>
  ),
  // 5 mentor chat
  () => (
    <S tint="linear-gradient(135deg,#f0ecff,#f8f6ff)">
      <circle cx="46" cy="36" r="15" fill="#7c3aed" /><text x="46" y="41" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff" {...T}>M</text>
      <rect x="70" y="18" width="180" height="34" rx="12" fill="#fff" stroke={L} /><text x="82" y="32" fontSize="9.5" fontWeight="700" fill={N} {...T}>Mentor</text><text x="82" y="44" fontSize="9.5" fill={M} {...T}>Great recon — now check the auth flow.</text>
      <rect x="110" y="62" width="180" height="34" rx="12" fill={B} /><text x="122" y="76" fontSize="9.5" fontWeight="700" fill="#fff" {...T}>You</text><text x="122" y="88" fontSize="9.5" fill="#dbe7ff" {...T}>Found a JWT weakness. Reviewing.</text>
      <circle cx="298" cy="79" r="11" fill={C} /><path d="M293 79l3.5 3.5 6-7" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </S>
  ),
  // 6 assessment score ring
  () => (
    <S tint="linear-gradient(135deg,#e9f9ef,#f5fdf8)">
      <circle cx="90" cy="60" r="36" fill="none" stroke="#d3efdd" strokeWidth="10" /><circle cx="90" cy="60" r="36" fill="none" stroke={G} strokeWidth="10" strokeLinecap="round" strokeDasharray="205 226" transform="rotate(-90 90 60)" />
      <text x="90" y="66" textAnchor="middle" fontSize="22" fontWeight="800" fill={N} {...T}>91%</text>
      {[["Recon", 92], ["Exploit", 88], ["Report", 94]].map(([t, v], i) => (
        <g key={t as string} transform={`translate(150 ${30 + i * 26})`}><text y="8" fontSize="10" fontWeight="600" fill={N} {...T}>{t}</text><rect x="56" width="100" height="8" rx="4" fill="#d3efdd" /><rect x="56" width={(v as number)} height="8" rx="4" fill={G} /></g>
      ))}
    </S>
  ),
  // 7 progression steps
  () => (
    <S tint="linear-gradient(135deg,#e8f0ff,#e6f7fb)">
      {[["Beginner", 30, 40], ["Specialist", 116, 62], ["Pro", 202, 88]].map(([t, x, h], i) => (
        <g key={t as string}><rect x={x as number} y={106 - (h as number)} width="78" height={h as number} rx="8" fill={[ "#bcd0f7", "#6f95ea", B][i]} /><text x={(x as number) + 39} y={106 - (h as number) + 20} textAnchor="middle" fontSize="10" fontWeight="700" fill={i === 0 ? N : "#fff"} {...T}>{t}</text></g>
      ))}
      <path d="M52 32L130 20 222 8" fill="none" stroke={A} strokeWidth="2.5" strokeDasharray="4 5" strokeLinecap="round" /><path d="M222 8l-8 1 5 6z" fill={A} />
      <path d="M241 -2l3 6.5 7 .8-5.3 4.7 1.6 7L241 17l-6.3 3.7 1.6-7-5.3-4.7 7-.8z" transform="translate(-2 4)" fill={A} />
    </S>
  ),
] as const;
