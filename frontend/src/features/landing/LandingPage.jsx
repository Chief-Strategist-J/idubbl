import React from 'react';
import { useNavigate } from 'react-router-dom';
import HeroSection from './components/HeroSection.jsx';
import HowItWorks from './components/HowItWorks.jsx';
import TrustPoints from './components/TrustPoints.jsx';
import GameSpotlight from './components/GameSpotlight.jsx';
import TierPreview from './components/TierPreview.jsx';
import WhyIdubbl from './components/WhyIdubbl.jsx';
import FaqAccordion from './components/FaqAccordion.jsx';
import ThemeToggle from '../../shared/components/ui/ThemeToggle.jsx';

// design.md §2.1 — Header (logged out): Logo · "How it works" / "Tiers" / "Support" · Log in + Sign up
const PUBLIC_NAV = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Tiers', href: '#tiers' },
  { label: 'Support', href: '/support' },
];

// design.md §3.1 footer links
const FOOTER_LINKS = [
  'About', 'How it works', 'Tiers', 'Support', 'Terms', 'Privacy', 'Responsible Play',
];

function scrollTo(href) {
  if (href.startsWith('#')) {
    document.getElementById(href.slice(1))?.scrollIntoView({ behavior: 'smooth' });
  }
}

export default function LandingPage() {
  const navigate = useNavigate();

  const handleNavClick = (item) => {
    if (item.href.startsWith('#')) {
      scrollTo(item.href);
    } else {
      navigate(item.href);
    }
  };

  return (
    <div className="app-container">
      {/* ── Header — §2.1 ── */}
      <header className="header">
        <div className="header-container">
          <div className="logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
            <img
              className="logo-img"
              src="/black-logo.jpeg"
              alt="iDubbl"
              style={{ height: '40px', borderRadius: '8px' }}
            />
          </div>

          {/* Nav links — §2.1: "How it works" / "Tiers" / "Support" */}
          <nav className="nav-links" aria-label="Public navigation">
            {PUBLIC_NAV.map((item) => (
              <button
                key={item.label}
                className="nav-btn"
                onClick={() => handleNavClick(item)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ThemeToggle />
            <button className="nav-btn" onClick={() => navigate('/login')}>Log in</button>
            <button
              className="btn-primary"
              onClick={() => navigate('/signup')}
              style={{ padding: '0.5rem 1.25rem' }}
            >
              Sign up
            </button>
          </div>
        </div>
      </header>

      {/* ── Main content — §3.1 layout (9 sections) ── */}
      <main className="landing-main">
        {/* 1. Hero */}
        <HeroSection />

        {/* 2. Trust strip */}
        <TrustPoints />

        {/* 3. How it works (4 steps) */}
        <HowItWorks />

        {/* 4. Game spotlight — Word Duel */}
        <GameSpotlight />

        {/* 5. Tier preview cards */}
        <TierPreview />

        {/* 6. "Why iDubbl" reassurance */}
        <WhyIdubbl />

        {/* 7. FAQ accordion */}
        <FaqAccordion />
      </main>

      {/* ── Footer — §3.1: 7 links ── */}
      <footer
        style={{
          borderTop: '1px solid var(--border)',
          padding: '2.5rem 2rem',
          background: 'var(--bg-darker)',
        }}
      >
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
          {/* Logo */}
          <img
            className="logo-img"
            src="/black-logo.jpeg"
            alt="iDubbl"
            style={{ height: '36px', borderRadius: '6px', opacity: 0.8 }}
          />

          {/* Links */}
          <nav aria-label="Footer navigation">
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '0.25rem 1.5rem',
              }}
            >
              {FOOTER_LINKS.map((link) => (
                <a
                  key={link}
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                    transition: 'color 0.15s',
                    padding: '0.25rem 0',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  {link}
                </a>
              ))}
            </div>
          </nav>

          {/* Legal line */}
          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textAlign: 'center', lineHeight: 1.6 }}>
            © {new Date().getFullYear()} iDubbl · Skill gaming platform · USDT (TRC-20) only · All matches are skill-based
          </p>
        </div>
      </footer>
    </div>
  );
}
