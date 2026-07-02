import { useEffect, useState } from 'react';
import { LogOut, Plus, Trash2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { AdminParticipant, AdminTeam } from '../types';
import './AdminDashboard.css';

interface Props {
  onLogout: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Confirmed',
  tbc: 'TBC',
  withdrawn: 'Withdrawn',
};

function randomPin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export default function AdminDashboard({ onLogout }: Props) {
  const [teams, setTeams] = useState<AdminTeam[]>([]);
  const [participants, setParticipants] = useState<AdminParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [teamsRes, participantsRes] = await Promise.all([
        supabase.from('teams').select('*').order('name'),
        supabase.from('participants').select('*').order('row_order'),
      ]);

      if (teamsRes.error || participantsRes.error) {
        setError(teamsRes.error?.message || participantsRes.error?.message || 'Failed to load data');
      } else {
        setTeams((teamsRes.data as AdminTeam[]) || []);
        setParticipants((participantsRes.data as AdminParticipant[]) || []);
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!editingTeamId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEditingTeamId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editingTeamId]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  const updateTeamField = (teamId: string, field: keyof AdminTeam, value: string) => {
    setTeams(prev => prev.map(t => (t.id === teamId ? { ...t, [field]: value } : t)));
  };

  const saveTeam = async (team: AdminTeam) => {
    const { error: saveError } = await supabase
      .from('teams')
      .update({ name: team.name, game_theme: team.game_theme, status: team.status, route: team.route, pin: team.pin })
      .eq('id', team.id);
    if (saveError) setError(saveError.message);
  };

  const deleteTeam = async (teamId: string) => {
    if (!confirm('Delete this team and all its participants?')) return;
    const { error: deleteError } = await supabase.from('teams').delete().eq('id', teamId);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setEditingTeamId(null);
    setTeams(prev => prev.filter(t => t.id !== teamId));
    setParticipants(prev => prev.filter(p => p.team_id !== teamId));
  };

  const addTeam = async () => {
    const name = prompt('New team name?');
    if (!name) return;
    const { data, error: insertError } = await supabase
      .from('teams')
      .insert({ name, game_theme: 'TBC', status: 'tbc', route: 'A', pin: randomPin() })
      .select()
      .single();
    if (insertError || !data) {
      setError(insertError?.message || 'Failed to add team');
      return;
    }
    setTeams(prev => [...prev, data as AdminTeam].sort((a, b) => a.name.localeCompare(b.name)));
    setEditingTeamId((data as AdminTeam).id);
  };

  const updateParticipantField = (
    id: string,
    field: keyof AdminParticipant,
    value: string | boolean
  ) => {
    setParticipants(prev => prev.map(p => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const saveParticipant = async (p: AdminParticipant) => {
    const { error: saveError } = await supabase
      .from('participants')
      .update({ full_name: p.full_name, is_internal: p.is_internal, role: p.role })
      .eq('id', p.id);
    if (saveError) setError(saveError.message);
  };

  const deleteParticipant = async (id: string) => {
    const { error: deleteError } = await supabase.from('participants').delete().eq('id', id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setParticipants(prev => prev.filter(p => p.id !== id));
  };

  const addParticipant = async (teamId: string) => {
    const fullName = prompt('New member name?');
    if (!fullName) return;
    const rowOrder = participants.filter(p => p.team_id === teamId).length;
    const { data, error: insertError } = await supabase
      .from('participants')
      .insert({ team_id: teamId, full_name: fullName, is_internal: true, role: 'participant', row_order: rowOrder })
      .select()
      .single();
    if (insertError || !data) {
      setError(insertError?.message || 'Failed to add member');
      return;
    }
    setParticipants(prev => [...prev, data as AdminParticipant]);
  };

  if (loading) {
    return <div className="admin-dashboard admin-loading">Loading…</div>;
  }

  const editingTeam = teams.find(t => t.id === editingTeamId) ?? null;
  const editingParticipants = editingTeam
    ? participants.filter(p => p.team_id === editingTeam.id)
    : [];

  return (
    <div className="admin-dashboard">
      <div className="admin-topbar">
        <h1>Host Dashboard</h1>
        <button id="admin-logout-btn" className="admin-logout" onClick={handleLogout}>
          <LogOut size={14} /> Log out
        </button>
      </div>

      <div className="admin-body">
        {error && <div className="admin-error">{error}</div>}

        <div className="admin-toolbar">
          <span className="admin-stats">
            {teams.length} teams · {participants.length} participants
          </span>
          <button id="admin-add-team-btn" className="admin-btn admin-btn-primary" onClick={addTeam}>
            <Plus size={14} /> Add team
          </button>
        </div>

        <div className="admin-team-list">
          {teams.map(team => {
            const memberCount = participants.filter(p => p.team_id === team.id).length;
            return (
              <button
                key={team.id}
                type="button"
                className="admin-team-card"
                onClick={() => setEditingTeamId(team.id)}
              >
                <div className="admin-card-main">
                  <span className="admin-card-name">{team.name}</span>
                  <span className="admin-card-theme">{team.game_theme}</span>
                </div>
                <div className="admin-card-meta">
                  <span className={`admin-chip admin-chip-${team.status}`}>
                    {STATUS_LABEL[team.status] || team.status}
                  </span>
                  <span className="admin-chip">Route {team.route}</span>
                  <span className="admin-chip admin-chip-pin">PIN {team.pin}</span>
                  <span className="admin-card-members">
                    {memberCount} member{memberCount === 1 ? '' : 's'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {editingTeam && (
        <div className="admin-modal-overlay" onClick={() => setEditingTeamId(null)}>
          <div className="admin-modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-head">
              <h2>{editingTeam.name}</h2>
              <button
                className="admin-btn admin-btn-icon"
                onClick={() => setEditingTeamId(null)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="admin-modal-grid">
              <label className="admin-label admin-label-wide">
                Team name
                <input
                  className="admin-field"
                  type="text"
                  value={editingTeam.name}
                  onChange={e => updateTeamField(editingTeam.id, 'name', e.target.value)}
                  onBlur={() => saveTeam(editingTeam)}
                />
              </label>

              <label className="admin-label admin-label-wide">
                Theme
                <input
                  className="admin-field"
                  type="text"
                  placeholder="Theme"
                  value={editingTeam.game_theme}
                  onChange={e => updateTeamField(editingTeam.id, 'game_theme', e.target.value)}
                  onBlur={() => saveTeam(editingTeam)}
                />
              </label>

              <label className="admin-label">
                Status
                <select
                  className="admin-select"
                  value={editingTeam.status}
                  onChange={e => {
                    updateTeamField(editingTeam.id, 'status', e.target.value);
                    saveTeam({ ...editingTeam, status: e.target.value });
                  }}
                >
                  <option value="confirmed">Confirmed</option>
                  <option value="tbc">TBC</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
              </label>

              <label className="admin-label">
                Route
                <select
                  className="admin-select"
                  value={editingTeam.route}
                  onChange={e => {
                    updateTeamField(editingTeam.id, 'route', e.target.value);
                    saveTeam({ ...editingTeam, route: e.target.value });
                  }}
                >
                  <option value="A">Route A</option>
                  <option value="B">Route B</option>
                </select>
              </label>

              <label className="admin-label">
                PIN
                <input
                  className="admin-field admin-field-pin"
                  type="text"
                  inputMode="numeric"
                  placeholder="PIN"
                  value={editingTeam.pin}
                  onChange={e => updateTeamField(editingTeam.id, 'pin', e.target.value)}
                  onBlur={() => saveTeam(editingTeam)}
                />
              </label>
            </div>

            <h3 className="admin-modal-subhead">
              Members ({editingParticipants.length})
            </h3>

            <div className="admin-participant-list">
              {editingParticipants.map(p => (
                <div key={p.id} className="admin-participant-row">
                  <input
                    className="admin-field admin-participant-name"
                    type="text"
                    value={p.full_name}
                    onChange={e => updateParticipantField(p.id, 'full_name', e.target.value)}
                    onBlur={() => saveParticipant(p)}
                  />
                  <div className="admin-participant-meta">
                    <select
                      className="admin-select"
                      value={p.role}
                      onChange={e => {
                        updateParticipantField(p.id, 'role', e.target.value);
                        saveParticipant({ ...p, role: e.target.value as 'captain' | 'participant' });
                      }}
                    >
                      <option value="captain">Captain</option>
                      <option value="participant">Participant</option>
                    </select>
                    <label className="admin-internal-checkbox">
                      <input
                        type="checkbox"
                        checked={p.is_internal}
                        onChange={e => {
                          updateParticipantField(p.id, 'is_internal', e.target.checked);
                          saveParticipant({ ...p, is_internal: e.target.checked });
                        }}
                      />
                      Internal
                    </label>
                    <button
                      className="admin-btn admin-btn-icon admin-btn-danger"
                      onClick={() => deleteParticipant(p.id)}
                      aria-label="Delete member"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
              {editingParticipants.length === 0 && (
                <p className="admin-empty-roster">No members yet.</p>
              )}
              <button className="admin-link-btn" onClick={() => addParticipant(editingTeam.id)}>
                <Plus size={13} /> Add member
              </button>
            </div>

            <div className="admin-modal-foot">
              <button
                className="admin-btn admin-btn-danger-solid"
                onClick={() => deleteTeam(editingTeam.id)}
              >
                <Trash2 size={14} /> Delete team
              </button>
              <button className="admin-btn admin-btn-primary" onClick={() => setEditingTeamId(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
