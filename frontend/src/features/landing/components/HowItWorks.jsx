import React from 'react';

// design.md §3.1 — 4 steps, exact spec copy
const STEPS = [
  {
    num: '01',
    title: 'Fund your wallet',
    desc: 'Deposit USDT, credited after a quick review.',
    icon: '💳',
  },
  {
    num: '02',
    title: 'Choose a tier',
    desc: 'Pick an entry fee that fits your bankroll.',
    icon: '🎯',
  },
  {
    num: '03',
    title: 'Get matched',
    desc: 'We pair you with an opponent in your tier, fast.',
    icon: '⚡',
  },
  {
    num: '04',
    title: 'Win the pool',
    desc: 'Best of 3 rounds. Win two, take the pool.',
    icon: '🏆',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="how-it-works-section">
      <h2 className="how-it-works-title">How iDubbl Works</h2>

      <div className="how-it-works-grid">
        {STEPS.map((s, idx) => (
          <div key={s.num} style={{ textAlign: 'center', position: 'relative' }}>
            {/* connector line between steps (desktop) */}
            {idx < STEPS.length - 1 && (
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: 28,
                  right: '-20%',
                  width: '40%',
                  height: 1,
                  background: 'linear-gradient(90deg, var(--border), transparent)',
                  display: 'none', // visible via CSS class on desktop
                }}
                className="step-connector"
              />
            )}

            <div className="glass-card" style={{ textAlign: 'center', height: '100%' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{s.icon}</div>
              <div
                style={{
                  color: 'var(--primary)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  marginBottom: '0.5rem',
                }}
              >
                Step {s.num}
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  marginBottom: '0.6rem',
                  color: 'var(--text-primary)',
                }}
              >
                {s.title}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.65 }}>
                {s.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
