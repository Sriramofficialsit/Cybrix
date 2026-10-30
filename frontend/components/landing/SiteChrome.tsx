"use client";
import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import "./landing.css";

const NAV = [
  { name: "Home", href: "/" },
  { name: "Platform", href: "/#platform" },
  { name: "Courses", href: "/courses" },
  { name: "Certifications", href: "/#certs" },
  { name: "Contact Us", href: "/#contact" },
];

export const CERTS = [
  ["CCSF", "Security Foundation"], ["CCNSE", "Network Security Expert"], ["CWPT", "Web App Security"], ["CMASS", "Mobile App Security"],
  ["CASEP", "Advanced Security Engineering"], ["CCDO", "Certified Defensive Operations"], ["CETDRS", "Exploit & Threat Detection"],
] as const;

export function SiteHeader({ active = "" }: { active?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="ann">We&apos;re opening with a lifetime discount and direct mentor access for only 200 Early Registered Members.<Link href="/signup">Claim your spot →</Link></div>
      <header className="nav">
        <div className="w">
          <Link href="/" className="brand"><img src="/logo.png" alt="" />CyberThulir</Link>
          <nav className="links">{NAV.map((l) => <Link key={l.name} href={l.href} className={l.name === active ? "on" : ""}>{l.name}</Link>)}</nav>
          <Link href="/login" className="btn btn-o btn-sm hm">Log in</Link>
          <Link href="/signup" className="btn btn-p btn-sm hm">Join Waitlist</Link>
          <button className="menu" onClick={() => setOpen((o) => !o)} aria-label="Menu"><Icon name={open ? "a-x" : "ic-menu"} size={20} /></button>
        </div>
        <div className={`drawer${open ? " open" : ""}`}>
          {NAV.map((l) => <Link key={l.name} href={l.href} onClick={() => setOpen(false)}>{l.name}</Link>)}
          <Link href="/login" onClick={() => setOpen(false)}>Log in</Link>
          <Link href="/signup" className="btn btn-p" onClick={() => setOpen(false)}>Join Waitlist</Link>
        </div>
      </header>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer>
      <div className="w">
        <div className="fgrid">
          <div><Link href="/" className="brand"><img src="/logo.png" alt="" />CyberThulir</Link><p>A forward-thinking cybersecurity initiative dedicated to nurturing the next generation of digital defenders — attacker-informed, lab-first, and built for real careers.</p></div>
          <div><h5>Programs</h5>{CERTS.map(([c, n]) => <a key={c}>{c} — {n}</a>)}</div>
          <div><h5>Company</h5><a>About Us</a><Link href="/courses">Courses</Link><a>Contact Us</a><Link href="/login">Log in</Link><Link href="/signup">Sign up</Link></div>
          <div><h5>Serving</h5><span className="li">India</span><span className="li">Malaysia</span><span className="li">Indonesia</span></div>
        </div>
        <div className="fbar"><span>© 2026 CyberThulir — a unit of HebeSec Technologies Pvt. Ltd.</span><span>Privacy · Terms · Sitemap</span></div>
      </div>
    </footer>
  );
}
