import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sfx } from '../lib/sfx';
import { MISSING_VOWELS_CHALLENGE, MISSING_VOWELS_EXAMPLE } from './missingVowelsChallenge';

interface Props {
  teamId: string;
  teamPin: string;
  onBack: () => void;
}

export default function MissingVowelsChallengePage({ teamId, teamPin, onBack }: Props) {
  const [drafts, setDrafts] = useState<string[]>(() => MISSING_VOWELS_CHALLENGE.map(() => ''));
  // What's currently saved in the DB per puzzle, so we can show a
  // "Submitted" state and whether the draft has unsaved edits.
  const [saved, setSaved] = useState<(string | null)[]>(() => MISSING_VOWELS_CHALLENGE.map(() => null));
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    supabase
      .rpc('get_team_missing_vowels_answers', { p_team_id: teamId, p_pin: teamPin })
      .then(({ data, error: rpcError }) => {
        if (cancelled) return;
        if (rpcError) {
          setError('Could not load your saved answers.');
        } else {
          const nextDrafts = MISSING_VOWELS_CHALLENGE.map(() => '');
          const nextSaved: (string | null)[] = MISSING_VOWELS_CHALLENGE.map(() => null);
          (data || []).forEach((row: { puzzle_number: number; answer: string }) => {
            const i = row.puzzle_number - 1;
            if (i < 0 || i >= MISSING_VOWELS_CHALLENGE.length) return;
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
  }, [teamId, teamPin]);

  const submitAnswer = async (index: number) => {
    const answer = drafts[index].trim();
    if (!answer) return;
    setSubmitting(index);
    setError('');
    const { error: rpcError } = await supabase.rpc('submit_missing_vowels_answer', {
      p_team_id: teamId,
      p_puzzle: index + 1,
      p_answer: answer,
      p_pin: teamPin,
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
        <ArrowLeft size={16} /> Trivia Quiz
      </button>

      <div className="panel panel-dark text-center" style={{ padding: '24px' }}>
        <span className="kicker kicker-white">Two games, no vowels</span>
        <h1 style={{ color: 'var(--color-white)', fontSize: 32, marginBottom: 8 }}>MISSING VOWELS</h1>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, marginBottom: 8 }}>
          We've mashed together two video games, then removed the vowels. Find both names. 1 point each!
        </p>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, marginBottom: 0 }}>
          e.g. {MISSING_VOWELS_EXAMPLE.puzzle} = {MISSING_VOWELS_EXAMPLE.answer}
        </p>
      </div>

      {error && (
        <div className="alert alert-danger">
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--color-body-subtle)' }}>Loading…</p>
      ) : (
        MISSING_VOWELS_CHALLENGE.map((item, i) => {
          const isSubmitted = saved[i] !== null;
          const isDirty = drafts[i].trim() !== (saved[i] ?? '');
          return (
            <div key={i} className="panel panel-secondary" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label className="game-label" htmlFor={`vowels-${i}`}>
                Puzzle {i + 1}
              </label>
              <p
                style={{
                  margin: 0,
                  color: 'var(--fg-purple-strong)',
                  fontWeight: 600,
                  fontSize: 20,
                  letterSpacing: 2,
                  overflowWrap: 'anywhere',
                }}
              >
                {item.puzzle}
              </p>
              <input
                id={`vowels-${i}`}
                type="text"
                className="game-input"
                maxLength={100}
                placeholder="Which two games?…"
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
