// Anagram challenge (Round 2): each anagram unscrambles to a video game
// name (1 mark each, marked by admins). The correct answers here are only
// shown on the admin marking page.

export interface AnagramChallengeItem {
  anagram: string;
  game: string;
}

export const ANAGRAM_CHALLENGE: AnagramChallengeItem[] = [
  { anagram: 'Big Arena', game: 'Brain Age' },
  { anagram: 'Maid Robert', game: 'Tomb Raider' },
  { anagram: 'Karma Tomb Lot', game: 'Mortal Kombat' },
  { anagram: 'Accordion Baths', game: 'Crash Bandicoot' },
  { anagram: 'Register Theft', game: 'Street Fighter' },
  { anagram: 'Map can', game: 'Pac Man' },
  { anagram: 'Godfather Taunt', game: 'Grand Theft Auto' },
  { anagram: 'Fat Sly Fan Ian', game: 'Final Fantasy' },
];
