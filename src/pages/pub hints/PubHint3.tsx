interface Props {
  onNext: () => void;
}

export default function PubHint3({ onNext }: Props) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #d9f1d7 0%, #7dc56b 100%)',
      fontFamily: 'Verdana, Geneva, sans-serif',
      color: '#102514',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 36,
    }}>
      <div style={{ width: '100%', maxWidth: 760, background: 'rgba(255,255,255,0.92)', border: '5px solid #2e7a32', borderRadius: 24, boxShadow: '0 20px 0 #1a481f', padding: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <div style={{ width: 20, height: 20, background: '#0c6c24', borderRadius: 4 }} />
          <h1 style={{ margin: 0, fontSize: '2.9rem' }}>Houses and Hares</h1>
        </div>
        <p style={{ fontSize: '1rem', lineHeight: 1.8, marginBottom: 24 }}>
          A playful London clue wrapped in a Game Boy Advance adventure style: bright panels, layered text boxes and map-like exploration energy.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <div style={{ background: '#edf7e7', border: '3px solid #6ba54d', borderRadius: 16, padding: 18 }}>
            <strong>Look for</strong>
            <p style={{ margin: '10px 0 0' }}>A green, leafy pub name with a twist on houses and hares.</p>
          </div>
          <div style={{ background: '#edf7e7', border: '3px solid #6ba54d', borderRadius: 16, padding: 18 }}>
            <strong>Style</strong>
            <p style={{ margin: '10px 0 0' }}>Retro RPG text, pop-up windows, and a friendly exploration board.</p>
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
            color: '#ffffff',
            background: '#3c763d',
            border: 'none',
            borderRadius: 14,
            cursor: 'pointer',
            boxShadow: '0 10px 0 rgba(20,75,24,0.25)',
          }}
        >
          Next Pub Hint
        </button>
      </div>
    </div>
  );
}
