import HintFrame from './HintFrame';

interface Props {
  hint: string;
  time: string;
  onBack: () => void;
  onNext?: () => void;
  nextLabel?: string;
}

function HudCorner({ rotate }: { rotate: number }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" style={{ position: 'absolute', transform: `rotate(${rotate}deg)` }}>
      <path d="M2 14 L2 2 L14 2" stroke="#ff6a00" strokeWidth="2" fill="none" />
    </svg>
  );
}

const dogTag = (
  <svg width="20" height="28" viewBox="0 0 20 28">
    <rect x="1" y="6" width="18" height="21" rx="3" fill="#2a2a2a" stroke="#5a5a5a" strokeWidth="1" />
    <circle cx="10" cy="4" r="3.5" fill="none" stroke="#8a8a8a" strokeWidth="1.5" />
    <line x1="3" y1="13" x2="17" y2="13" stroke="#5a5a5a" strokeWidth="1" />
    <line x1="3" y1="17" x2="17" y2="17" stroke="#5a5a5a" strokeWidth="1" />
    <line x1="3" y1="21" x2="13" y2="21" stroke="#5a5a5a" strokeWidth="1" />
  </svg>
);

export default function HintBlackOps({ hint, time, onBack, onNext, nextLabel }: Props) {
  return (
    <HintFrame>
    <div style={{ minHeight: '100%', fontFamily: "'Bebas Neue', Arial, sans-serif", background: '#0a0a0a', color: '#e8e8e8', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 6, left: 6 }}><HudCorner rotate={0} /></div>
      <div style={{ position: 'absolute', top: 6, right: 6 }}><HudCorner rotate={90} /></div>
      <div style={{ position: 'absolute', bottom: 6, left: 6 }}><HudCorner rotate={270} /></div>
      <div style={{ position: 'absolute', bottom: 6, right: 6 }}><HudCorner rotate={180} /></div>
      {/* top tactical strip */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', background: 'repeating-linear-gradient(45deg, #1a1a1a 0 10px, #141414 10px 20px)', borderBottom: '2px solid #ff6a00' }}>
        <span style={{ fontSize: 12, letterSpacing: '0.15em', color: '#ff6a00' }}>OPERATION: FINAL BOSS</span>
        <span style={{ fontSize: 11, color: '#8a8a8a' }}>LIVE</span>
      </div>

      {/* briefing header */}
      <div style={{ padding: '22px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'inline-block', padding: '3px 10px', border: '1px solid #ff6a00', color: '#ff6a00', fontSize: 11, letterSpacing: '0.1em', marginBottom: 10 }}>
            FINISH LINE &middot; CLASSIFIED
          </div>
          {dogTag}
        </div>
        <h1 style={{ margin: 0, fontFamily: "'Bebas Neue', Arial, sans-serif", fontSize: '2.2rem', letterSpacing: '0.02em', lineHeight: 1.15, color: '#f5f5f5' }}>{hint}</h1>
      </div>

      {/* crosshair */}
      <div style={{ display: 'flex', gap: 16, padding: '18px 16px 0', alignItems: 'flex-start' }}>
        <svg width="40" height="40" viewBox="0 0 40 40" style={{ flexShrink: 0, marginTop: 4 }}>
          <circle cx="20" cy="20" r="14" stroke="#ff6a00" strokeWidth="1.5" fill="none" />
          <line x1="20" y1="0" x2="20" y2="10" stroke="#ff6a00" strokeWidth="2" />
          <line x1="20" y1="30" x2="20" y2="40" stroke="#ff6a00" strokeWidth="2" />
          <line x1="0" y1="20" x2="10" y2="20" stroke="#ff6a00" strokeWidth="2" />
          <line x1="30" y1="20" x2="40" y2="20" stroke="#ff6a00" strokeWidth="2" />
        </svg>
      </div>

      {/* HUD-style stat block */}
      <div style={{ display: 'flex', gap: 12, margin: '22px 16px 0', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 160px', background: '#141414', border: '1px solid #3a3a3a', borderLeft: '3px solid #ff6a00', padding: 16 }}>
          <strong style={{ display: 'block', fontSize: 14, color: '#ff6a00', letterSpacing: '0.05em' }}>TIME</strong>
          <p style={{ margin: '8px 0 0', fontFamily: "'Oswald', sans-serif", fontSize: 14, color: '#aaa' }}>{time} — private hire from 10pm, wristbands needed.</p>
        </div>
      </div>

      <div style={{ padding: '22px 16px 24px', display: 'flex', gap: 10 }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            flex: onNext ? undefined : 1,
            padding: '15px 16px',
            fontFamily: "'Bebas Neue', Arial, sans-serif",
            fontSize: 16,
            letterSpacing: '0.1em',
            color: '#ff6a00',
            background: 'transparent',
            border: '2px solid #ff6a00',
            cursor: 'pointer',
          }}
        >
          BACK
        </button>
        {onNext && (
          <button
            type="button"
            onClick={onNext}
            style={{
              flex: 1,
              padding: '15px 0',
              fontFamily: "'Bebas Neue', Arial, sans-serif",
              fontSize: 18,
              letterSpacing: '0.1em',
              color: '#0a0a0a',
              background: '#ff6a00',
              border: 'none',
              cursor: 'pointer',
              clipPath: 'polygon(0 0, 100% 0, 100% 70%, 96% 100%, 0 100%)',
            }}
          >
            {nextLabel ?? 'NEXT PUB HINT'}
          </button>
        )}
      </div>
    </div>
    </HintFrame>
  );
}
