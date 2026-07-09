import { Compass, Gamepad2, ListChecks, Users } from 'lucide-react';
import { sfx } from '../lib/sfx';

export type AppTab = 'team' | 'hints' | 'quiz' | 'challenges';

interface Props {
  active: AppTab;
  onChange: (tab: AppTab) => void;
}

const TABS: { id: AppTab; label: string; icon: typeof Users }[] = [
  { id: 'team', label: 'Team', icon: Users },
  { id: 'hints', label: 'Hints', icon: Compass },
  { id: 'quiz', label: 'Route Quiz', icon: ListChecks },
  { id: 'challenges', label: 'Trivia Quiz', icon: Gamepad2 },
];

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="bottom-nav">
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          className={`bottom-nav-btn ${active === id ? 'active' : ''}`}
          onClick={() => {
            sfx.playClick();
            onChange(id);
          }}
        >
          <Icon size={20} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
