import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../shared/components/ui/index.js';
import useWalletStore from '../../../shared/store/walletStore.js';

export default function BalanceWidget() {
  const navigate = useNavigate();
  const { availableBalance, lockedBalance, pendingWithdrawals } = useWalletStore();

  return (
    <div className="glass-card" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(236,72,153,0.08))' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Available Balance</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>
            {availableBalance.toFixed(2)} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>USDT</span>
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 4 }}>Credits ready to play.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 140 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Locked</span>
            <span style={{ color: '#fbbf24', fontWeight: 600, fontSize: '0.9rem' }}>{lockedBalance.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Pending withdrawal</span>
            <span style={{ color: '#f87171', fontWeight: 600, fontSize: '0.9rem' }}>{pendingWithdrawals.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
        <Button variant="primary" onClick={() => navigate('/deposit')}>+ Deposit</Button>
        <Button variant="secondary" onClick={() => navigate('/withdraw')}>Withdraw</Button>
      </div>
    </div>
  );
}
