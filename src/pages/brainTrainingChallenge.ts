// Brain Training challenge: video game knowledge trivia (1 mark each,
// marked by admins). The correct answers here are only shown on the admin
// marking page.

export interface BrainTrainingItem {
  question: string;
  answer: string;
}

export const BRAIN_TRAINING_CHALLENGE: BrainTrainingItem[] = [
  {
    question: 'What was the first video game to be played in space?',
    answer: 'Tetris',
  },
  {
    question: 'Pac-Man was designed to resemble which food?',
    answer: 'Pizza',
  },
  {
    question: 'What was the first video game created for commercial release?',
    answer: 'Computer Space',
  },
  {
    question: 'What movie inspired the video game Among Us?',
    answer: 'The Thing',
  },
  {
    question: "What is the agent number of Hitman's main character?",
    answer: '47',
  },
  {
    question: 'What colour is the Mario Kart shell that finds the player in first place and explodes around them?',
    answer: 'Blue',
  },
  {
    question: "In the original Pac-Man, the ghosts' names were Blinky, Inky, Pinky and…?",
    answer: 'Clyde',
  },
  {
    question: 'As of February 2026, what is the best-selling console of all time?',
    answer: 'PlayStation 2',
  },
];
