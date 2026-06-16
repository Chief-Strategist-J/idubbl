import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../shared/components/ui/index.js';
import useWalletStore from '../../../shared/store/walletStore.js';

export default function BalanceWidget() {
  const navigate = useNavigate();
  const { availableBalance, lockedBalance, pendingWithdrawals } = useWalletStore();

  return (
    <div className="balance-widget glass-card">
      {/* Top row: available balance + mini stats */}
      <div className="balance-widget-top">
        <div className="balance-main">
          <p className="balance-label">Available Balance</p>
          <p className="balance-amount">
            {availableBalance.toFixed(2)}
            <span className="balance-unit"> USDT</span>
          </p>
          <p className="balance-sub">Credits ready to play.</p>
        </div>

        <div className="balance-stats">
          <div className="balance-stat-row">
            <span className="balance-stat-label">Locked</span>
            <span className="balance-stat-val locked">{lockedBalance.toFixed(2)}</span>
          </div>
          <div className="balance-stat-row">
            <span className="balance-stat-label">Pending withdrawal</span>
            <span className="balance-stat-val pending">{pendingWithdrawals.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="balance-actions">
        <Button variant="primary" onClick={() => navigate('/deposit')}>+ Deposit</Button>
        <Button variant="secondary" onClick={() => navigate('/withdraw')}>Withdraw</Button>
      </div>
    </div>
  );
}
