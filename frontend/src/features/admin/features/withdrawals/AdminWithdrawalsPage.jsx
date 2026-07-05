import React, { useState } from 'react';
import AdminLayout from '../../../../shared/components/layout/AdminLayout.jsx';
import { PageHeader, Card, Table, Badge, Button, SearchBar } from '../../../../shared/components/ui/index.js';
import useWalletStore from '../../../../shared/store/walletStore.js';
import useAuthStore from '../../../../shared/store/authStore.js';

export default function AdminWithdrawalsPage() {
  const { withdrawals, approveWithdrawal, rejectWithdrawal, fetchAdminWithdrawals, loading } = useWalletStore();
  const { user, updateUserPreferences } = useAuthStore();
  const [search, setSearch] = useState('');
  const [actionId, setActionId] = useState(null);

  const showFullAddresses = user?.showFullAddresses ?? false;

  const toggleShowAddresses = async () => {
    await updateUserPreferences({ showFullAddresses: !showFullAddresses });
  };

  React.useEffect(() => {
    fetchAdminWithdrawals();
  }, [fetchAdminWithdrawals]);

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this withdrawal request? This will trigger the payout.')) {
      return;
    }
    setActionId(id);
    const res = await approveWithdrawal(id);
    setActionId(null);
    if (!res?.success) {
      alert(`Failed to approve withdrawal: ${res?.error || 'Unknown error'}`);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to reject this withdrawal request?')) {
      return;
    }
    setActionId(id);
    const res = await rejectWithdrawal(id);
    setActionId(null);
    if (!res?.success) {
      alert(`Failed to reject withdrawal: ${res?.error || 'Unknown error'}`);
    }
  };

  const columns = [
    { key: 'id', label: 'Ref', render: (v) => <code style={{ fontSize: '0.8rem' }}>{v.toUpperCase()}</code> },
    { key: 'user', label: 'User' },
    { key: 'amount', label: 'Amount', render: (v) => `${v} USDT` },
    { 
      key: 'address', 
      label: 'Address', 
      render: (v) => {
        if (!v) return '—';
        const displayVal = showFullAddresses ? v : `${v.substring(0, 6)}...${v.substring(v.length - 6)}`;
        return <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{displayVal}</code>;
      }
    },
    { key: 'network', label: 'Network' },
    { key: 'status', label: 'Status', render: (v) => <Badge status={v} /> },
    { key: 'createdAt', label: 'Requested', render: (v) => new Date(v).toLocaleDateString() },
    {
      key: 'actions', label: 'Actions',
      render: (_, row) => row.status === 'pending' ? (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button 
            variant="primary" 
            onClick={() => handleApprove(row.id)} 
            disabled={actionId !== null}
            style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
          >
            {actionId === row.id ? 'Approving...' : 'Approve'}
          </Button>
          <Button 
            variant="danger" 
            onClick={() => handleReject(row.id)} 
            disabled={actionId !== null}
            style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
          >
            Reject
          </Button>
        </div>
      ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>,
    },
  ];

  const filtered = withdrawals.filter((w) =>
    !search || 
    (w.user && w.user.toLowerCase().includes(search.toLowerCase())) || 
    (w.address && w.address.includes(search))
  );

  return (
    <AdminLayout>
      <PageHeader title="Withdrawal Requests" subtitle="Review and approve withdrawal requests before payout." />
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by user or address..." style={{ flex: 1 }} />
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <input 
              type="checkbox" 
              checked={showFullAddresses} 
              onChange={toggleShowAddresses} 
              style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
            />
            Show full crypto addresses
          </label>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', justifyContent: 'center', alignItems: 'center', minHeight: '200px', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>
            <div className="spinner" style={{ width: '32px', height: '32px', border: '3px solid var(--border)', borderTop: '3px solid var(--secondary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span>Loading withdrawals...</span>
          </div>
        ) : (
          <Table columns={columns} rows={filtered} emptyMessage="No withdrawal requests." />
        )}
      </Card>
    </AdminLayout>
  );
}
