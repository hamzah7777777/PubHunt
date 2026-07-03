-- PubHunt brain training challenge: per-team trivia answers + marking.
-- Run this in the Supabase SQL editor (after schema.sql).
--
-- Teams answer 8 video game knowledge questions (resubmitting overwrites
-- and clears any existing mark). Admins mark each answer: 1 point per
-- correct answer.

create table if not exists brain_training_answers (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  question_number int not null check (question_number between 1 and 8),
  answer text not null,
  -- null = not marked yet, true/false = marked by an admin
  is_correct boolean,
  submitted_at timestamptz not null default now(),
  unique (team_id, question_number)
);

create index if not exists brain_training_answers_team_id_idx on brain_training_answers(team_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
-- Same model as quiz_answers: no direct anon access; teams go through the
-- SECURITY DEFINER RPCs below and admins get full access.

alter table brain_training_answers enable row level security;

drop policy if exists "admins full access to brain_training_answers" on brain_training_answers;
create policy "admins full access to brain_training_answers"
  on brain_training_answers for all
  to authenticated
  using (true)
  with check (true);

-- ============================================================
-- TEAM RPCS
-- ============================================================
-- NOTE: like the rest of the app, these trust the team_id the client holds
-- after PIN login (stored in localStorage) rather than re-verifying the PIN.

drop function if exists submit_brain_training_answer(uuid, int, text);
create or replace function submit_brain_training_answer(
  p_team_id uuid,
  p_question int,
  p_answer text
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into brain_training_answers (team_id, question_number, answer)
  values (p_team_id, p_question, p_answer)
  on conflict (team_id, question_number)
  do update set
    answer = excluded.answer,
    is_correct = null,
    submitted_at = now();
$$;

grant execute on function submit_brain_training_answer(uuid, int, text) to anon;

drop function if exists get_team_brain_training_answers(uuid);
create or replace function get_team_brain_training_answers(p_team_id uuid)
returns table (
  question_number int,
  answer text,
  is_correct boolean
)
language sql
security definer
set search_path = public
as $$
  select question_number, answer, is_correct
  from brain_training_answers
  where team_id = p_team_id;
$$;

grant execute on function get_team_brain_training_answers(uuid) to anon;
