-- Admin passphrase login (replaces per-admin email/password accounts).
-- Run this in the Supabase SQL editor. Requires pgcrypto (already enabled
-- by schema.sql).
--
-- How it works: admins type a single shared passphrase. The client calls
-- verify_admin_passphrase() to check it, then calls
-- supabase.auth.signInAnonymously() to get a real authenticated session
-- (so the existing "to authenticated" RLS policies on teams/participants
-- still apply normally). The passphrase itself is never readable by anon —
-- only this SECURITY DEFINER function can see the stored hash.
--
-- IMPORTANT: after running this, go to Supabase dashboard ->
-- Authentication -> Sign In / Providers -> enable "Allow anonymous
-- sign-ins". This can't be done via SQL.

create table if not exists app_config (
  key text primary key,
  value text not null
);

alter table app_config enable row level security;
-- No policies = no anon/authenticated access at all. Only SECURITY DEFINER
-- functions (which bypass RLS) and the SQL editor (as postgres) can touch it.

-- Admin passphrase: Mellon
insert into app_config (key, value)
values ('admin_passphrase_hash', crypt('Mellon', gen_salt('bf')))
on conflict (key) do update set value = excluded.value;

create or replace function verify_admin_passphrase(p_passphrase text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  stored_hash text;
begin
  select value into stored_hash from app_config where key = 'admin_passphrase_hash';
  if stored_hash is null then
    return false;
  end if;
  return stored_hash = crypt(p_passphrase, stored_hash);
end;
$$;

grant execute on function verify_admin_passphrase(text) to anon;
