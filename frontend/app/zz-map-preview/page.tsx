"use client";
// TEMPORARY visual preview of the networking page with stubbed progress (deleted after review)
import { AppShell } from "@/components/AppShell";
import CourseOutlineScreen from "@/components/screens/networking/CourseOutlineScreen";
import snap from "./data.json";

if (typeof window !== "undefined" && !(window as unknown as { __stubbed?: boolean }).__stubbed) {
  (window as unknown as { __stubbed?: boolean }).__stubbed = true;
  const real = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes("/api/learn/courses/")) return Promise.resolve(new Response(JSON.stringify(snap), { status: 200, headers: { "Content-Type": "application/json" } }));
    if (url.includes("/api/learn/me")) return Promise.resolve(new Response(JSON.stringify({ profile: snap.profile }), { status: 200, headers: { "Content-Type": "application/json" } }));
    return real(input, init);
  };
}

export default function Page() {
  return (
    <AppShell>
      <CourseOutlineScreen />
    </AppShell>
  );
}
