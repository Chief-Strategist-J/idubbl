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
  const { queueStatus, currentTier, leaveQueue } = useMatchStore();
  const { fetchWalletData } = useWalletStore();

  useEffect(() => {
    if (user?.id) {
      fetchWalletData(user.id);
    }
  }, [user?.id, fetchWalletData]);

  return (
    <AppLayout>
      <PageHeader
        title={`Welcome back, ${user?.firstName || 'Player'} 👋`}
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

      <div className="dashboard-grid">
        {/* Balance widget — full width */}
        <BalanceWidget />

        {/* Quick actions + Win/Loss side by side on tablet+, stacked on mobile */}
        <div className="dashboard-two-col">
          <Card>
            <h3 className="dash-section-title">Quick Actions</h3>
            <QuickActions />
          </Card>

          <Card style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.06), rgba(16,185,129,0.06))' }}>
            <h3 className="dash-section-title">Win / Loss Summary</h3>
            <div className="win-loss-row">
              <div className="win-loss-stat">
                <p className="win-loss-number" style={{ color: 'var(--accent-green)' }}>1</p>
                <p className="win-loss-label">Wins</p>
              </div>
              <div className="win-loss-divider" />
              <div className="win-loss-stat">
                <p className="win-loss-number" style={{ color: '#f87171' }}>1</p>
                <p className="win-loss-label">Losses</p>
              </div>
              <div className="win-loss-divider" />
              <div className="win-loss-stat">
                <p className="win-loss-number" style={{ color: 'var(--accent-cyan)' }}>50%</p>
                <p className="win-loss-label">Win rate</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent matches — full width */}
        <Card>
          <RecentMatches />
        </Card>
      </div>
    </AppLayout>
  );
}
