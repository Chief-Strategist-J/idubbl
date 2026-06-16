import React from 'react';
import { Badge, Table, Card } from '../../../shared/components/ui/index.js';
import useWalletStore from '../../../shared/store/walletStore.js';

const COLUMNS = [
  { key: 'id', label: 'Ref', render: (v) => <code style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{v.toUpperCase()}</code> },
  { key: 'amount', label: 'Amount', render: (v) => <span style={{ fontWeight: 600 }}>{v} USDT</span> },
  { key: 'network', label: 'Network' },
  { key: 'address', label: 'Address', render: (v) => <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v}</code> },
  { key: 'status', label: 'Status', render: (v) => <Badge status={v} /> },
  { key: 'createdAt', label: 'Date', render: (v) => new Date(v).toLocaleDateString() },
];

export default function PendingWithdrawals() {
  const { withdrawals } = useWalletStore();
  const mine = withdrawals.filter((w) => w.userId === 'u1');

  return (
    <Card>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: '1rem' }}>Withdrawal History</h3>
      <Table columns={COLUMNS} rows={mine} emptyMessage="No withdrawals yet." />
    </Card>
  );
}
