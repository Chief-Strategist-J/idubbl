import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Plus, ArrowUpRight, Lock, RefreshCw, Coins, Landmark, Trophy } from 'lucide-react';
import useWalletStore from '../../../shared/store/walletStore.js';

export default function BalanceWidget() {
  const navigate = useNavigate();
  const { availableBalance, depositBalance, winningsBalance, lockedBalance, pendingWithdrawals } = useWalletStore();

  return (
    <div className="balance-card-wrapper">
      {/* Main holographic card displaying the total/available balance */}
      <div className="balance-hologram-card">
        {/* Card Decorative elements */}
        <div className="card-mesh" />
        <div className="card-chip">
          <Coins className="chip-icon" size={24} />
        </div>
        <div className="card-brand">USDT Wallet</div>

        {/* Available Balance */}
        <div className="card-balance-section">
          <p className="card-balance-label">
            <span className="live-dot" /> Total Available Balance
          </p>
          <div className="card-balance-amount">
            <span className="currency-symbol">$</span>
            {availableBalance.toFixed(2)}
            <span className="currency-unit"> USDT</span>
          </div>
          <p className="card-balance-desc">Ready to play instantly</p>
        </div>

        {/* Card Footer Details */}
        <div className="card-footer-details">
          <div className="card-stat-pill">
            <Lock size={13} className="stat-pill-icon locked-color" />
            <div className="stat-pill-text">
              <span className="stat-label">Locked</span>
              <span className="stat-value">{lockedBalance.toFixed(2)} USDT</span>
            </div>
          </div>

          <div className="card-stat-pill">
            <RefreshCw size={13} className="stat-pill-icon pending-color rotating" />
            <div className="stat-pill-text">
              <span className="stat-label">Pending</span>
              <span className="stat-value">{pendingWithdrawals.toFixed(2)} USDT</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two split wallets display: Deposits and Winnings */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginTop: '1rem', width: '100%' }}>
        {/* Deposit Wallet Card */}
        <div style={{
          background: 'var(--glass-bg)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Deposit Wallet</p>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, margin: '0.25rem 0 0 0', color: 'var(--text-primary)' }}>
                {depositBalance.toFixed(2)} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>USDT</span>
              </h4>
            </div>
            <div style={{ padding: '0.5rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 8 }}>
              <Landmark size={20} style={{ color: 'var(--text-secondary)' }} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-red)', background: 'rgba(239, 68, 68, 0.05)', padding: '0.4rem 0.6rem', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <span>⚠️ Non-withdrawable</span>
          </div>
        </div>

        {/* Winnings Wallet Card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.04), rgba(6, 182, 212, 0.04))',
          border: '1px solid rgba(16, 185, 129, 0.15)',
          borderRadius: 12,
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div>
              <p style={{ color: 'var(--accent-green)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0, fontWeight: 600 }}>Winnings Wallet</p>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, margin: '0.25rem 0 0 0', color: 'var(--accent-green)' }}>
                {winningsBalance.toFixed(2)} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>USDT</span>
              </h4>
            </div>
            <div style={{ padding: '0.5rem', background: 'rgba(16, 185, 129, 0.08)', borderRadius: 8 }}>
              <Trophy size={20} style={{ color: 'var(--accent-green)' }} />
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-green)', background: 'rgba(16, 185, 129, 0.08)', padding: '0.4rem 0.6rem', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <span>✓ Fully Withdrawable</span>
          </div>
        </div>
      </div>

      {/* Instant Action buttons below the cards for ease of access */}
      <div className="card-quick-actions" style={{ marginTop: '1.25rem' }}>
        <button className="card-action-btn primary" onClick={() => navigate('/deposit')}>
          <Plus size={16} />
          <span>Add Funds</span>
        </button>
        <button className="card-action-btn secondary" onClick={() => navigate('/withdraw')}>
          <ArrowUpRight size={16} />
          <span>Withdraw</span>
        </button>
      </div>
    </div>
  );
}

