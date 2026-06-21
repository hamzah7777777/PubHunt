import { ArrowLeft, Award, Gamepad2, Users } from 'lucide-react';
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

  return (
    <div className="flex flex-col gap-24 scale-up-anim">
      <button type="button" id="team-portal-logout-btn" className="btn btn-ghost btn-sm" style={{ alignSelf: 'flex-start' }} onClick={onLogout}>
        <ArrowLeft size={16} /> Log out
      </button>

      <div className="panel panel-dark text-center" style={{ padding: '32px 24px' }}>
        <span className="kicker kicker-white">{STATUS_LABEL[session.status] || session.status}</span>
        <h1 style={{ color: 'var(--color-white)', fontSize: 32, marginBottom: 8 }}>{session.team_name}</h1>
        <div className="flex items-center justify-center gap-8" style={{ color: 'rgba(255,255,255,0.85)', fontSize: 18 }}>
          <Gamepad2 size={18} />
          <span>{session.game_theme}</span>
        </div>
      </div>

      {captain && (
        <div className="panel panel-tertiary">
          <span className="kicker">Team Captain</span>
          <div className="flex items-center justify-between" style={{ marginTop: 8 }}>
            <h3 style={{ marginBottom: 0 }}>{captain.full_name}</h3>
            <span className={`badge ${captain.is_internal ? 'badge-success' : 'badge-brand'}`}>
              {captain.is_internal ? 'Internal' : 'External'}
            </span>
          </div>
        </div>
      )}

      <div className="panel">
        <div className="flex items-center gap-8" style={{ marginBottom: 16 }}>
          <Users size={20} style={{ color: 'var(--brand)' }} />
          <h3 style={{ marginBottom: 0 }}>Team Members ({members.length})</h3>
        </div>

        <div className="flex flex-col gap-12">
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

      <div className="panel panel-secondary flex items-center gap-12">
        <Award size={20} style={{ color: 'var(--brand)', flexShrink: 0 }} />
        <p style={{ marginBottom: 0, fontSize: 15 }}>
          Got a change to your lineup or fancy dress theme? Ask your captain to message Chris Duncan, Lily Price or Jodie Calvert on Teams.
        </p>
      </div>
    </div>
  );
}
