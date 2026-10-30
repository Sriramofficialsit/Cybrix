"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import { ADMIN_NAV } from "@/lib/nav";

export function AdminShell({ crumb, children }: { crumb: string; children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);

  return (
    <div className={`shell${open ? " open" : ""}`}>
      <div className="shell-scrim" onClick={() => setOpen(false)} />

      <aside
        className="shell-aside"
        style={{
          width: 236,
          flex: "none",
          background: "linear-gradient(180deg,#1b1030,#150f23)",
          borderRight: "1px solid rgba(124,58,237,.2)",
          display: "flex",
          flexDirection: "column",
          padding: "18px 14px",
          overflow: "hidden",
        }}
      >
        <Link href="/admin" style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 8px 6px" }}>
          <img src="/logo.png" alt="CyberThulir logo" style={{ width: 30, height: 30, objectFit: "contain", flex: "none" }} />
          <div>
            <div className="disp" style={{ color: "#fff", fontWeight: 700, fontSize: 14, lineHeight: 1 }}>CyberThulir</div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".5px", color: "#a98fe6" }}>ADMIN PORTAL</div>
          </div>
        </Link>
        <nav style={{ display: "flex", flexDirection: "column", gap: 1, flex: 1, overflow: "auto" }}>
          {ADMIN_NAV.map((g) => (
            <div key={g.group}>
              <div className="navg">{g.group}</div>
              {g.items.map((it) => (
                <Link key={it.href} href={it.href} className={`navi${path === it.href ? " on" : ""}`} style={{ color: path === it.href ? "#fff" : "rgba(255,255,255,.62)" }}>
                  <Icon name={it.icon} size={16} />
                  {it.name}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: 9, borderRadius: 11, background: "rgba(255,255,255,.06)", marginTop: 8 }}>
          <img src="/bird-head.jpg" className="avatar" style={{ width: 28, height: 28 }} alt="" />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>admin@cyberthulir</div>
            <div style={{ fontSize: 10, color: "#a98fe6" }}>Super admin</div>
          </div>
        </div>
      </aside>

      <div className="admin-shell-content" style={{ display: "flex", flexDirection: "column" }}>
        <div className="shell-topbar">
          <button className="btn btn-g" style={{ padding: 9 }} onClick={() => setOpen(true)} aria-label="Open menu">
            <Icon name="a-grid" size={18} />
          </button>
          <span style={{ fontSize: 13, color: "#9a8fb5" }}>
            Admin <span style={{ color: "#c9bfe0" }}>/</span> <span style={{ color: "#1f1633", fontWeight: 600 }}>{crumb}</span>
          </span>
        </div>

        <header
          className="shell-main-header"
          style={{
            height: 60,
            flex: "none",
            borderBottom: "1px solid rgba(124,58,237,.12)",
            background: "rgba(255,255,255,.55)",
            backdropFilter: "blur(16px) saturate(1.4)",
            WebkitBackdropFilter: "blur(16px) saturate(1.4)",
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "0 28px",
          }}
        >
          <div style={{ fontSize: 13, color: "#9a8fb5" }}>
            Admin <span style={{ color: "#c9bfe0" }}>/</span> <span style={{ color: "#1f1633", fontWeight: 600 }}>{crumb}</span>
          </div>
          <div style={{ flex: 1 }} />
          <div className="tb-search" style={{ width: 260 }}>
            <Icon name="a-search" size={15} style={{ stroke: "#a79fbe" }} />
            <span style={{ fontSize: 12 }}>Search users, labs, orgs…</span>
          </div>
          <button className="tb-iconbtn" aria-label="Notifications">
            <Icon name="a-bell" size={17} style={{ color: "#6a6480" }} />
            <span style={{ position: "absolute", top: 5, right: 5, width: 15, height: 15, borderRadius: 999, background: "#e5484d", color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 2px rgba(255,255,255,.9)" }}>5</span>
          </button>
          <span className="tb-avatar-ring">
            <img src="/bird-head.jpg" className="avatar" alt="" style={{ border: "2px solid #fff" }} />
          </span>
        </header>

        <main className="appmain" style={{ padding: "26px 30px 50px" }}>{children}</main>
      </div>
    </div>
  );
}
