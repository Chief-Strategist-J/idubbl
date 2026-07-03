import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Gamepad2, Zap, Wallet, Clock, User, MessageCircle } from 'lucide-react';
import useAuthStore from '../../store/authStore.js';
import useWalletStore from '../../store/walletStore.js';
import usePlatformStore from '../../store/platformStore.js';
import ThemeToggle from '../ui/ThemeToggle.jsx';
import OfflineBanner from '../ui/OfflineBanner.jsx';
import SessionExpiredModal from '../ui/SessionExpiredModal.jsx';

const ALL_NAV_ITEMS = [
  { label: 'Dashboard', short: 'Home',    path: '/dashboard',     icon: Home,          requiresChat: false },
  { label: 'Games',     short: 'Games',   path: '/lobby',         icon: Gamepad2,      requiresChat: false },
  { label: 'Wallet',    short: 'Wallet',  path: '/wallet',        icon: Wallet,        requiresChat: false },
  { label: 'Chat',      short: 'Chat',    path: '/chat',          icon: MessageCircle, requiresChat: true  },
  { label: 'Profile',   short: 'Profile', path: '/profile',       icon: User,          requiresChat: false },
];

const ALL_HEADER_NAV = [
  { label: 'Dashboard', path: '/dashboard', requiresChat: false },
  { label: 'Games',     path: '/lobby',     requiresChat: false },
  { label: 'Wallet',    path: '/wallet',    requiresChat: false },
  { label: 'Chat',      path: '/chat',      requiresChat: true  },
  { label: 'Profile',   path: '/profile',   requiresChat: false },
];

export default function AppLayout({ children, noPadding = false, hideBottomNav = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { availableBalance } = useWalletStore();
  const { chatEnabled, fetchPlatformSettings } = usePlatformStore();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetchPlatformSettings();
  }, [fetchPlatformSettings]);

  const NAV_ITEMS    = ALL_NAV_ITEMS.filter(i => !i.requiresChat || chatEnabled);
  const HEADER_NAV   = ALL_HEADER_NAV.filter(i => !i.requiresChat || chatEnabled);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="app-container">
      <OfflineBanner />
      <SessionExpiredModal />

      <header className="header">
        <div className="header-container">
          <div className="logo" onClick={() => navigate('/dashboard')}>
            <img className="logo-img" src="/black-logo.jpeg" alt="iDubbl" style={{ height: '40px', borderRadius: '8px' }} />
          </div>

          <nav className="nav-links">
            {HEADER_NAV.map((item) => (
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
            <div
              className="balance-pill"
              title="Available balance: ready to use. Locked balance: reserved in active matches."
              aria-label={`Available balance: ${availableBalance.toFixed(2)} USDT`}
            >
              <span className="balance-pill-amount">{availableBalance.toFixed(2)}</span>
              <span className="balance-pill-unit"> USDT available</span>
            </div>

            <ThemeToggle className="desktop-only" />

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
        </div>
      </header>

      <div className={`mobile-overflow-drawer ${menuOpen ? 'drawer-open' : ''}`}>
        <button
          className="overflow-drawer-btn"
          onClick={() => { navigate('/profile'); setMenuOpen(false); }}
        >
          <span>Profile Settings</span>
        </button>
        <div
          onClick={() => { navigate('/transactions'); setMenuOpen(false); }}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
        >
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>History</span>
          <Clock size={16} style={{ color: 'var(--text-secondary)' }} />
        </div>
        {user?.role === 'admin' && (
          <button
            className="overflow-drawer-btn"
            onClick={() => { navigate('/admin'); setMenuOpen(false); }}
          >
            <span style={{ color: 'var(--secondary)' }}>Admin Panel</span>
          </button>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>Theme</span>
          <ThemeToggle />
        </div>
        <button className="overflow-drawer-btn overflow-drawer-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {menuOpen && <div className="nav-overlay" onClick={() => setMenuOpen(false)} />}

      <main className={noPadding ? 'main-content main-content--no-padding' : 'main-content'}>{children}</main>

      {/* Mobile bottom tab bar — design.md §2.3: Home · Play · Wallet · History · Profile */}
      {!hideBottomNav && (
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
      )}
    </div>
  );
}
