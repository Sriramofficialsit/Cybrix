"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon } from "./Icon";
import { MKT_LINKS } from "@/lib/nav";

export function MarketingHeader() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) =>
    href === "/" ? path === "/" : path.startsWith(href.split("#")[0]);

  return (
    <>
      <div style={{ background: "rgba(124,58,237,.08)", borderBottom: "1px solid rgba(124,58,237,.14)", backdropFilter: "blur(6px)" }}>
        <div className="wrap" style={{ padding: "9px 22px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontSize: 12.5, color: "#5b21b6", textAlign: "center", flexWrap: "wrap" }}>
          <span>Opening with a lifetime discount &amp; direct mentor access for the first <b>200 early registered members</b></span>
          <Link href="/login" style={{ fontWeight: 700, color: "#5b21b6", display: "inline-flex", alignItems: "center", gap: 4 }}>
            Claim your spot <Icon name="ic-arrow" size={13} style={{ stroke: "#5b21b6" }} />
          </Link>
        </div>
      </div>

      <div className="glass-t" style={{ position: "sticky", top: 0, zIndex: 40 }}>
        <div className="wrap" style={{ height: 66, display: "flex", alignItems: "center", gap: 28 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/logo.png" alt="CyberThulir logo" style={{ width: 32, height: 32, objectFit: "contain", flex: "none" }} />
            <span className="disp" style={{ fontWeight: 700, fontSize: 16 }}>CyberThulir</span>
          </Link>
          <nav className="mkt-links" style={{ display: "flex", gap: 26, marginLeft: 12 }}>
            {MKT_LINKS.map((l) => (
              <Link key={l.name} href={l.href} className="navi" style={{ padding: 0, background: "none", fontWeight: active(l.href) ? 600 : 500, color: active(l.href) ? "#1f1633" : "#6a6480" }}>
                {l.name}
              </Link>
            ))}
          </nav>
          <div style={{ flex: 1 }} />
          <Link href="/login" className="btn btn-g mkt-links" style={{ textTransform: "none", letterSpacing: 0, fontWeight: 600, color: "#6a6480" }}>Log in</Link>
          <Link href="/login" className="btn btn-v mkt-links">Join Waitlist</Link>
          <button className="btn btn-g mkt-menu-btn" style={{ padding: 10 }} onClick={() => setOpen((o) => !o)} aria-label="Menu">
            <Icon name={open ? "a-x" : "ic-menu"} size={20} />
          </button>
        </div>
        <div className={`mkt-drawer${open ? " open" : ""}`}>
          {MKT_LINKS.map((l) => (
            <Link key={l.name} href={l.href} onClick={() => setOpen(false)}>{l.name}</Link>
          ))}
          <Link href="/login" className="btn btn-v" style={{ marginTop: 10 }} onClick={() => setOpen(false)}>Join Waitlist</Link>
        </div>
      </div>
    </>
  );
}

export function MarketingFooter() {
  return (
    <footer className="glass-t">
      <div className="wrap" style={{ padding: "48px 22px", display: "flex", gap: 48, flexWrap: "wrap" }}>
        <div style={{ minWidth: 240, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <img src="/logo.png" alt="CyberThulir logo" style={{ width: 30, height: 30, objectFit: "contain", flex: "none" }} />
            <span className="disp" style={{ fontWeight: 700, fontSize: 15 }}>CyberThulir</span>
          </div>
          <p style={{ fontSize: 13, color: "#8b8599", maxWidth: 280, lineHeight: 1.6 }}>
            A forward-thinking cybersecurity initiative nurturing the next generation of digital defenders — attacker-informed, lab-first, and built for real careers. <em>Thulir</em> means growth and new beginnings.
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 16, color: "#9a94ab" }}>
            <Icon name="ic-in" size={18} /><Icon name="ic-ig" size={18} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 48, flexWrap: "wrap", fontSize: 13 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Programs</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9, color: "#6a6480" }}>
              {["CCSF — Security Foundations", "CCNSE — Network Security Expert", "CWPT — Web Penetration Tester", "CMASS — Mobile App Security", "CASEP — API Security & Exploitation", "CCDO — Cyber Defense Operator", "CETDRS — Endpoint Threat Detection"].map((p) => (
                <a key={p} style={{ color: "#6a6480" }}>{p}</a>
              ))}
            </div>
          </div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Company</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9, color: "#6a6480" }}>
              <a style={{ color: "#6a6480" }}>About Us</a>
              <Link href="/courses" style={{ color: "#6a6480" }}>Courses</Link>
              <a style={{ color: "#6a6480" }}>Contact Us</a>
            </div>
          </div>
          <div>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Contact</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, color: "#6a6480" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Icon name="ic-mail" size={14} style={{ stroke: "#b7b1c2" }} />info@cyberthulir.com</span>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}><Icon name="ic-phone" size={14} style={{ stroke: "#b7b1c2" }} />+91 95660 22629</span>
              <span style={{ display: "flex", alignItems: "flex-start", gap: 8 }}><Icon name="ic-pin" size={14} style={{ stroke: "#b7b1c2", marginTop: 2 }} />Karaikudi, Tamil Nadu<br />HebeSec Technologies Pvt. Ltd</span>
            </div>
          </div>
        </div>
      </div>
      <div className="wrap" style={{ padding: "18px 22px", borderTop: "1px solid rgba(124,58,237,.12)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, fontSize: 12, color: "#9a94ab" }}>
        <span>© 2026 CyberThulir. All rights reserved.</span>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ width: 7, height: 7, borderRadius: 999, background: "#8ac34a" }} />Platform live</span>
        <span style={{ display: "flex", gap: 16 }}><a style={{ color: "#9a94ab" }}>Privacy</a><a style={{ color: "#9a94ab" }}>Terms</a><a style={{ color: "#9a94ab" }}>Sitemap</a></span>
      </div>
    </footer>
  );
}
