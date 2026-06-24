import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../shared/components/ui/index.js';

// design.md §3.1 — Game spotlight section
export default function GameSpotlight() {
  const navigate = useNavigate();

  return (
    <section
      id="game-spotlight"
      style={{
        padding: '5rem 2rem',
        background: 'linear-gradient(135deg, rgba(0,227,122,0.04) 0%, rgba(10,13,18,0) 60%)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '3rem',
            alignItems: 'center',
          }}
        >
          {/* Text side */}
          <div>
            <span
              style={{
                display: 'inline-block',
                background: 'rgba(0,227,122,0.1)',
                border: '1px solid rgba(0,227,122,0.25)',
                color: 'var(--primary)',
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                padding: '0.3rem 0.8rem',
                borderRadius: 999,
                marginBottom: '1.25rem',
              }}
            >
              Featured Game
            </span>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
                fontWeight: 700,
                marginBottom: '1rem',
                color: 'var(--text-primary)',
              }}
            >
              Word Duel: Anagram Sprint
            </h2>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '1.05rem',
                lineHeight: 1.75,
                marginBottom: '2rem',
              }}
            >
              Same 7 letters. 20 seconds. Highest score wins the round. Best of 3 takes the match.
            </p>
            <Button variant="primary" onClick={() => navigate('/signup')}>
              Play Word Duel
            </Button>
          </div>

          {/* Visual side — letter tiles */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            {/* Simulated letter tiles */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              {[
                { l: 'W', pts: 4 },
                { l: 'O', pts: 1 },
                { l: 'R', pts: 1 },
                { l: 'D', pts: 2 },
                { l: 'S', pts: 1 },
                { l: 'K', pts: 5 },
                { l: 'E', pts: 1 },
              ].map(({ l, pts }, i) => (
                <div
                  key={i}
                  style={{
                    width: 56,
                    height: 56,
                    background: 'var(--bg-card)',
                    border: '2px solid var(--primary)',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    boxShadow: '0 4px 16px rgba(0,227,122,0.15)',
                    animation: `tilePop 0.4s ${i * 0.05}s both`,
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 700,
                      fontSize: '1.4rem',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {l}
                  </span>
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 3,
                      right: 4,
                      fontSize: '0.55rem',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--primary)',
                      fontWeight: 700,
                    }}
                  >
                    {pts}
                  </span>
                </div>
              ))}
            </div>

            {/* Score preview */}
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '0.75rem 1.5rem',
                display: 'flex',
                gap: '2rem',
                fontSize: '0.85rem',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Your word</p>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--primary)' }}>WORDS</p>
                <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-green)', fontSize: '0.75rem' }}>9 pts</p>
              </div>
              <div style={{ width: 1, background: 'var(--border)' }} />
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Opponent</p>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--text-secondary)' }}>—</p>
                <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>waiting…</p>
              </div>
            </div>

            {/* Round timer ring mockup */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  border: '3px solid var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  color: 'var(--primary)',
                  boxShadow: '0 0 16px rgba(0,227,122,0.3)',
                }}
              >
                12s
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>remaining</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
