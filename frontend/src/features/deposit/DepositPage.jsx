import React, { useEffect } from 'react';
import AppLayout from '../../shared/components/layout/AppLayout.jsx';
import { PageHeader } from '../../shared/components/ui/index.js';
import UsdtDepositForm from './components/FiatDepositForm.jsx';
import DepositHistory from './components/DepositHistory.jsx';
import useAuthStore from '../../shared/store/authStore.js';
import useWalletStore from '../../shared/store/walletStore.js';

export default function DepositPage() {
  const { user } = useAuthStore();
  const { fetchWalletData } = useWalletStore();

  useEffect(() => {
    if (user?.id) {
      fetchWalletData(user.id);
    }
  }, [user?.id, fetchWalletData]);

  return (
    <AppLayout>
      <PageHeader
        title="Deposit Funds"
        subtitle="Top up your wallet using your card, bank account, or mobile money securely via Flutterwave."
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        <UsdtDepositForm />
        <DepositHistory />
      </div>
    </AppLayout>
  );
}
