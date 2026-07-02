import React, { useState } from 'react';
import AdminLayout from '../../../../shared/components/layout/AdminLayout.jsx';
import { PageHeader, Card, Table, Badge, Button, Modal, SearchBar } from '../../../../shared/components/ui/index.js';
import useWalletStore from '../../../../shared/store/walletStore.js';

const COLUMNS = (onApprove, onReject) => [
  { key: 'id', label: 'Ref', render: (v) => <code style={{ fontSize: '0.8rem' }}>{v.toUpperCase()}</code> },
  { key: 'user', label: 'User' },
  { key: 'amount', label: 'Amount', render: (v) => `${v} USDT` },
  { key: 'network', label: 'Network' },
  { key: 'txHash', label: 'TX Hash', render: (v) => <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)', wordBreak: 'break-all', maxWidth: '200px', display: 'inline-block' }}>{v}</code> },
  { key: 'status', label: 'Status', render: (v) => <Badge status={v} /> },
  { key: 'createdAt', label: 'Date', render: (v) => new Date(v).toLocaleDateString() },
  {
    key: 'actions', label: 'Actions',
    render: (_, row) => row.status === 'pending' ? (
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <Button variant="primary" onClick={() => onApprove(row.id, row.userId)} style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}>Approve</Button>
        <Button variant="danger" onClick={() => onReject(row.id, row.userId)} style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}>Reject</Button>
      </div>
    ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>,
  },
];

export default function AdminDepositsPage() {
  const { deposits, approveDeposit, rejectDeposit, fetchAdminDeposits, loading } = useWalletStore();
  const [search, setSearch] = useState('');

  React.useEffect(() => {
    fetchAdminDeposits();
  }, [fetchAdminDeposits]);

  const filtered = deposits.filter((d) =>
    !search || 
    (d.user && d.user.toLowerCase().includes(search.toLowerCase())) || 
    (d.txHash && d.txHash.includes(search)) || 
    (d.id && d.id.includes(search))
  );

  return (
    <AdminLayout>
      <PageHeader title="Deposit Requests" subtitle="Review, approve, or reject USDT deposit submissions." />

      <Card>
        <div style={{ marginBottom: '1.5rem' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by user, tx hash, ref ID..." />
        </div>
        
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', justifyContent: 'center', alignItems: 'center', minHeight: '200px', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>
            <div className="spinner" style={{ width: '32px', height: '32px', border: '3px solid var(--border)', borderTop: '3px solid var(--secondary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span>Loading deposits...</span>
          </div>
        ) : (
          <Table
            columns={COLUMNS(approveDeposit, rejectDeposit)}
            rows={filtered}
            emptyMessage="No deposit requests found."
          />
        )}
      </Card>
    </AdminLayout>
  );
}
