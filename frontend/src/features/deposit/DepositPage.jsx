import React from 'react';
import AppLayout from '../../shared/components/layout/AppLayout.jsx';
import { PageHeader } from '../../shared/components/ui/index.js';
import DepositForm from './components/DepositForm.jsx';
import FiatDepositForm from './components/FiatDepositForm.jsx';
import DepositHistory from './components/DepositHistory.jsx';

export default function DepositPage() {
  return (
    <AppLayout>
      <PageHeader title="Add Funds" subtitle="Deposit USDT or pay using cards and local bank methods to top up your wallet." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        <DepositForm />
        <FiatDepositForm />
        <DepositHistory />
      </div>
    </AppLayout>
  );
}
