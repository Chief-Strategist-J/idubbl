import React, { useState } from 'react';

// design.md §3.1 — FAQ accordion, 6 Q&A items (exact copy from spec)
const FAQS = [
  {
    q: 'What is iDubbl?',
    a: 'iDubbl is a 1v1 skill game platform. Two players put up the same entry fee, play a short match, and the winner takes the pool minus a small platform fee.',
  },
  {
    q: 'Is this gambling?',
    a: 'No. Outcomes are decided by player skill in a timed word game, not by chance or odds.',
  },
  {
    q: 'How fast are withdrawals?',
    a: 'Approved withdrawal requests are typically paid out the same day.',
  },
  {
    q: "What happens if I disconnect mid-match?",
    a: "You'll have a short window to reconnect. If you don't reconnect in time, the round may be scored as a loss.",
  },
  {
    q: 'What currency do I use?',
    a: 'iDubbl currently supports USDT on the TRC-20 network for deposits and withdrawals.',
  },
  {
    q: 'How is the winner of a round decided?',
    a: 'The player with the higher score in the round wins it. Two round wins takes the match.',
  },
];

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (i) => setOpenIndex(openIndex === i ? null : i);

  return (
    <section
      id="faq"
      style={{ padding: '5rem 2rem', borderBottom: '1px solid var(--border)' }}
    >
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '0.5rem',
            }}
          >
            Frequently asked questions
          </h2>
        </div>

        {/* Accordion items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                style={{
                  background: 'var(--bg-card)',
                  border: `1px solid ${isOpen ? 'rgba(0,227,122,0.3)' : 'var(--border)'}`,
                  borderRadius: 12,
                  overflow: 'hidden',
                  transition: 'border-color 0.2s',
                }}
              >
                <button
                  onClick={() => toggle(i)}
                  style={{
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    padding: '1.25rem 1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    gap: '1rem',
                    textAlign: 'left',
                  }}
                  aria-expanded={isOpen}
                  id={`faq-btn-${i}`}
                  aria-controls={`faq-panel-${i}`}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontWeight: 600,
                      fontSize: '0.975rem',
                      color: 'var(--text-primary)',
                      lineHeight: 1.5,
                    }}
                  >
                    {faq.q}
                  </span>
                  <span
                    style={{
                      color: isOpen ? 'var(--primary)' : 'var(--text-muted)',
                      fontSize: '1.2rem',
                      lineHeight: 1,
                      flexShrink: 0,
                      transition: 'transform 0.25s, color 0.2s',
                      transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                      display: 'inline-block',
                    }}
                  >
                    +
                  </span>
                </button>

                {isOpen && (
                  <div
                    id={`faq-panel-${i}`}
                    role="region"
                    aria-labelledby={`faq-btn-${i}`}
                    style={{
                      padding: '0 1.5rem 1.25rem',
                      color: 'var(--text-secondary)',
                      fontSize: '0.9rem',
                      lineHeight: 1.7,
                      borderTop: '1px solid var(--border)',
                      paddingTop: '1rem',
                    }}
                  >
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
