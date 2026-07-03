import { useEffect, useState } from 'react';
import { Brain, Camera, Gamepad2, Joystick, Shuffle, SpellCheck, Swords } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { sfx } from '../lib/sfx';
import TeamClashChallengePage from './TeamClashChallengePage';
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

export type ChallengeSubpage = 'clash' | 'photo' | 'anagram' | 'console' | 'brain' | 'vowels' | null;

interface Props {
  teamId: string;
  subpage: ChallengeSubpage;
  onSubpageChange: (page: ChallengeSubpage) => void;
}

type ChallengeKey = Exclude<ChallengeSubpage, null>;

const CHALLENGE_BUTTONS: { page: ChallengeKey; icon: typeof Gamepad2; label: string; total: number }[] = [
  { page: 'photo', icon: Gamepad2, label: 'Photo Challenge : Characters', total: PHOTO_CHALLENGE.length },
  { page: 'anagram', icon: Shuffle, label: 'Anagram Challenge : Games', total: ANAGRAM_CHALLENGE.length },
  { page: 'console', icon: Joystick, label: 'Photo Challenge : Consoles', total: CONSOLE_CHALLENGE.length },
  { page: 'brain', icon: Brain, label: 'Brain Training : Trivia', total: BRAIN_TRAINING_CHALLENGE.length },
  { page: 'vowels', icon: SpellCheck, label: 'Missing Vowels : Video Games', total: MISSING_VOWELS_CHALLENGE.length },
];

/** How many distinct in-range item numbers have a saved answer. */
function countAnswered(rows: unknown[] | null, field: string, total: number): number {
  const done = new Set<number>();
  (rows || []).forEach(row => {
    const n = (row as Record<string, number>)[field];
    if (Number.isInteger(n) && n >= 1 && n <= total) done.add(n);
  });
  return done.size;
}

export default function ChallengesPage({ teamId, subpage, onSubpageChange }: Props) {
  // Answered counts per challenge for the menu's progress fractions;
  // null until the fetch completes (the fractions just don't show).
  const [counts, setCounts] = useState<Record<ChallengeKey, number> | null>(null);
  // Team clash total is dynamic: the number of other teams on the route.
  const [clashTotal, setClashTotal] = useState(0);

  useEffect(() => {
    // Refetch whenever the menu is shown so counts pick up answers
    // submitted on a subpage the team just came back from.
    if (subpage !== null) return;
    let cancelled = false;
    Promise.all([
      supabase.rpc('get_team_photo_answers', { p_team_id: teamId }),
      supabase.rpc('get_team_anagram_answers', { p_team_id: teamId }),
      supabase.rpc('get_team_console_answers', { p_team_id: teamId }),
      supabase.rpc('get_team_brain_training_answers', { p_team_id: teamId }),
      supabase.rpc('get_team_missing_vowels_answers', { p_team_id: teamId }),
      supabase.rpc('get_clash_targets', { p_team_id: teamId }),
      supabase.rpc('get_team_clash_answers', { p_team_id: teamId }),
    ]).then(([photo, anagram, consoles, brain, vowels, clashTargets, clashAnswers]) => {
      if (cancelled) return;
      const targetIds = new Set<string>(
        ((clashTargets.data as { team_id: string }[] | null) || []).map(t => t.team_id)
      );
      const clashDone = new Set<string>();
      ((clashAnswers.data as { target_team_id: string }[] | null) || []).forEach(row => {
        if (targetIds.has(row.target_team_id)) clashDone.add(row.target_team_id);
      });
      setClashTotal(targetIds.size);
      setCounts({
        clash: clashDone.size,
        photo: countAnswered(photo.data, 'photo_number', PHOTO_CHALLENGE.length),
        anagram: countAnswered(anagram.data, 'anagram_number', ANAGRAM_CHALLENGE.length),
        console: countAnswered(consoles.data, 'console_number', CONSOLE_CHALLENGE.length),
        brain: countAnswered(brain.data, 'question_number', BRAIN_TRAINING_CHALLENGE.length),
        vowels: countAnswered(vowels.data, 'puzzle_number', MISSING_VOWELS_CHALLENGE.length),
      });
    });
    return () => {
      cancelled = true;
    };
  }, [teamId, subpage]);

  const openSubpage = (page: ChallengeSubpage) => {
    sfx.playClick();
    onSubpageChange(page);
  };

  if (subpage === 'clash') {
    return <TeamClashChallengePage teamId={teamId} onBack={() => onSubpageChange(null)} />;
  }

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

  const clashDone = counts?.clash;
  const clashComplete = clashDone !== undefined && clashTotal > 0 && clashDone >= clashTotal;

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

      <button
        type="button"
        className={`btn ${clashComplete ? 'btn-success' : 'btn-primary'} btn-block btn-lg`}
        style={{ justifyContent: 'space-between', minHeight: 72 }}
        onClick={() => openSubpage('clash')}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6em', whiteSpace: 'normal', textAlign: 'left' }}>
          <Swords size={20} style={{ flexShrink: 0 }} /> Team Clash : Name Your Rivals
        </span>
        {clashDone !== undefined && <span className="btn-count">{clashDone}/{clashTotal}</span>}
      </button>

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

      {CHALLENGE_BUTTONS.map(({ page, icon: Icon, label, total }) => {
        const done = counts?.[page];
        const complete = done !== undefined && done >= total;
        return (
          <button
            key={page}
            type="button"
            className={`btn ${complete ? 'btn-success' : 'btn-secondary'} btn-block btn-lg`}
            style={{ justifyContent: 'space-between' }}
            onClick={() => openSubpage(page)}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6em', whiteSpace: 'normal', textAlign: 'left' }}>
              <Icon size={18} style={{ flexShrink: 0 }} /> {label}
            </span>
            {done !== undefined && <span className="btn-count">{done}/{total}</span>}
          </button>
        );
      })}
    </div>
  );
}
