"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { s } from "@/lib/style";
import OtpInput, { OTP_LENGTH } from "@/components/OtpInput";
import { collectFormErrors } from "@/lib/validation";
import { setStoredUser } from "@/lib/auth";

const STREAK_DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const STREAK_ON = 5;
const RESEND_SECONDS = 30;

export default function LoginScreen() {
  const router = useRouter();

  const [step, setStep] = useState<"credentials" | "otp">("credentials");

  const [identifier, setIdentifier] = useState("");
  // Returned by /login after the password is checked; the OTP step needs it
  const [loginToken, setLoginToken] = useState("");
  const [otp, setOtp] = useState<string[]>(
    Array(OTP_LENGTH).fill("")
  );

  const [cooldown, setCooldown] = useState(RESEND_SECONDS);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [otpError, setOtpError] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState("");

  // Show a confirmation when arriving from reset password, signup
  // or the email verification link, then tidy the URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("reset") === "true") {
      setNotice("Your password has been reset. Log in with your new password.");
    } else if (params.get("registered") === "true") {
      setNotice("Account created. Verify your email using the link we sent, then log in.");
    } else if (params.get("verified") === "true") {
      setNotice("Email verified successfully. You can now log in.");
    } else if (params.get("loggedout") === "true") {
      setNotice("You have been logged out. See you again soon!");
    } else if (params.get("expired") === "true") {
      setNotice("Your session has expired. Please log in again.");
    } else {
      return;
    }

    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  useEffect(() => {
    if (step !== "otp" || cooldown === 0) return;

    const t = setTimeout(
      () => setCooldown((c) => c - 1),
      1000
    );

    return () => clearTimeout(t);
  }, [step, cooldown]);

  const otpComplete = otp.every((d) => d !== "");

  function clearError(name: string) {
    setErrors((prev) => {
      if (!(name in prev)) return prev;

      const next = { ...prev };
      delete next[name];

      return next;
    });
  }

  async function handleCredentialsSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const found = collectFormErrors(e.currentTarget, [
      {
        name: "identifier",
        label: "Email or username",
      },
      {
        name: "password",
        label: "Password",
      },
    ]);

    if (Object.keys(found).length) {
      setErrors(found);
      setShakeKey((k) => k + 1);
      return;
    }

    setErrors({});
    setOtpError(false);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;

    try {
      const API_BASE =
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:5001";

      const response = await fetch(
        `${API_BASE}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            emailOrUsername: identifier.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setErrors({
          password:
            data.message ||
            "Invalid email/username or password.",
        });

        setShakeKey((k) => k + 1);
        return;
      }

      setLoginToken(data.loginToken);
      setCooldown(RESEND_SECONDS);
      setOtp(Array(OTP_LENGTH).fill(""));
      setOtpError(false);

      setStep("otp");
    } catch (error) {
      console.error("Login error:", error);

      setErrors({
        password:
          "Unable to connect to the server. Please try again.",
      });

      setShakeKey((k) => k + 1);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleOtpSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!otpComplete) {
      setOtpError(true);
      setShakeKey((k) => k + 1);
      return;
    }

    setOtpError(false);
    setIsVerifying(true);

    try {
      const API_BASE =
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:5001";

      const otpValue = otp.join("");

      const response = await fetch(
        `${API_BASE}/api/auth/verify-login-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          // lets the browser store the httpOnly session cookie
          credentials: "include",
          body: JSON.stringify({
            loginToken,
            otp: otpValue,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        // Too many wrong codes or expired: this login session is over,
        // so go back to the password step and show why
        if (data.message && data.message !== "Invalid OTP") {
          setStep("credentials");
          setLoginToken("");
          setErrors({ password: data.message });
          setShakeKey((k) => k + 1);
          return;
        }

        setOtpError(true);
        return;
      }

      // The session itself is the httpOnly cookie set by the backend;
      // only display info is kept in storage
      if (data.user) {
        setStoredUser(data.user);
      }

      router.push("/dashboard");
    } catch (error) {
      console.error(
        "OTP verification error:",
        error
      );

      setOtpError(true);
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResendOtp() {
    if (cooldown > 0 || isResending) {
      return;
    }

    setIsResending(true);
    setOtpError(false);

    try {
      const API_BASE =
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:5001";

      const response = await fetch(
        `${API_BASE}/api/auth/resend-login-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            loginToken,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Resend OTP failed:", data.message);
        return;
      }

      setOtp(Array(OTP_LENGTH).fill(""));
      setOtpError(false);
      setCooldown(RESEND_SECONDS);
    } catch (error) {
      console.error(
        "Resend OTP error:",
        error
      );
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-side">
        <div
          className="auth-orb"
          style={s(
            `width:300px;height:300px;left:-100px;top:-80px;background:#7c3aed;opacity:.14`
          )}
        />

        <div
          className="auth-orb hide-sm"
          style={s(
            `width:240px;height:240px;right:-70px;bottom:60px;background:#a98fe6;opacity:.16`
          )}
        />

        <svg
          viewBox="0 0 600 900"
          preserveAspectRatio="xMidYMid slice"
          style={s(
            `position:absolute;inset:0;width:100%;height:100%;opacity:.5`
          )}
          aria-hidden="true"
        >
          <g
            className="tw"
            fill="#a98fe6"
          >
            <circle cx="90" cy="120" r="3" />
            <circle cx="480" cy="90" r="2.4" />
            <circle cx="520" cy="420" r="3" />
            <circle cx="120" cy="640" r="2.6" />
            <circle cx="60" cy="380" r="2.2" />
            <circle cx="420" cy="760" r="2.4" />
          </g>

          <g
            className="tw"
            fill="#7bc0ea"
          >
            <circle cx="300" cy="200" r="2" />
            <circle cx="540" cy="620" r="2.4" />
            <circle cx="180" cy="300" r="1.8" />
          </g>

          <g
            fill="none"
            stroke="rgba(124,58,237,.16)"
            strokeWidth="1.3"
          >
            <path d="M470 -30a300 300 0 0 1 0 620" />
            <ellipse
              cx="420"
              cy="360"
              rx="260"
              ry="120"
              transform="rotate(-16 420 360)"
            />
          </g>
        </svg>

        <div
          style={s(
            `position:relative;display:flex;align-items:center;gap:10px`
          )}
        >
          <img
            src="/logo.png"
            alt="CyberThulir logo"
            style={s(
              `width:32px;height:32px;object-fit:contain;flex:none`
            )}
          />

          <span
            className="disp"
            style={s(
              `font-weight:700;font-size:16px`
            )}
          >
            CyberThulir
          </span>
        </div>

        <div
          style={s(
            `position:relative;text-align:center`
          )}
        >
          <div
            style={s(
              `position:relative;display:inline-block`
            )}
          >
            <div
              className="mascot-glow"
              style={s(
                `width:280px;height:280px;left:50%;top:50%;transform:translate(-50%,-50%)`
              )}
            />

            <img
              src="/mascot-hero.png"
              alt="CyberThulir mascot"
              className="float mascot mascot-login"
            />

            <div
              className="lvl-ring"
              style={s(
                `--p:72;position:absolute;right:-6px;bottom:16px`
              )}
            >
              <i>
                <span
                  style={s(
                    `font-size:15px;font-weight:700`
                  )}
                >
                  14
                </span>

                <span
                  style={s(
                    `font-size:8px;letter-spacing:.4px;opacity:.7;text-transform:uppercase`
                  )}
                >
                  lvl
                </span>
              </i>
            </div>
          </div>

          <div
            className="streak-strip"
            style={s(
              `justify-content:center;margin-top:16px`
            )}
          >
            {STREAK_DAYS.map((d, i) => (
              <div
                key={i}
                className={`streak-day${
                  i < STREAK_ON ? " on" : ""
                }`}
              >
                {i < STREAK_ON ? (
                  <svg
                    className="ic flame-ic"
                    viewBox="0 0 24 24"
                    style={s(
                      `stroke:none;fill:#fa7faa;width:12px;height:12px`
                    )}
                  >
                    <use href="#ic-flame" />
                  </svg>
                ) : (
                  <span
                    style={s(
                      `font-size:9px;font-weight:700;color:rgba(31,22,51,.35)`
                    )}
                  >
                    {d}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div
          style={s(`position:relative`)}
        >
          <h2
            className="disp"
            style={s(
              `font-size:26px;font-weight:600;line-height:1.2`
            )}
          >
            Redefine your{" "}
            <span className="lime">
              cyber skills
            </span>
            .
          </h2>

          <p
            style={s(
              `font-size:13px;color:#4a445c;margin-top:10px;max-width:360px;line-height:1.7`
            )}
          >
            Pick up your season, keep the streak
            alive, and jump straight back into the
            range.
          </p>

          <div
            style={s(
              `display:flex;gap:8px;margin-top:18px;flex-wrap:wrap`
            )}
          >
            <div className="reward-chip">
              <svg
                className="ic flame-ic"
                viewBox="0 0 24 24"
                style={s(
                  `stroke:none;fill:#fa7faa;width:14px;height:14px`
                )}
              >
                <use href="#ic-flame" />
              </svg>
              7-day streak
            </div>

            <div className="reward-chip">
              <svg
                className="ic"
                viewBox="0 0 24 24"
                style={s(
                  `stroke:#7c3aed;width:14px;height:14px`
                )}
              >
                <use href="#ic-gem" />
              </svg>
              340 gems
            </div>

            <div className="reward-chip hide-sm">
              <svg
                className="ic"
                viewBox="0 0 24 24"
                style={s(
                  `stroke:#7c3aed;width:14px;height:14px`
                )}
              >
                <use href="#ic-crown" />
              </svg>
              Rank #182
            </div>
          </div>
        </div>
      </div>

      <div className="auth-main">
        <div className="glass auth-card auth-enter">
          {step === "credentials" ? (
            <>
              <h1
                className="disp"
                style={s(
                  `font-size:24px;font-weight:600`
                )}
              >
                Log in to CyberThulir
              </h1>

              <p
                className="lead"
                style={s(`margin-top:6px`)}
              >
                Continue your season and streak.
              </p>

              {notice && (
                <div className="auth-banner" role="status">
                  <svg className="ic" viewBox="0 0 24 24">
                    <use href="#ic-check" />
                  </svg>

                  <span>{notice}</span>
                </div>
              )}

              <form
                style={s(
                  `display:flex;flex-direction:column;gap:12px;margin-top:22px`
                )}
                onSubmit={handleCredentialsSubmit}
                noValidate
              >
                <div
                  key={`identifier-${shakeKey}`}
                  className={
                    errors.identifier
                      ? "field-shake"
                      : undefined
                  }
                >
                  <label
                    className="eyebrow"
                    style={s(
                      `font-size:10px;display:block;margin-bottom:6px`
                    )}
                  >
                    Email or username
                  </label>

                  <input
                    className={`in${
                      errors.identifier
                        ? " invalid"
                        : ""
                    }`}
                    name="identifier"
                    type="text"
                    placeholder="you@example.com"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(
                        e.target.value
                      );
                      clearError("identifier");
                    }}
                    required
                  />

                  {errors.identifier && (
                    <p className="err-msg">
                      <svg viewBox="0 0 24 24">
                        <use href="#ic-x" />
                      </svg>

                      {errors.identifier}
                    </p>
                  )}
                </div>

                <div
                  key={`password-${shakeKey}`}
                  className={
                    errors.password
                      ? "field-shake"
                      : undefined
                  }
                >
                  <div
                    style={s(
                      `display:flex;justify-content:space-between;align-items:center;margin-bottom:6px`
                    )}
                  >
                    <label
                      className="eyebrow"
                      style={s(
                        `font-size:10px`
                      )}
                    >
                      Password
                    </label>

                    <Link
                      href="/forgot-password"
                      style={s(`font-size:11px`)}
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <div className="pw-field">
                    <input
                      className={`in${
                        errors.password
                          ? " invalid"
                          : ""
                      }`}
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      onChange={() =>
                        clearError("password")
                      }
                      required
                    />

                    <button
                      type="button"
                      className="pw-toggle"
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                      onClick={() =>
                        setShowPassword((prev) => !prev)
                      }
                    >
                      <svg
                        className="ic"
                        viewBox="0 0 24 24"
                        style={s(
                          `width:16px;height:16px`
                        )}
                      >
                        <use href="#ic-eye" />
                      </svg>
                    </button>
                  </div>

                  {errors.password && (
                    <p className="err-msg">
                      <svg viewBox="0 0 24 24">
                        <use href="#ic-x" />
                      </svg>

                      {errors.password}
                    </p>
                  )}
                </div>

                <label
                  style={s(
                    `display:flex;align-items:center;gap:8px;font-size:12px;color:#6a6480;margin-top:-2px`
                  )}
                >
                  <input
                    type="checkbox"
                    defaultChecked
                    style={s(
                      `accent-color:#7c3aed`
                    )}
                  />

                  Remember me on this device
                </label>

                <button
                  type="submit"
                  className="btn btn-v"
                  style={s(
                    `width:100%;margin-top:4px`
                  )}
                  disabled={isLoading}
                >
                  {isLoading
                    ? "Sending OTP..."
                    : "Log in"}

                  {!isLoading && (
                    <svg
                      className="ic"
                      viewBox="0 0 24 24"
                      style={s(
                        `width:15px;height:15px`
                      )}
                    >
                      <use href="#ic-arrow" />
                    </svg>
                  )}
                </button>
              </form>

              <p
                style={s(
                  `font-size:12px;color:#8b8599;margin-top:20px;text-align:center`
                )}
              >
                New here?{" "}
                <Link
                  href="/signup"
                  style={s(
                    `font-weight:600`
                  )}
                >
                  Create an account
                </Link>
              </p>
            </>
          ) : (
            <>
              <button
                type="button"
                className="back-link"
                style={s(
                  `margin-bottom:14px`
                )}
                onClick={() => {
                  setStep("credentials");
                  setOtpError(false);
                }}
              >
                <svg
                  className="ic"
                  viewBox="0 0 24 24"
                  style={s(
                    `width:12px;height:12px`
                  )}
                >
                  <use href="#ic-arrow-l" />
                </svg>

                Back
              </button>

              <h1
                className="disp"
                style={s(
                  `font-size:24px;font-weight:600`
                )}
              >
                Verify it&apos;s you
              </h1>

              <p
                className="lead"
                style={s(`margin-top:6px`)}
              >
                Enter the 6-digit code we sent to{" "}
                <strong>
                  {identifier ||
                    "your registered email"}
                </strong>
                .
              </p>

              <form
                style={s(
                  `display:flex;flex-direction:column;gap:16px;margin-top:22px`
                )}
                onSubmit={handleOtpSubmit}
                noValidate
              >
                <div
                  key={`otp-${shakeKey}`}
                  className={
                    otpError
                      ? "field-shake"
                      : undefined
                  }
                >
                  <OtpInput
                    value={otp}
                    onChange={(next) => {
                      setOtp(next);
                      setOtpError(false);
                    }}
                    invalid={otpError}
                  />

                  {otpError && (
                    <p className="err-msg">
                      <svg viewBox="0 0 24 24">
                        <use href="#ic-x" />
                      </svg>

                      Invalid or expired OTP.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-v"
                  style={s(`width:100%`)}
                  disabled={isVerifying}
                >
                  {isVerifying
                    ? "Verifying..."
                    : "Verify & log in"}

                  {!isVerifying && (
                    <svg
                      className="ic"
                      viewBox="0 0 24 24"
                      style={s(
                        `width:15px;height:15px`
                      )}
                    >
                      <use href="#ic-arrow" />
                    </svg>
                  )}
                </button>
              </form>

              <p
                style={s(
                  `font-size:12px;color:#8b8599;margin-top:18px;text-align:center`
                )}
              >
                Didn&apos;t get a code?{" "}
                <button
                  type="button"
                  className="otp-resend"
                  disabled={
                    cooldown > 0 ||
                    isResending
                  }
                  onClick={handleResendOtp}
                >
                  {isResending
                    ? "Sending..."
                    : cooldown > 0
                    ? `Resend in 00:${String(
                        cooldown
                      ).padStart(2, "0")}`
                    : "Resend code"}
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}