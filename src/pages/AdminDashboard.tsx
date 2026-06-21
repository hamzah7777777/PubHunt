import { useEffect, useState } from 'react';
import { LogOut, Plus, Save, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sfx } from '../lib/sfx';
import type { AdminParticipant, AdminTeam } from '../types';

interface Props {
  onLogout: () => void;
}

function randomPin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export default function AdminDashboard({ onLogout }: Props) {
  const [teams, setTeams] = useState<AdminTeam[]>([]);
  const [participants, setParticipants] = useState<AdminParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingTeamId, setSavingTeamId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
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
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  const updateTeamField = (teamId: string, field: keyof AdminTeam, value: string) => {
    setTeams(prev => prev.map(t => (t.id === teamId ? { ...t, [field]: value } : t)));
  };

  const saveTeam = async (team: AdminTeam) => {
    setSavingTeamId(team.id);
    const { error: saveError } = await supabase
      .from('teams')
      .update({ name: team.name, game_theme: team.game_theme, status: team.status, pin: team.pin })
      .eq('id', team.id);
    setSavingTeamId(null);
    if (saveError) {
      sfx.playError();
      setError(saveError.message);
    } else {
      sfx.playSuccess();
    }
  };

  const deleteTeam = async (teamId: string) => {
    if (!confirm('Delete this team and all its participants?')) return;
    const { error: deleteError } = await supabase.from('teams').delete().eq('id', teamId);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    sfx.playError();
    setTeams(prev => prev.filter(t => t.id !== teamId));
    setParticipants(prev => prev.filter(p => p.team_id !== teamId));
  };

  const addTeam = async () => {
    const name = prompt('New team name?');
    if (!name) return;
    const { data, error: insertError } = await supabase
      .from('teams')
      .insert({ name, game_theme: 'TBC', status: 'tbc', pin: randomPin() })
      .select()
      .single();
    if (insertError || !data) {
      setError(insertError?.message || 'Failed to add team');
      return;
    }
    sfx.playPowerUp();
    setTeams(prev => [...prev, data as AdminTeam].sort((a, b) => a.name.localeCompare(b.name)));
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
    if (saveError) {
      sfx.playError();
      setError(saveError.message);
    } else {
      sfx.playClick();
    }
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
    return <p className="text-center">Loading teams…</p>;
  }

  return (
    <div className="flex flex-col gap-24 scale-up-anim">
      <div className="flex items-center justify-between">
        <h2 style={{ color: 'var(--brand)', marginBottom: 0 }}>Host Dashboard</h2>
        <button id="admin-logout-btn" className="btn btn-ghost btn-sm" onClick={handleLogout}>
          <LogOut size={16} /> Log out
        </button>
      </div>

      {error && (
        <div className="alert alert-danger">
          <span>{error}</span>
        </div>
      )}

      <button id="admin-add-team-btn" className="btn btn-secondary btn-block" onClick={addTeam}>
        <Plus size={16} /> Add Team
      </button>

      <div className="flex flex-col gap-24" style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 4 }}>
        {teams.map(team => {
          const teamParticipants = participants.filter(p => p.team_id === team.id);
          return (
            <div key={team.id} className="panel panel-tertiary flex flex-col gap-12">
              <div className="flex gap-8">
                <input
                  className="game-input"
                  style={{ flex: 2 }}
                  value={team.name}
                  onChange={e => updateTeamField(team.id, 'name', e.target.value)}
                />
                <input
                  className="game-input"
                  style={{ flex: 1 }}
                  value={team.game_theme}
                  onChange={e => updateTeamField(team.id, 'game_theme', e.target.value)}
                />
              </div>
              <div className="flex gap-8">
                <select
                  className="game-select"
                  style={{ flex: 1 }}
                  value={team.status}
                  onChange={e => updateTeamField(team.id, 'status', e.target.value)}
                >
                  <option value="confirmed">Confirmed</option>
                  <option value="tbc">TBC</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
                <input
                  className="game-input"
                  style={{ flex: 1 }}
                  value={team.pin}
                  onChange={e => updateTeamField(team.id, 'pin', e.target.value)}
                  placeholder="PIN"
                />
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => saveTeam(team)}
                  disabled={savingTeamId === team.id}
                >
                  <Save size={14} />
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => deleteTeam(team.id)}>
                  <Trash2 size={14} />
                </button>
              </div>

              <hr className="divider" />

              <div className="flex flex-col gap-8">
                {teamParticipants.map(p => (
                  <div key={p.id} className="flex gap-8 items-center">
                    <input
                      className="game-input"
                      style={{ flex: 2 }}
                      value={p.full_name}
                      onChange={e => updateParticipantField(p.id, 'full_name', e.target.value)}
                      onBlur={() => saveParticipant(p)}
                    />
                    <select
                      className="game-select"
                      style={{ flex: 1 }}
                      value={p.role}
                      onChange={e => {
                        updateParticipantField(p.id, 'role', e.target.value);
                        saveParticipant({ ...p, role: e.target.value as 'captain' | 'participant' });
                      }}
                    >
                      <option value="captain">Captain</option>
                      <option value="participant">Participant</option>
                    </select>
                    <label className="flex items-center gap-8" style={{ fontSize: 13 }}>
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
                    <button className="btn btn-danger btn-xs" onClick={() => deleteParticipant(p.id)}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                <button className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => addParticipant(team.id)}>
                  <Plus size={14} /> Add Member
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
