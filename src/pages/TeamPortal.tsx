import { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Gamepad2, Map, Users } from 'lucide-react';
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

  const [showInstructions, setShowInstructions] = useState(false);
  const [showTeamName, setShowTeamName] = useState(false);

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

      <div className="panel panel-secondary">
        <button
          type="button"
          className="btn btn-outline"
          style={{ width: '100%' }}
          onClick={() => setShowInstructions(prev => !prev)}
        >
          Instructions
        </button>

        {showInstructions && (
          <div style={{ marginTop: 16, textAlign: 'left' }}>
            <h3 style={{ marginBottom: 12 }}>Instructions (Please read carefully if this is your first time!)</h3>
            <ol style={{ paddingLeft: 20, margin: 0, lineHeight: 1.75 }}>
              <li>Follow the clues to visit each pub in order, and then head to the final venue (wristbands needed)</li>
              <li>Complete the en-route challenges</li>
              <li>Answer Questions about the starting venue and each pub you visit</li>
              <li>Complete the video game quiz (Five Rounds), including finding out the names of all the other teams and writing them next to the correct picture.</li>
              <li>Remember to EAT along the way.</li>
              <li>Enjoy yourself (within reason)</li>
              <li>You'll visit four pubs in total, then the final venue where there will be a disco and you can hand in your quiz</li>
              <li>We have private hire of the venue from 10pm and access is with a pubhunt wristband only.</li>
            </ol>
          </div>
        )}
      </div>


    </div>
  );
}
