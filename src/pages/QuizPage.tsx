import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sfx } from '../lib/sfx';
import { ROUTE_QUIZZES } from './quiz';

interface Props {
  teamId: string;
  route: 'A' | 'B';
  quizNumber: number;
  onBack: () => void;
}

export default function QuizPage({ teamId, route, quizNumber, onBack }: Props) {
  const questions = ROUTE_QUIZZES[route][quizNumber - 1];
  const [drafts, setDrafts] = useState<string[]>(() => questions.map(() => ''));
  // What's currently saved in the DB per question, so we can show a
  // "Submitted" state and whether the draft has unsaved edits.
  const [saved, setSaved] = useState<(string | null)[]>(() => questions.map(() => null));
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    supabase
      .rpc('get_team_quiz_answers', { p_team_id: teamId })
      .then(({ data, error: rpcError }) => {
        if (cancelled) return;
        if (rpcError) {
          setError('Could not load your saved answers.');
        } else {
          const nextDrafts = questions.map(() => '');
          const nextSaved: (string | null)[] = questions.map(() => null);
          (data || []).forEach((row: { quiz_number: number; question_number: number; answer: string }) => {
            if (row.quiz_number !== quizNumber) return;
            const i = row.question_number - 1;
            if (i < 0 || i >= questions.length) return;
            nextDrafts[i] = row.answer;
            nextSaved[i] = row.answer;
          });
          setDrafts(nextDrafts);
          setSaved(nextSaved);
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, quizNumber]);

  const submitAnswer = async (index: number) => {
    const answer = drafts[index].trim();
    if (!answer) return;
    setSubmitting(index);
    setError('');
    const { error: rpcError } = await supabase.rpc('submit_quiz_answer', {
      p_team_id: teamId,
      p_quiz: quizNumber,
      p_question: index + 1,
      p_answer: answer,
    });
    setSubmitting(null);
    if (rpcError) {
      sfx.playError();
      setError('Could not save your answer. Please try again.');
      return;
    }
    sfx.playPowerUp();
    setSaved(prev => prev.map((s, i) => (i === index ? answer : s)));
  };

  return (
    <div className="flex flex-col gap-24 scale-up-anim">
      <button type="button" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={onBack}>
        <ArrowLeft size={16} /> All quizzes
      </button>

      <div className="panel panel-dark text-center" style={{ padding: '24px' }}>
        <span className="kicker kicker-white">Route {route}</span>
        <h1 style={{ color: 'var(--color-white)', fontSize: 32 }}>QUIZ {quizNumber}</h1>
      </div>

      {error && (
        <div className="alert alert-danger">
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--color-body-subtle)' }}>Loading…</p>
      ) : (
        questions.map((question, i) => {
          const isSubmitted = saved[i] !== null;
          const isDirty = drafts[i].trim() !== (saved[i] ?? '');
          return (
            <div key={i} className="panel panel-secondary" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label className="game-label" htmlFor={`quiz-q${i}`}>
                Question {i + 1}
              </label>
              <p style={{ margin: 0, color: 'var(--fg-purple-strong)', fontWeight: 600 }}>{question}</p>
              <input
                id={`quiz-q${i}`}
                type="text"
                className="game-input"
                placeholder="Your answer…"
                value={drafts[i]}
                onChange={e => setDrafts(prev => prev.map((d, j) => (j === i ? e.target.value : d)))}
              />
              <button
                type="button"
                className="btn btn-primary btn-block"
                disabled={submitting === i || !drafts[i].trim() || (isSubmitted && !isDirty)}
                onClick={() => submitAnswer(i)}
              >
                {submitting === i ? (
                  'Saving…'
                ) : isSubmitted && !isDirty ? (
                  <>
                    <Check size={16} /> Submitted
                  </>
                ) : (
                  <>
                    <Send size={16} /> {isSubmitted ? 'Resubmit' : 'Submit'}
                  </>
                )}
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}
