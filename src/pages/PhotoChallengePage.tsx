import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sfx } from '../lib/sfx';
import { PHOTO_CHALLENGE } from './photoChallenge';

interface Props {
  teamId: string;
  teamPin: string;
  onBack: () => void;
}

interface PhotoDraft {
  character: string;
  game: string;
}

export default function PhotoChallengePage({ teamId, teamPin, onBack }: Props) {
  // null = the thumbnail grid; 0+ = that photo's answer screen
  const [selected, setSelected] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<PhotoDraft[]>(() =>
    PHOTO_CHALLENGE.map(() => ({ character: '', game: '' }))
  );
  // What's currently saved in the DB per photo, so we can show a
  // "Submitted" state and whether the draft has unsaved edits.
  const [saved, setSaved] = useState<(PhotoDraft | null)[]>(() => PHOTO_CHALLENGE.map(() => null));
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    supabase
      .rpc('get_team_photo_answers', { p_team_id: teamId, p_pin: teamPin })
      .then(({ data, error: rpcError }) => {
        if (cancelled) return;
        if (rpcError) {
          setError('Could not load your saved answers.');
        } else {
          const nextDrafts = PHOTO_CHALLENGE.map(() => ({ character: '', game: '' }));
          const nextSaved: (PhotoDraft | null)[] = PHOTO_CHALLENGE.map(() => null);
          (data || []).forEach(
            (row: { photo_number: number; character_answer: string; game_answer: string }) => {
              const i = row.photo_number - 1;
              if (i < 0 || i >= PHOTO_CHALLENGE.length) return;
              nextDrafts[i] = { character: row.character_answer, game: row.game_answer };
              nextSaved[i] = { character: row.character_answer, game: row.game_answer };
            }
          );
          setDrafts(nextDrafts);
          setSaved(nextSaved);
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [teamId, teamPin]);

  const updateDraft = (index: number, field: keyof PhotoDraft, value: string) => {
    setDrafts(prev => prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)));
  };

  const submitAnswer = async (index: number) => {
    const character = drafts[index].character.trim();
    const game = drafts[index].game.trim();
    if (!character || !game) return;
    setSubmitting(true);
    setError('');
    const { error: rpcError } = await supabase.rpc('submit_photo_answer', {
      p_team_id: teamId,
      p_photo: index + 1,
      p_character: character,
      p_game: game,
      p_pin: teamPin,
    });
    setSubmitting(false);
    if (rpcError) {
      sfx.playError();
      setError('Could not save your answer. Please try again.');
      return;
    }
    sfx.playPowerUp();
    setSaved(prev => prev.map((s, i) => (i === index ? { character, game } : s)));
  };

  // ----- Single photo: the answer screen -----
  if (selected !== null) {
    const i = selected;
    const item = PHOTO_CHALLENGE[i];
    const isSubmitted = saved[i] !== null;
    const isDirty =
      drafts[i].character.trim() !== (saved[i]?.character ?? '') ||
      drafts[i].game.trim() !== (saved[i]?.game ?? '');
    return (
      <div className="flex flex-col gap-24 scale-up-anim">
        <button type="button" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setSelected(null)}>
          <ArrowLeft size={16} /> All photos
        </button>

        <div className="panel panel-dark text-center" style={{ padding: '24px' }}>
          <span className="kicker kicker-white">Who's that?</span>
          <h1 style={{ color: 'var(--color-white)', fontSize: 32 }}>PHOTO {i + 1}</h1>
        </div>

        {error && (
          <div className="alert alert-danger">
            <span>{error}</span>
          </div>
        )}

        <div className="panel panel-secondary" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <img
            src={item.image}
            alt={`Mystery character ${i + 1}`}
            style={{ width: '100%', borderRadius: 12, display: 'block' }}
          />
          <input
            id={`photo-${i}-character`}
            type="text"
            className="game-input"
            maxLength={100}
            placeholder="Character name…"
            value={drafts[i].character}
            onChange={e => updateDraft(i, 'character', e.target.value)}
          />
          <input
            id={`photo-${i}-game`}
            type="text"
            className="game-input"
            maxLength={100}
            placeholder="Game name…"
            value={drafts[i].game}
            onChange={e => updateDraft(i, 'game', e.target.value)}
          />
          <button
            type="button"
            className="btn btn-primary btn-block"
            disabled={
              submitting ||
              !drafts[i].character.trim() ||
              !drafts[i].game.trim() ||
              (isSubmitted && !isDirty)
            }
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
        <span className="kicker kicker-white">Who's that?</span>
        <h1 style={{ color: 'var(--color-white)', fontSize: 32, marginBottom: 8 }}>PHOTO CHALLENGE</h1>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, marginBottom: 0 }}>
          Tap a photo, then name the character and their game. 1 point each!
        </p>
        {!loading && (
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 8, marginBottom: 0 }}>
            {answeredCount}/{PHOTO_CHALLENGE.length} answered
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
          {PHOTO_CHALLENGE.map((item, i) => (
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
              aria-label={`Photo ${i + 1}${saved[i] ? ' (answered)' : ''}`}
            >
              <img
                src={item.image}
                alt={`Mystery character ${i + 1}`}
                loading="lazy"
                style={{ width: '100%', aspectRatio: '1', objectFit: 'contain', display: 'block' }}
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
              {saved[i] && (
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
