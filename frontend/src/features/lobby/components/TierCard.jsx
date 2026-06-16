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

  const TIER_COLORS = { bronze: '#d97706', silver: '#9ca3af', gold: '#eab308' };
  const color = TIER_COLORS[tier.color] || 'var(--primary)';

  return (
    <div className={`glass-card tier-card ${tier.color}`} style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${color}, ${color}88)` }} />

      <div style={{ marginTop: '0.5rem' }}>
        <p style={{ color, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.8rem', letterSpacing: 2, textTransform: 'uppercase' }}>{tier.name}</p>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 800, margin: '0.5rem 0' }}>{tier.entryFee} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>USDT</span></p>
        <p style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>Prize: {tier.prize} USDT</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 4 }}>Platform rake: {tier.rakePercent}%</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1.5rem 0', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Waiting</p>
          <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>{tier.waitingCount} players</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Est. wait</p>
          <p style={{ fontWeight: 600, color: tier.waitingCount > 0 ? 'var(--accent-green)' : '#fbbf24', fontSize: '0.95rem' }}>{waitLabel}</p>
        </div>
      </div>

      {!canAfford && (
        <p style={{ color: '#f87171', fontSize: '0.8rem', marginBottom: '0.75rem', textAlign: 'center' }}>
          Insufficient balance. Deposit at least {tier.entryFee} USDT.
        </p>
      )}
      {alreadyInQueue && canAfford && (
        <p style={{ color: '#fbbf24', fontSize: '0.8rem', marginBottom: '0.75rem', textAlign: 'center' }}>
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
