import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../../shared/components/layout/AdminLayout.jsx';
import { PageHeader, Card, Table, Badge, Button, SearchBar } from '../../../../shared/components/ui/index.js';
import useWalletStore from '../../../../shared/store/walletStore.js';

const COLUMNS = (onSuspend) => [
  { key: 'id', label: 'ID', render: (v, row) => <code style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{(v || row._id || '').substring(0, 8)}</code> },
  { key: 'name', label: 'Name', render: (_, row) => row.name || `${row.firstName || ''} ${row.lastName || ''}`.trim() || 'No Name' },
  { key: 'email', label: 'Email' },
  { 
    key: 'balances', 
    label: 'Balances (USDT)', 
    render: (v) => v ? (
      <div style={{ fontSize: '0.85rem' }}>
        <span style={{ color: 'var(--accent-green)' }}>{v.availableBalance || 0}</span> avail / <span style={{ color: 'var(--text-muted)' }}>{v.lockedBalance || 0}</span> lock / <span style={{ color: 'var(--accent-warning)' }}>{v.pendingWithdrawals || 0}</span> pend
      </div>
    ) : '—' 
  },
  {
    key: 'personalWallets',
    label: 'On-Chain Wallets',
    render: (v) => v ? (
      <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', lineHeight: 1.3 }}>
        TRX: <span style={{ color: 'var(--accent-cyan)' }}>{v.tron ? v.tron.substring(0, 8) + '...' : '—'}</span><br />
        ETH: <span style={{ color: 'var(--accent-cyan)' }}>{v.ethereum ? v.ethereum.substring(0, 8) + '...' : '—'}</span>
      </div>
    ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>None</span>
  },
  { key: 'role', label: 'Role', render: (v) => <Badge status={v === 'admin' ? 'approved' : 'pending'} label={v} /> },
  { key: 'status', label: 'Status', render: (v) => <Badge status={v || 'active'} /> },
  { key: 'createdAt', label: 'Joined', render: (v) => new Date(v).toLocaleDateString() },
  {
    key: 'actions', label: 'Actions',
    render: (_, row) => {
      const status = row.status || 'active';
      return (
        <Button variant={status === 'active' ? 'danger' : 'secondary'} onClick={() => onSuspend(row.id || row._id)} style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}>
          {status === 'active' ? 'Suspend' : 'Reactivate'}
        </Button>
      );
    },
  },
];

export default function AdminUsersPage() {
  const { adminUsers, fetchAdminUsers, loading } = useWalletStore();
  const [search, setSearch] = useState('');
  const [localUsers, setLocalUsers] = useState([]);

  useEffect(() => {
    fetchAdminUsers();
  }, [fetchAdminUsers]);

  useEffect(() => {
    setLocalUsers(adminUsers);
  }, [adminUsers]);

  const toggleSuspend = (id) => {
    setLocalUsers((prev) => 
      prev.map((u) => {
        const uId = u.id || u._id;
        if (uId === id) {
          const newStatus = (u.status || 'active') === 'active' ? 'suspended' : 'active';
          return { ...u, status: newStatus };
        }
        return u;
      })
    );
  };

  const filtered = localUsers.filter((u) => {
    const name = u.name || `${u.firstName || ''} ${u.lastName || ''}`;
    const email = u.email || '';
    return !search || `${name} ${email}`.toLowerCase().includes(search.toLowerCase());
  });

  const totalPersonalWallets = localUsers.filter(u => u.personalWallets && (u.personalWallets.tron || u.personalWallets.ethereum)).length;

  return (
    <AdminLayout>
      <PageHeader title="Users" subtitle="Search, view, and manage player accounts." />
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <Card style={{ padding: '1rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 0.25rem 0' }}>Total Registered Users</p>
          <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>{localUsers.length}</h2>
        </Card>
        <Card style={{ padding: '1rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 0.25rem 0' }}>Generated Crypto Wallets</p>
          <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-green)' }}>{totalPersonalWallets}</h2>
        </Card>
      </div>

      <Card>
        <div style={{ marginBottom: '1.5rem' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by name or email..." />
        </div>
        
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', justifyContent: 'center', alignItems: 'center', minHeight: '200px', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>
            <div className="spinner" style={{ width: '32px', height: '32px', border: '3px solid var(--border)', borderTop: '3px solid var(--secondary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span>Loading users...</span>
          </div>
        ) : (
          <Table columns={COLUMNS(toggleSuspend)} rows={filtered} emptyMessage="No users found." />
        )}
      </Card>
    </AdminLayout>
  );
}
