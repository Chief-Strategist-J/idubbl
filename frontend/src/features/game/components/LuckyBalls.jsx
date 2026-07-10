import React, { useState, useEffect, useRef } from 'react';
import useMatchStore from '../../../shared/store/matchStore.js';

const BALL_COLORS = [
  '#ef4444', '#3b82f6', '#10b981',
  '#fbbf24', '#8b5cf6', '#f97316',
  '#ec4899', '#06b6d4', '#a78bfa',
];

const TOTAL = 9;

// Picks any ball index other than `excludeIndex` — kept outside the component so the
// impure Math.random() call never runs as part of a render/event-handler body.
function pickOtherBall(excludeIndex) {
  return (excludeIndex + 1 + Math.floor(Math.random() * (TOTAL - 1))) % TOTAL;
}

export default function LuckyBalls({ onAnswer, answered }) {
  const { currentMatch, currentRound, requestRoundOutcome } = useMatchStore();
  const matchId = currentMatch?.matchId ?? currentMatch?.id;

  const [revealing, setRevealing] = useState(true);
  const [flashIndex, setFlashIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [targetBall, setTargetBall] = useState(null);
  const [outcomeReady, setOutcomeReady] = useState(false);
  const userWinsRef = useRef(false);

  // Ask the server which outcome this round should have — decided server-side,
  // never Math.random() in the browser, since real money is at stake.
  useEffect(() => {
    let cancelled = false;
    requestRoundOutcome(matchId, currentRound).then((userWins) => {
      if (cancelled) return;
      userWinsRef.current = userWins;
      setOutcomeReady(true);
    });
    return () => { cancelled = true; };
  }, [matchId, currentRound]); // eslint-disable-line

  // Animate a "shuffling" effect for 1.5s before allowing a pick
  useEffect(() => {
    let interval;
    let stop;

    interval = setInterval(() => {
      setFlashIndex((p) => (p + 1) % TOTAL);
    }, 120);

    stop = setTimeout(() => {
      clearInterval(interval);
      setRevealing(false);
    }, 1500);

    return () => {
      clearInterval(interval);
      clearTimeout(stop);
    };
  }, []);

  const handleSelect = (index) => {
    if (answered || selected !== null || revealing || !outcomeReady) return;
    const userWins = userWinsRef.current;
    // If the house draw favors the player, the drawn ball matches their pick;
    // otherwise it's forced to any of the other 8 balls.
    const finalTarget = userWins ? index : pickOtherBall(index);

    setSelected(index);
    setTargetBall(finalTarget);
    onAnswer(userWins, index);
  };

  const getBallStyle = (i) => {
    const base = {
      aspectRatio: '1',
      borderRadius: '50%',
      background: `radial-gradient(circle at 35% 30%, ${BALL_COLORS[i]}ee, ${BALL_COLORS[i]}88)`,
      border: `2px solid ${BALL_COLORS[i]}80`,
      color: 'white',
      fontFamily: 'var(--font-display)',
      fontWeight: 800,
      fontSize: '1.2rem',
      cursor: (answered || revealing || !outcomeReady) ? 'default' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease',
      position: 'relative',
      userSelect: 'none',
      WebkitTapHighlightColor: 'transparent',
    };

    if (revealing) {
      return {
        ...base,
        opacity: flashIndex === i ? 1 : 0.3,
        transform: flashIndex === i ? 'scale(1.15)' : 'scale(1)',
        boxShadow: flashIndex === i ? `0 0 20px ${BALL_COLORS[i]}` : 'none',
      };
    }

    if (selected !== null) {
      if (i === targetBall) {
        return {
          ...base,
          transform: 'scale(1.15)',
          boxShadow: `0 0 24px ${BALL_COLORS[i]}, 0 0 8px ${BALL_COLORS[i]}`,
          border: `2px solid ${BALL_COLORS[i]}`,
        };
      }
      if (i === selected && i !== targetBall) {
        return { ...base, opacity: 0.4, background: 'var(--accent-red-glow)', border: '2px solid var(--accent-red)' };
      }
      return { ...base, opacity: 0.35 };
    }

    return {
      ...base,
      boxShadow: `0 4px 12px ${BALL_COLORS[i]}40`,
    };
  };

  return (
    <div style={{ textAlign: 'center' }}>
      {/* Shuffle animation, pre-pick prompt, or drawn-ball reveal */}
      <div style={{ marginBottom: '1.5rem', minHeight: 108 }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', letterSpacing: 2, marginBottom: '0.75rem' }}>
          {revealing
            ? 'SHUFFLING BALLS…'
            : selected !== null
              ? 'HOUSE DRAW'
              : outcomeReady
                ? 'PICK A BALL!'
                : 'PREPARING DRAW…'}
        </p>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 72, height: 72, borderRadius: '50%',
          background: revealing
            ? `radial-gradient(circle at 35% 30%, ${BALL_COLORS[flashIndex]}ee, ${BALL_COLORS[flashIndex]}88)`
            : targetBall !== null
              ? `radial-gradient(circle at 35% 30%, ${BALL_COLORS[targetBall]}ee, ${BALL_COLORS[targetBall]}88)`
              : 'var(--glass-bg)',
          border: `3px solid ${revealing ? BALL_COLORS[flashIndex] : targetBall !== null ? BALL_COLORS[targetBall] : 'var(--border)'}`,
          boxShadow: revealing
            ? `0 0 30px ${BALL_COLORS[flashIndex]}80`
            : targetBall !== null ? `0 0 30px ${BALL_COLORS[targetBall]}80` : 'none',
          fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-display)',
          color: 'white',
          transition: 'all 0.1s ease',
          textShadow: '0 2px 4px rgba(0,0,0,0.5)',
        }}>
          {revealing ? flashIndex + 1 : targetBall !== null ? targetBall + 1 : '?'}
        </div>
      </div>

      {/* 3×3 ball grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '0.75rem',
        maxWidth: 240,
        margin: '0 auto 1rem',
      }}>
        {Array.from({ length: TOTAL }, (_, i) => (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            disabled={answered || revealing || !outcomeReady}
            style={getBallStyle(i)}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {!revealing && outcomeReady && selected === null && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', letterSpacing: 1 }}>
          TAP A BALL TO MAKE YOUR PICK
        </p>
      )}

      {selected !== null && (
        <p style={{
          color: selected === targetBall ? 'var(--accent-green)' : 'var(--accent-red)',
          fontWeight: 600, fontSize: '0.9rem',
        }}>
          {selected === targetBall ? '✓ Your pick matched the draw!' : `✗ Wrong — the house drew ball ${targetBall + 1}`}
        </p>
      )}
    </div>
  );
}
