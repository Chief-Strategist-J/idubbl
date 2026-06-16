import React from 'react';
import AdminLayout from '../../shared/components/layout/AdminLayout.jsx';
import { Stat, Card, PageHeader, Badge } from '../../shared/components/ui/index.js';
import useWalletStore from '../../shared/store/walletStore.js';
import useMatchStore from '../../shared/store/matchStore.js';

export default function AdminDashboardHome() {
  const { deposits, withdrawals } = useWalletStore();
  const { matches, tiers } = useMatchStore();

  const pendingDeposits = deposits.filter((d) => d.status === 'pending').length;
  const pendingWithdrawals = withdrawals.filter((w) => w.status === 'pending').length;
  const activeMatches = matches.filter((m) => m.status === 'active').length;
  const completedToday = matches.filter((m) => m.status === 'completed').length;
  const revenueToday = matches.filter((m) => m.status === 'completed').reduce((acc, m) => acc + m.rake, 0);

  return (
    <AdminLayout>
      <PageHeader title="Admin Dashboard" subtitle="Monitor deposits, matches, withdrawals, and platform health in real time." />

      <div className="admin-stats-grid">
        <Stat label="Pending Deposits" value={pendingDeposits} highlight />
        <Stat label="Pending Withdrawals" value={pendingWithdrawals} highlight />
        <Stat label="Active Matches" value={activeMatches} />
        <Stat label="Completed Today" value={completedToday} />
        <Stat label="Revenue Today" value={`${revenueToday} USDT`} highlight />
      </div>

      {(pendingDeposits > 0 || pendingWithdrawals > 0) && (
        <Card style={{ marginBottom: '1.5rem', borderColor: 'rgba(234,179,8,0.3)', background: 'rgba(234,179,8,0.04)' }}>
          <p style={{ color: '#fbbf24', fontWeight: 600, marginBottom: '0.5rem' }}>⚠️ Action Required</p>
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
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Latest platform events appear here when backend is connected.</p>
          <div style={{ marginTop: '1rem' }}>
            {[
              { label: 'Alex Storm deposited 50 USDT', time: '10m ago', type: 'deposit' },
              { label: 'Match M-001 completed', time: '25m ago', type: 'match' },
              { label: 'Withdrawal request from Alex Storm', time: '1h ago', type: 'withdrawal' },
            ].map((e, i) => (
              <div key={i} style={{ padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{e.label}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{e.time}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
