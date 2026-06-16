import React from 'react';
import { Badge } from '../../../shared/components/ui/index.js';

export default function RoundSummary({ rounds }) {
  return (
    <div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: '1rem' }}>Round Breakdown</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {rounds.map((r) => {
          const isPlayerWin = r.winner === 'Alex Storm';
          return (
            <div key={r.roundNo} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 10 }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Round {r.roundNo}</span>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>{r.score}</span>
              <Badge status={isPlayerWin ? 'win' : 'loss'} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
