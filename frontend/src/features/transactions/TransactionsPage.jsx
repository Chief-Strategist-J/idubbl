import React, { useState } from 'react';
import AppLayout from '../../shared/components/layout/AppLayout.jsx';
import { PageHeader, Card, Table, Badge, SearchBar, Select } from '../../shared/components/ui/index.js';
import useWalletStore from '../../shared/store/walletStore.js';

const TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'deposit', label: 'Deposits' },
  { value: 'winnings', label: 'Winnings' },
  { value: 'match_reserve', label: 'Match Reserve' },
  { value: 'match_loss', label: 'Match Loss' },
  { value: 'withdrawal', label: 'Withdrawals' },
  { value: 'refund', label: 'Refunds' },
];

const COLUMNS = [
  { key: 'refId', label: 'Ref ID', render: (v) => <code style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{v}</code> },
  { key: 'description', label: 'Description' },
  { key: 'type', label: 'Type', render: (v) => <Badge status={v === 'winnings' || v === 'deposit' ? 'approved' : v === 'match_loss' || v === 'withdrawal' ? 'rejected' : 'pending'} label={v.replace('_', ' ')} /> },
  { key: 'amount', label: 'Amount', render: (v) => <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: v > 0 ? 'var(--accent-green)' : '#f87171' }}>{v > 0 ? `+${v}` : v} USDT</span> },
  { key: 'status', label: 'Status', render: (v) => <Badge status={v} /> },
  { key: 'date', label: 'Date', render: (v) => new Date(v).toLocaleString() },
];

export default function TransactionsPage() {
  const { transactions } = useWalletStore();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const filtered = transactions.filter((t) => {
    const matchesSearch = !search || t.refId.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = !typeFilter || t.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <AppLayout>
      <PageHeader title="Transaction History" subtitle="All wallet activity is recorded here." />

      <Card>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by ref ID or description..." style={{ flex: 1, minWidth: 220 }} />
          <div style={{ minWidth: 200 }}>
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} options={TYPE_OPTIONS} />
          </div>
        </div>

        <Table columns={COLUMNS} rows={filtered} emptyMessage="No transactions match your filters." />
      </Card>
    </AppLayout>
  );
}
