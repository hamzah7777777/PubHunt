// Route-specific quiz questions: 4 quizzes per route (one per pub — the
// start point and finish line have none) with 3 questions each. The
// answers are shown only on the admin marking page (like the other
// challenges' keys they do ship in the bundle — accepted trade-off).
// NOTE: keep PUB NAMES out of this file — the name is each hint's answer.

export const QUIZ_COUNT = 4;
export const QUESTIONS_PER_QUIZ = 3;

export const ROUTE_QUIZZES: Record<'A' | 'B', string[][]> = {
  A: [
    [
      'How many globes are there on the shelf?',
      'Before it was a bar, what purpose did the building serve?',
      'What airport codes can be found on the wall?',
    ],
    [
      'How many toppings can you add to make your burger your own way?',
      "Where can't you dance?",
      'What group can you join at 17:45 on a Tuesday?',
    ],
    [
      'What day is the pub quiz?',
      'What three letter word is spelt out using framed prints?',
      'Which artist painted the lioness in Tudor Square?',
    ],
    [
      'Question to be confirmed',
      'Question to be confirmed',
      'Question to be confirmed',
    ],
  ],
  B: [
    [
      'What percent discount do you get with a Pledge Student Card?',
      'How many barrels are used as tables in the outside area?',
      'What award did they win at the 2026 Best Bar None awards?',
    ],
    [
      'What is the snap-o-matic?',
      'Which cocktail is named after a famous singer?',
      'How many Pornstar Martinis are on a martini tree?',
    ],
    [
      'Which artist painted the lion outside the pub?',
      'What architectural feature links this building to HSBC?',
      'When did they win Pub of the Month?',
    ],
    [
      'How many sports are referenced in the window art?',
      'What year was it founded?',
      'How many extra topping options are there to pimp your burger?',
    ],
  ],
};

// Expected answers, same shape as ROUTE_QUIZZES; shown on the marking page.
export const ROUTE_QUIZ_ANSWERS: Record<'A' | 'B', string[][]> = {
  A: [
    ['7', 'Fire Station', 'Mexico City International, Sydney Kingsford Smith and London Heathrow'],
    ['8', 'The tables', 'Run club'],
    ['Wednesday', 'Ale', "Lisa O'Hara"],
    ['TBC', 'TBC', 'TBC'],
  ],
  B: [
    ['20%', '5', 'Best Bar/Late Bar'],
    ['Photobooth', 'Swiftie', '9'],
    ["Lisa O'Hara", 'Bank Vault', 'June 2026'],
    ['7', '1884', '8'],
  ],
};
