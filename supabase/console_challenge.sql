-- PubHunt console challenge: per-team console answers + marking.
-- Run this in the Supabase SQL editor (after schema.sql).
--
-- Teams see 6 video game console photos and submit the console name for each
-- (resubmitting overwrites and clears any existing mark). Admins mark each
-- answer: 1 point per correct console.

create table if not exists console_answers (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  console_number int not null check (console_number between 1 and 6),
  answer text not null,
  -- null = not marked yet, true/false = marked by an admin
  is_correct boolean,
  submitted_at timestamptz not null default now(),
  unique (team_id, console_number)
);

create index if not exists console_answers_team_id_idx on console_answers(team_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
-- Same model as quiz_answers: no direct anon access; teams go through the
-- SECURITY DEFINER RPCs below and admins get full access.

alter table console_answers enable row level security;

drop policy if exists "admins full access to console_answers" on console_answers;
create policy "admins full access to console_answers"
  on console_answers for all
  to authenticated
  using (true)
  with check (true);

-- ============================================================
-- TEAM RPCS
-- ============================================================
-- NOTE: like the rest of the app, these trust the team_id the client holds
-- after PIN login (stored in localStorage) rather than re-verifying the PIN.

drop function if exists submit_console_answer(uuid, int, text);
create or replace function submit_console_answer(
  p_team_id uuid,
  p_console int,
  p_answer text
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into console_answers (team_id, console_number, answer)
  values (p_team_id, p_console, p_answer)
  on conflict (team_id, console_number)
  do update set
    answer = excluded.answer,
    is_correct = null,
    submitted_at = now();
$$;

grant execute on function submit_console_answer(uuid, int, text) to anon;

drop function if exists get_team_console_answers(uuid);
create or replace function get_team_console_answers(p_team_id uuid)
returns table (
  console_number int,
  answer text,
  is_correct boolean
)
language sql
security definer
set search_path = public
as $$
  select console_number, answer, is_correct
  from console_answers
  where team_id = p_team_id;
$$;

grant execute on function get_team_console_answers(uuid) to anon;
