// Syncs the teams/participants tables in Supabase from the two CSVs in data/:
//
//   data/pubhuntparticipant.csv      one row per team:        Captain, Team Name, Theme, Route
//   data/pubhuntparticipantfull.csv  one row per participant: Team Name, Theme, Name, Internal?, Role
//
// Run with: npm run import-teams
// Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars (service role,
// not the anon key, since this bypasses RLS to write directly).
//
// Safe to re-run:
//  - existing teams are matched by name first, then by theme, so a team that
//    was renamed in the CSV keeps its row — and teams NEVER get a new PIN
//    once created (only brand-new teams get one generated)
//  - a team marked withdrawn in the DB stays withdrawn
//  - participants are replaced wholesale from the roster CSV
//  - DB teams missing from the CSV are only reported; pass --prune to delete them

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
const prune = process.argv.includes('--prune');

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/** Minimal RFC-4180 CSV parser: quoted fields, escaped quotes, CRLF. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  const endField = () => {
    row.push(field);
    field = '';
  };
  const endRow = () => {
    endField();
    if (row.some(f => f.trim() !== '')) rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      endField();
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      endRow();
    } else {
      field += c;
    }
  }
  endRow();
  return rows;
}

function readCsv(relPath: string): string[][] {
  const raw = readFileSync(resolve(__dirname, relPath), 'utf-8').replace(/^\uFEFF/, '');
  return parseCsv(raw).slice(1); // drop the header row
}

/** Normalize for matching: trim, lowercase, collapse whitespace. */
function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

function randomPin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

interface CsvTeam {
  captain: string;
  name: string;
  theme: string;
  route: 'A' | 'B';
}

interface RosterMember {
  fullName: string;
  isInternal: boolean;
  role: 'captain' | 'participant';
}

interface RosterGroup {
  theme: string;
  captain: string | null;
  members: RosterMember[];
}

// ---------------------------------------------------------------------------
// Load the CSVs
// ---------------------------------------------------------------------------

const teamRows = readCsv('../data/pubhuntparticipant.csv');
const rosterRows = readCsv('../data/pubhuntparticipantfull.csv');

const csvTeams: CsvTeam[] = teamRows.map(cols => {
  const [captain, name, theme, route] = cols.map(c => (c ?? '').trim());
  const r = route.toUpperCase();
  if (r !== 'A' && r !== 'B') {
    console.error(`Team "${name}" (captain ${captain}) has invalid route "${route}" — expected A or B.`);
    process.exit(1);
  }
  return { captain, name, theme, route: r };
});

// Group roster rows by theme — themes are unique per team in this data, and
// unlike team names they survive both the "TBC" placeholders and the couple
// of team-name typos between the two files.
const rosterByTheme = new Map<string, RosterGroup>();
for (const cols of rosterRows) {
  const [, theme, fullName, internal, role] = cols.map(c => (c ?? '').trim());
  if (!fullName) continue;
  const key = norm(theme);
  let group = rosterByTheme.get(key);
  if (!group) {
    group = { theme, captain: null, members: [] };
    rosterByTheme.set(key, group);
  }
  const member: RosterMember = {
    fullName,
    isInternal: internal.toLowerCase() === 'yes',
    role: role.toLowerCase() === 'captain' ? 'captain' : 'participant',
  };
  if (member.role === 'captain' && !group.captain) group.captain = fullName;
  group.members.push(member);
}

const rosterByCaptain = new Map<string, RosterGroup>();
for (const group of rosterByTheme.values()) {
  if (group.captain) rosterByCaptain.set(norm(group.captain), group);
}

// Covers manifest — used to pick, when the two CSVs disagree on a theme's
// spelling, the variant the login screen actually has a cover image for.
const manifest = JSON.parse(
  readFileSync(resolve(__dirname, '../public/covers/manifest.json'), 'utf-8'),
) as { theme: string }[];
const coveredThemes = new Set(manifest.map(entry => norm(entry.theme)));

// ---------------------------------------------------------------------------
// Sync
// ---------------------------------------------------------------------------

async function main() {
  const { data: existingTeams, error: fetchError } = await supabase
    .from('teams')
    .select('id, name, game_theme, pin, status');
  if (fetchError || !existingTeams) {
    console.error('Failed to fetch existing teams:', fetchError?.message);
    process.exit(1);
  }

  const existingByName = new Map(existingTeams.map(t => [norm(t.name), t]));
  const existingByTheme = new Map<string, (typeof existingTeams)[number][]>();
  for (const t of existingTeams) {
    const key = norm(t.game_theme);
    existingByTheme.set(key, [...(existingByTheme.get(key) ?? []), t]);
  }

  const created: { team: string; route: string; pin: string }[] = [];
  const missingCovers = new Set<string>();
  const missingRosters: string[] = [];
  const matchedExistingIds = new Set<string>();
  let updated = 0;

  console.log(`Syncing ${csvTeams.length} teams (${rosterRows.length} participant rows)...\n`);

  for (const csvTeam of csvTeams) {
    // Roster: match by captain first (survives theme typos), then by theme.
    const roster =
      rosterByCaptain.get(norm(csvTeam.captain)) ?? rosterByTheme.get(norm(csvTeam.theme)) ?? null;
    if (!roster) missingRosters.push(`${csvTeam.name} (captain ${csvTeam.captain})`);

    // Theme: prefer the spelling that has a cover image.
    const themeCandidates = [roster?.theme, csvTeam.theme].filter((t): t is string => !!t);
    const gameTheme = themeCandidates.find(t => coveredThemes.has(norm(t))) ?? themeCandidates[0];
    if (!coveredThemes.has(norm(gameTheme))) missingCovers.add(gameTheme);

    // Several teams still use the literal placeholder name "TBC"; disambiguate
    // with the theme (name is unique in the DB) and track it via status.
    const isTbc = csvTeam.name.toUpperCase() === 'TBC';
    const teamName = isTbc ? `TBC (${gameTheme})` : csvTeam.name;

    // Existing team: by name first, then by theme (catches renamed teams).
    const themeMatches = (existingByTheme.get(norm(gameTheme)) ?? []).filter(
      t => !matchedExistingIds.has(t.id),
    );
    const existing = existingByName.get(norm(teamName)) ?? (themeMatches.length === 1 ? themeMatches[0] : undefined);

    let teamId: string;
    if (existing) {
      matchedExistingIds.add(existing.id);
      const status =
        existing.status === 'withdrawn' ? 'withdrawn' : isTbc ? 'tbc' : 'confirmed';
      const { error } = await supabase
        .from('teams')
        .update({ name: teamName, game_theme: gameTheme, status, route: csvTeam.route })
        .eq('id', existing.id);
      if (error) {
        console.error(`Failed to update "${teamName}":`, error.message);
        continue;
      }
      teamId = existing.id;
      updated++;
      if (norm(existing.name) !== norm(teamName)) {
        console.log(`Renamed "${existing.name}" -> "${teamName}" (PIN kept: ${existing.pin})`);
      }
    } else {
      const pin = randomPin();
      const { data, error } = await supabase
        .from('teams')
        .insert({
          name: teamName,
          game_theme: gameTheme,
          status: isTbc ? 'tbc' : 'confirmed',
          route: csvTeam.route,
          pin,
        })
        .select()
        .single();
      if (error || !data) {
        console.error(`Failed to create "${teamName}":`, error?.message);
        continue;
      }
      teamId = data.id;
      created.push({ team: teamName, route: csvTeam.route, pin });
    }

    // Replace the roster wholesale so the CSV is the source of truth.
    if (roster) {
      await supabase.from('participants').delete().eq('team_id', teamId);
      const participantRows = roster.members.map((m, idx) => ({
        team_id: teamId,
        full_name: m.fullName,
        is_internal: m.isInternal,
        role: m.role,
        row_order: idx,
      }));
      const { error } = await supabase.from('participants').insert(participantRows);
      if (error) console.error(`Failed to insert participants for "${teamName}":`, error.message);
    }
  }

  // ------------------------------------------------------------------------
  // Report
  // ------------------------------------------------------------------------

  console.log(`\nUpdated ${updated} existing teams, created ${created.length} new teams.`);

  if (created.length) {
    console.log('\nNew team PINs (share these with the captains):');
    console.table(created);
  }

  if (missingRosters.length) {
    console.log('\nTeams with no roster found in the participants CSV (imported with no members):');
    for (const t of missingRosters) console.log(`  - ${t}`);
  }

  if (missingCovers.size) {
    console.log('\nThemes with no cover image (login grid shows the fallback):');
    for (const t of missingCovers) console.log(`  - ${t}`);
  }

  const leftovers = existingTeams.filter(t => !matchedExistingIds.has(t.id));
  if (leftovers.length) {
    if (prune) {
      for (const t of leftovers) {
        const { error } = await supabase.from('teams').delete().eq('id', t.id);
        console.log(error ? `Failed to delete "${t.name}": ${error.message}` : `Deleted "${t.name}"`);
      }
    } else {
      console.log('\nDB teams not present in the CSV (re-run with --prune to delete them):');
      for (const t of leftovers) console.log(`  - ${t.name} (${t.game_theme})`);
    }
  }

  console.log('\nDone.');
}

main();
