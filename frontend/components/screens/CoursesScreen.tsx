"use client";
import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import "@/components/landing/courses.css";

type Level = "Beginner" | "Intermediate" | "Advanced";
const COURSES: { ic: string; level: Level; code: string; name: string; d: string; tags: string[]; hrs: string; mods: string; wk: string; href?: string }[] = [
  { ic: "ic-zap", level: "Beginner", code: "CCSF", name: "CyberThulir Certified Security Foundations", d: "Reconnaissance, scanning, and vulnerability analysis.", tags: ["Red Teaming", "Nmap", "Enumeration", "OpenVAS"], hrs: "30–36 hrs", mods: "5–6 modules", wk: "5–7 hrs/wk", href: "/courses/ccsf" },
  { ic: "ic-shield", level: "Intermediate", code: "CWPT · VAPT", name: "CyberThulir Web Penetration Tester (CWPT)", d: "Simulate attacks, expose weaknesses — act like a threat.", tags: ["Passive recon", "DNS enumeration", "SQL injection", "MFA bypass"], hrs: "30 hrs", mods: "6 modules", wk: "5–7 hrs/wk" },
  { ic: "ic-chart", level: "Intermediate", code: "CCDO · SOC", name: "Certified Cyber Defense Operator (CCDO)", d: "Detect, hunt, respond — think like the attacker.", tags: ["SOC architecture", "Log sources", "SIEM tuning", "Disk forensics"], hrs: "60 hrs", mods: "8 modules", wk: "8–10 hrs/wk" },
  { ic: "ic-flag", level: "Advanced", code: "CCNSE", name: "CyberThulir Certified Network Security Expert", d: "Exploitation, web attacks, and professional reporting.", tags: ["Exploitation", "Privilege Escalation", "OWASP Top 10", "Burp Suite"], hrs: "36–45 hrs", mods: "6–7 modules", wk: "6–8 hrs/wk" },
  { ic: "ic-term", level: "Advanced", code: "CMASS · VAPT", name: "Certified Mobile Application Security Specialist (CMASS)", d: "Test, break, and secure real-world mobile applications.", tags: ["Android architecture", "Static analysis", "Insecure IPC", "iOS architecture"], hrs: "60 hrs", mods: "8 modules", wk: "8–10 hrs/wk" },
  { ic: "ic-target", level: "Advanced", code: "CASEP · VAPT", name: "Certified API Security & Exploitation Professional (CASEP)", d: "Test, break, and secure real-world APIs.", tags: ["API discovery", "API fuzzing", "NoSQL injection", "BOLA / IDOR"], hrs: "60 hrs", mods: "8 modules", wk: "8–10 hrs/wk" },
  { ic: "ic-award", level: "Advanced", code: "CETDRS · SOC", name: "Certified Endpoint Threat Detection & Response Specialist (CETDRS)", d: "Detect, analyze, anticipate — think like the adversary.", tags: ["Windows architecture", "Types of CTI", "Privilege escalation", "CTI fusion"], hrs: "60 hrs", mods: "8 modules", wk: "8–10 hrs/wk" },
];
const LV = { Beginner: "b", Intermediate: "i", Advanced: "a" } as const;
const GLANCE = [
  ["CCSF", "CyberThulir Certified Security Foundations", "Beginner", "30–36", "5–6", "5–7 hrs"],
  ["CCNSE", "CyberThulir Certified Network Security Expert", "Advanced", "36–45", "6–7", "6–8 hrs"],
  ["CWPT", "CyberThulir Web Penetration Tester", "Intermediate", "30", "6", "5–7 hrs"],
  ["CMASS", "Certified Mobile Application Security Specialist", "Advanced", "60", "8", "8–10 hrs"],
  ["CASEP", "Certified API Security & Exploitation Professional", "Advanced", "60", "8", "8–10 hrs"],
  ["CCDO", "Certified Cyber Defense Operator", "Intermediate", "60", "8", "8–10 hrs"],
  ["CETDRS", "Certified Endpoint Threat Detection & Response Specialist", "Advanced", "60", "8", "8–10 hrs"],
];
const APPROACH = [
  ["ic-target", "Attacker-informed", "Every syllabus is built from real attack techniques, not textbook theory."],
  ["ic-term", "Lab-first learning", "More time in terminals than slides. Hands-on from module one."],
  ["ic-map", "ATT&CK mapped", "Detection content maps directly to MITRE ATT&CK tactics and techniques."],
  ["ic-chart", "Progressive path", "From CCSF to CETDRS — a clear, stackable learning journey."],
  ["ic-book", "Flexible formats", "Online, offline, or hybrid. Learn on your schedule."],
  ["ic-cert", "Certification", "Pass the final assessment and earn a CyberThulir certificate."],
];
const TOOLS = ["Nmap", "Wireshark", "Burp Suite", "Metasploit", "Kali Linux", "Volatility", "Ghidra", "Splunk", "Sigma", "YARA", "Hashcat", "OWASP ZAP", "Autopsy", "MITRE ATT&CK"];
const FILTERS = ["All", "Beginner", "Intermediate", "Advanced"] as const;

export default function CoursesScreen() {
  const [f, setF] = useState<(typeof FILTERS)[number]>("All");
  const list = COURSES.filter((c) => f === "All" || c.level === f);
  const count = (k: string) => (k === "All" ? COURSES.length : COURSES.filter((c) => c.level === k).length);
  return (
    <>
      <section className="chead">
        <div className="w">
          <div>
            <span className="kicker"><i />CyberThulir · All programs</span>
            <h1>Learn to hack. <span className="hl">Learn to defend.</span></h1>
            <p className="lede">Start as a beginner and progress to advanced levels with structured certifications. Learn by doing and gain the skills needed for real cybersecurity situations.</p>
            <div className="ctas">
              <a href="#programs" className="btn btn-p">Browse certifications <Icon name="ic-arrow" size={18} /></a>
              <Link href="/#contact" className="btn btn-o">Talk to an advisor</Link>
            </div>
            <div className="mini"><div><b>7</b><span>Certifications</span></div><div><b>150+</b><span>Hours</span></div><div><b>100%</b><span>Hands-on</span></div></div>
          </div>
          <div className="cart"><img src="/bird-courses.jpg" alt="CyberThulir mascot presenting the course catalog" /></div>
        </div>
      </section>

      <section className="tools2"><div className="w"><em>Tools you&apos;ll use</em>{TOOLS.map((t) => <span key={t}>{t}</span>)}</div></section>

      <section className="sec" id="programs">
        <div className="w">
          <div className="sh"><span className="eyebrow">Programs</span><h2>All certifications</h2><p>Structured paths from reconnaissance to full red-team operations and blue-team defense.</p></div>
          <div className="rec"><div className="lab">Recommended learning path</div>
            <ol>{[["CCSF", "Beginner"], ["CWPT", "Intermediate"], ["CMASS", "Advanced"], ["CCDO", "SOC & Blue"]].map(([c, l]) => <li key={c}><i /><b>{c}</b><span>{l}</span></li>)}</ol></div>
          <div className="filters">{FILTERS.map((k) => <button key={k} className={`fbtn${f === k ? " on" : ""}`} onClick={() => setF(k)}>{k}<small>{count(k)}</small></button>)}</div>
          <div className="cgrid">
            {list.map((c) => {
              const inner = (
                <>
                  <div className="cc-top"><span className="ico"><Icon name={c.ic} /></span><span className={`lvl ${LV[c.level]}`}>{c.level}</span></div>
                  <span className="code">{c.code}</span><h3>{c.name}</h3><p>{c.d}</p>
                  <div className="tags">{c.tags.map((t) => <span key={t}>{t}</span>)}</div>
                  <div className="meta2"><span><Icon name="ic-clock" />{c.hrs}</span><span><Icon name="ic-layers" />{c.mods}</span><span><Icon name="ic-cal" />{c.wk}</span></div>
                </>
              );
              return c.href ? <Link key={c.code} href={c.href} className="cc">{inner}</Link> : <div key={c.code} className="cc">{inner}</div>;
            })}
            {f === "All" && (
              <div className="cc help"><span className="ico"><Icon name="ic-map" /></span><h3>Not sure where to start?</h3><p>Tell us your background and goal — we&apos;ll map the right path across these certifications.</p><Link href="/#contact" className="btn btn-p btn-sm">Talk to an advisor</Link></div>
            )}
          </div>
        </div>
      </section>

      <section className="sec tint">
        <div className="w">
          <div className="sh c"><span className="eyebrow">Our approach</span><h2>Built different. Designed to produce practitioners.</h2><p>We&apos;re not another course platform. We&apos;re a combat training ground for the next generation of cyber professionals.</p></div>
          <div className="g3">{APPROACH.map(([ic, t, d]) => <div className="card" key={t}><span className="ico"><Icon name={ic} /></span><h3>{t}</h3><p>{d}</p></div>)}</div>
        </div>
      </section>

      <section className="sec">
        <div className="w">
          <div className="sh"><span className="eyebrow">Compare</span><h2>All certifications at a glance</h2></div>
          <div className="tw"><table className="gl"><thead><tr><th>Program</th><th>Level</th><th>Hours</th><th>Modules</th><th>Effort / wk</th></tr></thead><tbody>
            {GLANCE.map(([c, n, l, h, m, e]) => <tr key={c}><td><b>{c}</b>{n}</td><td><span className={`lvl ${LV[l as Level]}`}>{l}</span></td><td>{h}</td><td>{m}</td><td>{e}</td></tr>)}
          </tbody></table></div>
        </div>
      </section>

      <section className="sec tint">
        <div className="w"><div className="final"><h2>Your cybersecurity career starts with one course.</h2><p>Pick the right level, enroll, and start building real skills from day one. No fluff — just hands-on, attacker-informed training.</p>
          <div className="ctas" style={{ justifyContent: "center", marginTop: 0 }}><Link href="/#contact" className="btn btn-c">Contact us <Icon name="ic-arrow" size={16} /></Link><Link href="/signup" className="btn btn-ghost">Join the waitlist</Link></div>
          <div className="trust">{[["ic-cert", "Verified credentials"], ["ic-shield", "Enterprise security"], ["ic-users", "Expert mentors"], ["ic-chart", "Real progress"]].map(([ic, t]) => <span key={t}><Icon name={ic} />{t}</span>)}</div></div></div>
      </section>
    </>
  );
}
