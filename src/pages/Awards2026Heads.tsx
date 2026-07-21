import { useEffect, useRef } from 'react';

// A decorative background for the Awards page: low-poly character heads drift
// around the screen, bouncing off the viewport edges and off each other with
// simple elastic collisions — a playful "gaming" backdrop behind the content.
//
// The layer lives inside .aw-root (so it paints above the page background but
// behind the content panels) yet tracks the viewport: each frame it is shifted
// by the current scroll offset and sized to the window, so the heads always
// bounce within the visible screen no matter how far the page is scrolled.
// (A plain position:fixed can't be used here because .aw-root keeps a transform
// after its entrance animation, which would trap "fixed" inside it.)

interface Sprite {
  x: number; // top-left within the arena, px
  y: number;
  vx: number; // px per second
  vy: number;
  r: number; // collision radius (heads are treated as circles)
  el: HTMLImageElement | null;
}

export default function Awards2026Heads({ faces, count = 14 }: { faces: string[]; count?: number }) {
  const arenaRef = useRef<HTMLDivElement | null>(null);
  const spritesRef = useRef<Sprite[]>([]);
  const rafRef = useRef(0);

  // Pick the heads once so the set stays stable across renders. Repeat the
  // face list if we want more heads than there are distinct images.
  const pickRef = useRef<string[]>([]);
  if (pickRef.current.length === 0 && faces.length > 0) {
    const shuffled = [...faces].sort(() => Math.random() - 0.5);
    pickRef.current = Array.from({ length: count }, (_, i) => shuffled[i % shuffled.length]);
    spritesRef.current = pickRef.current.map(() => ({ x: 0, y: 0, vx: 0, vy: 0, r: 40, el: null }));
  }

  useEffect(() => {
    const arena = arenaRef.current;
    const sprites = spritesRef.current;
    if (!arena || sprites.length === 0) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    let W = arena.clientWidth;
    let H = window.innerHeight;
    arena.style.height = `${H}px`;

    // Heads scale down a touch on small screens so they don't dominate.
    const scale = W < 640 ? 0.62 : 1;

    // Scatter the heads over a jittered grid so they start spread across the
    // whole screen (pure random tends to clump them into one corner), each
    // with a random size and heading.
    const n = sprites.length;
    const cols = Math.max(1, Math.round(Math.sqrt(n * (W / H))));
    const rows = Math.ceil(n / cols);
    const cellW = W / cols;
    const cellH = H / rows;
    sprites.forEach((s, i) => {
      s.r = rand(30, 52) * scale;
      const size = s.r * 2;
      const cx = (i % cols) * cellW + cellW * rand(0.25, 0.75);
      const cy = Math.floor(i / cols) * cellH + cellH * rand(0.25, 0.75);
      s.x = Math.min(Math.max(0, cx - s.r), Math.max(0, W - size));
      s.y = Math.min(Math.max(0, cy - s.r), Math.max(0, H - size));
      const speed = reduce ? 0 : rand(34, 74);
      const ang = rand(0, Math.PI * 2);
      s.vx = Math.cos(ang) * speed;
      s.vy = Math.sin(ang) * speed;
      if (s.el) {
        s.el.style.width = `${size}px`;
        s.el.style.height = `${size}px`;
        s.el.style.transform = `translate(${s.x}px, ${s.y}px)`;
      }
    });

    // Respect reduced-motion: leave the heads scattered but still (still keep
    // the layer aligned to the viewport in case the page is scrolled).
    if (reduce) {
      arena.style.transform = `translateY(${window.scrollY}px)`;
      return;
    }

    let last = performance.now();
    const step = (now: number) => {
      // Clamp dt so a backgrounded tab doesn't teleport everything on return.
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      // Keep the arena pinned to the current viewport as the page scrolls.
      arena.style.transform = `translateY(${window.scrollY}px)`;

      // Move + bounce off the four walls.
      for (const s of sprites) {
        const size = s.r * 2;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        if (s.x <= 0) { s.x = 0; s.vx = Math.abs(s.vx); }
        else if (s.x + size >= W) { s.x = W - size; s.vx = -Math.abs(s.vx); }
        if (s.y <= 0) { s.y = 0; s.vy = Math.abs(s.vy); }
        else if (s.y + size >= H) { s.y = H - size; s.vy = -Math.abs(s.vy); }
      }

      // Pairwise collisions, resolved as equal-mass elastic bounces.
      for (let i = 0; i < sprites.length; i++) {
        for (let j = i + 1; j < sprites.length; j++) {
          const a = sprites[i];
          const b = sprites[j];
          const acx = a.x + a.r, acy = a.y + a.r;
          const bcx = b.x + b.r, bcy = b.y + b.r;
          let dx = bcx - acx, dy = bcy - acy;
          let dist = Math.hypot(dx, dy);
          const minDist = a.r + b.r;
          if (dist === 0) { dx = 0.01; dy = 0; dist = 0.01; }
          if (dist >= minDist) continue;

          const nx = dx / dist, ny = dy / dist;
          // Push the pair apart so they don't stick together.
          const overlap = (minDist - dist) / 2;
          a.x -= nx * overlap; a.y -= ny * overlap;
          b.x += nx * overlap; b.y += ny * overlap;
          // Only swap velocity if they're actually closing in.
          const vn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (vn < 0) {
            a.vx += vn * nx; a.vy += vn * ny;
            b.vx -= vn * nx; b.vy -= vn * ny;
          }
        }
      }

      for (const s of sprites) {
        if (s.el) s.el.style.transform = `translate(${s.x}px, ${s.y}px)`;
      }

      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);

    // Keep the arena's width/height and the heads in sync with the viewport.
    const onResize = () => {
      W = arena.clientWidth;
      H = window.innerHeight;
      arena.style.height = `${H}px`;
      for (const s of sprites) {
        const size = s.r * 2;
        s.x = Math.min(Math.max(0, s.x), Math.max(0, W - size));
        s.y = Math.min(Math.max(0, s.y), Math.max(0, H - size));
      }
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
    };
  }, [faces, count]);

  return (
    <div className="aw-heads" ref={arenaRef} aria-hidden="true">
      {pickRef.current.map((src, i) => (
        <img
          key={i}
          src={src}
          alt=""
          draggable={false}
          ref={el => {
            if (spritesRef.current[i]) spritesRef.current[i].el = el;
          }}
        />
      ))}
    </div>
  );
}
