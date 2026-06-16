import React from 'react';
import { useNavigate } from 'react-router-dom';
import HeroSection from './components/HeroSection.jsx';
import HowItWorks from './components/HowItWorks.jsx';
import TrustPoints from './components/TrustPoints.jsx';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo">iDubbl</div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="nav-btn" onClick={() => navigate('/login')}>Log in</button>
          <button className="btn-primary" onClick={() => navigate('/signup')} style={{ padding: '0.5rem 1.25rem' }}>Sign up</button>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem' }}>
        <HeroSection />
        <HowItWorks />
        <TrustPoints />
      </main>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '1.5rem 2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        © 2026 iDubbl · Skill gaming platform · USDT only · All matches are skill-based
      </footer>
    </div>
  );
}
