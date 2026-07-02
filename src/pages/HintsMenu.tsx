import { Compass } from 'lucide-react';
import { sfx } from '../lib/sfx';
import { START_POINT, type PubHint } from './hints';

interface Props {
  route: string;
  hints: PubHint[];
  /** 0 opens the start point page; 1..hints.length open that hint. */
  onSelect: (index: number) => void;
}

export default function HintsMenu({ route, hints, onSelect }: Props) {
  return (
    <div className="flex flex-col gap-24 scale-up-anim">
      <div className="panel panel-dark text-center" style={{ padding: '32px 24px' }}>
        <span className="kicker kicker-white">Level Select</span>
        <h1 style={{ color: 'var(--color-white)', fontSize: 32, marginBottom: 8 }}>PUB HINTS</h1>
        <div className="flex items-center justify-center gap-8" style={{ color: 'rgba(255,255,255,0.85)', fontSize: 18 }}>
          <Compass size={18} />
          <span>Route {route}</span>
        </div>
      </div>

      <div className="flex flex-col gap-12">
        <button
          type="button"
          className="btn btn-secondary btn-block btn-lg"
          style={{ minHeight: 64, flexDirection: 'column', gap: 4 }}
          onClick={() => {
            sfx.playClick();
            onSelect(0);
          }}
        >
          <span>Start — {START_POINT.name}</span>
          <span style={{ fontSize: 12, opacity: 0.85 }}>{START_POINT.time}</span>
        </button>

        {hints.map((h, i) => (
          <button
            key={h.label}
            type="button"
            className="btn btn-primary btn-block btn-lg"
            style={{ minHeight: 64, flexDirection: 'column', gap: 4 }}
            onClick={() => {
              sfx.playClick();
              onSelect(i + 1);
            }}
          >
            <span>{h.label}</span>
            <span style={{ fontSize: 12, opacity: 0.85 }}>{h.time}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
