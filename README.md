# Sheffield Pub Hunt 2026

A retro pixel-arcade themed charity pub crawl game for Sheffield. Teams log in with a PIN to see their roster, and hosts manage teams/participants from an admin dashboard.

Frontend: React + TypeScript + Vite. Backend: Supabase (Postgres + Auth).

## Setup

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project URL + anon key
npm run dev
```

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — type-check and build for production
- `npm run lint` — run ESLint
- `npm run import-teams` — one-time import of `src/pubhunt.txt` into Supabase (requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` env vars)

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the site and publishes it to GitHub Pages. The build needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` set as repository secrets.

## Database

Schema and the admin-passphrase RPC live in `supabase/schema.sql` and `supabase/admin_passphrase.sql`.

## `/toastmasters` — HSBC 8CS event sign-up tool

A QR-code email sign-up tool for HSBC 8CS London Toastmasters Club events, riding along on this domain because `sheffieldpubhunt.com` is reachable from networks that block `sheffield.lol` (its original home — ported here from the `PhotoPewPew` repo, which is now retired).

It's a genuinely separate static site nested under `/toastmasters/`, not a client-side route inside the Pub Hunt SPA — completely different HTML documents, JS bundles, and CSS (full Tailwind, including preflight, self-hosted Geist font) with zero shared code or styles with Pub Hunt's pixel-arcade design system. They only share this git repo and `vite build`'s multi-page output. It uses its own Supabase project, independent of Pub Hunt's. Source lives in [src/toastmasters/](src/toastmasters/) (pages, lib, one entry file per route in `entries/`) with the four real HTML pages at [toastmasters/](toastmasters/); migrations for its Supabase project are in [supabase/toastmasters/](supabase/toastmasters/).

- **Admin**: `/toastmasters/admin/` — sign in with the Supabase Auth user created for this project, create an event (e.g. "9 July 2026 Meeting"). Each event gets its own QR code and email list.
- **At the event**: click **Display QR** to open `/toastmasters/display/?event=...` on the projector. Attendees scan it, land on `/toastmasters/join/?event=...`, and submit their email.
- **After the event**: click **Export emails (.txt)** to download the list.

Needs two extra env vars (separate Supabase project from the one Pub Hunt uses): `VITE_TOASTMASTERS_SUPABASE_URL` and `VITE_TOASTMASTERS_SUPABASE_ANON_KEY` — see `.env.example`. Run the migrations in [supabase/toastmasters/](supabase/toastmasters/) against that project, then add the same two vars as repository secrets so `.github/workflows/deploy.yml` can build them in.

Adding a new toastmasters page means: a page component in `src/toastmasters/pages/`, an entry file in `src/toastmasters/entries/` that mounts it and imports `../globals.css`, a real `index.html` under `toastmasters/<path>/` referencing that entry script, and a matching line in `vite.config.ts`'s `build.rolldownOptions.input`.
