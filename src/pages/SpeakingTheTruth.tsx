import { useEffect } from 'react';
import { ArrowLeft, Brain, Camera, Gamepad2, KeyRound, MapPin, Shuffle, Trophy, Type } from 'lucide-react';
import FloatingHeads from '../components/FloatingHeads';
import ShowcaseNav from '../components/ShowcaseNav';
import { ROUTE_QUIZZES, ROUTE_QUIZ_ANSWERS } from './quiz';
import { PHOTO_CHALLENGE } from './photoChallenge';
import { CONSOLE_CHALLENGE } from './consoleChallenge';
import { ANAGRAM_CHALLENGE } from './anagramChallenge';
import { BRAIN_TRAINING_CHALLENGE } from './brainTrainingChallenge';
import { MISSING_VOWELS_CHALLENGE } from './missingVowelsChallenge';
import './SpeakingTheTruth.css';

// Standalone answer key for the finished 2026 Pub Hunt, reachable at
// /speaking-the-truth (or /#speaking-the-truth) and linked from the awards
// page. Every quiz/challenge question with its correct answer — all pulled
// straight from the same static challenge data the marking page uses, so it
// can never drift from the real answers. Rendered outside the phone shell so
// it fills a desktop screen and collapses to a single column on phones.
//
// The route riddles (pub hints) are intentionally left out: their answers are
// the pub names, which are deliberately kept out of the bundle.

interface Props {
  onExit: () => void;
  onBackToAwards: () => void;
  onOpenLeaderboard: () => void;
  onOpenGallery: () => void;
}

const SECTIONS = [
  { id: 'stt-quiz', label: 'Route Quiz', Icon: MapPin },
  { id: 'stt-characters', label: 'Characters', Icon: Camera },
  { id: 'stt-consoles', label: 'Consoles', Icon: Gamepad2 },
  { id: 'stt-anagrams', label: 'Anagrams', Icon: Shuffle },
  { id: 'stt-brain', label: 'Brain Training', Icon: Brain },
  { id: 'stt-vowels', label: 'Missing Vowels', Icon: Type },
] as const;

const ROUTES = ['A', 'B'] as const;

export default function SpeakingTheTruth({ onExit, onBackToAwards, onOpenLeaderboard, onOpenGallery }: Props) {
  useEffect(() => {
    const prev = document.title;
    document.title = 'Pub Hunt 2026 — Answer Key';
    window.scrollTo(0, 0);
    return () => {
      document.title = prev;
    };
  }, []);

  // Jump to a section without touching the URL hash (which the app uses to
  // keep this standalone page open across refreshes).
  const jumpTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="stt-root">
      <FloatingHeads />
      <header className="stt-header">
        <button className="stt-header-logo" onClick={onExit} aria-label="Back to Pub Hunt">
          <Gamepad2 size={22} />
          <span>PUB<span>HUNT</span></span>
        </button>
        <div className="stt-header-actions">
          <button className="btn btn-sm stt-nav-btn" onClick={onBackToAwards}>
            <Trophy size={14} /> Awards
          </button>
          <button className="btn btn-sm stt-nav-btn" onClick={onExit}>
            <ArrowLeft size={14} /> Main site
          </button>
        </div>
      </header>

      <div className="stt-container">
        {/* HERO */}
        <section className="stt-hero">
          <div className="stt-hero-badge">
            <KeyRound size={36} />
          </div>
          <span className="kicker kicker-white">Sheffield 2026 · Answer Key</span>
          <h1 className="stt-hero-title">SPEAKING THE TRUTH</h1>
          <p className="stt-hero-sub">Every question, every correct answer.</p>
          <nav className="stt-jump">
            {SECTIONS.map(({ id, label, Icon }) => (
              <button key={id} className="stt-jump-chip" onClick={() => jumpTo(id)}>
                <Icon size={13} /> {label}
              </button>
            ))}
          </nav>
        </section>

        {/* ROUTE QUIZ */}
        <section id="stt-quiz" className="stt-section">
          <div className="stt-section-head">
            <MapPin size={20} />
            <h2>Route Quiz</h2>
            <span className="stt-count">24 questions</span>
          </div>
          <p className="stt-section-note">Each route visited four different pubs. The questions below are grouped by pub, per route.</p>
          {ROUTES.map(route => (
            <div key={route} className="stt-route">
              <h3 className="stt-route-title">Route {route}</h3>
              {ROUTE_QUIZZES[route].map((pub, pi) => (
                <div key={pi} className="stt-pub">
                  <span className="stt-pub-label">Pub {pi + 1}</span>
                  <ol className="stt-qa-list">
                    {pub.map((q, qi) => (
                      <li key={qi} className="stt-qa">
                        <span className="stt-q">{q}</span>
                        <span className="stt-a">{ROUTE_QUIZ_ANSWERS[route][pi][qi]}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          ))}
        </section>

        {/* PHOTO CHALLENGE — CHARACTERS */}
        <section id="stt-characters" className="stt-section">
          <div className="stt-section-head">
            <Camera size={20} />
            <h2>Photo Challenge: Characters</h2>
            <span className="stt-count">12 photos</span>
          </div>
          <p className="stt-section-note">Name the character and the game they&rsquo;re from.</p>
          <div className="stt-media-grid">
            {PHOTO_CHALLENGE.map((item, i) => (
              <article key={i} className="stt-media">
                <div className="stt-media-img">
                  <img src={item.image} alt={`Character photo ${i + 1}`} loading="lazy" />
                  <span className="stt-media-num">{i + 1}</span>
                </div>
                <div className="stt-media-body">
                  <span className="stt-media-line"><span className="stt-media-key">Character</span> <span className="stt-a">{item.character}</span></span>
                  <span className="stt-media-line"><span className="stt-media-key">Game</span> <span className="stt-a">{item.game}</span></span>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* PHOTO CHALLENGE — CONSOLES */}
        <section id="stt-consoles" className="stt-section">
          <div className="stt-section-head">
            <Gamepad2 size={20} />
            <h2>Photo Challenge: Consoles</h2>
            <span className="stt-count">6 photos</span>
          </div>
          <p className="stt-section-note">Name the console.</p>
          <div className="stt-media-grid">
            {CONSOLE_CHALLENGE.map((item, i) => (
              <article key={i} className="stt-media">
                <div className="stt-media-img">
                  <img src={item.image} alt={`Console photo ${i + 1}`} loading="lazy" />
                  <span className="stt-media-num">{i + 1}</span>
                </div>
                <div className="stt-media-body">
                  <span className="stt-media-line"><span className="stt-media-key">Console</span> <span className="stt-a">{item.console}</span></span>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ANAGRAMS */}
        <section id="stt-anagrams" className="stt-section">
          <div className="stt-section-head">
            <Shuffle size={20} />
            <h2>Anagram Challenge</h2>
            <span className="stt-count">8 anagrams</span>
          </div>
          <p className="stt-section-note">Unscramble each anagram into a video game.</p>
          <ol className="stt-qa-list">
            {ANAGRAM_CHALLENGE.map((item, i) => (
              <li key={i} className="stt-qa">
                <span className="stt-q stt-q-mono">{item.anagram}</span>
                <span className="stt-a">{item.game}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* BRAIN TRAINING */}
        <section id="stt-brain" className="stt-section">
          <div className="stt-section-head">
            <Brain size={20} />
            <h2>Brain Training</h2>
            <span className="stt-count">8 questions</span>
          </div>
          <ol className="stt-qa-list">
            {BRAIN_TRAINING_CHALLENGE.map((item, i) => (
              <li key={i} className="stt-qa">
                <span className="stt-q">{item.question}</span>
                <span className="stt-a">{item.answer}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* MISSING VOWELS */}
        <section id="stt-vowels" className="stt-section">
          <div className="stt-section-head">
            <Type size={20} />
            <h2>Missing Vowels</h2>
            <span className="stt-count">8 puzzles</span>
          </div>
          <p className="stt-section-note">Two games mashed together with the vowels removed.</p>
          <ol className="stt-qa-list">
            {MISSING_VOWELS_CHALLENGE.map((item, i) => (
              <li key={i} className="stt-qa">
                <span className="stt-q stt-q-mono">{item.puzzle}</span>
                <span className="stt-a">{item.answer}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Cross-navigation to the other public showcase pages. */}
        <ShowcaseNav
          current="answers"
          onMainSite={onExit}
          onAwards={onBackToAwards}
          onLeaderboard={onOpenLeaderboard}
          onGallery={onOpenGallery}
        />
      </div>
    </div>
  );
}
