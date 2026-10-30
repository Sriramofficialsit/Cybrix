import { Icon } from "@/components/Icon";

const NAV: [string, string, boolean?][] = [
  ["ic-grid", "Dashboard", true], ["ic-book", "Learn"], ["ic-flask", "Cyber Range"], ["ic-flag", "CTF Arena"],
  ["ic-swords", "Red vs Blue"], ["ic-cert", "Certificates"], ["ic-chart", "Leaderboard"],
];
const KPI = [
  ["Total XP", "12,480", "+340 this week"], ["Labs completed", "38", "6 in progress"],
  ["CTF flags", "64", "Rank #12"], ["Current streak", "17 days", "Best 21 days"],
];
const LABS = [
  ["SQL Injection — Login Bypass", "Web", "Medium", 100, "Completed"],
  ["Nmap Host Discovery", "Recon", "Easy", 100, "Completed"],
  ["Privilege Escalation on Linux", "Post-Exploit", "Hard", 62, "In progress"],
  ["Splunk: Detect Brute Force", "Blue Team", "Medium", 35, "In progress"],
] as const;
const BOARD = [["Aarav K.", "18,940"], ["Meera S.", "16,210"], ["You", "12,480"], ["Rohit P.", "11,905"]];
const BARS = [38, 52, 44, 68, 60, 82, 74];
const PTS = [30, 42, 36, 55, 48, 64, 58, 78, 70, 92];

/** Static, product-style rendition of the learner dashboard (no animation). */
export function DashboardMock() {
  const line = PTS.map((y, i) => `${i * 40 + 10},${110 - y}`).join(" ");
  return (
    <div className="dm">
      <div className="dm-bar">
        <i /><i /><i />
        <span>app.cyberthulir.com/dashboard</span>
      </div>
      <div className="dm-body">
        <aside className="dm-side">
          <div className="dm-logo"><img src="/logo.png" alt="" />CyberThulir</div>
          {NAV.map(([ic, n, on]) => (
            <div key={n} className={`dm-nav${on ? " on" : ""}`}><Icon name={ic} size={16} />{n}</div>
          ))}
        </aside>
        <div className="dm-main">
          <div className="dm-top">
            <div><h4>Welcome back, Sriram</h4><p>Level 15 · Exploit Developer · 320 XP to next level</p></div>
            <div className="dm-user"><span>SR</span></div>
          </div>
          <div className="dm-kpis">
            {KPI.map(([l, v, d]) => (<div className="dm-kpi" key={l}><small>{l}</small><b>{v}</b><em>{d}</em></div>))}
          </div>
          <div className="dm-row">
            <div className="dm-panel" style={{ flex: 1.5 }}>
              <div className="dm-ph"><b>XP earned — last 10 days</b><span>Weekly</span></div>
              <svg viewBox="0 0 400 120" preserveAspectRatio="none" className="dm-chart">
                {[20, 50, 80, 110].map((y) => <line key={y} x1="0" x2="400" y1={y} y2={y} stroke="#e6edf8" />)}
                <polyline points={line} fill="none" stroke="#7c3aed" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                <polygon points={`10,110 ${line} 370,110`} fill="rgba(124,58,237,.09)" />
              </svg>
            </div>
            <div className="dm-panel" style={{ flex: 1 }}>
              <div className="dm-ph"><b>Skill activity</b><span>This week</span></div>
              <div className="dm-bars">{BARS.map((h, i) => <i key={i} style={{ height: `${h}%` }} />)}</div>
              <div className="dm-days">{["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <span key={i}>{d}</span>)}</div>
            </div>
          </div>
          <div className="dm-row">
            <div className="dm-panel" style={{ flex: 1.5 }}>
              <div className="dm-ph"><b>Active labs</b><span>View all</span></div>
              <table>
                <tbody>
                  {LABS.map(([n, c, d, p, s]) => (
                    <tr key={n}>
                      <td><b>{n}</b><small>{c} · {d}</small></td>
                      <td><div className="dm-prog"><i style={{ width: `${p}%` }} /></div></td>
                      <td><span className={`dm-tag${p === 100 ? " ok" : ""}`}>{s}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="dm-panel" style={{ flex: 1 }}>
              <div className="dm-ph"><b>Season leaderboard</b><span>Top 4</span></div>
              {BOARD.map(([n, x], i) => (
                <div key={n} className={`dm-lb${n === "You" ? " me" : ""}`}><span>{i + 1}</span><b>{n}</b><em>{x} XP</em></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
