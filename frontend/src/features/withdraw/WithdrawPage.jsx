import React from 'react';
import AppLayout from '../../shared/components/layout/AppLayout.jsx';
import { PageHeader } from '../../shared/components/ui/index.js';
import WithdrawForm from './components/WithdrawForm.jsx';
import PendingWithdrawals from './components/PendingWithdrawals.jsx';

export default function WithdrawPage() {
  return (
    <AppLayout>
      <PageHeader title="Withdraw USDT" subtitle="All wallet activity is recorded here. Requests are reviewed before payout." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        <WithdrawForm />
        <PendingWithdrawals />
      </div>
    </AppLayout>
  );
}
