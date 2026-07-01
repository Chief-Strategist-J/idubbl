import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AppLayout from '../../shared/components/layout/AppLayout.jsx';
import { PageHeader, Button, Card } from '../../shared/components/ui/index.js';
import TierCard from './components/TierCard.jsx';
import useMatchStore from '../../shared/store/matchStore.js';
import useAuthStore from '../../shared/store/authStore.js';
import usePlatformStore, { ALL_GAMES } from '../../shared/store/platformStore.js';

// Game list is driven by platformStore so admin hide/show is respected

const GAME_META = {
  word_duel:     { subtitle: 'Anagram Sprint',    color: '#00E37A', emoji: '📝', howToPlay: ['Both players receive the same 7 scrambled letters.', 'Form the highest-scoring word in 20 seconds.', 'First to win 2 of 3 rounds wins the match.'], rules: ['Valid English words only — no proper nouns.', 'Longer words score more points.', 'Disconnection during a round = forfeit that round.'] },
  math_duel:     { subtitle: 'Arithmetic Blitz',  color: '#5B8DEF', emoji: '🔢', howToPlay: ['Both players see the same arithmetic question.', 'Select the correct answer from 4 options as fast as possible.', 'Speed matters — faster correct answers score more.'], rules: ['One answer attempt per question, no changes.', 'Wrong answer scores zero regardless of speed.', '15-second time limit per question.'] },
  reaction_race: { subtitle: 'Speed Reflex',       color: '#fbbf24', emoji: '⚡', howToPlay: ['Wait for the green GO! signal.', 'Tap as fast as possible.', 'Faster reaction time wins — best of 3.'], rules: ['False start (early tap) gives a time penalty.', 'Three consecutive false starts = forfeit.'] },
  lucky_wheel:   { subtitle: 'Spin & Win',         color: '#8b5cf6', emoji: '🎡', howToPlay: ['Predict a sector before the spin.', 'Wheel is spun server-side (provably fair).', 'Closest prediction wins the round.'], rules: ['Predictions must be locked before the spin starts.', 'Tie predictions use a server tiebreak.'] },
  lucky_balls:   { subtitle: 'Lotto Draw',         color: '#f97316', emoji: '🔮', howToPlay: ['Pick 3 unique numbers (1–20).', '5 balls are drawn server-side.', 'Most matches wins the round — best of 3.'], rules: ['All 3 picks must be unique.', 'Matching all 3 wins instantly.'] },
  blackjack:     { subtitle: '21 Battle',          color: '#ef4444', emoji: '🃏', howToPlay: ['Receive 2 cards. Hit or Stand.', 'Get closer to 21 than your opponent without busting.', 'Best of 3 hands wins the match.'], rules: ['Aces = 1 or 11. Face cards = 10.', 'Busting (>21) = automatic loss.', 'Natural Blackjack beats any other 21.'] },
  holdem_poker:  { subtitle: "Texas Hold'em",      color: '#10b981', emoji: '♠️', howToPlay: ['2 hole cards dealt to each player.', '5 community cards revealed over 3 rounds.', 'Best 5-card hand wins the round — best of 3.'], rules: ['Standard poker hand rankings apply.', 'All-in capped at match stake per hand.'] },
  baccarat:      { subtitle: 'Player vs Banker',   color: '#a855f7', emoji: '👑', howToPlay: ['Predict: Player, Banker, or Tie.', 'Two cards dealt to each position.', 'Hand closest to 9 wins — correct prediction wins round.'], rules: ['10/J/Q/K = 0. Ace = 1. Total over 9: only second digit counts.', 'Third card rules are automatic.'] },
  casino_war:    { subtitle: 'High Card Duel',     color: '#ec4899', emoji: '⚔️', howToPlay: ['One card dealt to each player face-up.', 'Higher card wins the round.', 'Tie: choose Go to War (double stake) or surrender.'], rules: ['Ace is highest. Suits do not matter.', 'War on tie: extra stake, next card decides.'] },
  red_dog:       { subtitle: 'In-Between Bet',     color: '#f43f5e', emoji: '🐕', howToPlay: ['Two cards set the range.', 'Bet whether the third card falls strictly between them.', 'Wide spread = easier win but lower multiplier.'], rules: ['Consecutive first two cards = push (no winner).', 'Matching pair: third card another pair = instant win.'] },
  pai_gow:       { subtitle: 'Two-Hand Strategy',  color: '#e11d48', emoji: '🀄', howToPlay: ['Split 7 cards into a 5-card high and 2-card low hand.', 'Both your hands must beat the dealer\'s to win the round.', 'Winning only one hand = push.'], rules: ['5-card hand must outrank the 2-card hand.', 'Dealer follows fixed house-way algorithm.'] },
  three_card:    { subtitle: 'Fast Tri-Card',      color: '#d97706', emoji: '🎴', howToPlay: ['Each player gets 3 cards. Play or Fold.', 'Best 3-card poker hand wins.', 'Best of 3 rounds wins the match.'], rules: ['In 3-card poker, straight beats a flush.', 'Folding forfeits the round.'] },
  video_poker:   { subtitle: 'Draw Poker',         color: '#2563eb', emoji: '🎰', howToPlay: ['Receive 5 cards. Choose which to hold.', 'Discards replaced from a fresh deck.', 'Better final hand wins the round.'], rules: ['Minimum winning hand: Jacks or better.', 'Royal Flush pays the highest multiplier.'] },
  ludo:          { subtitle: 'Board Game',         color: '#f97316', emoji: '🎲', howToPlay: ['Race 4 tokens from base to home.', 'Roll 6 to enter a token from base.', 'Land on opponent to send them back.'], rules: ['Need a 6 to enter from base.', 'Safe squares cannot be captured.', 'Free to play — no USDT entry fee.'] },
};

export default function LobbyPage() {
  const navigate = useNavigate();
  const { tiers } = useMatchStore();
  const { user } = useAuthStore();
  const { gameVisibility } = usePlatformStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTiers = tiers.filter((t) => t.active);

  // Only lobby-compatible (non-freePlay) visible games
  const GAMES = ALL_GAMES.filter(g => !g.freePlay && gameVisibility[g.id] !== false);

  // Ludo and other free-play games shown as quick links
  const FREEPLAY_GAMES = ALL_GAMES.filter(g => g.freePlay && gameVisibility[g.id] !== false);

  const chosenGameId = searchParams.get('game') || 'word_duel';
  const selectedGame = GAMES.find(g => g.id === chosenGameId) || GAMES[0];

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

      {/* Game Selector Pills */}
      <div style={{ marginBottom: '2rem' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem' }}>
          Select Game Mode
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {GAMES.map((g) => {
            const isSelected = g.id === chosenGameId;
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
                  border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)',
                  background: isSelected ? 'rgba(0, 227, 122, 0.15)' : 'var(--glass-bg)',
                  color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
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
        const color = gmeta.color || '#00E37A';
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
            maxWidth: 480, width: '100%', padding: '2.5rem',
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
