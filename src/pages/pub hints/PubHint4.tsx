interface Props {
  onNext: () => void;
}

export default function PubHint4({ onNext }: Props) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at top, #9ec8ff 0%, #1c3b72 80%)',
      color: '#f3f7ff',
      fontFamily: 'Arial, sans-serif',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    }}>
      <div style={{ width: '100%', maxWidth: 860, background: 'rgba(18, 43, 87, 0.92)', border: '2px solid rgba(255,255,255,0.18)', borderRadius: 28, padding: 40, boxShadow: '0 30px 60px rgba(0,0,0,0.25)' }}>
        <h1 style={{ margin: 0, fontSize: '3.2rem', letterSpacing: '0.04em' }}>An entrance that's far away</h1>
        <p style={{ marginTop: 20, fontSize: '1.1rem', lineHeight: 1.8, maxWidth: 720 }}>A sleek, aspirational Sims-inspired page with graceful curves, soft glow, and the feeling of a destination beyond the horizon.</p>
        <div style={{ display: 'flex', gap: 18, marginTop: 32, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 220px', background: '#2a4a85', borderRadius: 16, padding: 22, border: '1px solid rgba(255,255,255,0.1)' }}>
            <strong>Entrance</strong>
            <p style={{ margin: '12px 0 0', color: '#d8e7ff' }}>Iconic, elegant and a little distant.</p>
          </div>
          <div style={{ flex: '1 1 220px', background: '#2a4a85', borderRadius: 16, padding: 22, border: '1px solid rgba(255,255,255,0.1)' }}>
            <strong>Style</strong>
            <p style={{ margin: '12px 0 0', color: '#d8e7ff' }}>Modern living-sim polish with subtle lighting and spacious design.</p>
          </div>
        </div>
      </div>
      <div style={{ width: '100%', maxWidth: 860, marginTop: 32 }}>
        <button
          type="button"
          onClick={onNext}
          style={{
            width: '100%',
            padding: '18px 0',
            fontSize: 18,
            fontWeight: 700,
            color: '#1b2b4b',
            background: '#91c6ff',
            border: 'none',
            borderRadius: 14,
            cursor: 'pointer',
            boxShadow: '0 10px 0 rgba(35,63,110,0.25)',
          }}
        >
          Next Pub Hint
        </button>
      </div>
    </div>
  );
}
