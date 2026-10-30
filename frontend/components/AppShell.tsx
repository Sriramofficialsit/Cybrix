"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import { LinkPending } from "./LinkPending";
import { APP_NAV } from "@/lib/nav";
import { getStoredUser, logout, type StoredUser } from "@/lib/auth";
import { PROFILE_EVENT, fetchProfile, type LearnProfile } from "@/lib/learn";

const ROLE_LABEL: Record<string, string> = {
  learner: "Learner",
  student: "College student",
  faculty: "College faculty",
  professional: "Professional",
  recruiter: "Recruiter",
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<StoredUser | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  useEffect(() => setOpen(false), [path]);

  // read after mount: localStorage isn't available during server render
  useEffect(() => setUser(getStoredUser()), []);

  // Streak and XP in the top bar come from learn-path progress
  const [learn, setLearn] = useState<LearnProfile | null>(null);
  useEffect(() => {
    if (!getStoredUser()) return;
    fetchProfile().then(setLearn).catch(() => setLearn(null));
    const onProfile = (e: Event) => setLearn((e as CustomEvent<LearnProfile>).detail);
    window.addEventListener(PROFILE_EVENT, onProfile);
    return () => window.removeEventListener(PROFILE_EVENT, onProfile);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    router.replace("/login?loggedout=true");
  };

  return (
    <div className={`shell${open ? " open" : ""}`}>
      <div className="shell-scrim" onClick={() => setOpen(false)} />

      <aside
        className="shell-aside"
        style={{
          width: 250,
          flex: "none",
          background: "rgba(255,255,255,.66)",
          backdropFilter: "blur(22px) saturate(1.4)",
          WebkitBackdropFilter: "blur(22px) saturate(1.4)",
          borderRight: "1px solid rgba(124,58,237,.12)",
          display: "flex",
          flexDirection: "column",
          padding: "22px 16px",
        }}
      >
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 10px 18px" }}>
          <img src="/logo.png" alt="CyberThulir logo" style={{ width: 32, height: 32, objectFit: "contain", flex: "none" }} />
          <span className="disp" style={{ fontWeight: 700, fontSize: 16 }}>CyberThulir</span>
        </Link>
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {APP_NAV.map((n) => (
            <Link key={n.href} href={n.href} className={`navi${path === n.href ? " on" : ""}`}>
              <Icon name={n.icon} />
              {n.name}
              <LinkPending />
            </Link>
          ))}
        </nav>
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
          <Link href="/settings" className={`navi${path === "/settings" ? " on" : ""}`}><Icon name="ic-gear" />Settings<LinkPending /></Link>
          <button type="button" className="navi navi-btn danger" onClick={handleLogout} disabled={loggingOut}>
            <Icon name="ic-arrow-l" />{loggingOut ? "Logging out…" : "Log out"}
          </button>
          <Link href="/settings" style={{ display: "flex", alignItems: "center", gap: 10, padding: 10, borderRadius: 12, background: "rgba(124,58,237,.08)", marginTop: 4, color: "inherit" }}>
            <img src="/bird-head.jpg" alt="mascot avatar" className="avatar" />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.username || "Guest"}</div>
              <div style={{ fontSize: 11, color: "#9a8fb5" }}>{user ? ROLE_LABEL[user.userType || user.accountType] || "Member" : "Not logged in"}</div>
            </div>
          </Link>
        </div>
      </aside>

      <div className="shell-content" style={{ display: "flex", flexDirection: "column" }}>
        {/* mobile top bar */}
        <div className="shell-topbar">
          <button className="btn btn-g" style={{ padding: 9 }} onClick={() => setOpen(true)} aria-label="Open menu">
            <Icon name="ic-menu" size={18} />
          </button>
          <span className="disp" style={{ fontWeight: 700, fontSize: 15 }}>CyberThulir</span>
          <div style={{ flex: 1 }} />
          <span className="tb-chip" title={learn ? `${learn.streak.current}-day streak · best ${learn.streak.best}` : "Daily streak"}>
            <Icon name="ic-flame" size={16} style={{ stroke: "none", fill: "#fa7faa" }} />{learn ? learn.streak.current : "–"}
          </span>
          <span className="tb-avatar-ring">
            <img src="/bird-head.jpg" alt="avatar" className="avatar" style={{ width: 30, height: 30, border: "2px solid #fff" }} />
          </span>
        </div>

        {/* desktop header */}
        <header
          className="shell-main-header"
          style={{
            height: 72,
            flex: "none",
            borderBottom: "1px solid rgba(124,58,237,.1)",
            background: "linear-gradient(180deg, rgba(255,255,255,.6), rgba(255,255,255,.4))",
            backdropFilter: "blur(22px) saturate(1.6)",
            WebkitBackdropFilter: "blur(22px) saturate(1.6)",
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "0 32px",
          }}
        >
          <div className="tb-search" style={{ width: 300, maxWidth: "34%" }}>
            <Icon name="ic-search" size={16} style={{ stroke: "#a79fbe" }} />
            <span style={{ fontSize: 13 }}>Search labs, lessons, CVEs…</span>
          </div>
          <div style={{ flex: 1 }} />

          <span className="tb-chip">
            {[0, 1, 2, 3].map((i) => (
              <Icon key={i} name="ic-heart" size={14} style={{ stroke: "none", fill: "#fa7faa" }} />
            ))}
            <Icon name="ic-heart" size={14} style={{ stroke: "#ccc3e0", fill: "none" }} />
          </span>
          <span className="tb-chip">
            <Icon name="ic-flame" size={16} style={{ stroke: "none", fill: "#fa7faa" }} />{learn ? learn.streak.current : "–"}
          </span>
          <span className="tb-chip" style={{ color: "#5b21b6" }} title={learn ? `LV ${learn.level} · ${learn.rank}` : "XP"}>
            <Icon name="ic-gem" size={16} style={{ stroke: "#7c3aed" }} />{learn ? learn.xp : "–"}
          </span>

          <button className="tb-iconbtn" aria-label="Notifications">
            <Icon name="ic-bell" size={17} style={{ color: "#6a6480" }} />
            <span style={{ position: "absolute", top: 8, right: 9, width: 7, height: 7, borderRadius: 999, background: "#fa7faa", boxShadow: "0 0 0 2px rgba(255,255,255,.9)" }} />
          </button>
          <span className="tb-avatar-ring">
            <img src="/bird-head.jpg" alt="avatar" className="avatar" style={{ border: "2px solid #fff" }} />
          </span>
        </header>

        <main className="appmain" style={{ padding: "30px 34px 60px", maxWidth: 1200 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
