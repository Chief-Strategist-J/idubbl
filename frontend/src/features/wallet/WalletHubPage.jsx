import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../shared/components/layout/AppLayout.jsx';
import { PageHeader, Button, Card } from '../../shared/components/ui/index.js';
import useWalletStore from '../../shared/store/walletStore.js';
import useAuthStore from '../../shared/store/authStore.js';

const TX_ICONS = {
  deposit: '⬇️',
  withdrawal: '⬆️',
  win: '🏆',
  match: '⚔️',
};

function formatAmount(amount) {
  const num = Number(amount);
  return isNaN(num) ? '—' : (num >= 0 ? `+${num.toFixed(2)}` : num.toFixed(2));
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function isPositive(type, amount) {
  if (type === 'deposit' || type === 'win') return true;
  if (type === 'withdrawal' || type === 'match') return false;
  return Number(amount) >= 0;
}

export default function WalletHubPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { availableBalance, lockedBalance, idubbuBalance, depositBalance, winningsBalance, pendingWithdrawals, transactions, fetchWalletData } = useWalletStore();

  useEffect(() => {
    if (user?.id) {
      fetchWalletData(user.id);
    }
  }, [user?.id, fetchWalletData]);

  const recentTxs = (transactions || []).slice(0, 5);

  return (
    <AppLayout>
      <PageHeader
        title="Wallet"
        subtitle="Manage your funds — deposit, withdraw, or view history."
      />

      <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Balance Card */}
        <Card style={{
          background: 'linear-gradient(135deg, rgba(0,227,122,0.08) 0%, var(--bg-card) 60%)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          boxShadow: 'var(--shadow-card)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--accent-green-glow)',
              border: '1.5px solid var(--accent-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
            }}>
              💰
            </div>
            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1rem',
              fontWeight: 700,
              margin: 0,
              color: 'var(--text-primary)',
              letterSpacing: '0.02em',
            }}>
              Your Wallet
            </h3>
          </div>

          {/* Idubbu Balance Hero */}
          <div style={{ background: 'linear-gradient(135deg, rgba(20,241,149,0.15), rgba(99,102,241,0.15))', border: '1px solid rgba(20,241,149,0.3)', borderRadius: 14, padding: '1.25rem 1.5rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.3rem' }}>💎 Idubbu Balance</p>
              <p style={{ fontSize: '2.2rem', fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--secondary)', margin: 0, lineHeight: 1.2 }}>
                {(idubbuBalance || 0).toLocaleString()}
                <span style={{ fontSize: '1rem', fontWeight: 500, opacity: 0.7, marginLeft: 8 }}>Idubbu</span>
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: '0.25rem 0 0' }}>= {((idubbuBalance || 0) / 1000).toFixed(2)} USDT · Rate: 1 USDT = 1,000 Idubbu</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <Button variant="secondary" onClick={() => navigate('/deposit')} style={{ fontSize: '0.82rem', padding: '0.4rem 1rem' }}>+ Add Funds</Button>
              <Button variant="ghost" onClick={() => navigate('/withdraw')} style={{ fontSize: '0.82rem', padding: '0.4rem 1rem' }}>Withdraw</Button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            {/* Available balance */}
            <div style={{
              background: 'rgba(0, 227, 122, 0.06)',
              border: '1px solid rgba(0, 227, 122, 0.15)',
              borderRadius: 12,
              padding: '1rem 1.25rem',
            }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.35rem' }}>
                Available balance
              </p>
              <p style={{
                fontSize: '1.8rem',
                fontWeight: 800,
                fontFamily: 'var(--font-display)',
                color: 'var(--accent-green)',
                margin: 0,
                lineHeight: '1.3',
                letterSpacing: '0.02em',
                paddingLeft: '2px'
              }}>
                {Number(availableBalance || 0).toFixed(2)}
                <span style={{ fontSize: '0.95rem', fontWeight: 500, opacity: 0.7, marginLeft: 6 }}>USDT</span>
              </p>
            </div>

            {/* Locked balance */}
            <div style={{
              background: 'var(--accent-warning-glow)',
              border: '1px solid rgba(255, 176, 32, 0.18)',
              borderRadius: 12,
              padding: '1rem 1.25rem',
            }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.35rem' }}>
                Locked balance
              </p>
              <p style={{
                fontSize: '1.8rem',
                fontWeight: 800,
                fontFamily: 'var(--font-display)',
                color: 'var(--accent-warning)',
                margin: 0,
                lineHeight: '1.3',
                letterSpacing: '0.02em',
                paddingLeft: '2px'
              }}>
                {Number(lockedBalance || 0).toFixed(2)}
                <span style={{ fontSize: '0.95rem', fontWeight: 500, opacity: 0.7, marginLeft: 6 }}>USDT</span>
              </p>
            </div>
          </div>
        </Card>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Button
            variant="primary"
            fullWidth
            onClick={() => navigate('/deposit')}
          >
            ⬇️ Deposit
          </Button>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => navigate('/withdraw')}
          >
            ⬆️ Withdraw
          </Button>
        </div>

        {/* Recent activity */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1rem',
              fontWeight: 700,
              margin: 0,
              color: 'var(--text-primary)',
            }}>
              Recent activity
            </h3>
            <button
              id="wallet-view-full-history-btn"
              onClick={() => navigate('/transactions')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-green)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '0.25rem 0.5rem',
                borderRadius: 6,
                transition: 'opacity 0.15s ease',
                textDecoration: 'underline',
                textDecorationColor: 'transparent',
              }}
              onMouseEnter={e => { e.target.style.opacity = '0.75'; e.target.style.textDecorationColor = 'var(--accent-green)'; }}
              onMouseLeave={e => { e.target.style.opacity = '1'; e.target.style.textDecorationColor = 'transparent'; }}
            >
              View full history →
            </button>
          </div>

          {recentTxs.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '2.5rem 1rem',
              color: 'var(--text-muted)',
              fontSize: '0.9rem',
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem', opacity: 0.4 }}>📭</div>
              No wallet activity yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {recentTxs.map((tx, idx) => {
                const icon = TX_ICONS[tx.type] || '💸';
                const positive = isPositive(tx.type, tx.amount);
                const amountStr = formatAmount(tx.amount);
                return (
                  <div
                    key={tx.id || tx._id || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.65rem 0.75rem',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: 10,
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: positive ? 'rgba(0,227,122,0.1)' : 'rgba(255,90,90,0.1)',
                      border: `1px solid ${positive ? 'rgba(0,227,122,0.2)' : 'rgba(255,90,90,0.2)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                      flexShrink: 0,
                    }}>
                      {icon}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        margin: 0,
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        textTransform: 'capitalize',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {tx.description || tx.type || 'Transaction'}
                      </p>
                      {tx.createdAt || tx.date ? (
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          {formatDate(tx.createdAt || tx.date)}
                        </p>
                      ) : null}
                    </div>

                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      color: positive ? 'var(--accent-green)' : 'var(--accent-red, #ef4444)',
                      flexShrink: 0,
                    }}>
                      {amountStr} USDT
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

      </div>
    </AppLayout>
  );
}
