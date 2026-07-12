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
  -- capped so nobody can stuff megabytes into the marking dashboards
  answer text not null check (char_length(answer) <= 200),
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
-- SECURITY DEFINER RPCs below and admins (is_admin(), see schema.sql) get
-- full access.

alter table console_answers enable row level security;

drop policy if exists "admins full access to console_answers" on console_answers;
create policy "admins full access to console_answers"
  on console_answers for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- ============================================================
-- TEAM RPCS
-- ============================================================
-- Every RPC verifies the caller's PIN via team_pin_ok() (schema.sql), so a
-- (publicly listable) team id alone grants nothing.

drop function if exists submit_console_answer(uuid, int, text);
drop function if exists submit_console_answer(uuid, int, text, text);
create or replace function submit_console_answer(
  p_team_id uuid,
  p_console int,
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
  insert into console_answers (team_id, console_number, answer)
  values (p_team_id, p_console, p_answer)
  on conflict (team_id, console_number)
  do update set
    answer = excluded.answer,
    is_correct = null,
    submitted_at = now();
end;
$$;

grant execute on function submit_console_answer(uuid, int, text, text) to anon;

drop function if exists get_team_console_answers(uuid);
drop function if exists get_team_console_answers(uuid, text);
create or replace function get_team_console_answers(p_team_id uuid, p_pin text)
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
  where team_id = p_team_id and team_pin_ok(p_team_id, p_pin);
$$;

grant execute on function get_team_console_answers(uuid, text) to anon;
