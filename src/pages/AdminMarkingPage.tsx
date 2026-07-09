import { useState, type ReactNode } from 'react';
import { ArrowLeft, Check, ListFilter, X } from 'lucide-react';
import { ROUTE_QUIZ_ANSWERS, ROUTE_QUIZZES } from './quiz';
import { PHOTO_CHALLENGE } from './photoChallenge';
import { ANAGRAM_CHALLENGE } from './anagramChallenge';
import { CONSOLE_CHALLENGE } from './consoleChallenge';
import { BRAIN_TRAINING_CHALLENGE } from './brainTrainingChallenge';
import { MISSING_VOWELS_CHALLENGE } from './missingVowelsChallenge';
import type {
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

type MarkingSection = 'clash' | 'quiz' | 'photos' | 'anagrams' | 'consoles' | 'brain' | 'vowels' | 'facebook';

const TABS: { id: MarkingSection; label: string }[] = [
  { id: 'clash', label: 'Team Clash' },
  { id: 'quiz', label: 'Route Quiz' },
  { id: 'photos', label: 'Characters' },
  { id: 'anagrams', label: 'Anagrams' },
  { id: 'consoles', label: 'Consoles' },
  { id: 'brain', label: 'Brain Training' },
  { id: 'vowels', label: 'Missing Vowels' },
  { id: 'facebook', label: 'Facebook' },
];

// The three uploads each team makes to the Facebook group; markers check
// the group and record yes/no per item. Nothing is submitted in the app.
const FACEBOOK_ITEMS = [
  { field: 'team_photo', badge: 'Photo', label: 'Team photo at the start point (GH)' },
  { field: 'selection_video', badge: 'Video', label: 'Character selection screen montage' },
  { field: 'scene_video', badge: 'Video', label: 'Iconic (or funny) scene from their game' },
] as const;

const FACEBOOK_GROUP_URL = 'https://www.facebook.com/groups/1657912238864031';

interface Props {
  teams: AdminTeam[];
  clashAnswers: TeamClashAnswer[];
  quizAnswers: QuizAnswer[];
  photoAnswers: PhotoAnswer[];
  anagramAnswers: AnagramAnswer[];
  consoleAnswers: ConsoleAnswer[];
  brainAnswers: BrainTrainingAnswer[];
  vowelsAnswers: MissingVowelsAnswer[];
  facebookMarks: FacebookMark[];
  onMarkFacebook: (teamId: string, field: 'team_photo' | 'selection_video' | 'scene_video', value: boolean) => void;
  onMarkClash: (answer: TeamClashAnswer, value: boolean) => void;
  onMarkQuiz: (answer: QuizAnswer, value: boolean) => void;
  onMarkPhoto: (answer: PhotoAnswer, field: 'character_correct' | 'game_correct', value: boolean) => void;
  onMarkAnagram: (answer: AnagramAnswer, value: boolean) => void;
  onMarkConsole: (answer: ConsoleAnswer, value: boolean) => void;
  onMarkBrain: (answer: BrainTrainingAnswer, value: boolean) => void;
  onMarkVowels: (answer: MissingVowelsAnswer, value: boolean) => void;
  onBack: () => void;
}

/** Row background tint by mark state, so progress is scannable at a glance. */
function rowClass(...marks: (boolean | null)[]): string {
  if (marks.every(m => m === null)) return 'admin-quiz-row';
  if (marks.some(m => m === false)) return 'admin-quiz-row admin-row-wrong';
  if (marks.every(m => m === true)) return 'admin-quiz-row admin-row-correct';
  return 'admin-quiz-row'; // partially marked (photos with one of two done)
}

function MarkButtons({ value, onMark }: { value: boolean | null; onMark: (v: boolean) => void }) {
  return (
    <div className="admin-quiz-marks">
      <button
        className={`admin-btn admin-btn-icon admin-mark-btn ${value === true ? 'admin-mark-correct' : ''}`}
        onClick={() => onMark(true)}
        aria-label="Mark correct"
        aria-pressed={value === true}
      >
        <Check size={18} />
      </button>
      <button
        className={`admin-btn admin-btn-icon admin-mark-btn ${value === false ? 'admin-mark-wrong' : ''}`}
        onClick={() => onMark(false)}
        aria-label="Mark incorrect"
        aria-pressed={value === false}
      >
        <X size={18} />
      </button>
    </div>
  );
}

/** One card per team with its (possibly filtered) answers. */
function TeamCards<T extends { id: string; team_id: string }>({
  teams,
  answers,
  progress,
  renderRow,
}: {
  teams: AdminTeam[];
  answers: T[];
  progress: (rows: T[]) => string;
  renderRow: (a: T, team: AdminTeam) => ReactNode;
}) {
  return (
    <div className="admin-team-list">
      {teams.map(team => {
        const teamAnswers = answers.filter(a => a.team_id === team.id);
        if (teamAnswers.length === 0) return null;
        return (
          <div key={team.id} className="admin-team-card admin-quiz-card">
            <div className="admin-card-main">
              <span className="admin-card-name">{team.name}</span>
              <span className="admin-card-theme">{progress(teamAnswers)}</span>
            </div>
            <div className="admin-quiz-answers">{teamAnswers.map(a => renderRow(a, team))}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminMarkingPage({
  teams,
  clashAnswers,
  quizAnswers,
  photoAnswers,
  anagramAnswers,
  consoleAnswers,
  brainAnswers,
  vowelsAnswers,
  facebookMarks,
  onMarkFacebook,
  onMarkClash,
  onMarkQuiz,
  onMarkPhoto,
  onMarkAnagram,
  onMarkConsole,
  onMarkBrain,
  onMarkVowels,
  onBack,
}: Props) {
  const [section, setSection] = useState<MarkingSection>('clash');
  const [unmarkedOnly, setUnmarkedOnly] = useState(false);

  // The rival a clash answer points at: its theme is shown on the row and
  // its real name is the expected answer.
  const teamById = new Map(teams.map(t => [t.id, t]));

  const fbByTeam = new Map(facebookMarks.map(m => [m.team_id, m]));
  const fbUnmarked = teams.reduce(
    (n, team) =>
      n + FACEBOOK_ITEMS.filter(item => (fbByTeam.get(team.id)?.[item.field] ?? null) === null).length,
    0
  );

  // Unmarked counts shown on each tab so hosts can see what's left.
  const unmarked: Record<MarkingSection, number> = {
    clash: clashAnswers.filter(a => a.is_correct === null).length,
    quiz: quizAnswers.filter(a => a.is_correct === null).length,
    photos: photoAnswers.filter(a => a.character_correct === null || a.game_correct === null).length,
    anagrams: anagramAnswers.filter(a => a.is_correct === null).length,
    consoles: consoleAnswers.filter(a => a.is_correct === null).length,
    brain: brainAnswers.filter(a => a.is_correct === null).length,
    vowels: vowelsAnswers.filter(a => a.is_correct === null).length,
    facebook: fbUnmarked,
  };

  const filterSimple = <T extends { is_correct: boolean | null }>(rows: T[]) =>
    unmarkedOnly ? rows.filter(a => a.is_correct === null) : rows;

  const visible = {
    clash: filterSimple(clashAnswers),
    quiz: filterSimple(quizAnswers),
    photos: unmarkedOnly
      ? photoAnswers.filter(a => a.character_correct === null || a.game_correct === null)
      : photoAnswers,
    anagrams: filterSimple(anagramAnswers),
    consoles: filterSimple(consoleAnswers),
    brain: filterSimple(brainAnswers),
    vowels: filterSimple(vowelsAnswers),
    facebook: [] as { id: string }[], // has its own per-team rendering below
  };

  const totals: Record<MarkingSection, number> = {
    clash: clashAnswers.length,
    quiz: quizAnswers.length,
    photos: photoAnswers.length,
    anagrams: anagramAnswers.length,
    consoles: consoleAnswers.length,
    brain: brainAnswers.length,
    vowels: vowelsAnswers.length,
    facebook: teams.length * FACEBOOK_ITEMS.length,
  };

  const emptyState = (noun: string) =>
    totals[section] === 0 ? (
      <p className="admin-empty-roster">No {noun} submitted yet.</p>
    ) : visible[section].length === 0 ? (
      <p className="admin-empty-roster">All {noun} are marked — nothing left here. 🎉</p>
    ) : null;

  return (
    <>
      <div className="admin-toolbar">
        <button className="admin-btn" onClick={onBack}>
          <ArrowLeft size={14} /> Dashboard
        </button>
        <button
          className={`admin-btn admin-filter-btn ${unmarkedOnly ? 'admin-filter-on' : ''}`}
          onClick={() => setUnmarkedOnly(v => !v)}
          aria-pressed={unmarkedOnly}
        >
          <ListFilter size={14} /> Unmarked only
        </button>
      </div>

      <div className="admin-tabs admin-marking-tabs">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            className={`admin-btn admin-tab ${section === id ? 'admin-tab-active' : ''}`}
            onClick={() => setSection(id)}
          >
            {label}
            {unmarked[id] > 0 && <span className="admin-tab-badge">{unmarked[id]}</span>}
          </button>
        ))}
      </div>

      <div className="admin-toolbar">
        <span className="admin-stats">
          {totals[section]} {section === 'facebook' ? 'checks' : 'answers'} · {unmarked[section]} unmarked · tap a
          mark again to clear it
        </span>
      </div>

      {section === 'clash' && (
        <>
          {emptyState('team clash answers')}
          <TeamCards
            teams={teams}
            answers={visible.clash}
            progress={rows => `${rows.filter(a => a.is_correct === true).length}/${rows.length} correct`}
            renderRow={a => {
              const target = teamById.get(a.target_team_id);
              return (
                <div key={a.id} className={rowClass(a.is_correct)}>
                  <div className="admin-quiz-question">
                    <span className="admin-chip">{target?.game_theme ?? 'Unknown cover'}</span>
                    <span className="admin-quiz-question-text">Who is this team?</span>
                  </div>
                  <div className="admin-quiz-answer-line">
                    <span className="admin-quiz-answer-text">
                      {a.answer}
                      <span className="admin-photo-expected">Team: {target?.name ?? '?'}</span>
                    </span>
                    <MarkButtons value={a.is_correct} onMark={v => onMarkClash(a, v)} />
                  </div>
                </div>
              );
            }}
          />
        </>
      )}

      {section === 'quiz' && (
        <>
          {emptyState('quiz answers')}
          <TeamCards
            teams={teams}
            answers={visible.quiz}
            progress={rows => `${rows.filter(a => a.is_correct === true).length}/${rows.length} correct`}
            renderRow={(a, team) => {
              const route = team.route === 'B' ? 'B' : 'A';
              return (
                <div key={a.id} className={rowClass(a.is_correct)}>
                  <div className="admin-quiz-question">
                    <span className="admin-chip">
                      Pub {a.quiz_number} · Q{a.question_number}
                    </span>
                    <span className="admin-quiz-question-text">
                      {ROUTE_QUIZZES[route][a.quiz_number - 1]?.[a.question_number - 1] ?? ''}
                    </span>
                    <span className="admin-photo-expected">
                      Answer: {ROUTE_QUIZ_ANSWERS[route][a.quiz_number - 1]?.[a.question_number - 1] ?? '?'}
                    </span>
                  </div>
                  <div className="admin-quiz-answer-line">
                    <span className="admin-quiz-answer-text">{a.answer}</span>
                    <MarkButtons value={a.is_correct} onMark={v => onMarkQuiz(a, v)} />
                  </div>
                </div>
              );
            }}
          />
        </>
      )}

      {section === 'photos' && (
        <>
          {emptyState('photo answers')}
          <TeamCards
            teams={teams}
            answers={visible.photos}
            progress={rows =>
              `${rows.filter(a => a.character_correct === true).length + rows.filter(a => a.game_correct === true).length}/${rows.length * 2} points`
            }
            renderRow={a => {
              const item = PHOTO_CHALLENGE[a.photo_number - 1];
              return (
                <div key={a.id} className={rowClass(a.character_correct, a.game_correct)}>
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
                    <MarkButtons value={a.character_correct} onMark={v => onMarkPhoto(a, 'character_correct', v)} />
                  </div>
                  <div className="admin-quiz-answer-line">
                    <span className="admin-quiz-answer-text">
                      {a.game_answer}
                      <span className="admin-photo-expected">Game: {item?.game ?? '?'}</span>
                    </span>
                    <MarkButtons value={a.game_correct} onMark={v => onMarkPhoto(a, 'game_correct', v)} />
                  </div>
                </div>
              );
            }}
          />
        </>
      )}

      {section === 'anagrams' && (
        <>
          {emptyState('anagram answers')}
          <TeamCards
            teams={teams}
            answers={visible.anagrams}
            progress={rows => `${rows.filter(a => a.is_correct === true).length}/${rows.length} correct`}
            renderRow={a => {
              const item = ANAGRAM_CHALLENGE[a.anagram_number - 1];
              return (
                <div key={a.id} className={rowClass(a.is_correct)}>
                  <div className="admin-quiz-question">
                    <span className="admin-chip">Anagram {a.anagram_number}</span>
                    <span className="admin-quiz-question-text">{item?.anagram ?? ''}</span>
                  </div>
                  <div className="admin-quiz-answer-line">
                    <span className="admin-quiz-answer-text">
                      {a.answer}
                      <span className="admin-photo-expected">Game: {item?.game ?? '?'}</span>
                    </span>
                    <MarkButtons value={a.is_correct} onMark={v => onMarkAnagram(a, v)} />
                  </div>
                </div>
              );
            }}
          />
        </>
      )}

      {section === 'consoles' && (
        <>
          {emptyState('console answers')}
          <TeamCards
            teams={teams}
            answers={visible.consoles}
            progress={rows => `${rows.filter(a => a.is_correct === true).length}/${rows.length} correct`}
            renderRow={a => {
              const item = CONSOLE_CHALLENGE[a.console_number - 1];
              return (
                <div key={a.id} className={rowClass(a.is_correct)}>
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
                    <MarkButtons value={a.is_correct} onMark={v => onMarkConsole(a, v)} />
                  </div>
                </div>
              );
            }}
          />
        </>
      )}

      {section === 'brain' && (
        <>
          {emptyState('brain training answers')}
          <TeamCards
            teams={teams}
            answers={visible.brain}
            progress={rows => `${rows.filter(a => a.is_correct === true).length}/${rows.length} correct`}
            renderRow={a => {
              const item = BRAIN_TRAINING_CHALLENGE[a.question_number - 1];
              return (
                <div key={a.id} className={rowClass(a.is_correct)}>
                  <div className="admin-quiz-question">
                    <span className="admin-chip">Q{a.question_number}</span>
                    <span className="admin-quiz-question-text">{item?.question ?? ''}</span>
                  </div>
                  <div className="admin-quiz-answer-line">
                    <span className="admin-quiz-answer-text">
                      {a.answer}
                      <span className="admin-photo-expected">Answer: {item?.answer ?? '?'}</span>
                    </span>
                    <MarkButtons value={a.is_correct} onMark={v => onMarkBrain(a, v)} />
                  </div>
                </div>
              );
            }}
          />
        </>
      )}

      {section === 'facebook' && (
        <>
          <div className="admin-toolbar">
            <a className="admin-btn" href={FACEBOOK_GROUP_URL} target="_blank" rel="noreferrer">
              Open the Facebook group
            </a>
          </div>

          {unmarkedOnly && fbUnmarked === 0 && (
            <p className="admin-empty-roster">All Facebook uploads are checked — nothing left here. 🎉</p>
          )}

          <div className="admin-team-list">
            {teams.map(team => {
              const mark = fbByTeam.get(team.id);
              const items = FACEBOOK_ITEMS.filter(
                item => !unmarkedOnly || (mark?.[item.field] ?? null) === null
              );
              if (items.length === 0) return null;
              const yes = FACEBOOK_ITEMS.filter(i => mark?.[i.field] === true).length;
              return (
                <div key={team.id} className="admin-team-card admin-quiz-card">
                  <div className="admin-card-main">
                    <span className="admin-card-name">{team.name}</span>
                    <span className="admin-card-theme">
                      {yes}/{FACEBOOK_ITEMS.length} uploaded
                    </span>
                  </div>
                  <div className="admin-quiz-answers">
                    {items.map(item => (
                      <div key={item.field} className={rowClass(mark?.[item.field] ?? null)}>
                        <div className="admin-quiz-question">
                          <span className="admin-chip">{item.badge}</span>
                          <span className="admin-quiz-question-text">{item.label}</span>
                        </div>
                        <div className="admin-quiz-answer-line">
                          <span className="admin-quiz-answer-text">On the Facebook group?</span>
                          <MarkButtons
                            value={mark?.[item.field] ?? null}
                            onMark={v => onMarkFacebook(team.id, item.field, v)}
                          />
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

      {section === 'vowels' && (
        <>
          {emptyState('missing vowels answers')}
          <TeamCards
            teams={teams}
            answers={visible.vowels}
            progress={rows => `${rows.filter(a => a.is_correct === true).length}/${rows.length} correct`}
            renderRow={a => {
              const item = MISSING_VOWELS_CHALLENGE[a.puzzle_number - 1];
              return (
                <div key={a.id} className={rowClass(a.is_correct)}>
                  <div className="admin-quiz-question">
                    <span className="admin-chip">Puzzle {a.puzzle_number}</span>
                    <span className="admin-quiz-question-text">{item?.puzzle ?? ''}</span>
                  </div>
                  <div className="admin-quiz-answer-line">
                    <span className="admin-quiz-answer-text">
                      {a.answer}
                      <span className="admin-photo-expected">Answer: {item?.answer ?? '?'}</span>
                    </span>
                    <MarkButtons value={a.is_correct} onMark={v => onMarkVowels(a, v)} />
                  </div>
                </div>
              );
            }}
          />
        </>
      )}
    </>
  );
}
