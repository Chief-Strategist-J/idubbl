import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Zap, PlusCircle, ArrowUpCircle, Clock } from 'lucide-react';
import useAuthStore from '../../store/authStore.js';
import useWalletStore from '../../store/walletStore.js';

const NAV_ITEMS = [
  { label: 'Dashboard', short: 'Home', path: '/dashboard', icon: Home },
  { label: 'Play', short: 'Play', path: '/lobby', icon: Zap },
  { label: 'Deposit', short: 'Deposit', path: '/deposit', icon: PlusCircle },
  { label: 'Withdraw', short: 'Withdraw', path: '/withdraw', icon: ArrowUpCircle },
  { label: 'History', short: 'History', path: '/transactions', icon: Clock },
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
          <img src="/black-logo.jpeg" alt="iDubbl" style={{ height: '40px', borderRadius: '8px' }} />
        </div>

        {/* Desktop-only navigation */}
        <nav className="nav-links">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.path}
              className={`nav-btn ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="header-right">
          <div className="balance-pill">
            <span>💰</span>
            <span className="balance-pill-amount">{availableBalance.toFixed(2)}</span>
            <span className="balance-pill-unit"> USDT</span>
          </div>

          {user?.role === 'admin' && (
            <button
              className="nav-btn desktop-only"
              onClick={() => navigate('/admin')}
              style={{ color: 'var(--secondary)' }}
            >
              Admin
            </button>
          )}
          <button className="nav-btn desktop-only" onClick={handleLogout}>Logout</button>

          {/* Mobile: hamburger opens overflow menu (logout + admin) */}
          <button
            className="hamburger-btn"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="More options"
          >
            <span className={`hamburger-line ${menuOpen ? 'open' : ''}`} />
            <span className={`hamburger-line ${menuOpen ? 'open' : ''}`} />
            <span className={`hamburger-line ${menuOpen ? 'open' : ''}`} />
          </button>
        </div>
      </header>

      {/* Mobile overflow dropdown */}
      <div className={`mobile-overflow-drawer ${menuOpen ? 'drawer-open' : ''}`}>
        {user?.role === 'admin' && (
          <button
            className="overflow-drawer-btn"
            onClick={() => { navigate('/admin'); setMenuOpen(false); }}
          >
            <span style={{ color: 'var(--secondary)' }}>Admin Panel</span>
          </button>
        )}
        <button className="overflow-drawer-btn overflow-drawer-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {menuOpen && <div className="nav-overlay" onClick={() => setMenuOpen(false)} />}

      <main className="main-content">{children}</main>

      {/* Mobile bottom tab bar */}
      <nav className="bottom-nav" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
              aria-label={item.label}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.75} />
              <span>{item.short}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
