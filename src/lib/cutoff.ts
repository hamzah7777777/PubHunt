// Hard frontend deadline: answer submissions close at 11:30pm UK time on
// Thursday 16 July 2026 (BST = UTC+1 — the offset in the string makes this
// correct whatever timezone the player's phone is set to). Teams can still
// browse the site and look over their saved answers; only submitting is
// blocked.
export const SUBMISSION_CUTOFF_MS = Date.parse('2026-07-16T23:30:00+01:00');

export function isPastCutoff(): boolean {
  return Date.now() >= SUBMISSION_CUTOFF_MS;
}

// App registers the popup opener here so the challenge/quiz pages can raise
// the "thanks for playing" popup without threading a prop into every page.
let openPopup: (() => void) | null = null;

export function registerCutoffPopup(open: () => void): () => void {
  openPopup = open;
  return () => {
    openPopup = null;
  };
}

/**
 * Call at the top of every submit handler: returns true while submissions
 * are still open; after the cutoff it shows the popup and returns false.
 */
export function allowSubmit(): boolean {
  if (!isPastCutoff()) return true;
  openPopup?.();
  return false;
}
