import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, EmptyState } from '../../../shared/components/ui/index.js';
import useMatchStore from '../../../shared/store/matchStore.js';

export default function RecentMatches() {
  const navigate = useNavigate();
  const { matches } = useMatchStore();

  const rows = matches
    .filter((m) => m.status === 'completed')
    .slice(0, 5)
    .map((m) => ({
      ...m,
      opponent: m.player1 === 'Alex Storm' ? m.player2 : m.player1,
      entryFee: 5,
    }));

  if (!rows.length) return <EmptyState message="No matches played yet. Join a tier to start." icon="⚔️" />;

  return (
    <div>
      <div className="recent-matches-header">
        <h3 className="recent-matches-title">Recent Matches</h3>
        <Button variant="ghost" onClick={() => navigate('/transactions')}>View all</Button>
      </div>

      {/* Mobile card list */}
      <div className="match-card-list">
        {rows.map((row, i) => (
          <div key={row.id || i} className="match-card">
            <div className="match-card-left">
              <span className="match-card-id">#{row.refId || `M${i + 1}`}</span>
              <span className="match-card-tier">{row.tier}</span>
            </div>
            <div className="match-card-center">
              <span className="match-card-vs">vs</span>
              <span className="match-card-opponent">{row.opponent}</span>
            </div>
            <div className="match-card-right">
              <Badge status={row.winnerId === 'u1' ? 'win' : 'loss'} />
              {row.winnerId === 'u1'
                ? <span className="match-prize win">+{row.prize} USDT</span>
                : <span className="match-prize loss">-{row.entryFee} USDT</span>
              }
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table (hidden on mobile, shown via CSS) */}
      <div className="match-table-wrap">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Match ID</th>
              <th>Tier</th>
              <th>Opponent</th>
              <th>Result</th>
              <th>Prize</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.id || i}>
                <td><code style={{ fontSize: '0.85rem', fontWeight: 500 }}>#{row.refId || `M${i + 1}`}</code></td>
                <td style={{ textTransform: 'capitalize', fontWeight: 500 }}>{row.tier}</td>
                <td>{row.opponent}</td>
                <td><Badge status={row.winnerId === 'u1' ? 'win' : 'loss'} /></td>
                <td style={{ fontWeight: 600 }}>
                  {row.winnerId === 'u1'
                    ? <span style={{ color: 'var(--accent-green)' }}>+{row.prize} USDT</span>
                    : <span style={{ color: '#dc2626' }}>-{row.entryFee} USDT</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
