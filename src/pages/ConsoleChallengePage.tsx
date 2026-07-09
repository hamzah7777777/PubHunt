import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sfx } from '../lib/sfx';
import { CONSOLE_CHALLENGE } from './consoleChallenge';

interface Props {
  teamId: string;
  onBack: () => void;
}

export default function ConsoleChallengePage({ teamId, onBack }: Props) {
  // null = the thumbnail grid; 0+ = that console's answer screen
  const [selected, setSelected] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<string[]>(() => CONSOLE_CHALLENGE.map(() => ''));
  // What's currently saved in the DB per console, so we can show a
  // "Submitted" state and whether the draft has unsaved edits.
  const [saved, setSaved] = useState<(string | null)[]>(() => CONSOLE_CHALLENGE.map(() => null));
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    supabase
      .rpc('get_team_console_answers', { p_team_id: teamId })
      .then(({ data, error: rpcError }) => {
        if (cancelled) return;
        if (rpcError) {
          setError('Could not load your saved answers.');
        } else {
          const nextDrafts = CONSOLE_CHALLENGE.map(() => '');
          const nextSaved: (string | null)[] = CONSOLE_CHALLENGE.map(() => null);
          (data || []).forEach((row: { console_number: number; answer: string }) => {
            const i = row.console_number - 1;
            if (i < 0 || i >= CONSOLE_CHALLENGE.length) return;
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
  }, [teamId]);

  const submitAnswer = async (index: number) => {
    const answer = drafts[index].trim();
    if (!answer) return;
    setSubmitting(true);
    setError('');
    const { error: rpcError } = await supabase.rpc('submit_console_answer', {
      p_team_id: teamId,
      p_console: index + 1,
      p_answer: answer,
    });
    setSubmitting(false);
    if (rpcError) {
      sfx.playError();
      setError('Could not save your answer. Please try again.');
      return;
    }
    sfx.playPowerUp();
    setSaved(prev => prev.map((s, i) => (i === index ? answer : s)));
  };

  // ----- Single console: the answer screen -----
  if (selected !== null) {
    const i = selected;
    const item = CONSOLE_CHALLENGE[i];
    const isSubmitted = saved[i] !== null;
    const isDirty = drafts[i].trim() !== (saved[i] ?? '');
    return (
      <div className="flex flex-col gap-24 scale-up-anim">
        <button type="button" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setSelected(null)}>
          <ArrowLeft size={16} /> All consoles
        </button>

        <div className="panel panel-dark text-center" style={{ padding: '24px' }}>
          <span className="kicker kicker-white">Name that console!</span>
          <h1 style={{ color: 'var(--color-white)', fontSize: 32 }}>CONSOLE {i + 1}</h1>
        </div>

        {error && (
          <div className="alert alert-danger">
            <span>{error}</span>
          </div>
        )}

        <div className="panel panel-secondary" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <img
            src={item.image}
            alt={`Mystery console ${i + 1}`}
            style={{ width: '100%', borderRadius: 12, display: 'block' }}
          />
          <input
            id={`console-${i}-answer`}
            type="text"
            className="game-input"
            placeholder="Console name…"
            value={drafts[i]}
            onChange={e => setDrafts(prev => prev.map((d, j) => (j === i ? e.target.value : d)))}
          />
          <button
            type="button"
            className="btn btn-primary btn-block"
            disabled={submitting || !drafts[i].trim() || (isSubmitted && !isDirty)}
            onClick={() => submitAnswer(i)}
          >
            {submitting ? (
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
      </div>
    );
  }

  // ----- The thumbnail grid -----
  const answeredCount = saved.filter(s => s !== null).length;

  return (
    <div className="flex flex-col gap-24 scale-up-anim">
      <button type="button" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={onBack}>
        <ArrowLeft size={16} /> Trivia Quiz
      </button>

      <div className="panel panel-dark text-center" style={{ padding: '24px' }}>
        <span className="kicker kicker-white">Name that console!</span>
        <h1 style={{ color: 'var(--color-white)', fontSize: 32, marginBottom: 8 }}>CONSOLE CHALLENGE</h1>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, marginBottom: 0 }}>
          Tap a photo, then name the console. 1 point each!
        </p>
        {!loading && (
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 8, marginBottom: 0 }}>
            {answeredCount}/{CONSOLE_CHALLENGE.length} answered
          </p>
        )}
      </div>

      {error && (
        <div className="alert alert-danger">
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--color-body-subtle)' }}>Loading…</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {CONSOLE_CHALLENGE.map((item, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                sfx.playClick();
                setSelected(i);
              }}
              style={{
                position: 'relative',
                padding: 0,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                borderRadius: 12,
                overflow: 'hidden',
                lineHeight: 0,
              }}
              aria-label={`Console ${i + 1}${saved[i] ? ' (answered)' : ''}`}
            >
              <img
                src={item.image}
                alt={`Mystery console ${i + 1}`}
                loading="lazy"
                style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
              />
              <span
                style={{
                  position: 'absolute',
                  top: 6,
                  left: 6,
                  background: 'rgba(0,0,0,0.65)',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 700,
                  lineHeight: 1,
                  padding: '4px 7px',
                  borderRadius: 999,
                }}
              >
                {i + 1}
              </span>
              {saved[i] !== null && (
                <span
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    background: '#1c7c2a',
                    color: '#fff',
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Check size={14} />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
