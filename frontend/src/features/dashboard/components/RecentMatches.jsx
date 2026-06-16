import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Table, Button, EmptyState } from '../../../shared/components/ui/index.js';
import useMatchStore from '../../../shared/store/matchStore.js';

const COLUMNS = [
  { key: 'refId', label: 'Match ID' },
  { key: 'tier', label: 'Tier' },
  { key: 'opponent', label: 'Opponent' },
  { key: 'result', label: 'Result', render: (_, row) => <Badge status={row.winnerId === 'u1' ? 'win' : 'loss'} /> },
  { key: 'prize', label: 'Prize', render: (v, row) => row.winnerId === 'u1' ? <span style={{ color: 'var(--accent-green)' }}>+{v} USDT</span> : <span style={{ color: '#f87171' }}>-{row.entryFee} USDT</span> },
];

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>Recent Matches</h3>
        <Button variant="ghost" onClick={() => navigate('/transactions')}>View all</Button>
      </div>
      <Table columns={COLUMNS} rows={rows} />
    </div>
  );
}
