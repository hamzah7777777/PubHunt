-- PubHunt security hardening (July 2026). Run this ONCE in the Supabase SQL
-- editor against the existing database. It is idempotent (safe to re-run).
--
-- What it does:
--   1. Admin gate: being `authenticated` no longer means being an admin.
--      Admins must claim admin rights with the passphrase via claim_admin();
--      every "admins full access" RLS policy now checks is_admin().
--      (Previously anyone could call supabase.auth.signInAnonymously() with
--      the public anon key and get full read/write on every table.)
--   2. PIN-checked team RPCs: every team submit/get RPC now takes p_pin and
--      verifies it against the team's PIN, so holding a (publicly listable)
--      team id is no longer enough to read or overwrite that team's answers.
--      The old unauthenticated function signatures are dropped.
--   3. Length caps: answers are capped at 200 characters at the database
--      level (the client caps inputs at 100).
--
-- The matching client code passes p_pin from the logged-in session; deploy
-- it together with this migration or team pages will fail to load/save.

-- ============================================================
-- 1a. ADMIN GATE — table + helpers
-- ============================================================

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

-- Called after signInAnonymously(): checks the passphrase and, if correct,
-- records the caller's auth uid as an admin. Replaces the old client-side
-- verify_admin_passphrase() gate, which never bound the passphrase to the
-- session it "authorised".
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

drop function if exists verify_admin_passphrase(text);

-- ============================================================
-- 1b. ADMIN GATE — retighten every "admins full access" policy
-- ============================================================

drop policy if exists "admins full access to teams" on teams;
create policy "admins full access to teams"
  on teams for all to authenticated
  using (is_admin()) with check (is_admin());

drop policy if exists "admins full access to participants" on participants;
create policy "admins full access to participants"
  on participants for all to authenticated
  using (is_admin()) with check (is_admin());

drop policy if exists "admins full access to quiz_answers" on quiz_answers;
create policy "admins full access to quiz_answers"
  on quiz_answers for all to authenticated
  using (is_admin()) with check (is_admin());

drop policy if exists "admins full access to photo_answers" on photo_answers;
create policy "admins full access to photo_answers"
  on photo_answers for all to authenticated
  using (is_admin()) with check (is_admin());

drop policy if exists "admins full access to anagram_answers" on anagram_answers;
create policy "admins full access to anagram_answers"
  on anagram_answers for all to authenticated
  using (is_admin()) with check (is_admin());

drop policy if exists "admins full access to console_answers" on console_answers;
create policy "admins full access to console_answers"
  on console_answers for all to authenticated
  using (is_admin()) with check (is_admin());

drop policy if exists "admins full access to brain_training_answers" on brain_training_answers;
create policy "admins full access to brain_training_answers"
  on brain_training_answers for all to authenticated
  using (is_admin()) with check (is_admin());

drop policy if exists "admins full access to missing_vowels_answers" on missing_vowels_answers;
create policy "admins full access to missing_vowels_answers"
  on missing_vowels_answers for all to authenticated
  using (is_admin()) with check (is_admin());

drop policy if exists "admins full access to team_clash_answers" on team_clash_answers;
create policy "admins full access to team_clash_answers"
  on team_clash_answers for all to authenticated
  using (is_admin()) with check (is_admin());

drop policy if exists "admins full access to facebook_marks" on facebook_marks;
create policy "admins full access to facebook_marks"
  on facebook_marks for all to authenticated
  using (is_admin()) with check (is_admin());

-- ============================================================
-- 2a. PIN CHECK — helper
-- ============================================================
-- Used inside the SECURITY DEFINER RPCs below; no grants needed.

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
-- 2b. PIN CHECK — replace every team RPC (old signatures dropped)
-- ============================================================

-- ---- quiz ----
drop function if exists submit_quiz_answer(uuid, int, int, text);
drop function if exists submit_quiz_answer(uuid, int, int, text, text);
create or replace function submit_quiz_answer(
  p_team_id uuid, p_quiz int, p_question int, p_answer text, p_pin text
)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not team_pin_ok(p_team_id, p_pin) then
    raise exception 'invalid team credentials';
  end if;
  insert into quiz_answers (team_id, quiz_number, question_number, answer)
  values (p_team_id, p_quiz, p_question, p_answer)
  on conflict (team_id, quiz_number, question_number)
  do update set answer = excluded.answer, is_correct = null, submitted_at = now();
end;
$$;
grant execute on function submit_quiz_answer(uuid, int, int, text, text) to anon;

drop function if exists get_team_quiz_answers(uuid);
drop function if exists get_team_quiz_answers(uuid, text);
create or replace function get_team_quiz_answers(p_team_id uuid, p_pin text)
returns table (quiz_number int, question_number int, answer text, is_correct boolean)
language sql security definer set search_path = public
as $$
  select quiz_number, question_number, answer, is_correct
  from quiz_answers
  where team_id = p_team_id and team_pin_ok(p_team_id, p_pin);
$$;
grant execute on function get_team_quiz_answers(uuid, text) to anon;

-- ---- photo ----
drop function if exists submit_photo_answer(uuid, int, text, text);
drop function if exists submit_photo_answer(uuid, int, text, text, text);
create or replace function submit_photo_answer(
  p_team_id uuid, p_photo int, p_character text, p_game text, p_pin text
)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not team_pin_ok(p_team_id, p_pin) then
    raise exception 'invalid team credentials';
  end if;
  insert into photo_answers (team_id, photo_number, character_answer, game_answer)
  values (p_team_id, p_photo, p_character, p_game)
  on conflict (team_id, photo_number)
  do update set
    character_answer = excluded.character_answer,
    game_answer = excluded.game_answer,
    character_correct = null,
    game_correct = null,
    submitted_at = now();
end;
$$;
grant execute on function submit_photo_answer(uuid, int, text, text, text) to anon;

drop function if exists get_team_photo_answers(uuid);
drop function if exists get_team_photo_answers(uuid, text);
create or replace function get_team_photo_answers(p_team_id uuid, p_pin text)
returns table (
  photo_number int, character_answer text, game_answer text,
  character_correct boolean, game_correct boolean
)
language sql security definer set search_path = public
as $$
  select photo_number, character_answer, game_answer, character_correct, game_correct
  from photo_answers
  where team_id = p_team_id and team_pin_ok(p_team_id, p_pin);
$$;
grant execute on function get_team_photo_answers(uuid, text) to anon;

-- ---- anagram ----
drop function if exists submit_anagram_answer(uuid, int, text);
drop function if exists submit_anagram_answer(uuid, int, text, text);
create or replace function submit_anagram_answer(
  p_team_id uuid, p_anagram int, p_answer text, p_pin text
)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not team_pin_ok(p_team_id, p_pin) then
    raise exception 'invalid team credentials';
  end if;
  insert into anagram_answers (team_id, anagram_number, answer)
  values (p_team_id, p_anagram, p_answer)
  on conflict (team_id, anagram_number)
  do update set answer = excluded.answer, is_correct = null, submitted_at = now();
end;
$$;
grant execute on function submit_anagram_answer(uuid, int, text, text) to anon;

drop function if exists get_team_anagram_answers(uuid);
drop function if exists get_team_anagram_answers(uuid, text);
create or replace function get_team_anagram_answers(p_team_id uuid, p_pin text)
returns table (anagram_number int, answer text, is_correct boolean)
language sql security definer set search_path = public
as $$
  select anagram_number, answer, is_correct
  from anagram_answers
  where team_id = p_team_id and team_pin_ok(p_team_id, p_pin);
$$;
grant execute on function get_team_anagram_answers(uuid, text) to anon;

-- ---- console ----
drop function if exists submit_console_answer(uuid, int, text);
drop function if exists submit_console_answer(uuid, int, text, text);
create or replace function submit_console_answer(
  p_team_id uuid, p_console int, p_answer text, p_pin text
)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not team_pin_ok(p_team_id, p_pin) then
    raise exception 'invalid team credentials';
  end if;
  insert into console_answers (team_id, console_number, answer)
  values (p_team_id, p_console, p_answer)
  on conflict (team_id, console_number)
  do update set answer = excluded.answer, is_correct = null, submitted_at = now();
end;
$$;
grant execute on function submit_console_answer(uuid, int, text, text) to anon;

drop function if exists get_team_console_answers(uuid);
drop function if exists get_team_console_answers(uuid, text);
create or replace function get_team_console_answers(p_team_id uuid, p_pin text)
returns table (console_number int, answer text, is_correct boolean)
language sql security definer set search_path = public
as $$
  select console_number, answer, is_correct
  from console_answers
  where team_id = p_team_id and team_pin_ok(p_team_id, p_pin);
$$;
grant execute on function get_team_console_answers(uuid, text) to anon;

-- ---- brain training ----
drop function if exists submit_brain_training_answer(uuid, int, text);
drop function if exists submit_brain_training_answer(uuid, int, text, text);
create or replace function submit_brain_training_answer(
  p_team_id uuid, p_question int, p_answer text, p_pin text
)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not team_pin_ok(p_team_id, p_pin) then
    raise exception 'invalid team credentials';
  end if;
  insert into brain_training_answers (team_id, question_number, answer)
  values (p_team_id, p_question, p_answer)
  on conflict (team_id, question_number)
  do update set answer = excluded.answer, is_correct = null, submitted_at = now();
end;
$$;
grant execute on function submit_brain_training_answer(uuid, int, text, text) to anon;

drop function if exists get_team_brain_training_answers(uuid);
drop function if exists get_team_brain_training_answers(uuid, text);
create or replace function get_team_brain_training_answers(p_team_id uuid, p_pin text)
returns table (question_number int, answer text, is_correct boolean)
language sql security definer set search_path = public
as $$
  select question_number, answer, is_correct
  from brain_training_answers
  where team_id = p_team_id and team_pin_ok(p_team_id, p_pin);
$$;
grant execute on function get_team_brain_training_answers(uuid, text) to anon;

-- ---- missing vowels ----
drop function if exists submit_missing_vowels_answer(uuid, int, text);
drop function if exists submit_missing_vowels_answer(uuid, int, text, text);
create or replace function submit_missing_vowels_answer(
  p_team_id uuid, p_puzzle int, p_answer text, p_pin text
)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not team_pin_ok(p_team_id, p_pin) then
    raise exception 'invalid team credentials';
  end if;
  insert into missing_vowels_answers (team_id, puzzle_number, answer)
  values (p_team_id, p_puzzle, p_answer)
  on conflict (team_id, puzzle_number)
  do update set answer = excluded.answer, is_correct = null, submitted_at = now();
end;
$$;
grant execute on function submit_missing_vowels_answer(uuid, int, text, text) to anon;

drop function if exists get_team_missing_vowels_answers(uuid);
drop function if exists get_team_missing_vowels_answers(uuid, text);
create or replace function get_team_missing_vowels_answers(p_team_id uuid, p_pin text)
returns table (puzzle_number int, answer text, is_correct boolean)
language sql security definer set search_path = public
as $$
  select puzzle_number, answer, is_correct
  from missing_vowels_answers
  where team_id = p_team_id and team_pin_ok(p_team_id, p_pin);
$$;
grant execute on function get_team_missing_vowels_answers(uuid, text) to anon;

-- ---- team clash ----
drop function if exists get_clash_targets(uuid);
drop function if exists get_clash_targets(uuid, text);
create or replace function get_clash_targets(p_team_id uuid, p_pin text)
returns table (team_id uuid, game_theme text)
language sql security definer set search_path = public
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
  p_team_id uuid, p_target_team_id uuid, p_answer text, p_pin text
)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not team_pin_ok(p_team_id, p_pin) then
    raise exception 'invalid team credentials';
  end if;
  insert into team_clash_answers (team_id, target_team_id, answer)
  values (p_team_id, p_target_team_id, p_answer)
  on conflict (team_id, target_team_id)
  do update set answer = excluded.answer, is_correct = null, submitted_at = now();
end;
$$;
grant execute on function submit_team_clash_answer(uuid, uuid, text, text) to anon;

drop function if exists get_team_clash_answers(uuid);
drop function if exists get_team_clash_answers(uuid, text);
create or replace function get_team_clash_answers(p_team_id uuid, p_pin text)
returns table (target_team_id uuid, answer text, is_correct boolean)
language sql security definer set search_path = public
as $$
  select target_team_id, answer, is_correct
  from team_clash_answers
  where team_id = p_team_id and team_pin_ok(p_team_id, p_pin);
$$;
grant execute on function get_team_clash_answers(uuid, text) to anon;

-- ============================================================
-- 3. LENGTH CAPS — 200 chars per answer column
-- ============================================================
-- If any existing row is longer (shouldn't be — the client trims), shorten
-- it first or the ALTER fails.

alter table quiz_answers drop constraint if exists quiz_answers_answer_len;
alter table quiz_answers add constraint quiz_answers_answer_len
  check (char_length(answer) <= 200);

alter table photo_answers drop constraint if exists photo_answers_answer_len;
alter table photo_answers add constraint photo_answers_answer_len
  check (char_length(character_answer) <= 200 and char_length(game_answer) <= 200);

alter table anagram_answers drop constraint if exists anagram_answers_answer_len;
alter table anagram_answers add constraint anagram_answers_answer_len
  check (char_length(answer) <= 200);

alter table console_answers drop constraint if exists console_answers_answer_len;
alter table console_answers add constraint console_answers_answer_len
  check (char_length(answer) <= 200);

alter table brain_training_answers drop constraint if exists brain_training_answers_answer_len;
alter table brain_training_answers add constraint brain_training_answers_answer_len
  check (char_length(answer) <= 200);

alter table missing_vowels_answers drop constraint if exists missing_vowels_answers_answer_len;
alter table missing_vowels_answers add constraint missing_vowels_answers_answer_len
  check (char_length(answer) <= 200);

alter table team_clash_answers drop constraint if exists team_clash_answers_answer_len;
alter table team_clash_answers add constraint team_clash_answers_answer_len
  check (char_length(answer) <= 200);
