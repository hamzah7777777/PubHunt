// Route-specific quiz questions. Each route has 5 quizzes (one per stop)
// with 3 questions each. All placeholders for now — replace the strings
// below with the real questions.

export const QUIZ_COUNT = 5;
export const QUESTIONS_PER_QUIZ = 3;

export const ROUTE_QUIZZES: Record<'A' | 'B', string[][]> = {
  A: [
    ['Route A Quiz 1 — Q1 (placeholder)', 'Route A Quiz 1 — Q2 (placeholder)', 'Route A Quiz 1 — Q3 (placeholder)'],
    ['Route A Quiz 2 — Q1 (placeholder)', 'Route A Quiz 2 — Q2 (placeholder)', 'Route A Quiz 2 — Q3 (placeholder)'],
    ['Route A Quiz 3 — Q1 (placeholder)', 'Route A Quiz 3 — Q2 (placeholder)', 'Route A Quiz 3 — Q3 (placeholder)'],
    ['Route A Quiz 4 — Q1 (placeholder)', 'Route A Quiz 4 — Q2 (placeholder)', 'Route A Quiz 4 — Q3 (placeholder)'],
    ['Route A Quiz 5 — Q1 (placeholder)', 'Route A Quiz 5 — Q2 (placeholder)', 'Route A Quiz 5 — Q3 (placeholder)'],
  ],
  B: [
    ['Route B Quiz 1 — Q1 (placeholder)', 'Route B Quiz 1 — Q2 (placeholder)', 'Route B Quiz 1 — Q3 (placeholder)'],
    ['Route B Quiz 2 — Q1 (placeholder)', 'Route B Quiz 2 — Q2 (placeholder)', 'Route B Quiz 2 — Q3 (placeholder)'],
    ['Route B Quiz 3 — Q1 (placeholder)', 'Route B Quiz 3 — Q2 (placeholder)', 'Route B Quiz 3 — Q3 (placeholder)'],
    ['Route B Quiz 4 — Q1 (placeholder)', 'Route B Quiz 4 — Q2 (placeholder)', 'Route B Quiz 4 — Q3 (placeholder)'],
    ['Route B Quiz 5 — Q1 (placeholder)', 'Route B Quiz 5 — Q2 (placeholder)', 'Route B Quiz 5 — Q3 (placeholder)'],
  ],
};
