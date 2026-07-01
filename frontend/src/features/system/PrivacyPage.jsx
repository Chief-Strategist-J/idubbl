import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '../../shared/components/ui/index.js';
import useAuthStore from '../../shared/store/authStore.js';
import ThemeToggle from '../../shared/components/ui/ThemeToggle.jsx';

export default function PrivacyPage() {
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
            Privacy Policy
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
            <p>
              iDubbl (“we”, “our”, or “the platform”) respects your privacy and is committed to protecting your personal information.
            </p>
            <p>
              This Privacy Policy explains how we collect, use, store, and protect information when you use our platform.
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
                Information We Collect
              </h2>
              <p style={{ marginBottom: '1rem' }}>We may collect:</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginTop: '0.5rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Account Information</h3>
                  <ul style={{ paddingLeft: '1.25rem', margin: 0, color: 'var(--text-secondary)' }}>
                    <li>Name</li>
                    <li>Email address or phone number</li>
                    <li>Login credentials</li>
                    <li>Account activity information</li>
                  </ul>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Gaming and Transaction Information</h3>
                  <ul style={{ paddingLeft: '1.25rem', margin: 0, color: 'var(--text-secondary)' }}>
                    <li>Match history</li>
                    <li>Wallet activity</li>
                    <li>Deposits and withdrawals</li>
                    <li>Platform interactions</li>
                  </ul>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <h3 style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Technical Information</h3>
                  <ul style={{ paddingLeft: '1.25rem', margin: 0, color: 'var(--text-secondary)' }}>
                    <li>Device information</li>
                    <li>Browser information</li>
                    <li>IP address</li>
                    <li>Security and fraud prevention data</li>
                  </ul>
                </div>
              </div>
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
                How We Use Information
              </h2>
              <p style={{ marginBottom: '0.5rem' }}>We use collected information to:</p>
              <ul style={{ paddingLeft: '1.25rem', margin: 0, color: 'var(--text-secondary)' }}>
                <li>Create and manage user accounts</li>
                <li>Provide gaming services</li>
                <li>Process deposits and withdrawals</li>
                <li>Maintain platform security</li>
                <li>Prevent fraud, abuse, and unfair play</li>
                <li>Improve platform performance</li>
                <li>Provide customer support</li>
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
                Wallet and Transaction Data
              </h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                Transaction information may be collected to verify deposits, process withdrawals, maintain accurate account balances, and comply with security requirements.
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
                Data Protection
              </h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                We use reasonable technical and organizational measures to protect user information from unauthorized access, loss, or misuse.
              </p>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                However, no online service can guarantee absolute security.
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
                Sharing of Information
              </h2>
              <p style={{ marginBottom: '0.5rem' }}>We do not sell personal user information.</p>
              <p style={{ marginBottom: '0.5rem' }}>Information may be shared only when necessary:</p>
              <ul style={{ paddingLeft: '1.25rem', margin: 0, color: 'var(--text-secondary)' }}>
                <li>To provide platform services</li>
                <li>To comply with legal obligations</li>
                <li>To prevent fraud or security issues</li>
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
                Your Rights
              </h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                You may request access, correction, or deletion of certain personal information, subject to legal and operational requirements.
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
                For privacy-related questions, contact our support team.
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
