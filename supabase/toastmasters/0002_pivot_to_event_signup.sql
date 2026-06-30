-- Pivot from the photo-gallery schema to an event email-signup tool.
-- Run once in the Supabase SQL editor for your project (after 0001_init.sql).

drop function if exists unlock_shoot(text, text);
drop table if exists photo_edits;
drop table if exists photos;
drop table if exists shoots;
-- Note: the 'shoot-photos' storage bucket itself is left in place — Supabase
-- blocks deleting storage objects/buckets via raw SQL. To remove it, go to
-- Storage in the Supabase dashboard and delete the 'shoot-photos' bucket
-- there (optional cleanup, doesn't affect the new schema below).

create table events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  created_at timestamptz not null default now()
);

create table signups (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  unique (event_id, email)
);

alter table events enable row level security;
alter table signups enable row level security;

-- Anyone can look up an event by slug (needed for the public display/join pages).
create policy "anyone can read events" on events
  for select to anon, authenticated using (true);

-- Only the admin manages events.
create policy "admin manage events" on events
  for all to authenticated using (true) with check (true);

-- Anyone can submit a signup, but only the admin can read or remove them
-- (so attendees can't see each other's emails, and export stays admin-only).
create policy "anyone can submit a signup" on signups
  for insert to anon, authenticated with check (true);

create policy "admin manage signups" on signups
  for all to authenticated using (true) with check (true);
