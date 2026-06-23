import { Rss } from 'lucide-react';

export default function Feed() {
  return (
    <div className="panel panel-secondary text-center scale-up-anim" style={{ padding: '48px 24px' }}>
      <Rss size={32} style={{ color: 'var(--brand)', marginBottom: 16 }} />
      <h3>Feed coming soon</h3>
      <p style={{ color: 'var(--color-body-subtle)', marginBottom: 0 }}>
        Team updates and announcements will show up here.
      </p>
    </div>
  );
}
