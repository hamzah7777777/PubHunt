import { useEffect, useState } from 'react';
import { ListChecks } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sfx } from '../lib/sfx';
import { QUESTIONS_PER_QUIZ, QUIZ_COUNT } from './quiz';

interface Props {
  teamId: string;
  route: string;
  /** 1..QUIZ_COUNT opens that quiz. */
  onSelect: (quizNumber: number) => void;
}

export default function QuizMenu({ teamId, route, onSelect }: Props) {
  // Answered question counts per quiz for the progress fractions;
  // null until the fetch completes (the fractions just don't show).
  const [counts, setCounts] = useState<number[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .rpc('get_team_quiz_answers', { p_team_id: teamId })
      .then(({ data, error }) => {
        if (cancelled || error) return;
        const answered = Array.from({ length: QUIZ_COUNT }, () => new Set<number>());
        (data || []).forEach((row: { quiz_number: number; question_number: number }) => {
          const q = row.quiz_number - 1;
          if (q < 0 || q >= QUIZ_COUNT) return;
          if (row.question_number < 1 || row.question_number > QUESTIONS_PER_QUIZ) return;
          answered[q].add(row.question_number);
        });
        setCounts(answered.map(s => s.size));
      });
    return () => {
      cancelled = true;
    };
  }, [teamId]);

  return (
    <div className="flex flex-col gap-24 scale-up-anim">
      <div className="panel panel-dark text-center" style={{ padding: '32px 24px' }}>
        <span className="kicker kicker-white">Bonus Round</span>
        <h1 style={{ color: 'var(--color-white)', fontSize: 32, marginBottom: 8 }}>ROUTE QUIZ</h1>
        <div className="flex items-center justify-center gap-8" style={{ color: 'rgba(255,255,255,0.85)', fontSize: 18 }}>
          <ListChecks size={18} />
          <span>Route {route}</span>
        </div>
      </div>

      <div className="flex flex-col gap-12">
        {Array.from({ length: QUIZ_COUNT }, (_, i) => i + 1).map(n => {
          const done = counts?.[n - 1];
          const complete = done !== undefined && done >= QUESTIONS_PER_QUIZ;
          return (
            <button
              key={n}
              type="button"
              className={`btn ${complete ? 'btn-success' : 'btn-primary'} btn-block btn-lg`}
              style={{ minHeight: 64, justifyContent: 'space-between' }}
              onClick={() => {
                sfx.playClick();
                onSelect(n);
              }}
            >
              <span>Quiz {n}</span>
              {done !== undefined && <span className="btn-count">{done}/{QUESTIONS_PER_QUIZ}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
