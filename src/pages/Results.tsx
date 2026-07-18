import { useEffect, useState } from 'react';
import {
  Brain,
  Camera,
  Crown,
  HeartHandshake,
  Medal,
  PartyPopper,
  Puzzle,
  Sparkles,
  Swords,
  ThumbsUp,
  Trophy,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Award } from '../types';
import './Results.css';

// Hidden awards page, reachable only by URL (/results or /#results) — no
// buttons on the site link here yet. Awards live in the public-readable
// awards table (supabase/awards.sql) and are edited from the admin
// dashboard's Awards tab. FALLBACK_AWARDS mirrors that file's seed so the
// page still shows the real winners if the table hasn't been created yet.

const FALLBACK_AWARDS: Award[] = [
  { slug: 'podium-1', place: 1, title: '', blurb: '', winner: 'IAM a Plant, IAM a Zombie', second: null, third: null, detail: '133 pts', sort_order: 0 },
  { slug: 'podium-2', place: 2, title: '', blurb: '', winner: '50 Shades of Spray', second: null, third: null, detail: '99 pts', sort_order: 0 },
  { slug: 'podium-3', place: 3, title: '', blurb: '', winner: 'The Clever Ones', second: null, third: null, detail: '96 pts', sort_order: 0 },
  { slug: 'quiz-masters', place: null, title: 'Quiz Masters', blurb: 'Top scores across all the pub route quizzes.', winner: 'S.T.A.R.S. — 12/12', second: 'No Pain No Game — 12/12', third: 'The Clever Ones — 11/12', detail: 'Four teams tied on 11/12 — 3rd went to the best overall total', sort_order: 1 },
  { slug: 'clash-champions', place: null, title: 'Clash Champions', blurb: 'Most rival teams named in the Team Clash.', winner: 'IAM a Plant, IAM a Zombie — 51', second: 'Data Ventures — 48', third: 'Saddle Sore Squad — 38', detail: 'Tied 38s for 3rd split by overall total', sort_order: 2 },
  { slug: 'eagle-eyes', place: null, title: 'Eagle Eyes', blurb: 'Best at the character and console photo challenges.', winner: '50 Shades of Spray — 30/30', second: 'FC Wild Cards — 30/30', third: '2nd Best — 30/30', detail: '16 teams shot a perfect 30/30 — top three by overall total', sort_order: 3 },
  { slug: 'word-wizards', place: null, title: 'Word Wizards', blurb: 'Untangled the most anagrams and missing vowels.', winner: 'I am rubber, you are glue — 16/16', second: '50 Shades of Spray — 15/16', third: 'Raiders of the lost packets — 15/16', detail: 'Tied 15s split by overall total', sort_order: 4 },
  { slug: 'big-brain-energy', place: null, title: 'Big Brain Energy', blurb: 'Highest scores on the brain training gauntlet.', winner: '50 Shades of Spray — 8/8', second: 'FC Wild Cards — 8/8', third: 'Chilled Out Chickens — 8/8', detail: 'Four perfect 8/8s — top three by overall total', sort_order: 5 },
  { slug: 'social-stars', place: null, title: 'Social Stars', blurb: 'Best photo and video uploads to the Facebook group.', winner: 'IAM a Plant, IAM a Zombie — 25/25', second: '50 Shades of Spray — 25/25', third: 'The Clever Ones — 25/25', detail: '12 teams hit full marks — ranked by overall total', sort_order: 6 },
].map((a, i) => ({ ...a, id: `fallback-${i}` }));

// The look of each award stays in code; the table only holds the words.
// Unknown slugs (awards added from the dashboard) get the default trophy.
const AWARD_STYLES: Record<string, { icon: typeof Trophy; accent: string }> = {
  'quiz-masters': { icon: Crown, accent: 'var(--award-gold)' },
  'clash-champions': { icon: Swords, accent: 'var(--secondary-brand)' },
  'eagle-eyes': { icon: Camera, accent: 'var(--tertiary-brand)' },
  'word-wizards': { icon: Puzzle, accent: 'var(--brand-strong)' },
  'big-brain-energy': { icon: Brain, accent: 'var(--award-silver)' },
  'social-stars': { icon: ThumbsUp, accent: 'var(--award-bronze)' },
};
const DEFAULT_STYLE = { icon: Trophy, accent: 'var(--award-gold)' };

const PODIUM_LABELS: Record<number, string> = { 1: '1ST', 2: '2ND', 3: '3RD' };

export default function Results() {
  const [awards, setAwards] = useState<Award[]>(FALLBACK_AWARDS);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('awards')
      .select('*')
      .then(({ data, error }) => {
        // Errors (e.g. awards.sql not run yet) or an emptied table keep the
        // built-in fallback rather than blanking the ceremony.
        if (cancelled || error || !data || data.length === 0) return;
        setAwards(data as Award[]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Rendered 2nd–1st–3rd so the tallest block sits centre stage.
  const podium = [2, 1, 3]
    .map(place => awards.find(a => a.place === place))
    .filter((a): a is Award => a !== undefined);
  const specials = awards
    .filter(a => a.place === null)
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="flex flex-col gap-24 scale-up-anim">
      <div className="panel panel-dark text-center results-hero" style={{ padding: '36px 24px' }}>
        <Sparkles className="results-hero-spark" size={18} style={{ top: 14, left: 16 }} />
        <Sparkles className="results-hero-spark" size={14} style={{ top: 26, right: 20 }} />
        <div className="results-hero-trophy">
          <Trophy size={32} />
        </div>
        <span className="kicker kicker-white">Sheffield Pub Hunt 2026</span>
        <h1 style={{ color: 'var(--color-white)', fontSize: 36, marginBottom: 8 }}>AWARDS</h1>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 18, marginBottom: 0 }}>
          The official results ceremony. Champions, honours and eternal pub glory.
        </p>
      </div>

      <section>
        <span className="kicker">Grand Champions</span>
        <div className="results-podium">
          {podium.map(spot => {
            const PlaceIcon = spot.place === 1 ? Crown : Medal;
            return (
              <div key={spot.place} className={`results-podium-col results-podium-${spot.place}`}>
                <span className="results-podium-medal">
                  <PlaceIcon size={22} />
                </span>
                {spot.winner ? (
                  <span className="results-podium-team">{spot.winner}</span>
                ) : (
                  <span className="results-podium-team results-tba">???</span>
                )}
                {spot.winner && spot.detail && (
                  <span className="results-podium-points">{spot.detail}</span>
                )}
                <div className="results-podium-block">{PODIUM_LABELS[spot.place ?? 0]}</div>
              </div>
            );
          })}
        </div>
        {podium.every(s => !s.winner) && (
          <p className="text-center results-tba" style={{ fontSize: 12, marginTop: 16 }}>
            TO BE REVEALED
          </p>
        )}
      </section>

      <section>
        <span className="kicker">Awards &amp; Honours</span>
        <div className="flex flex-col gap-12">
          {specials.map(award => {
            const { icon: AwardIcon, accent } = AWARD_STYLES[award.slug] ?? DEFAULT_STYLE;
            return (
              <div key={award.slug} className="panel results-award">
                <span className="results-award-icon" style={{ background: accent }}>
                  <AwardIcon size={22} />
                </span>
                <div className="results-award-body">
                  <div className="results-award-title">{award.title}</div>
                  <p className="results-award-blurb">{award.blurb}</p>
                  {award.winner ? (
                    <>
                      <ol className="results-award-places">
                        {[award.winner, award.second, award.third]
                          .filter((t): t is string => !!t)
                          .map((team, i) => (
                            <li key={i} className={`results-award-place results-award-place-${i + 1}`}>
                              <span className="results-award-place-rank">{i + 1}</span>
                              <span className="results-award-place-team">
                                {team}
                                {i === 0 && <PartyPopper size={14} className="results-award-party" />}
                              </span>
                            </li>
                          ))}
                      </ol>
                      {award.detail && <p className="results-award-detail">{award.detail}</p>}
                    </>
                  ) : (
                    <span className="results-tba" style={{ fontSize: 10 }}>TO BE REVEALED</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="panel panel-tertiary text-center" style={{ padding: '24px 20px' }}>
        <HeartHandshake size={24} style={{ color: 'var(--fg-success-strong)', marginBottom: 10 }} />
        <p style={{ fontSize: 17, marginBottom: 0 }}>
          Thank you to every team who hunted, guessed, sang and donated. Every coin
          earned tonight goes to charity — you&rsquo;re all winners really.
        </p>
      </div>
    </div>
  );
}
