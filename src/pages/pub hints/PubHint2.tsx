import type { CSSProperties } from 'react';
import HintFrame from './HintFrame';
import cloud1 from './Pub Hint 2 Assets/Cloud1.png';
import cloud2 from './Pub Hint 2 Assets/Cloud2.png';
import hill1 from './Pub Hint 2 Assets/Hill1.png';
import hill2 from './Pub Hint 2 Assets/Hill2.png';
import brick from './Pub Hint 2 Assets/Brick.png';
import mysteryBlock from './Pub Hint 2 Assets/MysteryBlock.png';
import groundBlock from './Pub Hint 2 Assets/GroundBlock.png';
import goomba from './Pub Hint 2 Assets/Goomba_Walk1.png';
import marioJump from './Pub Hint 2 Assets/Mario_Big_Jump.png';
import magicMushroom from './Pub Hint 2 Assets/MagicMushroom.png';
import pipeTop from './Pub Hint 2 Assets/PipeTop.png';
import pipeBottom from './Pub Hint 2 Assets/PipeBottom.png';
import coin from './Pub Hint 2 Assets/Coin.png';

interface Props {
  onNext: () => void;
}

const pixelImg: CSSProperties = { imageRendering: 'pixelated', display: 'block' };

export default function PubHint2({ onNext }: Props) {
  return (
    <HintFrame>
    <div style={{ minHeight: '100%', fontFamily: "'Press Start 2P', monospace", background: '#5c94fc' }}>
      {/* HUD bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', color: '#fff', fontSize: 9, textShadow: '2px 2px 0 #000' }}>
        <span>MARIO<br />000000</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><img src={coin} alt="" width={16} height={16} style={pixelImg} />&times;00</span>
        <span>WORLD<br />1-1</span>
        <span>TIME<br />382</span>
      </div>

      {/* sky scene */}
      <div style={{ position: 'relative', padding: '14px 0 0', minHeight: 240, overflow: 'hidden' }}>
        <img src={cloud1} alt="" width={64} height={64} style={{ ...pixelImg, position: 'absolute', top: 6, left: 14 }} />
        <img src={cloud2} alt="" width={96} height={64} style={{ ...pixelImg, position: 'absolute', top: 70, right: 4 }} />

        {/* title banner (our own clue text, not a Nintendo asset) */}
        <div style={{
          position: 'relative', margin: '18px 14% 0', background: '#c84c0c', border: '2px solid #1a1a1a',
          padding: '18px 16px', textAlign: 'center',
        }}>
          {['0,0', '0,100', '100,0', '100,100'].map(pos => {
            const [x, y] = pos.split(',');
            return <span key={pos} style={{ position: 'absolute', width: 5, height: 5, background: '#1a1a1a', borderRadius: '50%', left: `${x}%`, top: `${y}%`, transform: 'translate(-50%,-50%)' }} />;
          })}
          <h1 style={{ margin: 0, fontFamily: "'Press Start 2P', monospace", fontSize: '1.15rem', lineHeight: 1.7, letterSpacing: '0.02em', color: '#f7dcb0', textShadow: '2px 2px 0 #1a1a1a' }}>
            A place to share ideas
          </h1>
        </div>

        {/* floating ? block above the platform */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 22 }}>
          <img src={mysteryBlock} alt="" width={48} height={48} style={pixelImg} />
        </div>

        {/* hero mid-jump */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: -4 }}>
          <img src={marioJump} alt="" width={40} height={80} style={pixelImg} />
        </div>

        {/* brick platform with embedded ? blocks + mushroom power-up */}
        <div style={{ position: 'relative', display: 'flex', margin: '6px 18% 0', gap: 3 }}>
          <img src={mysteryBlock} alt="" width={48} height={48} style={pixelImg} />
          <div style={{ position: 'relative' }}>
            <img src={magicMushroom} alt="" width={48} height={48} style={{ ...pixelImg, position: 'absolute', left: 0, bottom: '100%', marginBottom: 2 }} />
            <img src={brick} alt="" width={48} height={48} style={pixelImg} />
          </div>
          <div style={{ width: 48 }} />
          <img src={mysteryBlock} alt="" width={48} height={48} style={pixelImg} />
        </div>

        {/* lone ? block at ground level */}
        <img src={mysteryBlock} alt="" width={48} height={48} style={{ ...pixelImg, position: 'absolute', left: 14, bottom: 0 }} />

        {/* hills, goomba, pipe */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 18, padding: '0 14px' }}>
          <img src={hill1} alt="" width={72} height={36} style={pixelImg} />
          <img src={goomba} alt="" width={32} height={32} style={pixelImg} />
          <img src={hill2} alt="" width={64} height={38} style={pixelImg} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <img src={pipeTop} alt="" width={64} height={32} style={pixelImg} />
            <img src={pipeBottom} alt="" width={64} height={32} style={pixelImg} />
          </div>
        </div>
      </div>

      {/* ground */}
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {Array.from({ length: 80 }).map((_, i) => (
          <img key={i} src={groundBlock} alt="" width={24} height={24} style={pixelImg} />
        ))}
      </div>

      {/* hint card */}
      <div style={{ display: 'flex', gap: 12, margin: '16px 14px 0', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 140px', background: '#00a800', border: '3px solid #000', padding: 12 }}>
          <strong style={{ fontSize: 10, display: 'block', marginBottom: 8, color: '#fff' }}>HINT</strong>
          <p style={{ margin: 0, fontFamily: "'VT323', monospace", fontSize: 16, color: '#fff' }}>A playful hub where ideas feel like coins to collect.</p>
        </div>
      </div>

      <div style={{ padding: '18px 14px 24px', background: '#7d4400' }}>
        <button
          type="button"
          onClick={onNext}
          style={{
            width: '100%',
            padding: '16px 0',
            fontFamily: "'Press Start 2P', monospace",
            fontSize: 13,
            color: '#fff',
            background: '#e52521',
            border: '3px solid #000',
            cursor: 'pointer',
            boxShadow: '4px 4px 0 0 #000',
          }}
        >
          NEXT PUB HINT
        </button>
      </div>
    </div>
    </HintFrame>
  );
}
