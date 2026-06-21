-- PubHunt schema: teams, participants, RLS, and team-PIN verification RPC.
-- Run this in the Supabase SQL editor for a fresh project.

create extension if not exists "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  game_theme text not null default 'TBC',
  pin text not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'tbc', 'withdrawn')),
  created_at timestamptz not null default now()
);

create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  full_name text not null,
  is_internal boolean not null default true,
  role text not null default 'participant' check (role in ('captain', 'participant')),
  row_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists participants_team_id_idx on participants(team_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
-- No direct anon access to either table — team members never query these
-- tables directly (that would let anyone read every team's PIN). They only
-- get data back through verify_team_pin(), a SECURITY DEFINER function that
-- bypasses RLS internally and returns just the calling team's own data.
-- Admins (authenticated via Supabase Auth) get full read/write access.

alter table teams enable row level security;
alter table participants enable row level security;

create policy "admins full access to teams"
  on teams for all
  to authenticated
  using (true)
  with check (true);

create policy "admins full access to participants"
  on participants for all
  to authenticated
  using (true)
  with check (true);

-- Public list of team names only (no PINs), so the team login screen can
-- show a dropdown without exposing anything sensitive.
create policy "anon can list team names"
  on teams for select
  to anon
  using (true);

-- NOTE: the policy above allows SELECT on all columns including `pin` at the
-- Postgres level. Since the anon key would otherwise be able to `select pin
-- from teams`, we revoke column-level access to pin/status for anon instead
-- of relying on RLS alone.
revoke select on teams from anon;
grant select (id, name, game_theme) on teams to anon;

-- ============================================================
-- TEAM PIN VERIFICATION RPC
-- ============================================================
-- Returns the team's own data (including participants) only if the PIN
-- matches. Runs as SECURITY DEFINER so it can read the `pin` column despite
-- the anon grant above not including it.

create or replace function verify_team_pin(p_team_name text, p_pin text)
returns table (
  team_id uuid,
  team_name text,
  game_theme text,
  status text,
  participants json
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    t.id,
    t.name,
    t.game_theme,
    t.status,
    coalesce(
      json_agg(
        json_build_object(
          'id', p.id,
          'full_name', p.full_name,
          'is_internal', p.is_internal,
          'role', p.role
        )
        order by p.row_order
      ) filter (where p.id is not null),
      '[]'::json
    ) as participants
  from teams t
  left join participants p on p.team_id = t.id
  where t.name = p_team_name
    and t.pin = p_pin
  group by t.id, t.name, t.game_theme, t.status;
end;
$$;

grant execute on function verify_team_pin(text, text) to anon;
