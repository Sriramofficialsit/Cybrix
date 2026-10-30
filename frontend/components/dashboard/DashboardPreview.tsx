import type { CSSProperties } from "react";
import { Icon } from "@/components/Icon";
import "./dash.css";

type Tone = CSSProperties & Record<`--${string}`, string | number>;
const t = (c: string, cd: string): Tone => ({ "--c": c, "--cd": cd });

const NODES = [
  { icon: "ic-shield", n: "Foundations", c: t("#7c3aed", "#5b21b6") },
  { icon: "ic-globe", n: "Networking", c: t("#38bdf8", "#0f8fc0"), cur: true },
  { icon: "ic-cpu", n: "OS", c: t("#7c3aed", "#5b21b6") },
  { icon: "ic-bug", n: "Web", c: t("#fb7185", "#c93a55") },
  { icon: "ic-swords", n: "Offensive", c: t("#f43f5e", "#b91c3c"), lock: true },
  { icon: "ic-radar", n: "Blue Team", c: t("#2dd4a7", "#12967a") },
] as const;

const QUESTS = [
  { l: "Earn 50 XP", r: "30/50", w: 60, c: t("#7c3aed", "#a78bfa") },
  { l: "Complete 1 lesson", r: "0/1", w: 6, c: t("#38bdf8", "#7dd3fc") },
  { l: "Finish 3 activities", r: "1/3", w: 33, c: t("#ff8a4c", "#ffb37a") },
] as const;

const TRACKS = [
  { icon: "ic-book", n: "Learn", p: 88, c: "#7c3aed" },
  { icon: "ic-term", n: "Labs", p: 52, c: "#38bdf8" },
  { icon: "ic-flag", n: "CTF", p: 36, c: "#fb7185" },
  { icon: "ic-swords", n: "R v B", p: 28, c: "#f43f5e" },
] as const;

const NAV = [
  ["ic-grid", "Dashboard", true],
  ["ic-book", "Learn"],
  ["ic-term", "Cyber Range"],
  ["ic-flag", "CTF Arena"],
  ["ic-shield", "Red vs Blue"],
  ["ic-chart", "Leaderboard"],
] as const;

/** Compact, non-interactive rendition of the learner dashboard for the landing page. */
export function DashboardPreview() {
  return (
    <div className="gp-stage">
      <div className="gp-glow" aria-hidden="true" />


      <div className="gp-frame">
        <div className="gp-chrome" aria-hidden="true">
          <i style={{ background: "#ff6b6b" }} /><i style={{ background: "#f5c451" }} /><i style={{ background: "#3ec98a" }} />
          <span className="gp-url">app.cyberthulir.com/dashboard</span>
        </div>

        <div className="gp-body">
          <aside className="gp-side" aria-hidden="true">
            <div className="brand"><img src="/logo.png" alt="" />CyberThulir</div>
            {NAV.map(([ic, name, on]) => (
              <div key={name} className={`gp-nav${on ? " on" : ""}`}><Icon name={ic} />{name}</div>
            ))}
            <div className="gp-me">
              <div><img src="/bird-head.jpg" alt="" /><span>Sriram<small>Level 14 · Red track</small></span></div>
            </div>
          </aside>

          <div className="gp-main">
            <div className="gp-hero">
              <div>
                <small>Season 1 · Cold Boot</small>
                <h4>Ready? <em>Level up</em> today</h4>
                <div className="gp-xprow"><span>Level 14</span><span><b>62%</b> to Level 15</span></div>
                <div className="gd-xpbar"><i style={{ width: "62%" }} /></div>
                <div className="gp-chips">
                  <span><Icon name="ic-flame" className="ic fire" />7 day streak</span>
                  <span><Icon name="ic-gem" className="ic gem" />340</span>
                  <span><Icon name="ic-heart" className="ic heart" />4/5</span>
                </div>
              </div>
              <div className="gd-avatar" style={{ "--p": 62 } as Tone}>
                <div className="gd-avatar-ring" />
                <img src="/bird-head.jpg" alt="" />
                <span className="gd-lvl"><Icon name="ic-crown" />LVL 14</span>
              </div>
            </div>

            <div className="gp-row">
              <div className="gp-card">
                <h5>Your Cyber Path <span>3 / 7 zones</span></h5>
                <div className="gp-mini-path">
                  {NODES.map((n) => (
                    <div key={n.n} className={`gp-mn${"lock" in n ? " lock" : ""}${"cur" in n ? " cur" : ""}`} style={n.c}>
                      <i><Icon name={"lock" in n ? "ic-lock" : n.icon} /></i>
                      {n.n}
                    </div>
                  ))}
                </div>
              </div>
              <div className="gp-card">
                <h5>Daily quests <span>6h left</span></h5>
                <div className="gp-q">
                  {QUESTS.map((q) => (
                    <div key={q.l} style={q.c}>
                      <span>{q.l}<em>{q.r}</em></span>
                      <div className="gd-qbar"><i style={{ width: `${q.w}%` }} /></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="gp-row">
              <div className="gp-card">
                <h5>Skill levels <span>XP by track</span></h5>
                <div className="gp-tracks">
                  {TRACKS.map((k) => (
                    <div key={k.n}>
                      <div className="gd-ring" style={{ "--c": k.c, "--p": k.p } as Tone}><Icon name={k.icon} /></div>
                      {k.n}
                    </div>
                  ))}
                </div>
              </div>
              <div className="gp-card gp-lb">
                <h5>Season league <span>Gold</span></h5>
                <div className="gd-row"><span className="n">1</span>m0nkeyk1ng<span className="xp">14,820</span></div>
                <div className="gd-row"><span className="n">2</span>sn0wcrash<span className="xp">13,140</span></div>
                <div className="gd-row me"><span className="n">142</span>you<span className="xp">2,480</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="gp-legend">
        {[
          { icon: "ic-zap", h: "XP & levels", d: "Every lab, flag and lesson feeds a per-track level.", c: t("#7c3aed", "#5b21b6") },
          { icon: "ic-map", h: "A path, not a list", d: "A winding map of zones with stars, locks and boss gates.", c: t("#38bdf8", "#0f8fc0") },
          { icon: "ic-flame", h: "Streaks & quests", d: "Daily quests, hearts and a streak worth protecting.", c: t("#ff8a4c", "#d55a27") },
          { icon: "ic-crown", h: "Leagues", d: "Climb weekly leagues and global, college and company boards.", c: t("#f5a524", "#b9750a") },
        ].map((f) => (
          <div key={f.h}>
            <div className="gd-orb" style={f.c}><Icon name={f.icon} /></div>
            <div><b>{f.h}</b><span>{f.d}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}
