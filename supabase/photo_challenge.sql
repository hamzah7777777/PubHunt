-- PubHunt photo challenge: per-team photo answers + marking.
-- Run this in the Supabase SQL editor (after schema.sql).
--
-- Teams see 12 character photos and submit a character name and a game name
-- for each (resubmitting overwrites and clears any existing marks). Admins
-- mark each part separately: 1 point for the character, 1 for the game.

create table if not exists photo_answers (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  photo_number int not null check (photo_number between 1 and 12),
  -- capped so nobody can stuff megabytes into the marking dashboards
  character_answer text not null check (char_length(character_answer) <= 200),
  game_answer text not null check (char_length(game_answer) <= 200),
  -- null = not marked yet, true/false = marked by an admin
  character_correct boolean,
  game_correct boolean,
  submitted_at timestamptz not null default now(),
  unique (team_id, photo_number)
);

create index if not exists photo_answers_team_id_idx on photo_answers(team_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
-- Same model as quiz_answers: no direct anon access; teams go through the
-- SECURITY DEFINER RPCs below and admins (is_admin(), see schema.sql) get
-- full access.

alter table photo_answers enable row level security;

drop policy if exists "admins full access to photo_answers" on photo_answers;
create policy "admins full access to photo_answers"
  on photo_answers for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- ============================================================
-- TEAM RPCS
-- ============================================================
-- Every RPC verifies the caller's PIN via team_pin_ok() (schema.sql), so a
-- (publicly listable) team id alone grants nothing.

drop function if exists submit_photo_answer(uuid, int, text, text);
drop function if exists submit_photo_answer(uuid, int, text, text, text);
create or replace function submit_photo_answer(
  p_team_id uuid,
  p_photo int,
  p_character text,
  p_game text,
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
  photo_number int,
  character_answer text,
  game_answer text,
  character_correct boolean,
  game_correct boolean
)
language sql
security definer
set search_path = public
as $$
  select photo_number, character_answer, game_answer, character_correct, game_correct
  from photo_answers
  where team_id = p_team_id and team_pin_ok(p_team_id, p_pin);
$$;

grant execute on function get_team_photo_answers(uuid, text) to anon;
