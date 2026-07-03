import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../../shared/components/layout/AdminLayout.jsx';
import { PageHeader, Card, Table, Badge, SearchBar, Select, Stat } from '../../../../shared/components/ui/index.js';
import useWalletStore from '../../../../shared/store/walletStore.js';

const TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'deposit', label: 'Deposits' },
  { value: 'winnings', label: 'Winnings' },
  { value: 'match_reserve', label: 'Match Reserve' },
  { value: 'match_loss', label: 'Match Loss' },
  { value: 'withdrawal', label: 'Withdrawals' },
];

const COLUMNS = [
  { key: 'refId', label: 'Ref ID', render: (v, row) => <code style={{ fontSize: '0.8rem' }}>{v || row.txHash?.substring(0, 10) || row.id || row._id}</code> },
  { key: 'description', label: 'Description', render: (v, row) => v || `${row.type?.toUpperCase()} - ${row.network || ''}` },
  { key: 'type', label: 'Type', render: (v) => <Badge status="pending" label={v ? v.replace('_', ' ') : 'transaction'} /> },
  { key: 'amount', label: 'Amount', render: (v) => <span style={{ fontWeight: 700, color: v > 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>{v > 0 ? `+${v}` : v} USDT</span> },
  { key: 'status', label: 'Status', render: (v) => <Badge status={v || 'completed'} /> },
  { key: 'createdAt', label: 'Date', render: (v) => new Date(v).toLocaleString() },
];

export default function AdminLedgerPage() {
  const { transactions, platformRevenue, totalFees, fetchAdminLedger, loading } = useWalletStore();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    fetchAdminLedger();
  }, [fetchAdminLedger]);

  const filtered = transactions.filter((t) => {
    const ref = t.refId || t.txHash || t.id || t._id || '';
    const desc = t.description || t.type || '';
    const matchSearch = !search || ref.toLowerCase().includes(search.toLowerCase()) || desc.toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || t.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <AdminLayout>
      <PageHeader title="System Ledger" subtitle="Read-only view of all wallet movements across the platform." />

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', justifyContent: 'center', alignItems: 'center', minHeight: '300px', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>
          <div className="spinner" style={{ width: '32px', height: '32px', border: '3px solid var(--border)', borderTop: '3px solid var(--secondary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <span>Loading ledger logs...</span>
        </div>
      ) : (
        <>
          <div className="admin-stats-grid" style={{ marginBottom: '2rem' }}>
            <Stat label="Platform Revenue" value={`${platformRevenue || 0} USDT`} highlight />
            <Stat label="Total Rake & Fees" value={`${totalFees || 0} USDT`} />
            <Stat label="Total Logged Movements" value={filtered.length} />
          </div>

          <Card>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <SearchBar value={search} onChange={setSearch} placeholder="Search by ref ID or description..." style={{ flex: 1 }} />
              <div style={{ flex: 1, minWidth: 200 }}>
                <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} options={TYPE_OPTIONS} />
              </div>
            </div>
            <Table columns={COLUMNS} rows={filtered} emptyMessage="No ledger entries." />
          </Card>
        </>
      )}
    </AdminLayout>
  );
}
