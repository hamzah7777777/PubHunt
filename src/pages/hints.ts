// Route-specific pub hints. Both routes share the start point and finish
// line; the four pubs in between differ per route. Teams only ever see
// their own route's hints. NOTE: keep the pub names out of this file (and
// the bundle) — the name is the answer to each riddle. The start point is
// the exception: it has no hint, everyone is told where it is.

export interface PubHint {
  label: string;
  time: string;
  hint: string;
}

export const START_POINT = {
  name: 'HSBC Grosvenor House',
  time: '4.30pm – 6pm',
};

export const FINISH_HINT: PubHint = {
  label: 'Finish Line',
  time: '10pm – late',
  hint: 'To defeat the final boss, you need this lucky charm',
};

export const ROUTE_HINTS: Record<'A' | 'B', PubHint[]> = {
  A: [
    {
      label: 'First Pub',
      time: '6pm – 7pm',
      hint: 'You build a one storey house in The Sims, but sadly something grizzly makes itself at home',
    },
    {
      label: 'Second Pub',
      time: '7pm – 8pm',
      hint: 'To pass this level you need to think outside…',
    },
    {
      label: 'Third Pub',
      time: '8pm – 9pm',
      hint: "Gabe Newell's job title",
    },
    {
      label: 'Fourth Pub',
      time: '9pm – 10pm',
      hint: 'Your health is low, you need to get your ___ back before the final battle',
    },
  ],
  B: [
    {
      label: 'First Pub',
      time: '6pm – 7pm',
      hint: 'You need help online for completing a game level… where do you go?',
    },
    {
      label: 'Second Pub',
      time: '7pm – 8pm',
      hint: 'Lunch for Sonic the Hedgehog and a Rabbid Rabbit',
    },
    {
      label: 'Third Pub',
      time: '8pm – 9pm',
      hint: "To get to the next level you need to go through a portal that's FAR away",
    },
    {
      label: 'Fourth Pub',
      time: '9pm – 10pm',
      hint: 'Join: Your mATES',
    },
  ],
};
