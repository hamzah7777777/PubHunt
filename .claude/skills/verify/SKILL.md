---
name: verify
description: How to build, serve, and browser-drive PubHunt for runtime verification.
---

# Verifying PubHunt changes

React + Vite SPA, deployed to GitHub Pages (root domain via public/CNAME).
No router: views are App.tsx state; deep links are hash-based (`/#pub-A2`,
`/#results`). `public/404.html` is the Pages shim that rewrites known SPA
paths (e.g. `/results`) to their hash form.

## Build & serve

- `npm run build` — tsc + vite build into `dist/` (needs `.env.local`,
  already present). A >500 kB chunk warning is normal.
- `npm run dev` serves any path (SPA fallback), so it does NOT exercise the
  404.html shim. To verify production path handling, serve `dist/` with a
  server that mimics Pages: file if it exists, else 404.html with status 404
  (~20-line node http server works).

## Browser driving

- `puppeteer-core` is a devDependency; no bundled browser. Use
  `executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe'`
  (Edge also available at `C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe`).
- ESM scripts must live inside the repo to resolve `puppeteer-core` from
  node_modules — copy the script in, run, delete.
- Gotcha: the design system uppercases text via CSS `text-transform`, and
  `innerText` reflects that — match text case-insensitively.
- Gotcha: past the submission cutoff (`src/lib/cutoff.ts`), a fresh browser
  profile auto-opens the CutoffPopup overlay (`.game-modal-overlay`) once
  per device, which swallows mouse clicks. Set
  `localStorage.pubhunt_cutoff_seen = '1'` before interacting, or close it.
- Team session pages need `localStorage.pubhunt_team_session` with a `pin`
  field (sessions without `pin` are discarded on load).
- Admin dashboard without real credentials: seed a fake Supabase session in
  `localStorage["sb-<project-ref>-auth-token"]` (ref = first label of
  VITE_SUPABASE_URL's hostname; needs access_token/refresh_token/expires_at/
  user), then intercept `/rest/v1/rpc/is_admin` → `true` and the `/rest/v1/*`
  tables the dashboard loads. Mocked supabase.co responses MUST carry CORS
  headers (`access-control-allow-origin: *` etc.) and answer OPTIONS
  preflights — Supabase requests send apikey/authorization so even GETs
  preflight, and the browser silently drops mock responses without them.

## Flows worth driving

- Landing page, team login, header logo navigation.
- Hash deep links: `/#pub-A2` (public hint), `/#results` (awards).
- Production-only: `/results` path through the 404.html shim.
