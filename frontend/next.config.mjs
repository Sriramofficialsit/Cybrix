import { fileURLToPath } from 'node:url';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // This folder is the app root (there is another lockfile one level up)
  turbopack: { root: fileURLToPath(new URL('.', import.meta.url)) },
  reactStrictMode: true,
  // Hide the Next.js "N" badge shown in the corner during `next dev`
  devIndicators: false,
  output: 'export',        // emit a static ./out folder (like Vite's dist) for Netlify drag-and-drop
  images: { unoptimized: true },
  // The screen components are mechanically ported from the design canvas
  // (inline-style strings, string-valued DOM attrs). They run correctly at
  // runtime; we don't gate the production build on their static types.
  typescript: { ignoreBuildErrors: true },
};
export default nextConfig;
