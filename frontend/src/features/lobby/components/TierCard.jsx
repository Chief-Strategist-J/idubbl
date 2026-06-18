import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../shared/components/ui/index.js';
import useWalletStore from '../../../shared/store/walletStore.js';
import useMatchStore from '../../../shared/store/matchStore.js';

export default function TierCard({ tier }) {
  const navigate = useNavigate();
  const { availableBalance, reserveForMatch } = useWalletStore();
  const { joinQueue, queueStatus } = useMatchStore();

  const canAfford = availableBalance >= tier.entryFee;
  const alreadyInQueue = !!queueStatus;
  const waitLabel = tier.waitingCount > 0 ? `~${Math.round(60 / Math.max(tier.waitingCount, 1))}s wait` : 'Low activity';

  const handleJoin = () => {
    if (!canAfford || alreadyInQueue) return;
    reserveForMatch(tier.entryFee);
    joinQueue(tier.id);
    navigate(`/queue/${tier.id}`);
  };

  const TIER_COLORS = {
    bronze: '#d97706', silver: '#9ca3af', gold: '#eab308', platinum: '#06b6d4', diamond: '#ec4899',
    blackjack: '#22c55e', poker: '#ef4444', baccarat: '#a855f7', casinowar: '#f97316',
    reddog: '#f43f5e', paigow: '#0ea5e9', threecard: '#8b5cf6', videopoker: '#3b82f6',
  };
  const color = TIER_COLORS[tier.color] || 'var(--primary)';

  return (
    <div className={`glass-card tier-card ${tier.color}`} style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${color}, ${color}88)` }} />

      <div style={{ marginTop: '0.5rem' }}>
        <p style={{ color, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.8rem', letterSpacing: 2, textTransform: 'uppercase' }}>{tier.name}</p>
        {tier.gameLabel && (
          <span style={{ display: 'inline-block', background: 'rgba(0,0,0,0.04)', fontSize: '0.7rem', color: 'var(--text-secondary)', padding: '0.15rem 0.5rem', borderRadius: 10, marginTop: '0.3rem' }}>
            {tier.gameLabel}
          </span>
        )}
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 800, margin: '0.5rem 0' }}>{tier.entryFee} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>USDT</span></p>
        <p style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>Prize: {tier.prize} USDT</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 4 }}>Platform rake: {tier.rakePercent}%</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1.5rem 0', padding: '0.75rem', background: 'rgba(0,0,0,0.03)', borderRadius: 8 }}>
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Waiting</p>
          <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>{tier.waitingCount} players</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Est. wait</p>
          <p style={{ fontWeight: 600, color: tier.waitingCount > 0 ? 'var(--accent-green)' : '#b45309', fontSize: '0.95rem' }}>{waitLabel}</p>
        </div>
      </div>

      {!canAfford && (
        <p style={{ color: '#dc2626', fontSize: '0.8rem', marginBottom: '0.75rem', textAlign: 'center' }}>
          Insufficient balance. Deposit at least {tier.entryFee} USDT.
        </p>
      )}
      {alreadyInQueue && canAfford && (
        <p style={{ color: '#b45309', fontSize: '0.8rem', marginBottom: '0.75rem', textAlign: 'center' }}>
          Already in queue. Cancel current queue to join this tier.
        </p>
      )}

      <Button
        variant="primary"
        fullWidth
        disabled={!canAfford || alreadyInQueue}
        onClick={handleJoin}
      >
        {canAfford ? (alreadyInQueue ? 'In Queue' : `Join — ${tier.entryFee} USDT`) : 'Insufficient Balance'}
      </Button>
    </div>
  );
}
