import React, { useState } from 'react';

export default function MathDuel({ question, onAnswer, answered, correctIndex }) {
  const [selected, setSelected] = useState(null);

  const handleSelect = (index) => {
    if (answered || selected !== null) return;
    setSelected(index);
    // Pass only selectedIndex — GamePage/backend determines if it's correct
    onAnswer(index);
  };

  const getOptionStyle = (index) => {
    if (selected === null) return {};
    // Use server-provided correctIndex if available, else fallback to local question.correct
    const correct = correctIndex !== undefined && correctIndex !== null
      ? correctIndex
      : question?.correct;
    if (correct === undefined || correct === null) {
      if (index === selected) return { borderColor: 'var(--accent-cyan)', background: 'rgba(6,182,212,0.12)', color: 'var(--accent-cyan)' };
      return { opacity: 0.5 };
    }
    if (index === correct) return { borderColor: 'var(--accent-green)', background: 'rgba(16,185,129,0.12)', color: 'var(--accent-green)' };
    if (index === selected && index !== correct) return { borderColor: 'var(--accent-red)', background: 'var(--accent-red-glow)', color: 'var(--accent-red)' };
    return { opacity: 0.5 };
  };

  const correct = correctIndex !== undefined && correctIndex !== null ? correctIndex : question?.correct;

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', letterSpacing: 2, marginBottom: '0.75rem' }}>SOLVE THE EQUATION</p>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, letterSpacing: 4, color: 'var(--accent-cyan)' }}>
          {question?.expression || question?.question || '?'}
        </h2>
      </div>

      <div className="duel-options-grid">
        {(question?.options ?? []).map((opt, i) => (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            disabled={answered}
            style={{
              padding: '1rem', borderRadius: 12, border: '1px solid var(--border)',
              background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)',
              fontFamily: 'var(--font-sans)', fontSize: '0.9rem', cursor: answered ? 'default' : 'pointer',
              textAlign: 'left', lineHeight: 1.4, transition: 'all 0.2s ease',
              ...getOptionStyle(i),
            }}
          >
            <span style={{ color: 'var(--text-muted)', marginRight: 8, fontWeight: 600 }}>
              {String.fromCharCode(65 + i)}.
            </span>
            {opt}
          </button>
        ))}
      </div>

      {selected !== null && correct !== undefined && correct !== null && (
        <p style={{ textAlign: 'center', marginTop: '1rem', color: selected === correct ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 600 }}>
          {selected === correct ? '✓ Correct!' : '✗ Wrong answer'}
        </p>
      )}
    </div>
  );
}
