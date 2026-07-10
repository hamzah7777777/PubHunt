// Photo Match challenge: 12 video game character photos. Teams name the
// character and the game for each photo (1 mark each, marked by admins).
// The correct answers here are only shown on the admin marking page.

export interface PhotoChallengeItem {
  image: string;
  character: string;
  game: string;
}

export const PHOTO_CHALLENGE: PhotoChallengeItem[] = [
  { image: '/photos/PMC_1.png', character: 'Ellie', game: 'The Last of Us' },
  { image: '/photos/PMC_2.png', character: 'Shadow', game: 'Sonic' },
  { image: '/photos/PMC_3.png', character: 'Peely', game: 'Fortnite' },
  { image: '/photos/PMC_4.png', character: 'Harvey', game: 'Stardew Valley' },
  { image: '/photos/PMC_5.png', character: 'Master Chief', game: 'Halo' },
  { image: '/photos/PMC_6.png', character: 'Lara Croft', game: 'Tomb Raider' },
  { image: '/photos/PMC_7.png', character: 'Steve', game: 'Minecraft' },
  { image: '/photos/PMC_8.png', character: 'Link', game: 'The Legend of Zelda' },
  { image: '/photos/PMC_9.png', character: 'Isabelle', game: 'Animal Crossing' },
  { image: '/photos/PMC_10.png', character: 'Squirtle', game: 'Pokémon' },
  { image: '/photos/PMC_11.png', character: 'Franklin Clinton', game: 'GTA 5' },
  { image: '/photos/PMC_12.png', character: 'Birdo', game: 'Mario' },
];
