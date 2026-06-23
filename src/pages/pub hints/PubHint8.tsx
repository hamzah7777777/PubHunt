import HintFrame from './HintFrame';
import background from './Pub Hint 8 Assets/Background.jpg';
import logo from './Pub Hint 8 Assets/Logo.png';

interface Props {
  onNext: () => void;
}

function StoneButton({ label, primary, onClick }: { label: string; primary?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      style={{
        width: '100%',
        padding: '12px 0',
        fontFamily: "'Silkscreen', monospace",
        fontSize: 12,
        color: primary ? '#fff' : '#dcdcdc',
        background: primary
          ? 'linear-gradient(180deg, #8fae5a 0%, #5e8a3a 45%, #3f6a26 100%)'
          : 'linear-gradient(180deg, #8a8a8a 0%, #6a6a6a 45%, #4a4a4a 100%)',
        border: '2px solid #222',
        boxShadow: 'inset 2px 2px 0 0 rgba(255,255,255,0.35), inset -2px -2px 0 0 rgba(0,0,0,0.4)',
        textShadow: '2px 2px 0 #1a1208',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {label}
    </button>
  );
}

export default function PubHint8({ onNext }: Props) {
  return (
    <HintFrame>
    <div style={{ minHeight: '100%', position: 'relative', overflow: 'hidden', fontFamily: "'Silkscreen', monospace" }}>
      <img src={background} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.88) 100%)' }} />

      <img src={logo} alt="Pub Hunt" style={{ position: 'absolute', top: '3%', left: '8%', width: '84%', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.6))' }} />

      {/* level title plaque, in place of a Minecraft splash text */}
      <div style={{ position: 'absolute', left: '8%', right: '8%', top: '41%', textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '1rem', lineHeight: 1.4, color: '#fff', textShadow: '2px 2px 0 #1a1208' }}>
          Global place for fizzy tunes
        </h1>
      </div>

      {/* hint */}
      <div style={{ position: 'absolute', left: '8%', right: '8%', top: '49%' }}>
        <div style={{ background: 'rgba(58,42,26,0.92)', border: '3px solid #8a7050', padding: 10 }}>
          <strong style={{ fontSize: 10, color: '#fff' }}>HINT</strong>
          <p style={{ margin: '6px 0 0', fontFamily: "'VT323', monospace", fontSize: 15, color: '#d8d8c8', lineHeight: 1.3 }}>
            Think fizzy drinks, global tunes, and pixel-perfect party energy.
          </p>
        </div>
      </div>

      {/* menu buttons */}
      <div style={{ position: 'absolute', left: '8%', right: '8%', top: '70%', display: 'flex', flexDirection: 'column', gap: 7 }}>
        <StoneButton label="Next Pub Hint" primary onClick={onNext} />
        <div style={{ display: 'flex', gap: 7 }}>
          <div style={{ flex: 1 }}><StoneButton label="Options..." /></div>
          <div style={{ flex: 1 }}><StoneButton label="Quit Game" /></div>
        </div>
      </div>

      <div style={{ position: 'absolute', left: '8%', right: '8%', bottom: '3%', display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#cfcfc0' }}>
        <span>Pub Hunt 2026</span>
        <span>Sheffield city centre</span>
      </div>
    </div>
    </HintFrame>
  );
}
