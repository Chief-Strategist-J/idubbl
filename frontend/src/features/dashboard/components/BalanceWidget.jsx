import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Plus, ArrowUpRight, Lock, RefreshCw, Coins } from 'lucide-react';
import useWalletStore from '../../../shared/store/walletStore.js';

export default function BalanceWidget() {
  const navigate = useNavigate();
  const { availableBalance, lockedBalance, pendingWithdrawals } = useWalletStore();

  return (
    <div className="balance-card-wrapper">
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
            <span className="live-dot" /> Available Balance
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

      {/* Instant Action buttons below the card for ease of access */}
      <div className="card-quick-actions">
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

