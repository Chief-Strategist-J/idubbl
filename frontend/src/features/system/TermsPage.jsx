import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '../../shared/components/ui/index.js';
import useAuthStore from '../../shared/store/authStore.js';
import ThemeToggle from '../../shared/components/ui/ThemeToggle.jsx';

export default function TermsPage() {
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
            Terms of Use
          </h1>
          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              marginBottom: '2rem',
              borderBottom: '1px solid var(--border)',
              paddingBottom: '1.5rem',
            }}
          >
            Last updated: June 2026
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', lineHeight: 1.7 }}>
            <p style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 500 }}>
              By accessing or using iDubbl, you agree to these Terms of Use.
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
                Eligibility
              </h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                You must meet the minimum legal age requirements applicable in your location to use the platform.
              </p>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                You are responsible for ensuring that your use of iDubbl complies with your local laws.
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
                Account Responsibilities
              </h2>
              <p style={{ marginBottom: '0.75rem' }}>You agree to:</p>
              <ul style={{ paddingLeft: '1.25rem', margin: 0, color: 'var(--text-secondary)' }}>
                <li>Provide accurate account information</li>
                <li>Keep your login credentials secure</li>
                <li>Maintain only one account unless otherwise permitted</li>
                <li>Not allow others to access your account</li>
              </ul>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.75rem' }}>
                You are responsible for activity performed through your account.
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
                Skill Games
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                iDubbl provides skill-based competitive games. Match outcomes are determined according to platform rules, game mechanics, and recorded results.
              </p>
              <p style={{ marginBottom: '0.5rem' }}>Players must not:</p>
              <ul style={{ paddingLeft: '1.25rem', margin: 0, color: 'var(--text-secondary)' }}>
                <li>Use cheats, exploits, automation tools, or unfair methods</li>
                <li>Manipulate match outcomes</li>
                <li>Interfere with other players</li>
              </ul>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.75rem', fontStyle: 'italic' }}>
                Accounts involved in unfair activity may be restricted or suspended.
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
                Wallets and Payments
              </h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                Users may fund their accounts through supported payment methods. Deposits, balances, and withdrawals are subject to platform verification and processing procedures.
              </p>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                Match entries may reserve available credits until the match is completed or cancelled according to platform rules.
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
                Withdrawals
              </h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                Withdrawal requests may require review before completion.
              </p>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                We may delay, reject, or investigate requests involving security concerns, suspected fraud, or violations of these Terms.
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
                Platform Availability
              </h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                We work to keep iDubbl available but do not guarantee uninterrupted access. Maintenance, technical issues, or external factors may temporarily affect availability.
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
                Changes
              </h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                We may update these Terms from time to time. Continued use of the platform after updates means you accept the revised Terms.
              </p>
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
                Contact
              </h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                Questions regarding these Terms can be sent to our support team.
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
