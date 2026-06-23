import HintFrame from './HintFrame';

interface Props {
  onNext: () => void;
}

const pokeball = (
  <span style={{
    display: 'inline-block', width: 16, height: 16, borderRadius: '50%',
    background: 'linear-gradient(180deg, #e3350d 0 47%, #000 47%, #000 53%, #fff 53% 100%)',
    border: '2px solid #1a1a1a', position: 'relative', verticalAlign: 'middle', marginRight: 8,
  }}>
    <span style={{ position: 'absolute', top: '50%', left: '50%', width: 6, height: 6, background: '#fff', border: '2px solid #1a1a1a', borderRadius: '50%', transform: 'translate(-50%,-50%)' }} />
  </span>
);

export default function PubHint3({ onNext }: Props) {
  return (
    <HintFrame>
    <div style={{ minHeight: '100%', fontFamily: "'Silkscreen', monospace", background: '#6b6fc9', padding: '14px 14px 0' }}>
      {/* GBA-style shoulder buttons + speaker grille */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px 10px' }}>
        <span style={{ background: '#4a4ea0', color: '#cfd2ff', fontSize: 8, padding: '4px 8px' }}>L</span>
        <div style={{ display: 'flex', gap: 3 }}>
          {Array.from({ length: 5 }).map((_, i) => <span key={i} style={{ width: 3, height: 10, background: '#4a4ea0' }} />)}
        </div>
        <span style={{ background: '#4a4ea0', color: '#cfd2ff', fontSize: 8, padding: '4px 8px' }}>R</span>
      </div>

    <div style={{ background: '#386850', overflow: 'hidden', boxShadow: 'inset 0 0 0 4px #2a2e6e' }}>
      {/* overworld tile strip */}
      <div style={{
        height: 64,
        backgroundImage: 'linear-gradient(45deg, #5ca850 25%, transparent 25%, transparent 75%, #5ca850 75%), linear-gradient(45deg, #5ca850 25%, transparent 25%, transparent 75%, #5ca850 75%)',
        backgroundSize: '16px 16px',
        backgroundPosition: '0 0, 8px 8px',
        backgroundColor: '#386850',
      }} />

      {/* battle-style HUD card */}
      <div style={{ margin: '-26px 14px 0', background: '#f8f8d8', border: '3px solid #1a1a1a', padding: '10px 14px', boxShadow: '3px 3px 0 0 #1a1a1a' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 9, color: '#1a1a1a' }}>
          <span>HOUSES AND HARES</span>
          <span>Lv.05</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
          <span style={{ fontSize: 8, color: '#1a1a1a' }}>HP</span>
          <div style={{ flex: 1, height: 6, background: '#383838' }}>
            <div style={{ width: '78%', height: '100%', background: '#78c850' }} />
          </div>
        </div>
      </div>

      {/* dialogue text box */}
      <div style={{ margin: '20px 14px 0', background: '#fff', border: '3px solid #1a1a1a', padding: 16, position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 5, border: '2px solid #1a1a1a', pointerEvents: 'none' }} />
        <h1 style={{ margin: 0, fontFamily: "'Silkscreen', monospace", fontSize: '1.1rem', lineHeight: 1.6, color: '#1a1a1a' }}>In London it might be referred to as 'Houses and Hares'</h1>
        <div style={{ position: 'absolute', bottom: 10, right: 14, width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '8px solid #1a1a1a' }} />
      </div>

      {/* info panel */}
      <div style={{ display: 'flex', gap: 12, margin: '16px 14px 0', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 140px', background: '#f8f8d8', border: '3px solid #1a1a1a', padding: 12 }}>
          <strong style={{ fontSize: 9, display: 'flex', alignItems: 'center', marginBottom: 8, color: '#1a1a1a' }}>{pokeball}LOOK FOR</strong>
          <p style={{ margin: 0, fontFamily: "'VT323', monospace", fontSize: 16, color: '#1a1a1a' }}>A green, leafy pub name with a twist on houses and hares.</p>
        </div>
      </div>

      <div style={{ padding: '20px 14px 24px' }}>
        <button
          type="button"
          onClick={onNext}
          style={{
            width: '100%',
            padding: '16px 0',
            fontFamily: "'Silkscreen', monospace",
            fontSize: 12,
            color: '#fff',
            background: '#3c5aa6',
            border: '3px solid #1a1a1a',
            cursor: 'pointer',
            boxShadow: '4px 4px 0 0 #1a1a1a',
          }}
        >
          NEXT PUB HINT
        </button>
      </div>
    </div>

      {/* GBA shell controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 10px 18px' }}>
        <div style={{ position: 'relative', width: 44, height: 44 }}>
          <div style={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: 14, background: '#2a2e6e', transform: 'translateY(-50%)' }} />
          <div style={{ position: 'absolute', left: '50%', top: 0, height: '100%', width: 14, background: '#2a2e6e', transform: 'translateX(-50%)' }} />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#4a4ea0', color: '#cfd2ff', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>B</span>
          <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#4a4ea0', color: '#cfd2ff', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: -10 }}>A</span>
        </div>
      </div>
    </div>
    </HintFrame>
  );
}
