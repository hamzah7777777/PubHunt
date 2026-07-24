import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Camera, ChevronLeft, ChevronRight, Gamepad2, Shuffle, Sparkles, X } from 'lucide-react';
import FloatingHeads from '../components/FloatingHeads';
import ShowcaseNav from '../components/ShowcaseNav';
import './Gallery.css';

// Standalone photo gallery for the 2026 Pub Hunt after-party at The Four Leaf,
// reachable at /Gallery (or /#Gallery) and linked from the awards page. The
// images live in public/gallery/ as optimised webp in two tiers (thumbs for
// the masonry grid, large for the lightbox); public/gallery/manifest.json
// lists every photo with its dimensions, generated from EventPhotos/.

interface Photo {
  id: string;
  w: number;
  h: number;
}

const thumbSrc = (id: string) => `/gallery/thumbs/${id}.webp`;
const largeSrc = (id: string) => `/gallery/large/${id}.webp`;

// Deterministic-ish shuffle (Fisher–Yates). Fun re-order of the grid.
function shuffled<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Props {
  onExit: () => void;
  onBackToAwards: () => void;
  onOpenLeaderboard: () => void;
  onOpenAnswers: () => void;
}

export default function Gallery({ onExit, onBackToAwards, onOpenLeaderboard, onOpenAnswers }: Props) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [order, setOrder] = useState<Photo[]>([]);
  // Position within `order` of the open lightbox photo, or null when closed.
  const [pos, setPos] = useState<number | null>(null);

  useEffect(() => {
    const prev = document.title;
    document.title = 'Pub Hunt 2026 — Photo Gallery';
    window.scrollTo(0, 0);
    let cancelled = false;
    fetch('/gallery/manifest.json')
      .then(r => r.json())
      .then((data: Photo[]) => {
        if (cancelled) return;
        setPhotos(data);
        setOrder(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      document.title = prev;
    };
  }, []);

  const close = useCallback(() => setPos(null), []);
  const step = useCallback(
    (dir: number) => setPos(p => (p === null ? p : (p + dir + order.length) % order.length)),
    [order.length]
  );

  // Keyboard controls + neighbour preloading while the lightbox is open.
  useEffect(() => {
    if (pos === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    for (const d of [1, -1]) {
      const n = order[(pos + d + order.length) % order.length];
      if (n) new Image().src = largeSrc(n.id);
    }
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [pos, order, close, step]);

  const current = pos !== null ? order[pos] : null;

  return (
    <div className="gal-root">
      <FloatingHeads />
      <header className="gal-header">
        <button className="gal-header-logo" onClick={onExit} aria-label="Back to Pub Hunt">
          <Gamepad2 size={22} />
          <span>PUB<span>HUNT</span></span>
        </button>
        <button className="btn btn-sm gal-back" onClick={onBackToAwards}>
          <ArrowLeft size={14} /> Awards
        </button>
      </header>

      <div className="gal-container">
        <section className="gal-hero">
          <Sparkles className="gal-hero-spark gal-hero-spark-1" size={18} />
          <Sparkles className="gal-hero-spark gal-hero-spark-2" size={14} />
          <div className="gal-hero-badge">
            <Camera size={30} />
          </div>
          <span className="kicker kicker-white">The Four Leaf · Pub Hunt 2026</span>
          <h1 className="gal-hero-title">PHOTO GALLERY</h1>
          <p className="gal-hero-sub">
            Every creeper, Princess Peach and lemming from the biggest night of the year.
          </p>
          <div className="gal-toolbar">
            <span className="gal-count">
              <Camera size={14} /> {photos.length} photos
            </span>
            <button className="btn btn-sm gal-shuffle" onClick={() => setOrder(o => shuffled(o))} disabled={!photos.length}>
              <Shuffle size={14} /> Shuffle
            </button>
          </div>
        </section>

        {order.length === 0 ? (
          <p className="gal-loading">Loading the good times…</p>
        ) : (
          <div className="gal-grid">
            {order.map((p, i) => (
              <button
                key={p.id}
                className={`gal-tile gal-a${i % 3}`}
                style={{ animationDelay: `${(i % 14) * 45}ms` }}
                onClick={() => setPos(i)}
                aria-label={`Open photo ${i + 1}`}
              >
                <img
                  src={thumbSrc(p.id)}
                  width={p.w}
                  height={p.h}
                  loading="lazy"
                  decoding="async"
                  alt={`Pub Hunt 2026 photo ${i + 1}`}
                />
              </button>
            ))}
          </div>
        )}

        {/* Cross-navigation to the other public showcase pages. */}
        <ShowcaseNav
          current="gallery"
          onMainSite={onExit}
          onAwards={onBackToAwards}
          onLeaderboard={onOpenLeaderboard}
          onAnswers={onOpenAnswers}
        />
      </div>

      {current && (
        <div className="gal-lightbox" onClick={close} role="dialog" aria-modal="true">
          <button className="gal-lb-btn gal-lb-close" onClick={close} aria-label="Close">
            <X size={22} />
          </button>
          <span className="gal-lb-counter">
            {pos! + 1} / {order.length}
          </span>
          <button
            className="gal-lb-btn gal-lb-nav gal-lb-prev"
            onClick={e => {
              e.stopPropagation();
              step(-1);
            }}
            aria-label="Previous photo"
          >
            <ChevronLeft size={30} />
          </button>
          <img
            key={current.id}
            className="gal-lb-img"
            src={largeSrc(current.id)}
            alt={`Pub Hunt 2026 photo ${pos! + 1}`}
            onClick={e => e.stopPropagation()}
          />
          <button
            className="gal-lb-btn gal-lb-nav gal-lb-next"
            onClick={e => {
              e.stopPropagation();
              step(1);
            }}
            aria-label="Next photo"
          >
            <ChevronRight size={30} />
          </button>
        </div>
      )}
    </div>
  );
}
