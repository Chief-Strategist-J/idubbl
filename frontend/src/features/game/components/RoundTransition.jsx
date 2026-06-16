import React from 'react';

export default function RoundTransition({ round, playerWins, opponentWins }) {
  if (!round) return null;

  const isPlayerWin = round.winner === 'Alex Storm';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem',
    }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', letterSpacing: 2 }}>ROUND {round.roundNo} RESULT</p>

      <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 6vw, 3.5rem)', fontWeight: 800, color: isPlayerWin ? 'var(--accent-green)' : '#f87171' }}>
        {isPlayerWin ? 'You won the round!' : 'Opponent won the round'}
      </div>

      <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
        Score: <strong>{round.playerScore}</strong> – <strong>{round.opponentScore}</strong>
      </p>

      <div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Your wins</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>{playerWins}</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Opp wins</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: 'var(--secondary)' }}>{opponentWins}</p>
        </div>
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Next round starting...</p>
    </div>
  );
}
