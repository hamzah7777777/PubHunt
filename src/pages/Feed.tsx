import { useEffect, useState } from 'react';
import { Camera, Gamepad2, Rss } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { FALLBACK_COVER, getCoverMap } from '../lib/covers';

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
  const [coverMap, setCoverMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase
        .from('team_photos')
        .select('team_id, name, game_theme, status, team_photo_url, updated_at')
        .neq('status', 'withdrawn'),
      getCoverMap(),
    ]).then(([res, covers]) => {
      if (res.data) setEntries(sortByRecent(res.data as TeamFeedEntry[]));
      setCoverMap(covers);
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

  const coverFor = (theme: string) => coverMap.get(theme.trim().toLowerCase()) ?? FALLBACK_COVER;

  if (loading) {
    return <p style={{ color: 'var(--color-body-subtle)', textAlign: 'center' }}>Loading feed…</p>;
  }

  if (entries.length === 0) {
    return (
      <div className="panel panel-secondary text-center scale-up-anim" style={{ padding: '48px 24px' }}>
        <Rss size={32} style={{ color: 'var(--brand)', marginBottom: 16 }} />
        <h3>No teams yet</h3>
        <p style={{ color: 'var(--color-body-subtle)', marginBottom: 0 }}>
          Team photos will show up here as soon as they're uploaded.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-16 scale-up-anim">
      {entries.map(entry => (
        <div key={entry.team_id} className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ position: 'relative', aspectRatio: '4 / 3', background: 'var(--neutral-primary-medium)' }}>
            <img
              src={entry.team_photo_url || coverFor(entry.game_theme)}
              alt={entry.team_photo_url ? `${entry.name} team photo` : entry.game_theme}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {!entry.team_photo_url && (
              <span
                className="badge"
                style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(12,11,20,0.85)' }}
              >
                <Camera size={12} /> No photo yet
              </span>
            )}
          </div>
          <div style={{ padding: 16 }}>
            <h3 style={{ marginBottom: 6 }}>{entry.name}</h3>
            <div className="flex items-center gap-8" style={{ color: 'var(--color-body-subtle)', fontSize: 15 }}>
              <Gamepad2 size={16} />
              <span>{entry.game_theme}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
