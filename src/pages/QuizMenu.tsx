import { ListChecks } from 'lucide-react';
import { sfx } from '../lib/sfx';
import { QUIZ_COUNT } from './quiz';

interface Props {
  route: string;
  /** 1..QUIZ_COUNT opens that quiz. */
  onSelect: (quizNumber: number) => void;
}

export default function QuizMenu({ route, onSelect }: Props) {
  return (
    <div className="flex flex-col gap-24 scale-up-anim">
      <div className="panel panel-dark text-center" style={{ padding: '32px 24px' }}>
        <span className="kicker kicker-white">Bonus Round</span>
        <h1 style={{ color: 'var(--color-white)', fontSize: 32, marginBottom: 8 }}>PUB QUIZ</h1>
        <div className="flex items-center justify-center gap-8" style={{ color: 'rgba(255,255,255,0.85)', fontSize: 18 }}>
          <ListChecks size={18} />
          <span>Route {route}</span>
        </div>
      </div>

      <div className="flex flex-col gap-12">
        {Array.from({ length: QUIZ_COUNT }, (_, i) => i + 1).map(n => (
          <button
            key={n}
            type="button"
            className="btn btn-primary btn-block btn-lg"
            style={{ minHeight: 64 }}
            onClick={() => {
              sfx.playClick();
              onSelect(n);
            }}
          >
            Quiz {n}
          </button>
        ))}
      </div>
    </div>
  );
}
