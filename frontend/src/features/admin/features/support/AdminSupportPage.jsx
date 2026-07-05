import React, { useState } from 'react';
import AdminLayout from '../../../../shared/components/layout/AdminLayout.jsx';
import { PageHeader, Card, Table, Badge, Button, SearchBar } from '../../../../shared/components/ui/index.js';
import useWalletStore from '../../../../shared/store/walletStore.js';

export default function AdminSupportPage() {
  const { supportTickets, fetchAdminSupportTickets, resolveSupportTicket, loading } = useWalletStore();
  const [search, setSearch] = useState('');
  const [actionId, setActionId] = useState(null);

  React.useEffect(() => {
    fetchAdminSupportTickets();
  }, [fetchAdminSupportTickets]);

  const handleResolve = async (id) => {
    if (!window.confirm('Are you sure you want to mark this support ticket as resolved?')) {
      return;
    }
    setActionId(id);
    const res = await resolveSupportTicket(id);
    setActionId(null);
    if (!res?.success) {
      alert(`Failed to resolve ticket: ${res?.error || 'Unknown error'}`);
    }
  };

  const columns = [
    { key: 'createdAt', label: 'Received', render: (v) => new Date(v).toLocaleString() },
    { key: 'userName', label: 'User', render: (_, row) => (
      <div>
        <div style={{ fontWeight: 600 }}>{row.userName}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{row.userEmail}</div>
      </div>
    )},
    { key: 'subject', label: 'Subject', render: (v) => <span style={{ fontWeight: 600 }}>{v}</span> },
    { key: 'description', label: 'Description', render: (v) => (
      <div style={{ maxWidth: '300px', whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>{v}</div>
    )},
    { key: 'refId', label: 'Ref ID', render: (v) => v ? <code style={{ fontSize: '0.8rem' }}>{v}</code> : <span style={{ color: 'var(--text-muted)' }}>—</span> },
    { key: 'status', label: 'Status', render: (v) => <Badge status={v === 'resolved' ? 'approved' : 'pending'} label={v} /> },
    {
      key: 'actions', label: 'Actions',
      render: (_, row) => row.status === 'pending' ? (
        <Button 
          variant="primary" 
          onClick={() => handleResolve(row.id)} 
          disabled={actionId !== null}
          style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
        >
          {actionId === row.id ? 'Resolving...' : 'Resolve'}
        </Button>
      ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>,
    },
  ];

  const filtered = supportTickets.filter((t) =>
    !search || 
    (t.userName && t.userName.toLowerCase().includes(search.toLowerCase())) || 
    (t.userEmail && t.userEmail.toLowerCase().includes(search.toLowerCase())) ||
    (t.subject && t.subject.toLowerCase().includes(search.toLowerCase())) ||
    (t.description && t.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AdminLayout>
      <PageHeader title="Support Tickets" subtitle="View and manage messages sent to support by users." />
      <Card>
        <div style={{ marginBottom: '1.5rem' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search tickets by user, subject, or message..." />
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', justifyContent: 'center', alignItems: 'center', minHeight: '200px', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>
            <div className="spinner" style={{ width: '32px', height: '32px', border: '3px solid var(--border)', borderTop: '3px solid var(--secondary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span>Loading tickets...</span>
          </div>
        ) : (
          <Table columns={columns} rows={filtered} emptyMessage="No support tickets found." />
        )}
      </Card>
    </AdminLayout>
  );
}
