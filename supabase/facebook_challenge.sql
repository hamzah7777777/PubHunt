-- PubHunt Facebook photo/video challenge: per-team yes/no marks.
-- Run this in the Supabase SQL editor (after schema.sql).
--
-- Teams upload to the Facebook group directly; nothing is submitted in the
-- app. Markers check the group and record whether each team uploaded:
--   team_photo       team photo taken at the start point (GH)
--   selection_video  character-selection-screen video montage
--   scene_video      iconic scene from their game
-- null = not checked yet, true = uploaded, false = not uploaded.

create table if not exists facebook_marks (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade unique,
  team_photo boolean,
  selection_video boolean,
  scene_video boolean,
  updated_at timestamptz not null default now()
);

-- Same model as the answer tables: no anon access (no policy for anon),
-- admins get full access. Only admins ever read or write this table.
alter table facebook_marks enable row level security;

drop policy if exists "admins full access to facebook_marks" on facebook_marks;
create policy "admins full access to facebook_marks"
  on facebook_marks for all
  to authenticated
  using (true)
  with check (true);

-- Live sync between markers (same as supabase/realtime.sql).
alter publication supabase_realtime add table facebook_marks;
