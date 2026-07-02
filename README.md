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
- `npm run import-teams` — sync teams and rosters from `data/pubhuntparticipant.csv` (teams, captains, routes) and `data/pubhuntparticipantfull.csv` (full rosters) into Supabase. Safe to re-run: existing teams keep their PINs; add `--prune` to delete DB teams no longer in the CSV. Requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` env vars.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the site and publishes it to GitHub Pages. The build needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` set as repository secrets.

## Database

Schema and the admin-passphrase RPC live in `supabase/schema.sql` and `supabase/admin_passphrase.sql`.
