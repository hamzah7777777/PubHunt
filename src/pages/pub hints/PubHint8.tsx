interface Props {
  onNext: () => void;
}

export default function PubHint8({ onNext }: Props) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#1f291e',
      color: '#f5f3e7',
      fontFamily: 'Arial, sans-serif',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
      backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.08), transparent 30%), radial-gradient(circle at 20% 20%, rgba(226,255,209,0.12), transparent 25%)',
    }}>
      <div style={{ width: '100%', maxWidth: 900, background: '#283822', border: '2px solid #4a6b35', borderRadius: 28, padding: 40, boxShadow: '0 25px 45px rgba(0,0,0,0.38)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '3.5rem', lineHeight: 1.05, letterSpacing: '-0.05em' }}>Global Place for fizzy tunes</h1>
            <p style={{ marginTop: 20, fontSize: 18, color: '#d3d7b5', maxWidth: 680 }}>A blocky, mineral-rich page with a Minecraft-inspired rhythm — vibrant, chunky and built around an energetic gathering place.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 52, height: 52, background: '#7dbf5e', borderRadius: 10, border: '2px solid #4a7f39' }} />
            <div style={{ width: 52, height: 52, background: '#93d176', borderRadius: 10, border: '2px solid #4a7f39' }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
          <div style={{ background: '#334830', borderRadius: 20, padding: 24, border: '1px solid rgba(255,255,255,0.08)' }}>
            <strong style={{ color: '#f5f3e7' }}>Atmosphere</strong>
            <p style={{ marginTop: 12, color: '#cdd4b5' }}>Friendly, square, and energetic like a music venue made of blocks.</p>
          </div>
          <div style={{ background: '#334830', borderRadius: 20, padding: 24, border: '1px solid rgba(255,255,255,0.08)' }}>
            <strong style={{ color: '#f5f3e7' }}>Hint</strong>
            <p style={{ marginTop: 12, color: '#cdd4b5' }}>Think fizzy drinks, global tunes, and pixel-perfect party energy.</p>
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
            color: '#f5f3e7',
            background: '#5da84d',
            border: 'none',
            borderRadius: 14,
            cursor: 'pointer',
            boxShadow: '0 10px 0 rgba(34,48,24,0.25)',
          }}
        >
          Next Pub Hint
        </button>
      </div>
    </div>
  );
}
