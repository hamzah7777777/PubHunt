import { Compass, Gamepad2, Users } from 'lucide-react';
import { sfx } from '../lib/sfx';

// 'hints' hosts the merged route page: pub hints interleaved with each
// pub's questions (the old separate Route Quiz tab).
export type AppTab = 'team' | 'hints' | 'challenges';

interface Props {
  active: AppTab;
  onChange: (tab: AppTab) => void;
}

const TABS: { id: AppTab; label: string; icon: typeof Users }[] = [
  { id: 'team', label: 'Team', icon: Users },
  { id: 'hints', label: 'Route', icon: Compass },
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
