import React from 'react';
import { Badge, Table, Card } from '../../../shared/components/ui/index.js';
import useWalletStore from '../../../shared/store/walletStore.js';

const COLUMNS = [
  { key: 'id', label: 'Ref ID', render: (v) => <code style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{v.toUpperCase()}</code> },
  { key: 'amount', label: 'Amount', render: (v) => <span style={{ fontWeight: 600 }}>{v} USDT</span> },
  { key: 'network', label: 'Network' },
  { key: 'txHash', label: 'TX Hash', render: (v) => <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.slice(0, 16)}...</code> },
  { key: 'status', label: 'Status', render: (v) => <Badge status={v} /> },
  { key: 'createdAt', label: 'Date', render: (v) => new Date(v).toLocaleDateString() },
];

export default function DepositHistory() {
  const { deposits } = useWalletStore();
  const myDeposits = deposits.filter((d) => d.userId === 'u1');

  return (
    <Card>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: '1rem' }}>Deposit History</h3>
      <Table columns={COLUMNS} rows={myDeposits} emptyMessage="No deposits yet." />
    </Card>
  );
}
