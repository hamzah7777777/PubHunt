import { useEffect, useState } from 'react';
import { Brain, Camera, Gamepad2, Joystick, Shuffle, SpellCheck } from 'lucide-react';
import { sfx } from '../lib/sfx';
import PhotoChallengePage from './PhotoChallengePage';
import AnagramChallengePage from './AnagramChallengePage';
import ConsoleChallengePage from './ConsoleChallengePage';
import BrainTrainingChallengePage from './BrainTrainingChallengePage';
import MissingVowelsChallengePage from './MissingVowelsChallengePage';

const facebookIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.6-1.5h1.4V5c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8V11H8.2v3h2.4v7h2.9Z" />
  </svg>
);

interface Props {
  teamId: string;
}

type ChallengeSubpage = 'photo' | 'anagram' | 'console' | 'brain' | 'vowels' | null;

export default function ChallengesPage({ teamId }: Props) {
  // A refresh shouldn't kick the team back to the challenges menu if they
  // were mid challenge; same pattern as the hint/quiz pages.
  const [subpage, setSubpage] = useState<ChallengeSubpage>(() => {
    const saved = localStorage.getItem('pubhunt_challenge_subpage');
    return saved === 'photo' || saved === 'anagram' || saved === 'console' || saved === 'brain' || saved === 'vowels'
      ? saved
      : null;
  });

  useEffect(() => {
    if (subpage === null) localStorage.removeItem('pubhunt_challenge_subpage');
    else localStorage.setItem('pubhunt_challenge_subpage', subpage);
  }, [subpage]);

  const openSubpage = (page: ChallengeSubpage) => {
    sfx.playClick();
    setSubpage(page);
  };

  if (subpage === 'photo') {
    return <PhotoChallengePage teamId={teamId} onBack={() => setSubpage(null)} />;
  }

  if (subpage === 'anagram') {
    return <AnagramChallengePage teamId={teamId} onBack={() => setSubpage(null)} />;
  }

  if (subpage === 'console') {
    return <ConsoleChallengePage teamId={teamId} onBack={() => setSubpage(null)} />;
  }

  if (subpage === 'brain') {
    return <BrainTrainingChallengePage teamId={teamId} onBack={() => setSubpage(null)} />;
  }

  if (subpage === 'vowels') {
    return <MissingVowelsChallengePage teamId={teamId} onBack={() => setSubpage(null)} />;
  }

  return (
    <div className="flex flex-col gap-24 scale-up-anim">
      <div className="panel panel-dark text-center" style={{ padding: '32px 24px' }}>
        <span className="kicker kicker-white">En Route</span>
        <h1 style={{ color: 'var(--color-white)', fontSize: 32, marginBottom: 8 }}>CHALLENGES</h1>
        <div className="flex items-center justify-center gap-8" style={{ color: 'rgba(255,255,255,0.85)', fontSize: 18 }}>
          <Camera size={18} />
          <span>Extra points for creativity!</span>
        </div>
      </div>

      <div className="panel">
        <div className="flex flex-col gap-12" style={{ marginBottom: 16 }}>
          <div className="flex" style={{ gap: 10, alignItems: 'flex-start' }}>
            <span className="badge badge-brand" style={{ flexShrink: 0 }}>Photo</span>
            <p style={{ marginBottom: 0 }}>
              Take (or ask someone to take) a photo of your team before your journey begins (this has to be taken in GH).
            </p>
          </div>
          <div className="flex" style={{ gap: 10, alignItems: 'flex-start' }}>
            <span className="badge badge-success" style={{ flexShrink: 0 }}>Video</span>
            <p style={{ marginBottom: 0 }}>
              No NPCs here! Create a video montage of your group acting like a character selection screen.
            </p>
          </div>
          <div className="flex" style={{ gap: 10, alignItems: 'flex-start' }}>
            <span className="badge badge-success" style={{ flexShrink: 0 }}>Video</span>
            <p style={{ marginBottom: 0 }}>
              Act out an iconic (or funny) scene from your game – the more creative the better!
            </p>
          </div>
        </div>

        <div className="alert" style={{ marginBottom: 16 }}>
          <p style={{ marginBottom: 0 }}>
            Upload your pictures/videos, along with your <strong>team name</strong>, to the{' '}
            <strong>Pub Hunt 2026 Facebook page</strong> before <strong>11pm</strong> to be counted.
          </p>
        </div>

        <a
          className="btn btn-primary btn-block"
          href="https://www.facebook.com/groups/1657912238864031"
          target="_blank"
          rel="noreferrer"
        >
          {facebookIcon} Open the Facebook Page
        </a>
      </div>

      <button
        type="button"
        className="btn btn-secondary btn-block btn-lg"
        onClick={() => openSubpage('photo')}
      >
        <Gamepad2 size={18} /> Photo Challenge : Characters
      </button>

      <button
        type="button"
        className="btn btn-secondary btn-block btn-lg"
        onClick={() => openSubpage('anagram')}
      >
        <Shuffle size={18} /> Anagram Challenge : Games
      </button>

      <button
        type="button"
        className="btn btn-secondary btn-block btn-lg"
        onClick={() => openSubpage('console')}
      >
        <Joystick size={18} /> Photo Challenge : Consoles
      </button>

      <button
        type="button"
        className="btn btn-secondary btn-block btn-lg"
        onClick={() => openSubpage('brain')}
      >
        <Brain size={18} /> Brain Training : Trivia
      </button>

      <button
        type="button"
        className="btn btn-secondary btn-block btn-lg"
        onClick={() => openSubpage('vowels')}
      >
        <SpellCheck size={18} /> Missing Vowels : Video Games
      </button>
    </div>
  );
}
