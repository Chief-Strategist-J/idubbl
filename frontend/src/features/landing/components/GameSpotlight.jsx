import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const GAMES = [
  {
    id: 'word_duel',
    name: 'Word Duel',
    subtitle: 'Anagram Sprint',
    category: 'Skill Duels',
    difficulty: 'Medium',
    color: '#00E37A',
    imageUrl: 'https://images.unsplash.com/photo-1546776310-eef45dd6d63c?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'math_duel',
    name: 'Math Duel',
    subtitle: 'Arithmetic Blitz',
    category: 'Skill Duels',
    difficulty: 'Hard',
    color: '#5B8DEF',
    imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'reaction_race',
    name: 'Reaction Race',
    subtitle: 'Speed Reflex',
    category: 'Skill Duels',
    difficulty: 'Easy',
    color: '#fbbf24',
    imageUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'lucky_wheel',
    name: 'Lucky Wheel',
    subtitle: 'Spin & Win',
    category: 'Chance',
    difficulty: 'Easy',
    color: '#8b5cf6',
    imageUrl: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'lucky_balls',
    name: 'Lucky Balls',
    subtitle: 'Lotto Draw',
    category: 'Chance',
    difficulty: 'Easy',
    color: '#f97316',
    imageUrl: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'blackjack',
    name: 'Blackjack',
    subtitle: '21 Battle',
    category: 'Card Games',
    difficulty: 'Medium',
    color: '#ef4444',
    imageUrl: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'holdem_poker',
    name: 'Heads-Up Poker',
    subtitle: 'Texas Hold\'em',
    category: 'Card Games',
    difficulty: 'Hard',
    color: '#10b981',
    imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'baccarat',
    name: 'Baccarat',
    subtitle: 'Player vs Banker',
    category: 'Card Games',
    difficulty: 'Medium',
    color: '#a855f7',
    imageUrl: 'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'casino_war',
    name: 'Casino War',
    subtitle: 'High Card Duel',
    category: 'Card Games',
    difficulty: 'Easy',
    color: '#ec4899',
    imageUrl: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'red_dog',
    name: 'Red Dog',
    subtitle: 'In-Between Bet',
    category: 'Card Games',
    difficulty: 'Medium',
    color: '#f43f5e',
    imageUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'pai_gow',
    name: 'Pai Gow Poker',
    subtitle: 'Two-Hand Strategy',
    category: 'Card Games',
    difficulty: 'Hard',
    color: '#e11d48',
    imageUrl: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'three_card',
    name: 'Three Card Poker',
    subtitle: 'Fast Tri-Card',
    category: 'Card Games',
    difficulty: 'Medium',
    color: '#d97706',
    imageUrl: 'https://images.unsplash.com/photo-1533078420084-28ab16c873df?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'video_poker',
    name: 'Video Poker',
    subtitle: 'Draw Poker',
    category: 'Card Games',
    difficulty: 'Medium',
    color: '#2563eb',
    imageUrl: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=300&q=80'
  }
];

const CATEGORIES = ['All', 'Skill Duels', 'Card Games', 'Chance'];

export default function GameSpotlight() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('All');
  const scrollRef = React.useRef(null);

  const handlePlayGame = (gameId) => {
    navigate(`/login?redirect=/lobby&game=${gameId}`);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  const filteredGames = GAMES.filter((game) => activeTab === 'All' || game.category === activeTab);

  return (
    <section
      id="game-spotlight"
      style={{
        padding: '3rem 0.25rem 3rem',
        background: 'linear-gradient(180deg, var(--bg-dark) 0%, var(--bg-darker) 100%)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <style>{`
        .games-scroll-row::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem', padding: '0 0.5rem' }}>
          <span style={{
            display: 'inline-block',
            background: 'rgba(0,227,122,0.1)',
            border: '1px solid rgba(0,227,122,0.25)',
            color: 'var(--primary)',
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            padding: '0.35rem 0.9rem',
            borderRadius: 999,
            marginBottom: '1rem',
          }}>
            Game Library
          </span>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
            fontWeight: 800,
            marginBottom: '0.5rem',
            color: 'var(--text-primary)',
          }}>
            Explore All Playable Games
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: 500, margin: '0 auto' }}>
            Choose a duel, test your skill, and claim the pool. Log in to play live matches.
          </p>
        </div>

        {/* Categories navigation */}
        <div style={{ 
          display: 'flex', 
          gap: '0.4rem', 
          overflowX: 'auto', 
          paddingBottom: '0.75rem',
          marginBottom: '1.5rem',
          justifyContent: 'center',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}>
          {CATEGORIES.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                style={{
                  padding: '0.4rem 0.9rem',
                  borderRadius: '20px',
                  background: isActive ? 'var(--primary-glow)' : 'var(--bg-card)',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  border: isActive ? '1px solid var(--primary)' : '1px solid var(--border)',
                  fontSize: '0.75rem',
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

        {/* Swipeable Horizontal Scroll Row */}
        <div 
          ref={scrollRef}
          className="games-scroll-row"
          style={{
            display: 'flex',
            overflowX: 'auto',
            gap: '0.85rem',
            padding: '0.5rem 0.75rem 1.5rem',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            scrollSnapType: 'x mandatory'
          }}
        >
          {filteredGames.map((game) => (
            <div
              key={game.id}
              onClick={() => handlePlayGame(game.id)}
              style={{
                flex: '0 0 145px',
                scrollSnapAlign: 'start',
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
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = game.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              {/* Visual Icon Section (Full Card Background Image) */}
              <div style={{
                height: '115px',
                backgroundImage: `url(${game.imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
                borderBottom: '1px solid var(--border)',
              }}>
                {/* Subtle glass overlay for top-right badge contrast */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 100%)'
                }} />

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
                  background: 'rgba(10, 13, 18, 0.85)',
                  backdropFilter: 'blur(4px)',
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
                    fontSize: '0.8rem',
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
    </section>
  );
}
