import HintFrame from './HintFrame';

interface Props {
  onNext: () => void;
}

const goldText = {
  backgroundImage: 'linear-gradient(180deg, #fff6d9 0%, #f3d28a 30%, #caa54a 65%, #8a6a30 100%)',
  WebkitBackgroundClip: 'text' as const,
  backgroundClip: 'text' as const,
  color: 'transparent',
  textShadow: '0 2px 3px rgba(0,0,0,0.85)',
};

function Ornament({ rotate = 0 }: { rotate?: number }) {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" style={{ position: 'absolute', transform: `rotate(${rotate}deg)` }}>
      <path d="M3 3 Q3 16 16 16 M3 3 Q16 3 16 16" stroke="#e8c873" strokeWidth="2" fill="none" />
      <path d="M3 3 Q3 10 10 10" stroke="#8a6a30" strokeWidth="1" fill="none" />
      <circle cx="3" cy="3" r="3" fill="#ffe9a8" stroke="#8a6a30" strokeWidth="0.6" />
    </svg>
  );
}

const crest = (
  <svg width="26" height="30" viewBox="0 0 26 30">
    <path d="M13 1 L24 5 L24 14 Q24 24 13 29 Q2 24 2 14 L2 5 Z" fill="#1c2a1e" stroke="#e8c873" strokeWidth="1.4" />
    <path d="M13 7 L13 21 M7 14 L19 14" stroke="#e8c873" strokeWidth="1.3" />
    <circle cx="13" cy="14" r="4" fill="none" stroke="#caa54a" strokeWidth="0.8" />
  </svg>
);

function Firefly({ top, left, delay }: { top: string; left: string; delay: string }) {
  return (
    <span style={{
      position: 'absolute', top, left, width: 5, height: 5, borderRadius: '50%',
      background: '#d9ff8a', boxShadow: '0 0 6px 2px rgba(217,255,138,0.85)',
      animation: `pubhint5-flicker 2.6s ${delay} ease-in-out infinite`,
    }} />
  );
}

function Fern({ left, scale = 1, flip = false }: { left: string; scale?: number; flip?: boolean }) {
  return (
    <svg
      width={70 * scale} height={56 * scale} viewBox="0 0 70 56"
      style={{ position: 'absolute', bottom: -4, left, transform: flip ? 'scaleX(-1)' : undefined }}
    >
      <path d="M2 56 Q6 20 34 4 Q22 26 18 56 Z" fill="#163320" />
      <path d="M20 56 Q28 14 60 2 Q42 22 40 56 Z" fill="#1d4226" />
      <path d="M40 56 Q50 24 68 10 Q56 30 56 56 Z" fill="#163320" />
    </svg>
  );
}

function Figure({ side, variant }: { side: 'left' | 'right'; variant: 'mystic' | 'warrior' }) {
  const body = variant === 'mystic' ? '#2c4a42' : '#4a352a';
  const trim = variant === 'mystic' ? '#7fd9c4' : '#caa54a';
  return (
    <svg width="92" height="230" viewBox="0 0 92 230" style={{ position: 'absolute', bottom: -6, [side]: -16, opacity: 0.96 }}>
      <path d="M46 18 Q70 30 70 58 L70 230 L22 230 L22 58 Q22 30 46 18 Z" fill={body} />
      <path d="M46 10 Q64 10 64 30 Q64 48 46 50 Q28 48 28 30 Q28 10 46 10 Z" fill={body} />
      {variant === 'mystic' ? (
        <>
          <circle cx="38" cy="28" r="2.6" fill={trim} />
          <circle cx="54" cy="28" r="2.6" fill={trim} />
        </>
      ) : (
        <rect x="30" y="22" width="32" height="10" rx="2" fill="#1a1410" />
      )}
      <path d="M22 70 L8 110 L20 116 L30 84 Z" fill={body} />
      <path d="M70 70 L84 110 L72 116 L62 84 Z" fill={body} />
      <path d="M46 18 Q70 30 70 58" stroke={trim} strokeWidth="2" fill="none" opacity="0.7" />
    </svg>
  );
}

function MetalBar({ label, primary, onClick }: { label: string; primary?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      style={{
        position: 'relative',
        width: '100%',
        padding: '14px 0',
        fontFamily: "'Cinzel', serif",
        fontWeight: 700,
        fontSize: 14,
        letterSpacing: '0.04em',
        color: primary ? '#fff7df' : '#ccd8de',
        background: primary
          ? 'linear-gradient(180deg, #45565f 0%, #1c262b 48%, #2a373d 52%, #45565f 100%)'
          : 'linear-gradient(180deg, #333d43 0%, #15191c 48%, #1f2528 52%, #333d43 100%)',
        border: '1px solid #05070a',
        borderRadius: 6,
        boxShadow: primary
          ? '0 0 0 1px #caa54a, inset 0 1px 0 rgba(255,255,255,0.18), 0 4px 8px rgba(0,0,0,0.55)'
          : 'inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 8px rgba(0,0,0,0.55)',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <span style={{
        position: 'absolute', left: -1, top: '50%', width: 11, height: 11, transform: 'translateY(-50%) rotate(45deg)',
        background: 'linear-gradient(135deg,#f3d28a,#8a6a30)', boxShadow: '0 0 0 1px #05070a',
      }} />
      <span style={{
        position: 'absolute', right: -1, top: '50%', width: 11, height: 11, transform: 'translateY(-50%) rotate(45deg)',
        background: 'linear-gradient(135deg,#f3d28a,#8a6a30)', boxShadow: '0 0 0 1px #05070a',
      }} />
      {label}
    </button>
  );
}

export default function PubHint5({ onNext }: Props) {
  return (
    <HintFrame>
    <div style={{
      height: '100%', position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', justifyContent: 'center',
      fontFamily: "'EB Garamond', serif", color: '#f0d9a0',
      background: 'radial-gradient(85% 60% at 50% 0%, #4d7a52 0%, #2c4a36 38%, #142318 72%, #070d09 100%)',
    }}>
      <style>{`@keyframes pubhint5-flicker { 0%,100% { opacity: 0.25; } 50% { opacity: 1; } }`}</style>

      <Firefly top="14%" left="20%" delay="0s" />
      <Firefly top="22%" left="78%" delay="0.8s" />
      <Firefly top="40%" left="10%" delay="1.4s" />
      <Firefly top="9%" left="60%" delay="0.4s" />

      {/* scene: plaque + menu, figures + ferns anchored to this block only */}
      <div style={{ position: 'relative', padding: '40px 0 26px' }}>
        <Figure side="left" variant="mystic" />
        <Figure side="right" variant="warrior" />

        {/* ornate title plaque with arched pediment */}
        <div style={{ margin: '0 15% 0', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: -12, position: 'relative', zIndex: 2 }}>
            <svg width="46" height="26" viewBox="0 0 46 26">
              <path d="M23 0 L46 14 L36 14 L23 26 L10 14 L0 14 Z" fill="#e8c873" stroke="#6e5320" strokeWidth="1" />
              <circle cx="23" cy="11" r="4" fill="#1c2a1e" stroke="#8a6a30" strokeWidth="1" />
            </svg>
          </div>
          <div style={{ padding: 4, background: 'linear-gradient(135deg, #f3d28a, #6e5320, #f3d28a)', borderRadius: 10, position: 'relative' }}>
            <div style={{ background: 'linear-gradient(180deg, #16241a 0%, #0a120c 100%)', border: '1px solid #6e5320', borderRadius: 8, padding: '24px 16px 20px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 6, left: 6 }}><Ornament rotate={0} /></div>
              <div style={{ position: 'absolute', top: 6, right: 6 }}><Ornament rotate={90} /></div>
              <div style={{ position: 'absolute', bottom: 6, left: 6 }}><Ornament rotate={270} /></div>
              <div style={{ position: 'absolute', bottom: 6, right: 6 }}><Ornament rotate={180} /></div>
              <h1 style={{
                margin: 0, fontFamily: "'Cinzel', serif", fontWeight: 700, fontSize: '1.5rem', lineHeight: 1.4, textAlign: 'center',
                ...goldText,
              }}>
                Lunch for a hedgehog and a rabbit
              </h1>
            </div>
          </div>
        </div>

        {/* metal menu bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: '26px 15% 0' }}>
          <MetalBar label="Next Pub Hint" primary onClick={onNext} />
          <MetalBar label="Options" />
          <MetalBar label="Quit" />
        </div>

        {/* foreground foliage framing the scene, like looking out through jungle */}
        <Fern left="-6%" scale={1.3} />
        <Fern left="78%" scale={1.5} flip />
      </div>

      {/* bottom chrome row + hint */}
      <div style={{ position: 'relative', padding: '24px 16px 0', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '0.12em', color: '#cdb27a' }}>SHEFFIELD</span>
          {crest}
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: 10, letterSpacing: '0.12em', color: '#cdb27a' }}>2026</span>
        </div>
        <p style={{ marginTop: 14, fontSize: 15, color: '#e7cf9c', lineHeight: 1.6 }}>
          A cozy pub name with animal character and a mythic lunch vibe.
        </p>
      </div>
    </div>
    </HintFrame>
  );
}
