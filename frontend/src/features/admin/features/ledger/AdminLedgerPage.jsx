import React, { useState } from 'react';
import AdminLayout from '../../../../shared/components/layout/AdminLayout.jsx';
import { PageHeader, Card, Table, Badge, SearchBar, Select } from '../../../../shared/components/ui/index.js';
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
  { key: 'refId', label: 'Ref ID', render: (v) => <code style={{ fontSize: '0.8rem' }}>{v}</code> },
  { key: 'description', label: 'Description' },
  { key: 'type', label: 'Type', render: (v) => <Badge status="pending" label={v.replace('_', ' ')} /> },
  { key: 'amount', label: 'Amount', render: (v) => <span style={{ fontWeight: 700, color: v > 0 ? 'var(--accent-green)' : '#f87171' }}>{v > 0 ? `+${v}` : v} USDT</span> },
  { key: 'status', label: 'Status', render: (v) => <Badge status={v} /> },
  { key: 'date', label: 'Date', render: (v) => new Date(v).toLocaleString() },
];

export default function AdminLedgerPage() {
  const { transactions } = useWalletStore();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const filtered = transactions.filter((t) => {
    const matchSearch = !search || t.refId.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || t.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <AdminLayout>
      <PageHeader title="System Ledger" subtitle="Read-only view of all wallet movements across the platform." />
      <Card>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by ref ID or description..." style={{ flex: 1 }} />
          <div style={{ minWidth: 200 }}>
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} options={TYPE_OPTIONS} />
          </div>
        </div>
        <Table columns={COLUMNS} rows={filtered} emptyMessage="No ledger entries." />
      </Card>
    </AdminLayout>
  );
}
