interface Props {
  onNext: () => void;
}

export default function PubHint7({ onNext }: Props) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0b0c10',
      color: '#f5f6fa',
      fontFamily: 'Inter, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
      backgroundImage: 'radial-gradient(circle at top, rgba(107, 84, 194, 0.18), transparent 25%)',
    }}>
      <div style={{ width: '100%', maxWidth: 900, background: '#11131b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 28, padding: 40, boxShadow: '0 30px 50px rgba(0,0,0,0.45)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, marginBottom: 32 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '3.5rem', letterSpacing: '-0.05em' }}>Join your mates</h1>
            <p style={{ marginTop: 18, fontSize: 18, lineHeight: 1.75, maxWidth: 620, color: '#cfd4e6' }}>
              A bright crew call-out with playful astronaut vibes. The design is simple, spacey and made to feel like a friendly multiplayer briefing.
            </p>
          </div>
          <div style={{ display: 'grid', gap: 10, textAlign: 'right' }}>
            <span style={{ fontSize: 12, color: '#8a90aa', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Among Us</span>
            <div style={{ width: 58, height: 58, background: '#8e44ad', borderRadius: 18, border: '2px solid #dadfe5' }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
          <div style={{ background: '#171821', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 22, padding: 24 }}>
            <strong style={{ color: '#f7f8fb' }}>Mission</strong>
            <p style={{ margin: '14px 0 0', color: '#b5bacd' }}>Find the crew, stick together, and look for a pub with a social mission.</p>
          </div>
          <div style={{ background: '#171821', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 22, padding: 24 }}>
            <strong style={{ color: '#f7f8fb' }}>Vibe</strong>
            <p style={{ margin: '14px 0 0', color: '#b5bacd' }}>Simple, friendly, and unmistakably group-oriented.</p>
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
            color: '#11131a',
            background: '#99d25a',
            border: 'none',
            borderRadius: 14,
            cursor: 'pointer',
            boxShadow: '0 10px 0 rgba(56,69,29,0.25)',
          }}
        >
          Next Pub Hint
        </button>
      </div>
    </div>
  );
}
