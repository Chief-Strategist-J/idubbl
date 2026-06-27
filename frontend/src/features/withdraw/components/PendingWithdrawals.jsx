import React from 'react';
import { Badge, Table, Card } from '../../../shared/components/ui/index.js';
import useWalletStore from '../../../shared/store/walletStore.js';import useAuthStore from '../../../shared/store/authStore.js';

const COLUMNS = [
  { key: 'id', label: 'Ref', render: (v, row) => <code style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{String(row._id || row.id || '').substring(0, 8).toUpperCase()}</code> },
  { key: 'amount', label: 'Amount', render: (v) => <span style={{ fontWeight: 600 }}>{v || 0} USDT</span> },
  { key: 'network', label: 'Network' },
  { key: 'address', label: 'Address', render: (v) => <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v || ''}</code> },
  { key: 'status', label: 'Status', render: (v) => <Badge status={v || 'pending'} /> },
  { key: 'createdAt', label: 'Date', render: (v) => v ? new Date(v).toLocaleDateString() : 'N/A' },
];

export default function PendingWithdrawals() {
  const { withdrawals } = useWalletStore();
  const { user } = useAuthStore();
  const mine = withdrawals.filter((w) => w.userId === (user?.id || 'u1'));

  return (
    <Card>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: '1rem' }}>Withdrawal History</h3>
      <Table columns={COLUMNS} rows={mine} emptyMessage="No withdrawals yet." />
    </Card>
  );
}
