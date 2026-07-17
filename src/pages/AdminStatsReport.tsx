// Stats report tab: top-10 rundowns (overall, per route, per challenge),
// the hardest questions, and who was — and wasn't — identified in Team
// Clash. Like the Scores tab, everything only counts answers an admin has
// already marked correct.

import { useMemo } from 'react';
import LeaderboardList from '../components/LeaderboardList';
import { PHOTO_CHALLENGE } from './photoChallenge';
import { ANAGRAM_CHALLENGE } from './anagramChallenge';
import { CONSOLE_CHALLENGE } from './consoleChallenge';
import { BRAIN_TRAINING_CHALLENGE } from './brainTrainingChallenge';
import { MISSING_VOWELS_CHALLENGE } from './missingVowelsChallenge';
import {
  SECTION_KEYS,
  SECTION_LABELS,
  computeTeamScores,
  withRanks,
  type AnswerSets,
  type SectionKey,
  type TeamScores,
} from './adminScoring';
import type { AdminTeam } from '../types';

interface Props {
  teams: AdminTeam[];
  answers: AnswerSets;
}

// Every challenge except the pub Route Quiz.
const CHALLENGE_KEYS = SECTION_KEYS.filter(key => key !== 'quiz');

const GUESS_UNIT = { one: 'guess', many: 'guesses' };

interface QuestionStat {
  label: string;
  correct: number;
  answered: number;
}

// One entry per markable question across every challenge except the Route
// Quiz (and Team Clash, which gets its own guessed/not-guessed lists).
function questionStats(answers: AnswerSets): QuestionStat[] {
  const stats: QuestionStat[] = [];
  PHOTO_CHALLENGE.forEach((item, i) => {
    const n = i + 1;
    const rows = answers.photos.filter(a => a.photo_number === n);
    stats.push({
      label: `Characters ${n}: character (${item.character})`,
      correct: rows.filter(a => a.character_correct === true).length,
      answered: rows.length,
    });
    stats.push({
      label: `Characters ${n}: game (${item.game})`,
      correct: rows.filter(a => a.game_correct === true).length,
      answered: rows.length,
    });
  });
  ANAGRAM_CHALLENGE.forEach((item, i) => {
    const n = i + 1;
    const rows = answers.anagrams.filter(a => a.anagram_number === n);
    stats.push({
      label: `Anagram ${n}: “${item.anagram}” (${item.game})`,
      correct: rows.filter(a => a.is_correct === true).length,
      answered: rows.length,
    });
  });
  CONSOLE_CHALLENGE.forEach((item, i) => {
    const n = i + 1;
    const rows = answers.consoles.filter(a => a.console_number === n);
    stats.push({
      label: `Console ${n}: ${item.console}`,
      correct: rows.filter(a => a.is_correct === true).length,
      answered: rows.length,
    });
  });
  BRAIN_TRAINING_CHALLENGE.forEach((item, i) => {
    const n = i + 1;
    const rows = answers.brain.filter(a => a.question_number === n);
    stats.push({
      label: `Brain Training ${n}: ${item.question} (${item.answer})`,
      correct: rows.filter(a => a.is_correct === true).length,
      answered: rows.length,
    });
  });
  MISSING_VOWELS_CHALLENGE.forEach((item, i) => {
    const n = i + 1;
    const rows = answers.vowels.filter(a => a.puzzle_number === n);
    stats.push({
      label: `Missing Vowels ${n}: ${item.puzzle} (${item.answer})`,
      correct: rows.filter(a => a.is_correct === true).length,
      answered: rows.length,
    });
  });
  return stats;
}

export default function AdminStatsReport({ teams, answers }: Props) {
  const scoresById = useMemo(
    () => new Map<string, TeamScores>(teams.map(t => [t.id, computeTeamScores(t.id, answers)])),
    [teams, answers]
  );

  const top10 = (pool: AdminTeam[], key: SectionKey | 'total') =>
    withRanks(
      pool
        .map(t => ({ name: t.name, points: scoresById.get(t.id)?.[key] ?? 0 }))
        .filter(r => r.points > 0)
        .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))
        .slice(0, 10),
      r => r.points
    );

  // Fewest marked-correct first; among ties the most-attempted question is
  // the more notable failure, so it sorts first (an unanswered question
  // ranks below one everyone tried and got wrong).
  const hardestQuestions = useMemo(() => {
    const stats = questionStats(answers);
    if (!stats.some(q => q.answered > 0)) return [];
    return stats
      .sort(
        (a, b) => a.correct - b.correct || b.answered - a.answered || a.label.localeCompare(b.label)
      )
      .slice(0, 3);
  }, [answers]);

  // How often each team was correctly identified by the others in Team
  // Clash. Withdrawn teams aren't clash targets (see get_clash_targets),
  // so they're left out rather than showing up as never-guessed.
  const guessCounts = teams
    .filter(t => t.status !== 'withdrawn')
    .map(t => ({
      name: t.name,
      points: answers.clash.filter(a => a.target_team_id === t.id && a.is_correct === true).length,
    }));

  const mostGuessed = withRanks(
    guessCounts
      .filter(r => r.points > 0)
      .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))
      .slice(0, 10),
    r => r.points
  );

  const leastGuessed = withRanks(
    [...guessCounts]
      .sort((a, b) => a.points - b.points || a.name.localeCompare(b.name))
      .slice(0, 10),
    r => r.points
  );

  return (
    <>
      <div className="admin-toolbar">
        <span className="admin-stats">
          Points count answers marked correct · top 10 per list
        </span>
      </div>

      <div className="admin-lb-grid">
        <div className="admin-lb-card admin-lb-overall">
          <h3>Top 10 Overall</h3>
          <LeaderboardList rows={top10(teams, 'total')} />
        </div>

        {(['A', 'B'] as const).map(route => (
          <div key={route} className="admin-lb-card">
            <h3>Top 10 — Route {route}</h3>
            <LeaderboardList rows={top10(teams.filter(t => t.route === route), 'total')} />
          </div>
        ))}

        <div className="admin-lb-card">
          <h3>3 Hardest Questions</h3>
          <p className="admin-report-note">
            Fewest correct answers across every challenge except the Route Quiz.
          </p>
          {hardestQuestions.length === 0 ? (
            <p className="admin-empty-roster">No answers submitted yet.</p>
          ) : (
            <ol className="admin-hardq-list">
              {hardestQuestions.map(q => (
                <li key={q.label} className="admin-hardq-row">
                  <span className="admin-hardq-label">{q.label}</span>
                  <span className="admin-hardq-counts">
                    {q.correct} correct · {q.answered} answered
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="admin-lb-card">
          <h3>Team Clash — Most Identified</h3>
          <p className="admin-report-note">Teams other teams guessed correctly most often.</p>
          <LeaderboardList
            rows={mostGuessed}
            unit={GUESS_UNIT}
            emptyText="No correct guesses yet."
          />
        </div>

        <div className="admin-lb-card">
          <h3>Team Clash — Best Kept Secret</h3>
          <p className="admin-report-note">Teams the fewest other teams guessed correctly.</p>
          <LeaderboardList rows={leastGuessed} unit={GUESS_UNIT} emptyText="No teams yet." />
        </div>

        {CHALLENGE_KEYS.map(key => (
          <div key={key} className="admin-lb-card">
            <h3>Top 10 — {SECTION_LABELS[key]}</h3>
            <LeaderboardList rows={top10(teams, key)} />
          </div>
        ))}
      </div>
    </>
  );
}
