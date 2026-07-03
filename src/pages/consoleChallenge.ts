// Video Game Console challenge: 6 console photos. Teams name the console
// (1 mark each, marked by admins). The correct answers here are only shown
// on the admin marking page.

export interface ConsoleChallengeItem {
  image: string;
  console: string;
}

export const CONSOLE_CHALLENGE: ConsoleChallengeItem[] = [
  { image: '/consoles/VGCC_1.jpg', console: 'PSP / PlayStation Portable' },
  { image: '/consoles/VGCC_2.jpg', console: 'Sega Genesis / Mega Drive' },
  { image: '/consoles/VGCC_3.jpg', console: 'Atari 2600' },
  { image: '/consoles/VGCC_4.jpg', console: 'Nintendo 64' },
  { image: '/consoles/VGCC_5.jpg', console: 'Wii' },
  { image: '/consoles/VGCC_6.jpg', console: 'Nintendo GameCube' },
];
