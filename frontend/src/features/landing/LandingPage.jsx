import React from 'react';
import { useNavigate } from 'react-router-dom';
import HeroSection from './components/HeroSection.jsx';
import HowItWorks from './components/HowItWorks.jsx';
import TrustPoints from './components/TrustPoints.jsx';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../shared/context/ThemeContext.jsx';

export default function LandingPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo">
          <img src="/black-logo.jpeg" alt="iDubbl" style={{ height: '40px', borderRadius: '8px' }} />
        </div>
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            className="nav-btn"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.5rem',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              minWidth: '40px',
              background: 'var(--glass-bg)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              cursor: 'pointer'
            }}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button className="nav-btn" onClick={() => navigate('/login')}>Log in</button>
          <button className="btn-primary" onClick={() => navigate('/signup')} style={{ padding: '0.5rem 1.25rem' }}>Sign up</button>
        </div>
      </header>

      <main className="landing-main">
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
