import { Fragment, useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, LogOut, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { AdminParticipant, AdminTeam } from '../types';
import './AdminDashboard.css';

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
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  const toggleExpanded = (teamId: string) => {
    setExpanded(prev => ({ ...prev, [teamId]: !prev[teamId] }));
  };

  const updateTeamField = (teamId: string, field: keyof AdminTeam, value: string) => {
    setTeams(prev => prev.map(t => (t.id === teamId ? { ...t, [field]: value } : t)));
  };

  const saveTeam = async (team: AdminTeam) => {
    const { error: saveError } = await supabase
      .from('teams')
      .update({ name: team.name, game_theme: team.game_theme, status: team.status, pin: team.pin })
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
            const teamParticipants = participants.filter(p => p.team_id === team.id);
            const isExpanded = !!expanded[team.id];
            return (
              <Fragment key={team.id}>
                <div className="admin-team-card">
                  <button className="admin-expand-btn" onClick={() => toggleExpanded(team.id)} aria-label="Toggle members">
                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </button>

                  <input
                    className="admin-field admin-field-name"
                    type="text"
                    value={team.name}
                    onChange={e => updateTeamField(team.id, 'name', e.target.value)}
                    onBlur={() => saveTeam(team)}
                  />

                  <button className="admin-btn admin-btn-icon admin-btn-danger admin-field-delete" onClick={() => deleteTeam(team.id)} aria-label="Delete team">
                    <Trash2 size={15} />
                  </button>

                  <input
                    className="admin-field admin-field-theme"
                    type="text"
                    placeholder="Theme"
                    value={team.game_theme}
                    onChange={e => updateTeamField(team.id, 'game_theme', e.target.value)}
                    onBlur={() => saveTeam(team)}
                  />

                  <select
                    className="admin-select admin-field-status"
                    value={team.status}
                    onChange={e => {
                      updateTeamField(team.id, 'status', e.target.value);
                      saveTeam({ ...team, status: e.target.value });
                    }}
                  >
                    <option value="confirmed">Confirmed</option>
                    <option value="tbc">TBC</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>

                  <input
                    className="admin-field admin-field-pin"
                    type="text"
                    inputMode="numeric"
                    placeholder="PIN"
                    value={team.pin}
                    onChange={e => updateTeamField(team.id, 'pin', e.target.value)}
                    onBlur={() => saveTeam(team)}
                  />

                  <span className="admin-field-members">{teamParticipants.length} member{teamParticipants.length === 1 ? '' : 's'}</span>
                </div>

                {isExpanded && (
                  <div className="admin-participant-list">
                    <div className="admin-costume-photo">
                      {team.costume_photo_url ? (
                        <a href={team.costume_photo_url} target="_blank" rel="noreferrer">
                          <img src={team.costume_photo_url} alt={`${team.name} costume`} className="admin-costume-thumb" />
                        </a>
                      ) : (
                        <span className="admin-costume-empty">No costume photo uploaded yet</span>
                      )}
                    </div>
                    {teamParticipants.map(p => (
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
                          <button className="admin-btn admin-btn-icon admin-btn-danger" onClick={() => deleteParticipant(p.id)} aria-label="Delete member">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button className="admin-link-btn" onClick={() => addParticipant(team.id)}>
                      <Plus size={13} /> Add member
                    </button>
                  </div>
                )}
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
