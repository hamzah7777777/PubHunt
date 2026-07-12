import { useEffect, useState } from 'react';
import { Beer, LifeBuoy, Shield, Users, Volume2, VolumeX } from 'lucide-react';
import { sfx } from './lib/sfx';
import { supabase } from './lib/supabase';
import TeamLogin from './pages/TeamLogin';
import TeamPortal from './pages/TeamPortal';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import BottomNav, { type AppTab } from './components/BottomNav';
import InstructionsPanel from './components/InstructionsPanel';
import RouteMenu from './pages/RouteMenu';
import QuizPage from './pages/QuizPage';
import ChallengesPage, { type ChallengeSubpage } from './pages/ChallengesPage';
import StartHsbc from './pages/pub hints/StartHsbc';
import HintMario from './pages/pub hints/HintMario';
import HintPokemon from './pages/pub hints/HintPokemon';
import HintAmongUs from './pages/pub hints/HintAmongUs';
import HintMinecraft from './pages/pub hints/HintMinecraft';
import HintBlackOps from './pages/pub hints/HintBlackOps';
import { FINISH_HINT, ROUTE_HINTS } from './pages/hints';
import { QUIZ_COUNT } from './pages/quiz';
import type { TeamSession } from './types';
import './App.css';

type View = 'landing' | 'team-login' | 'team-portal' | 'admin-login' | 'admin-dashboard' | 'public-hint';

// Themed shells by position: pubs 1-4, then the finish line. Both routes
// share the shells; the riddle text comes from ROUTE_HINTS.
const HINT_SHELLS = [HintMario, HintPokemon, HintAmongUs, HintMinecraft, HintBlackOps];

// QR posters at each pub link to e.g. /#pub-A2. 0 = start point, 1-4 = pubs,
// 5 = finish line. Logged-in teams jump to that stop's hint page (their own
// route's riddle — the URL's route letter is ignored); logged-out scanners
// get a public standalone hint page, where the route letter picks the riddle.
function consumeHintDeepLink(): { route: 'A' | 'B'; index: number } | null {
  const m = window.location.hash.match(/^#pub-([ab])?([0-5])$/i);
  if (!m) return null;
  history.replaceState(null, '', window.location.pathname + window.location.search);
  return { route: m[1]?.toUpperCase() === 'B' ? 'B' : 'A', index: Number(m[2]) };
}

const deepLink = consumeHintDeepLink();

export default function App() {
  const [teamSession, setTeamSession] = useState<TeamSession | null>(() => {
    const saved = localStorage.getItem('pubhunt_team_session');
    if (!saved) return null;
    const session = JSON.parse(saved) as TeamSession;
    // Sessions saved before the PIN-checked RPCs existed carry no pin and
    // can't call them; force a fresh login (this also clears the storage
    // before the view/tab initializers below read it).
    if (!session.pin) {
      localStorage.removeItem('pubhunt_team_session');
      return null;
    }
    return session;
  });
  // A refresh shouldn't kick a logged-in team back to the landing page:
  // restore the portal (and the tab/hint they were on) from localStorage.
  const [view, setView] = useState<View>(() => {
    if (localStorage.getItem('pubhunt_team_session')) return 'team-portal';
    // A scanned QR shows logged-out visitors a standalone public hint page.
    return deepLink !== null && deepLink.index > 0 ? 'public-hint' : 'landing';
  });
  const [muted, setMuted] = useState(false);
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>(() => {
    if (deepLink !== null && localStorage.getItem('pubhunt_team_session')) return 'hints';
    const saved = localStorage.getItem('pubhunt_active_tab');
    // 'quiz' was its own tab before it merged into the route page.
    if (saved === 'quiz') return 'hints';
    return saved === 'hints' || saved === 'challenges' ? saved : 'team';
  });
  // null = the hints menu; 0 = the start point page; 1+ = that hint page
  const [hintIndex, setHintIndex] = useState<number | null>(() => {
    if (deepLink !== null && localStorage.getItem('pubhunt_team_session')) return deepLink.index;
    const saved = localStorage.getItem('pubhunt_hint_index');
    if (saved === null) return null;
    const n = Number(saved);
    return Number.isInteger(n) && n >= 0 && n <= HINT_SHELLS.length ? n : null;
  });
  // null = the route menu; 1..QUIZ_COUNT = that pub's questions page
  const [quizNumber, setQuizNumber] = useState<number | null>(() => {
    const saved = localStorage.getItem('pubhunt_quiz_number');
    if (saved === null) return null;
    const n = Number(saved);
    return Number.isInteger(n) && n >= 1 && n <= QUIZ_COUNT ? n : null;
  });
  // null = the challenges menu; otherwise that challenge's page. A refresh
  // shouldn't kick the team back to the menu if they were mid challenge.
  const [challengeSubpage, setChallengeSubpage] = useState<ChallengeSubpage>(() => {
    const saved = localStorage.getItem('pubhunt_challenge_subpage');
    return saved === 'clash' || saved === 'photo' || saved === 'anagram' || saved === 'console' || saved === 'brain' || saved === 'vowels'
      ? saved
      : null;
  });

  useEffect(() => {
    localStorage.setItem('pubhunt_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (hintIndex === null) localStorage.removeItem('pubhunt_hint_index');
    else localStorage.setItem('pubhunt_hint_index', String(hintIndex));
  }, [hintIndex]);

  useEffect(() => {
    if (quizNumber === null) localStorage.removeItem('pubhunt_quiz_number');
    else localStorage.setItem('pubhunt_quiz_number', String(quizNumber));
  }, [quizNumber]);

  useEffect(() => {
    if (challengeSubpage === null) localStorage.removeItem('pubhunt_challenge_subpage');
    else localStorage.setItem('pubhunt_challenge_subpage', challengeSubpage);
  }, [challengeSubpage]);

  // Admins keep a Supabase auth session across refreshes; remember they're
  // authed so the Host button goes straight back to the dashboard. The
  // session alone isn't proof — only sessions that claimed the passphrase
  // (recorded server-side in admin_users) count.
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;
      const { data: isAdmin } = await supabase.rpc('is_admin');
      if (isAdmin) setAdminAuthed(true);
    });
  }, []);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    sfx.muted = next;
  };

  const handleTeamLogin = (session: TeamSession) => {
    setTeamSession(session);
    localStorage.setItem('pubhunt_team_session', JSON.stringify(session));
    setActiveTab('team');
    setHintIndex(null);
    setQuizNumber(null);
    setChallengeSubpage(null);
    setView('team-portal');
  };

  const handleTeamLogout = () => {
    setTeamSession(null);
    localStorage.removeItem('pubhunt_team_session');
    localStorage.removeItem('pubhunt_active_tab');
    localStorage.removeItem('pubhunt_hint_index');
    localStorage.removeItem('pubhunt_quiz_number');
    localStorage.removeItem('pubhunt_challenge_subpage');
    setActiveTab('team');
    setHintIndex(null);
    setQuizNumber(null);
    setChallengeSubpage(null);
    setView('landing');
  };

  const handleTabChange = (tab: AppTab) => {
    setActiveTab(tab);
    if (tab === 'hints') {
      setHintIndex(null);
      setQuizNumber(null);
    }
    if (tab === 'challenges') setChallengeSubpage(null);
  };

  // Back to the merged route menu: both sub-pages closed. (A deep link can
  // leave a stale quizNumber behind the hint page it opens — clearing both
  // means "back" always lands on the menu, never a surprise quiz page.)
  const openRouteMenu = () => {
    setHintIndex(null);
    setQuizNumber(null);
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

  const showBottomNav = view === 'team-portal' && !!teamSession;
  const teamRoute = teamSession?.route === 'B' ? 'B' : 'A';
  const hintList = [...ROUTE_HINTS[teamRoute], FINISH_HINT];
  // hintIndex: null = menu, 0 = start point page, 1..5 = pub hints/finish
  const activeHint = hintIndex !== null && hintIndex > 0 ? hintList[hintIndex - 1] : null;
  const HintShell = hintIndex !== null && hintIndex > 0 ? HINT_SHELLS[hintIndex - 1] : null;

  // Standalone hint page for logged-out QR scans: the URL's route letter
  // picks the riddle, and both buttons lead to the main page.
  const publicHint =
    deepLink && deepLink.index > 0
      ? [...ROUTE_HINTS[deepLink.route], FINISH_HINT][deepLink.index - 1]
      : null;
  const PublicHintShell = deepLink && deepLink.index > 0 ? HINT_SHELLS[deepLink.index - 1] : null;

  return (
    <>
    <div className="phone-wrapper slide-up-anim">
      <header className="game-header">
        <div className="game-header-logo" onClick={() => setView('landing')} style={{ cursor: 'pointer' }}>
          <Beer size={24} />
          <span>PUB<span>HUNT</span></span>
        </div>
        <div className="game-header-actions">
          {view === 'landing' && (
            <button
              id="go-admin-login-btn"
              className="mute-btn"
              onClick={() => {
                sfx.playClick();
                setView(adminAuthed ? 'admin-dashboard' : 'admin-login');
              }}
              aria-label="Host login"
              title="Host login"
            >
              <Shield size={18} />
            </button>
          )}
          <a
            className="mute-btn support-btn"
            href="https://chat.whatsapp.com/Dbhq8V1wPaELGDZt24JPAE?s=cl&p=a&ilr=1"
            target="_blank"
            rel="noreferrer"
            onClick={() => sfx.playClick()}
            aria-label="Support (WhatsApp group)"
            title="Support (WhatsApp group)"
          >
            <LifeBuoy size={18} />
            <span>Support</span>
          </a>
          <button className="mute-btn" onClick={toggleMute} aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}>
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
        </div>
      </header>

      <main className="game-main">
        <div className={`game-content ${showBottomNav ? 'has-bottom-nav' : ''}`}>
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

              <InstructionsPanel alwaysOpen />

              <a
                className="btn btn-secondary btn-block btn-lg"
                href="https://www.facebook.com/groups/1657912238864031"
                target="_blank"
                rel="noreferrer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.6-1.5h1.4V5c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8V11H8.2v3h2.4v7h2.9Z" />
                </svg>
                <span style={{ textAlign: 'center', lineHeight: 1.4 }}>
                  Pub Hunt 2026
                  <br />
                  Facebook Group
                </span>
              </a>
            </div>
          )}

          {view === 'team-login' && (
            <TeamLogin onLogin={handleTeamLogin} onBack={() => setView('landing')} />
          )}

          {view === 'team-portal' && teamSession && activeTab === 'team' && (
            <TeamPortal session={teamSession} onLogout={handleTeamLogout} />
          )}

          {view === 'team-portal' && teamSession && activeTab === 'hints' && hintIndex === null && quizNumber === null && (
            <RouteMenu
              teamId={teamSession.team_id}
              teamPin={teamSession.pin ?? ''}
              route={teamRoute}
              hints={hintList}
              onSelectHint={setHintIndex}
              onSelectQuiz={setQuizNumber}
            />
          )}

          {view === 'team-portal' && teamSession && activeTab === 'hints' && hintIndex === 0 && (
            <StartHsbc onBack={openRouteMenu} onNext={() => setHintIndex(1)} />
          )}

          {view === 'team-portal' && teamSession && activeTab === 'hints' && hintIndex !== null && hintIndex > 0 && HintShell && activeHint && (
            <HintShell
              hint={activeHint.hint}
              time={activeHint.time}
              // Pubs flow hint -> that pub's questions; the finish line has
              // no questions, so it goes back to the route menu.
              onNext={
                hintIndex <= QUIZ_COUNT
                  ? () => {
                      setHintIndex(null);
                      setQuizNumber(hintIndex);
                    }
                  : openRouteMenu
              }
              nextLabel={hintIndex <= QUIZ_COUNT ? `Pub ${hintIndex} Questions` : 'All Stops'}
              onBack={openRouteMenu}
            />
          )}

          {view === 'public-hint' && PublicHintShell && publicHint && (
            <PublicHintShell
              hint={publicHint.hint}
              time={publicHint.time}
              onNext={() => setView('landing')}
              nextLabel="PubHunt Main Page"
              onBack={() => setView('landing')}
            />
          )}

          {view === 'team-portal' && teamSession && activeTab === 'hints' && hintIndex === null && quizNumber !== null && (
            <QuizPage
              teamId={teamSession.team_id}
              teamPin={teamSession.pin ?? ''}
              route={teamRoute}
              quizNumber={quizNumber}
              onBack={openRouteMenu}
            />
          )}

          {view === 'team-portal' && teamSession && activeTab === 'challenges' && (
            <ChallengesPage
              teamId={teamSession.team_id}
              teamPin={teamSession.pin ?? ''}
              subpage={challengeSubpage}
              onSubpageChange={setChallengeSubpage}
            />
          )}

          {view === 'admin-login' && (
            <AdminLogin onLogin={handleAdminLogin} onBack={() => setView('landing')} />
          )}
        </div>
      </main>
    </div>
    {showBottomNav && <BottomNav active={activeTab} onChange={handleTabChange} />}
    </>
  );
}
