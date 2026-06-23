import HintFrame from './HintFrame';

interface Props {
  onNext: () => void;
}

const plumbob = (
  <svg width="22" height="30" viewBox="0 0 22 30" xmlns="http://www.w3.org/2000/svg">
    <polygon points="11,0 22,11 11,30 0,11" fill="#3ecf3e" stroke="#1f8a1f" strokeWidth="1" />
    <polygon points="11,0 22,11 11,15" fill="#6dea6d" />
  </svg>
);

const motives = [
  { label: 'Hunger', value: 88 },
  { label: 'Social', value: 64 },
  { label: 'Fun', value: 92 },
];

export default function PubHint4({ onNext }: Props) {
  return (
    <HintFrame>
    <div style={{ minHeight: '100%', fontFamily: "'Comfortaa', sans-serif", background: '#eaf6ff' }}>
      {/* Sims-style top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#ffffff', borderBottom: '1px solid #cfe6f5' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {plumbob}
          <span style={{ fontWeight: 700, fontSize: 14, color: '#1c3a52' }}>Grosvenor &middot; Live Mode</span>
        </div>
        <span style={{ fontSize: 13, color: '#2c8c4e', fontWeight: 700 }}>&sect;1,240</span>
      </div>

      {/* mode toolbar */}
      <div style={{ display: 'flex', gap: 10, padding: '12px 16px 0' }}>
        {['Live', 'Buy', 'Build', 'CAS'].map((mode, i) => (
          <div key={mode} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            width: 52, padding: '8px 4px',
            background: i === 0 ? '#3ecf3e' : '#ffffff',
            boxShadow: '0 4px 10px rgba(60,120,160,0.16)',
          }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${i === 0 ? '#fff' : '#3ecf3e'}` }} />
            <span style={{ fontSize: 8, color: i === 0 ? '#fff' : '#3a6d8c' }}>{mode}</span>
          </div>
        ))}
      </div>

      {/* motive bars */}
      <div style={{ display: 'flex', gap: 10, padding: '14px 16px 0' }}>
        {motives.map(m => (
          <div key={m.label} style={{ flex: 1 }}>
            <span style={{ fontSize: 10, color: '#3a6d8c' }}>{m.label}</span>
            <div style={{ height: 8, background: '#dceefb', marginTop: 4, overflow: 'hidden' }}>
              <div style={{ width: `${m.value}%`, height: '100%', background: '#3ecf3e' }} />
            </div>
          </div>
        ))}
      </div>

      {/* hero card */}
      <div style={{ margin: '20px 16px 0', background: '#ffffff', padding: 28, boxShadow: '0 10px 24px rgba(60,120,160,0.18)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          {plumbob}
          <span style={{ fontSize: 11, color: '#3a6d8c', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Aspiration unlocked</span>
        </div>
        <h1 style={{ margin: 0, fontFamily: "'Comfortaa', sans-serif", fontSize: '2rem', color: '#1c3a52', lineHeight: 1.2 }}>An entrance that&apos;s FAR away</h1>
      </div>

      {/* info pill */}
      <div style={{ display: 'flex', gap: 12, margin: '16px 16px 0', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 160px', background: '#ffffff', padding: 18, boxShadow: '0 6px 16px rgba(60,120,160,0.14)' }}>
          <strong style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#1c3a52' }}>{plumbob} Entrance</strong>
          <p style={{ margin: '10px 0 0', fontSize: 14, color: '#3a6d8c' }}>Iconic, elegant and a little distant.</p>
        </div>
      </div>

      <div style={{ padding: '20px 16px 24px' }}>
        <button
          type="button"
          onClick={onNext}
          style={{
            width: '100%',
            padding: '16px 0',
            fontFamily: "'Comfortaa', sans-serif",
            fontSize: 15,
            fontWeight: 700,
            color: '#fff',
            background: '#3ecf3e',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 8px 18px rgba(62,207,62,0.4)',
          }}
        >
          Next Pub Hint
        </button>
      </div>
    </div>
    </HintFrame>
  );
}
