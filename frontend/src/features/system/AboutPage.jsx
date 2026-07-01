import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '../../shared/components/ui/index.js';
import useAuthStore from '../../shared/store/authStore.js';
import ThemeToggle from '../../shared/components/ui/ThemeToggle.jsx';

export default function AboutPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-darker)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-sans)',
        padding: '2rem 1rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative background glow */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '-10%',
          right: '5%',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0, 227, 122, 0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '-5%',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(91, 141, 239, 0.05) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Top Header */}
      <header
        style={{
          maxWidth: '800px',
          margin: '0 auto 2.5rem auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img
            className="logo-img"
            src="/black-logo.jpeg"
            alt="iDubbl"
            style={{ height: '36px', borderRadius: '6px', cursor: 'pointer' }}
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ThemeToggle />
          <Button variant="secondary" onClick={handleBack}>
            Go Back
          </Button>
        </div>
      </header>

      {/* Main content container */}
      <main
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Card style={{ padding: '2.5rem' }}>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2.25rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '2rem',
              letterSpacing: '-0.02em',
            }}
          >
            About Us
          </h1>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', lineHeight: 1.7 }}>
            <p style={{ fontSize: '1.15rem', color: 'var(--primary)', fontWeight: 500 }}>
              Welcome to iDubbl.
            </p>
            <p>
              iDubbl is a skill-based gaming platform built for players who enjoy fast, competitive challenges. We connect players in real-time matches where skill, speed, and decision-making determine the outcome.
            </p>
            <p>
              Our goal is simple: create a fair, transparent, and exciting environment where players can compete against each other and enjoy competitive gaming.
            </p>
            <p style={{ color: 'var(--text-secondary)' }}>
              Players can fund their account, select a match tier, get matched with an opponent, play a skill-based game, and receive rewards based on match outcomes.
            </p>

            <section style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.5rem', marginTop: '1rem' }}>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  marginBottom: '1.25rem',
                }}
              >
                We believe competitive gaming should be:
              </h2>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingLeft: 0, listStyle: 'none', margin: 0 }}>
                <li>
                  <strong style={{ color: 'var(--primary)' }}>Fair</strong> — every player should have an equal opportunity to compete.
                </li>
                <li>
                  <strong style={{ color: 'var(--primary)' }}>Transparent</strong> — match rules, fees, and rewards should be clear.
                </li>
                <li>
                  <strong style={{ color: 'var(--primary)' }}>Secure</strong> — user balances and transactions should be properly protected.
                </li>
                <li>
                  <strong style={{ color: 'var(--primary)' }}>Responsible</strong> — gaming should remain entertainment, not a substitute for financial activity.
                </li>
              </ul>
            </section>

            <p style={{ color: 'var(--text-secondary)' }}>
              iDubbl uses technology to manage matchmaking, gameplay, wallet records, and settlements while maintaining a smooth experience for players.
            </p>

            <div
              style={{
                textAlign: 'center',
                fontFamily: 'var(--font-display)',
                fontSize: '1.5rem',
                fontWeight: 700,
                color: 'var(--primary)',
                letterSpacing: '0.05em',
                marginTop: '2rem',
                borderTop: '1px solid var(--border)',
                paddingTop: '2rem',
              }}
            >
              Play. Compete. Improve.
            </div>
          </div>
        </Card>
      </main>

      <footer
        style={{
          maxWidth: '800px',
          margin: '2.5rem auto 0 auto',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.8rem',
          position: 'relative',
          zIndex: 1,
        }}
      >
        © {new Date().getFullYear()} iDubbl · Skill gaming platform · All rights reserved.
      </footer>
    </div>
  );
}
