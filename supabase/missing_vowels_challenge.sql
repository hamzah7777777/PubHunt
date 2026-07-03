-- PubHunt missing vowels challenge: per-team answers + marking.
-- Run this in the Supabase SQL editor (after schema.sql).
--
-- Teams see 8 puzzles: two video game names mashed together with the vowels
-- removed. They name both games (resubmitting overwrites and clears any
-- existing mark). Admins mark each answer: 1 point per correct puzzle.

create table if not exists missing_vowels_answers (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  puzzle_number int not null check (puzzle_number between 1 and 8),
  answer text not null,
  -- null = not marked yet, true/false = marked by an admin
  is_correct boolean,
  submitted_at timestamptz not null default now(),
  unique (team_id, puzzle_number)
);

create index if not exists missing_vowels_answers_team_id_idx on missing_vowels_answers(team_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
-- Same model as quiz_answers: no direct anon access; teams go through the
-- SECURITY DEFINER RPCs below and admins get full access.

alter table missing_vowels_answers enable row level security;

drop policy if exists "admins full access to missing_vowels_answers" on missing_vowels_answers;
create policy "admins full access to missing_vowels_answers"
  on missing_vowels_answers for all
  to authenticated
  using (true)
  with check (true);

-- ============================================================
-- TEAM RPCS
-- ============================================================
-- NOTE: like the rest of the app, these trust the team_id the client holds
-- after PIN login (stored in localStorage) rather than re-verifying the PIN.

drop function if exists submit_missing_vowels_answer(uuid, int, text);
create or replace function submit_missing_vowels_answer(
  p_team_id uuid,
  p_puzzle int,
  p_answer text
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into missing_vowels_answers (team_id, puzzle_number, answer)
  values (p_team_id, p_puzzle, p_answer)
  on conflict (team_id, puzzle_number)
  do update set
    answer = excluded.answer,
    is_correct = null,
    submitted_at = now();
$$;

grant execute on function submit_missing_vowels_answer(uuid, int, text) to anon;

drop function if exists get_team_missing_vowels_answers(uuid);
create or replace function get_team_missing_vowels_answers(p_team_id uuid)
returns table (
  puzzle_number int,
  answer text,
  is_correct boolean
)
language sql
security definer
set search_path = public
as $$
  select puzzle_number, answer, is_correct
  from missing_vowels_answers
  where team_id = p_team_id;
$$;

grant execute on function get_team_missing_vowels_answers(uuid) to anon;
