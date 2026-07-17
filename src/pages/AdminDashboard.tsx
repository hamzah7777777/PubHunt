import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { ClipboardCheck, Download, ImagePlus, LogOut, Plus, QrCode, Search, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { fileToCoverBlob, getCoverMap, resolveCover } from '../lib/covers';
import AdminMarkingPage from './AdminMarkingPage';
import AdminQrCodes from './AdminQrCodes';
import {
  SECTION_KEYS,
  SECTION_LABELS,
  SECTION_MAX,
  SECTION_SHORT_LABELS,
  computeTeamScores,
  withRanks,
  type AnswerSets,
  type SectionKey,
} from './adminScoring';
import type {
  AdminParticipant,
  AdminTeam,
  AnagramAnswer,
  BrainTrainingAnswer,
  ConsoleAnswer,
  FacebookMark,
  MissingVowelsAnswer,
  PhotoAnswer,
  QuizAnswer,
  TeamClashAnswer,
} from '../types';
import './AdminDashboard.css';

interface Props {
  onLogout: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Confirmed',
  tbc: 'TBC',
  withdrawn: 'Withdrawn',
};

function randomPin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const quote = (f: string) => (/[",\n\r]/.test(f) ? `"${f.replace(/"/g, '""')}"` : f);
  const csv = rows.map(row => row.map(f => quote(String(f))).join(',')).join('\r\n');
  // BOM so Excel opens it as UTF-8.
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function LeaderboardList({ rows }: { rows: { rank: number; name: string; points: number }[] }) {
  if (rows.length === 0) {
    return <p className="admin-empty-roster">No points scored yet.</p>;
  }
  const max = Math.max(...rows.map(r => r.points));
  return (
    <ol className="admin-lb-list">
      {rows.map(r => (
        <li key={r.name} className="admin-lb-row">
          <span className={`admin-lb-rank ${r.rank <= 3 ? `admin-lb-rank-${r.rank}` : ''}`}>
            {r.rank}
          </span>
          <span className="admin-lb-main">
            <span className="admin-lb-name">{r.name}</span>
            <span className="admin-lb-bar-track">
              <span
                className={`admin-lb-bar ${r.rank <= 3 ? `admin-lb-bar-${r.rank}` : ''}`}
                style={{ width: `${max > 0 ? Math.max(4, (r.points / max) * 100) : 0}%` }}
              />
            </span>
          </span>
          <span className="admin-lb-points">
            {r.points} pt{r.points === 1 ? '' : 's'}
          </span>
        </li>
      ))}
    </ol>
  );
}

export default function AdminDashboard({ onLogout }: Props) {
  const [teams, setTeams] = useState<AdminTeam[]>([]);
  const [participants, setParticipants] = useState<AdminParticipant[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswer[]>([]);
  const [photoAnswers, setPhotoAnswers] = useState<PhotoAnswer[]>([]);
  const [anagramAnswers, setAnagramAnswers] = useState<AnagramAnswer[]>([]);
  const [consoleAnswers, setConsoleAnswers] = useState<ConsoleAnswer[]>([]);
  const [brainAnswers, setBrainAnswers] = useState<BrainTrainingAnswer[]>([]);
  const [vowelsAnswers, setVowelsAnswers] = useState<MissingVowelsAnswer[]>([]);
  const [clashAnswers, setClashAnswers] = useState<TeamClashAnswer[]>([]);
  const [facebookMarks, setFacebookMarks] = useState<FacebookMark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [coverMap, setCoverMap] = useState<Map<string, string>>(new Map());
  const [coverBusy, setCoverBusy] = useState(false);
  const coverFileRef = useRef<HTMLInputElement>(null);
  // All the marking lives on its own page; the dashboard has the rest.
  const [page, setPage] = useState<'dashboard' | 'marking'>('dashboard');
  const [section, setSection] = useState<'teams' | 'scores' | 'leaderboard' | 'qr'>('teams');
  const [teamQuery, setTeamQuery] = useState('');

  useEffect(() => {
    (async () => {
      const [teamsRes, participantsRes, quizRes, photoRes, anagramRes, consoleRes, brainRes, vowelsRes, clashRes, facebookRes] =
        await Promise.all([
          supabase.from('teams').select('*').order('name'),
          supabase.from('participants').select('*').order('row_order'),
          supabase.from('quiz_answers').select('*').order('quiz_number').order('question_number'),
          supabase.from('photo_answers').select('*').order('photo_number'),
          supabase.from('anagram_answers').select('*').order('anagram_number'),
          supabase.from('console_answers').select('*').order('console_number'),
          supabase.from('brain_training_answers').select('*').order('question_number'),
          supabase.from('missing_vowels_answers').select('*').order('puzzle_number'),
          supabase.from('team_clash_answers').select('*').order('submitted_at'),
          supabase.from('facebook_marks').select('*'),
        ]);
      // Theme-based fallback covers, so the modal can preview what a team
      // without a custom cover currently shows.
      getCoverMap().then(setCoverMap);

      if (
        teamsRes.error ||
        participantsRes.error ||
        quizRes.error ||
        photoRes.error ||
        anagramRes.error ||
        consoleRes.error ||
        brainRes.error ||
        vowelsRes.error ||
        clashRes.error
      ) {
        setError(
          teamsRes.error?.message ||
            participantsRes.error?.message ||
            quizRes.error?.message ||
            photoRes.error?.message ||
            anagramRes.error?.message ||
            consoleRes.error?.message ||
            brainRes.error?.message ||
            vowelsRes.error?.message ||
            clashRes.error?.message ||
            'Failed to load data'
        );
      } else {
        setTeams((teamsRes.data as AdminTeam[]) || []);
        setParticipants((participantsRes.data as AdminParticipant[]) || []);
        setQuizAnswers((quizRes.data as QuizAnswer[]) || []);
        setPhotoAnswers((photoRes.data as PhotoAnswer[]) || []);
        setAnagramAnswers((anagramRes.data as AnagramAnswer[]) || []);
        setConsoleAnswers((consoleRes.data as ConsoleAnswer[]) || []);
        setBrainAnswers((brainRes.data as BrainTrainingAnswer[]) || []);
        setVowelsAnswers((vowelsRes.data as MissingVowelsAnswer[]) || []);
        setClashAnswers((clashRes.data as TeamClashAnswer[]) || []);
        // Tolerated separately: errors (e.g. facebook_challenge.sql not run
        // yet) just leave the Facebook tab unmarked instead of blocking the
        // whole dashboard.
        setFacebookMarks(facebookRes.error ? [] : ((facebookRes.data as FacebookMark[]) || []));
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!editingTeamId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEditingTeamId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editingTeamId]);

  // Live sync: several hosts mark at once, so answer-table changes (marks
  // from co-hosts and fresh team submissions) are pushed to every open
  // dashboard. With "Unmarked only" on, a question a co-host just marked
  // drops off your list before you can double-mark it. Needs the tables in
  // the supabase_realtime publication — see supabase/realtime.sql.
  useEffect(() => {
    function apply<T extends { id: string }>(
      set: Dispatch<SetStateAction<T[]>>,
      sort: (a: T, b: T) => number
    ) {
      return (payload: { eventType: string; new: unknown; old: unknown }) => {
        set(prev => {
          if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as { id?: string }).id;
            return prev.filter(r => r.id !== oldId);
          }
          const row = payload.new as T;
          return [...prev.filter(r => r.id !== row.id), row].sort(sort);
        });
      };
    }
    const byNumber =
      <T,>(...keys: (keyof T)[]) =>
      (a: T, b: T) => {
        for (const k of keys) {
          const diff = (a[k] as number) - (b[k] as number);
          if (diff !== 0) return diff;
        }
        return 0;
      };
    const bySubmitted = (a: { submitted_at: string }, b: { submitted_at: string }) =>
      a.submitted_at < b.submitted_at ? -1 : a.submitted_at > b.submitted_at ? 1 : 0;

    const channel = supabase
      .channel('admin-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quiz_answers' },
        apply(setQuizAnswers, byNumber('quiz_number', 'question_number')))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'photo_answers' },
        apply(setPhotoAnswers, byNumber('photo_number')))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'anagram_answers' },
        apply(setAnagramAnswers, byNumber('anagram_number')))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'console_answers' },
        apply(setConsoleAnswers, byNumber('console_number')))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'brain_training_answers' },
        apply(setBrainAnswers, byNumber('question_number')))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'missing_vowels_answers' },
        apply(setVowelsAnswers, byNumber('puzzle_number')))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_clash_answers' },
        apply(setClashAnswers, bySubmitted))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'facebook_marks' }, payload => {
        // Deduped by team_id (one row per team), not id, so a co-host's
        // insert can't sit alongside our own copy of the same team's row.
        setFacebookMarks(prev => {
          if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as { id?: string }).id;
            return prev.filter(m => m.id !== oldId);
          }
          const row = payload.new as FacebookMark;
          return [...prev.filter(m => m.team_id !== row.team_id), row];
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  const updateTeamField = (teamId: string, field: keyof AdminTeam, value: string | null) => {
    setTeams(prev => prev.map(t => (t.id === teamId ? { ...t, [field]: value } : t)));
  };

  // One cover object per team ({id}.webp, or {id}.jpg on browsers that
  // can't encode webp), upserted in the public 'game-covers' bucket. The
  // stored URL gets a ?v= stamp so replacing the file busts caches.
  const uploadCover = async (team: AdminTeam, file: File) => {
    setCoverBusy(true);
    setError('');
    try {
      const { blob, ext } = await fileToCoverBlob(file);
      const path = `${team.id}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('game-covers')
        .upload(path, blob, { upsert: true, contentType: blob.type });
      if (uploadError) throw new Error(`${uploadError.message}. Has team_covers.sql been run?`);
      // If the encoding flipped webp<->jpg, tidy up the other variant.
      await supabase.storage.from('game-covers').remove([`${team.id}.${ext === 'webp' ? 'jpg' : 'webp'}`]);
      const { publicUrl } = supabase.storage.from('game-covers').getPublicUrl(path).data;
      const coverUrl = `${publicUrl}?v=${Date.now()}`;
      const { error: saveError } = await supabase
        .from('teams')
        .update({ cover_url: coverUrl })
        .eq('id', team.id);
      if (saveError) throw new Error(saveError.message);
      updateTeamField(team.id, 'cover_url', coverUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not upload the cover.');
    }
    setCoverBusy(false);
  };

  const removeCover = async (team: AdminTeam) => {
    setCoverBusy(true);
    setError('');
    const { error: saveError } = await supabase
      .from('teams')
      .update({ cover_url: null })
      .eq('id', team.id);
    if (saveError) {
      setError(saveError.message);
    } else {
      await supabase.storage.from('game-covers').remove([`${team.id}.webp`, `${team.id}.jpg`]);
      updateTeamField(team.id, 'cover_url', null);
    }
    setCoverBusy(false);
  };

  const saveTeam = async (team: AdminTeam) => {
    const { error: saveError } = await supabase
      .from('teams')
      .update({ name: team.name, game_theme: team.game_theme, status: team.status, route: team.route, pin: team.pin })
      .eq('id', team.id);
    if (saveError) setError(saveError.message);
  };

  const deleteTeam = async (teamId: string) => {
    if (!confirm('Delete this team and all its participants?')) return;
    const { error: deleteError } = await supabase.from('teams').delete().eq('id', teamId);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setEditingTeamId(null);
    setTeams(prev => prev.filter(t => t.id !== teamId));
    setParticipants(prev => prev.filter(p => p.team_id !== teamId));
  };

  const exportTeamsCsv = () => {
    downloadCsv('pubhunt-teams.csv', [
      ['Team Name', 'Theme', 'Captain', 'Route', 'PIN'],
      ...teams.map(team => {
        const captain = participants.find(p => p.team_id === team.id && p.role === 'captain');
        return [team.name, team.game_theme, captain?.full_name ?? '', team.route, team.pin];
      }),
    ]);
  };

  const addTeam = async () => {
    const name = prompt('New team name?');
    if (!name) return;
    const { data, error: insertError } = await supabase
      .from('teams')
      .insert({ name, game_theme: 'TBC', status: 'tbc', route: 'A', pin: randomPin() })
      .select()
      .single();
    if (insertError || !data) {
      setError(insertError?.message || 'Failed to add team');
      return;
    }
    setTeams(prev => [...prev, data as AdminTeam].sort((a, b) => a.name.localeCompare(b.name)));
    setEditingTeamId((data as AdminTeam).id);
  };

  const updateParticipantField = (
    id: string,
    field: keyof AdminParticipant,
    value: string | boolean
  ) => {
    setParticipants(prev => prev.map(p => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const saveParticipant = async (p: AdminParticipant) => {
    const { error: saveError } = await supabase
      .from('participants')
      .update({ full_name: p.full_name, is_internal: p.is_internal, role: p.role })
      .eq('id', p.id);
    if (saveError) setError(saveError.message);
  };

  const deleteParticipant = async (id: string) => {
    const { error: deleteError } = await supabase.from('participants').delete().eq('id', id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setParticipants(prev => prev.filter(p => p.id !== id));
  };

  const addParticipant = async (teamId: string) => {
    const fullName = prompt('New member name?');
    if (!fullName) return;
    const rowOrder = participants.filter(p => p.team_id === teamId).length;
    const { data, error: insertError } = await supabase
      .from('participants')
      .insert({ team_id: teamId, full_name: fullName, is_internal: true, role: 'participant', row_order: rowOrder })
      .select()
      .single();
    if (insertError || !data) {
      setError(insertError?.message || 'Failed to add member');
      return;
    }
    setParticipants(prev => [...prev, data as AdminParticipant]);
  };

  // Facebook uploads are marked per team (yes/no per item); rows are
  // created lazily on first mark. Clicking the active mark clears it.
  const markFacebook = async (
    teamId: string,
    field: 'team_photo' | 'selection_video' | 'scene_video',
    value: boolean
  ) => {
    const existing = facebookMarks.find(m => m.team_id === teamId);
    const next = existing?.[field] === value ? null : value;
    const { data, error: markError } = await supabase
      .from('facebook_marks')
      .upsert({ team_id: teamId, [field]: next }, { onConflict: 'team_id' })
      .select()
      .single();
    if (markError || !data) {
      setError(markError?.message || 'Failed to save the Facebook mark. Has facebook_challenge.sql been run?');
      return;
    }
    setFacebookMarks(prev => [...prev.filter(m => m.team_id !== teamId), data as FacebookMark]);
  };

  // Clicking the already-active mark clears it back to unmarked.
  const markAnswer = async (answer: QuizAnswer, value: boolean) => {
    const next = answer.is_correct === value ? null : value;
    setQuizAnswers(prev => prev.map(a => (a.id === answer.id ? { ...a, is_correct: next } : a)));
    const { error: markError } = await supabase
      .from('quiz_answers')
      .update({ is_correct: next })
      .eq('id', answer.id);
    if (markError) setError(markError.message);
  };

  // Character and game are marked independently (1 point each); clicking the
  // already-active mark clears it back to unmarked.
  const markPhotoAnswer = async (
    answer: PhotoAnswer,
    field: 'character_correct' | 'game_correct',
    value: boolean
  ) => {
    const next = answer[field] === value ? null : value;
    setPhotoAnswers(prev => prev.map(a => (a.id === answer.id ? { ...a, [field]: next } : a)));
    const { error: markError } = await supabase
      .from('photo_answers')
      .update({ [field]: next })
      .eq('id', answer.id);
    if (markError) setError(markError.message);
  };

  // Clicking the already-active mark clears it back to unmarked.
  const markVowelsAnswer = async (answer: MissingVowelsAnswer, value: boolean) => {
    const next = answer.is_correct === value ? null : value;
    setVowelsAnswers(prev => prev.map(a => (a.id === answer.id ? { ...a, is_correct: next } : a)));
    const { error: markError } = await supabase
      .from('missing_vowels_answers')
      .update({ is_correct: next })
      .eq('id', answer.id);
    if (markError) setError(markError.message);
  };

  // Clicking the already-active mark clears it back to unmarked.
  const markBrainAnswer = async (answer: BrainTrainingAnswer, value: boolean) => {
    const next = answer.is_correct === value ? null : value;
    setBrainAnswers(prev => prev.map(a => (a.id === answer.id ? { ...a, is_correct: next } : a)));
    const { error: markError } = await supabase
      .from('brain_training_answers')
      .update({ is_correct: next })
      .eq('id', answer.id);
    if (markError) setError(markError.message);
  };

  // Clicking the already-active mark clears it back to unmarked.
  const markConsoleAnswer = async (answer: ConsoleAnswer, value: boolean) => {
    const next = answer.is_correct === value ? null : value;
    setConsoleAnswers(prev => prev.map(a => (a.id === answer.id ? { ...a, is_correct: next } : a)));
    const { error: markError } = await supabase
      .from('console_answers')
      .update({ is_correct: next })
      .eq('id', answer.id);
    if (markError) setError(markError.message);
  };

  // Clicking the already-active mark clears it back to unmarked.
  const markClashAnswer = async (answer: TeamClashAnswer, value: boolean) => {
    const next = answer.is_correct === value ? null : value;
    setClashAnswers(prev => prev.map(a => (a.id === answer.id ? { ...a, is_correct: next } : a)));
    const { error: markError } = await supabase
      .from('team_clash_answers')
      .update({ is_correct: next })
      .eq('id', answer.id);
    if (markError) setError(markError.message);
  };

  // Clicking the already-active mark clears it back to unmarked.
  const markAnagramAnswer = async (answer: AnagramAnswer, value: boolean) => {
    const next = answer.is_correct === value ? null : value;
    setAnagramAnswers(prev => prev.map(a => (a.id === answer.id ? { ...a, is_correct: next } : a)));
    const { error: markError } = await supabase
      .from('anagram_answers')
      .update({ is_correct: next })
      .eq('id', answer.id);
    if (markError) setError(markError.message);
  };

  if (loading) {
    return <div className="admin-dashboard admin-loading">Loading…</div>;
  }

  const editingTeam = teams.find(t => t.id === editingTeamId) ?? null;
  const editingParticipants = editingTeam
    ? participants.filter(p => p.team_id === editingTeam.id)
    : [];

  const answerSets: AnswerSets = {
    clash: clashAnswers,
    quiz: quizAnswers,
    photos: photoAnswers,
    anagrams: anagramAnswers,
    consoles: consoleAnswers,
    brain: brainAnswers,
    vowels: vowelsAnswers,
  };

  const unmarkedCount =
    clashAnswers.filter(a => a.is_correct === null).length +
    quizAnswers.filter(a => a.is_correct === null).length +
    photoAnswers.filter(a => a.character_correct === null).length +
    photoAnswers.filter(a => a.game_correct === null).length +
    anagramAnswers.filter(a => a.is_correct === null).length +
    consoleAnswers.filter(a => a.is_correct === null).length +
    brainAnswers.filter(a => a.is_correct === null).length +
    vowelsAnswers.filter(a => a.is_correct === null).length;

  // Everything below only counts answers marked correct, so scores climb
  // as marking progresses.
  const scoreRows = withRanks(
    teams
      .map(team => ({ team, scores: computeTeamScores(team.id, answerSets) }))
      .sort((a, b) => b.scores.total - a.scores.total || a.team.name.localeCompare(b.team.name)),
    row => row.scores.total
  );

  // Mirrors the Scores table: every team in rank order with per-section
  // points (max shown in the header where the section has a fixed max)
  // and the overall total.
  const exportScoresCsv = () => {
    downloadCsv('pubhunt-scores.csv', [
      [
        'Rank',
        'Team',
        ...SECTION_KEYS.map(key =>
          SECTION_MAX[key] !== null ? `${SECTION_LABELS[key]} (/${SECTION_MAX[key]})` : SECTION_LABELS[key]
        ),
        'Total',
      ],
      ...scoreRows.map(({ team, scores, rank }) => [
        rank,
        team.name,
        ...SECTION_KEYS.map(key => scores[key]),
        scores.total,
      ]),
    ]);
  };

  const leaderboardFor = (key: SectionKey | 'total') =>
    withRanks(
      scoreRows
        .map(({ team, scores }) => ({ name: team.name, points: key === 'total' ? scores.total : scores[key] }))
        .filter(r => r.points > 0)
        .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))
        .slice(0, 10),
      r => r.points
    );

  return (
    <div className="admin-dashboard">
      <div className="admin-topbar">
        <h1>Host Dashboard</h1>
        <div className="admin-topbar-actions">
          <button
            className="admin-logout"
            onClick={() => {
              setPage('dashboard');
              setSection('qr');
            }}
          >
            <QrCode size={14} /> QR Codes
          </button>
          <button id="admin-logout-btn" className="admin-logout" onClick={handleLogout}>
            <LogOut size={14} /> Log out
          </button>
        </div>
      </div>

      <div className="admin-body">
        {error && <div className="admin-error">{error}</div>}

        {page === 'marking' ? (
          <AdminMarkingPage
            teams={teams}
            clashAnswers={clashAnswers}
            quizAnswers={quizAnswers}
            photoAnswers={photoAnswers}
            anagramAnswers={anagramAnswers}
            consoleAnswers={consoleAnswers}
            brainAnswers={brainAnswers}
            vowelsAnswers={vowelsAnswers}
            facebookMarks={facebookMarks}
            onMarkFacebook={markFacebook}
            onMarkClash={markClashAnswer}
            onMarkQuiz={markAnswer}
            onMarkPhoto={markPhotoAnswer}
            onMarkAnagram={markAnagramAnswer}
            onMarkConsole={markConsoleAnswer}
            onMarkBrain={markBrainAnswer}
            onMarkVowels={markVowelsAnswer}
            onBack={() => setPage('dashboard')}
          />
        ) : (
          <>
            <div className="admin-tabs">
              <button
                className={`admin-btn admin-tab ${section === 'teams' ? 'admin-tab-active' : ''}`}
                onClick={() => setSection('teams')}
              >
                Teams
              </button>
              <button
                className={`admin-btn admin-tab ${section === 'scores' ? 'admin-tab-active' : ''}`}
                onClick={() => setSection('scores')}
              >
                Scores
              </button>
              <button
                className={`admin-btn admin-tab ${section === 'leaderboard' ? 'admin-tab-active' : ''}`}
                onClick={() => setSection('leaderboard')}
              >
                Leaderboards
              </button>
              <button
                className="admin-btn admin-btn-primary admin-marking-link"
                onClick={() => setPage('marking')}
              >
                <ClipboardCheck size={14} /> Marking
                {unmarkedCount > 0 ? ` (${unmarkedCount})` : ''}
              </button>
            </div>

            {section === 'teams' && (
              <>
                <div className="admin-toolbar">
                  <span className="admin-stats">
                    {teams.length} teams · {participants.length} participants ·{' '}
                    {teams.filter(t => t.status === 'confirmed').length} confirmed
                    {teams.some(t => t.status === 'withdrawn') &&
                      ` · ${teams.filter(t => t.status === 'withdrawn').length} withdrawn`}
                  </span>
                  <div className="admin-toolbar-actions">
                    <button className="admin-btn" onClick={exportTeamsCsv}>
                      <Download size={14} /> Export CSV
                    </button>
                    <button id="admin-add-team-btn" className="admin-btn admin-btn-primary" onClick={addTeam}>
                      <Plus size={14} /> Add team
                    </button>
                  </div>
                </div>

                <div className="admin-search-wrap">
                  <Search size={16} className="admin-search-icon" aria-hidden />
                  <input
                    type="search"
                    className="admin-field admin-search"
                    placeholder="Search teams by name, theme or PIN…"
                    value={teamQuery}
                    onChange={e => setTeamQuery(e.target.value)}
                    aria-label="Search teams"
                  />
                </div>

                <div className="admin-team-list">
                  {teams
                    .filter(team => {
                      const q = teamQuery.trim().toLowerCase();
                      if (!q) return true;
                      return (
                        team.name.toLowerCase().includes(q) ||
                        team.game_theme.toLowerCase().includes(q) ||
                        team.pin.includes(q)
                      );
                    })
                    .map(team => {
                    const memberCount = participants.filter(p => p.team_id === team.id).length;
                    return (
                      <button
                        key={team.id}
                        type="button"
                        className="admin-team-card"
                        onClick={() => setEditingTeamId(team.id)}
                      >
                        <div className="admin-card-lead">
                          <img
                            className="admin-card-cover"
                            src={resolveCover(team.cover_url, team.game_theme, coverMap)}
                            alt=""
                            loading="lazy"
                          />
                          <div className="admin-card-main">
                            <span className="admin-card-name">{team.name}</span>
                            <span className="admin-card-theme">{team.game_theme}</span>
                          </div>
                        </div>
                        <div className="admin-card-meta">
                          <span className={`admin-chip admin-chip-${team.status}`}>
                            {STATUS_LABEL[team.status] || team.status}
                          </span>
                          <span className="admin-chip">Route {team.route}</span>
                          <span className="admin-chip admin-chip-pin">PIN {team.pin}</span>
                          <span className="admin-card-members">
                            {memberCount} member{memberCount === 1 ? '' : 's'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {section === 'scores' && (
              <>
                <div className="admin-toolbar">
                  <span className="admin-stats">
                    Points count answers marked correct · {unmarkedCount} still unmarked
                  </span>
                  <div className="admin-toolbar-actions">
                    <button className="admin-btn" onClick={exportScoresCsv}>
                      <Download size={14} /> Export CSV
                    </button>
                  </div>
                </div>

                <div className="admin-table-wrap">
                  <table className="admin-score-table">
                    <thead>
                      <tr>
                        <th className="admin-score-rank">#</th>
                        <th className="admin-score-team">Team</th>
                        {SECTION_KEYS.map(key => (
                          <th key={key}>
                            {SECTION_SHORT_LABELS[key]}
                            {SECTION_MAX[key] !== null && (
                              <span className="admin-score-max"> /{SECTION_MAX[key]}</span>
                            )}
                          </th>
                        ))}
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scoreRows.map(({ team, scores, rank }) => (
                        <tr key={team.id}>
                          <td className="admin-score-rank">
                            <span className={`admin-lb-rank ${rank <= 3 && scores.total > 0 ? `admin-lb-rank-${rank}` : ''}`}>
                              {rank}
                            </span>
                          </td>
                          <td className="admin-score-team">{team.name}</td>
                          {SECTION_KEYS.map(key => (
                            <td key={key}>{scores[key]}</td>
                          ))}
                          <td className="admin-score-total">{scores.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {section === 'qr' && <AdminQrCodes />}

            {section === 'leaderboard' && (
              <>
                <div className="admin-toolbar">
                  <span className="admin-stats">
                    Top 10 per section · teams with 0 points aren't shown
                  </span>
                </div>

                <div className="admin-lb-grid">
                  <div className="admin-lb-card admin-lb-overall">
                    <h3>Overall</h3>
                    <LeaderboardList rows={leaderboardFor('total')} />
                  </div>
                  {SECTION_KEYS.map(key => (
                    <div key={key} className="admin-lb-card">
                      <h3>{SECTION_LABELS[key]}</h3>
                      <LeaderboardList rows={leaderboardFor(key)} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {editingTeam && (
        <div className="admin-modal-overlay" onClick={() => setEditingTeamId(null)}>
          <div className="admin-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-head">
              <h2>{editingTeam.name}</h2>
              <button
                className="admin-btn admin-btn-icon"
                onClick={() => setEditingTeamId(null)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="admin-modal-grid">
              <label className="admin-label admin-label-wide">
                Team name
                <input
                  className="admin-field"
                  type="text"
                  value={editingTeam.name}
                  onChange={e => updateTeamField(editingTeam.id, 'name', e.target.value)}
                  onBlur={() => saveTeam(editingTeam)}
                />
              </label>

              <label className="admin-label admin-label-wide">
                Theme
                <input
                  className="admin-field"
                  type="text"
                  placeholder="Theme"
                  value={editingTeam.game_theme}
                  onChange={e => updateTeamField(editingTeam.id, 'game_theme', e.target.value)}
                  onBlur={() => saveTeam(editingTeam)}
                />
              </label>

              <div className="admin-label admin-label-wide">
                Game cover
                <div className="admin-cover-row">
                  <img
                    className="admin-cover-preview"
                    src={resolveCover(editingTeam.cover_url, editingTeam.game_theme, coverMap)}
                    alt={`Cover for ${editingTeam.game_theme}`}
                  />
                  <div className="admin-cover-actions">
                    <span className="admin-cover-hint">
                      {editingTeam.cover_url
                        ? 'Custom cover'
                        : 'Default cover for this theme'}
                    </span>
                    <button
                      className="admin-btn"
                      onClick={() => coverFileRef.current?.click()}
                      disabled={coverBusy}
                    >
                      <ImagePlus size={14} />{' '}
                      {coverBusy ? 'Working…' : editingTeam.cover_url ? 'Replace cover' : 'Upload cover'}
                    </button>
                    {editingTeam.cover_url && (
                      <button
                        className="admin-btn"
                        onClick={() => removeCover(editingTeam)}
                        disabled={coverBusy}
                      >
                        <Trash2 size={13} /> Use default
                      </button>
                    )}
                  </div>
                </div>
                <input
                  ref={coverFileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={e => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (file) uploadCover(editingTeam, file);
                  }}
                />
              </div>

              <label className="admin-label">
                Status
                <select
                  className="admin-select"
                  value={editingTeam.status}
                  onChange={e => {
                    updateTeamField(editingTeam.id, 'status', e.target.value);
                    saveTeam({ ...editingTeam, status: e.target.value });
                  }}
                >
                  <option value="confirmed">Confirmed</option>
                  <option value="tbc">TBC</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
              </label>

              <label className="admin-label">
                Route
                <select
                  className="admin-select"
                  value={editingTeam.route}
                  onChange={e => {
                    updateTeamField(editingTeam.id, 'route', e.target.value);
                    saveTeam({ ...editingTeam, route: e.target.value });
                  }}
                >
                  <option value="A">Route A</option>
                  <option value="B">Route B</option>
                </select>
              </label>

              <label className="admin-label">
                PIN
                <input
                  className="admin-field admin-field-pin"
                  type="text"
                  inputMode="numeric"
                  placeholder="PIN"
                  value={editingTeam.pin}
                  onChange={e => updateTeamField(editingTeam.id, 'pin', e.target.value)}
                  onBlur={() => saveTeam(editingTeam)}
                />
              </label>
            </div>

            <h3 className="admin-modal-subhead">
              Members ({editingParticipants.length})
            </h3>

            <div className="admin-participant-list">
              {editingParticipants.map(p => (
                <div key={p.id} className="admin-participant-row">
                  <input
                    className="admin-field admin-participant-name"
                    type="text"
                    value={p.full_name}
                    onChange={e => updateParticipantField(p.id, 'full_name', e.target.value)}
                    onBlur={() => saveParticipant(p)}
                  />
                  <div className="admin-participant-meta">
                    <select
                      className="admin-select"
                      value={p.role}
                      onChange={e => {
                        updateParticipantField(p.id, 'role', e.target.value);
                        saveParticipant({ ...p, role: e.target.value as 'captain' | 'participant' });
                      }}
                    >
                      <option value="captain">Captain</option>
                      <option value="participant">Participant</option>
                    </select>
                    <label className="admin-internal-checkbox">
                      <input
                        type="checkbox"
                        checked={p.is_internal}
                        onChange={e => {
                          updateParticipantField(p.id, 'is_internal', e.target.checked);
                          saveParticipant({ ...p, is_internal: e.target.checked });
                        }}
                      />
                      Internal
                    </label>
                    <button
                      className="admin-btn admin-btn-icon admin-btn-danger"
                      onClick={() => deleteParticipant(p.id)}
                      aria-label="Delete member"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
              {editingParticipants.length === 0 && (
                <p className="admin-empty-roster">No members yet.</p>
              )}
              <button className="admin-link-btn" onClick={() => addParticipant(editingTeam.id)}>
                <Plus size={13} /> Add member
              </button>
            </div>

            <div className="admin-modal-foot">
              <button
                className="admin-btn admin-btn-danger-solid"
                onClick={() => deleteTeam(editingTeam.id)}
              >
                <Trash2 size={14} /> Delete team
              </button>
              <button className="admin-btn admin-btn-primary" onClick={() => setEditingTeamId(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
