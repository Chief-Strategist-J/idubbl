import React, { useState } from 'react';

const SEGMENTS = [
  { label: 'RED',    color: '#ef4444' },
  { label: 'BLUE',   color: '#3b82f6' },
  { label: 'GREEN',  color: '#10b981' },
  { label: 'GOLD',   color: '#fbbf24' },
  { label: 'PURPLE', color: '#8b5cf6' },
  { label: 'ORANGE', color: '#f97316' },
];

const SEG_DEG = 360 / SEGMENTS.length; // 60 degrees each

export default function LuckyWheel({ onAnswer, answered }) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const [resultIndex, setResultIndex] = useState(null);
  const [targetIndex] = useState(() => Math.floor(Math.random() * SEGMENTS.length));

  const target = SEGMENTS[targetIndex];

  const handleSpin = () => {
    if (spinning || answered || result) return;
    setSpinning(true);

    // 60% chance player wins (exciting gameplay)
    const willWin = Math.random() < 0.6;
    const finalIndex = willWin
      ? targetIndex
      : (targetIndex + 1 + Math.floor(Math.random() * (SEGMENTS.length - 1))) % SEGMENTS.length;

    // Rotate so finalIndex lands under top pointer
    // Pointer at top = 0deg. Segment center of finalIndex = finalIndex * SEG_DEG + SEG_DEG/2
    // Rotate wheel clockwise by: 360 - center_angle (+ 5 full spins for drama)
    const centerAngle = finalIndex * SEG_DEG + SEG_DEG / 2;
    const finalRotation = rotation + 5 * 360 + (360 - centerAngle % 360);

    setRotation(finalRotation);

    setTimeout(() => {
      setSpinning(false);
      setResultIndex(finalIndex);
      setResult(SEGMENTS[finalIndex]);
      onAnswer(finalIndex === targetIndex, finalIndex);
    }, 3600);
  };

  // Build conic-gradient string
  const conicGrad = SEGMENTS.map((s, i) =>
    `${s.color} ${i * SEG_DEG}deg ${(i + 1) * SEG_DEG}deg`
  ).join(', ');

  return (
    <div style={{ textAlign: 'center' }}>
      {/* Target */}
      <div style={{ marginBottom: '1.25rem' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', letterSpacing: 2, marginBottom: '0.5rem' }}>
          LAND ON THIS SEGMENT
        </p>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          background: `${target.color}18`, border: `1px solid ${target.color}60`,
          padding: '0.4rem 1.1rem', borderRadius: 20,
        }}>
          <div style={{ width: 13, height: 13, borderRadius: '50%', background: target.color, boxShadow: `0 0 8px ${target.color}` }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: target.color }}>
            {target.label}
          </span>
        </div>
      </div>

      {/* Wheel container */}
      <div style={{ position: 'relative', width: 220, height: 220, margin: '0 auto 1.5rem' }}>
        {/* Top pointer arrow */}
        <div style={{
          position: 'absolute', top: -10, left: '50%',
          transform: 'translateX(-50%)',
          width: 0, height: 0,
          borderLeft: '10px solid transparent',
          borderRight: '10px solid transparent',
          borderTop: '22px solid var(--text-primary)',
          zIndex: 3,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))',
        }} />

        {/* Spinning disc */}
        <div style={{
          width: 220, height: 220,
          borderRadius: '50%',
          background: `conic-gradient(${conicGrad})`,
          transform: `rotate(${rotation}deg)`,
          transition: spinning ? 'transform 3.5s cubic-bezier(0.17, 0.67, 0.08, 1)' : 'none',
          border: '5px solid var(--border)',
          boxShadow: '0 4px 20px rgba(15, 23, 42, 0.1), inset 0 0 10px rgba(0,0,0,0.05)',
          position: 'relative',
        }}>
          {/* Segment divider lines */}
          {SEGMENTS.map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: '50%', left: '50%',
              width: '50%', height: 2,
              background: 'rgba(0,0,0,0.3)',
              transformOrigin: '0 50%',
              transform: `rotate(${i * SEG_DEG}deg)`,
            }} />
          ))}

          {/* Segment labels */}
          {SEGMENTS.map((seg, i) => {
            const angleDeg = i * SEG_DEG + SEG_DEG / 2 - 90;
            const rad = angleDeg * Math.PI / 180;
            const r = 72;
            const x = 110 + r * Math.cos(rad);
            const y = 110 + r * Math.sin(rad);
            return (
              <div key={i} style={{
                position: 'absolute',
                left: x, top: y,
                transform: `translate(-50%, -50%) rotate(${i * SEG_DEG + SEG_DEG / 2}deg)`,
                fontSize: '0.5rem',
                fontWeight: 800,
                color: 'rgba(255,255,255,0.9)',
                letterSpacing: 0.5,
                textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                userSelect: 'none',
                whiteSpace: 'nowrap',
              }}>
                {seg.label}
              </div>
            );
          })}

          {/* Center hub */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 28, height: 28, borderRadius: '50%',
            background: 'var(--bg-darker)',
            border: '3px solid var(--border)',
            zIndex: 2,
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          }} />
        </div>
      </div>

      {/* Controls / result */}
      {!spinning && !result && (
        <button
          onClick={handleSpin}
          disabled={answered}
          className="btn-primary"
          style={{ padding: '0.75rem 2.5rem', fontSize: '1rem', letterSpacing: 1 }}
        >
          SPIN
        </button>
      )}

      {spinning && (
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: 3, fontSize: '0.85rem', animation: 'glow-pulse 1s infinite alternate' }}>
          SPINNING…
        </p>
      )}

      {result && (
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: `${result.color}20`, border: `1px solid ${result.color}70`,
            padding: '0.45rem 1.1rem', borderRadius: 20, marginBottom: '0.5rem',
          }}>
            <div style={{ width: 11, height: 11, borderRadius: '50%', background: result.color }} />
            <span style={{ fontWeight: 700, color: result.color, fontSize: '0.9rem' }}>{result.label}</span>
          </div>
          <p style={{
            color: resultIndex === targetIndex ? 'var(--accent-green)' : '#dc2626',
            fontWeight: 600, fontSize: '0.9rem',
          }}>
            {resultIndex === targetIndex ? '✓ Landed on target!' : `✗ Missed — landed on ${result.label}`}
          </p>
        </div>
      )}
    </div>
  );
}
