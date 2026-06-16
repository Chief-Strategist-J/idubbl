import React from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../shared/components/layout/AppLayout.jsx';
import { PageHeader, Button, Card, Badge } from '../../shared/components/ui/index.js';
import BalanceWidget from './components/BalanceWidget.jsx';
import RecentMatches from './components/RecentMatches.jsx';
import QuickActions from './components/QuickActions.jsx';
import useAuthStore from '../../shared/store/authStore.js';
import useMatchStore from '../../shared/store/matchStore.js';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { queueStatus, currentTier, leaveQueue } = useMatchStore();

  return (
    <AppLayout>
      <PageHeader
        title={`Welcome back, ${user?.firstName || 'Player'} 👋`}
        subtitle="Your control room — balances, matches, and quick actions."
        action={<Button variant="primary" onClick={() => navigate('/lobby')}>Join a Tier</Button>}
      />

      {queueStatus && currentTier && (
        <Card style={{ marginBottom: '1.5rem', borderColor: 'rgba(139,92,246,0.4)', background: 'rgba(139,92,246,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 8px var(--primary)', animation: 'pulse 1.5s infinite' }} />
              <div>
                <p style={{ fontWeight: 600 }}>In queue — {currentTier.name} tier</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Finding an opponent in your tier. Stay ready.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <Badge status="searching" />
              <Button variant="secondary" onClick={() => { leaveQueue(); navigate('/lobby'); }}>Cancel</Button>
              <Button variant="primary" onClick={() => navigate(`/queue/${currentTier.id}`)}>View Queue</Button>
            </div>
          </div>
        </Card>
      )}

      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <BalanceWidget />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <Card>
            <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1rem' }}>Quick Actions</h3>
            <QuickActions />
          </Card>

          <Card style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.06), rgba(16,185,129,0.06))' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: '1rem' }}>Win / Loss Summary</h3>
            <div style={{ display: 'flex', gap: '2rem' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: 'var(--accent-green)' }}>1</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Wins</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: '#f87171' }}>1</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Losses</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>50%</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Win rate</p>
              </div>
            </div>
          </Card>
        </div>

        <Card>
          <RecentMatches />
        </Card>
      </div>
    </AppLayout>
  );
}
