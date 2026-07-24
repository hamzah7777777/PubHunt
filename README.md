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

`supabase/awards.sql` sets up the public `/results` awards page: an `awards` table (public read, admin write) seeded with the final winners, edited from the dashboard's Awards tab. The client falls back to a built-in copy of the seed if the table doesn't exist yet.

`supabase/team_covers.sql` sets up admin-managed team cover images: a `teams.cover_url` column, the public `game-covers` storage bucket (admin-only writes), and a `get_clash_targets` that returns the cover. Run it on fresh and existing projects alike (after the files above), and deploy it together with the matching client build — the client selects `cover_url` and fails to load team lists without it. Teams without an uploaded cover keep falling back to the static theme-matched covers in `public/covers/`.

## Full leaderboard (`/into-the-weeds`)

The public `/into-the-weeds` page (also `/#into-the-weeds`, and linked from the awards page) shows the final standings — every team's name, theme, captain, cover and total points. Names, themes, captains and covers load live from the same anon-readable sources the team login uses (`teams`, the `list_team_captains` RPC, `public/covers/`). The per-team answer tables are admin-only, so the **points are frozen** in `src/pages/intoTheWeedsPoints.ts`, baked from the host-exported `pubhunt-scores.csv` (the "Total" column). To refresh after more marking, re-export the scores CSV from the Host dashboard's Scores tab and regenerate that map from its `Team`/`Total` columns.

## Answer key (`/speaking-the-truth`)

The public `/speaking-the-truth` page (also `/#speaking-the-truth`, and linked from the awards page) is a static answer key: every quiz/challenge question with its correct answer — the route quiz (both routes), the character and console photo challenges, anagrams, brain training and missing vowels. It reads straight from the same challenge data modules the app and marking page use (`src/pages/quiz.ts`, `photoChallenge.ts`, `consoleChallenge.ts`, `anagramChallenge.ts`, `brainTrainingChallenge.ts`, `missingVowelsChallenge.ts`), so it can never drift from the real answers — no database or extra data source. The route riddles (pub hints) are deliberately omitted: their answers are the pub names, which are intentionally kept out of the bundle.
