import React from 'react';

export default function RoundHeader({ roundNo, totalRounds = 3, timeLeft, maxTime = 30, playerWins, opponentWins }) {
  const pct = (timeLeft / maxTime) * 100;
  const barColor = pct > 50 ? 'var(--accent-green)' : pct > 25 ? 'var(--accent-warning)' : 'var(--accent-red)';

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem' }}>
          Round {roundNo} of {totalRounds}
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {Array.from({ length: totalRounds }).map((_, i) => {
            const won = i < playerWins;
            return (
              <div key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: won ? 'var(--accent-green)' : 'var(--glass-bg-hover)', border: '1px solid var(--border)' }} />
            );
          })}
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: 4 }}>vs</span>
          {Array.from({ length: totalRounds }).map((_, i) => {
            const lost = i < opponentWins;
            return (
              <div key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: lost ? 'var(--accent-red)' : 'var(--glass-bg-hover)', border: '1px solid var(--border)' }} />
            );
          })}
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: pct < 25 ? 'var(--accent-red)' : 'var(--text-primary)' }}>
          {timeLeft}s
        </div>
      </div>

      <div style={{ height: 6, background: 'var(--glass-bg)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 3, transition: 'width 1s linear, background 0.5s' }} />
      </div>
    </div>
  );
}
