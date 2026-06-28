import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sfx } from '../lib/sfx';
import { FALLBACK_COVER, getCoverMap } from '../lib/covers';
import type { TeamSession } from '../types';

interface TeamOption {
  id: string;
  name: string;
  game_theme: string;
  captain_name: string;
}

interface Props {
  onLogin: (session: TeamSession) => void;
  onBack: () => void;
}

export default function TeamLogin({ onLogin, onBack }: Props) {
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [coverMap, setCoverMap] = useState<Map<string, string>>(new Map());
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<TeamOption | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from('teams').select('id,name,game_theme').order('name'),
      supabase.from('participants').select('team_id,full_name').eq('role', 'captain'),
      getCoverMap(),
    ]).then(([teamsRes, captainsRes, covers]) => {
      if (teamsRes.error) {
        setError('Could not load team list. Please try again later.');
      } else if (teamsRes.data) {
        const captainByTeam = new Map<string, string>();
        (captainsRes.data || []).forEach((p: { team_id: string; full_name: string }) => {
          captainByTeam.set(p.team_id, p.full_name);
        });
        setTeams(
          teamsRes.data.map((t: { id: string; name: string; game_theme: string }) => ({
            ...t,
            captain_name: captainByTeam.get(t.id) || t.name,
          })),
        );
      }
      setCoverMap(covers);
      setLoadingTeams(false);
    });
  }, []);

  const coverFor = (theme: string) => coverMap.get(theme.trim().toLowerCase()) ?? FALLBACK_COVER;

  const filteredTeams = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter(t => t.game_theme.toLowerCase().includes(q) || t.captain_name.toLowerCase().includes(q));
  }, [teams, search]);

  const selectTeam = (team: TeamOption) => {
    sfx.playClick();
    setSelectedTeam(team);
    setPin('');
    setError('');
  };

  const backToGrid = () => {
    setSelectedTeam(null);
    setPin('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam || !pin.trim()) return;
    setLoading(true);
    setError('');

    const { data, error: rpcError } = await supabase.rpc('verify_team_pin', {
      p_team_name: selectedTeam.name,
      p_pin: pin.trim(),
    });

    setLoading(false);

    if (rpcError || !data || data.length === 0) {
      sfx.playError();
      setError('Incorrect PIN. Check with your captain.');
      return;
    }

    sfx.playPowerUp();
    const row = data[0];
    onLogin({
      team_id: row.team_id,
      team_name: row.team_name,
      game_theme: row.game_theme,
      status: row.status,
      team_photo_url: row.team_photo_url,
      participants: row.participants,
    });
  };

  if (selectedTeam) {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-24 scale-up-anim">
        <button type="button" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={backToGrid}>
          <ArrowLeft size={16} /> Choose a different cover
        </button>

        <div className="panel panel-secondary text-center cover-reveal">
          <img src={coverFor(selectedTeam.game_theme)} alt={selectedTeam.game_theme} className="cover-reveal-img" />
          <span className="kicker" style={{ marginTop: 16 }}>{selectedTeam.game_theme}</span>
          <h2 style={{ color: 'var(--fg-purple-strong)', marginBottom: 16 }}>{selectedTeam.captain_name}</h2>

          <label className="game-label" htmlFor="team-pin">Team PIN</label>
          <input
            id="team-pin"
            type="text"
            inputMode="numeric"
            className="game-input"
            placeholder="4-digit PIN from your captain"
            value={pin}
            onChange={e => setPin(e.target.value)}
            autoFocus
            required
          />
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

  return (
    <div className="flex flex-col gap-24 scale-up-anim">
      <button type="button" id="team-login-back-btn" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={onBack}>
        <ArrowLeft size={16} /> Back
      </button>

      <div>
        <span className="kicker">Team Portal</span>
        <h2 style={{ color: 'var(--fg-purple-strong)', marginBottom: 16 }}>Find Your Team</h2>
      </div>

      <div className="cover-search">
        <Search size={16} />
        <input
          type="text"
          className="game-input"
          placeholder="Search by game or captain…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {error && (
        <div className="alert alert-danger">
          <span>{error}</span>
        </div>
      )}

      {loadingTeams ? (
        <p style={{ color: 'var(--color-body-subtle)' }}>Loading teams…</p>
      ) : (
        <div className="cover-grid">
          {filteredTeams.map(t => (
            <button key={t.id} type="button" className="cover-tile" onClick={() => selectTeam(t)} aria-label={`Select game ${t.game_theme}`}>
              <img src={coverFor(t.game_theme)} alt={t.game_theme} loading="lazy" />
              <span className="cover-tile-name">{t.game_theme}</span>
            </button>
          ))}
          {filteredTeams.length === 0 && (
            <p style={{ color: 'var(--color-body-subtle)' }}>No teams match "{search}".</p>
          )}
        </div>
      )}
    </div>
  );
}
