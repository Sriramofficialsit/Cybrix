import type { CSSProperties } from "react";
import { Icon } from "@/components/Icon";

type Tone = CSSProperties & Record<`--${string}`, string | number>;
const tone = (c: string, c2: string) => ({ "--c": c, "--c2": c2 }) as Tone;

const WEEK = ["M", "T", "W", "T", "F", "S", "S"];
/** minutes learned per day this week (sums to 6h 40m) */
const DAILY_MIN = [40, 55, 70, 30, 85, 60, 60];
/** season rank over the last 7 days (lower is better) */
const RANK_HISTORY = [154, 152, 151, 148, 146, 145, 142];

function Ring({ pct }: { pct: number }) {
  const r = 26, len = 2 * Math.PI * r;
  return (
    <svg className="lg-ring" viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="lg-ring-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a78bfa" /><stop offset="1" stopColor="#6d28d9" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r={r} className="lg-ring-track" />
      <circle cx="32" cy="32" r={r} className="lg-ring-fill" stroke="url(#lg-ring-g)"
        strokeDasharray={`${(pct / 100) * len} ${len}`} transform="rotate(-90 32 32)" />
    </svg>
  );
}

function RankTrail() {
  const W = 92, H = 30, pad = 3;
  const min = Math.min(...RANK_HISTORY), max = Math.max(...RANK_HISTORY);
  const pts = RANK_HISTORY.map((r, i) => [pad + (i / (RANK_HISTORY.length - 1)) * (W - pad * 2), pad + ((r - min) / (max - min)) * (H - pad * 2)] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const [lx, ly] = pts[pts.length - 1];
  return (
    <svg className="lg-trail" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <defs>
        <linearGradient id="lg-trail-g" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#818cf8" stopOpacity=".15" /><stop offset="1" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <path d={line} fill="none" stroke="url(#lg-trail-g)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="5" fill="#6366f1" opacity=".2" />
      <circle cx={lx} cy={ly} r="2.6" fill="#6366f1" />
    </svg>
  );
}

export function KpiRow() {
  const peak = Math.max(...DAILY_MIN);
  const labs = { done: 41, total: 169 };
  const flags = { done: 3, total: 8 };
  const labsPct = Math.round((labs.done / labs.total) * 100);

  return (
    <section className="lg-kpis" aria-label="Your stats">
      <span className="lg-orb o1" /><span className="lg-orb o2" /><span className="lg-orb o3" />

      {/* Overall progress */}
      <article className="lg-tile" style={tone("#7c3aed", "#a78bfa")}>
        <header><span className="lg-ic"><Icon name="ic-chart" /></span><span className="lg-delta">▲ 4%</span></header>
        <div className="lg-ring-wrap">
          <Ring pct={42} />
          <div><b className="lg-val">42<small>%</small></b><span className="lg-label">Overall progress</span></div>
        </div>
        <footer className="lg-foot">Path · Networking track</footer>
      </article>

      {/* Time learning */}
      <article className="lg-tile" style={tone("#0ea5e9", "#7dd3fc")}>
        <header><span className="lg-ic"><Icon name="ic-clock" /></span><span className="lg-delta">▲ 1h 05m</span></header>
        <b className="lg-val">6<small>h</small> 40<small>m</small></b>
        <span className="lg-label">Time learning this week</span>
        <div className="lg-week" aria-hidden="true">
          {DAILY_MIN.map((m, i) => (
            <div key={i} className={`lg-day${i === DAILY_MIN.length - 1 ? " today" : ""}`}>
              <i style={{ height: `${Math.max((m / peak) * 100, 8)}%` }} />
              <span>{WEEK[i]}</span>
            </div>
          ))}
        </div>
      </article>

      {/* Labs completed */}
      <article className="lg-tile" style={tone("#10b981", "#6ee7b7")}>
        <header><span className="lg-ic"><Icon name="ic-term" /></span><span className="lg-delta">▲ 3 this week</span></header>
        <b className="lg-val">{labs.done}<small> / {labs.total}</small></b>
        <span className="lg-label">Labs completed</span>
        <div className="lg-xp" role="progressbar" aria-valuenow={labsPct} aria-valuemin={0} aria-valuemax={100}>
          <i style={{ width: `${labsPct}%` }} />
        </div>
        <footer className="lg-foot"><span>{labsPct}% cleared</span><span>{labs.total - labs.done} to go</span></footer>
      </article>

      {/* Challenges solved */}
      <article className="lg-tile" style={tone("#f43f5e", "#fda4af")}>
        <header><span className="lg-ic"><Icon name="ic-flag" /></span><span className="lg-delta">▲ 1 this week</span></header>
        <b className="lg-val">{flags.done}<small> / {flags.total}</small></b>
        <span className="lg-label">Challenges solved</span>
        <div className="lg-pips" aria-hidden="true">
          {Array.from({ length: flags.total }, (_, i) => <span key={i} className={i < flags.done ? "on" : ""} />)}
        </div>
        <footer className="lg-foot">{flags.total - flags.done} flags left to capture</footer>
      </article>

      {/* Season rank */}
      <article className="lg-tile lg-rank" style={tone("#6366f1", "#a5b4fc")}>
        <header><span className="lg-ic"><Icon name="ic-award" /></span><span className="lg-delta">▲ 12 places</span></header>
        <b className="lg-val"><small>#</small>142</b>
        <span className="lg-label">Season rank</span>
        <div className="lg-rank-row">
          <RankTrail />
          <span className="lg-chev" aria-hidden="true"><i /><i /><i /></span>
        </div>
        <footer className="lg-foot">Climbing · last 7 days</footer>
      </article>
    </section>
  );
}
