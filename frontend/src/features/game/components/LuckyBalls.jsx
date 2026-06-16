import React, { useState, useEffect } from 'react';

const BALL_COLORS = [
  '#ef4444', '#3b82f6', '#10b981',
  '#fbbf24', '#8b5cf6', '#f97316',
  '#ec4899', '#06b6d4', '#a78bfa',
];

const TOTAL = 9;

export default function LuckyBalls({ onAnswer, answered }) {
  const [targetBall] = useState(() => Math.floor(Math.random() * TOTAL));
  const [revealing, setRevealing] = useState(true);
  const [flashIndex, setFlashIndex] = useState(0);
  const [selected, setSelected] = useState(null);

  // Animate a "shuffling" effect for 1.5s before revealing the target ball
  useEffect(() => {
    let interval;
    let stop;

    interval = setInterval(() => {
      setFlashIndex((p) => (p + 1) % TOTAL);
    }, 120);

    stop = setTimeout(() => {
      clearInterval(interval);
      setFlashIndex(targetBall);
      setRevealing(false);
    }, 1500);

    return () => {
      clearInterval(interval);
      clearTimeout(stop);
    };
  }, [targetBall]);

  const handleSelect = (index) => {
    if (answered || selected !== null || revealing) return;
    setSelected(index);
    onAnswer(index === targetBall, index);
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
      cursor: (answered || revealing) ? 'default' : 'pointer',
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
        return { ...base, opacity: 0.4, background: 'rgba(239,68,68,0.2)', border: '2px solid #f87171' };
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
      {/* Drawn ball display */}
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', letterSpacing: 2, marginBottom: '0.75rem' }}>
          {revealing ? 'DRAWING BALL…' : 'FIND THIS BALL!'}
        </p>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 72, height: 72, borderRadius: '50%',
          background: revealing
            ? `radial-gradient(circle at 35% 30%, ${BALL_COLORS[flashIndex]}ee, ${BALL_COLORS[flashIndex]}88)`
            : `radial-gradient(circle at 35% 30%, ${BALL_COLORS[targetBall]}ee, ${BALL_COLORS[targetBall]}88)`,
          border: `3px solid ${revealing ? BALL_COLORS[flashIndex] : BALL_COLORS[targetBall]}`,
          boxShadow: `0 0 30px ${revealing ? BALL_COLORS[flashIndex] : BALL_COLORS[targetBall]}80`,
          fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-display)',
          color: 'white',
          transition: 'all 0.1s ease',
          textShadow: '0 2px 4px rgba(0,0,0,0.5)',
        }}>
          {revealing ? flashIndex + 1 : targetBall + 1}
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
            disabled={answered || revealing}
            style={getBallStyle(i)}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {!revealing && selected === null && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', letterSpacing: 1 }}>
          TAP THE MATCHING BALL
        </p>
      )}

      {selected !== null && (
        <p style={{
          color: selected === targetBall ? 'var(--accent-green)' : '#f87171',
          fontWeight: 600, fontSize: '0.9rem',
        }}>
          {selected === targetBall ? '✓ Correct ball!' : `✗ Wrong — it was ball ${targetBall + 1}`}
        </p>
      )}
    </div>
  );
}
