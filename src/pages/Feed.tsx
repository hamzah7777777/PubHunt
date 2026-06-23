import { useEffect, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface TeamFeedEntry {
  team_id: string;
  name: string;
  game_theme: string;
  status: string;
  team_photo_url: string | null;
  updated_at: string;
}

function sortByRecent(entries: TeamFeedEntry[]): TeamFeedEntry[] {
  return [...entries].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
}

export default function Feed() {
  const [entries, setEntries] = useState<TeamFeedEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('team_photos')
      .select('team_id, name, game_theme, status, team_photo_url, updated_at')
      .neq('status', 'withdrawn')
      .then(res => {
        if (res.data) setEntries(sortByRecent(res.data as TeamFeedEntry[]));
        setLoading(false);
      });

    const channel = supabase
      .channel('team-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_photos' }, payload => {
        setEntries(prev => {
          if (payload.eventType === 'DELETE') {
            return prev.filter(e => e.team_id !== (payload.old as TeamFeedEntry).team_id);
          }
          const updated = payload.new as TeamFeedEntry;
          if (updated.status === 'withdrawn') {
            return prev.filter(e => e.team_id !== updated.team_id);
          }
          const withoutUpdated = prev.filter(e => e.team_id !== updated.team_id);
          return sortByRecent([...withoutUpdated, updated]);
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const withPhotos = entries.filter(e => e.team_photo_url);

  if (loading) {
    return <p style={{ color: 'var(--color-body-subtle)', textAlign: 'center' }}>Loading feed…</p>;
  }

  if (withPhotos.length === 0) {
    return (
      <div className="panel panel-secondary text-center scale-up-anim" style={{ padding: '48px 24px' }}>
        <MessageSquare size={32} style={{ color: 'var(--brand)', marginBottom: 16 }} />
        <h3>No photos yet</h3>
        <p style={{ color: 'var(--color-body-subtle)', marginBottom: 0 }}>
          Team photos will pop up here the moment they're uploaded.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-20 scale-up-anim">
      {withPhotos.map(entry => (
        <div key={entry.team_id} className="feed-msg">
          <div className="feed-bubble">
            <div className="feed-bubble-head">
              <strong>{entry.name}</strong>
              <span>{entry.game_theme}</span>
            </div>
            <img src={entry.team_photo_url!} alt={`${entry.name} team photo`} />
          </div>
          <span className="feed-bubble-tail" />
        </div>
      ))}
    </div>
  );
}
