// Photo Match challenge: 12 video game character photos. Teams name the
// character and the game for each photo (1 mark each, marked by admins).
// The correct answers here are only shown on the admin marking page.

export interface PhotoChallengeItem {
  image: string;
  character: string;
  game: string;
}

export const PHOTO_CHALLENGE: PhotoChallengeItem[] = [
  { image: '/photos/PMC_1.jpg', character: 'Ellie', game: 'The Last of Us' },
  { image: '/photos/PMC_2.jpg', character: 'Shadow', game: 'Sonic' },
  { image: '/photos/PMC_3.jpg', character: 'Peely', game: 'Fortnite' },
  { image: '/photos/PMC_4.jpg', character: 'Harvey', game: 'Stardew Valley' },
  { image: '/photos/PMC_5.jpg', character: 'Master Chief', game: 'Halo' },
  { image: '/photos/PMC_6.jpg', character: 'Lara Croft', game: 'Tomb Raider' },
  { image: '/photos/PMC_7.jpg', character: 'Steve', game: 'Minecraft' },
  { image: '/photos/PMC_8.jpg', character: 'Link', game: 'The Legend of Zelda' },
  { image: '/photos/PMC_9.jpg', character: 'Isabelle', game: 'Animal Crossing' },
  { image: '/photos/PMC_10.jpg', character: 'Squirtle', game: 'Pokémon' },
  { image: '/photos/PMC_11.jpg', character: 'Franklin Clinton', game: 'GTA 5' },
  { image: '/photos/PMC_12.jpg', character: 'Birdo', game: 'Mario' },
];
