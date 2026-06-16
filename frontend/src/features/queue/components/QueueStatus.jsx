import React from 'react';
import { Badge } from '../../../shared/components/ui/index.js';

const STATUS_MESSAGES = {
  searching: { label: 'Finding an opponent in your tier. Stay ready.', badge: 'searching' },
  matched: { label: 'Opponent found! Preparing match...', badge: 'active' },
  starting: { label: 'Match is starting now...', badge: 'active' },
};

export default function QueueStatus({ status, tier }) {
  const config = STATUS_MESSAGES[status] || STATUS_MESSAGES.searching;

  return (
    <div className="pulse-loader">
      <div className="pulse-ring">
        <div className="pulse-core" />
      </div>

      <Badge status={config.badge} label={status === 'searching' ? 'Searching' : status === 'matched' ? 'Matched' : 'Starting'} />

      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginTop: '1rem', marginBottom: '0.5rem' }}>
        {status === 'searching' ? 'Finding Opponent...' : status === 'matched' ? 'Opponent Found!' : 'Match Starting!'}
      </h2>

      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: 360, textAlign: 'center' }}>
        {config.label}
      </p>

      {tier && (
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '2rem', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Tier</p>
            <p style={{ fontWeight: 700 }}>{tier.name}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Entry fee</p>
            <p style={{ fontWeight: 700 }}>{tier.entryFee} USDT</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Prize</p>
            <p style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{tier.prize} USDT</p>
          </div>
        </div>
      )}
    </div>
  );
}
