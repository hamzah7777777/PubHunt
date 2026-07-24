// Low-poly character heads used for the drifting floating-heads background on
// the public showcase pages (Awards, Full Leaderboard, Answer Key, Gallery).
// The images live in public/braintrainer/ (braintrainer1.webp … 17.webp).

const FACE_COUNT = 17;

export const FLOATING_HEAD_FACES = Array.from(
  { length: FACE_COUNT },
  (_, i) => `/braintrainer/braintrainer${i + 1}.webp`
);
