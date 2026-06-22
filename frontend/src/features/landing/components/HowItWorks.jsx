import React from 'react';

const STEPS = [
  { icon: '💳', step: '01', title: 'Fund Your Wallet', desc: 'Send USDT to the platform address. Paste your transaction hash for review. Credits appear after confirmation.' },
  { icon: '🎯', step: '02', title: 'Join a Tier', desc: 'Choose a Bronze, Silver, or Gold tier. Your entry fee is reserved. You are matched with an opponent in seconds.' },
  { icon: '🏆', step: '03', title: 'Win the Pool', desc: 'Play 3 rounds of Word Duel. Best of 3 wins the pool minus the platform rake. Winnings credited instantly.' },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="how-it-works-section">
      <h2 className="how-it-works-title">
        How iDubbl Works
      </h2>

      <div className="how-it-works-grid">
        {STEPS.map((s) => (
          <div key={s.step} className="glass-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{s.icon}</div>
            <div style={{ color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: 2, marginBottom: '0.5rem' }}>STEP {s.step}</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: '0.75rem' }}>{s.title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
