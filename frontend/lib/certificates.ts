import { API_BASE, apiFetch } from "@/lib/auth";

// Client for /api/certificates. The backend decides eligibility from real
// learn-path and lab progress; these types mirror what it returns.

export type TrackState = "issued" | "ready" | "in_progress" | "not_started" | "locked" | "revoked" | "coming_soon";

export type Requirement = {
  type: "module" | "lab" | "track";
  label: string;
  detail: string;
  done: boolean;
  href: string | null;
};

export type Certificate = {
  serial: string;
  holderName: string;
  trackCode: string;
  trackTitle: string;
  level: string;
  issuedAt: string;
  status: "valid" | "revoked";
  revokedAt: string | null;
};

export type Track = {
  code: string;
  title: string;
  level: string;
  summary: string;
  state: TrackState;
  pct: number;
  requirements: Requirement[];
  certificate: Certificate | null;
};

export type Overview = {
  tracks: Track[];
  defaultName: string;
  counts: { issued: number; inProgress: number; available: number };
};

export class CertApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await apiFetch(path, init);
  } catch {
    throw new CertApiError(0, "Can't reach the server. Check your connection and try again.");
  }

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      res.status === 401 ? "Sign in to see your certifications." : (body && body.message) || "Something went wrong. Please try again.";
    throw new CertApiError(res.status, message);
  }

  return body as T;
}

export const fetchOverview = () => request<Overview>("/api/certificates");

export const claimCertificate = (code: string, name: string) =>
  request<{ certificate: Certificate; created: boolean }>(`/api/certificates/tracks/${encodeURIComponent(code)}/claim`, {
    method: "POST",
    body: JSON.stringify({ name }),
  });

// Public: no session needed
export async function verifyCertificate(serial: string): Promise<Certificate> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/certificates/verify/${encodeURIComponent(serial.trim())}`);
  } catch {
    throw new CertApiError(0, "Can't reach the server. Check your connection and try again.");
  }

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new CertApiError(res.status, (body && body.message) || "Something went wrong. Please try again.");
  }

  return body.certificate as Certificate;
}

// Fetches the PDF with the session cookie and saves it
export async function downloadCertificatePdf(serial: string): Promise<void> {
  let res: Response;
  try {
    res = await apiFetch(`/api/certificates/${encodeURIComponent(serial)}/pdf`);
  } catch {
    throw new CertApiError(0, "Can't reach the server. Check your connection and try again.");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new CertApiError(res.status, (body && body.message) || "Couldn't download the certificate.");
  }

  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = `CyberThulir-${serial}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export function verifyUrl(serial: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/verify?serial=${encodeURIComponent(serial)}`;
}

// LinkedIn's "Add licence or certification" form, pre-filled
export function linkedInAddUrl(cert: Certificate): string {
  const issued = new Date(cert.issuedAt);
  const params = new URLSearchParams({
    startTask: "CERTIFICATION_NAME",
    name: `${cert.trackTitle} (${cert.trackCode})`,
    organizationName: "CyberThulir",
    issueYear: String(issued.getFullYear()),
    issueMonth: String(issued.getMonth() + 1),
    certId: cert.serial,
    certUrl: verifyUrl(cert.serial),
  });
  return `https://www.linkedin.com/profile/add?${params}`;
}

export const formatIssued = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
