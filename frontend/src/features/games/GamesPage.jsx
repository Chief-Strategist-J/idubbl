import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../shared/components/layout/AppLayout.jsx';
import useAuthStore from '../../shared/store/authStore.js';
import usePlatformStore, { ALL_GAMES } from '../../shared/store/platformStore.js';
import ThemeToggle from '../../shared/components/ui/ThemeToggle.jsx';
import { GAME_META } from '../../shared/data/gameMeta.js';

const CATEGORIES = ['All', 'Board Games', 'Skill Duels', 'Card Games', 'Chance'];

// ─── Game Explainer Modal ─────────────────────────────────────────────────────
function GameExplainerModal({ game, meta, onClose, onPlay }) {
  const color = meta.color || '#00E37A';
  return (
    <div
      id="game-explainer-overlay"
      onClick={(e) => e.target.id === 'game-explainer-overlay' && onClose()}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        zIndex: 9999, backdropFilter: 'blur(6px)',
        animation: 'fadeIn 0.2s ease'
      }}
    >
      <div style={{
        background: 'var(--bg-card)',
        borderTop: `3px solid ${color}`,
        borderRadius: '20px 20px 0 0',
        width: '100%', maxWidth: 620,
        maxHeight: '85vh', overflowY: 'auto',
        padding: '1.75rem 1.5rem 2.5rem',
        boxShadow: '0 -12px 48px rgba(0,0,0,0.4)',
        animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
        {/* Handle bar */}
        <div style={{ width: 40, height: 4, background: 'var(--border)', borderRadius: 4, margin: '0 auto 1.25rem', opacity: 0.6 }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{
            width: 54, height: 54, borderRadius: 14, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.75rem', background: `${color}18`,
            border: `1.5px solid ${color}40`,
          }}>
            {meta.emoji || game.icon}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
              {game.icon} {game.name}
            </h2>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {meta.subtitle}
            </p>
          </div>
          <span style={{
            padding: '0.2rem 0.6rem', borderRadius: 6,
            fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px',
            background: `${color}18`, color, border: `1px solid ${color}40`, flexShrink: 0
          }}>
            {meta.difficulty}
          </span>
        </div>

        {/* Description */}
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: '0 0 1.5rem' }}>
          {meta.description}
        </p>

        {/* How to Play */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '0.75rem', fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem' }}>
            🎮 How to Play
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {(meta.howToPlay || []).map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <span style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.65rem', fontWeight: 800, background: `${color}20`, color,
                  border: `1px solid ${color}30`, marginTop: '0.1rem'
                }}>
                  {i + 1}
                </span>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Rules */}
        <div style={{
          background: 'var(--bg-dark)', borderRadius: 12, padding: '1rem 1.1rem',
          border: '1px solid var(--border)', marginBottom: '1.75rem'
        }}>
          <h3 style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 0.65rem' }}>
            📋 Official Rules
          </h3>
          <ul style={{ margin: 0, paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {(meta.rules || []).map((rule, i) => (
              <li key={i} style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                {rule}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <button
          id={`play-game-${game.id}`}
          onClick={onPlay}
          style={{
            width: '100%', padding: '0.9rem', borderRadius: 12, border: 'none', cursor: 'pointer',
            background: `linear-gradient(135deg, ${color}, ${color}bb)`,
            color: '#0A0D12', fontWeight: 800, fontSize: '1rem', fontFamily: 'var(--font-display)',
            boxShadow: `0 4px 20px ${color}40`, transition: 'all 0.2s ease',
            letterSpacing: '0.5px',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 28px ${color}55`; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = `0 4px 20px ${color}40`; }}
        >
          {game.freePlay ? '🎮 Play Free — No Entry Fee' : `🚀 Choose Tier & Play`}
        </button>
      </div>
    </div>
  );
}

export default function GamesPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { gameVisibility } = usePlatformStore();
  const [activeTab, setActiveTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState(null);

  // Only show games the admin has marked visible (default: all shown)
  const visibleGames = ALL_GAMES.filter(g => (gameVisibility?.[g.id] ?? true) !== false);

  const handleCardClick = (game) => {
    setSelectedGame(game);
  };

  const handlePlay = (game) => {
    setSelectedGame(null);
    if (game.freePlay) {
      navigate(`/${game.id}`);
      return;
    }
    if (!isAuthenticated) {
      navigate(`/login?redirect=/lobby&game=${game.id}`);
    } else {
      navigate(`/lobby?game=${game.id}`);
    }
  };

  const filteredGames = visibleGames.filter((game) => {
    const meta = GAME_META[game.id] || {};
    const matchesTab = activeTab === 'All' || game.category === activeTab;
    const matchesSearch =
      game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (meta.subtitle || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const pageContent = (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '0.5rem 0.25rem 5rem' }}>

      <div style={{ padding: '1rem 0.25rem', textAlign: 'left' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🎮 iDubbl Casino Lobby
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
          USDT skill duels &amp; tables. Tap a game to see the full rules, then pick a tier.
        </p>
      </div>

      {/* Search & Categories */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0 0.25rem', marginBottom: '1.25rem' }}>
        <div style={{ position: 'relative', width: '100%' }}>
          <input
            type="text"
            placeholder="Search game..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem',
              background: 'var(--bg-dark)', border: '1px solid var(--border)',
              borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.9rem',
              outline: 'none', transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
          />
          <span style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: '0.95rem' }}>🔍</span>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.5rem', scrollbarWidth: 'none' }}>
          {CATEGORIES.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', whiteSpace: 'nowrap',
                background: isActive ? 'var(--primary-glow)' : 'var(--bg-card)',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: isActive ? '1px solid var(--primary)' : '1px solid var(--border)',
                fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.15s ease'
              }}>
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Game Grid */}
      {filteredGames.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          No games found{searchQuery ? ` for "${searchQuery}"` : ''}.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))',
          gap: '0.75rem', padding: '0 0.25rem'
        }}>
          {filteredGames.map((game) => {
            const meta = GAME_META[game.id] || {};
            const color = meta.color || '#00E37A';
            return (
              <div
                key={game.id}
                id={`game-card-${game.id}`}
                onClick={() => handleCardClick(game)}
                style={{
                  background: 'var(--bg-card)', borderRadius: '12px',
                  border: '1px solid var(--border)', overflow: 'hidden',
                  display: 'flex', flexDirection: 'column', cursor: 'pointer',
                  boxShadow: 'var(--shadow-card, 0 4px 12px rgba(0,0,0,0.03))',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)', position: 'relative'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = color; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                {/* Thumbnail */}
                <div style={{
                  height: '115px', backgroundImage: `url(${meta.imageUrl})`,
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  position: 'relative', borderBottom: '1px solid var(--border)',
                }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 100%)' }} />
                  <span style={{
                    position: 'absolute', top: '8px', right: '8px',
                    fontSize: '0.55rem', fontWeight: 800, letterSpacing: '0.5px',
                    padding: '0.15rem 0.4rem', borderRadius: '4px',
                    background: 'rgba(10,13,18,0.85)', backdropFilter: 'blur(4px)',
                    color: color, border: `1px solid ${color}40`, textTransform: 'uppercase'
                  }}>
                    {meta.difficulty || 'Easy'}
                  </span>
                  <span style={{
                    position: 'absolute', bottom: '8px', right: '8px',
                    fontSize: '0.6rem', fontWeight: 700,
                    padding: '0.1rem 0.35rem', borderRadius: '4px',
                    background: 'rgba(10,13,18,0.8)', backdropFilter: 'blur(4px)',
                    color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)'
                  }}>
                    ℹ Rules
                  </span>
                </div>

                {/* Info */}
                <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div>
                    <p style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                      {game.icon} {game.name}
                    </p>
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '0.15rem', margin: 0 }}>
                      {meta.subtitle || game.category}
                    </p>
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    paddingTop: '0.5rem', borderTop: '1.5px solid var(--border)',
                    fontSize: '0.65rem', color: color, fontWeight: 800,
                    textTransform: 'uppercase', letterSpacing: '0.5px'
                  }}>
                    <span>{game.freePlay ? '🎮 Play Free' : 'Play Duel'}</span>
                    <span style={{ fontSize: '0.75rem' }}>➔</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Game Explainer Modal */}
      {selectedGame && (
        <GameExplainerModal
          game={selectedGame}
          meta={GAME_META[selectedGame.id] || {}}
          onClose={() => setSelectedGame(null)}
          onPlay={() => handlePlay(selectedGame)}
        />
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(60px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );

  if (isAuthenticated) {
    return <AppLayout>{pageContent}</AppLayout>;
  }

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
            © {new Date().getFullYear()} iDubbl · Skill gaming platform · USDT (TRC-20) only
          </p>
        </div>
      </footer>
    </div>
  );
}
