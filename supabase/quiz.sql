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
  answer text not null,
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
-- through the SECURITY DEFINER RPCs below; admins get full access.

alter table quiz_answers enable row level security;

drop policy if exists "admins full access to quiz_answers" on quiz_answers;
create policy "admins full access to quiz_answers"
  on quiz_answers for all
  to authenticated
  using (true)
  with check (true);

-- ============================================================
-- TEAM RPCS
-- ============================================================
-- NOTE: like the rest of the app, these trust the team_id the client holds
-- after PIN login (stored in localStorage) rather than re-verifying the PIN.

drop function if exists submit_quiz_answer(uuid, int, int, text);
create or replace function submit_quiz_answer(
  p_team_id uuid,
  p_quiz int,
  p_question int,
  p_answer text
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into quiz_answers (team_id, quiz_number, question_number, answer)
  values (p_team_id, p_quiz, p_question, p_answer)
  on conflict (team_id, quiz_number, question_number)
  do update set
    answer = excluded.answer,
    is_correct = null,
    submitted_at = now();
$$;

grant execute on function submit_quiz_answer(uuid, int, int, text) to anon;

drop function if exists get_team_quiz_answers(uuid);
create or replace function get_team_quiz_answers(p_team_id uuid)
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
  where team_id = p_team_id;
$$;

grant execute on function get_team_quiz_answers(uuid) to anon;
