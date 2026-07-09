import React, { useState, useEffect } from 'react';

export default function ReactionRace({ question, onAnswer, answered, opponentSelection, opponentName, mySelection }) {
  const [selected, setSelected] = useState(null);

  const activeIndex = question?.correctIndex !== undefined ? question.correctIndex : 4;

  const handleCellClick = (index) => {
    if (answered || selected !== null) return;
    setSelected(index);
    // Pass selectedIndex — GamePage/backend determines correctness
    onAnswer(index);
  };

  const getCellClass = (index) => {
    const classes = ['reaction-cell'];
    const activeIsSelected = selected !== null || mySelection !== null;
    const isMe = index === (selected !== null ? selected : mySelection);

    if (activeIsSelected) {
      if (index === activeIndex) classes.push('cell-correct');
      else if (isMe && index !== activeIndex) classes.push('cell-wrong');
    } else if (index === activeIndex) {
      classes.push('cell-active');
    }
    return classes.join(' ');
  };

  return (
    <div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', letterSpacing: 2, textAlign: 'center', marginBottom: '1.5rem' }}>
        TAP THE GLOWING TARGET
      </p>

      <div className="reaction-grid">
        {Array.from({ length: 9 }, (_, i) => {
          const isMe = i === (selected !== null ? selected : mySelection);
          const isOpp = opponentSelection === i;
          return (
            <button
              key={i}
              className={getCellClass(i)}
              onClick={() => handleCellClick(i)}
              disabled={answered}
              aria-label={`Target ${i + 1}`}
              style={{
                position: 'relative',
                border: isOpp ? '2px dashed #ef4444' : undefined,
                boxShadow: isOpp ? '0 0 12px rgba(239, 68, 68, 0.4)' : undefined,
                transition: 'all 0.2s ease'
              }}
            >
              {isOpp && (
                <span style={{
                  position: 'absolute',
                  bottom: '4px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '0.65rem',
                  background: 'rgba(239, 68, 68, 0.85)',
                  color: 'white',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  pointerEvents: 'none',
                  fontWeight: 600,
                  whiteSpace: 'nowrap'
                }}>
                  {opponentName?.substring(0, 8)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {(selected !== null || mySelection !== null) && (
        <p style={{ textAlign: 'center', marginTop: '0.5rem', color: (selected === activeIndex || mySelection === activeIndex) ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 600 }}>
          {(selected === activeIndex || mySelection === activeIndex) ? '✓ Correct target!' : '✗ Wrong target'}
        </p>
      )}
    </div>
  );
}
