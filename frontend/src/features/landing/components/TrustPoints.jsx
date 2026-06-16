import React from 'react';

const POINTS = [
  { icon: '⚡', title: 'Instant Matchmaking', desc: 'Matched in under 60 seconds in active tiers.' },
  { icon: '🔍', title: 'Transparent Prizes', desc: 'Entry fee, rake, and prize shown before you join.' },
  { icon: '💸', title: 'Fast Payouts', desc: 'Withdrawal requests reviewed and paid same day.' },
];

export default function TrustPoints() {
  return (
    <section style={{ padding: '2rem 1rem 5rem' }}>
      <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap', maxWidth: 860, margin: '0 auto' }}>
        {POINTS.map((p) => (
          <div key={p.title} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flex: '1 1 220px' }}>
            <span style={{ fontSize: '1.75rem', flexShrink: 0 }}>{p.icon}</span>
            <div>
              <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, marginBottom: 4 }}>{p.title}</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>{p.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
