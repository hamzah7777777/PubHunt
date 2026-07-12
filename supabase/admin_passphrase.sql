-- Admin passphrase login (replaces per-admin email/password accounts).
-- Run this in the Supabase SQL editor after schema.sql. Requires pgcrypto
-- (already enabled by schema.sql).
--
-- How it works: admins type a single shared passphrase. The client first
-- calls supabase.auth.signInAnonymously() to get an authenticated session,
-- then claim_admin(passphrase). If the passphrase matches, the session's
-- auth uid is recorded in admin_users (schema.sql) and every admin RLS
-- policy — which checks is_admin() — starts passing for that session.
-- A session that skips the passphrase gets `authenticated` but no rows.
-- The passphrase itself is never readable by anon — only SECURITY DEFINER
-- functions can see the stored hash.
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

-- Seed a placeholder hash only if none exists (so re-running this file never
-- clobbers the real passphrase). To SET or CHANGE the passphrase, run this
-- separately in the SQL editor with your own value:
--
--   update app_config
--   set value = crypt('YOUR_NEW_PASSPHRASE', gen_salt('bf'))
--   where key = 'admin_passphrase_hash';
insert into app_config (key, value)
values ('admin_passphrase_hash', crypt('REPLACE_WITH_YOUR_PASSPHRASE', gen_salt('bf')))
on conflict (key) do nothing;

-- The old function checked the passphrase without binding it to a session;
-- anyone could skip it and signInAnonymously() straight to `authenticated`.
drop function if exists verify_admin_passphrase(text);

create or replace function claim_admin(p_passphrase text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  stored_hash text;
begin
  if auth.uid() is null then
    return false;
  end if;
  select value into stored_hash from app_config where key = 'admin_passphrase_hash';
  if stored_hash is null or stored_hash <> crypt(p_passphrase, stored_hash) then
    return false;
  end if;
  insert into admin_users (user_id) values (auth.uid())
  on conflict (user_id) do nothing;
  return true;
end;
$$;

grant execute on function claim_admin(text) to authenticated;
