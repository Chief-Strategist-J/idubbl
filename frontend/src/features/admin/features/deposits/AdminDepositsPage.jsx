import { useState, useEffect } from 'react';
import AdminLayout from '../../../../shared/components/layout/AdminLayout.jsx';
import { PageHeader, Card, Table, Badge, Button, SearchBar } from '../../../../shared/components/ui/index.js';
import useWalletStore from '../../../../shared/store/walletStore.js';
import useAuthStore from '../../../../shared/store/authStore.js';

const COLUMNS = (onApprove, onReject, showFullAddresses) => [
  { key: 'id', label: 'Ref', render: (v) => <code style={{ fontSize: '0.8rem' }}>{v.toUpperCase()}</code> },
  { key: 'user', label: 'User' },
  { key: 'amount', label: 'Amount', render: (v) => `${v} USDT` },
  { key: 'network', label: 'Network' },
  { 
    key: 'txHash', 
    label: 'TX Hash', 
    render: (v) => {
      if (!v) return '—';
      const displayVal = showFullAddresses ? v : `${v.substring(0, 6)}...${v.substring(v.length - 6)}`;
      return <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)', wordBreak: 'break-all', maxWidth: '200px', display: 'inline-block' }}>{displayVal}</code>;
    }
  },
  { key: 'status', label: 'Status', render: (v) => <Badge status={v} /> },
  { key: 'createdAt', label: 'Date', render: (v) => new Date(v).toLocaleDateString() },
  {
    key: 'actions', label: 'Actions',
    render: (_, row) => {
      if (row.status === 'pending') {
        return (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button variant="primary" onClick={() => onApprove(row.id, row.userId)} style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}>Approve</Button>
            <Button variant="danger" onClick={() => onReject(row.id, row.userId)} style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}>Reject</Button>
          </div>
        );
      }
      const colors = { approved: { bg: '#0d2e1a', border: '#16a34a', text: '#4ade80' }, rejected: { bg: '#2e0d0d', border: '#dc2626', text: '#f87171' } };
      const c = colors[row.status] || { bg: 'var(--bg-darker)', border: 'var(--border)', text: 'var(--text-muted)' };
      return (
        <span style={{ padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700, background: c.bg, border: `1px solid ${c.border}`, color: c.text, textTransform: 'capitalize', letterSpacing: '0.03em' }}>
          {row.status}
        </span>
      );
    }
  },
];

export default function AdminDepositsPage() {
  const { deposits, approveDeposit, rejectDeposit, fetchAdminDeposits, loading } = useWalletStore();
  const { user, updateUserPreferences } = useAuthStore();
  const [search, setSearch] = useState('');
  
  const showFullAddresses = user?.showFullAddresses ?? false;

  const toggleShowAddresses = async () => {
    await updateUserPreferences({ showFullAddresses: !showFullAddresses });
  };

  useEffect(() => {
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by user, tx hash, ref ID..." style={{ flex: 1 }} />
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <input 
              type="checkbox" 
              checked={showFullAddresses} 
              onChange={toggleShowAddresses} 
              style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
            />
            Show full TX Hashes
          </label>
        </div>
        
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', justifyContent: 'center', alignItems: 'center', minHeight: '200px', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>
            <div className="spinner" style={{ width: '32px', height: '32px', border: '3px solid var(--border)', borderTop: '3px solid var(--secondary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span>Loading deposits...</span>
          </div>
        ) : (
          <Table
            columns={COLUMNS(approveDeposit, rejectDeposit, showFullAddresses)}
            rows={filtered}
            emptyMessage="No deposit requests found."
          />
        )}
      </Card>
    </AdminLayout>
  );
}
