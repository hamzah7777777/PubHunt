import { Fragment, useEffect, useState } from 'react';
import { Compass, ListChecks, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sfx } from '../lib/sfx';
import { START_POINT, type PubHint } from './hints';
import { QUESTIONS_PER_QUIZ, QUIZ_COUNT } from './quiz';

interface Props {
  teamId: string;
  teamPin: string;
  route: string;
  hints: PubHint[];
  /** 0 opens the start point page; 1..hints.length open that hint. */
  onSelectHint: (index: number) => void;
  /** 1..QUIZ_COUNT opens that pub's questions. */
  onSelectQuiz: (quizNumber: number) => void;
}

// One menu for the whole evening: the stops (start point, pub hints, finish
// line) interleaved with each pub's questions in the order teams hit them.
// Stops are the full-width purple rows with a compass; questions are the
// lighter indented rows with a progress count, so the two read differently
// at a glance.
export default function RouteMenu({ teamId, teamPin, route, hints, onSelectHint, onSelectQuiz }: Props) {
  // Answered question counts per quiz for the progress fractions;
  // null until the fetch completes (the fractions just don't show).
  const [counts, setCounts] = useState<number[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .rpc('get_team_quiz_answers', { p_team_id: teamId, p_pin: teamPin })
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
  }, [teamId, teamPin]);

  return (
    <div className="flex flex-col gap-24 scale-up-anim">
      <div className="panel panel-dark text-center" style={{ padding: '32px 24px' }}>
        <span className="kicker kicker-white">Hints &amp; Pub Questions</span>
        <h1 style={{ color: 'var(--color-white)', fontSize: 32, marginBottom: 8 }}>YOUR ROUTE</h1>
        <div className="flex items-center justify-center gap-8" style={{ color: 'rgba(255,255,255,0.85)', fontSize: 18 }}>
          <Compass size={18} />
          <span>Route {route}</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 12, marginBottom: 0 }}>
          Solve each hint to find the pub, then answer its questions while you&rsquo;re there.
        </p>
      </div>

      <div className="flex flex-col gap-12">
        <button
          type="button"
          className="btn btn-primary btn-block btn-lg"
          style={{ minHeight: 64, justifyContent: 'flex-start', textAlign: 'left', gap: 12 }}
          onClick={() => {
            sfx.playClick();
            onSelectHint(0);
          }}
        >
          <MapPin size={18} style={{ flexShrink: 0 }} />
          {/* .btn is nowrap; the venue name is long, so let this column wrap */}
          <span style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0, whiteSpace: 'normal' }}>
            <span>Start</span>
            <span style={{ fontSize: 12, opacity: 0.85, lineHeight: 1.5 }}>{START_POINT.name}</span>
            <span style={{ fontSize: 12, opacity: 0.85 }}>{START_POINT.time}</span>
          </span>
        </button>

        {hints.map((h, i) => {
          const done = counts?.[i];
          const complete = done !== undefined && done >= QUESTIONS_PER_QUIZ;
          return (
            <Fragment key={h.label}>
              <button
                type="button"
                className="btn btn-primary btn-block btn-lg"
                style={{ minHeight: 64, justifyContent: 'flex-start', textAlign: 'left', gap: 12 }}
                onClick={() => {
                  sfx.playClick();
                  onSelectHint(i + 1);
                }}
              >
                <Compass size={18} style={{ flexShrink: 0 }} />
                <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span>{h.label} Hint</span>
                  <span style={{ fontSize: 12, opacity: 0.85 }}>{h.time}</span>
                </span>
              </button>

              {i < QUIZ_COUNT && (
                <button
                  type="button"
                  className={`btn ${complete ? 'btn-success' : 'btn-secondary'} btn-lg`}
                  style={{ minHeight: 56, width: 'calc(100% - 28px)', alignSelf: 'flex-end', justifyContent: 'space-between' }}
                  onClick={() => {
                    sfx.playClick();
                    onSelectQuiz(i + 1);
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <ListChecks size={16} style={{ flexShrink: 0 }} /> Pub {i + 1} Questions
                  </span>
                  {done !== undefined && <span className="btn-count">{done}/{QUESTIONS_PER_QUIZ}</span>}
                </button>
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
