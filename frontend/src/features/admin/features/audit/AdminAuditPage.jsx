import { useState } from 'react';
import AdminLayout from '../../../../shared/components/layout/AdminLayout.jsx';
import { PageHeader, Card, Table, Badge, SearchBar } from '../../../../shared/components/ui/index.js';

const MOCK_AUDIT = [
  { id: 'a1', actor: 'admin1 (Sam Admin)', action: 'approve_deposit', entity: 'Deposit D-001', metadata: 'Amount: 50 USDT · User: Alex Storm', createdAt: '2026-06-15T08:05:00Z' },
  { id: 'a2', actor: 'admin1 (Sam Admin)', action: 'reject_deposit', entity: 'Deposit D-003', metadata: 'Reason: Unverified hash · User: Jordan Wick', createdAt: '2026-06-14T14:10:00Z' },
  { id: 'a3', actor: 'admin1 (Sam Admin)', action: 'approve_withdrawal', entity: 'Withdrawal W-002', metadata: 'Amount: 9 USDT · User: Maya Chen', createdAt: '2026-06-15T15:05:00Z' },
  { id: 'a4', actor: 'system', action: 'match_settled', entity: 'Match M-001', metadata: 'Winner: Alex Storm · Prize: 9 USDT', createdAt: '2026-06-16T10:07:00Z' },
  { id: 'a5', actor: 'system', action: 'match_settled', entity: 'Match M-002', metadata: 'Winner: Jordan Wick · Prize: 18 USDT', createdAt: '2026-06-16T09:09:00Z' },
];

const COLUMNS = [
  { key: 'id', label: 'ID', render: (v) => <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v}</code> },
  { key: 'actor', label: 'Actor' },
  { key: 'action', label: 'Action', render: (v) => <Badge status={v.includes('approve') || v.includes('settle') ? 'approved' : v.includes('reject') ? 'rejected' : 'pending'} label={v.replace(/_/g, ' ')} /> },
  { key: 'entity', label: 'Entity' },
  { key: 'metadata', label: 'Details', render: (v) => <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{v}</span> },
  { key: 'createdAt', label: 'Timestamp', render: (v) => new Date(v).toLocaleString() },
];

export default function AdminAuditPage() {
  const [search, setSearch] = useState('');

  const filtered = MOCK_AUDIT.filter((a) =>
    !search || a.actor.toLowerCase().includes(search.toLowerCase()) || a.action.includes(search) || a.entity.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <PageHeader title="Audit Log" subtitle="Every admin action is logged with actor, timestamp, and entity." />
      <Card>
        <div style={{ marginBottom: '1.5rem' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by actor, action, or entity..." />
        </div>
        <Table columns={COLUMNS} rows={filtered} emptyMessage="No audit log entries." />
      </Card>
    </AdminLayout>
  );
}
