import React from 'react';

export default function ScoreBoard({ playerName, opponentName, playerScore, opponentScore }) {
  return (
    <div className="arena-versus" style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>
      <div style={{ textAlign: 'center', minWidth: 120 }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 4 }}>You</p>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>{playerName}</p>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem', color: 'var(--accent-cyan)' }}>{playerScore}</p>
      </div>

      <div className="vs-badge" style={{ margin: '0 1rem' }}>VS</div>

      <div style={{ textAlign: 'center', minWidth: 120 }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: 4 }}>Opponent</p>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>{opponentName}</p>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem', color: 'var(--secondary)' }}>{opponentScore}</p>
      </div>
    </div>
  );
}
