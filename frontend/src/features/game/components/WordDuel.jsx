import React, { useState } from 'react';
import { Button } from '../../../shared/components/ui/index.js';

export default function WordDuel({ question, onAnswer, answered, correctIndex, opponentSelection, opponentName, mySelection }) {
  const [selected, setSelected] = useState(null);

  const handleSelect = (index) => {
    if (answered || selected !== null) return;
    setSelected(index);
    onAnswer(index);
  };

  const getOptionStyle = (index) => {
    const isMySelection = index === (selected !== null ? selected : mySelection);
    const isOpponentSelection = index === opponentSelection;

    // If backend verified correctIndex is available, show green/red correctness feedback
    if (correctIndex !== undefined && correctIndex !== null) {
      if (index === correctIndex) return { borderColor: 'var(--accent-green)', background: 'rgba(16,185,129,0.12)', color: 'var(--accent-green)' };
      if (isMySelection && index !== correctIndex) return { borderColor: 'var(--accent-red)', background: 'var(--accent-red-glow)', color: 'var(--accent-red)' };
      if (isOpponentSelection && index !== correctIndex) return { borderColor: 'rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.05)', opacity: 0.8 };
      return { opacity: 0.5 };
    }
    
    if (isMySelection) return { borderColor: 'var(--accent-cyan)', background: 'rgba(6,182,212,0.12)', color: 'var(--accent-cyan)' };
    if (isOpponentSelection) return { borderColor: 'rgba(239, 68, 68, 0.6)', background: 'rgba(239, 68, 68, 0.08)', color: '#f87171' };
    
    if (selected !== null || answered) return { opacity: 0.5 };
    return {};
  };

  const isOpponentSelected = opponentSelection !== null && opponentSelection !== undefined;

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', letterSpacing: 2, marginBottom: '0.75rem' }}>
          {question?.category ? question.category.toUpperCase() : 'QUIZ DUEL'}
        </p>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.2rem, 4vw, 1.8rem)', fontWeight: 800, color: 'var(--text-primary)', padding: '0 1rem', lineHeight: 1.4 }}>
          {question?.question || question?.word}
        </h2>
      </div>

      <div className="duel-options-grid" style={{ display: 'grid', gap: '0.75rem' }}>
        {(question?.options ?? []).map((opt, i) => {
          const isOpp = opponentSelection === i;
          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={answered}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '1rem', borderRadius: 12, border: '1px solid var(--border)',
                background: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)',
                fontFamily: 'var(--font-sans)', fontSize: '0.9rem', cursor: answered ? 'default' : 'pointer',
                textAlign: 'left', lineHeight: 1.4, transition: 'all 0.2s ease',
                width: '100%',
                ...getOptionStyle(i),
              }}
            >
              <span>
                <span style={{ color: 'var(--text-muted)', marginRight: 8, fontWeight: 600 }}>
                  {String.fromCharCode(65 + i)}.
                </span>
                {opt}
              </span>
              {isOpp && (
                <span style={{
                  fontSize: '0.75rem',
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#f87171',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  fontWeight: 600,
                  whiteSpace: 'nowrap'
                }}>
                  {opponentName} selected
                </span>
              )}
            </button>
          );
        })}
      </div>

      {(selected !== null || mySelection !== null) && correctIndex !== undefined && correctIndex !== null && (
        <p style={{ textAlign: 'center', marginTop: '1rem', color: (selected === correctIndex || mySelection === correctIndex) ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 600 }}>
          {(selected === correctIndex || mySelection === correctIndex) ? '✓ Correct!' : '✗ Wrong answer'}
        </p>
      )}
    </div>
  );
}
