import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '../../shared/components/ui/index.js';
import useAuthStore from '../../shared/store/authStore.js';
import ThemeToggle from '../../shared/components/ui/ThemeToggle.jsx';

export default function ResponsiblePlayPage() {
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
              marginBottom: '0.5rem',
              letterSpacing: '-0.02em',
            }}
          >
            Responsible Play
          </h1>
          <div
            style={{
              height: '2px',
              background: 'linear-gradient(90deg, var(--primary) 0%, transparent 100%)',
              width: '100px',
              marginBottom: '2rem',
            }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', lineHeight: 1.7 }}>
            <p style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 500 }}>
              At iDubbl, we believe competitive gaming should be enjoyable, controlled, and responsible.
            </p>
            <p>
              Our platform is designed for entertainment and competition. Players should only participate with amounts they are comfortable using.
            </p>

            <section>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.4rem',
                  fontWeight: 600,
                  color: 'var(--primary)',
                  marginBottom: '1rem',
                }}
              >
                Play Responsibly
              </h2>
              <p style={{ marginBottom: '0.75rem' }}>We encourage users to:</p>
              <ul style={{ paddingLeft: '1.25rem', margin: 0, color: 'var(--text-secondary)' }}>
                <li>Set personal limits before playing</li>
                <li>Treat gameplay as entertainment</li>
                <li>Avoid playing when stressed, upset, or under pressure</li>
                <li>Take breaks regularly</li>
                <li>Never use money needed for essential expenses</li>
              </ul>
            </section>

            <section>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.4rem',
                  fontWeight: 600,
                  color: 'var(--primary)',
                  marginBottom: '1rem',
                }}
              >
                Understand the Experience
              </h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                iDubbl is based on competitive skill games. Winning is never guaranteed, and every match carries an outcome risk.
              </p>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                Players should focus on improving their skills and enjoying competition rather than chasing losses.
              </p>
            </section>

            <section>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.4rem',
                  fontWeight: 600,
                  color: 'var(--primary)',
                  marginBottom: '1rem',
                }}
              >
                Fair Play
              </h2>
              <p style={{ marginBottom: '0.75rem' }}>We maintain rules designed to support a fair environment.</p>
              <p style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Users should not:</p>
              <ul style={{ paddingLeft: '1.25rem', margin: 0, color: 'var(--text-secondary)' }}>
                <li>Create multiple accounts to gain unfair advantages</li>
                <li>Use unauthorized tools</li>
                <li>Exploit platform errors</li>
                <li>Collude with other players</li>
              </ul>
            </section>

            <section style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '1rem' }}>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.4rem',
                  fontWeight: 600,
                  color: 'var(--primary)',
                  marginBottom: '1.0rem',
                }}
              >
                Need Help?
              </h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                If gaming is affecting your personal, financial, or daily life, consider taking a break and seeking support from appropriate resources.
              </p>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                Contact our support team if you have concerns about your account or gameplay.
              </p>
            </section>
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
