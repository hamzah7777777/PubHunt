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

-- ============================================================
-- LIVE TEAM FEED
-- ============================================================
-- A narrow, pin-free mirror of `teams` that every team's app can read and
-- subscribe to over Realtime. We don't put `teams` itself on a Realtime
-- publication because Realtime streams full row payloads straight off the
-- WAL, bypassing the column-level grant that hides `pin` from anon below —
-- this table physically has no pin column, so there's nothing to leak.

create table if not exists team_photos (
  team_id uuid primary key references teams(id) on delete cascade,
  name text not null,
  game_theme text not null,
  status text not null,
  team_photo_url text,
  updated_at timestamptz not null default now()
);

alter table team_photos enable row level security;

drop policy if exists "anyone can read the team feed" on team_photos;
create policy "anyone can read the team feed"
  on team_photos for select
  to anon, authenticated
  using (true);

grant select on team_photos to anon, authenticated;

create or replace function sync_team_photos()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into team_photos (team_id, name, game_theme, status, team_photo_url, updated_at)
  values (new.id, new.name, new.game_theme, new.status, new.team_photo_url, now())
  on conflict (team_id) do update set
    name = excluded.name,
    game_theme = excluded.game_theme,
    status = excluded.status,
    team_photo_url = excluded.team_photo_url,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists teams_sync_team_photos on teams;
create trigger teams_sync_team_photos
  after insert or update on teams
  for each row execute function sync_team_photos();

-- Backfill any teams that already existed before this table did.
insert into team_photos (team_id, name, game_theme, status, team_photo_url)
select id, name, game_theme, status, team_photo_url from teams
on conflict (team_id) do update set
  name = excluded.name,
  game_theme = excluded.game_theme,
  status = excluded.status,
  team_photo_url = excluded.team_photo_url;

-- Stream inserts/updates to every subscribed client. Guarded so re-running
-- this script against a project that already has it doesn't error.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'team_photos'
  ) then
    alter publication supabase_realtime add table team_photos;
  end if;
end $$;
