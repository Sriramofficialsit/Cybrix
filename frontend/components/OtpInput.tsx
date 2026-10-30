"use client";
import { useRef } from "react";

const OTP_LENGTH = 6;

export default function OtpInput({ value, onChange, invalid }: { value: string[]; onChange: (next: string[]) => void; invalid?: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function setDigit(i: number, raw: string) {
    const digit = raw.replace(/\D/g, "").slice(-1);
    const next = [...value];
    next[i] = digit;
    onChange(next);
    if (digit && i < OTP_LENGTH - 1) refs.current[i + 1]?.focus();
  }

  function onKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !value[i] && i > 0) refs.current[i - 1]?.focus();
  }

  function onPaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH).split("");
    if (!digits.length) return;
    e.preventDefault();
    const next = Array.from({ length: OTP_LENGTH }, (_, i) => digits[i] || "");
    onChange(next);
    refs.current[Math.min(digits.length, OTP_LENGTH) - 1]?.focus();
  }

  return (
    <div className="otp-row">
      {Array.from({ length: OTP_LENGTH }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          className={`otp-box${invalid && !value[i] ? " invalid" : ""}`}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={value[i] || ""}
          onChange={(e) => setDigit(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={onPaste}
        />
      ))}
    </div>
  );
}

export { OTP_LENGTH };
