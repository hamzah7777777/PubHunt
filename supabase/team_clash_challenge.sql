-- PubHunt team clash challenge: per-team rival-name answers + marking.
-- Run this in the Supabase SQL editor (after schema.sql).
--
-- Teams see the cover/theme of every other team on their route and must
-- find out (in the pubs!) what that team is actually called. Each guess is
-- submitted per rival team (resubmitting overwrites and clears any existing
-- mark). Admins mark each answer: 1 point per correct team name.

create table if not exists team_clash_answers (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  target_team_id uuid not null references teams(id) on delete cascade,
  answer text not null,
  -- null = not marked yet, true/false = marked by an admin
  is_correct boolean,
  submitted_at timestamptz not null default now(),
  unique (team_id, target_team_id),
  check (team_id <> target_team_id)
);

create index if not exists team_clash_answers_team_id_idx on team_clash_answers(team_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
-- Same model as quiz_answers: no direct anon access; teams go through the
-- SECURITY DEFINER RPCs below and admins get full access.

alter table team_clash_answers enable row level security;

drop policy if exists "admins full access to team_clash_answers" on team_clash_answers;
create policy "admins full access to team_clash_answers"
  on team_clash_answers for all
  to authenticated
  using (true)
  with check (true);

-- ============================================================
-- TEAM RPCS
-- ============================================================
-- NOTE: like the rest of the app, these trust the team_id the client holds
-- after PIN login (stored in localStorage) rather than re-verifying the PIN.

-- The rival teams a team has to identify: everyone else on their route
-- (withdrawn teams excluded). Only the cover theme is exposed — the team
-- name is the answer, and anon's teams grant doesn't include route.
drop function if exists get_clash_targets(uuid);
create or replace function get_clash_targets(p_team_id uuid)
returns table (
  team_id uuid,
  game_theme text
)
language sql
security definer
set search_path = public
as $$
  select t.id, t.game_theme
  from teams t
  where t.route = (select route from teams where id = p_team_id)
    and t.id <> p_team_id
    and t.status <> 'withdrawn'
  order by t.game_theme;
$$;

grant execute on function get_clash_targets(uuid) to anon;

drop function if exists submit_team_clash_answer(uuid, uuid, text);
create or replace function submit_team_clash_answer(
  p_team_id uuid,
  p_target_team_id uuid,
  p_answer text
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into team_clash_answers (team_id, target_team_id, answer)
  values (p_team_id, p_target_team_id, p_answer)
  on conflict (team_id, target_team_id)
  do update set
    answer = excluded.answer,
    is_correct = null,
    submitted_at = now();
$$;

grant execute on function submit_team_clash_answer(uuid, uuid, text) to anon;

drop function if exists get_team_clash_answers(uuid);
create or replace function get_team_clash_answers(p_team_id uuid)
returns table (
  target_team_id uuid,
  answer text,
  is_correct boolean
)
language sql
security definer
set search_path = public
as $$
  select target_team_id, answer, is_correct
  from team_clash_answers
  where team_id = p_team_id;
$$;

grant execute on function get_team_clash_answers(uuid) to anon;
