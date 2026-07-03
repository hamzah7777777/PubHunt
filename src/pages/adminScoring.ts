// Score computation for the admin Scores table and Leaderboards. A point is
// only counted once an admin has marked the answer correct, so scores climb
// as marking progresses.

import { QUESTIONS_PER_QUIZ, QUIZ_COUNT } from './quiz';
import { PHOTO_CHALLENGE } from './photoChallenge';
import { ANAGRAM_CHALLENGE } from './anagramChallenge';
import { CONSOLE_CHALLENGE } from './consoleChallenge';
import { BRAIN_TRAINING_CHALLENGE } from './brainTrainingChallenge';
import { MISSING_VOWELS_CHALLENGE } from './missingVowelsChallenge';
import type {
  AnagramAnswer,
  BrainTrainingAnswer,
  ConsoleAnswer,
  MissingVowelsAnswer,
  PhotoAnswer,
  QuizAnswer,
} from '../types';

export const SECTION_KEYS = ['quiz', 'photos', 'anagrams', 'consoles', 'brain', 'vowels'] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

export const SECTION_LABELS: Record<SectionKey, string> = {
  quiz: 'Pub Quiz',
  photos: 'Photo Challenge : Characters',
  anagrams: 'Anagram Challenge',
  consoles: 'Photo Challenge : Consoles',
  brain: 'Brain Training',
  vowels: 'Missing Vowels',
};

// Compact names for the score table's column headers.
export const SECTION_SHORT_LABELS: Record<SectionKey, string> = {
  quiz: 'Quiz',
  photos: 'Characters',
  anagrams: 'Anagrams',
  consoles: 'Consoles',
  brain: 'Brain',
  vowels: 'Vowels',
};

// Photo answers are worth 2 (character + game); everything else is 1 each.
export const SECTION_MAX: Record<SectionKey, number> = {
  quiz: QUIZ_COUNT * QUESTIONS_PER_QUIZ,
  photos: PHOTO_CHALLENGE.length * 2,
  anagrams: ANAGRAM_CHALLENGE.length,
  consoles: CONSOLE_CHALLENGE.length,
  brain: BRAIN_TRAINING_CHALLENGE.length,
  vowels: MISSING_VOWELS_CHALLENGE.length,
};

export const TOTAL_MAX = SECTION_KEYS.reduce((sum, key) => sum + SECTION_MAX[key], 0);

export interface AnswerSets {
  quiz: QuizAnswer[];
  photos: PhotoAnswer[];
  anagrams: AnagramAnswer[];
  consoles: ConsoleAnswer[];
  brain: BrainTrainingAnswer[];
  vowels: MissingVowelsAnswer[];
}

export type TeamScores = Record<SectionKey, number> & { total: number };

export function computeTeamScores(teamId: string, answers: AnswerSets): TeamScores {
  const quiz = answers.quiz.filter(a => a.team_id === teamId && a.is_correct === true).length;
  const photos = answers.photos.reduce(
    (sum, a) =>
      a.team_id === teamId
        ? sum + (a.character_correct === true ? 1 : 0) + (a.game_correct === true ? 1 : 0)
        : sum,
    0
  );
  const anagrams = answers.anagrams.filter(a => a.team_id === teamId && a.is_correct === true).length;
  const consoles = answers.consoles.filter(a => a.team_id === teamId && a.is_correct === true).length;
  const brain = answers.brain.filter(a => a.team_id === teamId && a.is_correct === true).length;
  const vowels = answers.vowels.filter(a => a.team_id === teamId && a.is_correct === true).length;
  return {
    quiz,
    photos,
    anagrams,
    consoles,
    brain,
    vowels,
    total: quiz + photos + anagrams + consoles + brain + vowels,
  };
}

/**
 * Standard competition ranking over rows already sorted by points
 * descending: tied points share a rank (1, 2, 2, 4, …).
 */
export function withRanks<T>(rows: T[], getPoints: (row: T) => number): (T & { rank: number })[] {
  let prevPoints = Number.NaN;
  let prevRank = 0;
  return rows.map((row, i) => {
    const points = getPoints(row);
    const rank = points === prevPoints ? prevRank : i + 1;
    prevPoints = points;
    prevRank = rank;
    return { ...row, rank };
  });
}
