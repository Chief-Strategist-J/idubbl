import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, EmptyState } from '../../../shared/components/ui/index.js';
import useMatchStore from '../../../shared/store/matchStore.js';
import useAuthStore from '../../../shared/store/authStore.js';

export default function RecentMatches() {
  const navigate = useNavigate();
  const { matches } = useMatchStore();
  const { user } = useAuthStore();

  const currentUserId = user?.id || 'u1';
  const currentUserName = user?.name || 'Alex Storm';

  const rows = matches
    .filter((m) => {
      if (m.status !== 'completed') return false;
      const isP1 = m.player1 === currentUserName || m.player1 === 'You' || m.player1Id === currentUserId || (m.players && m.players[0] === currentUserId);
      const isP2 = m.player2 === currentUserName || m.player2 === 'You' || m.player2Id === currentUserId || (m.players && m.players[1] === currentUserId);
      return isP1 || isP2;
    })
    .slice(0, 5)
    .map((m) => {
      let opponent = 'Opponent';
      const entryFee = m.entryFee || 5;
      
      if (m.players && m.playerNames) {
        const oppId = m.players.find(pId => pId !== currentUserId);
        opponent = m.playerNames[oppId] || 'Opponent';
      } else {
        const isP1 = m.player1 === currentUserName || m.player1 === 'You';
        opponent = isP1 ? m.player2 : m.player1;
      }

      return {
        ...m,
        opponent,
        entryFee,
      };
    });

  if (!rows.length) return <EmptyState message="No matches played yet. Join a tier to start." icon="⚔️" />;

  return (
    <div>
      <div className="recent-matches-header">
        <h3 className="recent-matches-title">Recent Matches</h3>
        <Button variant="ghost" onClick={() => navigate('/transactions')}>View all</Button>
      </div>

      {/* Mobile card list */}
      <div className="match-card-list">
        {rows.map((row, i) => {
          const isWinner = row.winnerId === currentUserId || row.winner === currentUserId || row.winner === currentUserName || row.winner === 'You';
          return (
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
                <Badge status={isWinner ? 'win' : 'loss'} />
                {isWinner
                  ? <span className="match-prize win">+{row.prize} USDT</span>
                  : <span className="match-prize loss">-{row.entryFee} USDT</span>
                }
              </div>
            </div>
          );
        })}
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
            {rows.map((row, i) => {
              const isWinner = row.winnerId === currentUserId || row.winner === currentUserId || row.winner === currentUserName || row.winner === 'You';
              return (
                <tr key={row.id || i}>
                  <td>#{row.refId || `M${i + 1}`}</td>
                  <td>{row.tier}</td>
                  <td>{row.opponent}</td>
                  <td><Badge status={isWinner ? 'win' : 'loss'} /></td>
                  <td>
                    {isWinner
                      ? <span style={{ color: 'var(--accent-green)' }}>+{row.prize} USDT</span>
                      : <span style={{ color: 'var(--accent-red)' }}>-{row.entryFee} USDT</span>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
