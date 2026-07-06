import React, { useEffect } from 'react';
import AppLayout from '../../shared/components/layout/AppLayout.jsx';
import { PageHeader, Button } from '../../shared/components/ui/index.js';
import DepositForm from './components/DepositForm.jsx';
import DepositHistory from './components/DepositHistory.jsx';
import PersonalWalletsWidget from './components/PersonalWalletsWidget.jsx';
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
        subtitle="Top up your wallet using secure payment methods."
        action={
          <Button variant="secondary" onClick={() => window.location.href = '/guide'}>
            📖 View Deposit Guide
          </Button>
        }
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        <div>
          <DepositForm />
          <PersonalWalletsWidget />
        </div>
        <DepositHistory />
      </div>
    </AppLayout>
  );
}
