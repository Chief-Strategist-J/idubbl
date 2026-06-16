import React, { useState } from 'react';
import AdminLayout from '../../../../shared/components/layout/AdminLayout.jsx';
import { PageHeader, Card, Table, Badge, Button, SearchBar } from '../../../../shared/components/ui/index.js';
import { MOCK_USERS } from '../../../../shared/mock/index.js';

const COLUMNS = (onSuspend) => [
  { key: 'id', label: 'ID', render: (v) => <code style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{v}</code> },
  { key: 'firstName', label: 'Name', render: (_, row) => `${row.firstName} ${row.lastName}` },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'role', label: 'Role', render: (v) => <Badge status={v === 'admin' ? 'approved' : 'pending'} label={v} /> },
  { key: 'status', label: 'Status', render: (v) => <Badge status={v} /> },
  { key: 'createdAt', label: 'Joined', render: (v) => new Date(v).toLocaleDateString() },
  {
    key: 'actions', label: 'Actions',
    render: (_, row) => (
      <Button variant={row.status === 'active' ? 'danger' : 'secondary'} onClick={() => onSuspend(row.id)} style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}>
        {row.status === 'active' ? 'Suspend' : 'Reactivate'}
      </Button>
    ),
  },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState(MOCK_USERS);
  const [search, setSearch] = useState('');

  const toggleSuspend = (id) => {
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, status: u.status === 'active' ? 'suspended' : 'active' } : u));
  };

  const filtered = users.filter((u) =>
    !search || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <PageHeader title="Users" subtitle="Search, view, and manage player accounts." />
      <Card>
        <div style={{ marginBottom: '1.5rem' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by name or email..." />
        </div>
        <Table columns={COLUMNS(toggleSuspend)} rows={filtered} emptyMessage="No users found." />
      </Card>
    </AdminLayout>
  );
}
