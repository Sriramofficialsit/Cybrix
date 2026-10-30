"use client";

import { useLinkStatus } from "next/link";

// Spinner shown inside a <Link> while its navigation is pending. In dev the
// route may still be compiling (no prefetch, dev indicator hidden), so without
// this a click can look like it did nothing. Always rendered at a fixed size
// and faded in, so it never shifts the layout. Must sit inside a <Link>.
export function LinkPending({ color = "currentColor" }: { color?: string }) {
  const { pending } = useLinkStatus();
  return <span aria-hidden="true" className={`link-pending${pending ? " is-pending" : ""}`} style={{ color }} />;
}
