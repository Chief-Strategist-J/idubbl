import { useEffect } from 'react';
import AdminLayout from '../../../../shared/components/layout/AdminLayout.jsx';
import { PageHeader, Card, Table, Badge, Stat } from '../../../../shared/components/ui/index.js';
import useMatchStore from '../../../../shared/store/matchStore.js';

const COLUMNS = [
  { key: 'refId', label: 'Match ID', render: (v) => <code style={{ fontSize: '0.85rem' }}>{v}</code> },
  { key: 'tier', label: 'Tier' },
  { key: 'player1', label: 'Player 1' },
  { key: 'player2', label: 'Player 2' },
  { key: 'status', label: 'Status', render: (v) => <Badge status={v} /> },
  { key: 'winner', label: 'Winner', render: (v) => v || <span style={{ color: 'var(--text-muted)' }}>In progress</span> },
  { key: 'prize', label: 'Prize', render: (v) => `${v} USDT` },
  { key: 'startedAt', label: 'Started', render: (v) => new Date(v).toLocaleTimeString() },
];

export default function AdminMatchesPage() {
  const { matches, tiers, fetchAdminMatches, loading } = useMatchStore();

  useEffect(() => {
    fetchAdminMatches();
  }, [fetchAdminMatches]);

  const active = matches.filter((m) => m.status === 'active');
  const completed = matches.filter((m) => m.status === 'completed');

  return (
    <AdminLayout>
      <PageHeader title="Live Matches" subtitle="View active matches, queue depths, and completed game history." />

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', justifyContent: 'center', alignItems: 'center', minHeight: '300px', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>
          <div className="spinner" style={{ width: '32px', height: '32px', border: '3px solid var(--border)', borderTop: '3px solid var(--secondary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <span>Loading live matches...</span>
        </div>
      ) : (
        <>
          <div className="admin-stats-grid" style={{ marginBottom: '2rem' }}>
            <Stat label="Active Matches" value={active.length} highlight />
            <Stat label="Completed Today" value={completed.length} />
            {tiers.map((t) => <Stat key={t.id} label={`${t.name} Queue`} value={`${t.waitingCount} waiting`} />)}
          </div>

          <Card style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1rem' }}>Active Matches</h3>
            <Table columns={COLUMNS} rows={active} emptyMessage="No active matches right now." />
          </Card>

          <Card>
            <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1rem' }}>Completed Matches</h3>
            <Table columns={COLUMNS} rows={completed} emptyMessage="No completed matches." />
          </Card>
        </>
      )}
    </AdminLayout>
  );
}
