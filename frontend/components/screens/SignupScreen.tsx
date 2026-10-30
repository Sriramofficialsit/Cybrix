"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { s } from "@/lib/style";
import { apiFetch } from "@/lib/auth";
import { DEPARTMENTS } from "@/lib/profileOptions";

const ROLES = [
  { icon: "ic-book", title: "Learner" },
  { icon: "ic-target", title: "College Student" },
  { icon: "ic-bulb", title: "College Faculty" },
  { icon: "ic-chart", title: "Professional" },
  { icon: "ic-search", title: "Recruiter" },
];

type FieldDef =
  | { kind: "text"; name: string; label: string; type?: string; placeholder: string; hint?: string; required?: boolean }
  | { kind: "password"; name: string; label: string; placeholder?: string; hint?: string; required?: boolean }
  | { kind: "select"; name: string; label: string; options: string[]; hint?: string; required?: boolean }
  | { kind: "segmented"; name: string; label: string; options: string[]; hint?: string; required?: boolean };

const MOBILE: FieldDef = {
  kind: "text",
  type: "tel",
  name: "mobile",
  label: "Mobile number",
  placeholder: "+91 98765 43210",
  hint: "Include your country code, e.g. +91.",
  required: true
};

const USERNAME: FieldDef = {
  kind: "text",
  type: "text",
  name: "username",
  label: "Username",
  placeholder: "nighthawk",
  hint: "3–20 characters — letters, numbers and underscores only.",
  required: true
};

const PASSWORD: FieldDef = {
  kind: "password",
  name: "password",
  label: "Password",
  placeholder: "••••••••",
  hint: "At least 10 characters, with letters and numbers.",
  required: true
};

const RETYPE_PASSWORD: FieldDef = {
  kind: "password",
  name: "retypePassword",
  label: "Retype password",
  placeholder: "••••••••",
  hint: "Must match your password exactly.",
  required: true
};

const LINKEDIN: FieldDef = {
  kind: "text",
  type: "url",
  name: "linkedin",
  label: "LinkedIn profile",
  placeholder: "https://linkedin.com/in/yourname",
  hint: "Optional — helps recruiters and peers find you faster.",
  required: false
};



const ROLE_CONFIG: Record<string, { email: FieldDef; extra?: FieldDef; detailRows: FieldDef[][] }> = {
  Learner: {
    email: {
      kind: "text",
      type: "email",
      name: "email",
      label: "Email",
      placeholder: "you@gmail.com",
      hint: "Personal email only — no disposable inboxes.",
      required: true
    },
    detailRows: [
      [{
        kind: "select",
        name: "doing",
        label: "What are you currently doing?",
        options: ["Student", "Freelancer", "Job seeking", "Other"],
        hint: "Helps us tailor your learning path.",
        required: true
      }],
      [LINKEDIN],
    ],
  },
  "College Student": {
    email: {
      kind: "text",
      type: "email",
      name: "email",
      label: "College email",
      placeholder: "you@college.edu",
      hint: "Must be your official college-issued email address.",
      required: true
    },
    detailRows: [
      [{ kind: "select", name: "college", label: "College name", options: [], hint: "Select your institution, or choose Other.", required: true }],
      [{ kind: "select", name: "department", label: "Department", options: DEPARTMENTS, hint: "Select your department, or choose Other.", required: true }],
      [{ kind: "segmented", name: "year", label: "Year of study", options: ["1st", "2nd", "3rd", "4th"], hint: "Your current year of study.", required: true }],
      [LINKEDIN],
    ],
  },
  "College Faculty": {
    email: {
      kind: "text",
      type: "email",
      name: "email",
      label: "College email",
      placeholder: "you@college.edu",
      hint: "Must be your official college-issued email address.",
      required: true
    },
    detailRows: [
      [{ kind: "select", name: "college", label: "College name", options: [], hint: "Select your institution, or choose Other.", required: true }],
      [{ kind: "select", name: "department", label: "Department", options: DEPARTMENTS, hint: "Select your department, or choose Other.", required: true }],
      [{ kind: "text", type: "text", name: "designation", label: "Designation", placeholder: "Assistant Professor", hint: "e.g. Assistant Professor, HOD, Lab Instructor.", required: true }],
      [LINKEDIN],
    ],
  },
  Professional: {
    email: {
      kind: "text",
      type: "email",
      name: "email",
      label: "Work email",
      placeholder: "you@company.com",
      hint: "Use your official company email address.",
      required: true
    },
    detailRows: [
      [{ kind: "text", type: "text", name: "company", label: "Company name", placeholder: "Acme Corp", hint: "Your current employer's registered name.", required: true }],
      [{ kind: "text", type: "text", name: "department", label: "Department", placeholder: "Security Engineering", hint: "e.g. Security Engineering, DevOps.", required: true }],
      [LINKEDIN],
    ],
  },
  Recruiter: {
    email: {
      kind: "text",
      type: "email",
      name: "email",
      label: "Work email",
      placeholder: "you@company.com",
      hint: "Use your official company email address.",
      required: true
    },
    extra: {
      kind: "text",
      type: "text",
      name: "fullName",
      label: "Full name",
      placeholder: "Alex Kumar",
      hint: "Your name as it should appear on your profile.",
      required: true
    },
    detailRows: [
      [{ kind: "text", type: "text", name: "company", label: "Company name", placeholder: "Acme Corp", hint: "Your current employer's registered name.", required: true }],
      [{ kind: "select", name: "department", label: "Department", options: ["HR", "Technical", "Management", "Talent Acquisition"], hint: "Choose the team you're hiring for.", required: true }],
      [LINKEDIN],
    ],
  },
};

function identityRows(cfg: (typeof ROLE_CONFIG)[string]): FieldDef[][] {
  const rows: FieldDef[][] = cfg.extra ? [[cfg.email, cfg.extra]] : [[cfg.email]];
  rows.push([MOBILE, USERNAME]);
  rows.push([PASSWORD, RETYPE_PASSWORD]);
  return rows;
}

function Field({
  f,
  value,
  error,
  shakeKey,
  showPassword,
  onTogglePassword,
  passwordChecks,
  options,
  placeholder,
  onChange,
}: {
  f: FieldDef;
  value: string;
  error?: string;
  shakeKey: number;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  passwordChecks?: { hasLetter: boolean; hasNumber: boolean; hasLength: boolean };
  options?: string[];
  placeholder?: string;
  onChange: (name: string, val: string) => void;
}) {
  const required = f.required !== false;
  const isLinkedin = f.name === "linkedin";

  return (
    <div key={`${f.name}-${shakeKey}`} className={error ? "field-shake" : undefined}>
      <label className="eyebrow" style={s(`font-size:10px;display:flex;align-items:center;gap:5px;margin-bottom:6px`)}>
        {f.label}
        {required ? (
          <span style={s(`color:#e0457b`)} aria-hidden="true">*</span>
        ) : (
          <span className="field-optional">Optional</span>
        )}
      </label>

      {f.kind === "text" && !isLinkedin && (
        <input
          className={`in${error ? " invalid" : ""}`}
          name={f.name}
          type={f.type || "text"}
          placeholder={f.placeholder}
          value={value}
          onChange={(e) => onChange(f.name, e.target.value)}
        />
      )}

      {f.kind === "text" && isLinkedin && (
        <div className="linkedin-field">
          <svg className="ic" viewBox="0 0 24 24" style={s(`width:14px;height:14px;stroke:#7c3aed`)}>
            <use href="#ic-globe" />
          </svg>
          <input
            className={`in${error ? " invalid" : ""}`}
            name={f.name}
            type={f.type || "text"}
            placeholder={f.placeholder}
            value={value}
            onChange={(e) => onChange(f.name, e.target.value)}
          />
        </div>
      )}

      {f.kind === "password" && (
        <div className="pw-field">
          <input
            className={`in${error ? " invalid" : ""}`}
            name={f.name}
            type={showPassword ? "text" : "password"}
            placeholder={f.placeholder || "••••••••"}
            value={value}
            onChange={(e) => onChange(f.name, e.target.value)}
          />
          <button
            type="button"
            className="pw-toggle"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={onTogglePassword}
          >
            <svg className="ic" viewBox="0 0 24 24" style={s(`width:16px;height:16px`)}>
              <use href="#ic-eye" />
            </svg>
          </button>
        </div>
      )}

      {/* Password criteria checklist */}
      {f.name === "password" && passwordChecks && (
        <div style={s("margin-top:6px;padding:7px 10px;background:rgba(124,58,237,.06);border:1px solid rgba(124,58,237,.14);border-radius:8px;font-size:11px;line-height:1.6")}>
          <div style={s("font-weight:600;color:#cbb8f2;margin-bottom:3px;font-size:10.5px")}>Password must:</div>
          <div style={s(`display:flex;align-items:center;gap:6px;color:${passwordChecks.hasLetter ? "#3ec98a" : "#8a7cb8"};font-size:10.5px`)}>
            <svg className="ic" viewBox="0 0 24 24" style={s(`width:11px;height:11px;stroke:${passwordChecks.hasLetter ? "#3ec98a" : "#8a7cb8"}`)}>
              <use href={passwordChecks.hasLetter ? "#ic-check" : "#ic-x"} />
            </svg>
            contain at least one letter
          </div>
          <div style={s(`display:flex;align-items:center;gap:6px;color:${passwordChecks.hasNumber ? "#3ec98a" : "#8a7cb8"};font-size:10.5px`)}>
            <svg className="ic" viewBox="0 0 24 24" style={s(`width:11px;height:11px;stroke:${passwordChecks.hasNumber ? "#3ec98a" : "#8a7cb8"}`)}>
              <use href={passwordChecks.hasNumber ? "#ic-check" : "#ic-x"} />
            </svg>
            contain at least one number
          </div>
          <div style={s(`display:flex;align-items:center;gap:6px;color:${passwordChecks.hasLength ? "#3ec98a" : "#8a7cb8"};font-size:10.5px`)}>
            <svg className="ic" viewBox="0 0 24 24" style={s(`width:11px;height:11px;stroke:${passwordChecks.hasLength ? "#3ec98a" : "#8a7cb8"}`)}>
              <use href={passwordChecks.hasLength ? "#ic-check" : "#ic-x"} />
            </svg>
            contain 8–72 characters
          </div>
        </div>
      )}

      {f.kind === "select" && (
        <div className="select-field">
          <select
            className={`in${error ? " invalid" : ""}`}
            name={f.name}
            value={value}
            onChange={(e) => onChange(f.name, e.target.value)}
          >
            <option value="" disabled>
              {placeholder || `Select ${f.label.replace(/\?$/, "").toLowerCase()}`}
            </option>
            {(options || f.options).map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
          <svg className="ic" viewBox="0 0 24 24" style={s(`width:13px;height:13px`)}>
            <use href="#ic-chevron" />
          </svg>
        </div>
      )}

      {f.kind === "segmented" && (
        <div className="seg-row">
          {f.options.map((o) => (
            <label key={o} className="seg-chip">
              <input
                type="radio"
                name={f.name}
                checked={value === o}
                onChange={() => onChange(f.name, o)}
              />
              {o}
            </label>
          ))}
        </div>
      )}

      {error ? (
        <p className="err-msg">
          <svg viewBox="0 0 24 24"><use href="#ic-x" /></svg>
          {error}
        </p>
      ) : f.hint ? (
        <p className="hint">{f.hint}</p>
      ) : null}
    </div>
  );
}

// Time to read the "check your email" message before moving to login
const REDIRECT_MS = 5000;
const LEAVE_MS = 420;

export default function SignupScreen() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [role, setRole] = useState("Learner");

  // Controlled form state
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    mobile: "",
    password: "",
    retypePassword: "",
    fullName: "",
    doing: "",
    college: "",
    department: "",
    year: "1st",
    designation: "",
    company: "",
    linkedin: "",
    terms: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showRetypePassword, setShowRetypePassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shakeKey, setShakeKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [colleges, setColleges] = useState<string[]>([]);
  const [collegesLoading, setCollegesLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadColleges() {
      try {
        setCollegesLoading(true);
        const res = await apiFetch("/api/colleges");
        if (!res.ok) {
          throw new Error(`Failed to fetch colleges: ${res.status}`);
        }
        const data = await res.json();
        if (active && Array.isArray(data.colleges)) {
          const names: string[] = data.colleges
            .map((c: any) => c.collegeName || c.college_name)
            .filter((name: any): name is string => typeof name === "string" && name.trim().length > 0);

          if (!names.includes("Other")) {
            names.push("Other");
          }
          setColleges(names);
        }
      } catch (err) {
        console.error("Failed to load colleges:", err);
        if (active) {
          setColleges(["Other"]);
        }
      } finally {
        if (active) {
          setCollegesLoading(false);
        }
      }
    }

    loadColleges();

    return () => {
      active = false;
    };
  }, []);

  // Fade the card out, then open the login page
  function goToLogin() {
    setLeaving(true);
    setTimeout(() => router.push("/login?registered=true"), LEAVE_MS);
  }

  useEffect(() => {
    if (!isSuccess) return;

    const t = setTimeout(goToLogin, REDIRECT_MS);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  const cfg = ROLE_CONFIG[role];

  // Live password metrics
  const passwordChecks = {
    hasLetter: /[a-zA-Z]/.test(formData.password),
    hasNumber: /\d/.test(formData.password),
    hasLength: formData.password.length >= 8 && formData.password.length <= 72,
  };

  function handleFieldChange(name: string, val: string) {
    setFormData((prev) => ({ ...prev, [name]: val }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    if (serverError) {
      setServerError("");
    }
  }

  function clearFieldError(name: string) {
    setErrors((prev) => {
      if (!(name in prev)) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }

  // Validation logic for Page 2 (Identity & Credentials)
  function validatePage2(): Record<string, string> {
    const errs: Record<string, string> = {};

    // Email validation
    const email = formData.email.trim();
    if (!email) {
      errs.email = "Email is required.";
    } else if (email.length > 255) {
      errs.email = "Email must not exceed 255 characters.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = "Please enter a valid email address.";
    }

    // Full name validation for Recruiter
    if (role === "Recruiter") {
      const fullName = formData.fullName.trim();
      if (!fullName) {
        errs.fullName = "Full name is required.";
      } else if (fullName.length < 2) {
        errs.fullName = "Full name is too short.";
      } else if (fullName.length > 100) {
        errs.fullName = "Full name must not exceed 100 characters.";
      }
    }

    // Mobile number validation
    const mobile = formData.mobile.trim();
    if (!mobile) {
      errs.mobile = "Mobile number is required.";
    } else if (/[a-zA-Z]/.test(mobile)) {
      errs.mobile = "Mobile number cannot contain alphabetic characters.";
    } else {
      const rawDigits = mobile.replace(/\D/g, "");
      if (rawDigits.length < 7 || rawDigits.length > 15 || !/^\+?[\d\s-]{7,20}$/.test(mobile)) {
        errs.mobile = "Please enter a valid mobile number.";
      }
    }

    // Username validation
    const username = formData.username.trim();
    if (!username) {
      errs.username = "Username is required.";
    } else if (username.length < 3 || username.length > 20) {
      errs.username = "Username must be between 3 and 20 characters.";
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errs.username = "Username can contain only letters, numbers and underscore.";
    }

    // Password validation
    const password = formData.password;
    if (!password) {
      errs.password = "Password is required.";
    } else if (password.length < 10 || password.length > 72) {
      errs.password = "Password must be between 10 and 72 characters.";
    } else if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
      errs.password = "Password must contain at least one letter and one number.";
    }

    // Retype password validation
    const retypePassword = formData.retypePassword;
    if (!retypePassword) {
      errs.retypePassword = "Please confirm your password.";
    } else if (retypePassword !== password) {
      errs.retypePassword = "Passwords do not match.";
    }

    return errs;
  }

  // Validation logic for Page 3 (Role-Specific Details)
  function validatePage3(): Record<string, string> {
    const errs: Record<string, string> = {};

    if (role === "Learner") {
      if (!formData.doing) {
        errs.doing = "Please select what you are currently doing.";
      }
    } else if (role === "College Student") {
      if (!formData.college) {
        errs.college = "College name is required.";
      }
      if (!formData.department) {
        errs.department = "Department is required.";
      }
      if (!formData.year) {
        errs.year = "Year of study is required.";
      }
    } else if (role === "College Faculty") {
      if (!formData.college) {
        errs.college = "College name is required.";
      }
      if (!formData.department) {
        errs.department = "Department is required.";
      }
      if (!formData.designation.trim()) {
        errs.designation = "Designation is required.";
      }
    } else if (role === "Professional") {
      if (!formData.company.trim()) {
        errs.company = "Company name is required.";
      }
      if (!formData.department.trim()) {
        errs.department = "Department is required.";
      }
    } else if (role === "Recruiter") {
      if (!formData.company.trim()) {
        errs.company = "Company name is required.";
      }
      if (!formData.department) {
        errs.department = "Department is required.";
      }
    }

    // Optional LinkedIn URL format validation
    const linkedin = formData.linkedin.trim();
    if (linkedin) {
      // Must match the backend: https links to linkedin.com only
      if (!/^https:\/\/([a-z0-9-]+\.)?linkedin\.com\//i.test(linkedin)) {
        errs.linkedin = "Enter your LinkedIn link starting with https:// (e.g. https://linkedin.com/in/username).";
      }
    }

    return errs;
  }

  // Validation logic for Page 4 (Review & Terms)
  function validatePage4(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!formData.terms) {
      errs.terms = "You must accept the Terms and Privacy Policy.";
    }
    return errs;
  }

  function handleContinueFromPage2(e: React.FormEvent) {
    e.preventDefault();
    const p2Errors = validatePage2();
    if (Object.keys(p2Errors).length > 0) {
      setErrors(p2Errors);
      setShakeKey((k) => k + 1);
      return;
    }
    setErrors({});
    setServerError("");
    setStep(3);
  }

  function handleContinueFromPage3(e: React.FormEvent) {
    e.preventDefault();
    const p3Errors = validatePage3();
    if (Object.keys(p3Errors).length > 0) {
      setErrors(p3Errors);
      setShakeKey((k) => k + 1);
      return;
    }
    setErrors({});
    setServerError("");
    setStep(4);
  }

  async function handleFinalSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Verify all steps
    const p2Errors = validatePage2();
    if (Object.keys(p2Errors).length > 0) {
      setErrors(p2Errors);
      setStep(2);
      setShakeKey((k) => k + 1);
      return;
    }

    const p3Errors = validatePage3();
    if (Object.keys(p3Errors).length > 0) {
      setErrors(p3Errors);
      setStep(3);
      setShakeKey((k) => k + 1);
      return;
    }

    const p4Errors = validatePage4();
    if (Object.keys(p4Errors).length > 0) {
      setErrors(p4Errors);
      setShakeKey((k) => k + 1);
      return;
    }

    // Role mapping for backend userType
    const roleMap: Record<string, string> = {
      Learner: "learner",
      "College Student": "student",
      "College Faculty": "faculty",
      Professional: "professional",
      Recruiter: "recruiter",
    };

    const payload: Record<string, any> = {
      userType: roleMap[role],
      accountType: roleMap[role],
      username: formData.username.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      retypePassword: formData.retypePassword,
      contactNumber: formData.mobile.trim(),
      mobile: formData.mobile.trim(),
      linkedinProfile: formData.linkedin.trim() || undefined,
    };

    if (role === "Learner") {
      payload.currentlyDoing = formData.doing;
      payload.doing = formData.doing;
    } else if (role === "College Student") {
      payload.collegeName = formData.college;
      payload.college = formData.college;
      payload.department = formData.department;
      payload.year = formData.year;
    } else if (role === "College Faculty") {
      payload.collegeName = formData.college;
      payload.college = formData.college;
      payload.department = formData.department;
      payload.designation = formData.designation.trim();
    } else if (role === "Professional") {
      payload.companyName = formData.company.trim();
      payload.company = formData.company.trim();
      payload.department = formData.department.trim();
    } else if (role === "Recruiter") {
      payload.fullName = formData.fullName.trim();
      payload.name = formData.fullName.trim();
      payload.companyName = formData.company.trim();
      payload.company = formData.company.trim();
      payload.department = formData.department;
    }

    try {
      setIsSubmitting(true);
      setServerError("");

      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      const res = await fetch(`${API_BASE}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 201) {
        setIsSuccess(true);
      } else if (res.status === 409) {
        const msg = data.message || "";
        if (msg.toLowerCase().includes("email")) {
          setErrors({ email: "Email already registered." });
          setServerError("This email is already registered. Please log in or use another email.");
          setStep(2);
          setShakeKey((k) => k + 1);
        } else if (msg.toLowerCase().includes("username")) {
          setErrors({ username: "Username already registered." });
          setServerError("This username is already registered. Please choose another username.");
          setStep(2);
          setShakeKey((k) => k + 1);
        } else {
          setServerError(msg || "Account already exists with this information.");
        }
      } else if (res.status === 400) {
        setServerError(data.message || "Invalid registration data. Please check your inputs.");
      } else {
        setServerError(data.message || "Registration failed due to a server error. Please try again later.");
      }
    } catch (err) {
      console.error("Signup network error:", err);
      setServerError("Unable to connect to the server. Please ensure the backend is running and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-side">
        <div className="auth-orb" style={s(`width:300px;height:300px;left:-100px;top:-80px;background:#7c3aed;opacity:.14`)} />
        <div className="auth-orb hide-sm" style={s(`width:240px;height:240px;right:-70px;bottom:60px;background:#c2ef4e;opacity:.2`)} />
        <svg viewBox="0 0 600 900" preserveAspectRatio="xMidYMid slice" style={s(`position:absolute;inset:0;width:100%;height:100%;opacity:.5`)} aria-hidden="true">
          <g className="tw" fill="#a98fe6"><circle cx="90" cy="120" r="3" /><circle cx="480" cy="90" r="2.4" /><circle cx="520" cy="420" r="3" /><circle cx="120" cy="640" r="2.6" /><circle cx="60" cy="380" r="2.2" /><circle cx="420" cy="760" r="2.4" /></g>
          <g className="tw" fill="#7bc0ea"><circle cx="300" cy="200" r="2" /><circle cx="540" cy="620" r="2.4" /><circle cx="180" cy="300" r="1.8" /></g>
          <g fill="none" stroke="rgba(124,58,237,.16)" strokeWidth="1.3"><path d="M470 -30a300 300 0 0 1 0 620" /><ellipse cx="420" cy="360" rx="260" ry="120" transform="rotate(-16 420 360)" /></g>
        </svg>

        <div style={s(`position:relative;display:flex;align-items:center;gap:10px`)}>
          <img src="/logo.png" alt="CyberThulir logo" style={s(`width:32px;height:32px;object-fit:contain;flex:none`)} />
          <span className="disp" style={s(`font-weight:700;font-size:16px`)}>CyberThulir</span>
        </div>

        <div style={s(`position:relative;text-align:center`)}>
          <div style={s(`position:relative;display:inline-block`)}>
            <div className="mascot-glow" style={s(`width:240px;height:240px;left:50%;top:50%;transform:translate(-50%,-50%)`)} />
            <img src="/mascot-hero.png" alt="CyberThulir mascot" className="float mascot mascot-signup" />
            <div className="lvl-ring" style={s(`--p:8;position:absolute;right:-4px;bottom:12px`)}>
              <i><span style={s(`font-size:15px;font-weight:700`)}>1</span><span style={s(`font-size:8px;letter-spacing:.4px;opacity:.7;text-transform:uppercase`)}>lvl</span></i>
            </div>
          </div>
          <div style={s(`display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap;margin-top:16px`)}>
            <span style={s(`font-size:10.5px;font-weight:700;letter-spacing:.2px;color:#3a3450;background:rgba(31,22,51,.05);border:1px solid rgba(31,22,51,.12);border-radius:999px;padding:5px 10px`)}>Beginner path</span>
            <svg className="ic" viewBox="0 0 24 24" style={s(`width:11px;height:11px;stroke:rgba(31,22,51,.35)`)}><use href="#ic-chevron" /></svg>
            <span style={s(`font-size:10.5px;font-weight:700;letter-spacing:.2px;color:#3a3450;background:rgba(31,22,51,.05);border:1px solid rgba(31,22,51,.12);border-radius:999px;padding:5px 10px`)}>Intermediate rooms</span>
            <svg className="ic" viewBox="0 0 24 24" style={s(`width:11px;height:11px;stroke:rgba(31,22,51,.35)`)}><use href="#ic-chevron" /></svg>
            <span style={s(`font-size:10.5px;font-weight:700;letter-spacing:.2px;color:#3a3450;background:rgba(31,22,51,.05);border:1px solid rgba(31,22,51,.12);border-radius:999px;padding:5px 10px`)}>Expert battle</span>
          </div>
        </div>

        <div style={s(`position:relative`)}>
          <h2 className="disp" style={s(`font-size:26px;font-weight:600;line-height:1.2`)}>Start your first <span className="lime">season</span>.</h2>
          <p style={s(`font-size:13px;color:#4a445c;margin-top:10px;max-width:360px;line-height:1.7`)}>Jump into interactive labs, the CTF arena, and Red vs Blue the moment you sign up.</p>

          <div className="stat-strip">
            <div className="stat-cell">
              <div className="stat-ic"><svg className="ic" viewBox="0 0 24 24" style={s(`width:13px;height:13px;stroke:#7c3aed`)}><use href="#ic-book" /></svg></div>
              <div className="stat-num">80+</div>
              <div className="stat-lbl">Guided modules</div>
            </div>
            <div className="stat-cell">
              <div className="stat-ic"><svg className="ic" viewBox="0 0 24 24" style={s(`width:13px;height:13px;stroke:#7c3aed`)}><use href="#ic-cert" /></svg></div>
              <div className="stat-num">7</div>
              <div className="stat-lbl">Cert tracks</div>
            </div>
            <div className="stat-cell">
              <div className="stat-ic"><svg className="ic" viewBox="0 0 24 24" style={s(`width:13px;height:13px;stroke:#7c3aed`)}><use href="#ic-flask" /></svg></div>
              <div className="stat-num">100+</div>
              <div className="stat-lbl">Labs &amp; CTFs</div>
            </div>
            <div className="stat-cell">
              <div className="stat-ic"><svg className="ic" viewBox="0 0 24 24" style={s(`width:13px;height:13px;stroke:#7c3aed`)}><use href="#ic-swords" /></svg></div>
              <div className="stat-num"><span className="ping" style={s(`display:inline-block;width:6px;height:6px;border-radius:999px;color:#3ec98a;background:#3ec98a`)}></span>Live</div>
              <div className="stat-lbl">Red vs Blue</div>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-main">
        <div className={`glass auth-card${leaving ? " auth-leave" : ""}`}>
          {isSuccess ? (
            <div className="auth-success">
              <div className="success-badge">
                <svg className="ic" viewBox="0 0 24 24"><use href="#ic-mail" /></svg>
              </div>
              <h1 className="disp" style={s("font-size:24px;font-weight:600")}>Registration successful</h1>
              <p className="lead" style={s("margin-top:10px;line-height:1.6")}>
                A verification email has been sent to your registered email address (<strong>{formData.email}</strong>). Please check your inbox and verify your email.
              </p>
              <div style={s("margin-top:16px;padding:12px 14px;background:rgba(124,58,237,.08);border:1px solid rgba(124,58,237,.2);border-radius:10px;font-size:12px;color:#a98fe6;line-height:1.5")}>
                Click the verification link in the email to activate your account. Once verified, you can log in directly.
              </div>
              <div className="redirect-bar" style={s(`--dur:${REDIRECT_MS}ms`)}><i /></div>
              <p style={s("font-size:11.5px;color:#8b8599;margin-top:8px")}>Taking you to the login page…</p>
              <button
                type="button"
                onClick={goToLogin}
                disabled={leaving}
                className="btn btn-v"
                style={s("width:100%;margin-top:16px;display:flex;align-items:center;justify-content:center;gap:8px")}
              >
                Proceed to Log In <svg className="ic" viewBox="0 0 24 24" style={s("width:15px;height:15px")}><use href="#ic-arrow" /></svg>
              </button>
            </div>
          ) : (
            <>
              <div className="step-track" style={s(`justify-content:flex-end;margin-bottom:16px`)}>
                <span className="step-dot on"></span>
                <span className={`step-dot${step >= 2 ? " on" : ""}`}></span>
                <span className={`step-dot${step >= 3 ? " on" : ""}`}></span>
                <span className={`step-dot${step === 4 ? " on" : ""}`}></span>
              </div>

              <h1 className="disp" style={s(`font-size:24px;font-weight:600`)}>Create your CyberThulir account</h1>
              <p className="lead" style={s(`margin-top:6px`)}>
                {step === 1 && "Choose how you want to use CyberThulir."}
                {step === 2 && "Tell us who you are."}
                {step === 3 && `Just the ${role.toLowerCase()} details left.`}
                {step === 4 && "Review your details and complete registration."}
              </p>

              {/* Step 1: Role Selection */}
              {step === 1 && (
                <div style={s(`display:flex;flex-direction:column;gap:16px;margin-top:22px`)}>
                  <div>
                    <label className="eyebrow" style={s(`font-size:10px;display:block;margin-bottom:8px`)}>Who you are?</label>
                    <div className="role-row">
                      {ROLES.map((r) => (
                        <label key={r.title} className="role-chip">
                          <input
                            type="radio"
                            name="role"
                            checked={role === r.title}
                            onChange={() => setRole(r.title)}
                          />
                          <span className="ic-wrap"><svg className="ic" viewBox="0 0 24 24" style={s(`width:12px;height:12px`)}><use href={`#${r.icon}`} /></svg></span>
                          <span className="rt">{r.title}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-v"
                    style={s(`width:100%;margin-top:4px`)}
                    onClick={() => {
                      setErrors({});
                      setStep(2);
                    }}
                  >
                    Continue <svg className="ic" viewBox="0 0 24 24" style={s(`width:15px;height:15px`)}><use href="#ic-arrow" /></svg>
                  </button>
                </div>
              )}

              {/* Step 2: Identity & Credentials */}
              {step === 2 && (
                <form
                  style={s(`display:flex;flex-direction:column;gap:14px;margin-top:22px`)}
                  noValidate
                  onSubmit={handleContinueFromPage2}
                >
                  <button type="button" className="back-link" style={s(`margin-top:-6px`)} onClick={() => setStep(1)}>
                    <svg className="ic" viewBox="0 0 24 24" style={s(`width:12px;height:12px`)}><use href="#ic-arrow-l" /></svg> Back
                  </button>

                  {identityRows(cfg).map((row, i) => (
                    <div key={i} style={row.length === 2 ? s(`display:grid;grid-template-columns:1fr 1fr;gap:12px`) : undefined}>
                      {row.map((f) => (
                        <Field
                          key={f.name}
                          f={f}
                          value={(formData as any)[f.name] || ""}
                          error={errors[f.name]}
                          shakeKey={shakeKey}
                          showPassword={f.name === "password" ? showPassword : f.name === "retypePassword" ? showRetypePassword : false}
                          onTogglePassword={
                            f.name === "password"
                              ? () => setShowPassword((prev) => !prev)
                              : f.name === "retypePassword"
                              ? () => setShowRetypePassword((prev) => !prev)
                              : undefined
                          }
                          passwordChecks={f.name === "password" ? passwordChecks : undefined}
                          onChange={handleFieldChange}
                        />
                      ))}
                    </div>
                  ))}

                  <button type="submit" className="btn btn-v" style={s(`width:100%;margin-top:4px`)}>
                    Continue <svg className="ic" viewBox="0 0 24 24" style={s(`width:15px;height:15px`)}><use href="#ic-arrow" /></svg>
                  </button>
                </form>
              )}

              {/* Step 3: Role-Specific Details */}
              {step === 3 && (
                <form
                  style={s(`display:flex;flex-direction:column;gap:14px;margin-top:22px`)}
                  noValidate
                  onSubmit={handleContinueFromPage3}
                >
                  <button type="button" className="back-link" style={s(`margin-top:-6px`)} onClick={() => setStep(2)}>
                    <svg className="ic" viewBox="0 0 24 24" style={s(`width:12px;height:12px`)}><use href="#ic-arrow-l" /></svg> Back
                  </button>

                  {cfg.detailRows.map((row, i) => (
                    <div key={i} style={row.length === 2 ? s(`display:grid;grid-template-columns:1fr 1fr;gap:12px`) : undefined}>
                      {row.map((f) => (
                        <Field
                          key={f.name}
                          f={f}
                          value={(formData as any)[f.name] || ""}
                          error={errors[f.name]}
                          shakeKey={shakeKey}
                          options={f.name === "college" ? colleges : undefined}
                          placeholder={
                            f.name === "college" && collegesLoading && colleges.length === 0
                              ? "Loading colleges..."
                              : undefined
                          }
                          onChange={handleFieldChange}
                        />
                      ))}
                    </div>
                  ))}

                  <button type="submit" className="btn btn-v" style={s(`width:100%;margin-top:4px`)}>
                    Continue <svg className="ic" viewBox="0 0 24 24" style={s(`width:15px;height:15px`)}><use href="#ic-arrow" /></svg>
                  </button>
                </form>
              )}

              {/* Step 4: Final signup / review step */}
              {step === 4 && (
                <form
                  style={s(`display:flex;flex-direction:column;gap:14px;margin-top:18px`)}
                  noValidate
                  onSubmit={handleFinalSubmit}
                >
                  <button type="button" className="back-link" style={s(`margin-top:-6px`)} onClick={() => setStep(3)}>
                    <svg className="ic" viewBox="0 0 24 24" style={s(`width:12px;height:12px`)}><use href="#ic-arrow-l" /></svg> Back
                  </button>

                  {/* Review Summary Card */}
                  <div className="glass" style={s(`border-radius:12px;padding:16px;background:rgba(255,255,255,.02);border:1px solid rgba(124,58,237,.18)`)}>
                    <div style={s(`display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;border-bottom:1px solid rgba(124,58,237,.12);padding-bottom:8px`)}>
                      <span className="eyebrow" style={s(`font-size:10px;color:#9a8fb5`)}>Account Summary</span>
                      <span className="reward-chip" style={s(`font-size:10.5px;padding:2px 8px`)}>{role}</span>
                    </div>

                    <div style={s(`display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:12px`)}>
                      <div>
                        <span style={s(`color:#8a7cb8;display:block;font-size:10px;margin-bottom:2px`)}>Username</span>
                        <strong style={s(`color:#ece7f6;font-size:12px`)}>{formData.username}</strong>
                      </div>
                      <div>
                        <span style={s(`color:#8a7cb8;display:block;font-size:10px;margin-bottom:2px`)}>Email</span>
                        <strong style={s(`color:#ece7f6;font-size:12px;word-break:break-all`)}>{formData.email}</strong>
                      </div>
                      <div>
                        <span style={s(`color:#8a7cb8;display:block;font-size:10px;margin-bottom:2px`)}>Mobile</span>
                        <strong style={s(`color:#ece7f6;font-size:12px`)}>{formData.mobile}</strong>
                      </div>
                      {role === "Recruiter" && formData.fullName && (
                        <div>
                          <span style={s(`color:#8a7cb8;display:block;font-size:10px;margin-bottom:2px`)}>Full Name</span>
                          <strong style={s(`color:#ece7f6;font-size:12px`)}>{formData.fullName}</strong>
                        </div>
                      )}
                      {role === "Learner" && (
                        <div>
                          <span style={s(`color:#8a7cb8;display:block;font-size:10px;margin-bottom:2px`)}>Currently Doing</span>
                          <strong style={s(`color:#ece7f6;font-size:12px`)}>{formData.doing}</strong>
                        </div>
                      )}
                      {(role === "College Student" || role === "College Faculty") && (
                        <>
                          <div>
                            <span style={s(`color:#8a7cb8;display:block;font-size:10px;margin-bottom:2px`)}>College</span>
                            <strong style={s(`color:#ece7f6;font-size:12px`)}>{formData.college}</strong>
                          </div>
                          <div>
                            <span style={s(`color:#8a7cb8;display:block;font-size:10px;margin-bottom:2px`)}>Department</span>
                            <strong style={s(`color:#ece7f6;font-size:12px`)}>{formData.department}</strong>
                          </div>
                          {role === "College Student" && (
                            <div>
                              <span style={s(`color:#8a7cb8;display:block;font-size:10px;margin-bottom:2px`)}>Year</span>
                              <strong style={s(`color:#ece7f6;font-size:12px`)}>{formData.year}</strong>
                            </div>
                          )}
                          {role === "College Faculty" && (
                            <div>
                              <span style={s(`color:#8a7cb8;display:block;font-size:10px;margin-bottom:2px`)}>Designation</span>
                              <strong style={s(`color:#ece7f6;font-size:12px`)}>{formData.designation}</strong>
                            </div>
                          )}
                        </>
                      )}
                      {(role === "Professional" || role === "Recruiter") && (
                        <>
                          <div>
                            <span style={s(`color:#8a7cb8;display:block;font-size:10px;margin-bottom:2px`)}>Company</span>
                            <strong style={s(`color:#ece7f6;font-size:12px`)}>{formData.company}</strong>
                          </div>
                          <div>
                            <span style={s(`color:#8a7cb8;display:block;font-size:10px;margin-bottom:2px`)}>Department</span>
                            <strong style={s(`color:#ece7f6;font-size:12px`)}>{formData.department}</strong>
                          </div>
                        </>
                      )}
                      {formData.linkedin && (
                        <div style={s(`grid-column:1 / -1`)}>
                          <span style={s(`color:#8a7cb8;display:block;font-size:10px;margin-bottom:2px`)}>LinkedIn</span>
                          <span style={s(`color:#ece7f6;font-size:11.5px;word-break:break-all`)}>{formData.linkedin}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Terms & Privacy */}
                  <div key={`terms-${shakeKey}`} className={errors.terms ? "field-shake" : undefined}>
                    <label style={s(`display:flex;align-items:flex-start;gap:8px;font-size:11.5px;color:#6a6480;line-height:1.5;cursor:pointer`)}>
                      <input
                        type="checkbox"
                        name="terms"
                        checked={formData.terms}
                        style={s(`accent-color:#7c3aed;margin-top:2px`)}
                        onChange={(e) => {
                          setFormData((prev) => ({ ...prev, terms: e.target.checked }));
                          clearFieldError("terms");
                        }}
                      />
                      <span>
                        I agree to the <span style={s(`font-weight:600;color:#7c3aed`)}>Terms</span> and{" "}
                        <span style={s(`font-weight:600;color:#7c3aed`)}>Privacy Policy</span>.
                      </span>
                    </label>
                    {errors.terms && (
                      <p className="err-msg">
                        <svg viewBox="0 0 24 24"><use href="#ic-x" /></svg>
                        {errors.terms}
                      </p>
                    )}
                  </div>

                  {/* Server error notification */}
                  {serverError && (
                    <div className="err-msg" style={s(`padding:10px 12px;background:rgba(229,72,77,.1);border:1px solid rgba(229,72,77,.3);border-radius:8px;font-size:12px`)}>
                      <svg viewBox="0 0 24 24" style={s(`width:14px;height:14px;stroke:#c8323a`)}><use href="#ic-x" /></svg>
                      {serverError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-v"
                    disabled={isSubmitting}
                    style={s(`width:100%;margin-top:4px;opacity:${isSubmitting ? ".7" : "1"}`)}
                  >
                    {isSubmitting ? (
                      "Creating Account..."
                    ) : (
                      <>
                        Sign Up <svg className="ic" viewBox="0 0 24 24" style={s(`width:15px;height:15px`)}><use href="#ic-arrow" /></svg>
                      </>
                    )}
                  </button>
                </form>
              )}

              <p style={s(`font-size:12px;color:#8b8599;margin-top:18px;text-align:center`)}>
                Already have an account? <Link href="/login" style={s(`font-weight:600`)}>Log in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

