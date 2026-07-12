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
  route text not null default 'A' check (route in ('A', 'B')),
  -- Admin-uploaded cover image (see team_covers.sql); null falls back to
  -- the static theme-based cover in public/covers/.
  cover_url text,
  created_at timestamptz not null default now()
);

-- Safe to re-run against an existing database that predates these columns.
alter table teams add column if not exists route text not null default 'A' check (route in ('A', 'B'));
alter table teams add column if not exists cover_url text;

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
-- ADMIN GATE
-- ============================================================
-- Being `authenticated` does NOT mean being an admin: the admin login flow
-- is signInAnonymously() + claim_admin(passphrase) (see
-- admin_passphrase.sql), which records the session's uid here. Every admin
-- RLS policy checks is_admin() instead of trusting the authenticated role.

create table if not exists admin_users (
  user_id uuid primary key,
  claimed_at timestamptz not null default now()
);

-- RLS on with no policies: nothing can touch this table except SECURITY
-- DEFINER functions and the SQL editor.
alter table admin_users enable row level security;

create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from admin_users where user_id = auth.uid());
$$;

grant execute on function is_admin() to authenticated;
grant execute on function is_admin() to anon;

-- ============================================================
-- TEAM PIN HELPER
-- ============================================================
-- Every team RPC (see the challenge SQL files) passes the caller's PIN and
-- verifies it with this, so a (publicly listable) team id alone grants
-- nothing. Only called inside SECURITY DEFINER functions; no grants needed.

create or replace function team_pin_ok(p_team_id uuid, p_pin text)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from teams where id = p_team_id and pin = p_pin);
$$;

-- ============================================================
-- CLEANUP — removed team-photo + live-feed features (July 2026)
-- ============================================================
-- Drops everything those features created, so re-running this script
-- against the existing database tidies it up. WARNING: destructive —
-- deletes the stored photo URLs and the feed mirror table.
-- The 'team-photos' storage bucket and its files can't be dropped
-- cleanly from SQL; delete them from the dashboard (Storage) instead.
drop trigger if exists teams_sync_team_photos on teams;
drop function if exists sync_team_photos();
drop table if exists team_photos;
drop function if exists set_team_photo(uuid, text);
drop function if exists set_team_costume_photo(uuid, text);
drop policy if exists "anon can upload team photos" on storage.objects;
drop policy if exists "anon can overwrite team photos" on storage.objects;
drop policy if exists "anyone can view team photos" on storage.objects;
alter table teams drop column if exists team_photo_url;
alter table teams drop column if exists costume_photo_url;

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

drop policy if exists "admins full access to teams" on teams;
create policy "admins full access to teams"
  on teams for all
  to authenticated
  using (is_admin())
  with check (is_admin());

drop policy if exists "admins full access to participants" on participants;
create policy "admins full access to participants"
  on participants for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- Public list of team names only (no PINs), so the team login screen can
-- show a dropdown without exposing anything sensitive.
drop policy if exists "anon can list team names" on teams;
create policy "anon can list team names"
  on teams for select
  to anon
  using (true);

-- NOTE: the policy above allows SELECT on all columns including `pin` at the
-- Postgres level. Since the anon key would otherwise be able to `select pin
-- from teams`, we revoke column-level access to pin/status for anon instead
-- of relying on RLS alone.
revoke select on teams from anon;
grant select (id, name, game_theme, cover_url) on teams to anon;

-- ============================================================
-- TEAM PIN VERIFICATION RPC
-- ============================================================
-- Returns the team's own data (including participants) only if the PIN
-- matches. Runs as SECURITY DEFINER so it can read the `pin` column despite
-- the anon grant above not including it.

drop function if exists verify_team_pin(text, text);
create or replace function verify_team_pin(p_team_name text, p_pin text)
returns table (
  team_id uuid,
  team_name text,
  game_theme text,
  status text,
  route text,
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
    t.route,
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
  group by t.id, t.name, t.game_theme, t.status, t.route;
end;
$$;

grant execute on function verify_team_pin(text, text) to anon;

-- ============================================================
-- PUBLIC CAPTAIN LOOKUP
-- ============================================================
-- The team login grid shows each team's captain instead of the team name,
-- without exposing the rest of the roster (participants has no anon SELECT
-- policy). SECURITY DEFINER lets this read participants despite that.

drop function if exists list_team_captains();
create or replace function list_team_captains()
returns table (
  team_id uuid,
  captain_name text
)
language sql
security definer
set search_path = public
as $$
  select team_id, full_name
  from participants
  where role = 'captain';
$$;

grant execute on function list_team_captains() to anon;
