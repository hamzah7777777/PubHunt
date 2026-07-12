-- PubHunt quiz: per-team quiz answers + marking.
-- Run this in the Supabase SQL editor (after schema.sql).
--
-- Each route has 5 quizzes with 3 questions each. Teams submit one answer
-- per question (resubmitting overwrites and clears any existing mark).
-- Admins read everything directly and mark answers via is_correct.

create table if not exists quiz_answers (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  quiz_number int not null check (quiz_number between 1 and 5),
  question_number int not null check (question_number between 1 and 3),
  -- capped so nobody can stuff megabytes into the marking dashboards
  answer text not null check (char_length(answer) <= 200),
  -- null = not marked yet, true/false = marked by an admin
  is_correct boolean,
  submitted_at timestamptz not null default now(),
  unique (team_id, quiz_number, question_number)
);

create index if not exists quiz_answers_team_id_idx on quiz_answers(team_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
-- Same model as teams/participants: no direct anon access (teams could
-- otherwise read or overwrite each other's answers wholesale). Teams go
-- through the SECURITY DEFINER RPCs below; admins (is_admin(), see
-- schema.sql) get full access.

alter table quiz_answers enable row level security;

drop policy if exists "admins full access to quiz_answers" on quiz_answers;
create policy "admins full access to quiz_answers"
  on quiz_answers for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- ============================================================
-- TEAM RPCS
-- ============================================================
-- Every RPC verifies the caller's PIN via team_pin_ok() (schema.sql), so a
-- (publicly listable) team id alone grants nothing.

drop function if exists submit_quiz_answer(uuid, int, int, text);
drop function if exists submit_quiz_answer(uuid, int, int, text, text);
create or replace function submit_quiz_answer(
  p_team_id uuid,
  p_quiz int,
  p_question int,
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
  insert into quiz_answers (team_id, quiz_number, question_number, answer)
  values (p_team_id, p_quiz, p_question, p_answer)
  on conflict (team_id, quiz_number, question_number)
  do update set
    answer = excluded.answer,
    is_correct = null,
    submitted_at = now();
end;
$$;

grant execute on function submit_quiz_answer(uuid, int, int, text, text) to anon;

drop function if exists get_team_quiz_answers(uuid);
drop function if exists get_team_quiz_answers(uuid, text);
create or replace function get_team_quiz_answers(p_team_id uuid, p_pin text)
returns table (
  quiz_number int,
  question_number int,
  answer text,
  is_correct boolean
)
language sql
security definer
set search_path = public
as $$
  select quiz_number, question_number, answer, is_correct
  from quiz_answers
  where team_id = p_team_id and team_pin_ok(p_team_id, p_pin);
$$;

grant execute on function get_team_quiz_answers(uuid, text) to anon;
