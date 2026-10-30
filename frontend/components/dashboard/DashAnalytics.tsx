
/* ── mock data ─────────────────────────────────────────── */
const XP_DAYS = ["Sep 8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21"];
const XP = [80, 120, 60, 210, 150, 0, 90, 180, 240, 130, 160, 95, 205, 30];
const GOAL = 100;

const WEEKS = ["W1", "W2", "W3", "W4", "W5", "W6"];
const ACT = [
  { k: "Lessons", c: "#7c3aed", v: [5, 7, 6, 8, 7, 9] },
  { k: "Labs", c: "#38bdf8", v: [2, 3, 5, 4, 6, 7] },
  { k: "CTF", c: "#fb7185", v: [0, 1, 1, 2, 1, 3] },
  { k: "Duels", c: "#818cf8", v: [0, 0, 1, 1, 2, 2] },
];

const RADAR = [
  { l: "Security", me: 75, avg: 52 },
  { l: "Networking", me: 35, avg: 44 },
  { l: "OS", me: 29, avg: 38 },
  { l: "Web", me: 17, avg: 30 },
  { l: "Offensive", me: 5, avg: 18 },
  { l: "Blue Team", me: 8, avg: 22 },
  { l: "Cloud", me: 3, avg: 15 },
];

const DIFF = [
  { l: "Easy", n: 22, c: "#2dd4a7" },
  { l: "Medium", n: 13, c: "#f5a524" },
  { l: "Hard", n: 5, c: "#fb7185" },
  { l: "Insane", n: 1, c: "#7c3aed" },
];

const ACC = [72, 65, 80, 58, 77, 84, 79, 88]; // quiz accuracy %, last 8 attempts
const HEAT = Array.from({ length: 5 * 7 }, (_, i) => [0, 2, 1, 3, 2, 0, 1, 3, 4, 2, 1, 0, 2, 3, 4, 3, 1, 2, 0, 1, 4, 3, 2, 4, 1, 0, 2, 3, 4, 2, 3, 1, 4, 2, 1][i]);
const HEAT_COL = ["rgba(124,58,237,.08)", "#ddd0fb", "#b79cf5", "#8b5cf6", "#5b21b6"];

/* ── helpers ───────────────────────────────────────────── */
const pt = (i: number, n: number, v: number, max: number, w: number, h: number, pad: [number, number, number, number]) => {
  const [t, r, b, l] = pad;
  return [l + (i / (n - 1)) * (w - l - r), t + (1 - v / max) * (h - t - b)] as const;
};

/** a softened line through midpoints — much gentler on the eye than straight segments */
function smoothPath(pts: readonly (readonly [number, number])[]) {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    d += ` Q${x0.toFixed(1)},${y0.toFixed(1)} ${mx.toFixed(1)},${my.toFixed(1)}`;
  }
  const [lx, ly] = pts[pts.length - 1];
  d += ` L${lx.toFixed(1)},${ly.toFixed(1)}`;
  return d;
}

function XpTrend() {
  const W = 620, H = 220, pad: [number, number, number, number] = [16, 12, 28, 34];
  const max = 250;
  const pts = XP.map((v, i) => pt(i, XP.length, v, max, W, H, pad));
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1][0]} ${H - pad[2]} L${pts[0][0]} ${H - pad[2]}Z`;
  const gy = pt(0, 2, GOAL, max, W, H, pad)[1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="da-svg" role="img" aria-label="Daily learning score over the last 14 days">
      <defs><linearGradient id="da-xp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7c3aed" stopOpacity=".35" /><stop offset="1" stopColor="#7c3aed" stopOpacity="0" /></linearGradient></defs>
      {[0, 50, 100, 150, 200, 250].map((g) => {
        const y = pt(0, 2, g, max, W, H, pad)[1];
        return <g key={g}><line x1={pad[3]} x2={W - pad[1]} y1={y} y2={y} stroke="rgba(124,58,237,.12)" /><text x={pad[3] - 8} y={y + 3} textAnchor="end" className="da-tick">{g}</text></g>;
      })}
      <line x1={pad[3]} x2={W - pad[1]} y1={gy} y2={gy} stroke="#2dd4a7" strokeDasharray="5 5" strokeWidth="1.5" />
      <text x={W - pad[1]} y={gy - 5} textAnchor="end" className="da-tick" fill="#12967a">Daily goal · {GOAL} pts</text>
      <path d={area} fill="url(#da-xp)" />
      <path d={line} fill="none" stroke="#7c3aed" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={i === pts.length - 1 ? 5 : 3.2} fill={XP[i] >= GOAL ? "#7c3aed" : "#fff"} stroke="#7c3aed" strokeWidth="2"><title>{`${XP_DAYS[i]}: ${XP[i]} pts`}</title></circle>
          {(i % 2 === 0 || i === pts.length - 1) && <text x={x} y={H - 8} textAnchor="middle" className="da-tick">{XP_DAYS[i]}</text>}
        </g>
      ))}
    </svg>
  );
}

function ActivityBars() {
  const W = 360, H = 220, pad = { t: 12, r: 8, b: 28, l: 28 };
  const totals = WEEKS.map((_, i) => ACT.reduce((s, a) => s + a.v[i], 0));
  const max = 24;
  const bw = (W - pad.l - pad.r) / WEEKS.length;
  const y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="da-svg" role="img" aria-label="Weekly completed activities by type">
      {[0, 8, 16, 24].map((g) => <g key={g}><line x1={pad.l} x2={W - pad.r} y1={y(g)} y2={y(g)} stroke="rgba(124,58,237,.12)" /><text x={pad.l - 6} y={y(g) + 3} textAnchor="end" className="da-tick">{g}</text></g>)}
      {WEEKS.map((w, i) => {
        let acc = 0;
        const x = pad.l + i * bw + bw * 0.2;
        return (
          <g key={w}>
            {ACT.map((a) => {
              const y0 = y(acc), y1 = y(acc + a.v[i]);
              acc += a.v[i];
              return a.v[i] ? <rect key={a.k} x={x} y={y1} width={bw * 0.6} height={y0 - y1} fill={a.c} rx="2"><title>{`${w} · ${a.k}: ${a.v[i]}`}</title></rect> : null;
            })}
            <text x={x + bw * 0.3} y={y(totals[i]) - 5} textAnchor="middle" className="da-tick" fontWeight="700">{totals[i]}</text>
            <text x={x + bw * 0.3} y={H - 8} textAnchor="middle" className="da-tick">{w}</text>
          </g>
        );
      })}
    </svg>
  );
}

function Radar() {
  const S = 260, c = S / 2, R = 84, n = RADAR.length;
  const p = (i: number, v: number) => {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
    return [c + Math.cos(a) * R * (v / 100), c + Math.sin(a) * R * (v / 100)] as const;
  };
  const poly = (k: "me" | "avg") => RADAR.map((r, i) => p(i, r[k]).map((x) => x.toFixed(1)).join(",")).join(" ");
  return (
    <svg viewBox={`0 0 ${S} ${S}`} className="da-svg da-sq" role="img" aria-label="Skill radar: you versus cohort average">
      <defs>
        <radialGradient id="da-radar-me" cx="50%" cy="50%" r="70%">
          <stop offset="0" stopColor="#a78bfa" stopOpacity=".6" /><stop offset="1" stopColor="#7c3aed" stopOpacity=".2" />
        </radialGradient>
      </defs>
      {[25, 50, 75, 100].map((g) => <polygon key={g} points={RADAR.map((_, i) => p(i, g).join(",")).join(" ")} fill="none" stroke="rgba(124,58,237,.13)" />)}
      {RADAR.map((_, i) => { const [x, y] = p(i, 100); return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="rgba(124,58,237,.1)" />; })}
      {[25, 50, 75, 100].map((g) => { const [x, y] = p(0, g); return <text key={g} x={x + 5} y={y - 2} className="da-tick">{g}</text>; })}
      <polygon points={poly("avg")} fill="rgba(56,189,248,.12)" stroke="#38bdf8" strokeWidth="1.6" strokeDasharray="4 4" strokeLinejoin="round" />
      <polygon points={poly("me")} fill="url(#da-radar-me)" stroke="#7c3aed" strokeWidth="2.4" strokeLinejoin="round" />
      {RADAR.map((r, i) => { const [x, y] = p(i, r.me); return <circle key={r.l} cx={x} cy={y} r="3.6" fill="#7c3aed" stroke="#fff" strokeWidth="1.6"><title>{`${r.l}: you ${r.me}% · cohort avg ${r.avg}%`}</title></circle>; })}
      {RADAR.map((r, i) => { const [x, y] = p(i, 124); return <text key={r.l} x={x} y={y + 3} textAnchor="middle" className="da-tick" fontWeight="600">{r.l}</text>; })}
    </svg>
  );
}

function Donut() {
  const total = DIFF.reduce((s, d) => s + d.n, 0);
  const totalLabs = 169;
  const pct = Math.round((total / totalLabs) * 100);
  const R = 54, C = 2 * Math.PI * R, gap = 4;
  let off = 0;
  return (
    <svg viewBox="0 0 150 150" className="da-svg da-sq" role="img" aria-label="Labs solved by difficulty">
      <defs>
        <filter id="da-donut-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#150f23" floodOpacity=".18" />
        </filter>
      </defs>
      <circle cx="75" cy="75" r={R} fill="none" stroke="rgba(124,58,237,.09)" strokeWidth="16" />
      <g transform="rotate(-90 75 75)" style={{ filter: "url(#da-donut-glow)" }}>
        {DIFF.map((d) => {
          const len = (d.n / total) * C;
          const el = <circle key={d.l} cx="75" cy="75" r={R} fill="none" stroke={d.c} strokeWidth="16" strokeLinecap="round" strokeDasharray={`${Math.max(len - gap, 0)} ${C - len + gap}`} strokeDashoffset={-off}><title>{`${d.l}: ${d.n}`}</title></circle>;
          off += len;
          return el;
        })}
      </g>
      <text x="75" y="69" textAnchor="middle" className="da-big">{total}</text>
      <text x="75" y="86" textAnchor="middle" className="da-tick">labs solved</text>
      <text x="75" y="100" textAnchor="middle" className="da-tick" style={{ fill: "#7c3aed", fontWeight: 700 }}>{pct}% of {totalLabs}</text>
    </svg>
  );
}

function Accuracy() {
  const W = 360, H = 150, pad: [number, number, number, number] = [14, 12, 24, 30];
  const pts = ACC.map((v, i) => pt(i, ACC.length, v, 100, W, H, pad));
  const line = smoothPath(pts);
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${H - pad[2]} L${pts[0][0].toFixed(1)},${H - pad[2]}Z`;
  const avg = Math.round(ACC.reduce((s, v) => s + v, 0) / ACC.length);
  const avgY = pt(0, 2, avg, 100, W, H, pad)[1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="da-svg" role="img" aria-label="Quiz accuracy over the last 8 attempts">
      <defs><linearGradient id="da-acc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2dd4a7" stopOpacity=".32" /><stop offset="1" stopColor="#2dd4a7" stopOpacity="0" /></linearGradient></defs>
      {[0, 50, 100].map((g) => { const y = pt(0, 2, g, 100, W, H, pad)[1]; return <g key={g}><line x1={pad[3]} x2={W - pad[1]} y1={y} y2={y} stroke="rgba(124,58,237,.12)" /><text x={pad[3] - 6} y={y + 3} textAnchor="end" className="da-tick">{g}%</text></g>; })}
      <line x1={pad[3]} x2={W - pad[1]} y1={avgY} y2={avgY} stroke="#9a8fb5" strokeDasharray="4 5" strokeWidth="1.3" />
      <text x={W - pad[1]} y={avgY - 6} textAnchor="end" className="da-tick" style={{ fill: "#726c86", fontWeight: 700 }}>Avg {avg}%</text>
      <path d={area} fill="url(#da-acc)" />
      <path d={line} fill="none" stroke="#2dd4a7" strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map(([x, y], i) => {
        const good = ACC[i] >= 75;
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={i === pts.length - 1 ? 5.5 : 3.4} fill={good ? "#2dd4a7" : "#f5a524"} stroke="#fff" strokeWidth="2"><title>{`Quiz ${i + 1}: ${ACC[i]}%`}</title></circle>
            <text x={x} y={H - 6} textAnchor="middle" className="da-tick">Q{i + 1}</text>
          </g>
        );
      })}
    </svg>
  );
}

function Heatmap() {
  return (
    <div>
      <div className="da-heat" role="img" aria-label="Activity heatmap, last 5 weeks">
        {HEAT.map((h, i) => <i key={i} style={{ background: HEAT_COL[h] }} title={`${h} activities`} />)}
      </div>
      <div className="da-heat-legend"><span>Less</span>{HEAT_COL.map((c) => <i key={c} style={{ background: c }} />)}<span>More</span></div>
    </div>
  );
}

/* ── section ───────────────────────────────────────────── */
export function DashAnalytics() {
  return (
    <section className="da" aria-label="Analytics">
      <div className="da-grid">
        <div className="dq-card da-card da-w3">
          <div className="da-h"><b>Daily learning score</b><span>Points above the dashed line hit your goal</span></div>
          <XpTrend />
        </div>
        <div className="dq-card da-card">
          <div className="da-h"><b>Skill balance</b><span>You vs cohort average</span></div>
          <Radar />
          <div className="da-legend"><span><i style={{ background: "#7c3aed" }} />You</span><span><i style={{ background: "#38bdf8" }} />Cohort avg</span></div>
        </div>
        <div className="dq-card da-card">
          <div className="da-h"><b>Labs by difficulty</b><span>41 solved of 169</span></div>
          <Donut />
          <div className="da-legend">{DIFF.map((d) => <span key={d.l}><i style={{ background: d.c }} />{d.l} · {d.n}</span>)}</div>
        </div>
        <div className="dq-card da-card">
          <div className="da-h"><b>Weekly activity</b><span>Completed items by type</span></div>
          <ActivityBars />
          <div className="da-legend">{ACT.map((a) => <span key={a.k}><i style={{ background: a.c }} />{a.k}</span>)}</div>
        </div>
        <div className="dq-card da-card da-w2">
          <div className="da-h"><b>Quiz accuracy</b><span>Last 8 attempts</span></div>
          <Accuracy />
        </div>
        <div className="dq-card da-card">
          <div className="da-h"><b>Consistency</b><span>Last 5 weeks · Mon → Sun</span></div>
          <Heatmap />
        </div>
      </div>
    </section>
  );
}
