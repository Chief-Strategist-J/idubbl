import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../shared/components/ui/index.js';

// design.md §3.1 + §4.3 — Tier preview cards with correct Rookie/Pro/Elite names & fees
const TIERS = [
  {
    name: 'Rookie',
    color: '#9AA4B2',  // text-secondary tint per design.md §4.3
    entry: 5,
    rake: 10,
    prize: 9,
    badge: '🟤',
    desc: 'Perfect for new players testing their skills.',
  },
  {
    name: 'Pro',
    color: '#5B8DEF',  // accent-secondary tint per design.md §4.3
    entry: 20,
    rake: 10,
    prize: 36,
    badge: '🔵',
    desc: 'For competitive players who want bigger stakes.',
    highlight: true,
  },
  {
    name: 'Elite',
    color: '#00E37A',  // accent-primary tint per design.md §4.3
    entry: 50,
    rake: 8,
    prize: 92,
    badge: '🟢',
    desc: 'High-stakes tier for serious contenders.',
  },
];

export default function TierPreview() {
  const navigate = useNavigate();

  return (
    <section
      id="tiers"
      style={{ padding: '5rem 2rem', borderBottom: '1px solid var(--border)' }}
    >
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '0.75rem',
            }}
          >
            Pick your tier
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Entry fees, prizes, and rake are transparent — no surprises.
          </p>
        </div>

        {/* Tier cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2.5rem',
          }}
        >
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              style={{
                background: tier.highlight
                  ? 'linear-gradient(135deg, rgba(91,141,239,0.08) 0%, rgba(20,24,33,0.9) 100%)'
                  : 'var(--bg-card)',
                border: `1px solid ${tier.highlight ? 'rgba(91,141,239,0.4)' : 'var(--border)'}`,
                borderRadius: 16,
                padding: '2rem 1.75rem',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: tier.highlight
                  ? '0 8px 32px rgba(91,141,239,0.12)'
                  : '0 4px 16px rgba(0,0,0,0.2)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = `0 16px 40px rgba(0,0,0,0.3)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = tier.highlight
                  ? '0 8px 32px rgba(91,141,239,0.12)'
                  : '0 4px 16px rgba(0,0,0,0.2)';
              }}
            >
              {/* Top accent bar */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: tier.color,
                  opacity: 0.8,
                }}
              />

              {tier.highlight && (
                <div
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 14,
                    background: 'var(--secondary)',
                    color: '#04130d',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    padding: '0.2rem 0.6rem',
                    borderRadius: 999,
                  }}
                >
                  Popular
                </div>
              )}

              <p
                style={{
                  color: tier.color,
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  marginBottom: '0.75rem',
                }}
              >
                {tier.badge} {tier.name}
              </p>

              <p
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: '2.7rem',
                  color: 'var(--accent-green)',
                  lineHeight: 1,
                  marginBottom: '0.25rem',
                }}
              >
                {tier.prize}{' '}
                <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 500 }}>USDT</span>
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                Estimated Prize
              </p>

              <div
                style={{
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  padding: '0.9rem 1rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Entry Fee</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    {tier.entry} USDT
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Platform fee</span>
                  <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    {tier.rake}%
                  </span>
                </div>
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.55 }}>
                {tier.desc}
              </p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center' }}>
          <Button variant="secondary" onClick={() => navigate('/signup')}>
            See all tiers
          </Button>
        </div>
      </div>
    </section>
  );
}
