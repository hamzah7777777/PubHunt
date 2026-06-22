import { useState } from 'react';
import { Beer, Shield, Users, Volume2, VolumeX } from 'lucide-react';
import { sfx } from './lib/sfx';
import TeamLogin from './pages/TeamLogin';
import TeamPortal from './pages/TeamPortal';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import PubHint1 from './pages/pub hints/PubHint1';
import PubHint2 from './pages/pub hints/PubHint2';
import PubHint3 from './pages/pub hints/PubHint3';
import PubHint4 from './pages/pub hints/PubHint4';
import PubHint5 from './pages/pub hints/PubHint5';
import PubHint6 from './pages/pub hints/PubHint6';
import PubHint7 from './pages/pub hints/PubHint7';
import PubHint8 from './pages/pub hints/PubHint8';
import type { TeamSession } from './types';
import './App.css';

type View = 'landing' | 'team-login' | 'team-portal' | 'admin-login' | 'admin-dashboard' | 'pub-hint-1' | 'pub-hint-2' | 'pub-hint-3' | 'pub-hint-4' | 'pub-hint-5' | 'pub-hint-6' | 'pub-hint-7' | 'pub-hint-8';

export default function App() {
  const [view, setView] = useState<View>('landing');
  const [muted, setMuted] = useState(false);
  const [teamSession, setTeamSession] = useState<TeamSession | null>(() => {
    const saved = sessionStorage.getItem('pubhunt_team_session');
    return saved ? JSON.parse(saved) : null;
  });
  const [adminAuthed, setAdminAuthed] = useState(false);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    sfx.muted = next;
  };

  const handleTeamLogin = (session: TeamSession) => {
    setTeamSession(session);
    sessionStorage.setItem('pubhunt_team_session', JSON.stringify(session));
    setView('team-portal');
  };

  const handleTeamLogout = () => {
    setTeamSession(null);
    sessionStorage.removeItem('pubhunt_team_session');
    setView('landing');
  };

  const handleAdminLogin = () => {
    setAdminAuthed(true);
    setView('admin-dashboard');
  };

  const handleAdminLogout = () => {
    setAdminAuthed(false);
    setView('landing');
  };

  if (view === 'admin-dashboard' && adminAuthed) {
    return <AdminDashboard onLogout={handleAdminLogout} />;
  }

  return (
    <div className="phone-wrapper slide-up-anim">
      <header className="game-header">
        <div className="game-header-logo" onClick={() => setView('landing')} style={{ cursor: 'pointer' }}>
          <Beer size={24} />
          <span>PUB<span>HUNT</span></span>
        </div>
        <div className="game-header-actions">
          <button className="mute-btn" onClick={toggleMute} aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}>
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>
      </header>

      <main className="game-main">
        <div className="game-content">
          {view === 'landing' && (
            <div className="flex flex-col gap-24 scale-up-anim">
              <div className="panel panel-dark text-center" style={{ padding: '32px 24px', boxShadow: 'var(--shadow-card-ring)' }}>
                <span className="kicker kicker-white">Sheffield 2026</span>
                <h1 style={{ color: 'var(--color-white)', fontSize: 44, marginBottom: 8 }}>PUB HUNT</h1>
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 18 }}>
                  Video games themed charity pub crawl, Sheffield city centre.
                </p>
              </div>

              <button
                id="go-team-login-btn"
                className="btn btn-primary btn-block btn-lg"
                onClick={() => {
                  sfx.playClick();
                  setView(teamSession ? 'team-portal' : 'team-login');
                }}
              >
                <Users size={18} /> Team Portal
              </button>

              <button
                id="go-admin-login-btn"
                className="btn btn-secondary btn-block btn-lg"
                onClick={() => {
                  sfx.playClick();
                  setView(adminAuthed ? 'admin-dashboard' : 'admin-login');
                }}
              >
                <Shield size={18} /> Host
              </button>
            </div>
          )}

          {view === 'team-login' && (
            <TeamLogin onLogin={handleTeamLogin} onBack={() => setView('landing')} />
          )}

          {view === 'team-portal' && teamSession && (
            <TeamPortal session={teamSession} onLogout={handleTeamLogout} onStartGame={() => setView('pub-hint-1')} />
          )}

          {view === 'pub-hint-1' && <PubHint1 onNext={() => setView('pub-hint-2')} />}
          {view === 'pub-hint-2' && <PubHint2 onNext={() => setView('pub-hint-3')} />}
          {view === 'pub-hint-3' && <PubHint3 onNext={() => setView('pub-hint-4')} />}
          {view === 'pub-hint-4' && <PubHint4 onNext={() => setView('pub-hint-5')} />}
          {view === 'pub-hint-5' && <PubHint5 onNext={() => setView('pub-hint-6')} />}
          {view === 'pub-hint-6' && <PubHint6 onNext={() => setView('pub-hint-7')} />}
          {view === 'pub-hint-7' && <PubHint7 onNext={() => setView('pub-hint-8')} />}
          {view === 'pub-hint-8' && <PubHint8 onNext={() => setView('team-portal')} />}

          {view === 'admin-login' && (
            <AdminLogin onLogin={handleAdminLogin} onBack={() => setView('landing')} />
          )}
        </div>
      </main>
    </div>
  );
}
