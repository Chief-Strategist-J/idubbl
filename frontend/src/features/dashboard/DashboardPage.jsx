import React, { useEffect, useState } from 'react';
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
  const { fetchWalletData, withdrawals, transactions, fetchReferralsData, referralCode, referrals } = useWalletStore();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const uid = user?.id || user?._id;
    if (uid) {
      fetchWalletData(uid);
      fetchReferralsData(uid);
    }
  }, [user?.id, user?._id, fetchWalletData, fetchReferralsData]);

  // Compute live win/loss stats
  const currentUserId = user?.id || user?._id || 'u1';
  const completedMatches = matches.filter((m) => m.status === 'completed');
  const wins = completedMatches.filter((m) => m.winnerId === currentUserId || m.winner === user?.name || m.winner === 'You').length;
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

        {/* Referral Program */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <h3 className="dash-section-title" style={{ margin: 0 }}>Referral Program</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                Share your referral code with friends and track their funding status.
              </p>
            </div>
            {referralCode && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-darker)', padding: '0.5rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>YOUR CODE:</span>
                <strong style={{ fontFamily: 'var(--font-display)', color: 'var(--primary)', letterSpacing: '0.05em' }}>{referralCode}</strong>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(referralCode);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: copied ? 'var(--accent-green)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    padding: '0.25rem',
                    marginLeft: '0.25rem',
                    fontWeight: 600,
                  }}
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Referred</span>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0.25rem 0 0 0' }}>
                {referrals.length}
              </p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Funded Referrals</span>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--accent-green)', margin: '0.25rem 0 0 0' }}>
                {referrals.filter(r => r.funded).length}
              </p>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Your Referrals</h4>
            {referrals.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No referrals yet. Share your code to get started.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {referrals.map((ref) => (
                  <div key={ref.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>{ref.name || 'Anonymous'}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ref.email}</p>
                    </div>
                    <div>
                      {ref.funded ? (
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent-green)', background: 'rgba(0, 227, 122, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(0, 227, 122, 0.2)', fontWeight: 600 }}>
                          Funded
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'rgba(255, 255, 255, 0.05)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border)', fontWeight: 500 }}>
                          Not Funded
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
