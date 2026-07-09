import HintFrame from './HintFrame';

interface Props {
  hint: string;
  time: string;
  onBack: () => void;
  onNext?: () => void;
  nextLabel?: string;
}

export default function HintPokemon({ hint, time, onBack, onNext, nextLabel }: Props) {
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
          <span>MYSTERY PUB</span>
          <span>{time}</span>
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
        <h1 style={{ margin: 0, fontFamily: "'Silkscreen', monospace", fontSize: '1rem', lineHeight: 1.6, color: '#1a1a1a' }}>{hint}</h1>
        <div style={{ position: 'absolute', bottom: 10, right: 14, width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '8px solid #1a1a1a' }} />
      </div>

      <div style={{ padding: '20px 14px 24px', display: 'flex', gap: 10 }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            flex: onNext ? undefined : 1,
            padding: '16px 14px',
            fontFamily: "'Silkscreen', monospace",
            fontSize: 12,
            color: '#1a1a1a',
            background: '#f8f8d8',
            border: '3px solid #1a1a1a',
            cursor: 'pointer',
            boxShadow: '4px 4px 0 0 #1a1a1a',
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
            {nextLabel ?? 'NEXT PUB HINT'}
          </button>
        )}
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
