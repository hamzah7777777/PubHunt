-- PubHunt team game covers (July 2026): admin-managed per-team cover images.
-- Run this ONCE in the Supabase SQL editor (after schema.sql /
-- security_hardening.sql). Idempotent (safe to re-run).
--
-- Covers used to come only from the static manifest in public/covers/,
-- matched by game_theme. Admins can now upload a custom cover per team from
-- the dashboard: the image goes in the public 'game-covers' storage bucket
-- and its URL in teams.cover_url. A null cover_url keeps the theme-based
-- static cover as the fallback, so nothing changes for teams without one.

-- ============================================================
-- 1. TEAMS COLUMN
-- ============================================================

alter table teams add column if not exists cover_url text;

alter table teams drop constraint if exists teams_cover_url_len;
alter table teams add constraint teams_cover_url_len
  check (cover_url is null or char_length(cover_url) <= 500);

-- The team login grid reads covers straight off teams; extend the anon
-- column grant from schema.sql (id, name, game_theme) to include it.
grant select (cover_url) on teams to anon;

-- ============================================================
-- 2. TEAM CLASH TARGETS — expose the cover too
-- ============================================================
-- Supersedes the definition in team_clash_challenge.sql /
-- security_hardening.sql. Still only the cover and theme — the team name
-- is the answer.

drop function if exists get_clash_targets(uuid, text);
create or replace function get_clash_targets(p_team_id uuid, p_pin text)
returns table (team_id uuid, game_theme text, cover_url text)
language sql
security definer
set search_path = public
as $$
  select t.id, t.game_theme, t.cover_url
  from teams t
  where t.id <> p_team_id
    and t.status <> 'withdrawn'
    and team_pin_ok(p_team_id, p_pin)
  order by t.game_theme;
$$;

grant execute on function get_clash_targets(uuid, text) to anon;

-- ============================================================
-- 3. STORAGE — public 'game-covers' bucket, admin-only writes
-- ============================================================
-- The dashboard uploads one downscaled image per team ({team_id}.webp or
-- .jpg, a few tens of KB). 2 MB limit is generous headroom.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('game-covers', 'game-covers', true, 2097152, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- NOTE: if CREATE POLICY below fails with "must be owner of table objects",
-- your project doesn't let the SQL editor touch storage.objects — create the
-- same two policies from Dashboard -> Storage -> Policies instead.

drop policy if exists "admins manage game covers" on storage.objects;
create policy "admins manage game covers"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'game-covers' and is_admin())
  with check (bucket_id = 'game-covers' and is_admin());

drop policy if exists "anyone can view game covers" on storage.objects;
create policy "anyone can view game covers"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'game-covers');
