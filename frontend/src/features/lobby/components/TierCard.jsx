import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../shared/components/ui/index.js';
import useWalletStore from '../../../shared/store/walletStore.js';
import useMatchStore from '../../../shared/store/matchStore.js';
import useAuthStore from '../../../shared/store/authStore.js';

export default function TierCard({ tier, gameType = null }) {
  const navigate = useNavigate();
  const { availableBalance } = useWalletStore();
  const { joinQueue, queueStatus } = useMatchStore();
  const { user } = useAuthStore();

  const canAfford = availableBalance >= tier.entryFee;
  const alreadyInQueue = !!queueStatus;
  const waitLabel = tier.waitingCount > 0 ? `~${Math.round(60 / Math.max(tier.waitingCount, 1))}s wait` : 'Low activity';

  const handleJoin = () => {
    if (!canAfford || alreadyInQueue) return;
    // Try id first (better-auth), then _id (MongoDB ObjectId field), then avoid email as it breaks wallet lookup
    const userId = user?.id || user?._id || user?.email || '';
    if (!userId) return;
    joinQueue(tier.id, userId, gameType);
    navigate(`/queue/${tier.id}`);
  };

  // Convert gameType (e.g. math_duel) to readable label (e.g. Math Duel)
  const displayGameLabel = gameType 
    ? gameType.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())
    : (tier.gameLabel || 'Word Duel');

  // design.md §4.3: Rookie = text-secondary tint, Pro = accent-secondary, Elite = accent-primary
  const TIER_COLORS = {
    rookie:     '#9AA4B2',
    pro:        '#5B8DEF',
    elite:      '#00E37A',
  };
  const color = TIER_COLORS[tier.color] || 'var(--primary)';

  return (
    <div className={`glass-card tier-card ${tier.color}`} style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${color}, ${color}88)` }} />

      <div style={{ marginTop: '0.5rem' }}>
        <p style={{ color, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.8rem', letterSpacing: 2, textTransform: 'uppercase' }}>{tier.name}</p>
        {displayGameLabel && (
          <span style={{ display: 'inline-block', background: 'var(--glass-bg-hover)', fontSize: '0.7rem', color: 'var(--text-secondary)', padding: '0.15rem 0.5rem', borderRadius: 10, marginTop: '0.3rem' }}>
            {displayGameLabel}
          </span>
        )}
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '2.8rem', fontWeight: 800, margin: '0.5rem 0 0.15rem 0', color: 'var(--accent-green)' }}>
          {tier.prize} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>USDT {tier.isChance ? 'Fixed Prize' : 'Prize'}</span>
        </p>
        <p style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '1.05rem', margin: '0.25rem 0' }}>Entry Fee: <span style={{ color: 'var(--text-primary)' }}>{tier.entryFee} USDT</span></p>
        {!tier.isChance && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 4 }}>Platform rake: {tier.rakePercent}%</p>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', margin: '1.25rem 0', padding: '0.65rem 0.85rem', background: 'var(--glass-bg)', borderRadius: 8, textAlign: 'left', fontSize: '0.8rem' }}>
        <div>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Waiting: </span>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{tier.waitingCount} players</span>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Est. wait: </span>
          <span style={{ fontWeight: 600, color: tier.waitingCount > 0 ? 'var(--accent-green)' : 'var(--accent-warning)' }}>{waitLabel}</span>
        </div>
      </div>

      {!canAfford && (
        <p style={{ color: 'var(--accent-red)', fontSize: '0.8rem', marginBottom: '0.75rem', textAlign: 'center' }}>
          Insufficient balance. Deposit at least {tier.entryFee} USDT.
        </p>
      )}
      {alreadyInQueue && canAfford && (
        <p style={{ color: 'var(--accent-warning)', fontSize: '0.8rem', marginBottom: '0.75rem', textAlign: 'center' }}>
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
