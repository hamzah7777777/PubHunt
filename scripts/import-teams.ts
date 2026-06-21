// One-time data import: parses src/pubhunt.txt and seeds the teams/participants
// tables in Supabase. Run with: npx tsx scripts/import-teams.ts
//
// Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars (service role,
// not the anon key, since this bypasses RLS to write directly).

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

interface ParsedRow {
  teamName: string;
  gameTheme: string;
  fullName: string;
  isInternal: boolean;
  role: 'captain' | 'participant';
}

function parseFile(filePath: string): ParsedRow[] {
  const raw = readFileSync(filePath, 'utf-8');
  const rows: ParsedRow[] = [];

  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    const cols = line.split('\t');
    if (cols.length < 7) continue;

    const [teamName, gameTheme, fullName, internalFlag, , role] = cols;
    rows.push({
      teamName: teamName.trim(),
      gameTheme: gameTheme.trim(),
      fullName: fullName.trim(),
      isInternal: internalFlag.trim().toLowerCase() === 'yes',
      role: role.trim().toLowerCase() === 'captain' ? 'captain' : 'participant',
    });
  }

  return rows;
}

function randomPin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

async function main() {
  const filePath = resolve(__dirname, '../src/pubhunt.txt');
  const rows = parseFile(filePath);

  // Several real teams share the literal placeholder name "TBC" (team name
  // not finalized yet) but have distinct themes, so group by name+theme and
  // disambiguate the stored name to keep each team unique.
  const teamsByKey = new Map<string, ParsedRow[]>();
  for (const row of rows) {
    const key = `${row.teamName}__${row.gameTheme}`;
    if (!teamsByKey.has(key)) teamsByKey.set(key, []);
    teamsByKey.get(key)!.push(row);
  }

  console.log(`Parsed ${rows.length} participant rows across ${teamsByKey.size} teams.`);

  const pinAssignments: { teamName: string; pin: string }[] = [];

  for (const members of teamsByKey.values()) {
    const rawTeamName = members[0].teamName;
    const gameTheme = members[0].gameTheme || 'TBC';
    const teamName = rawTeamName.toUpperCase() === 'TBC' ? `TBC (${gameTheme})` : rawTeamName;
    const status = rawTeamName.toUpperCase() === 'TBC' ? 'tbc' : 'confirmed';
    const pin = randomPin();

    const { data: team, error: teamError } = await supabase
      .from('teams')
      .upsert({ name: teamName, game_theme: gameTheme, status, pin }, { onConflict: 'name' })
      .select()
      .single();

    if (teamError || !team) {
      console.error(`Failed to upsert team "${teamName}":`, teamError?.message);
      continue;
    }

    pinAssignments.push({ teamName, pin });

    // Clear existing participants for this team before re-inserting, so the
    // script is safe to re-run.
    await supabase.from('participants').delete().eq('team_id', team.id);

    const participantRows = members.map((m, idx) => ({
      team_id: team.id,
      full_name: m.fullName,
      is_internal: m.isInternal,
      role: m.role,
      row_order: idx,
    }));

    const { error: participantsError } = await supabase.from('participants').insert(participantRows);
    if (participantsError) {
      console.error(`Failed to insert participants for "${teamName}":`, participantsError.message);
    } else {
      console.log(`Imported "${teamName}" — ${participantRows.length} members, PIN ${pin}`);
    }
  }

  console.log('\nDone. Team PINs (save this somewhere for captains):');
  console.table(pinAssignments);
}

main();
