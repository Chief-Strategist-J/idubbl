import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../shared/components/layout/AppLayout.jsx';
import { PageHeader, Button, Card, Badge } from '../../shared/components/ui/index.js';
import BalanceWidget from './components/BalanceWidget.jsx';
import RecentMatches from './components/RecentMatches.jsx';
import QuickActions from './components/QuickActions.jsx';
import useAuthStore from '../../shared/store/authStore.js';
import useMatchStore from '../../shared/store/matchStore.js';
import useWalletStore from '../../shared/store/walletStore.js';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { queueStatus, currentTier, leaveQueue, matches } = useMatchStore();
  const { fetchWalletData, withdrawals, transactions } = useWalletStore();

  useEffect(() => {
    if (user?.id) {
      fetchWalletData(user.id);
    }
  }, [user?.id, fetchWalletData]);

  // Compute live win/loss stats
  const completedMatches = matches.filter((m) => m.status === 'completed');
  const wins = completedMatches.filter((m) => m.winnerId === 'u1').length;
  const losses = completedMatches.length - wins;
  const winRate = completedMatches.length > 0 ? Math.round((wins / completedMatches.length) * 100) : 0;

  return (
    <AppLayout>
      <PageHeader
        title={`Welcome back, ${user?.firstName || 'Player'}`}
        subtitle="Your control room — balances, matches, and quick actions."
        action={<Button variant="primary" onClick={() => navigate('/lobby')}>Join a Tier</Button>}
      />

      {/* Queue banner */}
      {queueStatus && currentTier && (
        <div className="queue-banner glass-card">
          <div className="queue-banner-left">
            <div className="queue-pulse-dot" />
            <div>
              <p className="queue-banner-title">In queue — {currentTier.name} tier</p>
              <p className="queue-banner-sub">Finding an opponent in your tier. Stay ready.</p>
            </div>
          </div>
          <div className="queue-banner-right">
            <Badge status="searching" />
            <Button variant="secondary" onClick={() => { leaveQueue(); navigate('/lobby'); }}>Cancel</Button>
            <Button variant="primary" onClick={() => navigate(`/queue/${currentTier.id}`)}>View Queue</Button>
          </div>
        </div>
      )}

      {/* Pending Withdrawals banner */}
      {(() => {
        const pendingW = withdrawals.filter(w => w.status === 'pending');
        return pendingW.length > 0 ? (
          <Card style={{ borderColor: 'var(--accent-warning-glow)', background: 'rgba(255, 176, 32, 0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.25rem' }}>⏳</span>
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>{pendingW.length} withdrawal request{pendingW.length > 1 ? 's' : ''} pending review</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>You'll be notified when processed.</p>
              </div>
            </div>
          </Card>
        ) : null;
      })()}

      <div className="dashboard-grid">
        {/* Balance widget — full width */}
        <BalanceWidget />

        {/* Quick actions + Win/Loss side by side on tablet+, stacked on mobile */}
        <div className="dashboard-two-col">
          <Card>
            <h3 className="dash-section-title">Quick Actions</h3>
            <QuickActions />
          </Card>

          <Card style={{ background: 'rgba(0, 227, 122, 0.06)' }}>
            <h3 className="dash-section-title">Win / Loss Summary</h3>
            <div className="win-loss-row">
              <div className="win-loss-stat">
                <p className="win-loss-number" style={{ color: 'var(--accent-green)' }}>{wins}</p>
                <p className="win-loss-label">Wins</p>
              </div>
              <div className="win-loss-divider" />
              <div className="win-loss-stat">
                <p className="win-loss-number" style={{ color: 'var(--accent-red)' }}>{losses}</p>
                <p className="win-loss-label">Losses</p>
              </div>
              <div className="win-loss-divider" />
              <div className="win-loss-stat">
                <p className="win-loss-number" style={{ color: 'var(--accent-cyan)' }}>{winRate}%</p>
                <p className="win-loss-label">Win rate</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent matches — full width */}
        <Card>
          <RecentMatches />
        </Card>

        {/* Recent Wallet Activity */}
        <Card>
          <h3 className="dash-section-title">Recent Wallet Activity</h3>
          {transactions.slice(0, 10).length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No wallet activity yet. Make your first deposit to begin.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {transactions.slice(0, 10).map((tx, i) => (
                <div key={tx.refId || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: i < 9 ? '1px solid var(--border)' : 'none' }}>
                  <div>
                    <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>{tx.description}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(tx.date).toLocaleDateString()}</p>
                  </div>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: tx.amount > 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount} USDT
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
