import React, { useEffect } from 'react';
import AdminLayout from '../../shared/components/layout/AdminLayout.jsx';
import { Stat, Card, PageHeader, Badge } from '../../shared/components/ui/index.js';
import useWalletStore from '../../shared/store/walletStore.js';
import useMatchStore from '../../shared/store/matchStore.js';

export default function AdminDashboardHome() {
  const { deposits, withdrawals, adminUsers, fetchAdminDeposits, fetchAdminWithdrawals, fetchAdminUsers, loading: walletLoading } = useWalletStore();
  const { matches, tiers, fetchAdminMatches, loading: matchLoading } = useMatchStore();

  useEffect(() => {
    fetchAdminDeposits();
    fetchAdminWithdrawals();
    fetchAdminMatches();
    fetchAdminUsers();
  }, [fetchAdminDeposits, fetchAdminWithdrawals, fetchAdminMatches, fetchAdminUsers]);

  const pendingDeposits = deposits.filter((d) => d.status === 'pending').length;
  const pendingWithdrawals = withdrawals.filter((w) => w.status === 'pending').length;
  const activeMatches = matches.filter((m) => m.status === 'active').length;
  const revenueToday = matches.filter((m) => m.status === 'completed').reduce((acc, m) => acc + m.rake, 0);

  const totalPersonalWallets = adminUsers.filter(u => u.personalWallets && (u.personalWallets.tron || u.personalWallets.ethereum)).length;

  const realActivity = [...deposits, ...withdrawals]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)
    .map(tx => {
      const user = tx.user || tx.userId;
      const statusText = tx.status === 'approved' || tx.status === 'success' ? 'confirmed' : tx.status;
      return {
        label: `${user} ${tx.type === 'deposit' ? 'deposited' : 'withdrew'} ${tx.amount} USDT (${statusText})`,
        time: tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : 'Recent'
      };
    });

  return (
    <AdminLayout>
      <Card style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Hot Wallet Reserve</span>
          <span style={{ color: 'var(--accent-green)', fontWeight: 700, fontSize: '0.9rem' }}>72% healthy</span>
        </div>
        <div style={{ background: 'var(--border)', borderRadius: 999, height: 8, overflow: 'hidden' }}>
          <div style={{ width: '72%', height: '100%', background: 'linear-gradient(90deg, var(--primary-hover), var(--primary))', borderRadius: 999, transition: 'width 0.5s ease' }} />
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>Hot wallet reserve: 72% healthy</p>
      </Card>

      <PageHeader title="Admin Dashboard" subtitle="Monitor deposits, matches, withdrawals, and platform health in real time." />

      <div className="admin-stats-grid">
        <Stat label="Pending Deposits" value={pendingDeposits} highlight />
        <Stat label="Pending Withdrawals" value={pendingWithdrawals} highlight />
        <Stat label="Active Matches" value={activeMatches} />
        <Stat label="Standard Wallets" value={adminUsers.length} />
        <Stat label="Crypto Wallets" value={totalPersonalWallets} highlight />
      </div>

      {(pendingDeposits > 0 || pendingWithdrawals > 0) && (
        <Card style={{ marginBottom: '1.5rem', borderColor: 'var(--accent-warning-glow)', background: 'var(--accent-warning-glow)' }}>
          <p style={{ color: 'var(--accent-warning)', fontWeight: 600, marginBottom: '0.5rem' }}>⚠️ Action Required</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {pendingDeposits > 0 && `${pendingDeposits} deposit request(s) awaiting review. `}
            {pendingWithdrawals > 0 && `${pendingWithdrawals} withdrawal request(s) awaiting approval.`}
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 4 }}>Any wallet or settlement issue appears here first.</p>
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        <Card>
          <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1rem' }}>Queue Depth by Tier</h3>
          {tiers.map((t) => (
            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ textTransform: 'capitalize' }}>{t.name}</span>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t.waitingCount} waiting</span>
                <Badge status={t.active ? 'active' : 'rejected'} />
              </div>
            </div>
          ))}
        </Card>

        <Card>
          <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1rem' }}>Recent Activity</h3>
          {realActivity.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No recent activity logged.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {realActivity.map((e, i) => (
                <div key={i} style={{ padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{e.label}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{e.time}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}
