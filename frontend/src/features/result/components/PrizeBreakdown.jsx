import React from 'react';

export default function PrizeBreakdown({ entryFee, rake, prize, isWinner }) {
  const pool = entryFee * 2;

  return (
    <div style={{ background: 'rgba(0,0,0,0.03)', borderRadius: 12, padding: '1.25rem' }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: '1rem' }}>Prize Breakdown</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {[
          { label: 'Total pool', value: `${pool} USDT` },
          { label: 'Platform fee', value: `-${rake} USDT`, color: '#dc2626' },
          { label: 'Net prize', value: `${pool - rake} USDT`, color: 'var(--accent-cyan)', bold: true },
        ].map((row) => (
          <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{row.label}</span>
            <span style={{ fontFamily: row.bold ? 'var(--font-display)' : undefined, fontWeight: row.bold ? 700 : 500, fontSize: row.bold ? '1.1rem' : '0.9rem', color: row.color || 'var(--text-primary)' }}>
              {row.value}
            </span>
          </div>
        ))}
        <div style={{ borderTop: '1px solid var(--border)', marginTop: '0.5rem', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600 }}>You {isWinner ? 'receive' : 'lost'}</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem', color: isWinner ? 'var(--accent-green)' : '#dc2626' }}>
            {isWinner ? `+${prize}` : `-${entryFee}`} USDT
          </span>
        </div>
      </div>
    </div>
  );
}
