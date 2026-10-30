"use client";

import type { CSSProperties, ReactNode } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LearnApiError, completeStage, type Stage } from "@/lib/learn";

// "Continue" for a lesson stage: records the stage as complete on the
// server (which awards its XP), then moves on to the next stage. If the
// save fails the learner stays put and sees why, so progress is never lost
// silently.
export function StageContinue({
  topicId,
  stage,
  href,
  className = "btn",
  style,
  children,
}: {
  topicId: string;
  stage: Stage;
  href: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onClick() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await completeStage(topicId, stage);
      router.push(href);
    } catch (e) {
      if (e instanceof LearnApiError && e.status === 401) {
        router.push("/login");
        return;
      }
      setError(e instanceof Error ? e.message : "Couldn't save your progress. Try again.");
      setBusy(false);
    }
  }

  return (
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        aria-busy={busy}
        className={className}
        style={{ ...style, opacity: busy ? 0.75 : 1, cursor: busy ? "progress" : "pointer" }}
      >
        {children}
      </button>
      {error && (
        <span role="alert" style={{ fontSize: 11.5, fontWeight: 600, color: "#e11d48", maxWidth: 280, textAlign: "right" }}>
          {error}
        </span>
      )}
    </span>
  );
}
