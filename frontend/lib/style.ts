import type { CSSProperties } from "react";

/**
 * Convert an inline CSS string ("a-b:c; d:e") to a React style object.
 * Used by the screen components ported 1:1 from the design canvas.
 */
export function s(css: string): CSSProperties {
  const out: Record<string, string> = {};
  let depth = 0;
  let buf = "";
  const decls: string[] = [];
  for (const ch of css) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === ";" && depth === 0) {
      decls.push(buf);
      buf = "";
    } else {
      buf += ch;
    }
  }
  if (buf.trim()) decls.push(buf);
  for (const d of decls) {
    const i = d.indexOf(":");
    if (i === -1) continue;
    const rawKey = d.slice(0, i).trim();
    const val = d.slice(i + 1).trim();
    if (!rawKey) continue;
    const key = rawKey.startsWith("--")
      ? rawKey
      : rawKey.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    out[key] = val;
  }
  return out as CSSProperties;
}
