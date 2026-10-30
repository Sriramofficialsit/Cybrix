"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { s } from "@/lib/style";
import { Icon } from "@/components/Icon";
import { CertApiError, formatIssued, verifyCertificate, type Certificate } from "@/lib/certificates";

type Result =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "found"; cert: Certificate }
  | { kind: "error"; message: string };

export default function VerifyScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const serialParam = (params.get("serial") || "").trim().toUpperCase();
  const [serial, setSerial] = useState(serialParam);
  const [result, setResult] = useState<Result>({ kind: "idle" });

  useEffect(() => {
    setSerial(serialParam);
    if (!serialParam) {
      setResult({ kind: "idle" });
      return;
    }
    let cancelled = false;
    setResult({ kind: "loading" });
    verifyCertificate(serialParam)
      .then((cert) => !cancelled && setResult({ kind: "found", cert }))
      .catch((e) => !cancelled && setResult({ kind: "error", message: e instanceof CertApiError ? e.message : "Something went wrong" }));
    return () => {
      cancelled = true;
    };
  }, [serialParam]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = serial.trim().toUpperCase();
    if (value) router.replace(`/verify?serial=${encodeURIComponent(value)}`);
  };

  const valid = result.kind === "found" && result.cert.status === "valid";

  return (
    <main className="wrap" style={s(`max-width:640px;margin:0 auto;padding:56px 16px 72px`)}>
      <div className="eyebrow" style={s(`margin-bottom:8px`)}>Certificate verification</div>
      <h1 className="disp" style={s(`font-size:30px;font-weight:600`)}><span className="grad">Verify a certificate</span></h1>
      <p className="lead" style={s(`margin-top:8px`)}>Enter the serial printed on a CyberThulir certificate to confirm it is genuine and still valid.</p>

      <form onSubmit={submit} className="glass" style={s(`display:flex;gap:10px;padding:12px;border-radius:16px;margin-top:22px;flex-wrap:wrap`)}>
        <label htmlFor="serial" style={s(`position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)`)}>Certificate serial</label>
        <input id="serial" className="in mono" style={s(`flex:1;min-width:200px`)} placeholder="CCSF-4KQ2-8XF1-9MT3" value={serial} onChange={(e) => setSerial(e.target.value)} maxLength={30} autoComplete="off" spellCheck={false} />
        <button className="btn btn-v btn-s" disabled={!serial.trim() || result.kind === "loading"}>
          <Icon name="ic-search" size={14} />{result.kind === "loading" ? "Checking…" : "Verify"}
        </button>
      </form>

      <div aria-live="polite" style={s(`margin-top:22px`)}>
        {result.kind === "error" && (
          <div className="card" style={s(`padding:22px;display:flex;gap:14px;align-items:flex-start`)}>
            <span className="st st-no" style={s(`flex:none`)}>Not verified</span>
            <p style={s(`font-size:14px;color:#4a4560;line-height:1.55`)}>{result.message}</p>
          </div>
        )}
        {result.kind === "found" && (
          <div className="card" style={s(`padding:26px;border:1px solid ${valid ? "rgba(62,201,138,.4)" : "rgba(229,72,77,.4)"}`)}>
            <div style={s(`display:flex;align-items:center;gap:10px`)}>
              <span className={valid ? "st st-ok" : "st st-no"}>{valid ? "Valid certificate" : "Revoked"}</span>
              <span className="mono" style={s(`font-size:12.5px;color:#6a6480`)}>{result.cert.serial}</span>
            </div>
            <div className="eyebrow" style={s(`margin-top:20px`)}>Issued to</div>
            <div className="disp" style={s(`font-size:22px;font-weight:600;margin-top:4px;word-break:break-word`)}>{result.cert.holderName}</div>
            <div className="eyebrow" style={s(`margin-top:16px`)}>Certification</div>
            <div className="disp grad" style={s(`font-size:18px;font-weight:700;margin-top:4px`)}>{result.cert.trackTitle} ({result.cert.trackCode})</div>
            <div style={s(`display:flex;gap:28px;flex-wrap:wrap;margin-top:16px;font-size:13px;font-weight:600`)}>
              <div><div className="eyebrow" style={s(`margin-bottom:4px`)}>Level</div>{result.cert.level}</div>
              <div><div className="eyebrow" style={s(`margin-bottom:4px`)}>Issued</div>{formatIssued(result.cert.issuedAt)}</div>
              {result.cert.revokedAt && <div><div className="eyebrow" style={s(`margin-bottom:4px`)}>Revoked</div>{formatIssued(result.cert.revokedAt)}</div>}
            </div>
            <p style={s(`font-size:12.5px;color:#6a6480;margin-top:18px;line-height:1.55`)}>
              {valid
                ? "This certificate was issued by CyberThulir after the holder completed every requirement of the track."
                : "This certificate was issued by CyberThulir but has since been revoked and is no longer valid."}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
