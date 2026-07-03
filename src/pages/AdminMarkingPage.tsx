import { useState } from 'react';
import { ArrowLeft, Check, X } from 'lucide-react';
import { ROUTE_QUIZZES } from './quiz';
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
  MissingVowelsAnswer,
  PhotoAnswer,
  QuizAnswer,
  TeamClashAnswer,
} from '../types';

type MarkingSection = 'clash' | 'quiz' | 'photos' | 'anagrams' | 'consoles' | 'brain' | 'vowels';

const TABS: { id: MarkingSection; label: string }[] = [
  { id: 'clash', label: 'Team Clash' },
  { id: 'quiz', label: 'Quiz' },
  { id: 'photos', label: 'Characters' },
  { id: 'anagrams', label: 'Anagrams' },
  { id: 'consoles', label: 'Consoles' },
  { id: 'brain', label: 'Brain Training' },
  { id: 'vowels', label: 'Missing Vowels' },
];

interface Props {
  teams: AdminTeam[];
  clashAnswers: TeamClashAnswer[];
  quizAnswers: QuizAnswer[];
  photoAnswers: PhotoAnswer[];
  anagramAnswers: AnagramAnswer[];
  consoleAnswers: ConsoleAnswer[];
  brainAnswers: BrainTrainingAnswer[];
  vowelsAnswers: MissingVowelsAnswer[];
  onMarkClash: (answer: TeamClashAnswer, value: boolean) => void;
  onMarkQuiz: (answer: QuizAnswer, value: boolean) => void;
  onMarkPhoto: (answer: PhotoAnswer, field: 'character_correct' | 'game_correct', value: boolean) => void;
  onMarkAnagram: (answer: AnagramAnswer, value: boolean) => void;
  onMarkConsole: (answer: ConsoleAnswer, value: boolean) => void;
  onMarkBrain: (answer: BrainTrainingAnswer, value: boolean) => void;
  onMarkVowels: (answer: MissingVowelsAnswer, value: boolean) => void;
  onBack: () => void;
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

  // The rival a clash answer points at: its theme is shown on the row and
  // its real name is the expected answer.
  const teamById = new Map(teams.map(t => [t.id, t]));

  // Unmarked counts shown on each tab so hosts can see what's left.
  const unmarked: Record<MarkingSection, number> = {
    clash: clashAnswers.filter(a => a.is_correct === null).length,
    quiz: quizAnswers.filter(a => a.is_correct === null).length,
    photos: photoAnswers.filter(a => a.character_correct === null || a.game_correct === null).length,
    anagrams: anagramAnswers.filter(a => a.is_correct === null).length,
    consoles: consoleAnswers.filter(a => a.is_correct === null).length,
    brain: brainAnswers.filter(a => a.is_correct === null).length,
    vowels: vowelsAnswers.filter(a => a.is_correct === null).length,
  };

  return (
    <>
      <div className="admin-toolbar">
        <button className="admin-btn" onClick={onBack}>
          <ArrowLeft size={14} /> Dashboard
        </button>
        <span className="admin-stats">Marking · tap a mark again to clear it</span>
      </div>

      <div className="admin-tabs">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            className={`admin-btn admin-tab ${section === id ? 'admin-tab-active' : ''}`}
            onClick={() => setSection(id)}
          >
            {label}
            {unmarked[id] > 0 ? ` (${unmarked[id]})` : ''}
          </button>
        ))}
      </div>

      {section === 'clash' && (
        <>
          <div className="admin-toolbar">
            <span className="admin-stats">
              {clashAnswers.length} answers · {unmarked.clash} unmarked
            </span>
          </div>

          {clashAnswers.length === 0 && (
            <p className="admin-empty-roster">No team clash answers submitted yet.</p>
          )}

          <div className="admin-team-list">
            {teams.map(team => {
              const teamAnswers = clashAnswers.filter(a => a.team_id === team.id);
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
                      const target = teamById.get(a.target_team_id);
                      return (
                        <div key={a.id} className="admin-quiz-row">
                          <div className="admin-quiz-question">
                            <span className="admin-chip">{target?.game_theme ?? 'Unknown cover'}</span>
                            <span className="admin-quiz-question-text">Who is this team?</span>
                          </div>
                          <div className="admin-quiz-answer-line">
                            <span className="admin-quiz-answer-text">
                              {a.answer}
                              <span className="admin-photo-expected">Team: {target?.name ?? '?'}</span>
                            </span>
                            <div className="admin-quiz-marks">
                              <button
                                className={`admin-btn admin-btn-icon admin-mark-btn ${a.is_correct === true ? 'admin-mark-correct' : ''}`}
                                onClick={() => onMarkClash(a, true)}
                                aria-label="Mark correct"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                className={`admin-btn admin-btn-icon admin-mark-btn ${a.is_correct === false ? 'admin-mark-wrong' : ''}`}
                                onClick={() => onMarkClash(a, false)}
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

      {section === 'quiz' && (
        <>
          <div className="admin-toolbar">
            <span className="admin-stats">
              {quizAnswers.length} answers · {unmarked.quiz} unmarked
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
                              onClick={() => onMarkQuiz(a, true)}
                              aria-label="Mark correct"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              className={`admin-btn admin-btn-icon admin-mark-btn ${a.is_correct === false ? 'admin-mark-wrong' : ''}`}
                              onClick={() => onMarkQuiz(a, false)}
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
              {photoAnswers.length} answers · {unmarked.photos} unmarked
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
                                onClick={() => onMarkPhoto(a, 'character_correct', true)}
                                aria-label="Mark character correct"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                className={`admin-btn admin-btn-icon admin-mark-btn ${a.character_correct === false ? 'admin-mark-wrong' : ''}`}
                                onClick={() => onMarkPhoto(a, 'character_correct', false)}
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
                                onClick={() => onMarkPhoto(a, 'game_correct', true)}
                                aria-label="Mark game correct"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                className={`admin-btn admin-btn-icon admin-mark-btn ${a.game_correct === false ? 'admin-mark-wrong' : ''}`}
                                onClick={() => onMarkPhoto(a, 'game_correct', false)}
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
              {anagramAnswers.length} answers · {unmarked.anagrams} unmarked
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
                                onClick={() => onMarkAnagram(a, true)}
                                aria-label="Mark correct"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                className={`admin-btn admin-btn-icon admin-mark-btn ${a.is_correct === false ? 'admin-mark-wrong' : ''}`}
                                onClick={() => onMarkAnagram(a, false)}
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
              {consoleAnswers.length} answers · {unmarked.consoles} unmarked
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
                                onClick={() => onMarkConsole(a, true)}
                                aria-label="Mark correct"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                className={`admin-btn admin-btn-icon admin-mark-btn ${a.is_correct === false ? 'admin-mark-wrong' : ''}`}
                                onClick={() => onMarkConsole(a, false)}
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
              {brainAnswers.length} answers · {unmarked.brain} unmarked
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
                                onClick={() => onMarkBrain(a, true)}
                                aria-label="Mark correct"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                className={`admin-btn admin-btn-icon admin-mark-btn ${a.is_correct === false ? 'admin-mark-wrong' : ''}`}
                                onClick={() => onMarkBrain(a, false)}
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
              {vowelsAnswers.length} answers · {unmarked.vowels} unmarked
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
                                onClick={() => onMarkVowels(a, true)}
                                aria-label="Mark correct"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                className={`admin-btn admin-btn-icon admin-mark-btn ${a.is_correct === false ? 'admin-mark-wrong' : ''}`}
                                onClick={() => onMarkVowels(a, false)}
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
    </>
  );
}
