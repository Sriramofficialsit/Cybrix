"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { s } from "@/lib/style";
import { Icon } from "@/components/Icon";
import {
  CertApiError,
  claimCertificate,
  downloadCertificatePdf,
  fetchOverview,
  formatIssued,
  linkedInAddUrl,
  verifyUrl,
  type Certificate,
  type Overview,
  type Track,
} from "@/lib/certificates";

const RING = 119.4; // 2πr for r = 19

const STATE_CHIP: Record<Track["state"], { label: string; cls: string }> = {
  issued: { label: "Issued", cls: "st st-ok" },
  ready: { label: "Ready to claim", cls: "st st-v" },
  in_progress: { label: "In progress", cls: "st st-info" },
  not_started: { label: "Not started", cls: "st st-info" },
  locked: { label: "Locked", cls: "st st-warn" },
  revoked: { label: "Revoked", cls: "st st-no" },
  coming_soon: { label: "Coming soon", cls: "st st-warn" },
};

function Ring({ pct }: { pct: number }) {
  return (
    <span className="ringwrap" style={s(`position:relative;width:52px;height:52px;flex:none;display:grid;place-items:center`)}>
      <svg viewBox="0 0 44 44" style={s(`width:52px;height:52px;position:absolute;inset:0`)} aria-hidden="true">
        <circle cx="22" cy="22" r="19" fill="none" stroke="rgba(124,58,237,.15)" strokeWidth="4" />
        <circle cx="22" cy="22" r="19" fill="none" stroke="#7c3aed" strokeWidth="4" strokeLinecap="round" strokeDasharray={RING} strokeDashoffset={(RING * (1 - pct / 100)).toFixed(1)} transform="rotate(-90 22 22)" />
      </svg>
      <span style={s(`font-size:11px;font-weight:700;color:#5b21b6`)}>{pct}%</span>
    </span>
  );
}

function Toast({ text, onDone }: { text: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [text, onDone]);
  return (
    <div className="set-toast" role="status">
      <Icon name="ic-check" size={16} />
      {text}
    </div>
  );
}

function FeaturedCertificate({ cert, onToast }: { cert: Certificate; onToast: (t: string) => void }) {
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      await downloadCertificatePdf(cert.serial);
    } catch (e) {
      onToast(e instanceof Error ? e.message : "Couldn't download the certificate");
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    const url = verifyUrl(cert.serial);
    const text = `I earned the ${cert.trackTitle} (${cert.trackCode}) certification on CyberThulir.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: cert.trackTitle, text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      onToast("Verification link copied");
    } catch {
      // share sheet dismissed
    }
  };

  return (
    <div className="glass" style={s(`border-radius:20px;padding:6px;position:relative;overflow:hidden`)}>
      <div style={s(`position:absolute;right:-70px;top:-70px;width:220px;height:220px;border-radius:50%;background:radial-gradient(circle,rgba(47,159,224,.3),transparent 68%);filter:blur(28px)`)}></div>
      <div style={s(`border:1px solid rgba(124,58,237,.3);border-radius:16px;padding:30px 34px;background:linear-gradient(150deg,rgba(255,255,255,.8),rgba(242,234,254,.7));position:relative`)}>
        <div style={s(`display:flex;align-items:center;justify-content:space-between`)}>
          <div style={s(`display:flex;align-items:center;gap:10px`)}>
            <img src="/logo.png" alt="CyberThulir logo" style={s(`width:30px;height:30px;object-fit:contain;flex:none`)} />
            <span className="disp" style={s(`font-weight:700`)}>CyberThulir</span>
          </div>
          <span className="orb" style={s(`width:44px;height:44px`)}><span className="ball"></span><Icon name="ic-award" size={20} /></span>
        </div>
        <div className="eyebrow" style={s(`margin-top:22px`)}>This certifies that</div>
        <div className="disp" style={s(`font-size:24px;font-weight:600;margin-top:6px;word-break:break-word`)}>{cert.holderName}</div>
        <div style={s(`font-size:13px;color:#6a6480;margin-top:8px;max-width:520px;line-height:1.55`)}>has completed every requirement of the certification</div>
        <div className="disp grad" style={s(`font-size:22px;font-weight:700;margin-top:6px`)}>{cert.trackTitle} ({cert.trackCode})</div>
        <div style={s(`display:flex;flex-wrap:wrap;gap:28px;margin-top:22px;font-size:13px;font-weight:600`)}>
          <div><div className="eyebrow" style={s(`margin-bottom:4px`)}>Serial</div><span className="mono" style={s(`font-size:13px`)}>{cert.serial}</span></div>
          <div><div className="eyebrow" style={s(`margin-bottom:4px`)}>Issued</div>{formatIssued(cert.issuedAt)}</div>
          <div><div className="eyebrow" style={s(`margin-bottom:4px`)}>Verify</div><Link href={`/verify?serial=${cert.serial}`} style={s(`color:#5b21b6`)}>Verification page</Link></div>
        </div>
        <div style={s(`display:flex;flex-wrap:wrap;gap:8px;margin-top:22px`)}>
          <button className="btn btn-v btn-s" onClick={download} disabled={busy}><Icon name="ic-download" size={14} />{busy ? "Preparing…" : "Download PDF"}</button>
          <button className="btn btn-g btn-s" onClick={share}>Share</button>
          <a className="btn btn-g btn-s" href={linkedInAddUrl(cert)} target="_blank" rel="noopener noreferrer">Add to LinkedIn</a>
        </div>
      </div>
    </div>
  );
}

function EmptyFeatured({ next }: { next: Track | null }) {
  return (
    <div className="glass" style={s(`border-radius:20px;padding:28px 30px;display:flex;gap:20px;align-items:center;flex-wrap:wrap`)}>
      <span className="orb" style={s(`width:52px;height:52px;flex:none`)}><span className="ball"></span><Icon name="ic-award" size={22} /></span>
      <div style={s(`flex:1;min-width:220px`)}>
        <div className="disp" style={s(`font-size:18px;font-weight:600`)}>Your first certificate will appear here</div>
        <p style={s(`font-size:13px;color:#6a6480;margin-top:6px;line-height:1.55`)}>
          {next
            ? `You're ${next.pct}% of the way to ${next.title} (${next.code}). Finish every requirement below, then claim it.`
            : "Pick a track below and work through its modules and labs. Once every requirement is met, claim your certificate."}
        </p>
      </div>
    </div>
  );
}

function ClaimDialog({ track, defaultName, onClose, onClaimed }: {
  track: Track;
  defaultName: string;
  onClose: () => void;
  onClaimed: (cert: Certificate) => void;
}) {
  const [name, setName] = useState(defaultName);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const { certificate } = await claimCertificate(track.code, name.trim());
      onClaimed(certificate);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't issue the certificate");
      setBusy(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="claim-title" onClick={() => !busy && onClose()} style={s(`position:fixed;inset:0;z-index:60;background:rgba(21,15,35,.45);display:grid;place-items:center;padding:16px`)}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="card" style={s(`width:100%;max-width:440px;padding:26px;background:#fff`)}>
        <div className="eyebrow">Claim certificate · {track.code}</div>
        <h2 id="claim-title" className="disp" style={s(`font-size:20px;font-weight:600;margin-top:6px`)}>{track.title}</h2>
        <p style={s(`font-size:13px;color:#6a6480;margin-top:8px;line-height:1.55`)}>
          Every requirement is complete. Enter your name exactly as it should appear on the certificate. It can&apos;t be changed after issue.
        </p>
        <label htmlFor="claim-name" style={s(`display:block;font-size:12px;font-weight:600;margin:16px 0 6px`)}>Name on certificate</label>
        <input id="claim-name" className={`in${error ? " invalid" : ""}`} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoFocus required />
        {error && <div className="err-msg" role="alert">{error}</div>}
        <div style={s(`display:flex;justify-content:flex-end;gap:8px;margin-top:20px`)}>
          <button type="button" className="btn btn-g btn-s" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="submit" className="btn btn-v btn-s" disabled={busy || name.trim().length < 2}>{busy ? "Issuing…" : "Issue certificate"}</button>
        </div>
      </form>
    </div>
  );
}

function TrackCard({ track, open, onToggle, onClaim, onToast }: {
  track: Track;
  open: boolean;
  onToggle: () => void;
  onClaim: () => void;
  onToast: (t: string) => void;
}) {
  const chip = STATE_CHIP[track.state];
  const soon = track.state === "coming_soon";
  const reqDone = track.requirements.filter((r) => r.done).length;
  const [busy, setBusy] = useState(false);

  const download = async () => {
    if (!track.certificate) return;
    setBusy(true);
    try {
      await downloadCertificatePdf(track.certificate.serial);
    } catch (e) {
      onToast(e instanceof Error ? e.message : "Couldn't download the certificate");
    } finally {
      setBusy(false);
    }
  };

  let action;
  if (track.state === "issued") {
    action = <button className="btn btn-v btn-s" onClick={download} disabled={busy}>{busy ? "…" : "Download"}</button>;
  } else if (track.state === "ready") {
    action = <button className="btn btn-v btn-s" onClick={onClaim}>Claim</button>;
  } else if (soon) {
    action = <button className="btn btn-g btn-s" disabled>Coming soon</button>;
  } else {
    action = <button className="btn btn-g btn-s" onClick={onToggle} aria-expanded={open}>{open ? "Hide" : "Requirements"}</button>;
  }

  return (
    <div className="card lift" style={s(`padding:16px 18px;${soon ? "opacity:.72" : ""}`)}>
      <div style={s(`display:flex;align-items:center;gap:16px`)}>
        <Ring pct={track.pct} />
        <div style={s(`flex:1;min-width:0`)}>
          <div style={s(`display:flex;align-items:center;gap:8px;flex-wrap:wrap`)}>
            <span className="mono" style={s(`font-size:12px;font-weight:700;color:#5b21b6`)}>{track.code}</span>
            <span className={chip.cls}>{chip.label}</span>
          </div>
          <div className="disp" style={s(`font-size:15px;font-weight:600;margin-top:4px`)}>{track.title}</div>
          <div style={s(`font-size:12px;color:#6a6480;margin-top:3px`)}>
            {track.level}
            {soon ? " · content in production" : ` · ${reqDone} / ${track.requirements.length} requirements`}
          </div>
        </div>
        {action}
      </div>
      {open && !soon && (
        <div style={s(`margin-top:14px;padding-top:12px;border-top:1px solid rgba(124,58,237,.12)`)}>
          <p style={s(`font-size:12.5px;color:#6a6480;line-height:1.55;margin-bottom:10px`)}>{track.summary}</p>
          <ul style={s(`list-style:none;display:flex;flex-direction:column;gap:8px;padding:0;margin:0`)}>
            {track.requirements.map((r) => (
              <li key={r.label} style={s(`display:flex;align-items:center;gap:10px;font-size:13px`)}>
                <span style={s(`width:20px;height:20px;border-radius:6px;flex:none;display:grid;place-items:center;${r.done ? "background:rgba(62,201,138,.16);color:#1f8a55" : "background:rgba(124,58,237,.08);color:#a79fbe"}`)}>
                  <Icon name={r.done ? "ic-check" : r.type === "lab" ? "ic-flask" : r.type === "track" ? "ic-award" : "ic-book"} size={12} />
                </span>
                <span style={s(`flex:1;min-width:0;${r.done ? "color:#6a6480" : ""}`)}>
                  {r.href && !r.done ? <Link href={r.href} style={s(`color:#1f1633;text-decoration:underline;text-decoration-color:rgba(124,58,237,.35)`)}>{r.label}</Link> : r.label}
                </span>
                <span style={s(`font-size:11.5px;color:#6a6480;white-space:nowrap`)}>{r.detail}</span>
              </li>
            ))}
          </ul>
          {track.state === "revoked" && (
            <p className="set-error" style={s(`margin-top:12px;font-size:12.5px`)}>This certificate was revoked. Contact support if you believe this is a mistake.</p>
          )}
        </div>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="set-skel" aria-busy="true" aria-label="Loading certifications">
      <div className="set-skel-bar" style={s(`height:220px;border-radius:20px`)} />
      {[0, 1, 2, 3].map((i) => <div key={i} className="set-skel-bar" style={s(`height:84px;border-radius:16px`)} />)}
    </div>
  );
}

export default function CertificatesScreen() {
  const router = useRouter();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<CertApiError | null>(null);
  const [openCode, setOpenCode] = useState<string | null>(null);
  const [claiming, setClaiming] = useState<Track | null>(null);
  const [toast, setToast] = useState("");
  const [serial, setSerial] = useState("");

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await fetchOverview());
    } catch (e) {
      setError(e instanceof CertApiError ? e : new CertApiError(0, "Something went wrong"));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const clearToast = useCallback(() => setToast(""), []);

  const issued = data ? data.tracks.filter((t) => t.certificate && t.state === "issued").map((t) => t.certificate!) : [];
  const featured = issued.sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))[0] || null;
  const active = data
    ? data.tracks
        .filter((t) => ["ready", "in_progress", "not_started"].includes(t.state))
        .sort((a, b) => (a.state === "ready" ? -1 : b.state === "ready" ? 1 : b.pct - a.pct))
    : [];
  const next = active[0] || null;
  const nextReq = next ? next.requirements.find((r) => !r.done) : null;

  const onClaimed = (cert: Certificate) => {
    setClaiming(null);
    setToast(`${cert.trackCode} certificate issued`);
    load();
  };

  const submitVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (serial.trim()) router.push(`/verify?serial=${encodeURIComponent(serial.trim().toUpperCase())}`);
  };

  return (
    <div data-screen>
      <div style={s(`display:flex;align-items:flex-start;justify-content:space-between;gap:24px;margin-bottom:22px`)}>
        <div>
          <div className="eyebrow" style={s(`margin-bottom:8px`)}>Your credentials</div>
          <h1 className="disp" style={s(`font-size:30px;font-weight:600`)}><span className="grad">Certificates</span></h1>
          <p className="lead" style={s(`margin-top:8px`)}>
            {data
              ? `${data.counts.issued} issued · ${data.counts.inProgress} in progress · `
              : "Earn certificates by completing modules and hands-on labs · "}
            verify any certificate by serial at <Link href="/verify" style={s(`color:#5b21b6;font-weight:600`)}>/verify</Link>
          </p>
        </div>
        <img src="/bird-head.jpg" alt="" className="float hide-sm" style={s(`width:66px;height:66px;border-radius:18px;object-fit:cover;border:1px solid rgba(124,58,237,.2)`)} />
      </div>

      {error ? (
        <div className="card" style={s(`padding:26px;text-align:center`)} role="alert">
          <p className="set-error">{error.message}</p>
          <div style={s(`display:flex;gap:8px;justify-content:center;margin-top:14px`)}>
            {error.status === 401
              ? <Link className="btn btn-v btn-s" href="/login">Sign in</Link>
              : <button className="btn btn-v btn-s" onClick={load}>Try again</button>}
          </div>
        </div>
      ) : (
        <div className="cm-grid" style={s(`display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:20px;align-items:start`)}>
          <div>
            {!data ? <Skeleton /> : (
              <>
                {featured ? <FeaturedCertificate cert={featured} onToast={setToast} /> : <EmptyFeatured next={next} />}
                <div className="eyebrow" style={s(`margin:26px 0 12px`)}>All certification tracks</div>
                <div style={s(`display:flex;flex-direction:column;gap:12px`)}>
                  {data.tracks.map((t) => (
                    <TrackCard
                      key={t.code}
                      track={t}
                      open={openCode === t.code}
                      onToggle={() => setOpenCode(openCode === t.code ? null : t.code)}
                      onClaim={() => setClaiming(t)}
                      onToast={setToast}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <div style={s(`display:flex;flex-direction:column;gap:16px`)}>
            {next && (
              <div className="card" style={s(`padding:20px`)}>
                <div className="eyebrow" style={s(`margin-bottom:8px`)}>Next up · {next.code}</div>
                <div style={s(`font-size:13px;color:#4a4560;line-height:1.55`)}>
                  {next.state === "ready"
                    ? `Every requirement for ${next.title} is complete. Claim your certificate.`
                    : `${next.pct}% complete · ${next.requirements.filter((r) => !r.done).length} requirement(s) left${nextReq ? ` · next: ${nextReq.label}` : ""}`}
                </div>
                {next.state === "ready" ? (
                  <button className="btn btn-v btn-s" style={s(`margin-top:14px;width:100%;justify-content:center`)} onClick={() => setClaiming(next)}>Claim certificate</button>
                ) : nextReq && nextReq.href ? (
                  <Link className="btn btn-v btn-s" href={nextReq.href} style={s(`margin-top:14px;width:100%;justify-content:center`)}>Continue track</Link>
                ) : null}
              </div>
            )}
            <div className="card" style={s(`padding:20px`)}>
              <div className="eyebrow" style={s(`margin-bottom:10px`)}>How it works</div>
              <div style={s(`display:flex;flex-direction:column;gap:9px;font-size:13px`)}>
                {["Complete each track's learn-path modules", "Capture the flag in its hands-on labs", "Claim: we check your progress and issue a serial", "Anyone can verify the serial online"].map((t) => (
                  <div key={t} style={s(`display:flex;gap:8px;align-items:flex-start`)}>
                    <Icon name="ic-check" size={14} style={s(`flex:none;margin-top:2px;stroke:#7c3aed`)} />{t}
                  </div>
                ))}
              </div>
            </div>
            <form className="card" style={s(`padding:20px`)} onSubmit={submitVerify}>
              <label htmlFor="verify-serial" className="eyebrow" style={s(`display:block;margin-bottom:10px`)}>Verify a certificate</label>
              <input id="verify-serial" className="in mono" placeholder="CCSF-4KQ2-8XF1-9MT3" value={serial} onChange={(e) => setSerial(e.target.value)} maxLength={30} />
              <button className="btn btn-g btn-s" style={s(`margin-top:10px;width:100%;justify-content:center`)} disabled={!serial.trim()}>Verify</button>
            </form>
          </div>
        </div>
      )}

      {claiming && data && (
        <ClaimDialog track={claiming} defaultName={data.defaultName} onClose={() => setClaiming(null)} onClaimed={onClaimed} />
      )}
      {toast && <Toast text={toast} onDone={clearToast} />}
    </div>
  );
}
