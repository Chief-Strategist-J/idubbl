import React, { useState } from 'react';
import AdminLayout from '../../../../shared/components/layout/AdminLayout.jsx';
import { PageHeader, Card, Table, Badge, Button, SearchBar } from '../../../../shared/components/ui/index.js';
import useWalletStore from '../../../../shared/store/walletStore.js';

const COLUMNS = (onApprove, onReject) => [
  { key: 'id', label: 'Ref', render: (v) => <code style={{ fontSize: '0.8rem' }}>{v.toUpperCase()}</code> },
  { key: 'user', label: 'User' },
  { key: 'amount', label: 'Amount', render: (v) => `${v} USDT` },
  { key: 'address', label: 'Address', render: (v) => <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v}</code> },
  { key: 'network', label: 'Network' },
  { key: 'status', label: 'Status', render: (v) => <Badge status={v} /> },
  { key: 'createdAt', label: 'Requested', render: (v) => new Date(v).toLocaleDateString() },
  {
    key: 'actions', label: 'Actions',
    render: (_, row) => row.status === 'pending' ? (
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Button variant="primary" onClick={() => onApprove(row.id)} style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}>Approve</Button>
        <Button variant="danger" onClick={() => onReject(row.id)} style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}>Reject</Button>
      </div>
    ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>,
  },
];

export default function AdminWithdrawalsPage() {
  const { withdrawals, approveWithdrawal, rejectWithdrawal } = useWalletStore();
  const [search, setSearch] = useState('');

  const filtered = withdrawals.filter((w) =>
    !search || w.user.toLowerCase().includes(search.toLowerCase()) || w.address.includes(search)
  );

  return (
    <AdminLayout>
      <PageHeader title="Withdrawal Requests" subtitle="Review and approve withdrawal requests before payout." />
      <Card>
        <div style={{ marginBottom: '1.5rem' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by user or address..." />
        </div>
        <Table columns={COLUMNS(approveWithdrawal, rejectWithdrawal)} rows={filtered} emptyMessage="No withdrawal requests." />
      </Card>
    </AdminLayout>
  );
}
