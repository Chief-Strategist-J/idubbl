import React from 'react';
import AppLayout from '../../shared/components/layout/AppLayout.jsx';
import { PageHeader } from '../../shared/components/ui/index.js';
import DepositForm from './components/DepositForm.jsx';
import DepositHistory from './components/DepositHistory.jsx';

export default function DepositPage() {
  return (
    <AppLayout>
      <PageHeader title="Deposit USDT" subtitle="Send USDT to the platform address and submit your transaction hash for review." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        <DepositForm />
        <DepositHistory />
      </div>
    </AppLayout>
  );
}
