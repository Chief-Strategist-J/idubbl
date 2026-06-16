import React, { useState } from 'react';
import AdminLayout from '../../../../shared/components/layout/AdminLayout.jsx';
import { PageHeader, Card, Table, Badge, Button, Modal, SearchBar } from '../../../../shared/components/ui/index.js';
import useWalletStore from '../../../../shared/store/walletStore.js';

const COLUMNS = (onApprove, onReject) => [
  { key: 'id', label: 'Ref', render: (v) => <code style={{ fontSize: '0.8rem' }}>{v.toUpperCase()}</code> },
  { key: 'user', label: 'User' },
  { key: 'amount', label: 'Amount', render: (v) => `${v} USDT` },
  { key: 'network', label: 'Network' },
  { key: 'txHash', label: 'TX Hash', render: (v) => <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.slice(0, 18)}...</code> },
  { key: 'status', label: 'Status', render: (v) => <Badge status={v} /> },
  { key: 'createdAt', label: 'Date', render: (v) => new Date(v).toLocaleDateString() },
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

export default function AdminDepositsPage() {
  const { deposits, approveDeposit, rejectDeposit } = useWalletStore();
  const [search, setSearch] = useState('');

  const filtered = deposits.filter((d) =>
    !search || d.user.toLowerCase().includes(search.toLowerCase()) || d.txHash.includes(search) || d.id.includes(search)
  );

  return (
    <AdminLayout>
      <PageHeader title="Deposit Requests" subtitle="Review, approve, or reject USDT deposit submissions." />

      <Card>
        <div style={{ marginBottom: '1.5rem' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by user, tx hash, ref ID..." />
        </div>
        <Table
          columns={COLUMNS(approveDeposit, rejectDeposit)}
          rows={filtered}
          emptyMessage="No deposit requests found."
        />
      </Card>
    </AdminLayout>
  );
}
