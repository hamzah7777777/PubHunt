import HintFrame from './HintFrame';
import skyGradient from './Pub Hint 7 Assets/Skygradient.png';
import stars from './Pub Hint 7 Assets/Stars.png';
import bannerLogo from './Pub Hint 7 Assets/bannerLogo_AmongUs.png';

interface Props {
  onNext: () => void;
}

export default function PubHint7({ onNext }: Props) {
  return (
    <HintFrame>
    <div style={{
      minHeight: '100%', position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      fontFamily: "'Trebuchet MS', Verdana, sans-serif", color: '#fff',
      backgroundImage: `url(${skyGradient})`, backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat',
    }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${stars})`, backgroundSize: '220px auto', backgroundRepeat: 'repeat', opacity: 0.8 }} />

      {/* emergency meeting banner */}
      <div style={{ position: 'relative', background: '#c1272d', textAlign: 'center', padding: '8px 0', borderBottom: '3px solid #7a1418' }}>
        <span style={{ fontSize: 14, color: '#fff', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Emergency Meeting Called</span>
      </div>

      {/* lobby chip */}
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'flex-end', padding: '10px 18px 0' }}>
        <span style={{ background: 'rgba(10,15,25,0.7)', border: '2px solid #2d4a68', padding: '4px 10px', fontSize: 12, color: '#99d25a' }}>4 / 10 ONLINE</span>
      </div>

      {/* real Among Us logo, with the night sky showing through the outline */}
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', padding: '10px 24px 0' }}>
        <img src={bannerLogo} alt="" style={{ width: '88%', filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.6))' }} />
      </div>

      <h1 style={{ position: 'relative', margin: '6px 18px 0', fontSize: '1.7rem', lineHeight: 1.1, color: '#fff', textAlign: 'center', textShadow: '0 2px 4px rgba(0,0,0,0.6)' }}>
        Mission
      </h1>

      {/* task list style card */}
      <div style={{ position: 'relative', margin: '24px 18px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: 'rgba(10,15,25,0.78)', border: '2px solid #2d4a68', padding: 14 }}>
          <div style={{ width: 18, height: 18, border: '2px solid #99d25a', flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong style={{ color: '#fff', fontSize: 14 }}>Join your mATES</strong>
            <p style={{ margin: '6px 0 0', color: '#cfd8e6', fontSize: 14 }}>Find the crew, stick together, and look for a pub with a social mission.</p>
          </div>
        </div>
      </div>

      <div style={{ position: 'relative', padding: '24px 18px 24px' }}>
        <button
          type="button"
          onClick={onNext}
          style={{
            width: '100%',
            padding: '15px 0',
            fontFamily: "'Trebuchet MS', Verdana, sans-serif",
            fontSize: 16,
            fontWeight: 700,
            color: '#fff',
            background: 'linear-gradient(180deg, #2a3a4d 0%, #16202c 100%)',
            border: '2px solid #99d25a',
            borderRadius: 18,
            cursor: 'pointer',
            boxShadow: '0 6px 0 0 #143018, 0 0 0 1px rgba(153,210,90,0.3)',
          }}
        >
          Next Pub Hint
        </button>
      </div>

      <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 18px 22px' }}>
        <span style={{ fontSize: 11, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.5)' }}>PUB HUNT &middot; SHEFFIELD 2026</span>
      </div>
    </div>
    </HintFrame>
  );
}
