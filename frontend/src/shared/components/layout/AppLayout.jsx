import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore.js';
import useWalletStore from '../../store/walletStore.js';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Play', path: '/lobby' },
  { label: 'Deposit', path: '/deposit' },
  { label: 'Withdraw', path: '/withdraw' },
  { label: 'History', path: '/transactions' },
];

export default function AppLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { availableBalance } = useWalletStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo" onClick={() => navigate('/dashboard')}>
          <span>i</span>Dubbl
        </div>

        <nav className={`nav-links ${menuOpen ? 'nav-open' : ''}`}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.path}
              className={`nav-btn ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => { navigate(item.path); setMenuOpen(false); }}
            >
              {item.label}
            </button>
          ))}
          {/* Mobile-only logout inside nav drawer */}
          <button className="nav-btn mobile-only-nav-item" onClick={handleLogout}>Logout</button>
        </nav>

        <div className="header-right">
          <div className="balance-pill">
            <span>💰</span>
            <span>{availableBalance.toFixed(2)} USDT</span>
          </div>
          {user?.role === 'admin' && (
            <button className="nav-btn desktop-only" onClick={() => navigate('/admin')} style={{ color: 'var(--secondary)' }}>
              Admin
            </button>
          )}
          <button className="nav-btn desktop-only" onClick={handleLogout}>Logout</button>
          <button
            className="hamburger-btn"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <span className={`hamburger-line ${menuOpen ? 'open' : ''}`} />
            <span className={`hamburger-line ${menuOpen ? 'open' : ''}`} />
            <span className={`hamburger-line ${menuOpen ? 'open' : ''}`} />
          </button>
        </div>
      </header>

      {/* Overlay when mobile menu is open */}
      {menuOpen && <div className="nav-overlay" onClick={() => setMenuOpen(false)} />}

      <main className="main-content">{children}</main>
    </div>
  );
}
