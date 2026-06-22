interface Props {
  onNext: () => void;
}

export default function PubHint2({ onNext }: Props) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#7bdcff',
      color: '#1c2332',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '36px',
      fontFamily: 'Arial, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: 760, background: '#8ae4ff', border: '6px solid #3f9cde', borderRadius: 24, boxShadow: '0 24px 0 #2f6b9c', padding: '40px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 24, left: 24, width: 64, height: 64, background: '#60bd4a', borderRadius: '50%', border: '4px solid #2e7a2d' }} />
        <h1 style={{ margin: 0, fontSize: '3rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#0f2a48', lineHeight: 1.05 }}>A place to share ideas</h1>
        <p style={{ marginTop: 20, fontSize: '1.05rem', lineHeight: 1.7, color: '#163653' }}>
          Bright, playful and pixel-friendly — a classic platformer welcome screen with bold blocks, blue skies and treasure-box energy.
        </p>
        <div style={{ marginTop: 32, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px', minWidth: 200, background: '#ffcc4d', borderRadius: 16, border: '4px solid #d59f16', padding: '18px' }}>
            <strong>Vibe</strong>
            <p style={{ margin: '10px 0 0' }}>Sunny, fun, and nostalgic.</p>
          </div>
          <div style={{ flex: '1 1 200px', minWidth: 200, background: '#b6e04a', borderRadius: 16, border: '4px solid #6d8b1f', padding: '18px' }}>
            <strong>Hint</strong>
            <p style={{ margin: '10px 0 0' }}>A playful hub where ideas feel like coins to collect.</p>
          </div>
        </div>
      </div>
      <div style={{ width: '100%', maxWidth: 760, marginTop: 32 }}>
        <button
          type="button"
          onClick={onNext}
          style={{
            width: '100%',
            padding: '18px 0',
            fontSize: 18,
            fontWeight: 700,
            color: '#112342',
            background: '#ffcc4d',
            border: 'none',
            borderRadius: 14,
            cursor: 'pointer',
            boxShadow: '0 10px 0 rgba(71,82,101,0.16)',
          }}
        >
          Next Pub Hint
        </button>
      </div>
    </div>
  );
}
