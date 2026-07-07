import React, { useState, useEffect } from 'react';

export default function ReactionRace({ onAnswer, answered }) {
  const [activeIndex, setActiveIndex] = useState(4);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setActiveIndex(Math.floor(Math.random() * 9));
  }, []);

  const handleCellClick = (index) => {
    if (answered || selected !== null) return;
    setSelected(index);
    // Pass only selectedIndex — GamePage/backend determines correctness
    onAnswer(index);
  };

  const getCellClass = (index) => {
    const classes = ['reaction-cell'];
    if (selected !== null) {
      if (index === activeIndex) classes.push('cell-correct');
      else if (index === selected && index !== activeIndex) classes.push('cell-wrong');
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
        {Array.from({ length: 9 }, (_, i) => (
          <button
            key={i}
            className={getCellClass(i)}
            onClick={() => handleCellClick(i)}
            disabled={answered}
            aria-label={`Target ${i + 1}`}
          />
        ))}
      </div>

      {selected !== null && (
        <p style={{ textAlign: 'center', marginTop: '0.5rem', color: selected === activeIndex ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 600 }}>
          {selected === activeIndex ? '✓ Correct target!' : '✗ Wrong target'}
        </p>
      )}
    </div>
  );
}
