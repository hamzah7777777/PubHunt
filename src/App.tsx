import { useEffect, useState } from 'react';
import { Beer, KeyRound, LifeBuoy, ListOrdered, Shield, Trophy, Users, Volume2, VolumeX } from 'lucide-react';
import { sfx } from './lib/sfx';
import { supabase } from './lib/supabase';
import TeamLogin from './pages/TeamLogin';
import TeamPortal from './pages/TeamPortal';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import BottomNav, { type AppTab } from './components/BottomNav';
import CutoffPopup from './components/CutoffPopup';
import { isPastCutoff, registerCutoffPopup, SUBMISSION_CUTOFF_MS } from './lib/cutoff';
import RouteMenu from './pages/RouteMenu';
import QuizPage from './pages/QuizPage';
import ChallengesPage, { type ChallengeSubpage } from './pages/ChallengesPage';
import StartHsbc from './pages/pub hints/StartHsbc';
import Awards2026 from './pages/Awards2026';
import Gallery from './pages/Gallery';
import IntoTheWeeds from './pages/IntoTheWeeds';
import SpeakingTheTruth from './pages/SpeakingTheTruth';
import HintMario from './pages/pub hints/HintMario';
import HintPokemon from './pages/pub hints/HintPokemon';
import HintAmongUs from './pages/pub hints/HintAmongUs';
import HintMinecraft from './pages/pub hints/HintMinecraft';
import HintBlackOps from './pages/pub hints/HintBlackOps';
import { FINISH_HINT, ROUTE_HINTS } from './pages/hints';
import { QUIZ_COUNT } from './pages/quiz';
import type { TeamSession } from './types';
import './App.css';

type View = 'landing' | 'team-login' | 'team-portal' | 'admin-login' | 'admin-dashboard' | 'public-hint' | 'awards2026' | 'gallery' | 'into-the-weeds' | 'speaking-the-truth';

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

// Legacy /results link: kept as an alias that now opens the 2026 awards
// showcase (see isAwards2026Url below). The Vite dev server serves the app
// at the /results path directly; on GitHub Pages the 404.html shim rewrites
// /results to /#results, so accept either form.
function isResultsUrl(): boolean {
  return /^#results$/i.test(window.location.hash) || /\/results\/?$/i.test(window.location.pathname);
}

// Leaving the awards page (via the header logo or a back button) should also
// drop the /results marker from the URL so a refresh lands back on the main
// app. Clear both the path and the hash form, like clearAwards2026Url.
function clearResultsUrl() {
  if (!isResultsUrl()) return;
  const path = window.location.pathname.replace(/results\/?$/i, '');
  history.replaceState(null, '', path + window.location.search);
  if (/^#results$/i.test(window.location.hash)) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
}

// The 2026 photo awards showcase: another standalone page reachable only by
// URL (/Awards2026 or /#Awards2026, case-insensitive). Like /results, the
// dev server serves the path directly and the 404.html shim rewrites it to
// the hash form on GitHub Pages.
function isAwards2026Url(): boolean {
  return /^#awards2026$/i.test(window.location.hash) || /\/awards2026\/?$/i.test(window.location.pathname);
}

function clearAwards2026Url() {
  if (!isAwards2026Url()) return;
  const path = window.location.pathname.replace(/awards2026\/?$/i, '');
  history.replaceState(null, '', path + window.location.search);
  if (/^#awards2026$/i.test(window.location.hash)) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
}

// The event photo gallery: standalone page at /Gallery (or /#Gallery), linked
// from the awards page. Same dev-serve / 404-shim handling as the pages above.
function isGalleryUrl(): boolean {
  return /^#gallery$/i.test(window.location.hash) || /\/gallery\/?$/i.test(window.location.pathname);
}

function clearGalleryUrl() {
  if (!isGalleryUrl()) return;
  const path = window.location.pathname.replace(/gallery\/?$/i, '');
  history.replaceState(null, '', path + window.location.search);
  if (/^#gallery$/i.test(window.location.hash)) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
}

// The full final leaderboard: a standalone showcase at /into-the-weeds (or
// /#into-the-weeds), linked from the awards page. Same dev-serve / 404-shim
// handling as the pages above.
function isIntoTheWeedsUrl(): boolean {
  return /^#into-the-weeds$/i.test(window.location.hash) || /\/into-the-weeds\/?$/i.test(window.location.pathname);
}

function clearIntoTheWeedsUrl() {
  if (!isIntoTheWeedsUrl()) return;
  const path = window.location.pathname.replace(/into-the-weeds\/?$/i, '');
  history.replaceState(null, '', path + window.location.search);
  if (/^#into-the-weeds$/i.test(window.location.hash)) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
}

// The public answer key: every quiz/challenge question with its correct
// answer, at /speaking-the-truth (or /#speaking-the-truth), linked from the
// awards page. Same dev-serve / 404-shim handling as the pages above.
function isSpeakingTheTruthUrl(): boolean {
  return /^#speaking-the-truth$/i.test(window.location.hash) || /\/speaking-the-truth\/?$/i.test(window.location.pathname);
}

function clearSpeakingTheTruthUrl() {
  if (!isSpeakingTheTruthUrl()) return;
  const path = window.location.pathname.replace(/speaking-the-truth\/?$/i, '');
  history.replaceState(null, '', path + window.location.search);
  if (/^#speaking-the-truth$/i.test(window.location.hash)) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
}

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
    // The awards URLs win even over a saved team session — they're
    // standalone pages; the header logo leads back to the main app.
    // /results is a legacy alias that now opens the awards showcase too.
    if (isAwards2026Url() || isResultsUrl()) return 'awards2026';
    if (isGalleryUrl()) return 'gallery';
    if (isIntoTheWeedsUrl()) return 'into-the-weeds';
    if (isSpeakingTheTruthUrl()) return 'speaking-the-truth';
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

  // The 11:30pm submission-cutoff popup: pages raise it when a blocked
  // submit is attempted (via registerCutoffPopup), and it also auto-shows
  // once per device when the clock hits the cutoff.
  const [cutoffPopupOpen, setCutoffPopupOpen] = useState(false);

  useEffect(() => registerCutoffPopup(() => setCutoffPopupOpen(true)), []);

  useEffect(() => {
    // Not on an awards page: a "submissions closed" popup over the
    // results ceremony is just noise for anyone opening that link fresh.
    if (isResultsUrl() || isAwards2026Url() || isGalleryUrl() || isIntoTheWeedsUrl() || isSpeakingTheTruthUrl()) return;
    const showOnce = () => {
      if (localStorage.getItem('pubhunt_cutoff_seen')) return;
      localStorage.setItem('pubhunt_cutoff_seen', '1');
      setCutoffPopupOpen(true);
    };
    if (isPastCutoff()) {
      showOnce();
      return;
    }
    const timer = setTimeout(showOnce, SUBMISSION_CUTOFF_MS - Date.now());
    return () => clearTimeout(timer);
  }, []);

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

  // Open the standalone 2026 awards page from within the app. Setting the
  // hash keeps a refresh (and a shared link) on the awards page; the page's
  // own back buttons call clearAwards2026Url() to undo it.
  const openAwards2026 = () => {
    sfx.playClick();
    window.location.hash = 'awards2026';
    setView('awards2026');
  };

  const openGallery = () => {
    sfx.playClick();
    window.location.hash = 'gallery';
    setView('gallery');
  };

  const openLeaderboard = () => {
    sfx.playClick();
    window.location.hash = 'into-the-weeds';
    setView('into-the-weeds');
  };

  const openAnswerKey = () => {
    sfx.playClick();
    window.location.hash = 'speaking-the-truth';
    setView('speaking-the-truth');
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

  if (view === 'awards2026') {
    return (
      <Awards2026
        onExit={() => {
          clearAwards2026Url();
          clearResultsUrl();
          setView('landing');
        }}
        onOpenGallery={openGallery}
        onOpenLeaderboard={openLeaderboard}
        onOpenAnswerKey={openAnswerKey}
      />
    );
  }

  if (view === 'gallery') {
    return (
      <Gallery
        onExit={() => {
          clearGalleryUrl();
          setView('landing');
        }}
        onBackToAwards={openAwards2026}
        onOpenLeaderboard={openLeaderboard}
        onOpenAnswers={openAnswerKey}
      />
    );
  }

  if (view === 'into-the-weeds') {
    return (
      <IntoTheWeeds
        onExit={() => {
          clearIntoTheWeedsUrl();
          setView('landing');
        }}
        onBackToAwards={openAwards2026}
        onOpenAnswers={openAnswerKey}
        onOpenGallery={openGallery}
      />
    );
  }

  if (view === 'speaking-the-truth') {
    return (
      <SpeakingTheTruth
        onExit={() => {
          clearSpeakingTheTruthUrl();
          setView('landing');
        }}
        onBackToAwards={openAwards2026}
        onOpenLeaderboard={openLeaderboard}
        onOpenGallery={openGallery}
      />
    );
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
        <div
          className="game-header-logo"
          onClick={() => {
            clearResultsUrl();
            setView('landing');
          }}
          style={{ cursor: 'pointer' }}
        >
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

              <button
                id="go-awards-btn"
                className="btn btn-block btn-lg awards-cta"
                onClick={openAwards2026}
              >
                <Trophy size={20} /> Awards 2026
              </button>

              <button
                id="go-leaderboard-btn"
                className="btn btn-block btn-lg"
                onClick={openLeaderboard}
              >
                <ListOrdered size={20} /> Full Leaderboard
              </button>

              <button
                id="go-answer-key-btn"
                className="btn btn-block btn-lg"
                onClick={openAnswerKey}
              >
                <KeyRound size={20} /> Answer Key
              </button>

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
    {cutoffPopupOpen && <CutoffPopup onClose={() => setCutoffPopupOpen(false)} />}
    </>
  );
}
