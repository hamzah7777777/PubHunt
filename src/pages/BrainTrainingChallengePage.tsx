import { useEffect, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sfx } from '../lib/sfx';
import { BRAIN_TRAINING_CHALLENGE } from './brainTrainingChallenge';
import './BrainTrainingChallengePage.css';

interface Props {
  teamId: string;
  onBack: () => void;
}

// All the professor faces in public/braintrainer — bump the count when
// adding braintrainer<N+1>.png to the folder.
const FACE_COUNT = 17;
const FACES = Array.from({ length: FACE_COUNT }, (_, i) => `/braintrainer/braintrainer${i + 1}.png`);

export default function BrainTrainingChallengePage({ teamId, onBack }: Props) {
  const [drafts, setDrafts] = useState<string[]>(() => BRAIN_TRAINING_CHALLENGE.map(() => ''));
  // What's currently saved in the DB per question, so we can show a
  // "Submitted" state and whether the draft has unsaved edits.
  const [saved, setSaved] = useState<(string | null)[]>(() => BRAIN_TRAINING_CHALLENGE.map(() => null));
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  // Every tap on the screen and every keystroke in the answer box swaps
  // the professor to a random different face; the counter doubles as the
  // animation key so his "pop" replays each time without him moving.
  const [reactions, setReactions] = useState(0);
  const [face, setFace] = useState(0);
  const react = () => {
    setReactions(r => r + 1);
    setFace(prev => {
      const next = Math.floor(Math.random() * (FACES.length - 1));
      return next >= prev ? next + 1 : next;
    });
  };

  useEffect(() => {
    let cancelled = false;
    supabase
      .rpc('get_team_brain_training_answers', { p_team_id: teamId })
      .then(({ data, error: rpcError }) => {
        if (cancelled) return;
        if (rpcError) {
          setError('Could not load your saved answers.');
        } else {
          const nextDrafts = BRAIN_TRAINING_CHALLENGE.map(() => '');
          const nextSaved: (string | null)[] = BRAIN_TRAINING_CHALLENGE.map(() => null);
          (data || []).forEach((row: { question_number: number; answer: string }) => {
            const i = row.question_number - 1;
            if (i < 0 || i >= BRAIN_TRAINING_CHALLENGE.length) return;
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

  const submitAnswer = async () => {
    const index = current;
    const answer = drafts[index].trim();
    if (!answer) return;
    setSubmitting(true);
    setError('');
    const { error: rpcError } = await supabase.rpc('submit_brain_training_answer', {
      p_team_id: teamId,
      p_question: index + 1,
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

  const item = BRAIN_TRAINING_CHALLENGE[current];
  const isSubmitted = saved[current] !== null;
  const isDirty = drafts[current].trim() !== (saved[current] ?? '');
  const done = isSubmitted && !isDirty;

  return (
    <div className="bt-shell scale-up-anim" onPointerDown={react}>
      <div className="bt-screen">
        <div className="bt-topbar">
          <button type="button" className="bt-back" onClick={onBack}>
            Back
          </button>
          <div className="bt-title">Brain Training</div>
        </div>

        {error && <div className="bt-error">{error}</div>}

        {loading ? (
          <p className="bt-loading">Loading…</p>
        ) : (
          <>
            <div className="bt-dots">
              {BRAIN_TRAINING_CHALLENGE.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Question ${i + 1}`}
                  className={`bt-dot${saved[i] !== null ? ' bt-dot-done' : ''}${i === current ? ' bt-dot-current' : ''}`}
                  onClick={() => setCurrent(i)}
                />
              ))}
            </div>

            <div className="bt-ask">
              <div className="bt-bubble">
                <p>
                  <span className="bt-qnum">Question {current + 1}:</span> {item.question}
                </p>
              </div>
              <div key={reactions} className={`bt-face${reactions > 0 ? ' bt-face-react' : ''}`}>
                {FACES.map((src, i) => (
                  <img
                    key={src}
                    src={src}
                    alt=""
                    draggable={false}
                    className={face === i ? 'bt-face-on' : undefined}
                  />
                ))}
              </div>
            </div>

            <input
              type="text"
              className="bt-input"
              placeholder="Write your answer…"
              value={drafts[current]}
              onChange={e => {
                react();
                setDrafts(prev => prev.map((d, j) => (j === current ? e.target.value : d)));
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') submitAnswer();
              }}
            />

            <div className="bt-nav">
              <button
                type="button"
                className="bt-btn bt-step"
                disabled={current === 0}
                onClick={() => setCurrent(c => c - 1)}
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <button
                type="button"
                className={`bt-btn bt-submit${done ? ' bt-submit-done' : ''}`}
                disabled={submitting || !drafts[current].trim() || done}
                onClick={submitAnswer}
              >
                {submitting ? (
                  'Saving…'
                ) : done ? (
                  <>
                    <Check size={16} /> Submitted
                  </>
                ) : (
                  <>
                    <Send size={16} /> {isSubmitted ? 'Resubmit' : 'Submit'}
                  </>
                )}
              </button>
              <button
                type="button"
                className="bt-btn bt-step"
                disabled={current === BRAIN_TRAINING_CHALLENGE.length - 1}
                onClick={() => setCurrent(c => c + 1)}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
