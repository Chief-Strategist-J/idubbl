import React from 'react';
import useAuthStore from '../../../shared/store/authStore.js';

export default function RoundTransition({ round, playerWins, opponentWins, question, opponentName }) {
  const { user } = useAuthStore();
  if (!round) return null;

  const isPlayerWin = round.winner === (user?.name || 'You');
  const isTie = round.winner === 'tie' || round.winner === 'draw';

  const getOptionLetter = (idx) => {
    if (idx === null || idx === undefined || idx < 0) return 'None';
    return String.fromCharCode(65 + idx);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem',
    }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', letterSpacing: 2 }}>ROUND {round.roundNo} RESULT</p>

      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(2rem, 6vw, 3.5rem)',
        fontWeight: 800,
        color: isTie ? 'var(--text-secondary)' : (isPlayerWin ? 'var(--accent-green)' : 'var(--accent-red)')
      }}>
        {isTie ? "It's a tie!" : (isPlayerWin ? 'You won the round!' : `${opponentName || 'Opponent'} won the round`)}
      </div>

      <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
        Score: <strong>{round.playerScore}</strong> – <strong>{round.opponentScore}</strong>
      </p>

      {question && question.options && round.correctIndex !== undefined && (
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '1.25rem',
          maxWidth: '90%',
          width: '420px',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          margin: '0.5rem 0'
        }}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
            Question: <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{question.question || question.word || question.expression}</span>
          </p>
          <div style={{ height: '1px', background: 'var(--border)' }} />
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--accent-green)', fontWeight: 600 }}>
            Correct Answer: {getOptionLetter(round.correctIndex)}. {question.options[round.correctIndex]}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.25rem' }}>
            <div style={{
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              background: round.playerCorrect ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
              border: round.playerCorrect ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(239,68,68,0.2)'
            }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>You chose</p>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', fontWeight: 600, color: round.playerCorrect ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                {getOptionLetter(round.playerSelection)} {round.playerCorrect ? '✓' : '✗'}
              </p>
            </div>
            <div style={{
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              background: round.opponentCorrect ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
              border: round.opponentCorrect ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(239,68,68,0.2)'
            }}>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>{opponentName || 'Opponent'} chose</p>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', fontWeight: 600, color: round.opponentCorrect ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                {getOptionLetter(round.opponentSelection)} {round.opponentCorrect ? '✓' : '✗'}
              </p>
            </div>
          </div>
        </div>
      )}

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
