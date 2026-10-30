"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { s } from "@/lib/style";

// How long the success state stays up before moving to the login page
const REDIRECT_MS = 2500;
const LEAVE_MS = 420;

// useSearchParams() needs a Suspense boundary for the static export
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [retypePassword, setRetypePassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Fade the card out, then open the login page
  function goToLogin() {
    setLeaving(true);
    setTimeout(() => router.push("/login?reset=true"), LEAVE_MS);
  }

  useEffect(() => {
    if (!success) return;

    const t = setTimeout(goToLogin, REDIRECT_MS);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success]);

  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!token) {
      setError("Invalid or missing password reset token");
      return;
    }

    if (newPassword.length < 10 || !/[a-zA-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setError("Password must be at least 10 characters, with letters and numbers");
      return;
    }

    if (newPassword !== retypePassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${API_BASE}/api/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            newPassword,
            retypePassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message || "Unable to reset password"
        );
        return;
      }

      setSuccess(
        data.message || "Password reset successfully"
      );

      setNewPassword("");
      setRetypePassword("");
    } catch (error) {
      console.error("Reset password error:", error);

      setError(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <g className="tw" fill="#a98fe6">
            <circle cx="90" cy="120" r="3" />
            <circle cx="480" cy="90" r="2.4" />
            <circle cx="520" cy="420" r="3" />
            <circle cx="120" cy="640" r="2.6" />
            <circle cx="60" cy="380" r="2.2" />
            <circle cx="420" cy="760" r="2.4" />
          </g>

          <g className="tw" fill="#7bc0ea">
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
          </div>
        </div>

        <div style={s(`position:relative`)}>
          <h2
            className="disp"
            style={s(
              `font-size:26px;font-weight:600;line-height:1.2`
            )}
          >
            Secure your{" "}
            <span className="lime">
              account
            </span>
            .
          </h2>

          <p
            style={s(
              `font-size:13px;color:#4a445c;margin-top:10px;max-width:360px;line-height:1.7`
            )}
          >
            Create a new password and get back
            to learning securely.
          </p>
        </div>
      </div>

      <div className="auth-main">
        <div
          className={`glass auth-card${
            leaving ? " auth-leave" : ""
          }`}
        >
          {success ? (
            <div className="auth-success">
              <div className="success-badge">
                <svg className="ic" viewBox="0 0 24 24">
                  <use href="#ic-check" />
                </svg>
              </div>

              <h1
                className="disp"
                style={s(`font-size:24px;font-weight:600`)}
              >
                Password reset successfully
              </h1>

              <p
                className="lead"
                style={s(`margin-top:8px`)}
              >
                Taking you to the login page…
              </p>

              <div
                className="redirect-bar"
                style={s(`--dur:${REDIRECT_MS}ms`)}
              >
                <i />
              </div>

              <button
                type="button"
                className="btn btn-v"
                style={s(`width:100%;margin-top:20px`)}
                onClick={goToLogin}
                disabled={leaving}
              >
                Go to log in now
                <svg
                  className="ic"
                  viewBox="0 0 24 24"
                  style={s(`width:15px;height:15px`)}
                >
                  <use href="#ic-arrow" />
                </svg>
              </button>
            </div>
          ) : (
          <>
          <h1
            className="disp"
            style={s(
              `font-size:24px;font-weight:600`
            )}
          >
            Reset your password
          </h1>

          <p
            className="lead"
            style={s(`margin-top:6px`)}
          >
            Enter a new password for your
            account.
          </p>

          <form
            onSubmit={handleSubmit}
            style={s(
              `display:flex;flex-direction:column;gap:16px;margin-top:22px`
            )}
          >
            <div>
              <label
                className="eyebrow"
                style={s(
                  `font-size:10px;display:block;margin-bottom:6px`
                )}
              >
                New password
              </label>

              <input
                className="in"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(e.target.value)
                }
                required
              />
            </div>

            <div>
              <label
                className="eyebrow"
                style={s(
                  `font-size:10px;display:block;margin-bottom:6px`
                )}
              >
                Retype password
              </label>

              <input
                className="in"
                type="password"
                placeholder="Retype new password"
                value={retypePassword}
                onChange={(e) =>
                  setRetypePassword(e.target.value)
                }
                required
              />
            </div>

            {error && (
              <p
                style={s(
                  `font-size:12px;color:#dc2626`
                )}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              className="btn btn-v"
              style={s(`width:100%;margin-top:4px`)}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Resetting..."
                : "Reset password"}

              <svg
                className="ic"
                viewBox="0 0 24 24"
                style={s(
                  `width:15px;height:15px`
                )}
              >
                <use href="#ic-arrow" />
              </svg>
            </button>
          </form>

          <p
            style={s(
              `font-size:12px;color:#8b8599;margin-top:20px;text-align:center`
            )}
          >
            <Link
              href="/login"
              style={s(`font-weight:600`)}
            >
              &larr; Back to log in
            </Link>
          </p>
          </>
          )}
        </div>
      </div>
    </div>
  );
}