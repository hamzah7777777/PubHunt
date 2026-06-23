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
  team_photo_url text,
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

-- Safe to re-run against an existing database that predates this column.
-- Renames the original column name (costume_photo_url) if it's still
-- around, so already-uploaded photos aren't lost by the rename.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'teams' and column_name = 'costume_photo_url'
  ) and not exists (
    select 1 from information_schema.columns
    where table_name = 'teams' and column_name = 'team_photo_url'
  ) then
    alter table teams rename column costume_photo_url to team_photo_url;
  end if;
end $$;
alter table teams add column if not exists team_photo_url text;

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
  using (true)
  with check (true);

drop policy if exists "admins full access to participants" on participants;
create policy "admins full access to participants"
  on participants for all
  to authenticated
  using (true)
  with check (true);

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
grant select (id, name, game_theme) on teams to anon;

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
  team_photo_url text,
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
    t.team_photo_url,
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
  group by t.id, t.name, t.game_theme, t.status, t.team_photo_url;
end;
$$;

grant execute on function verify_team_pin(text, text) to anon;

-- ============================================================
-- TEAM PHOTO UPLOAD
-- ============================================================
-- Teams aren't authenticated via Supabase Auth (just PIN-gated through the
-- RPC above), so there's no JWT to scope a storage policy to. We treat the
-- team_id (a UUID handed back only after a successful PIN check) the same
-- way the rest of this app treats a logged-in session: knowledge of it is
-- the bearer credential. This RPC lets the anon key update only the
-- team_photo_url column, nothing else, for a given team id.

drop function if exists set_team_costume_photo(uuid, text);
create or replace function set_team_photo(p_team_id uuid, p_photo_url text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update teams set team_photo_url = p_photo_url where id = p_team_id;
end;
$$;

grant execute on function set_team_photo(uuid, text) to anon;

-- Storage bucket for team photos. Public read (so the uploaded
-- image URL can be displayed directly), uploads/overwrites via the anon key
-- since there's no Supabase Auth session for teams. Also grant the
-- authenticated role: admins get an anonymous Supabase Auth session on
-- login (see verify_admin_passphrase / signInAnonymously), which persists
-- in the browser and causes the same browser to send authenticated
-- requests for everything afterwards -- including team photo uploads.
insert into storage.buckets (id, name, public)
values ('team-photos', 'team-photos', true)
on conflict (id) do nothing;

drop policy if exists "anon can upload team photos" on storage.objects;
create policy "anon can upload team photos"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'team-photos');

drop policy if exists "anon can overwrite team photos" on storage.objects;
create policy "anon can overwrite team photos"
  on storage.objects for update
  to anon, authenticated
  using (bucket_id = 'team-photos');

drop policy if exists "anyone can view team photos" on storage.objects;
create policy "anyone can view team photos"
  on storage.objects for select
  to public
  using (bucket_id = 'team-photos');
