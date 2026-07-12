-- PubHunt team clash challenge: per-team rival-name answers + marking.
-- Run this in the Supabase SQL editor (after schema.sql).
--
-- Teams see the cover/theme of every other team (both routes) and must
-- find out (in the pubs!) what that team is actually called. Each guess is
-- submitted per rival team (resubmitting overwrites and clears any existing
-- mark). Admins mark each answer: 1 point per correct team name.

create table if not exists team_clash_answers (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  target_team_id uuid not null references teams(id) on delete cascade,
  -- capped so nobody can stuff megabytes into the marking dashboards
  answer text not null check (char_length(answer) <= 200),
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
-- SECURITY DEFINER RPCs below and admins (is_admin(), see schema.sql) get
-- full access.

alter table team_clash_answers enable row level security;

drop policy if exists "admins full access to team_clash_answers" on team_clash_answers;
create policy "admins full access to team_clash_answers"
  on team_clash_answers for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- ============================================================
-- TEAM RPCS
-- ============================================================
-- Every RPC verifies the caller's PIN via team_pin_ok() (schema.sql), so a
-- (publicly listable) team id alone grants nothing.

-- The rival teams a team has to identify: every other team across both
-- routes (withdrawn teams excluded). Only the cover theme is exposed — the
-- team name is the answer.
drop function if exists get_clash_targets(uuid);
drop function if exists get_clash_targets(uuid, text);
create or replace function get_clash_targets(p_team_id uuid, p_pin text)
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
  where t.id <> p_team_id
    and t.status <> 'withdrawn'
    and team_pin_ok(p_team_id, p_pin)
  order by t.game_theme;
$$;

grant execute on function get_clash_targets(uuid, text) to anon;

drop function if exists submit_team_clash_answer(uuid, uuid, text);
drop function if exists submit_team_clash_answer(uuid, uuid, text, text);
create or replace function submit_team_clash_answer(
  p_team_id uuid,
  p_target_team_id uuid,
  p_answer text,
  p_pin text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not team_pin_ok(p_team_id, p_pin) then
    raise exception 'invalid team credentials';
  end if;
  insert into team_clash_answers (team_id, target_team_id, answer)
  values (p_team_id, p_target_team_id, p_answer)
  on conflict (team_id, target_team_id)
  do update set
    answer = excluded.answer,
    is_correct = null,
    submitted_at = now();
end;
$$;

grant execute on function submit_team_clash_answer(uuid, uuid, text, text) to anon;

drop function if exists get_team_clash_answers(uuid);
drop function if exists get_team_clash_answers(uuid, text);
create or replace function get_team_clash_answers(p_team_id uuid, p_pin text)
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
  where team_id = p_team_id and team_pin_ok(p_team_id, p_pin);
$$;

grant execute on function get_team_clash_answers(uuid, text) to anon;
