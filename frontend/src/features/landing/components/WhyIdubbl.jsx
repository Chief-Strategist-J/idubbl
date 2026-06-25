import React from 'react';

// design.md §3.1 — "Why iDubbl" reassurance section, 3 points
const POINTS = [
  {
    icon: '🎯',
    title: 'Skill decides the winner, not chance.',
    desc: 'Every round is a timed word challenge. The best player wins — no luck, no house edge.',
  },
  {
    icon: '🖥️',
    title: 'Every match result is calculated server-side.',
    desc: 'Results are computed on our servers, not in your browser. Scores cannot be tampered with.',
  },
  {
    icon: '🔒',
    title: 'Large deposits and withdrawals get a manual human check before anything moves.',
    desc: 'Our team reviews every significant transaction before funds are credited or paid out.',
  },
];

export default function WhyIdubbl() {
  return (
    <section
      id="why-idubbl"
      style={{ padding: '5rem 2rem', borderBottom: '1px solid var(--border)' }}
    >
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
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
            Why iDubbl?
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: 500, margin: '0 auto' }}>
            Built on transparency, fairness, and speed.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {POINTS.map((pt, i) => (
            <div
              key={i}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                padding: '2rem 1.75rem',
                transition: 'border-color 0.2s, transform 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0,227,122,0.3)';
                e.currentTarget.style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: 'rgba(0,227,122,0.08)',
                  border: '1px solid rgba(0,227,122,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                  marginBottom: '1.25rem',
                }}
              >
                {pt.icon}
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '0.6rem',
                  lineHeight: 1.4,
                }}
              >
                {pt.title}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.65 }}>
                {pt.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
