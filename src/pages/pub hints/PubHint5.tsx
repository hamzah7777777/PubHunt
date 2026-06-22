interface Props {
  onNext: () => void;
}

export default function PubHint5({ onNext }: Props) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #6b4b20 0%, #2d1f0f 100%)',
      color: '#f6e3b2',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 40,
      fontFamily: 'Georgia, serif',
    }}>
      <div style={{ width: '100%', maxWidth: 820, background: 'rgba(20, 13, 4, 0.95)', border: '4px solid #7b5a2e', borderRadius: 28, padding: 40, boxShadow: '0 25px 50px rgba(0,0,0,0.45)' }}>
        <h1 style={{ margin: 0, fontSize: '3rem', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Lunch for a Hedgehog and a Rabbit</h1>
        <p style={{ marginTop: 24, fontSize: '1rem', lineHeight: 1.8, color: '#e8d7b3' }}>A fantasy tavern clue with ancient parchment, warm candlelight, and a heroic quest for a woodland feast.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, marginTop: 34 }}>
          <div style={{ background: '#3e2d18', padding: 24, borderRadius: 18, border: '1px solid #5f482a' }}>
            <strong>Theme</strong>
            <p style={{ marginTop: 12 }}>Medieval tavern, epic quest, and enchanted dining.</p>
          </div>
          <div style={{ background: '#3e2d18', padding: 24, borderRadius: 18, border: '1px solid #5f482a' }}>
            <strong>Hint</strong>
            <p style={{ marginTop: 12 }}>A cozy pub name with animal character and a mythic lunch vibe.</p>
          </div>
        </div>
      </div>
      <div style={{ width: '100%', maxWidth: 820, marginTop: 32 }}>
        <button
          type="button"
          onClick={onNext}
          style={{
            width: '100%',
            padding: '18px 0',
            fontSize: 18,
            fontWeight: 700,
            color: '#fff4d7',
            background: '#8b5a2b',
            border: 'none',
            borderRadius: 14,
            cursor: 'pointer',
            boxShadow: '0 10px 0 rgba(73,44,20,0.3)',
          }}
        >
          Next Pub Hint
        </button>
      </div>
    </div>
  );
}
