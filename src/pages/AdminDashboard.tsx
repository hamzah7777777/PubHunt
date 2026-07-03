import { useEffect, useState } from 'react';
import { Check, LogOut, Plus, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ROUTE_QUIZZES } from './quiz';
import { PHOTO_CHALLENGE } from './photoChallenge';
import { ANAGRAM_CHALLENGE } from './anagramChallenge';
import { CONSOLE_CHALLENGE } from './consoleChallenge';
import { BRAIN_TRAINING_CHALLENGE } from './brainTrainingChallenge';
import { MISSING_VOWELS_CHALLENGE } from './missingVowelsChallenge';
import type {
  AdminParticipant,
  AdminTeam,
  AnagramAnswer,
  BrainTrainingAnswer,
  ConsoleAnswer,
  MissingVowelsAnswer,
  PhotoAnswer,
  QuizAnswer,
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

export default function AdminDashboard({ onLogout }: Props) {
  const [teams, setTeams] = useState<AdminTeam[]>([]);
  const [participants, setParticipants] = useState<AdminParticipant[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswer[]>([]);
  const [photoAnswers, setPhotoAnswers] = useState<PhotoAnswer[]>([]);
  const [anagramAnswers, setAnagramAnswers] = useState<AnagramAnswer[]>([]);
  const [consoleAnswers, setConsoleAnswers] = useState<ConsoleAnswer[]>([]);
  const [brainAnswers, setBrainAnswers] = useState<BrainTrainingAnswer[]>([]);
  const [vowelsAnswers, setVowelsAnswers] = useState<MissingVowelsAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [section, setSection] = useState<
    'teams' | 'quiz' | 'photos' | 'anagrams' | 'consoles' | 'brain' | 'vowels'
  >('teams');

  useEffect(() => {
    (async () => {
      const [teamsRes, participantsRes, quizRes, photoRes, anagramRes, consoleRes, brainRes, vowelsRes] =
        await Promise.all([
          supabase.from('teams').select('*').order('name'),
          supabase.from('participants').select('*').order('row_order'),
          supabase.from('quiz_answers').select('*').order('quiz_number').order('question_number'),
          supabase.from('photo_answers').select('*').order('photo_number'),
          supabase.from('anagram_answers').select('*').order('anagram_number'),
          supabase.from('console_answers').select('*').order('console_number'),
          supabase.from('brain_training_answers').select('*').order('question_number'),
          supabase.from('missing_vowels_answers').select('*').order('puzzle_number'),
        ]);

      if (
        teamsRes.error ||
        participantsRes.error ||
        quizRes.error ||
        photoRes.error ||
        anagramRes.error ||
        consoleRes.error ||
        brainRes.error ||
        vowelsRes.error
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  const updateTeamField = (teamId: string, field: keyof AdminTeam, value: string) => {
    setTeams(prev => prev.map(t => (t.id === teamId ? { ...t, [field]: value } : t)));
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

  return (
    <div className="admin-dashboard">
      <div className="admin-topbar">
        <h1>Host Dashboard</h1>
        <button id="admin-logout-btn" className="admin-logout" onClick={handleLogout}>
          <LogOut size={14} /> Log out
        </button>
      </div>

      <div className="admin-body">
        {error && <div className="admin-error">{error}</div>}

        <div className="admin-tabs">
          <button
            className={`admin-btn admin-tab ${section === 'teams' ? 'admin-tab-active' : ''}`}
            onClick={() => setSection('teams')}
          >
            Teams
          </button>
          <button
            className={`admin-btn admin-tab ${section === 'quiz' ? 'admin-tab-active' : ''}`}
            onClick={() => setSection('quiz')}
          >
            Quiz Marking
          </button>
          <button
            className={`admin-btn admin-tab ${section === 'photos' ? 'admin-tab-active' : ''}`}
            onClick={() => setSection('photos')}
          >
            Photo Marking
          </button>
          <button
            className={`admin-btn admin-tab ${section === 'anagrams' ? 'admin-tab-active' : ''}`}
            onClick={() => setSection('anagrams')}
          >
            Anagram Marking
          </button>
          <button
            className={`admin-btn admin-tab ${section === 'consoles' ? 'admin-tab-active' : ''}`}
            onClick={() => setSection('consoles')}
          >
            Console Marking
          </button>
          <button
            className={`admin-btn admin-tab ${section === 'brain' ? 'admin-tab-active' : ''}`}
            onClick={() => setSection('brain')}
          >
            Brain Training Marking
          </button>
          <button
            className={`admin-btn admin-tab ${section === 'vowels' ? 'admin-tab-active' : ''}`}
            onClick={() => setSection('vowels')}
          >
            Missing Vowels Marking
          </button>
        </div>

        {section === 'quiz' && (
          <>
            <div className="admin-toolbar">
              <span className="admin-stats">
                {quizAnswers.length} answers · {quizAnswers.filter(a => a.is_correct === null).length} unmarked
              </span>
            </div>

            {quizAnswers.length === 0 && (
              <p className="admin-empty-roster">No quiz answers submitted yet.</p>
            )}

            <div className="admin-team-list">
              {teams.map(team => {
                const teamAnswers = quizAnswers.filter(a => a.team_id === team.id);
                if (teamAnswers.length === 0) return null;
                const route = team.route === 'B' ? 'B' : 'A';
                const correct = teamAnswers.filter(a => a.is_correct === true).length;
                return (
                  <div key={team.id} className="admin-team-card admin-quiz-card">
                    <div className="admin-card-main">
                      <span className="admin-card-name">{team.name}</span>
                      <span className="admin-card-theme">
                        Route {route} · {correct}/{teamAnswers.length} correct
                      </span>
                    </div>
                    <div className="admin-quiz-answers">
                      {teamAnswers.map(a => (
                        <div key={a.id} className="admin-quiz-row">
                          <div className="admin-quiz-question">
                            <span className="admin-chip">
                              Quiz {a.quiz_number} · Q{a.question_number}
                            </span>
                            <span className="admin-quiz-question-text">
                              {ROUTE_QUIZZES[route][a.quiz_number - 1]?.[a.question_number - 1] ?? ''}
                            </span>
                          </div>
                          <div className="admin-quiz-answer-line">
                            <span className="admin-quiz-answer-text">{a.answer}</span>
                            <div className="admin-quiz-marks">
                              <button
                                className={`admin-btn admin-btn-icon admin-mark-btn ${a.is_correct === true ? 'admin-mark-correct' : ''}`}
                                onClick={() => markAnswer(a, true)}
                                aria-label="Mark correct"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                className={`admin-btn admin-btn-icon admin-mark-btn ${a.is_correct === false ? 'admin-mark-wrong' : ''}`}
                                onClick={() => markAnswer(a, false)}
                                aria-label="Mark incorrect"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {section === 'photos' && (
          <>
            <div className="admin-toolbar">
              <span className="admin-stats">
                {photoAnswers.length} answers ·{' '}
                {photoAnswers.filter(a => a.character_correct === null || a.game_correct === null).length} unmarked
              </span>
            </div>

            {photoAnswers.length === 0 && (
              <p className="admin-empty-roster">No photo answers submitted yet.</p>
            )}

            <div className="admin-team-list">
              {teams.map(team => {
                const teamAnswers = photoAnswers.filter(a => a.team_id === team.id);
                if (teamAnswers.length === 0) return null;
                const points =
                  teamAnswers.filter(a => a.character_correct === true).length +
                  teamAnswers.filter(a => a.game_correct === true).length;
                return (
                  <div key={team.id} className="admin-team-card admin-quiz-card">
                    <div className="admin-card-main">
                      <span className="admin-card-name">{team.name}</span>
                      <span className="admin-card-theme">
                        {points}/{teamAnswers.length * 2} points
                      </span>
                    </div>
                    <div className="admin-quiz-answers">
                      {teamAnswers.map(a => {
                        const item = PHOTO_CHALLENGE[a.photo_number - 1];
                        return (
                          <div key={a.id} className="admin-quiz-row">
                            <div className="admin-quiz-question">
                              {item && (
                                <img
                                  className="admin-photo-thumb"
                                  src={item.image}
                                  alt={`Photo ${a.photo_number}`}
                                  loading="lazy"
                                />
                              )}
                              <span className="admin-chip">Photo {a.photo_number}</span>
                            </div>
                            <div className="admin-quiz-answer-line">
                              <span className="admin-quiz-answer-text">
                                {a.character_answer}
                                <span className="admin-photo-expected">Character: {item?.character ?? '?'}</span>
                              </span>
                              <div className="admin-quiz-marks">
                                <button
                                  className={`admin-btn admin-btn-icon admin-mark-btn ${a.character_correct === true ? 'admin-mark-correct' : ''}`}
                                  onClick={() => markPhotoAnswer(a, 'character_correct', true)}
                                  aria-label="Mark character correct"
                                >
                                  <Check size={16} />
                                </button>
                                <button
                                  className={`admin-btn admin-btn-icon admin-mark-btn ${a.character_correct === false ? 'admin-mark-wrong' : ''}`}
                                  onClick={() => markPhotoAnswer(a, 'character_correct', false)}
                                  aria-label="Mark character incorrect"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </div>
                            <div className="admin-quiz-answer-line">
                              <span className="admin-quiz-answer-text">
                                {a.game_answer}
                                <span className="admin-photo-expected">Game: {item?.game ?? '?'}</span>
                              </span>
                              <div className="admin-quiz-marks">
                                <button
                                  className={`admin-btn admin-btn-icon admin-mark-btn ${a.game_correct === true ? 'admin-mark-correct' : ''}`}
                                  onClick={() => markPhotoAnswer(a, 'game_correct', true)}
                                  aria-label="Mark game correct"
                                >
                                  <Check size={16} />
                                </button>
                                <button
                                  className={`admin-btn admin-btn-icon admin-mark-btn ${a.game_correct === false ? 'admin-mark-wrong' : ''}`}
                                  onClick={() => markPhotoAnswer(a, 'game_correct', false)}
                                  aria-label="Mark game incorrect"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {section === 'anagrams' && (
          <>
            <div className="admin-toolbar">
              <span className="admin-stats">
                {anagramAnswers.length} answers ·{' '}
                {anagramAnswers.filter(a => a.is_correct === null).length} unmarked
              </span>
            </div>

            {anagramAnswers.length === 0 && (
              <p className="admin-empty-roster">No anagram answers submitted yet.</p>
            )}

            <div className="admin-team-list">
              {teams.map(team => {
                const teamAnswers = anagramAnswers.filter(a => a.team_id === team.id);
                if (teamAnswers.length === 0) return null;
                const correct = teamAnswers.filter(a => a.is_correct === true).length;
                return (
                  <div key={team.id} className="admin-team-card admin-quiz-card">
                    <div className="admin-card-main">
                      <span className="admin-card-name">{team.name}</span>
                      <span className="admin-card-theme">
                        {correct}/{teamAnswers.length} correct
                      </span>
                    </div>
                    <div className="admin-quiz-answers">
                      {teamAnswers.map(a => {
                        const item = ANAGRAM_CHALLENGE[a.anagram_number - 1];
                        return (
                          <div key={a.id} className="admin-quiz-row">
                            <div className="admin-quiz-question">
                              <span className="admin-chip">Anagram {a.anagram_number}</span>
                              <span className="admin-quiz-question-text">{item?.anagram ?? ''}</span>
                            </div>
                            <div className="admin-quiz-answer-line">
                              <span className="admin-quiz-answer-text">
                                {a.answer}
                                <span className="admin-photo-expected">Game: {item?.game ?? '?'}</span>
                              </span>
                              <div className="admin-quiz-marks">
                                <button
                                  className={`admin-btn admin-btn-icon admin-mark-btn ${a.is_correct === true ? 'admin-mark-correct' : ''}`}
                                  onClick={() => markAnagramAnswer(a, true)}
                                  aria-label="Mark correct"
                                >
                                  <Check size={16} />
                                </button>
                                <button
                                  className={`admin-btn admin-btn-icon admin-mark-btn ${a.is_correct === false ? 'admin-mark-wrong' : ''}`}
                                  onClick={() => markAnagramAnswer(a, false)}
                                  aria-label="Mark incorrect"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {section === 'consoles' && (
          <>
            <div className="admin-toolbar">
              <span className="admin-stats">
                {consoleAnswers.length} answers ·{' '}
                {consoleAnswers.filter(a => a.is_correct === null).length} unmarked
              </span>
            </div>

            {consoleAnswers.length === 0 && (
              <p className="admin-empty-roster">No console answers submitted yet.</p>
            )}

            <div className="admin-team-list">
              {teams.map(team => {
                const teamAnswers = consoleAnswers.filter(a => a.team_id === team.id);
                if (teamAnswers.length === 0) return null;
                const correct = teamAnswers.filter(a => a.is_correct === true).length;
                return (
                  <div key={team.id} className="admin-team-card admin-quiz-card">
                    <div className="admin-card-main">
                      <span className="admin-card-name">{team.name}</span>
                      <span className="admin-card-theme">
                        {correct}/{teamAnswers.length} correct
                      </span>
                    </div>
                    <div className="admin-quiz-answers">
                      {teamAnswers.map(a => {
                        const item = CONSOLE_CHALLENGE[a.console_number - 1];
                        return (
                          <div key={a.id} className="admin-quiz-row">
                            <div className="admin-quiz-question">
                              {item && (
                                <img
                                  className="admin-photo-thumb"
                                  src={item.image}
                                  alt={`Console ${a.console_number}`}
                                  loading="lazy"
                                />
                              )}
                              <span className="admin-chip">Console {a.console_number}</span>
                            </div>
                            <div className="admin-quiz-answer-line">
                              <span className="admin-quiz-answer-text">
                                {a.answer}
                                <span className="admin-photo-expected">Console: {item?.console ?? '?'}</span>
                              </span>
                              <div className="admin-quiz-marks">
                                <button
                                  className={`admin-btn admin-btn-icon admin-mark-btn ${a.is_correct === true ? 'admin-mark-correct' : ''}`}
                                  onClick={() => markConsoleAnswer(a, true)}
                                  aria-label="Mark correct"
                                >
                                  <Check size={16} />
                                </button>
                                <button
                                  className={`admin-btn admin-btn-icon admin-mark-btn ${a.is_correct === false ? 'admin-mark-wrong' : ''}`}
                                  onClick={() => markConsoleAnswer(a, false)}
                                  aria-label="Mark incorrect"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {section === 'brain' && (
          <>
            <div className="admin-toolbar">
              <span className="admin-stats">
                {brainAnswers.length} answers ·{' '}
                {brainAnswers.filter(a => a.is_correct === null).length} unmarked
              </span>
            </div>

            {brainAnswers.length === 0 && (
              <p className="admin-empty-roster">No brain training answers submitted yet.</p>
            )}

            <div className="admin-team-list">
              {teams.map(team => {
                const teamAnswers = brainAnswers.filter(a => a.team_id === team.id);
                if (teamAnswers.length === 0) return null;
                const correct = teamAnswers.filter(a => a.is_correct === true).length;
                return (
                  <div key={team.id} className="admin-team-card admin-quiz-card">
                    <div className="admin-card-main">
                      <span className="admin-card-name">{team.name}</span>
                      <span className="admin-card-theme">
                        {correct}/{teamAnswers.length} correct
                      </span>
                    </div>
                    <div className="admin-quiz-answers">
                      {teamAnswers.map(a => {
                        const item = BRAIN_TRAINING_CHALLENGE[a.question_number - 1];
                        return (
                          <div key={a.id} className="admin-quiz-row">
                            <div className="admin-quiz-question">
                              <span className="admin-chip">Q{a.question_number}</span>
                              <span className="admin-quiz-question-text">{item?.question ?? ''}</span>
                            </div>
                            <div className="admin-quiz-answer-line">
                              <span className="admin-quiz-answer-text">
                                {a.answer}
                                <span className="admin-photo-expected">Answer: {item?.answer ?? '?'}</span>
                              </span>
                              <div className="admin-quiz-marks">
                                <button
                                  className={`admin-btn admin-btn-icon admin-mark-btn ${a.is_correct === true ? 'admin-mark-correct' : ''}`}
                                  onClick={() => markBrainAnswer(a, true)}
                                  aria-label="Mark correct"
                                >
                                  <Check size={16} />
                                </button>
                                <button
                                  className={`admin-btn admin-btn-icon admin-mark-btn ${a.is_correct === false ? 'admin-mark-wrong' : ''}`}
                                  onClick={() => markBrainAnswer(a, false)}
                                  aria-label="Mark incorrect"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {section === 'vowels' && (
          <>
            <div className="admin-toolbar">
              <span className="admin-stats">
                {vowelsAnswers.length} answers ·{' '}
                {vowelsAnswers.filter(a => a.is_correct === null).length} unmarked
              </span>
            </div>

            {vowelsAnswers.length === 0 && (
              <p className="admin-empty-roster">No missing vowels answers submitted yet.</p>
            )}

            <div className="admin-team-list">
              {teams.map(team => {
                const teamAnswers = vowelsAnswers.filter(a => a.team_id === team.id);
                if (teamAnswers.length === 0) return null;
                const correct = teamAnswers.filter(a => a.is_correct === true).length;
                return (
                  <div key={team.id} className="admin-team-card admin-quiz-card">
                    <div className="admin-card-main">
                      <span className="admin-card-name">{team.name}</span>
                      <span className="admin-card-theme">
                        {correct}/{teamAnswers.length} correct
                      </span>
                    </div>
                    <div className="admin-quiz-answers">
                      {teamAnswers.map(a => {
                        const item = MISSING_VOWELS_CHALLENGE[a.puzzle_number - 1];
                        return (
                          <div key={a.id} className="admin-quiz-row">
                            <div className="admin-quiz-question">
                              <span className="admin-chip">Puzzle {a.puzzle_number}</span>
                              <span className="admin-quiz-question-text">{item?.puzzle ?? ''}</span>
                            </div>
                            <div className="admin-quiz-answer-line">
                              <span className="admin-quiz-answer-text">
                                {a.answer}
                                <span className="admin-photo-expected">Answer: {item?.answer ?? '?'}</span>
                              </span>
                              <div className="admin-quiz-marks">
                                <button
                                  className={`admin-btn admin-btn-icon admin-mark-btn ${a.is_correct === true ? 'admin-mark-correct' : ''}`}
                                  onClick={() => markVowelsAnswer(a, true)}
                                  aria-label="Mark correct"
                                >
                                  <Check size={16} />
                                </button>
                                <button
                                  className={`admin-btn admin-btn-icon admin-mark-btn ${a.is_correct === false ? 'admin-mark-wrong' : ''}`}
                                  onClick={() => markVowelsAnswer(a, false)}
                                  aria-label="Mark incorrect"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {section === 'teams' && (
          <>
        <div className="admin-toolbar">
          <span className="admin-stats">
            {teams.length} teams · {participants.length} participants
          </span>
          <button id="admin-add-team-btn" className="admin-btn admin-btn-primary" onClick={addTeam}>
            <Plus size={14} /> Add team
          </button>
        </div>

        <div className="admin-team-list">
          {teams.map(team => {
            const memberCount = participants.filter(p => p.team_id === team.id).length;
            return (
              <button
                key={team.id}
                type="button"
                className="admin-team-card"
                onClick={() => setEditingTeamId(team.id)}
              >
                <div className="admin-card-main">
                  <span className="admin-card-name">{team.name}</span>
                  <span className="admin-card-theme">{team.game_theme}</span>
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
