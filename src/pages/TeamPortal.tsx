import { useEffect, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Gamepad2, Map, Users } from 'lucide-react';
import InstructionsPanel from '../components/InstructionsPanel';
import type { TeamSession } from '../types';

interface Props {
  session: TeamSession;
  onLogout: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Confirmed',
  tbc: 'Team Name TBC',
  withdrawn: 'Withdrawn',
};

export default function TeamPortal({ session, onLogout }: Props) {
  const captain = session.participants.find(p => p.role === 'captain');
  const members = session.participants.filter(p => p.role !== 'captain');
  const totalMembers = members.length + (captain ? 1 : 0);

  const [showTeamName, setShowTeamName] = useState(false);
  const [showPin, setShowPin] = useState(false);

  // Don't leave the PIN on screen — it auto-hides after 5 seconds.
  useEffect(() => {
    if (!showPin) return;
    const timer = setTimeout(() => setShowPin(false), 5000);
    return () => clearTimeout(timer);
  }, [showPin]);

  return (
    <div className="flex flex-col gap-24 scale-up-anim">
      <button type="button" id="team-portal-logout-btn" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={onLogout}>
        <ArrowLeft size={16} /> Log out
      </button>

      <div className="panel panel-dark text-center" style={{ padding: '32px 24px' }}>
        <span className="kicker kicker-white">{STATUS_LABEL[session.status] || session.status}</span>
        <div className="flex items-center justify-center gap-12" style={{ marginBottom: 8 }}>
          <h1 style={{ color: 'var(--color-white)', fontSize: 32, marginBottom: 0 }}>
            {showTeamName ? session.team_name : '???'}
          </h1>
          <button
            type="button"
            id="team-portal-toggle-name-btn"
            className="mute-btn"
            style={{ flexShrink: 0 }}
            onClick={() => setShowTeamName(v => !v)}
            aria-label={showTeamName ? 'Hide team name' : 'Show team name'}
          >
            {showTeamName ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <div className="flex items-center justify-center gap-8" style={{ color: 'rgba(255,255,255,0.85)', fontSize: 18 }}>
          <Gamepad2 size={18} />
          <span>{session.game_theme}</span>
        </div>
        <div className="flex items-center justify-center gap-8" style={{ color: 'rgba(255,255,255,0.85)', fontSize: 18, marginTop: 6 }}>
          <Map size={18} />
          <span>Route {session.route}</span>
        </div>
      </div>

      <div className="panel">
        <div className="flex items-center gap-8" style={{ marginBottom: 16 }}>
          <Users size={20} style={{ color: 'var(--brand)' }} />
          <h3 style={{ marginBottom: 0 }}>Team Members ({totalMembers})</h3>
        </div>

        <div className="flex flex-col gap-12">
          {captain && (
            <div className="flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-default)', paddingBottom: 8 }}>
              <span>{captain.full_name}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="badge badge-warning">Captain</span>
                <span className={`badge ${captain.is_internal ? 'badge-success' : 'badge-brand'}`} style={{ marginLeft: 8 }}>
                  {captain.is_internal ? 'Internal' : 'External'}
                </span>
              </div>
            </div>
          )}
          {members.map(m => (
            <div key={m.id} className="flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-default)', paddingBottom: 8 }}>
              <span>{m.full_name}</span>
              <span className={`badge ${m.is_internal ? 'badge-success' : 'badge-brand'}`}>
                {m.is_internal ? 'Internal' : 'External'}
              </span>
            </div>
          ))}
          {members.length === 0 && (
            <p style={{ color: 'var(--color-body-subtle)' }}>No other members listed yet.</p>
          )}
        </div>
      </div>

      <InstructionsPanel />

      {session.pin && (
        <div className="panel panel-secondary">
          <button
            type="button"
            id="team-portal-toggle-pin-btn"
            className="btn btn-outline"
            style={{ width: '100%' }}
            onClick={() => setShowPin(prev => !prev)}
          >
            {showPin ? <EyeOff size={16} /> : <Eye size={16} />} {showPin ? 'Hide' : 'Show'} Team PIN
          </button>

          {showPin && (
            <div className="text-center" style={{ marginTop: 16 }}>
              <span className="kicker">Your Team PIN</span>
              <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 28, letterSpacing: 8, marginTop: 8 }}>
                {session.pin}
              </div>
              <p style={{ color: 'var(--color-body-subtle)', marginTop: 8, marginBottom: 0 }}>
                Share it with teammates so they can log in too.
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
