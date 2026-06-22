interface Props {
  onNext: () => void;
}

export default function PubHint1({ onNext }: Props) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #f7f9fb 0%, #eef2f6 100%)',
      color: '#111',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '48px',
      fontFamily: 'Inter, system-ui, sans-serif',
      textAlign: 'center',
    }}>
      <div style={{ maxWidth: 880, width: '100%', borderRadius: 24, border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.92)', boxShadow: '0 30px 60px rgba(15,23,42,0.08)', padding: '64px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 32, alignItems: 'center' }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#e30613' }} />
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#000' }} />
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#e30613' }} />
        </div>
        <h1 style={{ fontSize: '3rem', margin: 0, letterSpacing: '-0.04em', lineHeight: 1.05 }}>Grosvenor House Level 5</h1>
        <p style={{ marginTop: 24, fontSize: '1.05rem', lineHeight: 1.8, color: '#344054' }}>
          A sophisticated destination with a polished business feel — think clean lines, strong contrast, and a premium banking-inspired experience.
        </p>
        <div style={{ marginTop: 40, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ padding: 24, borderRadius: 18, background: '#f3f6f9', border: '1px solid rgba(15, 23, 42, 0.05)' }}>
            <strong style={{ display: 'block', marginBottom: 12, fontSize: '0.95rem' }}>Brand feel</strong>
            Minimal, corporate, and trusted.
          </div>
          <div style={{ padding: 24, borderRadius: 18, background: '#f3f6f9', border: '1px solid rgba(15, 23, 42, 0.05)' }}>
            <strong style={{ display: 'block', marginBottom: 12, fontSize: '0.95rem' }}>Hint</strong>
            Think premium city rooftop spaces with a clean, appointed interior.
          </div>
        </div>
      </div>
      <div style={{ width: '100%', maxWidth: 880, marginTop: 32 }}>
        <button
          type="button"
          onClick={onNext}
          style={{
            width: '100%',
            padding: '18px 0',
            fontSize: 18,
            fontWeight: 700,
            color: '#fff',
            background: '#0f4fa7',
            border: 'none',
            borderRadius: 14,
            cursor: 'pointer',
            boxShadow: '0 10px 0 rgba(15,23,42,0.15)',
          }}
        >
          Next Pub Hint
        </button>
      </div>
    </div>
  );
}
