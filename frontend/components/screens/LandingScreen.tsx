"use client";
import Link from "next/link";
import { Icon } from "@/components/Icon";
import { SiteHeader, SiteFooter, CERTS } from "@/components/landing/SiteChrome";
import { ArtSkillTree, ArtLab, ArtCtf, ArtBattle, ArtSoc, ArtCert } from "@/components/landing/FeatureArt";
import { LabVisual, CtfVisual, BattleVisual, SocVisual } from "@/components/landing/DeepArt";
import { STEP_ART } from "@/components/landing/StepArt";
import { CertBadge, OffenseArt, DefenseArt, type Track } from "@/components/landing/SectionArt";
import { MentorArt, WebinarArt, BoardArt, ThreatArt } from "@/components/landing/EcoArt";
import { ProductFrame } from "@/components/landing/ProductFrame";
import "@/components/landing/landing.css";

const STATS = [["7", "Industry Certifications"], ["100%", "Practical. Zero Passive Learning."], ["50+", "Hands-On Labs"]];

const FEATURES = [
  [ArtSkillTree, "ic-map", "Guided skill tree", "Bite-sized lessons in networking, Linux, web security and cryptography — unlocked as you level up.", "Learn"],
  [ArtLab, "ic-term", "Hands-on hacking labs", "Real vulnerable targets (DVWA, OWASP Juice Shop) and a Kali terminal in one click — no setup, no VM.", "Labs"],
  [ArtCtf, "ic-flag", "CTF arena", "Capture-the-flag across web, pwn, crypto and forensics to build genuine offensive skills.", "Compete"],
  [ArtBattle, "ic-swords", "Red vs Blue battles", "Live attack-and-defend matches against other learners — offence and defence in real time.", "Live"],
  [ArtSoc, "ic-radar", "Blue Team & SOC", "Investigate real logs, hunt threats and learn detection like a Security Operations Centre analyst.", "Defend"],
  [ArtCert, "ic-cert", "Verifiable certifications", "Seven certification tracks with proctored exams and tamper-evident, shareable credentials.", "Certify"],
] as const;

const STEPS = [
  ["Enroll & get onboarded", "Start with a guided introduction and unlock your personalised learning roadmap."],
  ["Attend live sessions", "Join interactive, instructor-led briefings with real-time demos and Q&A."],
  ["Practice in hands-on labs", "Apply concepts in secure, enterprise-grade simulated environments."],
  ["Work on scenario exercises", "Solve end-to-end tasks modelled on real incidents and engagements."],
  ["Get expert guidance", "Receive mentor feedback, reviews and tactical support throughout."],
  ["Validate your skills", "Complete practical assessments and scenario-based evaluations."],
  ["Achieve skill progression", "Advance step-by-step from beginner to specialist to professional level."],
] as const;

const CERT_META: readonly (readonly [string, string, Track, string, string, number])[] = [
  ["CCSF", "Security Foundation", "foundation", "Beginner", "30–36 hrs", 1],
  ["CWPT", "Web App Security", "offensive", "Intermediate", "30 hrs", 2],
  ["CCDO", "Certified Defensive Operations", "defensive", "Intermediate", "60 hrs", 2],
  ["CCNSE", "Network Security Expert", "offensive", "Advanced", "36–45 hrs", 3],
  ["CMASS", "Mobile App Security", "offensive", "Advanced", "60 hrs", 3],
  ["CASEP", "Advanced Security Engineering", "offensive", "Advanced", "60 hrs", 3],
  ["CETDRS", "Exploit & Threat Detection", "defensive", "Advanced", "60 hrs", 3],
];

const QUOTES = [
  ["I used to think cybersecurity was complicated and about following rules. CyberThulir made it feel like a real-life adventure. I got confidence to stay put in blue team. Improved my skills, which kept me interested. CyberThulir really changed my view, on defense.", "Kalaiveni R", "CyberSecurity Intern", "Tirunelveli"],
  ["I come from a town and I never thought I would be able to learn about cybersecurity and how to protect people from hackers. CyberThulir made it really easy for me to understand technology because they made it like a game. I had a lot of fun learning about cybersecurity, with CyberThulir. Now I feel like I can make a career out of cybersecurity. I am glad I got to learn about hacking and digital defense with CyberThulir.", "Ragu G", "Security Analyst Intern", "Krishnagiri"],
  ["I had a tough time understanding the basic security concepts in class. Then I did these lab exercises where I had to find threats and fix security vulnerabilities. Doing these labs really helped me understand security definitions. It was like everything suddenly made sense. The core security definitions that I was struggling with became clear, to me.", "Allen Joseph G", "VAPT Analyst", "Bangalore"],
] as const;

export default function LandingScreen() {
  return (
    <div className="lp">
      <SiteHeader />

      {/* HERO */}
      <section className="hero">
        <div className="w">
          <div>
            
            <h1>Master cybersecurity by hacking — <span className="hl">labs, CTFs &amp; certifications</span></h1>
            <p className="lede">CyberThulir is a gamified, hands-on ethical hacking and cybersecurity training platform. Learn by breaking and defending real systems — earn XP, climb leaderboards and get certified.</p>
            <div className="ctas">
              <Link href="/signup" className="btn btn-p">Get started — it&apos;s free <Icon name="ic-arrow" size={18} /></Link>
              <Link href="/courses" className="btn btn-o">Explore courses</Link>
            </div>
            <div className="regions"><Icon name="ic-pin" size={16} />Built for learners in India · Malaysia · Indonesia</div>
          </div>
          <div className="heroart">
            <div className="panel" />
            <img src="/mascot-hero.png" alt="CyberThulir mascot" />
            <div className="float-card fc1"><span className="dot"><Icon name="ic-flag" /></span><div><b>Flag captured</b><span>web · sqli-login · +120 XP</span></div></div>
            <div className="float-card fc2"><span className="dot" style={{ background: "#06b6d4" }}><Icon name="ic-swords" /></span><div><b>Red vs Blue</b><span>Live match in progress</span></div></div>
          </div>
        </div>
      </section>

      <section className="strip"><div className="w"><div className="sgrid">{[["ic-cert", "7", "Industry Certifications"], ["ic-target", "100%", "Practical. Zero Passive Learning."], ["ic-flask", "50+", "Hands-On Labs"]].map(([ic, n, l]) => <div className="s" key={l}><span className="ti2"><Icon name={ic} /></span><div><b>{n}</b><span>{l}</span></div></div>)}</div></div></section>

      {/* TESTIMONIALS */}
      <section className="sec tint" id="reviews">
        <div className="w">
          <div className="sh c"><span className="eyebrow">From our learners</span><h2>Early members, real results</h2><p>What learners say after training with hands-on labs and real scenarios.</p></div>
          <div className="tgrid">
            {QUOTES.map(([q, n, r, c]) => (
              <figure className="tcard" key={n}>
                <svg className="qmark" viewBox="0 0 32 32" aria-hidden="true"><path d="M13 8C8.6 9.6 6 13.2 6 18v6h8v-8H10c0-2.6 1.2-4.6 3.6-5.8L13 8zm13 0c-4.4 1.6-7 5.2-7 10v6h8v-8h-4c0-2.6 1.2-4.6 3.6-5.8L26 8z" fill="currentColor" /></svg>
                <div className="stars" aria-label="5 out of 5">★★★★★</div>
                <blockquote>{q}</blockquote>
                <figcaption><span className="av">{n[0]}</span><div><b>{n}</b><span>{r}</span><em><Icon name="ic-pin" size={12} />{c}</em></div></figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* AUDIENCE */}
      <section className="sec">
        <div className="w">
          <div className="sh c"><span className="eyebrow">Who it&apos;s for</span><h2>Built for students and cybersecurity professionals</h2><p>Whether you&apos;re starting out or levelling up your career, CyberThulir turns ethical hacking, penetration testing and blue-team defence into a path you can actually finish.</p></div>
          <div className="g2">
            <div className="card"><span className="ico"><Icon name="ic-book" /></span><h3>For students</h3><p>Start from zero — networking, Linux and web security — with guided modules, free hands-on labs and CTFs that build a portfolio and job-ready skills.</p><ul><li>Guided modules from first principles</li><li>Free labs and CTFs</li><li>Portfolio-ready projects</li></ul></div>
            <div className="card"><span className="ico"><Icon name="ic-target" /></span><h3>For professionals</h3><p>Sharpen red-team and SOC / blue-team skills, practise on real CVEs, and earn verifiable certifications to prove your expertise to employers.</p><ul><li>Real CVEs and attack scenarios</li><li>Red-team and blue-team tracks</li><li>Verifiable, shareable credentials</li></ul></div>
          </div>
        </div>
      </section>

      {/* PLATFORM */}
      <section className="sec tint" id="platform">
        <div className="w">
          <div className="sh c"><span className="eyebrow">The platform</span><h2>Hands-on cybersecurity training that gets you job-ready</h2></div>
          <div className="g3 fgrid3">{FEATURES.map(([Art, ic, title, d, tag]) => <div className="card fcard" key={title}><Art /><div className="fbody"><div className="frow2"><span className="ico"><Icon name={ic} /></span><span className="ftag">{tag}</span></div><h3>{title}</h3><p>{d}</p></div></div>)}</div>
        </div>
      </section>

      {/* FEATURE DEEP-DIVES */}
      <section className="sec">
        <div className="w">
          <div className="frow">
            <div>
              <span className="eyebrow">Gamified labs</span><h3>Real targets. A Kali terminal in one click.</h3>
              <p>Practise on intentionally vulnerable applications directly in your browser — no setup, no VM, no risk.</p>
              <ul><li><Icon name="ic-check" />DVWA and OWASP Juice Shop, ready to attack</li><li><Icon name="ic-check" />Guided hints that unlock as you get stuck</li><li><Icon name="ic-check" />XP and progress tracked automatically</li></ul>
              <Link href="/range" className="btn btn-p btn-sm">Open cyber range <Icon name="ic-arrow" size={16} /></Link>
            </div>
            <LabVisual />
          </div>
          <div className="frow rev">
            <div>
              <span className="eyebrow">CTF arena</span><h3>Capture the flag across every offensive discipline.</h3>
              <p>Compete on challenges in web, pwn, crypto and forensics — and climb the season leaderboard.</p>
              <ul><li><Icon name="ic-check" />Web, pwn, crypto and forensics categories</li><li><Icon name="ic-check" />Points, first-blood bonuses and badges</li><li><Icon name="ic-check" />Season leaderboard and academy rankings</li></ul>
              <Link href="/ctf" className="btn btn-p btn-sm">Enter the arena <Icon name="ic-arrow" size={16} /></Link>
            </div>
            <CtfVisual />
          </div>
          <div className="frow">
            <div>
              <span className="eyebrow">Cyber warfare simulation</span><h3>Enter the ultimate battlefield.</h3>
              <p>Experience interactive Red Team vs Blue Team missions where you practise both attacking and defending systems — live, against other learners.</p>
              <ul><li><Icon name="ic-check" />Attack-and-defend matches in real time</li><li><Icon name="ic-check" />Learn, adapt and build skills on real scenarios</li></ul>
              <Link href="/red-vs-blue" className="btn btn-p btn-sm">Enter battlefield <Icon name="ic-arrow" size={16} /></Link>
            </div>
            <BattleVisual />
          </div>
          <div className="frow rev">
            <div>
              <span className="eyebrow">Blue Team & SOC</span><h3>Investigate real logs. Hunt real threats.</h3>
              <p>Learn detection the way a Security Operations Centre analyst does — triage alerts, correlate events and respond to incidents.</p>
              <ul><li><Icon name="ic-check" />Detect, analyse and respond workflow</li><li><Icon name="ic-check" />Real log datasets and detection rules</li></ul>
            </div>
            <SocVisual />
          </div>
        </div>
      </section>

      {/* DASHBOARD */}
      <section className="band">
        <div className="w">
          <div className="sh c"><span className="eyebrow">Your training HQ</span><h2>One dashboard for everything you learn</h2><p>Track XP, streaks, daily quests, your cyber path and season rank — every lab and lesson moves you forward.</p></div>
          <ProductFrame />
        </div>
      </section>

      {/* MASTERY PATH */}
      <section className="sec tint" id="mastery">
        <div className="w">
          <div className="sh c"><span className="eyebrow">Structured learning</span><h2>CyberPro mastery path</h2><p>A proven seven-step journey from complete beginner to certified cyber professional.</p></div>
          <ol className="rmap">
            {STEPS.map(([title, d], i) => {
              const Art = STEP_ART[i];
              return (
                <li className={`rstep ${i % 2 ? "r" : "l"}`} key={title}>
                  <div className="rcard">
                    <Art />
                    <div className="rbody"><span className="rn">Step {String(i + 1).padStart(2, "0")}</span><h4>{title}</h4><p>{d}</p></div>
                  </div>
                  <span className="rdot">{i + 1}</span>
                </li>
              );
            })}
            <li className="rstep end">
              <div className="rgoal"><span className="rtrophy"><Icon name="ic-award" /></span><div><small>Outcome</small><h4>Certified &amp; career-ready</h4><p>Earn a verifiable credential and the skills to land your dream role.</p></div></div>
            </li>
          </ol>
        </div>
      </section>

      {/* CERTS */}
      <section className="sec tint" id="certs">
        <div className="w">
          <div className="sh c"><span className="eyebrow">Programs</span><h2>Seven industry certifications</h2><p>Proctored exams and tamper-evident, shareable credentials that prove your expertise to employers.</p></div>
          <div className="cbar">{[["foundation", "Foundation"], ["offensive", "Offensive"], ["defensive", "Defensive"]].map(([k, l]) => <span key={k} className={`cl ${k}`}><i />{l}</span>)}</div>
          <div className="cgrid7">
            {CERT_META.map(([code, name, track, level, hrs, stars]) => (
              <div className={`ccard ${track}`} key={code}>
                <div className="cart"><CertBadge code={code} track={track} stars={stars} /></div>
                <div className="cbody"><span className="clevel">{level}</span><h3>{name}</h3><span className="chrs"><Icon name="ic-clock" size={14} />{hrs}</span></div>
              </div>
            ))}
            <Link href="/courses" className="ccard more"><span className="mico"><Icon name="ic-arrow" size={26} /></span><h3>Explore all certifications</h3><p>Curriculum, hours and prerequisites</p></Link>
          </div>
        </div>
      </section>

      {/* ECOSYSTEM */}
      <section className="sec">
        <div className="w">
          <div className="sh c"><span className="eyebrow">Enter the Cyber Arena</span><h2>More than courses</h2><p>Everything around the labs that keeps you learning, competing and connected.</p></div>
          <div className="egrid">
            {[[MentorArt, "ic-users", "Mentorship program", "Guidance from industry experts."], [WebinarArt, "ic-play", "Webinars & workshops", "Live learning sessions."], [BoardArt, "ic-crown", "Leaderboard", "Academy rankings and seasons."], [ThreatArt, "ic-bulb", "Threat modeling game", "Strategic cybersecurity simulation."]].map(([Art, ic, title, d]) => {
              const A = Art as () => React.JSX.Element;
              return <div className="ecard" key={title as string}><A /><div className="ebody"><span className="ico"><Icon name={ic as string} /></span><div><h3>{title as string}</h3><p>{d as string}</p></div></div></div>;
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="sec" id="contact">
        <div className="w"><div className="final"><h2>Start your cybersecurity career with hands-on, lab-first training</h2><p>Join CyberThulir free and turn ethical hacking and defence into a game you actually want to play.</p>
          <div className="ctas" style={{ justifyContent: "center", marginTop: 0 }}><Link href="/signup" className="btn btn-c">Create your free account</Link><Link href="/courses" className="btn btn-ghost">Browse courses</Link></div></div></div>
      </section>

      {/* LEARNING PATH */}
      <section className="sec" id="path">
        <div className="w">
          <div className="sh c"><span className="eyebrow">Choose your track</span><h2>Your learning path</h2></div>
          <div className="tree">
            <div className="tnode start"><span className="ti"><Icon name="ic-book" /></span><div><small>Get started</small><p>Learn the fundamentals and build a strong foundation.</p></div></div>
            <i className="vl" />
            <div className="tnode choose"><span className="ti"><Icon name="ic-target" /></span><small>Choose your path</small></div>
            <i className="vl" />
            <div className="tsplit">
              <div className="tcol off">
                <div className="thead"><OffenseArt /><div className="ttxt"><span className="ti"><Icon name="ic-bug" /></span><small>Offensive security</small><p>Think like an attacker. Find weaknesses.</p></div></div>
                <div className="tsub">
                  {[["ic-search", "Reconnaissance", "Gather information and enumerate targets."], ["ic-bug", "Exploitation", "Find and exploit vulnerabilities."], ["ic-term", "Post exploitation", "Maintain access and achieve objectives."]].map(([ic, t, d]) => <div key={t}><Icon name={ic} /><b>{t}</b><span>{d}</span></div>)}
                </div>
              </div>
              <div className="tcol def">
                <div className="thead"><DefenseArt /><div className="ttxt"><span className="ti"><Icon name="ic-shield" /></span><small>Defensive security</small><p>Defend systems. Protect what matters.</p></div></div>
                <div className="tsub">
                  {[["ic-eye", "Detect", "Monitor systems and identify threats."], ["ic-chart", "Analyze", "Investigate alerts and understand attacks."], ["ic-check", "Respond", "Contain threats and strengthen defenses."]].map(([ic, t, d]) => <div key={t}><Icon name={ic} /><b>{t}</b><span>{d}</span></div>)}
                </div>
              </div>
            </div>
            <div className="tmerge"><i /></div>
            <div className="tnode grow"><span className="ti"><Icon name="ic-zap" /></span><div><small>Keep growing</small><p>Practice, build projects, and advance your career.</p></div></div>
            <i className="vl" />
            <div className="tfour">
              {[["ic-flask", "Hands-on labs", "Practice with real scenarios."], ["ic-cert", "Certifications", "Validate your skills and stand out."], ["ic-users", "Community", "Learn, share and grow with others."], ["ic-target", "Career ready", "Gain the skills to land your dream role."]].map(([ic, t, d]) => <div className="card" key={t}><span className="ico"><Icon name={ic} /></span><h3>{t}</h3><p>{d}</p></div>)}
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
