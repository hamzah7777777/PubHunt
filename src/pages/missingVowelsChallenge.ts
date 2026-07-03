// Missing Vowels challenge: two video game names mashed together with the
// vowels removed (1 mark each, marked by admins). The correct answers here
// are only shown on the admin marking page.

export interface MissingVowelsItem {
  puzzle: string;
  answer: string;
}

// Shown to teams as a worked example in the page header.
export const MISSING_VOWELS_EXAMPLE = {
  puzzle: 'GRNTRSMRTLKMBT',
  answer: 'Gran Turismo Mortal Kombat',
};

export const MISSING_VOWELS_CHALLENGE: MissingVowelsItem[] = [
  { puzzle: 'FFLLT', answer: 'FIFA Fallout' },
  { puzzle: 'PKMNCRFT', answer: 'Pikmin Minecraft' },
  { puzzle: 'BLDRSGTTRS', answer: "Baldur's Gate Tetris" },
  { puzzle: 'TMPLRNCHRTD', answer: 'Temple Run Uncharted' },
  { puzzle: 'LNRDDDRDMPTN', answer: 'LA Noire Red Dead Redemption' },
  { puzzle: 'THLGNDFZLDRKSLS', answer: 'The Legend of Zelda Dark Souls' },
  { puzzle: 'STRTFGHTRRR', answer: 'Street Fighter Terraria' },
  { puzzle: 'FRTNTKKN', answer: 'Fortnite Tekken' },
];
