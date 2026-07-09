-- PubHunt live marking: broadcast answer-table changes so several hosts can
-- mark at once without stepping on each other. Run this once in the Supabase
-- SQL editor. The dashboard subscribes to these tables and applies every
-- insert/update as it happens; RLS still applies, so only authenticated
-- admins receive the events.

alter publication supabase_realtime add table quiz_answers;
alter publication supabase_realtime add table photo_answers;
alter publication supabase_realtime add table anagram_answers;
alter publication supabase_realtime add table console_answers;
alter publication supabase_realtime add table brain_training_answers;
alter publication supabase_realtime add table missing_vowels_answers;
alter publication supabase_realtime add table team_clash_answers;
