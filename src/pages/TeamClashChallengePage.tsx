import React, { useEffect, useState } from 'react';
import { ArrowLeft, Check, Send, Swords, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sfx } from '../lib/sfx';
import { FALLBACK_COVER, getCoverMap } from '../lib/covers';

interface Props {
  teamId: string;
  onBack: () => void;
}

interface ClashTarget {
  team_id: string;
  game_theme: string;
}

interface ClashAnswer {
  answer: string;
  is_correct: boolean | null;
}

export default function TeamClashChallengePage({ teamId, onBack }: Props) {
  const [targets, setTargets] = useState<ClashTarget[]>([]);
  // Saved answer per rival team id, so tiles can show a submitted state.
  const [answers, setAnswers] = useState<Map<string, ClashAnswer>>(new Map());
  const [coverMap, setCoverMap] = useState<Map<string, string>>(new Map());
  const [selected, setSelected] = useState<ClashTarget | null>(null);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      supabase.rpc('get_clash_targets', { p_team_id: teamId }),
      supabase.rpc('get_team_clash_answers', { p_team_id: teamId }),
      getCoverMap(),
    ]).then(([targetsRes, answersRes, covers]) => {
      if (cancelled) return;
      if (targetsRes.error || answersRes.error) {
        setError('Could not load the other teams. Please try again later.');
      } else {
        setTargets((targetsRes.data as ClashTarget[]) || []);
        const next = new Map<string, ClashAnswer>();
        (answersRes.data || []).forEach(
          (row: { target_team_id: string; answer: string; is_correct: boolean | null }) => {
            next.set(row.target_team_id, { answer: row.answer, is_correct: row.is_correct });
          }
        );
        setAnswers(next);
      }
      setCoverMap(covers);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [teamId]);

  const coverFor = (theme: string) => coverMap.get(theme.trim().toLowerCase()) ?? FALLBACK_COVER;

  const openTarget = (target: ClashTarget) => {
    sfx.playClick();
    setSelected(target);
    setDraft(answers.get(target.team_id)?.answer ?? '');
    setError('');
  };

  const closePopup = () => {
    setSelected(null);
    setDraft('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const answer = draft.trim();
    if (!selected || !answer) return;
    setSubmitting(true);
    setError('');
    const { error: rpcError } = await supabase.rpc('submit_team_clash_answer', {
      p_team_id: teamId,
      p_target_team_id: selected.team_id,
      p_answer: answer,
    });
    setSubmitting(false);
    if (rpcError) {
      sfx.playError();
      setError('Could not save your answer. Please try again.');
      return;
    }
    sfx.playPowerUp();
    setAnswers(prev => new Map(prev).set(selected.team_id, { answer, is_correct: null }));
    closePopup();
  };

  const answeredCount = targets.filter(t => answers.has(t.team_id)).length;

  return (
    <div className="flex flex-col gap-24 scale-up-anim">
      <button type="button" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={onBack}>
        <ArrowLeft size={16} /> Challenges
      </button>

      <div className="panel panel-dark text-center" style={{ padding: '24px' }}>
        <span className="kicker kicker-white">Know your rivals</span>
        <h1 style={{ color: 'var(--color-white)', fontSize: 32, marginBottom: 8 }}>TEAM CLASH</h1>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16, marginBottom: 0 }}>
          <Swords size={16} style={{ verticalAlign: 'text-bottom' }} /> Find out the team name of every
          other team on your route. Tap a cover and enter their name. 1 point each!
        </p>
        {!loading && (
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 8, marginBottom: 0 }}>
            {answeredCount}/{targets.length} answered
          </p>
        )}
      </div>

      {error && !selected && (
        <div className="alert alert-danger">
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--color-body-subtle)' }}>Loading teams…</p>
      ) : targets.length === 0 ? (
        <p style={{ color: 'var(--color-body-subtle)' }}>No other teams on your route yet.</p>
      ) : (
        <div className="cover-grid">
          {targets.map(t => (
            <button
              key={t.team_id}
              type="button"
              className="cover-tile"
              style={{ position: 'relative' }}
              onClick={() => openTarget(t)}
              aria-label={`Name the team playing as ${t.game_theme}${answers.has(t.team_id) ? ' (answered)' : ''}`}
            >
              <img src={coverFor(t.game_theme)} alt={t.game_theme} loading="lazy" />
              <span className="cover-tile-name">{t.game_theme}</span>
              {answers.has(t.team_id) && (
                <span className="cover-tile-done">
                  <Check size={14} />
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="game-modal-overlay" onClick={closePopup}>
          <form
            className="game-modal panel panel-secondary"
            role="dialog"
            aria-modal="true"
            onClick={e => e.stopPropagation()}
            onSubmit={handleSubmit}
          >
            <button
              type="button"
              className="btn btn-ghost btn-sm game-modal-close"
              onClick={closePopup}
              aria-label="Close"
            >
              <X size={16} />
            </button>
            <img
              src={coverFor(selected.game_theme)}
              alt={selected.game_theme}
              style={{ width: '60%', margin: '0 auto', display: 'block' }}
            />
            <span className="kicker text-center" style={{ display: 'block', marginTop: 12 }}>
              {selected.game_theme}
            </span>
            <p className="text-center" style={{ color: 'var(--fg-purple-strong)', fontWeight: 600, marginBottom: 12 }}>
              What is this team called?
            </p>
            <input
              type="text"
              className="game-input"
              placeholder="Their team name…"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              autoFocus
            />
            {error && (
              <div className="alert alert-danger" style={{ marginTop: 12 }}>
                <span>{error}</span>
              </div>
            )}
            <button
              type="submit"
              className="btn btn-primary btn-block"
              style={{ marginTop: 12 }}
              disabled={submitting || !draft.trim()}
            >
              {submitting ? (
                'Saving…'
              ) : (
                <>
                  <Send size={16} /> {answers.has(selected.team_id) ? 'Resubmit' : 'Submit'}
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
