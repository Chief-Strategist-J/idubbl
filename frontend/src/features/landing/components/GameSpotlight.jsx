import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const GAMES = [
  {
    id: 'word_duel',
    name: 'Word Duel',
    subtitle: 'Anagram Sprint',
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
    category: 'Card Games',
    icon: '📺',
    difficulty: 'Medium',
    color: '#2563eb',
    bgGradient: 'linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(10, 13, 18, 0) 100%)'
  }
];

const CATEGORIES = ['All', 'Skill Duels', 'Card Games', 'Chance'];

export default function GameSpotlight() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('All');

  const handlePlayGame = (gameId) => {
    navigate(`/login?redirect=/lobby&game=${gameId}`);
  };

  const filteredGames = GAMES.filter((game) => activeTab === 'All' || game.category === activeTab);

  return (
    <section
      id="game-spotlight"
      style={{
        padding: '3rem 0.25rem 4rem',
        background: 'linear-gradient(180deg, rgba(20,24,33,0) 0%, rgba(26,33,48,0.5) 100%)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
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
                onClick={() => setActiveTab(tab)}
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

        {/* Stake grid: 2 columns on mobile */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: '1rem',
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
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'var(--bg-dark)',
                  border: '1.5px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                  fontSize: '2rem',
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
