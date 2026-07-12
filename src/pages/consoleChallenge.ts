// Video Game Console challenge: 6 console photos. Teams name the console
// (1 mark each, marked by admins). The correct answers here are only shown
// on the admin marking page.

export interface ConsoleChallengeItem {
  image: string;
  console: string;
}

export const CONSOLE_CHALLENGE: ConsoleChallengeItem[] = [
  { image: '/consoles/VGCC_1.webp', console: 'PSP / PlayStation Portable' },
  { image: '/consoles/VGCC_2.webp', console: 'Sega Genesis / Mega Drive' },
  { image: '/consoles/VGCC_3.webp', console: 'Atari 2600' },
  { image: '/consoles/VGCC_4.webp', console: 'Nintendo 64' },
  { image: '/consoles/VGCC_5.webp', console: 'Wii' },
  { image: '/consoles/VGCC_6.webp', console: 'Nintendo GameCube' },
];
