import React, { useState } from 'react';
import { Button } from '../../../shared/components/ui/index.js';

export default function WordDuel({ question, onAnswer, answered }) {
  const [selected, setSelected] = useState(null);

  const handleSelect = (index) => {
    if (answered || selected !== null) return;
    setSelected(index);
    const isCorrect = index === question.correct;
    onAnswer(isCorrect, index);
  };

  const getOptionStyle = (index) => {
    if (selected === null) return {};
    if (index === question.correct) return { borderColor: 'var(--accent-green)', background: 'rgba(16,185,129,0.12)', color: 'var(--accent-green)' };
    if (index === selected && index !== question.correct) return { borderColor: 'var(--accent-red)', background: 'var(--accent-red-glow)', color: 'var(--accent-red)' };
    return { opacity: 0.5 };
  };

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', letterSpacing: 2, marginBottom: '0.75rem' }}>DEFINE THIS WORD</p>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, letterSpacing: 4, color: 'var(--accent-cyan)' }}>
          {question.word}
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        {question.options.map((opt, i) => (
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

      {selected !== null && !answered && (
        <p style={{ textAlign: 'center', marginTop: '1rem', color: selected === question.correct ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 600 }}>
          {selected === question.correct ? '✓ Correct!' : '✗ Wrong answer'}
        </p>
      )}
    </div>
  );
}
