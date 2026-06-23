import HintFrame from './HintFrame';

interface Props {
  onNext: () => void;
  onBack?: () => void;
}

const hexagon = (
  <svg width="30" height="26" viewBox="0 0 40 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="20,1 38,11 38,25 20,35 2,25 2,11" fill="#ffffff" />
    <polygon points="20,4 20,18 4,11" fill="#db0011" />
    <polygon points="20,4 20,18 36,11" fill="#db0011" />
    <polygon points="20,32 20,18 4,25" fill="#db0011" />
    <polygon points="20,32 20,18 36,25" fill="#db0011" />
  </svg>
);

const hamburger = (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, width: 20 }}>
    <span style={{ height: 2, background: '#1a1a1a' }} />
    <span style={{ height: 2, background: '#1a1a1a' }} />
    <span style={{ height: 2, background: '#1a1a1a' }} />
  </div>
);

export default function PubHint1({ onNext, onBack }: Props) {
  return (
    <HintFrame>
    <div style={{ minHeight: '100%', fontFamily: "'Roboto', Arial, sans-serif", background: '#ffffff', color: '#1a1a1a', imageRendering: 'auto' }}>
      {/* top nav: hamburger | centred logo | log on */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #ececec' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {hamburger}
          <span style={{ width: 1, height: 22, background: '#ddd' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {hexagon}
          <span style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a' }}>HSBC <span style={{ fontWeight: 400 }}>UK</span></span>
        </div>
        <button type="button" style={{ background: '#db0011', color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', padding: '8px 14px', cursor: 'pointer' }}>
          Log on
        </button>
      </div>

      {/* hero photo (recreated, not the real photograph) */}
      <div style={{ position: 'relative', height: 220, overflow: 'hidden', background: 'linear-gradient(165deg, #ffe1a8 0%, #ffb86b 30%, #f08a5d 55%, #6a8caf 85%)' }}>
        <div style={{ position: 'absolute', top: 14, right: 14, background: '#000', color: '#fff', padding: '8px 12px', borderRadius: 10, textAlign: 'center', lineHeight: 1.3 }}>
          <span style={{ display: 'block', fontSize: 9, fontWeight: 700, letterSpacing: '0.02em' }}>CURRENT ACCOUNT</span>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontSize: 11, fontWeight: 700 }}>SWITCH GUARANTEE &uarr;</span>
        </div>
      </div>

      {/* overlapping white card */}
      <div style={{ margin: '-26px 16px 0', background: '#fff', padding: '22px 18px 0', position: 'relative' }}>
        <h1 style={{ fontFamily: "'Roboto', Arial, sans-serif", fontSize: '1.9rem', margin: 0, lineHeight: 1.2, fontWeight: 700, color: '#1a1a1a' }}>Grosvenor House Lvl5 (starting point)</h1>
        <p style={{ marginTop: 14, fontSize: 15, lineHeight: 1.6, color: '#454545' }}>
          Think premium city rooftop spaces with a clean, appointed interior.
        </p>

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              style={{
                padding: '14px 18px',
                fontSize: 14,
                fontWeight: 700,
                color: '#db0011',
                background: '#fff',
                border: '2px solid #db0011',
                cursor: 'pointer',
              }}
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={onNext}
            style={{
              flex: 1,
              padding: '14px 26px',
              fontSize: 14,
              fontWeight: 700,
              color: '#fff',
              background: '#db0011',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Next Pub Hint
          </button>
        </div>

        {/* Premier section + floating chat bubble, kept as page chrome for authenticity */}
        <div style={{ marginTop: 26, borderTop: '1px solid #ececec', paddingTop: 18, paddingBottom: 18, position: 'relative' }}>
          <h2 style={{ fontFamily: "'Roboto', Arial, sans-serif", fontSize: '1.4rem', margin: 0, fontWeight: 700, color: '#1a1a1a' }}>Join HSBC Premier today</h2>
          <p style={{ marginTop: 10, fontSize: 14, lineHeight: 1.6, color: '#5a5a5a', maxWidth: '78%' }}>
            HSBC Premier is our premium account that gives you more than banking with wealth, health and benefits, and rewards too.
          </p>

          <div style={{
            position: 'absolute', right: 0, bottom: -6,
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#fff', border: '1.5px solid #1a1a1a', borderRadius: 22,
            padding: '8px 14px', boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2"><path d="M21 11.5a8.4 8.4 0 0 1-1.1 4.2L21 20l-4.3-1.1a8.4 8.4 0 1 1 4.3-7.4Z" /></svg>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>Chat</span>
          </div>
        </div>
      </div>
    </div>
    </HintFrame>
  );
}
