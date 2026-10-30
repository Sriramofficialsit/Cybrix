# CyberThulir — Frontend (Next.js)


A fully responsive implementation of the CyberThulir design canvas
(`https://claude.ai/code/artifact/ab0c2d9e-08b0-459d-8094-e183bcb6dcf5`).
Every artboard on the canvas is a real route here — marketing site, learner app,
lesson/lab players and the full admin portal.

This is a **presentational frontend only** — no API calls, no auth. Data shown on
each screen is static mock content that mirrors the design. Two screens are
genuinely interactive client components (`/range` filter, `/lesson` quiz flow).

## Stack

- Next.js 14 (App Router) · React 18 · TypeScript
- Tailwind CSS 3 (tokens in `tailwind.config.ts`); most screen styling is the
  ported design system in `app/globals.css`
- `next/font/google` — Space Grotesk + Rubik
- No other runtime dependencies

## Run

```bash
npm install
npm run dev        # http://localhost:10300
```

Production:

```bash
npm run build
npm start          # http://localhost:10300
```

Port **10300** matches the main repo's web dev-server port. Change it in
`package.json` (`dev` / `start` scripts) if needed.

## Routes

| Area | Routes |
| --- | --- |
| Marketing | `/`  `/courses`  `/courses/ccsf` |
| Auth / players | `/login`  `/lesson`  `/lab` |
| Learner app | `/dashboard`  `/learn`  `/range`  `/ctf`  `/red-vs-blue`  `/leaderboard`  `/certificates`  `/community` |
| Admin portal | `/admin` + `/admin/{users, participants, exam-attempts, labs, range, ctf, cert-tracks, submissions, certificates, community, live-events, organizations, releases, design}` |

## Project layout

```
app/
  layout.tsx            root: fonts, <AmbientBg>, <IconSprite>, metadata
  globals.css           the full ported design system + responsive layer
  page.tsx, **/page.tsx thin route wrappers (chrome + <XScreen/>)
components/
  screens/*Screen.tsx   one component per design artboard (the actual UI)
  MarketingChrome.tsx   <MarketingHeader> / <MarketingFooter> (mobile drawer)
  AppShell.tsx          learner sidebar + topbar (off-canvas drawer < 1024px)
  AdminShell.tsx        admin grouped sidebar + breadcrumb bar
  Icon.tsx, IconSprite.tsx   single <svg><symbol> sprite, ~90 icons
  AmbientBg.tsx         background blobs + dotted grid
lib/
  style.ts             s() — parses an inline CSS string to a React style object
  nav.ts               APP_NAV / ADMIN_NAV / MKT_LINKS
public/                bird mascot images
```

### Why `s()` and inline styles?

The screen components are ported from the design canvas, where every element
carries an inline style string. `lib/style.ts` turns those strings into style
objects at render time. The responsive behaviour for these fixed, desktop-first
layouts lives in `app/globals.css` under `/* Responsive layer */` — media
queries plus attribute selectors that collapse the canvas grids and turn the
sidebars into drawers below 1024 / 1100 / 640px.

## Notes

- `next.config.mjs` sets `typescript.ignoreBuildErrors` and
  `eslint.ignoreDuringBuilds` — the mechanically-ported screens use
  string-valued DOM attributes that are valid at runtime but not worth gating
  the build on. App code outside `components/screens` is clean.
- `images.unoptimized: true` — the mascot art is served as-is.
