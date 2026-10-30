"use client";

import { useState } from "react";
import { Icon } from "@/components/Icon";

const DOMAINS = [
  { key: "all", label: "All" },
  { key: "web", label: "Web App Security" },
  { key: "recon", label: "Recon & OSINT" },
  { key: "net", label: "Networking" },
  { key: "crypto", label: "Cryptography" },
  { key: "endpoint", label: "Endpoint & Privesc" },
  { key: "cloud", label: "Cloud & AD" },
  { key: "blue", label: "Blue Team / SOC" },
];

type Lab = {
  title: string; domain: string; dLabel: string; diff: "Easy" | "Medium" | "Hard" | "Advanced";
  xp: number; engine: string; desc: string; done?: boolean; prog: string;
};
const LABS: Lab[] = [
  { title: "IDOR — Invoice Access", domain: "web", dLabel: "Web", diff: "Easy", xp: 120, engine: "console", desc: "Your invoice is #1042. Walk the sequential IDs and pull the finance record you were never meant to see.", prog: "0 / 3" },
  { title: "SQLi Authentication Bypass", domain: "web", dLabel: "Web", diff: "Easy", xp: 140, engine: "console", desc: "The login builds its query by string concatenation. Craft an input that always evaluates true.", done: true, prog: "2 / 2" },
  { title: "SSRF — Cloud Metadata", domain: "web", dLabel: "Web", diff: "Hard", xp: 260, engine: "live app", desc: "The image fetcher will request any URL you give it. Reach 169.254.169.254 and read the instance role.", prog: "1 / 4" },
  { title: "Reflected XSS — Juice Shop", domain: "web", dLabel: "Web", diff: "Easy", xp: 120, engine: "live app", desc: "The search box reflects the q parameter unescaped. Land a script that reads document.domain.", done: true, prog: "1 / 1" },
  { title: "Nmap Recon & Service ID", domain: "recon", dLabel: "Recon", diff: "Easy", xp: 120, engine: "kali", desc: "Map every open TCP port on the target and fingerprint the software behind each one.", prog: "1 / 3" },
  { title: "DNS Recon & Zone Transfer", domain: "net", dLabel: "Networking", diff: "Easy", xp: 130, engine: "kali", desc: "Enumerate records for the domain and try an AXFR against the misconfigured secondary.", prog: "0 / 3" },
  { title: "MD5 Hash Cracking", domain: "crypto", dLabel: "Crypto", diff: "Medium", xp: 180, engine: "kali", desc: "You dumped an unsalted MD5 admin hash. Crack it offline and log in.", prog: "0 / 2" },
  { title: "Single-byte XOR Recovery", domain: "crypto", dLabel: "Crypto", diff: "Hard", xp: 250, engine: "console", desc: "Single-byte XOR is not encryption. Score every key and recover the plaintext flag.", prog: "0 / 3" },
  { title: "SUID Privilege Escalation", domain: "endpoint", dLabel: "Endpoint", diff: "Advanced", xp: 260, engine: "kali", desc: "You have a shell as a low-priv user. Find the SUID binary that hands you root.", prog: "2 / 4" },
  { title: "NTDS.dit Credential Dump", domain: "cloud", dLabel: "Cloud & AD", diff: "Hard", xp: 300, engine: "kali", desc: "Post-exploitation on the DC: extract the NTDS database and crack the domain hashes.", prog: "0 / 3" },
  { title: "SSH Brute Force Investigation", domain: "blue", dLabel: "Blue Team", diff: "Easy", xp: 160, engine: "evidence", desc: "One source IP shows hundreds of failed logins then one success. Identify it and map the ATT&CK technique.", prog: "1 / 4" },
  { title: "Malware C2 Detection", domain: "blue", dLabel: "Blue Team", diff: "Hard", xp: 300, engine: "evidence", desc: "A host beacons out on a steady rhythm. Reconstruct the C2 channel from the capture and logs.", prog: "0 / 5" },
];

const DIFF: Record<string, React.CSSProperties> = {
  Easy: { color: "#6a5a8f", background: "#f0edf7" },
  Medium: { color: "#6a5fc1", background: "#eae2f5" },
  Hard: { color: "#4a3d6b", background: "#e4ddf0" },
  Advanced: { color: "#2f2350", background: "#ddd4ec" },
};

export default function RangeScreen() {
  const [f, setF] = useState("all");
  const shown = f === "all" ? LABS : LABS.filter((l) => l.domain === f);

  return (
    <div data-screen>
      <div className="eyebrow" style={{ marginBottom: 10 }}>Cyber Range</div>
      <h1 className="disp" style={{ fontSize: 34, fontWeight: 600, letterSpacing: "-.5px", lineHeight: 1.15 }}>
        Hands-on labs against <span className="lime">real targets</span>
      </h1>
      <p style={{ marginTop: 12, color: "#6a6480", fontSize: 15, maxWidth: 560 }}>
        169 labs spanning web, network, crypto, cloud, forensics and blue-team tracks — in-browser exploit consoles, live vulnerable apps and full Kali containers. Server-side flag validation, XP on capture.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 26 }}>
        {DOMAINS.map((d) => {
          const on = d.key === f;
          return (
            <button
              key={d.key}
              onClick={() => setF(d.key)}
              style={{
                appearance: "none", fontFamily: "inherit", cursor: "pointer", fontSize: 13, fontWeight: 500,
                padding: "8px 15px", borderRadius: 999,
                background: on ? "#150f23" : "#fff", color: on ? "#fff" : "#6a6480",
                border: `1px solid ${on ? "#150f23" : "#e2dfe9"}`,
              }}
            >
              {d.label}
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "22px 0 16px" }}>
        <span style={{ fontSize: 13, color: "#9a94ab" }}>{shown.length} labs</span>
        <button className="btn btn-g btn-s" style={{ textTransform: "none", letterSpacing: 0, fontWeight: 500, color: "#6a6480" }}>
          <Icon name="ic-slider" size={15} style={{ stroke: "#8b8599" }} />Difficulty · Engine
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 16 }}>
        {shown.map((c) => (
          <div key={c.title} className="card lift" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: "#6a6480", background: "#f2ebfd", border: "1px solid #ebe1fa", borderRadius: 999, padding: "3px 9px" }}>{c.dLabel}</span>
              <span style={{ ...DIFF[c.diff], fontSize: 10, fontWeight: 700, letterSpacing: ".4px", textTransform: "uppercase", borderRadius: 5, padding: "3px 7px" }}>{c.diff}</span>
            </div>
            <h3 className="disp" style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.3 }}>{c.title}</h3>
            <p style={{ fontSize: 13, color: "#7a7489", lineHeight: 1.5, minHeight: 38 }}>{c.desc}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "#9a94ab" }}>
              <span className="mono" style={{ textTransform: "uppercase", letterSpacing: ".3px", background: "#f4f3f7", borderRadius: 5, padding: "2px 6px" }}>{c.engine}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <Icon name="ic-zap" size={12} style={{ stroke: "#7c3aed" }} />{c.xp}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 2, paddingTop: 12, borderTop: "1px solid #f0e9fb" }}>
              <span style={{ fontSize: 11, fontWeight: c.done ? 600 : 400, color: c.done ? "#4a3d6b" : "#9a94ab" }}>
                {c.done ? "Solved" : `${c.prog} objectives`}
              </span>
              <button className="btn btn-p btn-s">{c.done ? "Review" : "Launch"}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
