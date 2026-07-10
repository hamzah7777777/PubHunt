// Video Game Console challenge: 6 console photos. Teams name the console
// (1 mark each, marked by admins). The correct answers here are only shown
// on the admin marking page.

export interface ConsoleChallengeItem {
  image: string;
  console: string;
}

export const CONSOLE_CHALLENGE: ConsoleChallengeItem[] = [
  { image: '/consoles/VGCC_1.png', console: 'PSP / PlayStation Portable' },
  { image: '/consoles/VGCC_2.png', console: 'Sega Genesis / Mega Drive' },
  { image: '/consoles/VGCC_3.png', console: 'Atari 2600' },
  { image: '/consoles/VGCC_4.png', console: 'Nintendo 64' },
  { image: '/consoles/VGCC_5.png', console: 'Wii' },
  { image: '/consoles/VGCC_6.png', console: 'Nintendo GameCube' },
];
