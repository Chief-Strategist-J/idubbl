import React from 'react';

export default function RoundHeader({ roundNo, totalRounds = 3, timeLeft, maxTime = 30, playerWins, opponentWins }) {
  const pct = (timeLeft / maxTime) * 100;
  const barColor = pct > 50 ? 'var(--accent-green)' : pct > 25 ? '#d97706' : '#dc2626';

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem' }}>
          Round {roundNo} of {totalRounds}
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {Array.from({ length: totalRounds }).map((_, i) => {
            const won = i < playerWins;
            return (
              <div key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: won ? 'var(--accent-green)' : 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.12)' }} />
            );
          })}
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: 4 }}>vs</span>
          {Array.from({ length: totalRounds }).map((_, i) => {
            const lost = i < opponentWins;
            return (
              <div key={i} style={{ width: 12, height: 12, borderRadius: '50%', background: lost ? '#dc2626' : 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.12)' }} />
            );
          })}
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem', color: pct < 25 ? '#dc2626' : 'var(--text-primary)' }}>
          {timeLeft}s
        </div>
      </div>

      <div style={{ height: 6, background: 'rgba(0,0,0,0.06)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 3, transition: 'width 1s linear, background 0.5s' }} />
      </div>
    </div>
  );
}
