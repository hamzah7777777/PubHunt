-- PubHunt awards (July 2026): the public /results awards page, editable
-- from the admin dashboard's Awards tab.
-- Run this ONCE in the Supabase SQL editor (after schema.sql /
-- security_hardening.sql). Idempotent (safe to re-run) — the seed inserts
-- skip rows that already exist, so re-running never clobbers admin edits.
-- (If you ran the earlier single-winner version of this file, re-running
-- this one upgrades it in place: the alters add the 2nd/3rd columns and
-- the guarded updates at the bottom convert untouched v1 seed rows to the
-- top-3 seeds without clobbering anything an admin has edited.)
--
-- One row per award slot. place 1-3 marks the champions podium (winner +
-- detail only); null place rows are the special award cards with a top-3
-- (winner / second / third), ordered by sort_order. A null winner renders
-- as "TO BE REVEALED" on the public page. The client falls back to a
-- built-in copy of the seeded awards if this table doesn't exist yet.

create table if not exists awards (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  place int check (place between 1 and 3),
  title text not null default '' check (char_length(title) <= 80),
  blurb text not null default '' check (char_length(blurb) <= 300),
  winner text check (winner is null or char_length(winner) <= 120),
  second text check (second is null or char_length(second) <= 120),
  third text check (third is null or char_length(third) <= 120),
  detail text check (detail is null or char_length(detail) <= 200),
  sort_order int not null default 0,
  updated_at timestamptz not null default now()
);

-- Upgrades a table created by the earlier single-winner version.
alter table awards add column if not exists second text
  check (second is null or char_length(second) <= 120);
alter table awards add column if not exists third text
  check (third is null or char_length(third) <= 120);

alter table awards enable row level security;

-- The /results page is public, so anyone may read; only admins write.
drop policy if exists "anyone can read awards" on awards;
create policy "anyone can read awards"
  on awards for select
  to anon, authenticated
  using (true);

drop policy if exists "admins full access to awards" on awards;
create policy "admins full access to awards"
  on awards for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- ============================================================
-- SEED — top 3 per category from the final marked scores
-- (pubhunt-scores.csv), ranked by category score with ties split
-- by overall total. The detail line notes where ties were split.
-- Edit freely from the dashboard's Awards tab.
-- ============================================================

insert into awards (slug, place, title, blurb, winner, second, third, detail, sort_order) values
  ('podium-1', 1, '', '', 'IAM a Plant, IAM a Zombie', null, null, '133 pts', 0),
  ('podium-2', 2, '', '', '50 Shades of Spray', null, null, '99 pts', 0),
  ('podium-3', 3, '', '', 'The Clever Ones', null, null, '96 pts', 0),
  ('quiz-masters', null, 'Quiz Masters', 'Top scores across all the pub route quizzes.',
    'S.T.A.R.S. — 12/12', 'No Pain No Game — 12/12', 'The Clever Ones — 11/12',
    'Four teams tied on 11/12 — 3rd went to the best overall total', 1),
  ('clash-champions', null, 'Clash Champions', 'Most rival teams named in the Team Clash.',
    'IAM a Plant, IAM a Zombie — 51', 'Data Ventures — 48', 'Saddle Sore Squad — 38',
    'Tied 38s for 3rd split by overall total', 2),
  ('eagle-eyes', null, 'Eagle Eyes', 'Best at the character and console photo challenges.',
    '50 Shades of Spray — 30/30', 'FC Wild Cards — 30/30', '2nd Best — 30/30',
    '16 teams shot a perfect 30/30 — top three by overall total', 3),
  ('word-wizards', null, 'Word Wizards', 'Untangled the most anagrams and missing vowels.',
    'I am rubber, you are glue — 16/16', '50 Shades of Spray — 15/16', 'Raiders of the lost packets — 15/16',
    'Tied 15s split by overall total', 4),
  ('big-brain-energy', null, 'Big Brain Energy', 'Highest scores on the brain training gauntlet.',
    '50 Shades of Spray — 8/8', 'FC Wild Cards — 8/8', 'Chilled Out Chickens — 8/8',
    'Four perfect 8/8s — top three by overall total', 5),
  ('social-stars', null, 'Social Stars', 'Best photo and video uploads to the Facebook group.',
    'IAM a Plant, IAM a Zombie — 25/25', '50 Shades of Spray — 25/25', 'The Clever Ones — 25/25',
    '12 teams hit full marks — ranked by overall total', 6)
on conflict (slug) do nothing;

-- ============================================================
-- v1 -> top-3 UPGRADE — only touches rows still holding the exact
-- single-winner seed (second is null and winner matches the old value),
-- so edited or custom awards are left alone. No-op on fresh installs.
-- ============================================================

update awards set
    title = 'Quiz Masters', blurb = 'Top scores across all the pub route quizzes.',
    winner = 'S.T.A.R.S. — 12/12', second = 'No Pain No Game — 12/12', third = 'The Clever Ones — 11/12',
    detail = 'Four teams tied on 11/12 — 3rd went to the best overall total'
  where slug = 'quiz-masters' and second is null and winner = 'S.T.A.R.S.';

update awards set
    winner = 'IAM a Plant, IAM a Zombie — 51', second = 'Data Ventures — 48', third = 'Saddle Sore Squad — 38',
    detail = 'Tied 38s for 3rd split by overall total'
  where slug = 'clash-champions' and second is null and winner = 'IAM a Plant, IAM a Zombie';

update awards set
    winner = '50 Shades of Spray — 30/30', second = 'FC Wild Cards — 30/30', third = '2nd Best — 30/30',
    detail = '16 teams shot a perfect 30/30 — top three by overall total'
  where slug = 'eagle-eyes' and second is null and winner = 'FC Wild Cards';

update awards set
    winner = 'I am rubber, you are glue — 16/16', second = '50 Shades of Spray — 15/16', third = 'Raiders of the lost packets — 15/16',
    detail = 'Tied 15s split by overall total'
  where slug = 'word-wizards' and second is null and winner = 'I am rubber, you are glue';

update awards set
    title = 'Big Brain Energy', blurb = 'Highest scores on the brain training gauntlet.',
    winner = '50 Shades of Spray — 8/8', second = 'FC Wild Cards — 8/8', third = 'Chilled Out Chickens — 8/8',
    detail = 'Four perfect 8/8s — top three by overall total'
  where slug = 'big-brain-energy' and second is null and winner = 'Chilled Out Chickens';

update awards set
    winner = 'IAM a Plant, IAM a Zombie — 25/25', second = '50 Shades of Spray — 25/25', third = 'The Clever Ones — 25/25',
    detail = '12 teams hit full marks — ranked by overall total'
  where slug = 'social-stars' and second is null and winner = '2nd Best';
