import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppLayout from '../../shared/components/layout/AppLayout.jsx';
import useAuthStore from '../../shared/store/authStore.js';
import ThemeToggle from '../../shared/components/ui/ThemeToggle.jsx';

const GAMES = [
  {
    id: 'word_duel',
    name: 'Word Duel',
    subtitle: 'Anagram Sprint',
    description: 'Same 7 letters. 20 seconds. Highest score wins the round. Best of 3 takes the match.',
    category: 'Skill Duels',
    icon: '🔤',
    difficulty: 'Medium',
    color: '#00E37A',
    bgGradient: 'linear-gradient(135deg, rgba(0, 227, 122, 0.15) 0%, rgba(10, 13, 18, 0) 100%)'
  },
  {
    id: 'math_duel',
    name: 'Math Duel',
    subtitle: 'Arithmetic Blitz',
    description: 'Rapid mental math battle. Solve arithmetic equations under time pressure.',
    category: 'Skill Duels',
    icon: '🔢',
    difficulty: 'Hard',
    color: '#5B8DEF',
    bgGradient: 'linear-gradient(135deg, rgba(91, 141, 239, 0.15) 0%, rgba(10, 13, 18, 0) 100%)'
  },
  {
    id: 'reaction_race',
    name: 'Reaction Race',
    subtitle: 'Speed Reflex',
    description: 'Instant reaction test. Tap as fast as you can when the cue appears.',
    category: 'Skill Duels',
    icon: '⚡',
    difficulty: 'Easy',
    color: '#fbbf24',
    bgGradient: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(10, 13, 18, 0) 100%)'
  },
  {
    id: 'lucky_wheel',
    name: 'Lucky Wheel',
    subtitle: 'Spin & Win',
    description: 'Spin the fortune wheel. Predict where the wheel lands to win multipliers.',
    category: 'Chance',
    icon: '🎡',
    difficulty: 'Easy',
    color: '#8b5cf6',
    bgGradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(10, 13, 18, 0) 100%)'
  },
  {
    id: 'lucky_balls',
    name: 'Lucky Balls',
    subtitle: 'Lotto Draw',
    description: 'Fast lotto draw game. Pick your numbers and match them for payouts.',
    category: 'Chance',
    icon: '🎱',
    difficulty: 'Easy',
    color: '#f97316',
    bgGradient: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(10, 13, 18, 0) 100%)'
  },
  {
    id: 'blackjack',
    name: 'Blackjack',
    subtitle: '21 Battle',
    description: 'Classic heads-up Blackjack. Get closer to 21 than your opponent without busting.',
    category: 'Card Games',
    icon: '🃏',
    difficulty: 'Medium',
    color: '#ef4444',
    bgGradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(10, 13, 18, 0) 100%)'
  },
  {
    id: 'holdem_poker',
    name: 'Heads-Up Poker',
    subtitle: 'Texas Hold\'em',
    description: 'Speed Texas Hold\'em poker. Best 5-card hand wins the pot.',
    category: 'Card Games',
    icon: '💵',
    difficulty: 'Hard',
    color: '#10b981',
    bgGradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(10, 13, 18, 0) 100%)'
  },
  {
    id: 'baccarat',
    name: 'Baccarat',
    subtitle: 'Player vs Banker',
    description: 'Compare player and banker hands. Predict the winning side.',
    category: 'Card Games',
    icon: '💎',
    difficulty: 'Medium',
    color: '#a855f7',
    bgGradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(10, 13, 18, 0) 100%)'
  },
  {
    id: 'casino_war',
    name: 'Casino War',
    subtitle: 'High Card Duel',
    description: 'The simplest card game. Draw the higher card to win.',
    category: 'Card Games',
    icon: '⚔️',
    difficulty: 'Easy',
    color: '#ec4899',
    bgGradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(10, 13, 18, 0) 100%)'
  },
  {
    id: 'red_dog',
    name: 'Red Dog',
    subtitle: 'In-Between Bet',
    description: 'Bet on whether the third card falls between the first two cards.',
    category: 'Card Games',
    icon: '🐕',
    difficulty: 'Medium',
    color: '#f43f5e',
    bgGradient: 'linear-gradient(135deg, rgba(244, 63, 94, 0.15) 0%, rgba(10, 13, 18, 0) 100%)'
  },
  {
    id: 'pai_gow',
    name: 'Pai Gow Poker',
    subtitle: 'Two-Hand Strategy',
    description: 'Split your 7 cards into a 5-card hand and a 2-card hand.',
    category: 'Card Games',
    icon: '🧧',
    difficulty: 'Hard',
    color: '#e11d48',
    bgGradient: 'linear-gradient(135deg, rgba(225, 29, 72, 0.15) 0%, rgba(10, 13, 18, 0) 100%)'
  },
  {
    id: 'three_card',
    name: 'Three Card Poker',
    subtitle: 'Fast Tri-Card',
    description: 'Quick poker variation using three cards.',
    category: 'Card Games',
    icon: '🔺',
    difficulty: 'Medium',
    color: '#d97706',
    bgGradient: 'linear-gradient(135deg, rgba(217, 119, 6, 0.15) 0%, rgba(10, 13, 18, 0) 100%)'
  },
  {
    id: 'video_poker',
    name: 'Video Poker',
    subtitle: 'Draw Poker',
    description: 'Classic five-card draw poker machine rules.',
    category: 'Card Games',
    icon: '📺',
    difficulty: 'Medium',
    color: '#2563eb',
    bgGradient: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(10, 13, 18, 0) 100%)'
  }
];

const CATEGORIES = ['All', 'Skill Duels', 'Card Games', 'Chance'];

export default function GamesPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const handlePlayGame = (gameId) => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/lobby&game=${gameId}`);
    } else {
      navigate(`/lobby?game=${gameId}`);
    }
  };

  const filteredGames = GAMES.filter((game) => {
    const matchesTab = activeTab === 'All' || game.category === activeTab;
    const matchesSearch = game.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          game.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const pageContent = (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '0.5rem 0.25rem 5rem' }}>
      
      <div style={{ padding: '1rem 0.25rem', textAlign: 'left' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🎮 iDubbl Casino Lobby
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
          USDT skill duels & tables. Choose a lobby to challenge opponents.
        </p>
      </div>

      {/* Search & Categories Bar (Stake Lobby Interface) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0 0.25rem', marginBottom: '1.25rem' }}>
        
        {/* Search */}
        <div style={{ position: 'relative', width: '100%' }}>
          <input
            type="text"
            placeholder="Search game..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 1rem 0.75rem 2.5rem',
              background: 'var(--bg-dark)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
          />
          <span style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: '0.95rem', color: 'var(--text-secondary)' }}>🔍</span>
        </div>

        {/* Scrollable category tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '0.4rem', 
          overflowX: 'auto', 
          paddingBottom: '0.5rem',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          {CATEGORIES.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  background: isActive ? 'var(--primary-glow)' : 'var(--bg-card)',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  border: isActive ? '1px solid var(--primary)' : '1px solid var(--border)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Responsive Stake-like grid (exactly 2 columns on mobile, 3 on tablet, 4 on desktop) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))',
        gap: '0.75rem',
        padding: '0 0.25rem'
      }}>
        {filteredGames.map((game) => (
          <div
            key={game.id}
            onClick={() => handlePlayGame(game.id)}
            style={{
              background: 'var(--bg-card)',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-card, 0 4px 12px rgba(0,0,0,0.03))',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.borderColor = game.color;
              e.currentTarget.style.boxShadow = `0 12px 24px ${game.color}25, 0 4px 8px rgba(0,0,0,0.05)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.boxShadow = 'var(--shadow-card, 0 4px 12px rgba(0,0,0,0.03))';
            }}
          >
            {/* Visual Icon Section (Glassmorphic thumbnail container) */}
            <div style={{
              height: '115px',
              background: game.bgGradient || 'var(--glass-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              borderBottom: '1px solid var(--border)',
            }}>
              {/* Floating Game Icon with shadow */}
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'var(--bg-dark)',
                border: '1.5px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                fontSize: '2.2rem',
              }}>
                {game.icon}
              </div>
              
              {/* Difficulty badge */}
              <span style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                fontSize: '0.55rem',
                fontWeight: 800,
                letterSpacing: '0.5px',
                padding: '0.15rem 0.4rem',
                borderRadius: '4px',
                background: 'var(--bg-darker)',
                color: game.color,
                border: `1px solid ${game.color}40`,
                textTransform: 'uppercase'
              }}>
                {game.difficulty}
              </span>
            </div>

            {/* Info Section */}
            <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between', gap: '0.5rem' }}>
              <div>
                <p style={{
                  fontSize: '0.825rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  margin: 0
                }}>
                  {game.name}
                </p>
                <p style={{
                  fontSize: '0.65rem',
                  color: 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  marginTop: '0.15rem',
                  margin: 0
                }}>
                  {game.subtitle}
                </p>
              </div>

              {/* Play trigger indicator */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '0.5rem',
                borderTop: '1.5px solid var(--border)',
                fontSize: '0.65rem',
                color: game.color,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                <span>Play Duel</span>
                <span style={{ fontSize: '0.75rem', transition: 'transform 0.2s' }}>➔</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (isAuthenticated) {
    return <AppLayout>{pageContent}</AppLayout>;
  }

  // Not authenticated layout: render with simple header and footer to match landing page style
  return (
    <div className="app-container">
      <header className="header">
        <div className="header-container">
          <div className="logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
            <img className="logo-img" src="/black-logo.jpeg" alt="iDubbl" style={{ height: '40px', borderRadius: '8px' }} />
          </div>

          <nav className="nav-links" aria-label="Public navigation">
            <button className="nav-btn" onClick={() => navigate('/')}>Home</button>
            <button className="nav-btn active" onClick={() => navigate('/games')}>Games</button>
            <button className="nav-btn" onClick={() => navigate('/support')}>Support</button>
          </nav>

          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ThemeToggle />
            <button className="nav-btn" onClick={() => navigate('/login')}>Log in</button>
            <button className="btn-primary" onClick={() => navigate('/signup')} style={{ padding: '0.5rem 1.25rem' }}>Sign up</button>
          </div>
        </div>
      </header>

      <main style={{ padding: '1rem 0.25rem', minHeight: 'calc(100vh - 200px)' }}>
        {pageContent}
      </main>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '2.5rem 2rem', background: 'var(--bg-darker)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
          <img className="logo-img" src="/black-logo.jpeg" alt="iDubbl" style={{ height: '36px', borderRadius: '6px', opacity: 0.8 }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textAlign: 'center', lineHeight: 1.6 }}>
            © {new Date().getFullYear()} iDubbl · Skill gaming platform · USDT (TRC-20) only · All matches are skill-based
          </p>
        </div>
      </footer>
    </div>
  );
}
