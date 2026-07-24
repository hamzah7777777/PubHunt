import { Camera, Gamepad2, KeyRound, ListOrdered, Trophy } from 'lucide-react';
import './ShowcaseNav.css';

// Shared cross-navigation for the four public showcase pages (Awards, Full
// Leaderboard, Answer Key, Photo Gallery). Each page drops this in its footer
// with its own `current` id; the buttons to the other three pages (plus Main
// Site) render in a consistent, colour-coded row so every page reaches every
// other page. A destination only shows if its handler is provided.

export type ShowcasePage = 'awards' | 'leaderboard' | 'answers' | 'gallery';

interface Props {
  current: ShowcasePage;
  onMainSite: () => void;
  onAwards?: () => void;
  onLeaderboard?: () => void;
  onAnswers?: () => void;
  onGallery?: () => void;
}

const LINKS: { key: ShowcasePage; label: string; Icon: typeof Trophy; cls: string }[] = [
  { key: 'awards', label: 'The Awards', Icon: Trophy, cls: 'snav-awards' },
  { key: 'leaderboard', label: 'Full Leaderboard', Icon: ListOrdered, cls: 'snav-leaderboard' },
  { key: 'answers', label: 'Answer Key', Icon: KeyRound, cls: 'snav-answers' },
  { key: 'gallery', label: 'Photo Gallery', Icon: Camera, cls: 'snav-gallery' },
];

export default function ShowcaseNav({ current, onMainSite, onAwards, onLeaderboard, onAnswers, onGallery }: Props) {
  const handlers: Record<ShowcasePage, (() => void) | undefined> = {
    awards: onAwards,
    leaderboard: onLeaderboard,
    answers: onAnswers,
    gallery: onGallery,
  };

  return (
    <section className="snav">
      <span className="snav-kicker">More from Pub Hunt 2026</span>
      <div className="snav-grid">
        {LINKS.map(l => {
          const handler = handlers[l.key];
          if (l.key === current || !handler) return null;
          const Icon = l.Icon;
          return (
            <button key={l.key} className={`btn btn-lg snav-btn ${l.cls}`} onClick={handler}>
              <Icon size={18} /> {l.label}
            </button>
          );
        })}
        <button className="btn btn-lg snav-btn snav-main" onClick={onMainSite}>
          <Gamepad2 size={18} /> Main Site
        </button>
      </div>
    </section>
  );
}
