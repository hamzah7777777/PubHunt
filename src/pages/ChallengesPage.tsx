import { useEffect, useState } from 'react';
import { Brain, Camera, Gamepad2, Joystick, Shuffle, SpellCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sfx } from '../lib/sfx';
import PhotoChallengePage from './PhotoChallengePage';
import AnagramChallengePage from './AnagramChallengePage';
import ConsoleChallengePage from './ConsoleChallengePage';
import BrainTrainingChallengePage from './BrainTrainingChallengePage';
import MissingVowelsChallengePage from './MissingVowelsChallengePage';
import { PHOTO_CHALLENGE } from './photoChallenge';
import { ANAGRAM_CHALLENGE } from './anagramChallenge';
import { CONSOLE_CHALLENGE } from './consoleChallenge';
import { BRAIN_TRAINING_CHALLENGE } from './brainTrainingChallenge';
import { MISSING_VOWELS_CHALLENGE } from './missingVowelsChallenge';

const facebookIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.6-1.5h1.4V5c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8V11H8.2v3h2.4v7h2.9Z" />
  </svg>
);

export type ChallengeSubpage = 'photo' | 'anagram' | 'console' | 'brain' | 'vowels' | null;

interface Props {
  teamId: string;
  subpage: ChallengeSubpage;
  onSubpageChange: (subpage: ChallengeSubpage) => void;
}

type ChallengeKey = Exclude<ChallengeSubpage, null>;

const CHALLENGE_TOTALS: Record<ChallengeKey, number> = {
  photo: PHOTO_CHALLENGE.length,
  anagram: ANAGRAM_CHALLENGE.length,
  console: CONSOLE_CHALLENGE.length,
  brain: BRAIN_TRAINING_CHALLENGE.length,
  vowels: MISSING_VOWELS_CHALLENGE.length,
};

// One team RPC per challenge; each returns one row per answered item.
const CHALLENGE_RPCS: Record<ChallengeKey, string> = {
  photo: 'get_team_photo_answers',
  anagram: 'get_team_anagram_answers',
  console: 'get_team_console_answers',
  brain: 'get_team_brain_training_answers',
  vowels: 'get_team_missing_vowels_answers',
};

const CHALLENGE_BUTTONS: { key: ChallengeKey; label: string; icon: typeof Camera }[] = [
  { key: 'photo', label: 'Photo Challenge : Characters', icon: Gamepad2 },
  { key: 'anagram', label: 'Anagram Challenge : Games', icon: Shuffle },
  { key: 'console', label: 'Photo Challenge : Consoles', icon: Joystick },
  { key: 'brain', label: 'Brain Training : Trivia', icon: Brain },
  { key: 'vowels', label: 'Missing Vowels : Video Games', icon: SpellCheck },
];

export default function ChallengesPage({ teamId, subpage, onSubpageChange }: Props) {
  // Answered counts per challenge, shown as fractions on the menu buttons.
  const [progress, setProgress] = useState<Record<ChallengeKey, number> | null>(null);

  useEffect(() => {
    if (subpage !== null) return;
    let cancelled = false;
    const keys = CHALLENGE_BUTTONS.map(b => b.key);
    Promise.all(keys.map(key => supabase.rpc(CHALLENGE_RPCS[key], { p_team_id: teamId }))).then(results => {
      if (cancelled) return;
      const next = {} as Record<ChallengeKey, number>;
      keys.forEach((key, i) => {
        const { data, error } = results[i];
        next[key] = error ? 0 : Math.min((data || []).length, CHALLENGE_TOTALS[key]);
      });
      setProgress(next);
    });
    return () => {
      cancelled = true;
    };
  }, [teamId, subpage]);

  const openSubpage = (page: ChallengeSubpage) => {
    sfx.playClick();
    onSubpageChange(page);
  };

  if (subpage === 'photo') {
    return <PhotoChallengePage teamId={teamId} onBack={() => onSubpageChange(null)} />;
  }

  if (subpage === 'anagram') {
    return <AnagramChallengePage teamId={teamId} onBack={() => onSubpageChange(null)} />;
  }

  if (subpage === 'console') {
    return <ConsoleChallengePage teamId={teamId} onBack={() => onSubpageChange(null)} />;
  }

  if (subpage === 'brain') {
    return <BrainTrainingChallengePage teamId={teamId} onBack={() => onSubpageChange(null)} />;
  }

  if (subpage === 'vowels') {
    return <MissingVowelsChallengePage teamId={teamId} onBack={() => onSubpageChange(null)} />;
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

      {CHALLENGE_BUTTONS.map(({ key, label, icon: Icon }) => {
        const done = progress?.[key];
        const total = CHALLENGE_TOTALS[key];
        const isComplete = done !== undefined && done >= total;
        return (
          <button
            key={key}
            type="button"
            className={`btn ${isComplete ? 'btn-success' : 'btn-secondary'} btn-block btn-lg`}
            onClick={() => openSubpage(key)}
          >
            <Icon size={18} style={{ flexShrink: 0 }} /> {label}
            {done !== undefined && (
              <span className="progress-frac">
                {done}/{total}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
