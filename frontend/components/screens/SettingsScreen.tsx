"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { apiFetch, getStoredUser, logout } from "@/lib/auth";
import { COLLEGES, DEPARTMENTS, YEARS } from "@/lib/profileOptions";

type Profile = {
  id: string;
  username: string;
  email: string;
  accountType: string;
  user_type?: string;
  is_email_verified: boolean;
  current_status: string;
  created_at: string;
  last_active_at: string | null;
  contact_number: string | null;
  linkedin_profile: string | null;
  // student / faculty
  college_name?: string | null;
  department?: string | null;
  year?: string | null;
  designation?: string | null;
  // learner
  currently_doing?: string | null;
  // professional / recruiter
  full_name?: string | null;
  company_name?: string | null;
  // user_profiles
  bio?: string | null;
  phone_number?: string | null;
  github_url?: string | null;
};

type Form = {
  contactNumber: string;
  linkedin: string;
  collegeName: string;
  department: string;
  year: string;
  designation: string;
};

const ROLE_LABEL: Record<string, string> = {
  learner: "Learner",
  student: "College student",
  faculty: "College faculty",
  professional: "Professional",
  recruiter: "Recruiter",
};

const fmtDate = (v: string | null | undefined) =>
  v
    ? new Date(v).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
    : "—";

function withCurrent(options: string[], current?: string | null) {
  return current && !options.includes(current) ? [current, ...options] : options;
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: React.ReactNode }) {
  return (
    <div className="set-row">
      <span className="set-row-ic"><Icon name={icon} size={16} /></span>
      <div style={{ minWidth: 0 }}>
        <div className="set-row-lbl">{label}</div>
        <div className="set-row-val">{value || "—"}</div>
      </div>
    </div>
  );
}

export default function SettingsScreen() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadError, setLoadError] = useState("");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [toast, setToast] = useState("");
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const endSession = async (query = "loggedout=true") => {
    setLoggingOut(true);
    await logout();
    router.replace(`/login?${query}`);
  };

  // Load the signed-in user's details
  useEffect(() => {
    // Nobody logged in on this device
    if (!getStoredUser()) {
      router.replace("/login");
      return;
    }

    (async () => {
      try {
        const res = await apiFetch("/api/user/profile");

        if (res.status === 401) {
          // token expired or invalid
          await endSession("expired=true");
          return;
        }

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setLoadError(data.message || "Could not load your details.");
          return;
        }

        setProfile(data.user);
      } catch {
        setLoadError("Unable to connect to the server. Please try again.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const type = profile ? profile.user_type || profile.accountType : "";
  const isOrg = type === "student" || type === "faculty";
  const isPro = type === "professional" || type === "recruiter";

  const startEdit = () => {
    if (!profile) return;
    setForm({
      contactNumber: profile.contact_number || "",
      linkedin: profile.linkedin_profile || "",
      collegeName: profile.college_name || "",
      department: profile.department || "",
      year: profile.year || "",
      designation: profile.designation || "",
    });
    setSaveError("");
    setEditing(true);
  };

  const set = (k: keyof Form, v: string) => setForm((f) => (f ? { ...f, [k]: v } : f));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !profile) return;

    if (!form.contactNumber.trim()) {
      setSaveError("Mobile number is required.");
      return;
    }

    if (form.linkedin.trim() && !/^https:\/\/([a-z]+\.)?linkedin\.com\//i.test(form.linkedin.trim())) {
      setSaveError("LinkedIn link must start with https://linkedin.com/ or https://www.linkedin.com/");
      return;
    }

    setSaving(true);
    setSaveError("");

    // Fields left out of the payload are kept as they are
    const payload: Record<string, unknown> = {
      contactNumber: form.contactNumber.trim(),
      linkedinUrl: form.linkedin.trim() || null,
    };

    if (isOrg) {
      payload.collegeName = form.collegeName;
      payload.department = form.department;
      if (type === "student") payload.year = form.year;
      else payload.designation = form.designation.trim();
    }

    try {
      const res = await apiFetch("/api/user/profile", {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        await endSession("expired=true");
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setSaveError(data.message || "Could not save your details.");
        return;
      }

      setProfile((p) => (p ? { ...p, ...data.user } : p));
      setEditing(false);
      setToast("Your details were saved.");
    } catch {
      setSaveError("Unable to connect to the server. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="set-page">
      <div>
        <h1 className="disp set-h1">Settings</h1>
        <p className="lead" style={{ marginTop: 6 }}>Manage your details and your session.</p>
      </div>

      {!profile && !loadError && (
        <div className="glass set-card set-skel" aria-busy="true">
          <div className="set-skel-bar" style={{ width: "40%" }} />
          <div className="set-skel-bar" style={{ width: "70%" }} />
          <div className="set-skel-bar" style={{ width: "55%" }} />
        </div>
      )}

      {loadError && (
        <div className="glass set-card">
          <p className="set-error">{loadError}</p>
          <button className="btn btn-g btn-s" style={{ marginTop: 12 }} onClick={() => location.reload()}>Try again</button>
        </div>
      )}

      {profile && (
        <section className="glass set-card">
          {/* identity header */}
          <div className="set-id">
            <div className="set-avatar">{profile.username.slice(0, 1).toUpperCase()}</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="disp set-name">{profile.full_name || profile.username}</div>
              <div className="set-email">{profile.email}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                <span className="st st-info">{ROLE_LABEL[type] || type}</span>
                {profile.is_email_verified
                  ? <span className="st st-ok">Email verified</span>
                  : <span className="st st-warn">Email not verified</span>}
                <span className={`st ${profile.current_status === "active" ? "st-ok" : "st-no"}`}>{profile.current_status}</span>
              </div>
            </div>
            {!editing && (
              <button className="btn btn-g btn-s" onClick={startEdit}>
                <Icon name="ic-key" size={13} />Edit details
              </button>
            )}
          </div>

          <div className="set-sec-title">{isOrg ? (type === "student" ? "Student details" : "Faculty details") : "Profile details"}</div>

          {!editing ? (
            <div className="set-grid">
              <DetailRow icon="ic-users" label="Username" value={`@${profile.username}`} />
              <DetailRow icon="ic-mail" label="Email" value={profile.email} />
              <DetailRow icon="ic-phone" label="Mobile" value={profile.contact_number} />
              {isOrg && <DetailRow icon="ic-house" label="College" value={profile.college_name} />}
              {isOrg && <DetailRow icon="ic-layers" label="Department" value={profile.department} />}
              {type === "student" && <DetailRow icon="ic-cal" label="Year of study" value={profile.year ? `${profile.year} year` : null} />}
              {type === "faculty" && <DetailRow icon="ic-award" label="Designation" value={profile.designation} />}
              {type === "learner" && <DetailRow icon="ic-target" label="Currently" value={profile.currently_doing} />}
              {isPro && <DetailRow icon="ic-house" label="Company" value={profile.company_name} />}
              {isPro && <DetailRow icon="ic-layers" label="Department" value={profile.department} />}
              <DetailRow
                icon="ic-in"
                label="LinkedIn"
                value={profile.linkedin_profile && /^https:\/\//i.test(profile.linkedin_profile)
                  ? <a href={profile.linkedin_profile} target="_blank" rel="noopener noreferrer">{profile.linkedin_profile.replace(/^https:\/\/(www\.)?/i, "")}</a>
                  : profile.linkedin_profile}
              />
              <DetailRow icon="ic-star" label="Member since" value={fmtDate(profile.created_at)} />
              <DetailRow icon="ic-clock" label="Last active" value={fmtDate(profile.last_active_at)} />
            </div>
          ) : form && (
            <form className="set-form" onSubmit={save} noValidate>
              <label className="set-field">
                <span className="eyebrow">Mobile number</span>
                <input className="in" value={form.contactNumber} maxLength={20} onChange={(e) => set("contactNumber", e.target.value)} />
              </label>

              <label className="set-field">
                <span className="eyebrow">LinkedIn profile</span>
                <input className="in" value={form.linkedin} placeholder="https://www.linkedin.com/in/you" onChange={(e) => set("linkedin", e.target.value)} />
              </label>

              {isOrg && (
                <>
                  <label className="set-field">
                    <span className="eyebrow">College</span>
                    <select className="in" value={form.collegeName} onChange={(e) => set("collegeName", e.target.value)}>
                      {withCurrent(COLLEGES, profile.college_name).map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </label>

                  <label className="set-field">
                    <span className="eyebrow">Department</span>
                    <select className="in" value={form.department} onChange={(e) => set("department", e.target.value)}>
                      {withCurrent(DEPARTMENTS, profile.department).map((d) => <option key={d}>{d}</option>)}
                    </select>
                  </label>

                  {type === "student" ? (
                    <div className="set-field">
                      <span className="eyebrow">Year of study</span>
                      <div className="set-seg" role="radiogroup" aria-label="Year of study">
                        {YEARS.map((y) => (
                          <button
                            type="button"
                            key={y}
                            role="radio"
                            aria-checked={form.year === y}
                            className={form.year === y ? "on" : ""}
                            onClick={() => set("year", y)}
                          >
                            {y}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <label className="set-field">
                      <span className="eyebrow">Designation</span>
                      <input className="in" value={form.designation} maxLength={150} onChange={(e) => set("designation", e.target.value)} />
                    </label>
                  )}
                </>
              )}

              {saveError && <p className="set-error set-span">{saveError}</p>}

              <div className="set-actions set-span">
                <button type="button" className="btn btn-g" onClick={() => setEditing(false)} disabled={saving}>Cancel</button>
                <button type="submit" className="btn btn-v" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
              </div>
            </form>
          )}
        </section>
      )}

      {/* account / logout */}
      <section className="glass set-card">
        <div className="set-sec-title" style={{ marginTop: 0 }}>Account</div>
        <div className="set-logout">
          <div>
            <div className="set-row-val" style={{ fontWeight: 700 }}>Log out</div>
            <div className="set-row-lbl" style={{ textTransform: "none", letterSpacing: 0, fontSize: 13 }}>
              Sign out of CyberThulir on this device.
            </div>
          </div>

          {!confirmLogout ? (
            <button className="btn set-btn-danger" onClick={() => setConfirmLogout(true)}>
              <Icon name="ic-arrow-l" size={15} />Log out
            </button>
          ) : (
            <div className="set-confirm" role="alert">
              <span>Log out now?</span>
              <button className="btn btn-g btn-s" onClick={() => setConfirmLogout(false)} disabled={loggingOut}>Cancel</button>
              <button className="btn btn-s set-btn-danger" onClick={() => endSession()} disabled={loggingOut}>
                {loggingOut ? "Logging out…" : "Yes, log out"}
              </button>
            </div>
          )}
        </div>
      </section>

      {toast && (
        <div className="set-toast" role="status">
          <Icon name="ic-check" size={16} />{toast}
        </div>
      )}
    </div>
  );
}
