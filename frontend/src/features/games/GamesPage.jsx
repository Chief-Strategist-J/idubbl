import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../shared/components/layout/AppLayout.jsx';
import useAuthStore from '../../shared/store/authStore.js';
import usePlatformStore, { ALL_GAMES } from '../../shared/store/platformStore.js';
import ThemeToggle from '../../shared/components/ui/ThemeToggle.jsx';

const GAME_META = {
  word_duel: {
    subtitle: 'Anagram Sprint',
    description: 'Same 7 letters. 20 seconds. Highest score wins the round. Best of 3 takes the match.',
    difficulty: 'Medium',
    color: '#00E37A',
    imageUrl: 'https://images.unsplash.com/photo-1546776310-eef45dd6d63c?auto=format&fit=crop&w=300&q=80',
    emoji: '📝',
    howToPlay: [
      'Both players receive the same 7 scrambled letters simultaneously.',
      'Rearrange the letters to form the longest or highest-scoring word within 20 seconds.',
      'The player with the higher word score wins that round.',
      'First to win 2 out of 3 rounds takes the match prize.',
    ],
    rules: [
      'All words must be valid English dictionary words.',
      'No proper nouns, abbreviations, or hyphenated words.',
      'Longer words score more points — using all 7 letters gives a bonus.',
      'If both players tie a round, neither gets the round win.',
      'Disconnection during a round counts as a forfeit for that round.',
    ],
  },
  math_duel: {
    subtitle: 'Arithmetic Blitz',
    description: 'Rapid mental math battle. Solve arithmetic equations under time pressure.',
    difficulty: 'Hard',
    color: '#5B8DEF',
    imageUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=300&q=80',
    emoji: '🔢',
    howToPlay: [
      'Both players see the same arithmetic question at the same time.',
      'Select the correct answer from 4 options as fast as possible.',
      'Speed matters — faster correct answers score more points.',
      'First to win 2 out of 3 rounds wins the match.',
    ],
    rules: [
      'Questions are randomly selected from a shared pool.',
      'Only one answer attempt per question — no changing your answer.',
      'A wrong answer scores zero for that round regardless of speed.',
      'Time limit per question is 15 seconds.',
    ],
  },
  reaction_race: {
    subtitle: 'Speed Reflex',
    description: 'Instant reaction test. Tap as fast as you can when the cue appears.',
    difficulty: 'Easy',
    color: '#fbbf24',
    imageUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=300&q=80',
    emoji: '⚡',
    howToPlay: [
      'Wait for the green "GO!" signal to appear on screen.',
      'Tap the button as fast as humanly possible.',
      'Your reaction time in milliseconds is recorded.',
      'Faster reaction time wins the round — best of 3.',
    ],
    rules: [
      'Tapping before the signal appears (false start) gives a penalty.',
      'Each round has a random delay (1–4 seconds) before the signal.',
      'Three consecutive false starts result in match forfeit.',
    ],
  },
  lucky_wheel: {
    subtitle: 'Spin & Win',
    description: 'Spin the fortune wheel. Predict where the wheel lands to win multipliers.',
    difficulty: 'Easy',
    color: '#8b5cf6',
    imageUrl: 'https://images.unsplash.com/photo-1596838132731-3301c3fd4317?auto=format&fit=crop&w=300&q=80',
    emoji: '🎡',
    howToPlay: [
      'Both players place their prediction on a sector before the spin.',
      'The wheel is spun using a provably fair server-side algorithm.',
      'The player whose prediction lands closest to the result wins.',
      'First to win 2 of 3 rounds takes the match.',
    ],
    rules: [
      'Predictions must be locked in before the wheel starts spinning.',
      'All outcomes are determined server-side — the display is cosmetic only.',
      'In case of identical predictions, the server uses a tiebreak random.',
    ],
  },
  lucky_balls: {
    subtitle: 'Lotto Draw',
    description: 'Fast lotto draw game. Pick your numbers and match them for payouts.',
    difficulty: 'Easy',
    color: '#f97316',
    imageUrl: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=300&q=80',
    emoji: '🔮',
    howToPlay: [
      'Each player picks 3 numbers between 1 and 20 before the draw.',
      'The server draws 5 random numbers.',
      'The player matching more of their numbers wins the round.',
      'Best of 3 rounds wins the match.',
    ],
    rules: [
      'Numbers must be selected before the draw begins.',
      'Duplicate picks are not allowed — all 3 must be unique.',
      'Matching all 3 wins the round instantly regardless of opponent.',
    ],
  },
  blackjack: {
    subtitle: '21 Battle',
    description: 'Classic heads-up Blackjack. Get closer to 21 than your opponent without busting.',
    difficulty: 'Medium',
    color: '#ef4444',
    imageUrl: 'https://images.unsplash.com/photo-1511193311914-0346f16efe90?auto=format&fit=crop&w=300&q=80',
    emoji: '🃏',
    howToPlay: [
      'Both players receive 2 cards face-up at the start.',
      'Take turns choosing to Hit (take a card) or Stand (keep current hand).',
      'Get closer to 21 than your opponent without going over.',
      'Best of 3 hands wins the match.',
    ],
    rules: [
      'Aces count as 1 or 11 — whichever benefits the hand more.',
      'Face cards (J, Q, K) count as 10.',
      'Busting (going over 21) means automatic loss for that hand.',
      'Natural Blackjack (Ace + 10-value) beats any other 21.',
    ],
  },
  holdem_poker: {
    subtitle: "Texas Hold'em",
    description: "Speed Texas Hold'em poker. Best 5-card hand wins the pot.",
    difficulty: 'Hard',
    color: '#10b981',
    imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=300&q=80',
    emoji: '♠️',
    howToPlay: [
      'Each player receives 2 private hole cards.',
      '5 community cards are dealt face-up over 3 rounds (Flop, Turn, River).',
      'Use any combination of your 2 hole cards and 5 community cards.',
      'Best 5-card poker hand wins the round.',
    ],
    rules: [
      'Standard poker hand rankings apply: Royal Flush → High Card.',
      'Betting rounds occur after each community card stage.',
      'All-in is capped at the match entry stake per hand.',
      'Best of 3 hands wins the match.',
    ],
  },
  baccarat: {
    subtitle: 'Player vs Banker',
    description: 'Compare player and banker hands. Predict the winning side.',
    difficulty: 'Medium',
    color: '#a855f7',
    imageUrl: 'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?auto=format&fit=crop&w=300&q=80',
    emoji: '👑',
    howToPlay: [
      'Predict before each round: Player wins, Banker wins, or Tie.',
      'Two cards are dealt to both Player and Banker positions.',
      'The hand closest to 9 wins.',
      'Correct predictions win the round — best of 3 takes the match.',
    ],
    rules: [
      'Cards 2–9 count at face value. 10, J, Q, K = 0. Ace = 1.',
      'If total exceeds 9, only the second digit counts (e.g., 15 = 5).',
      'Drawing rules for a third card are fixed and automatic.',
      'A Tie prediction pays more but is the least likely outcome.',
    ],
  },
  casino_war: {
    subtitle: 'High Card Duel',
    description: 'The simplest card game. Draw the higher card to win.',
    difficulty: 'Easy',
    color: '#ec4899',
    imageUrl: 'https://images.unsplash.com/photo-1606167668584-78701c57f13d?auto=format&fit=crop&w=300&q=80',
    emoji: '⚔️',
    howToPlay: [
      'Both players are dealt one card face-up.',
      'The higher card wins the round.',
      'In a tie, players can choose to "Go to War" (double stake) or surrender.',
      'Best of 3 rounds wins the match.',
    ],
    rules: [
      'Card rankings: Ace high, then K, Q, J, 10 down to 2.',
      'Suits do not affect ranking.',
      'Going to War on a tie: each side puts in an equal extra bet; next card decides.',
    ],
  },
  red_dog: {
    subtitle: 'In-Between Bet',
    description: 'Bet on whether the third card falls between the first two cards.',
    difficulty: 'Medium',
    color: '#f43f5e',
    imageUrl: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=300&q=80',
    emoji: '🐕',
    howToPlay: [
      'Two cards are dealt face-up to set the range.',
      'Bet whether the third card will fall strictly between the two.',
      'If the spread is wide (e.g., 2 and King), the bet is easier to win.',
      'Best of 3 rounds wins the match.',
    ],
    rules: [
      'If the first two cards are consecutive (e.g., 7 & 8), the round is a push — no winner.',
      'If the first two cards match (pair), one more card is dealt — another pair is instant win.',
      'Wider spreads pay lower multipliers; narrower spreads pay higher.',
    ],
  },
  pai_gow: {
    subtitle: 'Two-Hand Strategy',
    description: 'Split your 7 cards into a 5-card hand and a 2-card hand.',
    difficulty: 'Hard',
    color: '#e11d48',
    imageUrl: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=300&q=80',
    emoji: '🀄',
    howToPlay: [
      'You receive 7 cards. Split them into a 5-card "high" hand and a 2-card "low" hand.',
      'Both your hands must beat the dealer\'s corresponding hands to win the round.',
      'Winning only one hand is a push — no round winner.',
      'Best of 3 rounds wins the match.',
    ],
    rules: [
      'Your 5-card hand must always rank higher than your 2-card hand.',
      'Standard poker rankings apply to the 5-card hand.',
      'The 2-card hand can only be a pair or high-card.',
      'Dealer hand follows a fixed "house way" algorithm — no discretion.',
    ],
  },
  three_card: {
    subtitle: 'Fast Tri-Card',
    description: 'Quick poker variation using three cards.',
    difficulty: 'Medium',
    color: '#d97706',
    imageUrl: 'https://images.unsplash.com/photo-1533078420084-28ab16c873df?auto=format&fit=crop&w=300&q=80',
    emoji: '🎴',
    howToPlay: [
      'Each player and the dealer receive 3 cards face-down.',
      'Decide to Play (continue) or Fold (forfeit the round).',
      'Best 3-card poker hand wins the round.',
      'Best of 3 rounds wins the match.',
    ],
    rules: [
      'Hand rankings (best to worst): Straight Flush, Three of a Kind, Straight, Flush, Pair, High Card.',
      'Note: In 3-card poker, a straight beats a flush.',
      'Folding forfeits the round — no card reveal.',
      'Pair Plus bonus: a pair or better wins a side bonus regardless of the dealer\'s hand.',
    ],
  },
  video_poker: {
    subtitle: 'Draw Poker',
    description: 'Classic five-card draw poker machine rules.',
    difficulty: 'Medium',
    color: '#2563eb',
    imageUrl: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?auto=format&fit=crop&w=300&q=80',
    emoji: '🎰',
    howToPlay: [
      'You receive 5 cards. Choose which cards to hold.',
      'Discarded cards are replaced with new ones from the deck.',
      'Your final 5-card hand determines your payout multiplier.',
      'Higher-ranked hands pay more — Jacks or Better required to win.',
    ],
    rules: [
      'Minimum winning hand: a pair of Jacks or better.',
      'Royal Flush pays the highest multiplier.',
      'Each draw session uses a fresh shuffled deck.',
      'Player vs player — the better final hand wins the round.',
    ],
  },
  ludo: {
    subtitle: 'Board Game',
    description: 'Classic Ludo for 2 players. Race your tokens home, capture opponents, and rule the board!',
    difficulty: 'Easy',
    color: '#f97316',
    imageUrl: 'https://images.unsplash.com/photo-1611996575749-79a3a250f948?auto=format&fit=crop&w=300&q=80',
    emoji: '🎲',
    howToPlay: [
      'Each player controls 4 tokens starting in their base.',
      'Roll the dice on your turn to move a token forward.',
      'A roll of 6 lets you enter a token from base and grants a bonus roll.',
      'Race all 4 tokens to the home column before your opponent.',
    ],
    rules: [
      'You must roll a 6 to move a token out of your base.',
      'Landing on an opponent\'s token sends it back to their base.',
      'Tokens on safe squares (marked) cannot be captured.',
      'The first player to get all 4 tokens home wins the match.',
      'This is a free-play game — no USDT entry fee required.',
    ],
  },
};

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
        zIndex: 9999, padding: '0', backdropFilter: 'blur(6px)',
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
            background: `${color}18`, color, border: `1px solid ${color}40`
          }}>
            {meta.difficulty}
          </span>
        </div>

        {/* Description */}
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '1.5rem', margin: '0 0 1.5rem' }}>
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
                  border: `1px solid ${color}30`
                }}>
                  {i + 1}
                </span>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.55, paddingTop: '0.15rem' }}>
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
            📋 Rules
          </h3>
          <ul style={{ margin: 0, paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {(meta.rules || []).map((rule, i) => (
              <li key={i} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
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
          USDT skill duels & tables. Choose a game to see rules, then pick a lobby.
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
                  {/* Info icon hint */}
                  <span style={{
                    position: 'absolute', bottom: '8px', right: '8px',
                    fontSize: '0.6rem', fontWeight: 700,
                    padding: '0.1rem 0.35rem', borderRadius: '4px',
                    background: 'rgba(10,13,18,0.8)', backdropFilter: 'blur(4px)',
                    color: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.15)'
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
