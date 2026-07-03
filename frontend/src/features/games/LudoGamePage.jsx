import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../../shared/components/layout/AppLayout.jsx';
import useAuthStore from '../../shared/store/authStore.js';
import ThemeToggle from '../../shared/components/ui/ThemeToggle.jsx';

export default function LudoGamePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const iframeRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 640);

  React.useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleFullscreen = () => {
    const el = iframeRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  /* ── MOBILE: full-screen iframe, no scroll, no header ── */
  if (isMobile) {
    return (
      <div style={{
        width: '100vw',
        height: '100dvh',
        overflow: 'hidden',
        background: '#0d1117',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <iframe
          ref={iframeRef}
          src="/ludo-game/index.html"
          title="Ludo Classic Game"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block',
            flex: 1
          }}
          allow="fullscreen"
        />
      </div>
    );
  }

  const content = (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0.5rem 0.25rem 5rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0.25rem 1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.4rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            🎲 Ludo Classic
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '0.25rem' }}>
            2–4 players · Classic board game · Human vs Bot supported
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/games')}
            style={{
              padding: '0.45rem 1rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--text-secondary)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            ← Back to Games
          </button>
          <button
            onClick={handleFullscreen}
            style={{
              padding: '0.45rem 1rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--text-secondary)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
          >
            {isFullscreen ? '⊡ Exit Fullscreen' : '⛶ Fullscreen'}
          </button>
        </div>
      </div>

      {/* Info Strip */}
      <div style={{
        display: 'flex',
        gap: '0.6rem',
        marginBottom: '1rem',
        flexWrap: 'wrap'
      }}>
        {[
          { icon: '👥', label: '2–4 Players' },
          { icon: '🤖', label: 'Bot AI Available' },
          { icon: '⭐', label: 'Safe Cell Rules' },
          { icon: '🎲', label: 'Classic Rules' },
          { icon: '🏆', label: 'First to Center Wins' }
        ].map(({ icon, label }) => (
          <span key={label} style={{
            padding: '0.3rem 0.75rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '20px',
            fontSize: '0.72rem',
            color: 'var(--text-secondary)',
            fontWeight: 600
          }}>
            {icon} {label}
          </span>
        ))}
      </div>

      {/* Game iframe */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '0',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
        minHeight: '480px',
        position: 'relative'
      }}>
        <div style={{
          width: '100%',
          paddingTop: '100%',
          position: 'relative',
          minHeight: '420px'
        }}>
          <iframe
            ref={iframeRef}
            src="/ludo-game/index.html"
            title="Ludo Classic Game"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              display: 'block',
              borderRadius: '0',
              position: 'absolute',
              top: 0,
              left: 0
            }}
            allow="fullscreen"
          />
        </div>
      </div>

      {/* How to Play */}
      <div style={{
        marginTop: '1.5rem',
        padding: '1.25rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: '12px'
      }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
          📋 How to Play
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
          {[
            { icon: '1️⃣', text: 'Select 2–4 players and choose Human or Bot for each.' },
            { icon: '2️⃣', text: 'Roll a 6 to bring your token out of the home base.' },
            { icon: '3️⃣', text: 'Click a highlighted token (gold ring) to move it after rolling.' },
            { icon: '4️⃣', text: 'Land on opponents to send them back to base (⭐ safe cells excluded).' },
            { icon: '5️⃣', text: 'Rolling a 6 earns an extra turn.' },
            { icon: '🏆', text: 'First to get all 4 tokens to the center wins!' },
          ].map(({ icon, text }) => (
            <div key={icon} style={{
              display: 'flex',
              gap: '0.6rem',
              alignItems: 'flex-start',
              padding: '0.6rem',
              background: 'var(--bg-dark)',
              borderRadius: '8px',
              border: '1px solid var(--border)'
            }}>
              <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{icon}</span>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (isAuthenticated) {
    return <AppLayout>{content}</AppLayout>;
  }

  // Public layout (not logged in)
  return (
    <div className="app-container">
      <header className="header">
        <div className="header-container">
          <div className="logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
            <img className="logo-img" src="/black-logo.jpeg" alt="iDubbl" style={{ height: '40px', borderRadius: '8px' }} />
          </div>
          <nav className="nav-links" aria-label="Public navigation">
            <button className="nav-btn" onClick={() => navigate('/')}>Home</button>
            <button className="nav-btn active" onClick={() => navigate('/games')}>Games</button>
            <button className="nav-btn" onClick={() => navigate('/support')}>Support</button>
          </nav>
          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ThemeToggle />
            <button className="nav-btn" onClick={() => navigate('/login')}>Log in</button>
            <button className="btn-primary" onClick={() => navigate('/signup')} style={{ padding: '0.5rem 1.25rem' }}>Sign up</button>
          </div>
        </div>
      </header>
      <main style={{ padding: '1rem 0.25rem', minHeight: 'calc(100vh - 200px)' }}>
        {content}
      </main>
      <footer style={{ borderTop: '1px solid var(--border)', padding: '2.5rem 2rem', background: 'var(--bg-darker)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
          <img className="logo-img" src="/black-logo.jpeg" alt="iDubbl" style={{ height: '36px', borderRadius: '6px', opacity: 0.8 }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', textAlign: 'center', lineHeight: 1.6 }}>
            © {new Date().getFullYear()} iDubbl · Skill gaming platform · Ludo Classic is free to play
          </p>
        </div>
      </footer>
    </div>
  );
}
