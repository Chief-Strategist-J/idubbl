import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AppLayout from '../../shared/components/layout/AppLayout.jsx';
import { PageHeader, Button, Card } from '../../shared/components/ui/index.js';
import TierCard from './components/TierCard.jsx';
import useMatchStore from '../../shared/store/matchStore.js';
import useAuthStore from '../../shared/store/authStore.js';
import usePlatformStore, { ALL_GAMES } from '../../shared/store/platformStore.js';
import useWalletStore from '../../shared/store/walletStore.js';
import { GAME_META } from '../../shared/data/gameMeta.js';

// Game list is driven by platformStore so admin hide/show is respected

const CHANCE_GAME_IDS = new Set(['lucky_wheel', 'lucky_balls']);

export default function LobbyPage() {
  const navigate = useNavigate();
  const { tiers } = useMatchStore();
  const { user } = useAuthStore();
  const { fetchWalletData } = useWalletStore();
  const { gameVisibility } = usePlatformStore();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const uid = user?.id || user?._id;
    if (uid) {
      fetchWalletData(uid);
    }
  }, [user, fetchWalletData]);
  // Only lobby-compatible (non-freePlay) visible games
  const GAMES = ALL_GAMES.filter(g => !g.freePlay && gameVisibility[g.id] !== false);

  // Ludo and other free-play games shown as quick links
  const FREEPLAY_GAMES = ALL_GAMES.filter(g => g.freePlay && gameVisibility[g.id] !== false);

  const chosenGameId = searchParams.get('game') || 'word_duel';
  const isChanceSelected = CHANCE_GAME_IDS.has(chosenGameId);
  const activeTiers = tiers.filter((t) => t.active && !!t.isChance === isChanceSelected);
  const selectedGame = GAMES.find(g => g.id === chosenGameId) || GAMES[0] || { id: 'word_duel', name: 'Word Duel', description: 'Timed word challenge duels.' };

  const skillGames = GAMES.filter(g => !CHANCE_GAME_IDS.has(g.id));
  const chanceGames = GAMES.filter(g => CHANCE_GAME_IDS.has(g.id));

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [friendEmail, setFriendEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showRules, setShowRules] = useState(false);

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!friendEmail) return;
    setLoading(true);
    setMessage('');
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'https://idubbl-backend.onrender.com';
      const res = await fetch(`${apiBase}/api/match/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          friendEmail,
          senderName: user?.name || user?.email || 'A friend'
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage('Invitation successfully sent!');
        setFriendEmail('');
      } else {
        setMessage(data.error || 'Failed to send invitation.');
      }
    } catch (err) {
      setMessage('Network error sending invitation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Game Matchmaking Lobby"
        subtitle="Choose a game mode and entry fee tier to join the matchmaking pool."
      />

      {/* Category Selection Tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
        {/* Skill Games Tab Card */}
        <div
          onClick={() => {
            setSearchParams({ game: skillGames[0]?.id || 'word_duel' });
            setShowRules(false);
          }}
          style={{
            padding: '1.25rem',
            borderRadius: '14px',
            cursor: 'pointer',
            background: !isChanceSelected ? 'rgba(0, 227, 122, 0.08)' : 'var(--glass-bg)',
            border: !isChanceSelected ? '1.5px solid var(--primary)' : '1px solid var(--border)',
            transition: 'all 0.2s ease',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.2rem' }}>⚔️</span>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: !isChanceSelected ? 'var(--primary)' : 'var(--text-primary)' }}>Skill Games</h3>
          </div>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            Compete 1v1 against other real users. Prizes are derived from the entry fee pool split minus a platform rake.
          </p>
        </div>

        {/* Chance Games (Specials) Tab Card */}
        <div
          onClick={() => {
            setSearchParams({ game: chanceGames[0]?.id || 'lucky_wheel' });
            setShowRules(false);
          }}
          style={{
            padding: '1.25rem',
            borderRadius: '14px',
            cursor: 'pointer',
            background: isChanceSelected ? 'rgba(139, 92, 246, 0.08)' : 'var(--glass-bg)',
            border: isChanceSelected ? '1.5px solid #8b5cf6' : '1px solid var(--border)',
            transition: 'all 0.2s ease',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.2rem' }}>🎡</span>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: isChanceSelected ? '#8b5cf6' : 'var(--text-primary)' }}>Chance Games (Specials)</h3>
          </div>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            Difficult games based on luck against the machine. Every entry fee is grown by 100x to form the pool. No platform rake.
          </p>
        </div>
      </div>

      {/* Game Selector Pills */}
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem' }}>
          Select Game Mode
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {(!isChanceSelected ? skillGames : chanceGames).map((g) => {
            const isSelected = g.id === chosenGameId;
            const activeColor = isChanceSelected ? '#8b5cf6' : 'var(--primary)';
            const activeBg = isChanceSelected ? 'rgba(139, 92, 246, 0.15)' : 'rgba(0, 227, 122, 0.15)';
            return (
              <button
                key={g.id}
                onClick={() => { setSearchParams({ game: g.id }); setShowRules(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  border: isSelected ? `1px solid ${activeColor}` : '1px solid var(--border)',
                  background: isSelected ? activeBg : 'var(--glass-bg)',
                  color: isSelected ? activeColor : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  transition: 'all 0.2s ease'
                }}
              >
                <span>{g.icon}</span>
                <span>{g.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Game Explainer Panel */}
      {selectedGame && (() => {
        const gmeta = GAME_META[selectedGame.id] || {};
        const color = isChanceSelected ? '#8b5cf6' : (gmeta.color || '#00E37A');
        return (
          <div style={{
            marginBottom: '1.5rem', borderRadius: 14, overflow: 'hidden',
            border: `1px solid ${color}30`, background: `${color}08`
          }}>
            {/* Collapsed header */}
            <button
              id={`game-rules-toggle-${selectedGame.id}`}
              onClick={() => setShowRules(r => !r)}
              style={{
                width: '100%', padding: '0.85rem 1.1rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'transparent', border: 'none', cursor: 'pointer', gap: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{ fontSize: '1.1rem' }}>{gmeta.emoji || selectedGame.icon}</span>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  {selectedGame.name}
                </span>
                <span style={{ fontSize: '0.7rem', color, fontWeight: 600 }}>{gmeta.subtitle}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{
                  fontSize: '0.65rem', fontWeight: 700, color,
                  background: `${color}18`, border: `1px solid ${color}30`,
                  padding: '0.15rem 0.5rem', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.5px'
                }}>Rules {showRules ? '▲' : '▼'}</span>
              </div>
            </button>

            {showRules && (
              <div style={{ padding: '0 1.1rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ borderTop: `1px solid ${color}20`, paddingTop: '0.85rem' }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 0.5rem' }}>🎮 How to Play</p>
                  <ol style={{ margin: 0, paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {(gmeta.howToPlay || []).map((step, i) => (
                      <li key={i} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{step}</li>
                    ))}
                  </ol>
                </div>
                <div>
                  <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 0.5rem' }}>📋 Key Rules</p>
                  <ul style={{ margin: 0, paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {(gmeta.rules || []).map((rule, i) => (
                      <li key={i} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{rule}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      <div className="matchmaking-grid">
        {activeTiers.map((tier) => (
          <TierCard key={tier.id} tier={tier} gameType={chosenGameId} />
        ))}
      </div>

      {/* Free-Play Games Section (e.g. Ludo) */}
      {FREEPLAY_GAMES.length > 0 && (
        <div style={{ marginTop: '2.5rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem' }}>
            🎮 Free-Play Games
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {FREEPLAY_GAMES.map(g => (
              <button
                key={g.id}
                onClick={() => navigate(`/${g.id}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.6rem',
                  padding: '0.65rem 1.25rem', borderRadius: '12px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)', color: 'var(--text-primary)',
                  cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600,
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#f97316'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
              >
                <span style={{ fontSize: '1.2rem' }}>{g.icon}</span>
                <div style={{ textAlign: 'left' }}>
                  <div>{g.name}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 400 }}>Free · No entry fee</div>
                </div>
                <span style={{ marginLeft: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>➔</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: '3rem' }}>
        <Button variant="secondary" onClick={() => setShowInviteModal(true)}>
          ✉️ Invite a Friend to Play
        </Button>
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', marginTop: '2rem' }}>
        All matches are best of 3 rounds · Results are server-authoritative
      </p>


      {showInviteModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem'
        }}>
          <div className="glass-card" style={{
            maxWidth: 480, width: '100%', padding: '1.5rem',
            borderRadius: '1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem',
            border: '1px solid var(--border)'
          }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Invite a Friend</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Challenge your friends directly to live USDT duel matches on iDubbl!
              </p>
            </div>

            <form onSubmit={handleSendInvite} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                  Friend's Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="friend@example.com"
                  value={friendEmail}
                  onChange={(e) => setFriendEmail(e.target.value)}
                  style={{
                    width: '100%', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', fontSize: '0.95rem'
                  }}
                />
              </div>

              {message && (
                <p style={{
                  fontSize: '0.85rem',
                  color: message.includes('sent') ? 'var(--accent-green)' : 'var(--accent-red)',
                  textAlign: 'center', margin: 0
                }}>
                  {message}
                </p>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <Button variant="secondary" fullWidth type="button" onClick={() => { setShowInviteModal(false); setMessage(''); }}>
                  Close
                </Button>
                <Button variant="primary" fullWidth type="submit" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Invite'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
