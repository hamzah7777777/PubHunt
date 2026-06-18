import React, { useState, useEffect } from 'react';
import { 
  Beer, 
  Gamepad2, 
  MapPin, 
  Camera, 
  Users, 
  ArrowRight, 
  Check, 
  X, 
  Sparkles, 
  Volume2, 
  VolumeX,
  Plus,
  Trash2,
  Award
} from 'lucide-react';

// ==========================================
// 8-BIT AUDIO SYNTHESIZER (Web Audio API)
// ==========================================
class SoundFX {
  private ctx: AudioContext | null = null;
  public muted: boolean = false;

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playCoin() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    
    // Classic coin double tone: E6 (988Hz) for 0.08s, then B6 (1976Hz)
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(988, now);
    osc.frequency.setValueAtTime(1976, now + 0.08);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.4);
  }

  playPowerUp() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    
    const now = this.ctx.currentTime;
    // Ascending arpeggio sweep
    osc.frequency.setValueAtTime(330, now); // E4
    osc.frequency.setValueAtTime(392, now + 0.08); // G4
    osc.frequency.setValueAtTime(659, now + 0.16); // E5
    osc.frequency.setValueAtTime(784, now + 0.24); // G5
    osc.frequency.setValueAtTime(1318, now + 0.32); // E6
    osc.frequency.exponentialRampToValueAtTime(2000, now + 0.5);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.65);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.7);
  }

  playSuccess() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    
    const now = this.ctx.currentTime;
    // Happy major chord notes
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.setValueAtTime(659.25, now + 0.06); // E5
    osc.frequency.setValueAtTime(783.99, now + 0.12); // G5
    osc.frequency.setValueAtTime(1046.50, now + 0.18); // C6

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.55);
  }

  playError() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    
    const now = this.ctx.currentTime;
    // Harsh buzz descending
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(60, now + 0.4);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.45);
  }

  playClick() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.05);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.07);
  }
}

const sfx = new SoundFX();

// ==========================================
// TYPES DEFINITIONS & INTERFACES
// ==========================================
interface Pub {
  id: number;
  name: string;
  clue: string;
  passcode: string;
  riddleForNext: string;
  challenge: string;
  challengeType: 'trivia' | 'photo' | 'text';
  triviaQuestion?: string;
  triviaAnswer?: string;
}

interface QuizQuestion {
  id: number;
  round: number;
  question: string;
  options?: string[];
  answer: string;
}

interface GameConfig {
  pubs: Pub[];
  quizQuestions: QuizQuestion[];
  hostCode: string;
}

interface Team {
  name: string;
  size: number;
  theme: 'mario' | 'zelda' | 'rdr' | 'portal' | 'custom';
  customThemeName: string;
  members: string[];
  score: number;
  currentPubIndex: number; // 0 = Pub 1, 1 = Pub 2, 2 = Pub 3, 3 = Completed!
  pubUnlocked: boolean; // Has checked in at currentPubIndex
  challengeCompleted: boolean; // Has completed currentPubIndex's challenge
  quizAnswers: { [questionId: number]: string };
  photos: { [pubId: number]: string }; // Pub ID to compressed base64 string
}

// ==========================================
// DEFAULT DEFAULT GAME CONFIGURATION
// ==========================================
const DEFAULT_CONFIG: GameConfig = {
  hostCode: 'SHEFFIELD1889',
  pubs: [
    {
      id: 1,
      name: 'The Devonshire Cat',
      clue: 'A feline of royal origin on Devonshire Street. Famously serves craft beers.',
      passcode: 'WUMPUS',
      riddleForNext: 'Where green amphibians and talking birds reside. A legendary rock pub!',
      challenge: 'What is the word underneath the large glowing neon sign behind the bar?',
      challengeType: 'text',
      triviaAnswer: 'brewing'
    },
    {
      id: 2,
      name: 'The Frog & Parrot',
      clue: 'Where green amphibians and talking birds reside. A legendary rock pub!',
      passcode: 'SHROOM',
      riddleForNext: 'A historic pub named after the first US President, situated on West Street.',
      challenge: 'Dress up! Take a team photo re-enacting a scene from your chosen video game inside the pub!',
      challengeType: 'photo'
    },
    {
      id: 3,
      name: 'The Washington',
      clue: 'A historic pub named after the first US President, situated on West Street.',
      passcode: 'PORTAL',
      riddleForNext: 'Congratulations! You reached the final pub!',
      challenge: 'Answer this final portal trivia riddle: In the Portal game franchise, what is the legendary cake famously described as?',
      challengeType: 'trivia',
      triviaQuestion: 'What is the cake?',
      triviaAnswer: 'a lie'
    }
  ],
  quizQuestions: [
    // Round 1: Video Games
    { id: 1, round: 1, question: 'In what year was the original Super Mario Bros released on the NES in Japan?', options: ['1983', '1985', '1987', '1989'], answer: '1985' },
    { id: 2, round: 1, question: 'What is the name of Link\'s loyal horse companion in Zelda?', options: ['Roach', 'Epona', 'Shadowfax', 'Agro'], answer: 'Epona' },
    { id: 3, round: 1, question: 'In Pac-Man, what color is the ghost named Blinky?', options: ['Pink', 'Blue', 'Red', 'Orange'], answer: 'Red' },
    
    // Round 2: Sheffield Trivia
    { id: 4, round: 2, question: 'Sheffield is built on how many hills?', options: ['5', '7', '9', '12'], answer: '7' },
    { id: 5, round: 2, question: 'Which legendary indie band formed in High Green, Sheffield in 2002?', options: ['The Human League', 'Pulp', 'Arctic Monkeys', 'Def Leppard'], answer: 'Arctic Monkeys' },
    { id: 6, round: 2, question: 'What iconic spicy sauce has been made in Sheffield since 1885?', answer: 'Hendersons Relish' },
    
    // Round 3: Pubs & Beer
    { id: 7, round: 3, question: 'What is the main bittering agent used in brewing beer?', options: ['Barley', 'Yeast', 'Malt', 'Hops'], answer: 'Hops' },
    { id: 8, round: 3, question: 'Which type of beer is top-fermented and brewed at warmer temperatures?', options: ['Lager', 'Ale', 'Pilsner', 'Bock'], answer: 'Ale' }
  ]
};

export default function App() {
  // Config & State Persistence
  const [config, setConfig] = useState<GameConfig>(() => {
    const saved = localStorage.getItem('pubhunt_config');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });

  const [team, setTeam] = useState<Team | null>(() => {
    const saved = localStorage.getItem('pubhunt_team');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState<'quest' | 'quiz' | 'scrapbook'>('quest');
  const [showAdmin, setShowAdmin] = useState(false);
  const [muted, setMuted] = useState(false);
  const [logoTapCount, setLogoTapCount] = useState(0);
  const [coins, setCoins] = useState<{ id: number; left: number; delay: number }[]>([]);
  const [errorShake, setErrorShake] = useState(false);

  // Form states for Registration
  const [regName, setRegName] = useState('');
  const [regSize, setRegSize] = useState(4);
  const [regTheme, setRegTheme] = useState<'mario' | 'zelda' | 'rdr' | 'portal' | 'custom'>('custom');
  const [regCustomTheme, setRegCustomTheme] = useState('');
  const [regMembers, setRegMembers] = useState<string[]>(['', '']);

  // Gameplay inputs
  const [checkinCode, setCheckinCode] = useState('');
  const [textChallengeAnswer, setTextChallengeAnswer] = useState('');


  // Admin Customizer state
  const [adminCodeInput, setAdminCodeInput] = useState('');
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminPubs, setAdminPubs] = useState<Pub[]>([]);
  const [adminQuiz, setAdminQuiz] = useState<QuizQuestion[]>([]);
  const [adminPasscode, setAdminPasscode] = useState('');
  const [shareConfigString, setShareConfigString] = useState('');

  // Handle URL Config Share Code on boot
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedData = params.get('join');
    if (sharedData) {
      try {
        const decoded = JSON.parse(atob(decodeURIComponent(sharedData)));
        if (decoded.pubs && decoded.quizQuestions) {
          setConfig(decoded);
          localStorage.setItem('pubhunt_config', JSON.stringify(decoded));
          sfx.playPowerUp();
          alert('🎮 Loaded custom Pub Hunt configuration from link successfully!');
          // clean URL without reload
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (e) {
        console.error('Failed to decode configuration', e);
      }
    }
  }, []);

  // Save State changes
  useEffect(() => {
    if (team) {
      localStorage.setItem('pubhunt_team', JSON.stringify(team));
    } else {
      localStorage.removeItem('pubhunt_team');
    }
  }, [team]);

  useEffect(() => {
    localStorage.setItem('pubhunt_config', JSON.stringify(config));
  }, [config]);

  // Synchronize audio mute state
  useEffect(() => {
    sfx.muted = muted;
  }, [muted]);

  // Logo tap mechanism for secret admin access
  const handleLogoTap = () => {
    sfx.playClick();
    const count = logoTapCount + 1;
    setLogoTapCount(count);
    if (count >= 5) {
      setShowAdmin(true);
      setLogoTapCount(0);
      sfx.playPowerUp();
    }
  };

  // Resizing utility to keep image small in localStorage (max 500px)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, pubId: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 480;
        let w = img.width;
        let h = img.height;
        if (w > h) {
          if (w > maxDim) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          }
        } else {
          if (h > maxDim) {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const compressed = canvas.toDataURL('image/jpeg', 0.65);
          
          if (team) {
            const updatedPhotos = { ...team.photos, [pubId]: compressed };
            // Award points for completing the photo challenge
            let scoreBonus = 0;
            if (!team.challengeCompleted) {
              scoreBonus = 100;
              triggerCoinShower();
              sfx.playCoin();
            }
            setTeam({
              ...team,
              photos: updatedPhotos,
              challengeCompleted: true,
              score: team.score + scoreBonus
            });
          }
        }
      };
    };
    reader.readAsDataURL(file);
  };

  // Sparkly coin shower animation triggers
  const triggerCoinShower = () => {
    const newCoins = Array.from({ length: 15 }).map((_, i) => ({
      id: Date.now() + i,
      left: Math.random() * 85 + 5,
      delay: Math.random() * 0.4
    }));
    setCoins(newCoins);
    setTimeout(() => {
      setCoins([]);
    }, 2000);
  };

  // Team Registration Submit
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    sfx.playPowerUp();
    triggerCoinShower();
    
    const validMembers = regMembers.filter(m => m.trim() !== '');
    
    setTeam({
      name: regName || 'Player One Team',
      size: regSize,
      theme: regTheme,
      customThemeName: regTheme === 'custom' ? regCustomTheme || 'Retro Gamers' : '',
      members: validMembers.length > 0 ? validMembers : ['Player 1'],
      score: 100, // starting coins
      currentPubIndex: 0,
      pubUnlocked: false,
      challengeCompleted: false,
      quizAnswers: {},
      photos: {}
    });
  };

  // Check in at Pub
  const handleCheckin = () => {
    if (!team) return;
    const currentPub = config.pubs[team.currentPubIndex];
    
    if (checkinCode.trim().toUpperCase() === currentPub.passcode.toUpperCase()) {
      sfx.playPowerUp();
      triggerCoinShower();
      setTeam({
        ...team,
        pubUnlocked: true,
        score: team.score + 50
      });
      setCheckinCode('');
    } else {
      sfx.playError();
      setErrorShake(true);
      setTimeout(() => setErrorShake(false), 600);
    }
  };

  // Verify text challenge answer
  const handleVerifyChallengeAnswer = () => {
    if (!team) return;
    const currentPub = config.pubs[team.currentPubIndex];
    if (textChallengeAnswer.trim().toLowerCase() === currentPub.triviaAnswer?.trim().toLowerCase()) {
      sfx.playCoin();
      triggerCoinShower();
      setTeam({
        ...team,
        challengeCompleted: true,
        score: team.score + 100
      });
      setTextChallengeAnswer('');
    } else {
      sfx.playError();
      setErrorShake(true);
      setTimeout(() => setErrorShake(false), 600);
    }
  };

  // Advance to next pub
  const handleNextPub = () => {
    if (!team) return;
    sfx.playPowerUp();
    setTeam({
      ...team,
      currentPubIndex: team.currentPubIndex + 1,
      pubUnlocked: false,
      challengeCompleted: false
    });
    setTextChallengeAnswer('');
  };

  // Reset Game completely
  const handleResetGame = () => {
    if (confirm('Are you sure you want to reset all team progress?')) {
      sfx.playError();
      setTeam(null);
      setActiveTab('quest');
    }
  };

  // Calculate theme class
  const getThemeClass = () => {
    if (!team) return 'theme-custom';
    return `theme-${team.theme}`;
  };

  const getThemeColorGlow = () => {
    if (!team) return '#aa3bff';
    switch (team.theme) {
      case 'mario': return '#ff2222';
      case 'zelda': return '#00ff44';
      case 'rdr': return '#b22222';
      case 'portal': return '#00bfff';
      default: return '#f00ff0';
    }
  };

  // Save customized config in Admin panel
  const handleSaveAdminConfig = () => {
    const newConfig = {
      pubs: adminPubs,
      quizQuestions: adminQuiz,
      hostCode: adminPasscode
    };
    setConfig(newConfig);
    localStorage.setItem('pubhunt_config', JSON.stringify(newConfig));
    sfx.playPowerUp();
    
    // Generate Share URL link
    const dataString = btoa(JSON.stringify(newConfig));
    const shareUrl = `${window.location.origin}${window.location.pathname}?join=${encodeURIComponent(dataString)}`;
    setShareConfigString(shareUrl);
    alert('Config Saved! Share link generated below.');
  };

  // Load admin edit screen values
  const unlockAdmin = () => {
    if (adminCodeInput === config.hostCode) {
      sfx.playPowerUp();
      setAdminUnlocked(true);
      setAdminPubs([...config.pubs]);
      setAdminQuiz([...config.quizQuestions]);
      setAdminPasscode(config.hostCode);
      
      const dataString = btoa(JSON.stringify(config));
      setShareConfigString(`${window.location.origin}${window.location.pathname}?join=${encodeURIComponent(dataString)}`);
    } else {
      sfx.playError();
      alert('Incorrect host access key!');
    }
  };

  // Auto grade quiz answers
  const handleQuizAnswerSelect = (qId: number, val: string) => {
    if (!team) return;
    const isFirstTime = !team.quizAnswers[qId];
    
    const updatedAnswers = { ...team.quizAnswers, [qId]: val };
    
    // Grade it immediately
    const question = config.quizQuestions.find(q => q.id === qId);
    let scoreDelta = 0;
    if (question && question.answer.toLowerCase() === val.toLowerCase()) {
      sfx.playSuccess();
      triggerCoinShower();
      if (isFirstTime) scoreDelta = 30; // award 30 coins for first-try correct answer
    } else {
      sfx.playError();
    }

    setTeam({
      ...team,
      quizAnswers: updatedAnswers,
      score: team.score + scoreDelta
    });
  };

  return (
    <div className={`phone-wrapper ${getThemeClass()} slide-up-anim`}>
      {/* Scanline Overlay */}
      <div className="crt-overlay" />

      {/* Floating Coin particles */}
      {coins.map(c => (
        <div 
          key={c.id} 
          className="coin-particle" 
          style={{ left: `${c.left}%`, animationDelay: `${c.delay}s` }}
        />
      ))}

      {/* Header bar */}
      <header style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-glass)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(9, 9, 14, 0.9)',
        zIndex: 50
      }}>
        <div 
          onClick={handleLogoTap}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
        >
          <Gamepad2 size={24} className="glow-text" style={{ color: 'var(--primary)' }} />
          <span style={{ 
            fontFamily: 'var(--font-mono)', 
            fontWeight: 900, 
            fontSize: '16px',
            color: 'var(--text-primary)'
          }}>
            PUB<span style={{ color: 'var(--primary)' }} className="glow-text">HUNT</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => setMuted(!muted)} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--text-secondary)', 
              cursor: 'pointer' 
            }}
          >
            {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>

          {team && (
            <div style={{
              background: 'rgba(255, 215, 0, 0.15)',
              border: '1px solid #ffd700',
              borderRadius: '20px',
              padding: '4px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              color: '#ffd700',
              fontFamily: 'var(--font-mono)'
            }}>
              <span>🪙</span>
              <span>{team.score}</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        paddingBottom: '40px'
      }}>
        {showAdmin ? (
          // ==========================================
          // ADMIN SCREEN VIEWER
          // ==========================================
          <div className="glass-panel scale-up-anim" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="glow-text" style={{ color: 'var(--primary)', fontSize: '18px' }}>Admin Panel</h2>
              <button onClick={() => setShowAdmin(false)} className="btn" style={{ padding: '6px 10px', borderRadius: '8px' }}><X size={16}/></button>
            </div>

            {!adminUnlocked ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Enter Host access key to customize the pub crawl, add clues, or create questions.
                </p>
                <input 
                  type="password" 
                  className="glass-input" 
                  placeholder="Access Code (Default: SHEFFIELD1889)"
                  value={adminCodeInput}
                  onChange={(e) => setAdminCodeInput(e.target.value)}
                />
                <button className="btn btn-primary" onClick={unlockAdmin}>Unlock Host Config</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '560px', overflowY: 'auto', paddingRight: '4px' }}>
                <div>
                  <h3 style={{ fontSize: '13px', color: 'var(--secondary)', marginBottom: '8px' }}>Security Key</h3>
                  <input 
                    type="text" 
                    className="glass-input" 
                    value={adminPasscode}
                    onChange={(e) => setAdminPasscode(e.target.value)}
                  />
                </div>

                <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h3 style={{ fontSize: '14px', color: 'var(--secondary)' }}>Pub Hunt Route (3 Pubs)</h3>
                  </div>

                  {adminPubs.map((pub, idx) => (
                    <div key={pub.id} className="glass-panel" style={{ background: 'rgba(0,0,0,0.3)', marginBottom: '12px', padding: '12px' }}>
                      <h4 style={{ fontSize: '12px', color: 'var(--primary)', marginBottom: '8px' }}>Pub {idx + 1}</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <input 
                          type="text" 
                          className="glass-input" 
                          placeholder="Pub Name"
                          value={pub.name}
                          onChange={(e) => {
                            const newPubs = [...adminPubs];
                            newPubs[idx].name = e.target.value;
                            setAdminPubs(newPubs);
                          }}
                        />
                        <textarea 
                          rows={2}
                          className="glass-input" 
                          placeholder="Clue to find this pub"
                          value={pub.clue}
                          onChange={(e) => {
                            const newPubs = [...adminPubs];
                            newPubs[idx].clue = e.target.value;
                            setAdminPubs(newPubs);
                          }}
                        />
                        <input 
                          type="text" 
                          className="glass-input" 
                          placeholder="Check-in PIN/Code"
                          value={pub.passcode}
                          onChange={(e) => {
                            const newPubs = [...adminPubs];
                            newPubs[idx].passcode = e.target.value;
                            setAdminPubs(newPubs);
                          }}
                        />
                        <textarea 
                          rows={2}
                          className="glass-input" 
                          placeholder="Challenge Question / Goal"
                          value={pub.challenge}
                          onChange={(e) => {
                            const newPubs = [...adminPubs];
                            newPubs[idx].challenge = e.target.value;
                            setAdminPubs(newPubs);
                          }}
                        />
                        {pub.challengeType !== 'photo' && (
                          <input 
                            type="text" 
                            className="glass-input" 
                            placeholder="Challenge Correct Answer (lowercase)"
                            value={pub.triviaAnswer || ''}
                            onChange={(e) => {
                              const newPubs = [...adminPubs];
                              newPubs[idx].triviaAnswer = e.target.value;
                              setAdminPubs(newPubs);
                            }}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '12px' }}>
                  <h3 style={{ fontSize: '14px', color: 'var(--secondary)', marginBottom: '10px' }}>Trivia Quiz Customizer</h3>
                  {adminQuiz.map((q, idx) => (
                    <div key={q.id} className="glass-panel" style={{ background: 'rgba(0,0,0,0.3)', marginBottom: '12px', padding: '12px' }}>
                      <h4 style={{ fontSize: '12px', color: 'var(--primary)', marginBottom: '6px' }}>Round {q.round} - Q{idx + 1}</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <input 
                          type="text" 
                          className="glass-input" 
                          placeholder="Question text"
                          value={q.question}
                          onChange={(e) => {
                            const newQuiz = [...adminQuiz];
                            newQuiz[idx].question = e.target.value;
                            setAdminQuiz(newQuiz);
                          }}
                        />
                        {q.options && (
                          <input 
                            type="text" 
                            className="glass-input" 
                            placeholder="Comma separated options"
                            value={q.options.join(',')}
                            onChange={(e) => {
                              const newQuiz = [...adminQuiz];
                              newQuiz[idx].options = e.target.value.split(',').map(s => s.trim());
                              setAdminQuiz(newQuiz);
                            }}
                          />
                        )}
                        <input 
                          type="text" 
                          className="glass-input" 
                          placeholder="Correct Answer"
                          value={q.answer}
                          onChange={(e) => {
                            const newQuiz = [...adminQuiz];
                            newQuiz[idx].answer = e.target.value;
                            setAdminQuiz(newQuiz);
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button className="btn btn-primary" onClick={handleSaveAdminConfig}>Save Configuration</button>

                {shareConfigString && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-glass)', paddingTop: '12px' }}>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Share this URL with other teams. Scanning or tapping it configures their phone automatically!</p>
                    <textarea 
                      rows={4}
                      readOnly
                      className="glass-input"
                      value={shareConfigString}
                      style={{ fontSize: '10px', fontFamily: 'monospace' }}
                      onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                    />
                    <button className="btn btn-secondary" onClick={() => {
                      navigator.clipboard.writeText(shareConfigString);
                      sfx.playCoin();
                      alert('Copied link to clipboard!');
                    }}>Copy Share Link</button>

                    {/* QR Code image simulation from Google/API */}
                    <div style={{ textAlign: 'center', marginTop: '10px' }}>
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&color=${getThemeColorGlow().substring(1)}&bgcolor=09090e&data=${encodeURIComponent(shareConfigString)}`} 
                        alt="Join Config QR" 
                        style={{ border: '2px solid var(--primary)', borderRadius: '12px', padding: '8px', background: '#09090e' }}
                      />
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Teams can scan this QR code to load settings.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : !team ? (
          // ==========================================
          // WELCOME SCREEN (REGISTRATION)
          // ==========================================
          <form onSubmit={handleRegister} className="glass-panel scale-up-anim" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '16px' 
          }}>
            <div style={{ textAlign: 'center', margin: '10px 0' }}>
              <div style={{ 
                background: 'rgba(170, 59, 255, 0.1)', 
                width: '60px', 
                height: '60px', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto 12px',
                border: '1px solid var(--primary)',
                boxShadow: 'var(--shadow-neon)'
              }}>
                <Beer size={30} style={{ color: 'var(--primary)' }} />
              </div>
              <h1 className="glow-text" style={{ fontSize: '20px', color: 'var(--text-primary)' }}>PUB HUNT 2026</h1>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Sheffield - Modern Mobile Edition</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>Team Name</label>
              <input 
                type="text" 
                required 
                className="glass-input" 
                placeholder="e.g. Bowser's Beermasters"
                value={regName}
                onChange={e => setRegName(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>Team Size</label>
                <select 
                  className="glass-input" 
                  style={{ background: '#0e0e18' }}
                  value={regSize}
                  onChange={e => setRegSize(Number(e.target.value))}
                >
                  {[2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s} Players</option>)}
                </select>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>Select Game Theme</label>
                <select 
                  className="glass-input" 
                  style={{ background: '#0e0e18' }}
                  value={regTheme}
                  onChange={e => setRegTheme(e.target.value as any)}
                >
                  <option value="custom">Custom Theme</option>
                  <option value="mario">Super Mario</option>
                  <option value="zelda">Legend of Zelda</option>
                  <option value="rdr">Red Dead Redemption</option>
                  <option value="portal">Portal</option>
                </select>
              </div>
            </div>

            {regTheme === 'custom' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>Custom Game Theme Name</label>
                <input 
                  type="text" 
                  required 
                  className="glass-input" 
                  placeholder="e.g. Minecraft Miners"
                  value={regCustomTheme}
                  onChange={e => setRegCustomTheme(e.target.value)}
                />
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>Team Members</label>
              {regMembers.map((member, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    required={idx < 2}
                    className="glass-input" 
                    placeholder={`Player ${idx + 1} Name`}
                    value={member}
                    onChange={e => {
                      const updated = [...regMembers];
                      updated[idx] = e.target.value;
                      setRegMembers(updated);
                    }}
                  />
                  {regMembers.length > 2 && (
                    <button 
                      type="button"
                      className="btn" 
                      style={{ padding: '0 12px', borderColor: 'rgba(255,0,0,0.3)' }}
                      onClick={() => {
                        sfx.playClick();
                        setRegMembers(regMembers.filter((_, i) => i !== idx));
                      }}
                    >
                      <Trash2 size={16} style={{ color: '#ff4444' }} />
                    </button>
                  )}
                </div>
              ))}
              
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ padding: '8px 12px', fontSize: '12px', display: 'flex', justifyContent: 'center', gap: '6px' }}
                onClick={() => {
                  sfx.playClick();
                  setRegMembers([...regMembers, '']);
                }}
              >
                <Plus size={14}/> Add Member
              </button>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
              Start Hunt <Sparkles size={16} />
            </button>

            <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '4px' }}>
              💡 Secret Host Config: Tap the top-left controller icon 5 times!
            </p>
          </form>
        ) : (
          // ==========================================
          // ACTIVE GAME INTERFACE (TABS)
          // ==========================================
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="scale-up-anim">
            
            {/* Team HUD Status Card */}
            <div className="glass-panel" style={{ 
              background: 'linear-gradient(135deg, rgba(20,20,35,0.8), rgba(10,10,20,0.9))', 
              borderLeft: '4px solid var(--primary)',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '2px' }}>{team.name}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--secondary)' }}>
                    <Users size={12} />
                    <span>{team.members.length} players • Theme: {team.theme === 'custom' ? team.customThemeName : team.theme.toUpperCase()}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>PROGRESS</span>
                  <span style={{ fontSize: '14px', color: 'var(--primary)', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>
                    {team.currentPubIndex === config.pubs.length ? 'COMPLETED!' : `PUB ${team.currentPubIndex + 1}/3`}
                  </span>
                </div>
              </div>
            </div>

            {/* Content Tabs */}
            {activeTab === 'quest' && (
              <div className="slide-up-anim" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {team.currentPubIndex === config.pubs.length ? (
                  // COMPLETE CRAWL VIEW
                  <div className="glass-panel" style={{ textAlign: 'center', padding: '30px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <Award size={64} style={{ color: 'var(--secondary)', margin: '0 auto', filter: 'drop-shadow(0 0 10px var(--secondary-glow))' }} />
                    <h2 className="glow-text-secondary" style={{ color: 'var(--secondary)' }}>Game Finished!</h2>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      Amazing work! Your team completed the Sheffield Pub Hunt and explored all three locations in costume.
                    </p>
                    
                    <div style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: '12px',
                      padding: '16px',
                      fontSize: '14px',
                      textAlign: 'left'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span>Final Coin Score:</span>
                        <strong style={{ color: '#ffd700' }}>🪙 {team.score}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span>Pubs Visited:</span>
                        <strong>3 / 3</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Photos Saved:</span>
                        <strong>{Object.keys(team.photos).length} Photos</strong>
                      </div>
                    </div>

                    <button className="btn btn-secondary" onClick={() => setActiveTab('scrapbook')}>View Team Scrapbook</button>
                    <button className="btn btn-primary" onClick={handleResetGame} style={{ background: '#aa2222', borderColor: '#ff4444' }}>Restart Game</button>
                  </div>
                ) : (
                  // CRAWL IN PROGRESS
                  <>
                    {/* Visual 3-node timeline */}
                    <div className="glass-panel" style={{ padding: '12px 20px' }}>
                      <div className="progress-steps">
                        <div className="progress-line">
                          <div 
                            className="progress-line-fill" 
                            style={{ width: `${(team.currentPubIndex / (config.pubs.length - 1)) * 100}%` }}
                          />
                        </div>
                        {config.pubs.map((p, idx) => {
                          let stateClass = '';
                          if (idx < team.currentPubIndex) stateClass = 'completed';
                          else if (idx === team.currentPubIndex) stateClass = 'active';
                          
                          return (
                            <div key={p.id} className={`step-node ${stateClass}`}>
                              {idx < team.currentPubIndex ? '✓' : idx + 1}
                            </div>
                          );
                        })}
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>
                        {team.currentPubIndex === 0 ? 'Find Pub 1 to begin the crawl' : `Target: Pub ${team.currentPubIndex + 1}`}
                      </p>
                    </div>

                    {/* Active Pub Card */}
                    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <MapPin size={24} style={{ color: 'var(--primary)' }} />
                        <h3 style={{ fontSize: '15px', color: 'var(--text-primary)' }}>
                          {team.pubUnlocked ? config.pubs[team.currentPubIndex].name : `Find Pub ${team.currentPubIndex + 1}`}
                        </h3>
                      </div>

                      {!team.pubUnlocked ? (
                        // LOCKED VIEW (MUST FIND PUB)
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} className={errorShake ? 'shake-anim' : ''}>
                          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                            <strong style={{ color: 'var(--primary)' }}>Clue:</strong> {config.pubs[team.currentPubIndex].clue}
                          </p>

                          <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '12px' }}>
                            <label style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                              ENTER PUB CHECK-IN PIN
                            </label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <input 
                                type="text"
                                className="glass-input"
                                placeholder="PIN Code on the bar counter..."
                                value={checkinCode}
                                onChange={e => setCheckinCode(e.target.value)}
                                style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}
                              />
                              <button className="btn btn-primary" onClick={handleCheckin}>Check in</button>
                            </div>
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                              *(Demo PIN for this pub: <code style={{ fontSize: '9px' }}>{config.pubs[team.currentPubIndex].passcode}</code>)
                            </span>
                          </div>
                        </div>
                      ) : (
                        // UNLOCKED VIEW (PUB CHALLENGE)
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ 
                            background: 'rgba(0, 255, 0, 0.05)', 
                            border: '1px solid rgba(0, 255, 0, 0.2)',
                            borderRadius: '10px',
                            padding: '10px',
                            fontSize: '12px',
                            color: '#00ff66',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <Check size={16} /> Checked in! +50 Points
                          </div>

                          <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '10px' }}>
                            <h4 style={{ fontSize: '13px', color: 'var(--secondary)', marginBottom: '6px' }}>🏆 Pub Challenge</h4>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.4' }}>
                              {config.pubs[team.currentPubIndex].challenge}
                            </p>

                            {!team.challengeCompleted ? (
                              // CHALLENGE FORM
                              config.pubs[team.currentPubIndex].challengeType === 'photo' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                  <div style={{ 
                                    border: '2px dashed var(--border-glass)', 
                                    borderRadius: '12px', 
                                    padding: '24px 10px', 
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    position: 'relative'
                                  }}>
                                    <input 
                                      type="file" 
                                      accept="image/*" 
                                      capture="environment" 
                                      onChange={(e) => handlePhotoUpload(e, config.pubs[team.currentPubIndex].id)}
                                      style={{
                                        position: 'absolute',
                                        inset: 0,
                                        opacity: 0,
                                        cursor: 'pointer'
                                      }}
                                    />
                                    <Camera size={32} style={{ color: 'var(--secondary)', marginBottom: '8px' }} />
                                    <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                      Tap to open Camera / Upload Photo
                                    </span>
                                  </div>
                                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
                                    Your photo will be optimized & added to your completion Scrapbook page!
                                  </p>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} className={errorShake ? 'shake-anim' : ''}>
                                  <input 
                                    type="text" 
                                    className="glass-input" 
                                    placeholder="Enter your answer..."
                                    value={textChallengeAnswer}
                                    onChange={e => setTextChallengeAnswer(e.target.value)}
                                  />
                                  <button className="btn btn-primary" onClick={handleVerifyChallengeAnswer}>Verify Answer</button>
                                  {config.pubs[team.currentPubIndex].triviaAnswer && (
                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                      *(Demo Answer: <code style={{ fontSize: '9px' }}>{config.pubs[team.currentPubIndex].triviaAnswer}</code>)
                                    </span>
                                  )}
                                </div>
                              )
                            ) : (
                              // COMPLETED CHALLENGE
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ 
                                  background: 'rgba(0, 255, 0, 0.1)', 
                                  border: '1px solid #00ff66',
                                  borderRadius: '10px',
                                  padding: '10px',
                                  fontSize: '12px',
                                  color: '#00ff66',
                                  textAlign: 'center',
                                  fontWeight: 'bold'
                                }}>
                                  🎉 Challenge Solved! +100 Points
                                </div>

                                <div style={{ 
                                  background: 'rgba(255, 255, 255, 0.02)', 
                                  border: '1px solid var(--border-glass)',
                                  borderRadius: '10px',
                                  padding: '12px',
                                  fontSize: '12px'
                                }}>
                                  <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>Clue to Pub {team.currentPubIndex + 2}:</strong>
                                  <span style={{ color: 'var(--text-secondary)' }}>{config.pubs[team.currentPubIndex].riddleForNext}</span>
                                </div>

                                <button className="btn btn-primary" onClick={handleNextPub} style={{ marginTop: '6px' }}>
                                  Next Pub <ArrowRight size={16} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'quiz' && (
              <div className="slide-up-anim" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '14px', color: 'var(--primary)' }} className="glow-text">🎮 Live Quiz Sheet</h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Correct: +30 Coins each
                  </span>
                </div>

                {/* Group quiz questions by rounds */}
                {[1, 2, 3].map((round) => {
                  const roundQs = config.quizQuestions.filter(q => q.round === round);
                  
                  return (
                    <div key={round} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <h4 style={{ fontSize: '12px', color: 'var(--secondary)', borderBottom: '1px solid var(--border-glass)', paddingBottom: '6px' }}>
                        Round {round}: {round === 1 ? 'Video Game Trivia' : round === 2 ? 'Sheffield Local Knowledge' : 'Pub & Beer Lore'}
                      </h4>

                      {roundQs.map((q) => {
                        const userAns = team.quizAnswers[q.id];
                        const isCorrect = userAns && userAns.toLowerCase() === q.answer.toLowerCase();

                        return (
                          <div key={q.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '6px 0' }}>
                            <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                              {q.question}
                            </p>

                            {q.options ? (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                                {q.options.map((opt) => {
                                  const isSelected = userAns === opt;
                                  let optStyle: React.CSSProperties = {};
                                  if (isSelected) {
                                    optStyle = isCorrect 
                                      ? { borderColor: '#00ff66', background: 'rgba(0, 255, 102, 0.1)', color: '#00ff66' }
                                      : { borderColor: '#ff4444', background: 'rgba(255, 68, 68, 0.1)', color: '#ff4444' };
                                  }
                                  return (
                                    <button 
                                      key={opt}
                                      disabled={!!userAns}
                                      onClick={() => handleQuizAnswerSelect(q.id, opt)}
                                      className="btn"
                                      style={{ 
                                        padding: '8px 10px', 
                                        fontSize: '12px', 
                                        borderRadius: '8px',
                                        ...optStyle 
                                      }}
                                    >
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              // TEXT INPUT FOR OPEN ENDED
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <input 
                                  type="text"
                                  disabled={!!userAns}
                                  className="glass-input"
                                  placeholder="Type answer here..."
                                  style={{ padding: '8px 12px', fontSize: '12px' }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleQuizAnswerSelect(q.id, (e.target as HTMLInputElement).value);
                                    }
                                  }}
                                />
                                {userAns && (
                                  <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    width: '38px',
                                    height: '38px',
                                    borderRadius: '10px',
                                    background: isCorrect ? 'rgba(0,255,0,0.1)' : 'rgba(255,0,0,0.1)',
                                    border: `1px solid ${isCorrect ? '#00ff66' : '#ff4444'}`
                                  }}>
                                    {isCorrect ? <Check size={18} style={{ color: '#00ff66' }} /> : <X size={18} style={{ color: '#ff4444' }} />}
                                  </div>
                                )}
                              </div>
                            )}

                            {userAns && (
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                Your Answer: {userAns} | {isCorrect ? 'Correct (+30 Coins)' : `Incorrect (Correct: ${q.answer})`}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'scrapbook' && (
              <div className="slide-up-anim" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '14px', color: 'var(--primary)' }} className="glow-text">📸 Team Scrapbook</h3>
                  <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '10px' }} onClick={handleResetGame}>
                    Reset Team
                  </button>
                </div>

                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <Gamepad2 size={30} style={{ color: 'var(--primary)' }} />
                    <div>
                      <h4 style={{ fontSize: '13px' }}>{team.name}</h4>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        Theme Character Costume: {team.theme === 'custom' ? team.customThemeName : team.theme}
                      </p>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span>Total Coins: <strong style={{ color: '#ffd700' }}>🪙 {team.score}</strong></span>
                    <span>Members: {team.members.join(', ')}</span>
                  </div>
                </div>

                {Object.keys(team.photos).length === 0 ? (
                  <div className="glass-panel" style={{ textAlign: 'center', padding: '30px 10px', borderStyle: 'dashed' }}>
                    <Camera size={32} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      No photos uploaded yet! Find Pub 2 to take your first game costume photo!
                    </p>
                  </div>
                ) : (
                  <div className="scrapbook-grid">
                    {Object.entries(team.photos).map(([pubId, imgStr]) => {
                      const pub = config.pubs.find(p => p.id === Number(pubId));
                      return (
                        <div key={pubId} className="scrapbook-card">
                          <img src={imgStr} alt={pub?.name || 'Pub photo'} />
                          <div className="scrapbook-card-caption">
                            {pub?.name || `Pub ${pubId}`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }}>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
                    Show this screen to the Host at the final pub to verify your achievements!
                  </p>
                </div>
              </div>
            )}
            
          </div>
        )}
      </main>

      {/* Navigation tabs footer */}
      {team && !showAdmin && (
        <nav className="nav-tabs">
          <button 
            className={`nav-tab-btn ${activeTab === 'quest' ? 'active' : ''}`}
            onClick={() => { sfx.playClick(); setActiveTab('quest'); }}
          >
            <MapPin size={20} />
            <span>Quest</span>
          </button>
          
          <button 
            className={`nav-tab-btn ${activeTab === 'quiz' ? 'active' : ''}`}
            onClick={() => { sfx.playClick(); setActiveTab('quiz'); }}
          >
            <Gamepad2 size={20} />
            <span>Live Quiz</span>
          </button>
          
          <button 
            className={`nav-tab-btn ${activeTab === 'scrapbook' ? 'active' : ''}`}
            onClick={() => { sfx.playClick(); setActiveTab('scrapbook'); }}
          >
            <Camera size={20} />
            <span>Scrapbook</span>
          </button>
        </nav>
      )}
    </div>
  );
}
