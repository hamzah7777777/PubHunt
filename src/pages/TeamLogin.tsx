import React, { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sfx } from '../lib/sfx';
import type { TeamSession } from '../types';

interface TeamOption {
  id: string;
  name: string;
  game_theme: string;
}

interface Props {
  onLogin: (session: TeamSession) => void;
  onBack: () => void;
}

export default function TeamLogin({ onLogin, onBack }: Props) {
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [teamName, setTeamName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(true);

  useEffect(() => {
    supabase
      .from('teams')
      .select('id,name,game_theme')
      .order('name')
      .then(({ data, error: fetchError }) => {
        if (fetchError) {
          setError('Could not load team list. Please try again later.');
        } else if (data) {
          setTeams(data as TeamOption[]);
        }
        setLoadingTeams(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName || !pin.trim()) return;
    setLoading(true);
    setError('');

    const { data, error: rpcError } = await supabase.rpc('verify_team_pin', {
      p_team_name: teamName,
      p_pin: pin.trim(),
    });

    setLoading(false);

    if (rpcError || !data || data.length === 0) {
      sfx.playError();
      setError('Incorrect PIN, or team not found. Check with your captain.');
      return;
    }

    sfx.playPowerUp();
    const row = data[0];
    onLogin({
      team_id: row.team_id,
      team_name: row.team_name,
      game_theme: row.game_theme,
      status: row.status,
      participants: row.participants,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-24 scale-up-anim">
      <button type="button" id="team-login-back-btn" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={onBack}>
        <ArrowLeft size={16} /> Back
      </button>

      <div className="panel panel-secondary">
        <span className="kicker">Team Portal</span>
        <h2 style={{ color: 'var(--fg-purple-strong)', marginBottom: 16 }}>Find Your Team</h2>

        <label className="game-label" htmlFor="team-select">Team Name</label>
        <select
          id="team-select"
          className="game-select"
          value={teamName}
          onChange={e => setTeamName(e.target.value)}
          disabled={loadingTeams}
          required
        >
          <option value="">{loadingTeams ? 'Loading teams…' : 'Select your team…'}</option>
          {teams.map(t => (
            <option key={t.id} value={t.name}>{t.name} — {t.game_theme}</option>
          ))}
        </select>

        <div style={{ marginTop: 16 }}>
          <label className="game-label" htmlFor="team-pin">Team PIN</label>
          <input
            id="team-pin"
            type="text"
            inputMode="numeric"
            className="game-input"
            placeholder="4-digit PIN from your captain"
            value={pin}
            onChange={e => setPin(e.target.value)}
            required
          />
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <span>{error}</span>
        </div>
      )}

      <button id="team-login-submit-btn" type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
        {loading ? 'Checking…' : 'Enter Team Portal'}
      </button>
    </form>
  );
}
