interface Props {
  onNext: () => void;
}

export default function PubHint6({ onNext }: Props) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f1116',
      color: '#f2f2f2',
      fontFamily: 'Arial, sans-serif',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 36,
      backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.08), transparent 35%), linear-gradient(180deg, #12151c 0%, #0a0c11 100%)',
    }}>
      <div style={{ width: '100%', maxWidth: 900, padding: 36, background: 'rgba(12, 12, 12, 0.94)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.45)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
          <div>
            <span style={{ display: 'block', fontSize: 14, letterSpacing: '0.2em', color: '#8f989f' }}>OPERATION: RUMBLING PUB</span>
            <h1 style={{ margin: '14px 0 0', fontSize: '3.8rem', lineHeight: 1.02, letterSpacing: '-0.04em' }}>This pub is very angry</h1>
          </div>
          <div style={{ padding: '10px 18px', background: '#111619', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14 }}>
            <span style={{ fontSize: 12, color: '#96a4b3' }}>Black Ops</span>
          </div>
        </div>
        <p style={{ color: '#d7d9dc', fontSize: 18, lineHeight: 1.85, maxWidth: 760, marginBottom: 32 }}>
          A hard-edged, tactical briefing screen with steel textures, numerical overlays and a feeling of high-stakes conflict. This clue lives in the gritty world of modern warfare.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
          <div style={{ background: '#14181f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 24 }}>
            <strong style={{ display: 'block', color: '#e1e4e8', marginBottom: 10 }}>Style</strong>
            <p style={{ margin: 0, color: '#a8b0b9' }}>Steely, dark, and tactical with classic FPS UI cues.</p>
          </div>
          <div style={{ background: '#14181f', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 24 }}>
            <strong style={{ display: 'block', color: '#e1e4e8', marginBottom: 10 }}>Hint</strong>
            <p style={{ margin: 0, color: '#a8b0b9' }}>A pub name with fury and attitude, mirrored in a military ops briefing.</p>
          </div>
        </div>
      </div>
      <div style={{ width: '100%', maxWidth: 900, marginTop: 32 }}>
        <button
          type="button"
          onClick={onNext}
          style={{
            width: '100%',
            padding: '18px 0',
            fontSize: 18,
            fontWeight: 700,
            color: '#f7f9fb',
            background: '#1e2530',
            border: 'none',
            borderRadius: 14,
            cursor: 'pointer',
            boxShadow: '0 10px 0 rgba(0,0,0,0.35)',
          }}
        >
          Next Pub Hint
        </button>
      </div>
    </div>
  );
}
