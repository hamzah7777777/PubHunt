import { useEffect } from 'react';
import {
  ArrowLeft,
  Brain,
  Camera,
  Clapperboard,
  Crown,
  Eye,
  Flag,
  Gamepad2,
  HeartHandshake,
  HelpCircle,
  Lightbulb,
  MapPin,
  Medal,
  PartyPopper,
  PlayCircle,
  Search,
  Shirt,
  Sparkles,
  Star,
  Trophy,
  Users,
} from 'lucide-react';
import Awards2026Heads from './Awards2026Heads';
import './Awards2026.css';

// Standalone awards showcase for the 2026 Pub Hunt, reachable at /Awards2026
// (or /#Awards2026). Rendered outside the phone shell so it can use the full
// width of a desktop screen while collapsing to a single column on phones.
// All content is static — the winners below are baked in, and the photos live
// in public/awards2026/ (optimised webp) with game cover art in public/covers/.

interface Winner {
  place: 1 | 2 | 3;
  photo: string;
  /** Team name, or the person's name for individual awards. */
  name: string;
  theme: string;
  cover: string;
  captain?: string;
  members?: string[];
  /** Individual-outfit awards: the character they came as. */
  character?: string;
  /** Scene re-enactment awards: link to the Facebook video. */
  videoUrl?: string;
}

interface Category {
  key: string;
  kicker: string;
  title: string;
  tagline: string;
  Icon: typeof Trophy;
  winners: Winner[];
}

const CATEGORIES: Category[] = [
  {
    key: 'trivia',
    kicker: 'Award 01',
    title: 'Trivia Quiz Winners',
    tagline: 'The sharpest minds across every pub route quiz.',
    Icon: Brain,
    winners: [
      {
        place: 1,
        photo: '/awards2026/trivia-1.webp',
        name: 'IAM a Plant, IAM a Zombie',
        theme: 'Plants Vs Zombies',
        cover: '/covers/plants-vs-zombies.webp',
        captain: 'Daniel Poole',
        members: ['Tamara Mehmet', 'David R Thompson', 'Chris Pickles', 'Sylvia Crownshaw', 'Katie Vandrill', 'Gareth Scott'],
      },
      {
        place: 2,
        photo: '/awards2026/trivia-2.webp',
        name: '50 Shades of Spray',
        theme: 'Subway Surfer',
        cover: '/covers/subway-surfers.webp',
        captain: 'Dan Beggs',
        members: ['Kerry Hanks', 'Richard Clarkson', 'Jamie Lancaster'],
      },
      {
        place: 3,
        photo: '/awards2026/trivia-3.webp',
        name: 'The Clever Ones',
        theme: 'Fortnite',
        cover: '/covers/fortnite.webp',
        captain: 'Gemma E Whitaker',
        members: ['Andy L Barnes', 'Chelsie A Lucas', 'Richard Saxton'],
      },
    ],
  },
  {
    key: 'team',
    kicker: 'Award 02',
    title: 'Best Team Outfit',
    tagline: 'Group costumes that turned Sheffield into a games arcade.',
    Icon: Shirt,
    winners: [
      {
        place: 1,
        photo: '/awards2026/team-1.webp',
        name: 'Wormageddon',
        theme: 'Worms',
        cover: '/covers/worms.webp',
        captain: 'Arfan Chaudhry',
        members: ['Samantha Stones', 'Marilyne Abony', 'Nitesh Mistry', 'Natalie Mitchell', 'Michael Short', 'Ray Bunton', 'Adam Dipple'],
      },
      {
        place: 2,
        photo: '/awards2026/team-2.webp',
        name: 'The Swarm',
        theme: 'Pikmin',
        cover: '/covers/pikmin.webp',
        captain: 'Gurleen Kaur Chauhan',
        members: ['Ben Greenwood', 'Emily Tierney', 'Ciaran Brennan', 'Adam Horst', 'Briony Christie', 'Victoria A Branch'],
      },
      {
        place: 3,
        photo: '/awards2026/team-3.webp',
        name: 'The Sackstreet Boys',
        theme: 'Sackboy',
        cover: '/covers/sackboy.webp',
        captain: 'John Mara',
        members: ['Danny Alan Connor', 'Simon T Fiander', 'Aaron Gonzalez', 'Luke Cooper', 'Joseph J Pearson'],
      },
    ],
  },
  {
    key: 'individual',
    kicker: 'Award 03',
    title: 'Best Individual Outfit',
    tagline: 'Solo cosplay commitment of the highest order.',
    Icon: Star,
    winners: [
      {
        place: 1,
        photo: '/awards2026/individual-1.webp',
        name: 'Gavin Newhouse',
        character: 'Johnny Silverhand',
        theme: 'Cyberpunk 2077',
        cover: '/covers/cyberpunk-2077.webp',
      },
      {
        place: 2,
        photo: '/awards2026/individual-2.webp',
        name: 'Louise Whaley',
        character: 'Lakitu',
        theme: 'Super Mario Kart',
        cover: '/covers/mario-kart.webp',
      },
      {
        place: 3,
        photo: '/awards2026/individual-3.webp',
        name: 'Alastair Fisher',
        character: 'Darth Maul',
        theme: 'Star Wars: Knights of the Old Republic',
        cover: '/covers/star-wars.webp',
      },
    ],
  },
  {
    key: 'scene',
    kicker: 'Award 04',
    title: 'Best Scene Re-enactment',
    tagline: 'Lights, camera, action — the night’s finest performances.',
    Icon: Clapperboard,
    winners: [
      {
        place: 1,
        photo: '/awards2026/scene-1.webp',
        name: '2nd Best',
        theme: "Assassin's Creed",
        cover: '/covers/assassin-s-creed.webp',
        captain: 'Robert Burley',
        members: ['Chris P Peters', 'David Pingree', 'Brett Laking', 'Andrew Aziz', 'Ryan Hides', 'James Denny', 'Ed Clein'],
        videoUrl: 'https://www.facebook.com/reel/2094235424849168',
      },
      {
        place: 2,
        photo: '/awards2026/scene-2.webp',
        name: 'No thoughts, only Potato',
        theme: 'Space Invaders',
        cover: '/covers/space-invader.webp',
        captain: 'Nick C Hails',
        members: ['Cameron McNaught', 'Chelsea Gillespie', 'Christine S Myers', 'Matt Holmes', 'Paul Booth'],
        videoUrl: 'https://www.facebook.com/share/v/1DKpRM51Y6/',
      },
      {
        place: 3,
        photo: '/awards2026/scene-3.webp',
        name: 'Chilled Out Chickens',
        theme: 'Angry Birds',
        cover: '/covers/angry-birds.webp',
        captain: 'Linda Hardy',
        members: ['Nic Van Noort', 'Jaine Stanway', 'Nick Bolsover', 'Tracey Blackburn'],
        videoUrl: 'https://www.facebook.com/reel/1011821361476479',
      },
    ],
  },
];

const PLACE_META: Record<1 | 2 | 3, { label: string; Icon: typeof Trophy }> = {
  1: { label: '1st', Icon: Crown },
  2: { label: '2nd', Icon: Medal },
  3: { label: '3rd', Icon: Medal },
};

// ---- Fun Facts data ----------------------------------------------------

interface HardQuestion {
  tag: string;
  clue: string;
  answer: string;
  correct: number;
  answered: number;
  note?: string;
}

const HARD_QUESTIONS: HardQuestion[] = [
  {
    tag: 'Missing Vowels · Q5',
    clue: 'LNRDDDRDMPTN',
    answer: 'LA Noire · Red Dead Redemption',
    correct: 5,
    answered: 24,
  },
  {
    tag: 'Missing Vowels · Q2',
    clue: 'PKMNCRFT',
    answer: 'Pikmin · Minecraft',
    correct: 8,
    answered: 38,
    note: 'Most teams wrote Pokémon instead of Pikmin.',
  },
  {
    tag: 'Brain Training · Q3',
    clue: 'First video game made for commercial release?',
    answer: 'Computer Space',
    correct: 10,
    answered: 34,
    note: 'Most teams answered Pong.',
  },
];

interface ClashRow {
  rank: string;
  team: string;
  theme: string;
  value: number;
}

// Team Clash — teams whose own name was recognised by the most others.
const MOST_RECOGNISED: ClashRow[] = [
  { rank: '1', team: 'Data Ventures', theme: 'Marvel Avengers', value: 33 },
  { rank: '2', team: 'Grand Theft Ale', theme: 'Grand Theft Auto', value: 29 },
  { rank: '3', team: 'Saddle Sore Squad', theme: 'Red Dead Redemption', value: 28 },
  { rank: '4', team: 'IAM a Plant, IAM a Zombie', theme: 'Plants vs Zombies', value: 27 },
  { rank: '5', team: 'Raiders of the lost Packets', theme: 'Hogwarts Legacy', value: 25 },
];

// Team Clash — teams that recognised the most rivals (two tied for 3rd).
const BEST_DETECTIVES: ClashRow[] = [
  { rank: '1', team: 'IAM a Plant, IAM a Zombie', theme: 'Plants vs Zombies', value: 51 },
  { rank: '2', team: 'Data Ventures', theme: 'Marvel Avengers', value: 48 },
  { rank: '=3', team: 'Grand Theft Ale', theme: 'Grand Theft Auto', value: 38 },
  { rank: '=3', team: 'Saddle Sore Squad', theme: 'Red Dead Redemption', value: 38 },
  { rank: '5', team: 'The Clever Ones', theme: 'Fortnite', value: 33 },
];

// Low-poly character heads (public/braintrainer/) used for the drifting,
// bouncing background behind the page — see Awards2026Heads.
const FACE_COUNT = 17;
const FACES = Array.from({ length: FACE_COUNT }, (_, i) => `/braintrainer/braintrainer${i + 1}.webp`);

function ClashList({ title, Icon, unit, rows }: { title: string; Icon: typeof Trophy; unit: string; rows: ClashRow[] }) {
  const max = Math.max(...rows.map(r => r.value));
  return (
    <div className="panel aw-ff-list">
      <div className="aw-ff-list-head">
        <Icon size={16} />
        <h4>{title}</h4>
      </div>
      <ol className="aw-ff-rows">
        {rows.map((r, i) => (
          <li key={i} className="aw-ff-row">
            <span className="aw-ff-rank">{r.rank}</span>
            <div className="aw-ff-row-main">
              <span className="aw-ff-team">{r.team}</span>
              <span className="aw-ff-row-theme">{r.theme}</span>
              <span className="aw-ff-bar">
                <span className="aw-ff-bar-fill" style={{ width: `${(r.value / max) * 100}%` }} />
              </span>
            </div>
            <span className="aw-ff-value">
              {r.value}
              <small>{unit}</small>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ThemeChip({ winner }: { winner: Winner }) {
  return (
    <div className="aw-theme">
      <img
        className="aw-theme-cover"
        src={winner.cover}
        alt=""
        loading="lazy"
        onError={e => {
          e.currentTarget.style.display = 'none';
        }}
      />
      <div className="aw-theme-text">
        <span className="aw-theme-label">
          <Gamepad2 size={11} /> Theme
        </span>
        <strong>{winner.theme}</strong>
      </div>
    </div>
  );
}

function WinnerDetails({ winner }: { winner: Winner }) {
  return (
    <>
      <ThemeChip winner={winner} />

      {winner.character && (
        <p className="aw-character">
          Dressed as <strong>{winner.character}</strong>
        </p>
      )}

      {winner.captain && (
        <div className="aw-people">
          <span className="aw-people-label">Captain</span>
          <span className="aw-captain">
            <Crown size={13} /> {winner.captain}
          </span>
        </div>
      )}

      {winner.members && winner.members.length > 0 && (
        <div className="aw-people">
          <span className="aw-people-label">Team</span>
          <ul className="aw-members">
            {winner.members.map(m => (
              <li key={m} className="aw-member">{m}</li>
            ))}
          </ul>
        </div>
      )}

      {winner.videoUrl && (
        <a className="btn btn-secondary aw-watch" href={winner.videoUrl} target="_blank" rel="noreferrer">
          <PlayCircle size={16} /> Watch the re-enactment
        </a>
      )}
    </>
  );
}

function WinnerCard({ winner, featured, catKey }: { winner: Winner; featured: boolean; catKey: string }) {
  const { label, Icon } = PLACE_META[winner.place];
  return (
    <article className={`aw-card aw-kind-${catKey} aw-place-${winner.place} ${featured ? 'aw-champion' : 'aw-runner'}`}>
      <div className="aw-photo">
        <img src={winner.photo} alt={`${winner.name} — ${winner.theme}`} loading="lazy" />
        <span className={`aw-rank aw-rank-${winner.place}`}>
          <Icon size={14} /> {label}
        </span>
      </div>
      <div className="aw-info">
        <h3 className="aw-name">
          {winner.name}
          {featured && <PartyPopper className="aw-name-party" size={18} />}
        </h3>
        <WinnerDetails winner={winner} />
      </div>
    </article>
  );
}

export default function Awards2026({ onExit, onOpenGallery }: { onExit: () => void; onOpenGallery: () => void }) {
  useEffect(() => {
    const prev = document.title;
    document.title = 'Pub Hunt 2026 — Awards';
    window.scrollTo(0, 0);
    return () => {
      document.title = prev;
    };
  }, []);

  return (
    <div className="aw-root">
      {/* Character heads drifting and bouncing around behind the content. */}
      <Awards2026Heads faces={FACES} />

      <header className="aw-header">
        <button className="aw-header-logo" onClick={onExit} aria-label="Back to Pub Hunt">
          <Gamepad2 size={22} />
          <span>PUB<span>HUNT</span></span>
        </button>
        <button className="btn btn-sm aw-back" onClick={onExit}>
          <ArrowLeft size={14} /> Main site
        </button>
      </header>

      <div className="aw-container">
        {/* HERO */}
        <section className="aw-hero">
          <Sparkles className="aw-hero-spark aw-hero-spark-1" size={20} />
          <Sparkles className="aw-hero-spark aw-hero-spark-2" size={16} />
          <Sparkles className="aw-hero-spark aw-hero-spark-3" size={14} />
          <div className="aw-hero-trophy">
            <Trophy size={40} />
          </div>
          <span className="kicker kicker-white">Grosvenor House · Sheffield</span>
          <h1 className="aw-hero-title">PUB HUNT 2026</h1>
          <p className="aw-hero-sub">The Awards.</p>
          <div className="aw-hero-tags">
            <span className="aw-hero-tag"><Users size={14} /> 400+ attendees</span>
            <span className="aw-hero-tag"><Gamepad2 size={14} /> Video games theme</span>
            <span className="aw-hero-tag"><MapPin size={14} /> Sheffield city centre</span>
          </div>
          <button className="btn btn-lg aw-gallery-cta" onClick={onOpenGallery}>
            <Camera size={18} /> View the Photo Gallery
          </button>
        </section>

        {/* INTRO */}
        <section className="aw-intro panel">
          <p>Another year, another brilliant Pub Hunt for the Grosvenor House office!</p>
          <p>
            If you&rsquo;ve not joined us before, it&rsquo;s all about team bonding, problem-solving, and
            networking. Teams set off across Sheffield, split into different routes, solving riddles and
            answering questions as they went &mdash; before everyone regrouped at the final venue to keep the
            energy going and dance the night away.
          </p>
          <p>
            This year&rsquo;s theme was video games, and the effort put into outfits was next level. Where else
            would you spot a creeper, Princess Peach, and a lemming all in the same place?
          </p>
          <p>
            The Four Leaf was our final stop, where 400+ attendees came together to catch up with people from
            other routes, hit the dancefloor, and even squeeze in a few rounds of Mario Kart. It ran into the
            early hours &mdash; and if that&rsquo;s not the sign of a top-notch night, I don&rsquo;t know what is!
          </p>
        </section>

        {/* AWARD CATEGORIES */}
        {CATEGORIES.map(cat => (
          <section key={cat.key} className="aw-cat">
            <div className="aw-cat-head">
              <span className="aw-cat-icon">
                <cat.Icon size={24} />
              </span>
              <div className="aw-cat-head-text">
                <span className="kicker">{cat.kicker}</span>
                <h2 className="aw-cat-title">{cat.title}</h2>
                <p className="aw-cat-tagline">{cat.tagline}</p>
              </div>
            </div>

            {cat.key === 'individual' ? (
              // Full-body solo costumes: a 3-up row of portrait cards shown
              // whole (no cropping), rather than the wide champion banner.
              <div className="aw-solo-grid">
                {cat.winners.map(w => (
                  <WinnerCard key={w.place} winner={w} featured={false} catKey={cat.key} />
                ))}
              </div>
            ) : (
              <div className="aw-podium">
                <WinnerCard winner={cat.winners[0]} featured catKey={cat.key} />
                <div className="aw-runners">
                  <WinnerCard winner={cat.winners[1]} featured={false} catKey={cat.key} />
                  <WinnerCard winner={cat.winners[2]} featured={false} catKey={cat.key} />
                </div>
              </div>
            )}
          </section>
        ))}

        {/* FUN FACTS */}
        <section className="aw-cat aw-funfacts">
          <div className="aw-cat-head">
            <span className="aw-cat-icon aw-cat-icon-alt">
              <Lightbulb size={24} />
            </span>
            <div className="aw-cat-head-text">
              <span className="kicker">By the numbers</span>
              <h2 className="aw-cat-title">Fun Facts</h2>
              <p className="aw-cat-tagline">The stats, the stumpers and the stand-outs from the night.</p>
            </div>
          </div>

          {/* Overall & route winners */}
          <div className="panel aw-ff-routes">
            <div className="aw-ff-route aw-ff-route-hero">
              <span className="aw-ff-route-label"><Trophy size={13} /> Top team overall</span>
              <span className="aw-ff-route-team">IAM a Plant, IAM a Zombie</span>
            </div>
            <div className="aw-ff-route">
              <span className="aw-ff-route-label"><Flag size={13} /> Top team · Route A</span>
              <span className="aw-ff-route-team">IAM a Plant, IAM a Zombie</span>
            </div>
            <div className="aw-ff-route">
              <span className="aw-ff-route-label"><Flag size={13} /> Top team · Route B</span>
              <span className="aw-ff-route-team">50 Shades of Spray</span>
            </div>
          </div>

          {/* The three hardest questions */}
          <div className="aw-ff-block">
            <h3 className="aw-ff-subhead"><HelpCircle size={16} /> The three hardest questions</h3>
            <div className="aw-ff-q-grid">
              {HARD_QUESTIONS.map((q, i) => {
                const pct = Math.round((q.correct / q.answered) * 100);
                return (
                  <div key={i} className="panel aw-ff-q">
                    <span className="aw-ff-q-tag">{q.tag}</span>
                    <div className="aw-ff-q-clue">{q.clue}</div>
                    <div className="aw-ff-q-answer">
                      <span className="aw-ff-q-answer-label">Answer</span>
                      {q.answer}
                    </div>
                    <div className="aw-ff-q-stat">
                      <span className="aw-ff-bar">
                        <span className="aw-ff-bar-fill" style={{ width: `${pct}%` }} />
                      </span>
                      <span className="aw-ff-q-score">
                        {q.correct}/{q.answered} right &middot; {pct}%
                      </span>
                    </div>
                    {q.note && <p className="aw-ff-q-note">{q.note}</p>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Team Clash stand-outs */}
          <div className="aw-ff-block">
            <h3 className="aw-ff-subhead"><Users size={16} /> Team Clash stand-outs</h3>
            <div className="aw-ff-lists">
              <ClashList title="Most recognised teams" Icon={Eye} unit="people" rows={MOST_RECOGNISED} />
              <ClashList title="Found the most rivals" Icon={Search} unit="teams" rows={BEST_DETECTIVES} />
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <section className="aw-thanks panel panel-tertiary text-center">
          <HeartHandshake size={26} />
          <p>
            Thank you to everyone who showed up, went all out on the costumes and had an absolute blast. You
            made the night what it was &mdash; here&rsquo;s to the next one!
          </p>
          <div className="aw-thanks-actions">
            <button className="btn aw-gallery-cta" onClick={onOpenGallery}>
              <Camera size={16} /> Photo Gallery
            </button>
            <button className="btn btn-primary" onClick={onExit}>
              Back to Pub Hunt
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
