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

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the site and publishes it to GitHub Pages. The build needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` set as repository secrets.

## Database

Schema and the admin-passphrase login live in `supabase/schema.sql` and `supabase/admin_passphrase.sql`; each challenge has its own SQL file alongside them. For a fresh project, run `schema.sql`, then `admin_passphrase.sql`, then the challenge files.

`supabase/security_hardening.sql` is a one-shot migration that brings an existing database up to the current security model (admin gate via `claim_admin`/`is_admin`, PIN-checked team RPCs, answer length caps). Deploy it together with the matching client build — old clients can't call the new RPC signatures and vice versa.

`supabase/team_covers.sql` sets up admin-managed team cover images: a `teams.cover_url` column, the public `game-covers` storage bucket (admin-only writes), and a `get_clash_targets` that returns the cover. Run it on fresh and existing projects alike (after the files above), and deploy it together with the matching client build — the client selects `cover_url` and fails to load team lists without it. Teams without an uploaded cover keep falling back to the static theme-matched covers in `public/covers/`.
