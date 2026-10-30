"use client";

import { useState } from "react";
import Link from "next/link";
import { s } from "@/lib/style";

export default function ForgotPasswordScreen() {
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setIsLoading(true);

    try {
      const API_BASE =
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:5001";

      const response = await fetch(
        `${API_BASE}/api/auth/forgot-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to send reset link. Please try again."
        );
        return;
      }

      setSent(true);
    } catch (error) {
      console.error(
        "Forgot password error:",
        error
      );

      setError(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setIsLoading(false);
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
            Locked out?{" "}
            <span className="lime">
              No stress
            </span>
            .
          </h2>

          <p
            style={s(
              `font-size:13px;color:#4a445c;margin-top:10px;max-width:360px;line-height:1.7`
            )}
          >
            We&apos;ll email you a secure link to
            reset your password. Your streak and
            progress stay safe.
          </p>
        </div>
      </div>

      <div className="auth-main">
        <div className="glass auth-card">
          {!sent ? (
            <>
              <h1
                className="disp"
                style={s(
                  `font-size:24px;font-weight:600`
                )}
              >
                Forgot your password?
              </h1>

              <p
                className="lead"
                style={s(`margin-top:6px`)}
              >
                Enter the email linked to your
                account and we&apos;ll send a reset
                link.
              </p>

              <form
                style={s(
                  `display:flex;flex-direction:column;gap:12px;margin-top:22px`
                )}
                onSubmit={handleSubmit}
              >
                <div>
                  <label
                    className="eyebrow"
                    style={s(
                      `font-size:10px;display:block;margin-bottom:6px`
                    )}
                  >
                    Email
                  </label>

                  <input
                    className="in"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <p
                    style={s(
                      `font-size:12px;color:#dc2626;margin-top:2px`
                    )}
                  >
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="btn btn-v"
                  style={s(
                    `width:100%;margin-top:4px`
                  )}
                  disabled={isLoading}
                >
                  {isLoading
                    ? "Sending..."
                    : "Send reset link"}

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
            </>
          ) : (
            <div style={s(`text-align:center`)}>
              <div
                className="stat-ic"
                style={s(
                  `width:52px;height:52px;margin:0 auto 14px`
                )}
              >
                <svg
                  className="ic"
                  viewBox="0 0 24 24"
                  style={s(
                    `width:24px;height:24px;stroke:#7c3aed`
                  )}
                >
                  <use href="#ic-mail" />
                </svg>
              </div>

              <h1
                className="disp"
                style={s(
                  `font-size:24px;font-weight:600`
                )}
              >
                Check your inbox
              </h1>

              <p
                className="lead"
                style={s(`margin-top:6px`)}
              >
                If an account exists for{" "}
                <strong>{email}</strong>, a reset
                link is on its way. It expires in 30
                minutes.
              </p>

              <button
                type="button"
                className="btn btn-g"
                style={s(
                  `width:100%;margin-top:22px`
                )}
                onClick={() => {
                  setSent(false);
                  setError("");
                }}
              >
                Use a different email
              </button>
            </div>
          )}

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
        </div>
      </div>
    </div>
  );
}