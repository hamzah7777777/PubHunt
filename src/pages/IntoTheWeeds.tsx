import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Crown, Gamepad2, Medal, Search, Sparkles, Trophy, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getCoverMap, resolveCover } from '../lib/covers';
import FloatingHeads from '../components/FloatingHeads';
import ShowcaseNav from '../components/ShowcaseNav';
import { withRanks } from './adminScoring';
import { TEAM_POINTS } from './intoTheWeedsPoints';
import './IntoTheWeeds.css';

// Standalone full leaderboard for the finished 2026 Pub Hunt, reachable at
// /into-the-weeds (or /#into-the-weeds) and linked from the awards page.
// Rendered outside the phone shell so it can fill a desktop screen while
// collapsing to a single column on phones.
//
// Points are frozen: the per-team answer tables are admin-only (RLS), so the
// final totals are baked in TEAM_POINTS (from the host CSV export). Everything
// else — team name, theme, captain, cover art — loads live from the same
// anon-readable sources the team login uses, so covers render identically.

interface Row {
  id: string;
  name: string;
  theme: string;
  captain: string;
  cover: string;
  points: number;
  rank: number;
}

interface Props {
  onExit: () => void;
  onBackToAwards: () => void;
  onOpenAnswers: () => void;
  onOpenGallery: () => void;
}

const PODIUM_META = [
  { label: '1st', Icon: Crown, cls: 'itw-gold' },
  { label: '2nd', Icon: Medal, cls: 'itw-silver' },
  { label: '3rd', Icon: Medal, cls: 'itw-bronze' },
] as const;

export default function IntoTheWeeds({ onExit, onBackToAwards, onOpenAnswers, onOpenGallery }: Props) {
  // null = still loading; [] = loaded but empty / errored.
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const prev = document.title;
    document.title = 'Pub Hunt 2026 — Full Leaderboard';
    window.scrollTo(0, 0);
    let cancelled = false;

    Promise.all([
      supabase.from('teams').select('id,name,game_theme,cover_url').order('name'),
      supabase.rpc('list_team_captains'),
      getCoverMap(),
    ])
      .then(([teamsRes, captainsRes, covers]) => {
        if (cancelled) return;
        if (teamsRes.error || !teamsRes.data) {
          setError('Could not load the leaderboard. Please try again later.');
          setRows([]);
          return;
        }
        const captainByTeam = new Map<string, string>();
        (captainsRes.data || []).forEach((c: { team_id: string; captain_name: string }) => {
          captainByTeam.set(c.team_id, c.captain_name);
        });
        const merged = teamsRes.data.map(
          (t: { id: string; name: string; game_theme: string; cover_url: string | null }): Omit<Row, 'rank'> => ({
            id: t.id,
            name: t.name,
            theme: t.game_theme,
            captain: captainByTeam.get(t.id) || '—',
            cover: resolveCover(t.cover_url, t.game_theme, covers),
            // Baked final total; teams not in the export show 0.
            points: TEAM_POINTS[t.name] ?? TEAM_POINTS[t.name.trim()] ?? 0,
          })
        );
        // Only teams that actually scored appear on the leaderboard.
        const ranked = withRanks(
          merged
            .filter(r => r.points > 0)
            .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name)),
          r => r.points
        );
        setRows(ranked);
      })
      .catch(() => {
        if (cancelled) return;
        setError('Could not load the leaderboard. Please try again later.');
        setRows([]);
      });

    return () => {
      cancelled = true;
      document.title = prev;
    };
  }, []);

  const maxPoints = rows && rows.length ? rows[0].points : 0;

  const filtered = useMemo(() => {
    if (!rows) return [];
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      r =>
        r.name.toLowerCase().includes(q) ||
        r.theme.toLowerCase().includes(q) ||
        r.captain.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const podium = rows ? rows.slice(0, 3) : [];
  const searching = search.trim().length > 0;

  return (
    <div className="itw-root">
      <FloatingHeads />
      <header className="itw-header">
        <button className="itw-header-logo" onClick={onExit} aria-label="Back to Pub Hunt">
          <Gamepad2 size={22} />
          <span>PUB<span>HUNT</span></span>
        </button>
        <div className="itw-header-actions">
          <button className="btn btn-sm itw-nav-btn" onClick={onBackToAwards}>
            <Trophy size={14} /> Awards
          </button>
          <button className="btn btn-sm itw-nav-btn" onClick={onExit}>
            <ArrowLeft size={14} /> Main site
          </button>
        </div>
      </header>

      <div className="itw-container">
        {/* HERO */}
        <section className="itw-hero">
          <Sparkles className="itw-hero-spark itw-hero-spark-1" size={20} />
          <Sparkles className="itw-hero-spark itw-hero-spark-2" size={16} />
          <div className="itw-hero-badge">
            <Trophy size={38} />
          </div>
          <span className="kicker kicker-white">Sheffield 2026 · Final Standings</span>
          <h1 className="itw-hero-title">INTO THE WEEDS</h1>
          <p className="itw-hero-sub">The full leaderboard — every team, every point.</p>
          {rows && rows.length > 0 && (
            <div className="itw-hero-tags">
              <span className="itw-hero-tag"><Gamepad2 size={14} /> {rows.length} teams</span>
              <span className="itw-hero-tag"><Trophy size={14} /> {maxPoints} top score</span>
            </div>
          )}
        </section>

        {rows === null && <p className="itw-status">Loading the final standings…</p>}

        {rows !== null && error && (
          <div className="alert alert-danger itw-alert">
            <span>{error}</span>
          </div>
        )}

        {rows !== null && !error && rows.length === 0 && (
          <p className="itw-status">No teams to show yet.</p>
        )}

        {/* PODIUM — top 3 champions, hidden while searching. */}
        {!searching && podium.length > 0 && (
          <section className="itw-podium">
            {podium.map((r, i) => {
              const meta = PODIUM_META[i];
              const Icon = meta.Icon;
              return (
                <article key={r.id} className={`itw-champ ${meta.cls} ${i === 0 ? 'itw-champ-1' : ''}`}>
                  <span className="itw-champ-rank">
                    <Icon size={i === 0 ? 20 : 16} /> {meta.label}
                  </span>
                  <div className="itw-champ-cover">
                    <img src={r.cover} alt={r.theme} loading="lazy" />
                  </div>
                  <h2 className="itw-champ-name">{r.name}</h2>
                  <span className="itw-champ-theme">{r.theme}</span>
                  <span className="itw-champ-captain"><User size={12} /> {r.captain}</span>
                  <span className="itw-champ-points">
                    {r.points}<small>pts</small>
                  </span>
                </article>
              );
            })}
          </section>
        )}

        {/* FULL STANDINGS */}
        {rows !== null && rows.length > 0 && (
          <section className="itw-standings">
            <div className="itw-standings-head">
              <h3>Full Standings</h3>
              <div className="itw-search">
                <Search size={16} />
                <input
                  type="text"
                  className="game-input"
                  placeholder="Search team, game or captain…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            {filtered.length === 0 ? (
              <p className="itw-status">No teams match “{search}”.</p>
            ) : (
              <ol className="itw-list">
                {filtered.map(r => (
                  <li key={r.id} className={`itw-row ${r.rank <= 3 ? `itw-row-top itw-rank-${r.rank}` : ''}`}>
                    <span className="itw-row-rank">{r.rank}</span>
                    <div className="itw-row-cover">
                      <img src={r.cover} alt={r.theme} loading="lazy" />
                    </div>
                    <div className="itw-row-main">
                      <span className="itw-row-name">{r.name}</span>
                      <span className="itw-row-meta">
                        <span className="itw-row-theme"><Gamepad2 size={12} /> {r.theme}</span>
                        <span className="itw-row-captain"><User size={12} /> {r.captain}</span>
                      </span>
                      <span className="itw-row-bar-track">
                        <span
                          className="itw-row-bar"
                          style={{ width: `${maxPoints > 0 ? Math.max(4, (r.points / maxPoints) * 100) : 0}%` }}
                        />
                      </span>
                    </div>
                    <span className="itw-row-points">
                      {r.points}<small>pts</small>
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        )}

        {/* Cross-navigation to the other public showcase pages. */}
        <ShowcaseNav
          current="leaderboard"
          onMainSite={onExit}
          onAwards={onBackToAwards}
          onAnswers={onOpenAnswers}
          onGallery={onOpenGallery}
        />
      </div>
    </div>
  );
}
