// Photo Match challenge: 12 video game character photos. Teams name the
// character and the game for each photo (1 mark each, marked by admins).
// The correct answers here are only shown on the admin marking page.

export interface PhotoChallengeItem {
  image: string;
  character: string;
  game: string;
}

export const PHOTO_CHALLENGE: PhotoChallengeItem[] = [
  { image: '/photos/PMC_1.webp', character: 'Ellie', game: 'The Last of Us' },
  { image: '/photos/PMC_2.webp', character: 'Shadow', game: 'Sonic' },
  { image: '/photos/PMC_3.webp', character: 'Peely', game: 'Fortnite' },
  { image: '/photos/PMC_4.webp', character: 'Harvey', game: 'Stardew Valley' },
  { image: '/photos/PMC_5.webp', character: 'Master Chief', game: 'Halo' },
  { image: '/photos/PMC_6.webp', character: 'Lara Croft', game: 'Tomb Raider' },
  { image: '/photos/PMC_7.webp', character: 'Steve', game: 'Minecraft' },
  { image: '/photos/PMC_8.webp', character: 'Link', game: 'The Legend of Zelda' },
  { image: '/photos/PMC_9.webp', character: 'Isabelle', game: 'Animal Crossing' },
  { image: '/photos/PMC_10.webp', character: 'Squirtle', game: 'Pokémon' },
  { image: '/photos/PMC_11.webp', character: 'Franklin Clinton', game: 'GTA 5' },
  { image: '/photos/PMC_12.webp', character: 'Birdo', game: 'Mario' },
];
