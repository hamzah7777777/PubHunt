import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { AdminTeam, Award } from '../types';

interface Props {
  teams: AdminTeam[];
}

// Editor for the public /results awards page (see supabase/awards.sql).
// Podium rows (place 1-3) take a winner + points line; special award cards
// are fully editable and can be added, reordered and deleted. Edits save
// on blur, same as the team editor.
export default function AdminAwards({ teams }: Props) {
  const [awards, setAwards] = useState<Award[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const { data, error: loadError } = await supabase.from('awards').select('*');
      if (loadError) {
        setError(`${loadError.message}. Has awards.sql been run?`);
      } else {
        setAwards((data as Award[]) || []);
      }
      setLoading(false);
    })();
  }, []);

  const updateField = (id: string, field: keyof Award, value: string | null) => {
    setAwards(prev => prev.map(a => (a.id === id ? { ...a, [field]: value } : a)));
  };

  const saveAward = async (award: Award) => {
    const { error: saveError } = await supabase
      .from('awards')
      .update({
        title: award.title,
        blurb: award.blurb,
        // Empty inputs are stored as null; a null winner shows the card as
        // "TO BE REVEALED", null 2nd/3rd just shorten the list.
        winner: award.winner?.trim() || null,
        second: award.second?.trim() || null,
        third: award.third?.trim() || null,
        detail: award.detail?.trim() || null,
        sort_order: award.sort_order,
      })
      .eq('id', award.id);
    if (saveError) setError(saveError.message);
  };

  const addAward = async () => {
    const title = prompt('New award title?');
    if (!title) return;
    const sortOrder = Math.max(0, ...awards.filter(a => a.place === null).map(a => a.sort_order)) + 1;
    const { data, error: insertError } = await supabase
      .from('awards')
      .insert({ slug: `award-${Date.now()}`, title, blurb: '', sort_order: sortOrder })
      .select()
      .single();
    if (insertError || !data) {
      setError(insertError?.message || 'Failed to add the award');
      return;
    }
    setAwards(prev => [...prev, data as Award]);
  };

  const deleteAward = async (award: Award) => {
    if (!confirm(`Delete the "${award.title}" award?`)) return;
    const { error: deleteError } = await supabase.from('awards').delete().eq('id', award.id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setAwards(prev => prev.filter(a => a.id !== award.id));
  };

  // Swap sort_order with the neighbour above/below and save both rows.
  const moveAward = async (award: Award, dir: -1 | 1) => {
    const ordered = awards.filter(a => a.place === null).sort((a, b) => a.sort_order - b.sort_order);
    const i = ordered.findIndex(a => a.id === award.id);
    const other = ordered[i + dir];
    if (!other) return;
    const a = { ...award, sort_order: other.sort_order };
    const b = { ...other, sort_order: award.sort_order };
    setAwards(prev => prev.map(x => (x.id === a.id ? a : x.id === b.id ? b : x)));
    await Promise.all([saveAward(a), saveAward(b)]);
  };

  if (loading) {
    return <p className="admin-empty-roster">Loading awards…</p>;
  }

  const podium = [1, 2, 3]
    .map(place => awards.find(a => a.place === place))
    .filter((a): a is Award => a !== undefined);
  const specials = awards
    .filter(a => a.place === null)
    .sort((a, b) => a.sort_order - b.sort_order);

  const PLACE_LABEL: Record<number, string> = { 1: '1st place', 2: '2nd place', 3: '3rd place' };

  return (
    <>
      <div className="admin-toolbar">
        <span className="admin-stats">
          Shown on the public results page · leave a winner blank for “TO BE REVEALED”
        </span>
        <div className="admin-toolbar-actions">
          <a className="admin-btn" href="./#results" target="_blank" rel="noreferrer">
            <ExternalLink size={14} /> View results page
          </a>
          <button className="admin-btn admin-btn-primary" onClick={addAward}>
            <Plus size={14} /> Add award
          </button>
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}

      {/* Team-name suggestions for every winner input on the page. */}
      <datalist id="awards-team-names">
        {teams.map(t => (
          <option key={t.id} value={t.name} />
        ))}
      </datalist>

      <h3 className="admin-awards-subhead">Champions podium</h3>
      <div className="admin-awards-list">
        {podium.map(award => (
          <div key={award.id} className="admin-award-card admin-award-podium">
            <span className={`admin-lb-rank admin-lb-rank-${award.place}`}>{award.place}</span>
            <label className="admin-label admin-award-winner-label">
              {PLACE_LABEL[award.place ?? 0]}
              <input
                className="admin-field"
                type="text"
                list="awards-team-names"
                placeholder="Winning team…"
                value={award.winner ?? ''}
                onChange={e => updateField(award.id, 'winner', e.target.value)}
                onBlur={() => saveAward(award)}
              />
            </label>
            <label className="admin-label admin-award-detail-label">
              Points line
              <input
                className="admin-field"
                type="text"
                placeholder="e.g. 133 pts"
                value={award.detail ?? ''}
                onChange={e => updateField(award.id, 'detail', e.target.value)}
                onBlur={() => saveAward(award)}
              />
            </label>
          </div>
        ))}
        {podium.length === 0 && (
          <p className="admin-empty-roster">No podium rows found — has awards.sql been run?</p>
        )}
      </div>

      <h3 className="admin-awards-subhead">Awards &amp; honours</h3>
      <div className="admin-awards-list">
        {specials.map((award, i) => (
          <div key={award.id} className="admin-award-card">
            <div className="admin-award-fields">
              <label className="admin-label">
                Title
                <input
                  className="admin-field"
                  type="text"
                  value={award.title}
                  onChange={e => updateField(award.id, 'title', e.target.value)}
                  onBlur={() => saveAward(award)}
                />
              </label>
              <label className="admin-label">
                Blurb
                <input
                  className="admin-field"
                  type="text"
                  placeholder="What the award is for…"
                  value={award.blurb}
                  onChange={e => updateField(award.id, 'blurb', e.target.value)}
                  onBlur={() => saveAward(award)}
                />
              </label>
              <label className="admin-label">
                1st
                <input
                  className="admin-field"
                  type="text"
                  list="awards-team-names"
                  placeholder="Blank = TO BE REVEALED"
                  value={award.winner ?? ''}
                  onChange={e => updateField(award.id, 'winner', e.target.value)}
                  onBlur={() => saveAward(award)}
                />
              </label>
              <label className="admin-label">
                2nd
                <input
                  className="admin-field"
                  type="text"
                  list="awards-team-names"
                  placeholder="e.g. Team — 12/12"
                  value={award.second ?? ''}
                  onChange={e => updateField(award.id, 'second', e.target.value)}
                  onBlur={() => saveAward(award)}
                />
              </label>
              <label className="admin-label">
                3rd
                <input
                  className="admin-field"
                  type="text"
                  list="awards-team-names"
                  placeholder="e.g. Team — 11/12"
                  value={award.third ?? ''}
                  onChange={e => updateField(award.id, 'third', e.target.value)}
                  onBlur={() => saveAward(award)}
                />
              </label>
              <label className="admin-label">
                Tie note
                <input
                  className="admin-field"
                  type="text"
                  placeholder="e.g. Tied 15s split by overall total"
                  value={award.detail ?? ''}
                  onChange={e => updateField(award.id, 'detail', e.target.value)}
                  onBlur={() => saveAward(award)}
                />
              </label>
            </div>
            <div className="admin-award-actions">
              <button
                className="admin-btn admin-btn-icon"
                onClick={() => moveAward(award, -1)}
                disabled={i === 0}
                aria-label="Move up"
              >
                <ArrowUp size={13} />
              </button>
              <button
                className="admin-btn admin-btn-icon"
                onClick={() => moveAward(award, 1)}
                disabled={i === specials.length - 1}
                aria-label="Move down"
              >
                <ArrowDown size={13} />
              </button>
              <button
                className="admin-btn admin-btn-icon admin-btn-danger"
                onClick={() => deleteAward(award)}
                aria-label="Delete award"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
        {specials.length === 0 && <p className="admin-empty-roster">No special awards yet.</p>}
      </div>
    </>
  );
}
