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

        <nav className="nav-links" style={{ display: window.innerWidth < 768 ? (menuOpen ? 'flex' : 'none') : 'flex', flexDirection: window.innerWidth < 768 ? 'column' : 'row', position: window.innerWidth < 768 ? 'absolute' : 'static', top: 70, left: 0, right: 0, background: window.innerWidth < 768 ? 'var(--bg-dark)' : 'transparent', padding: window.innerWidth < 768 ? '1rem' : 0, zIndex: 99, borderBottom: window.innerWidth < 768 ? '1px solid var(--border)' : 'none' }}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.path}
              className={`nav-btn ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => { navigate(item.path); setMenuOpen(false); }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="header-right">
          <div className="balance-pill">
            <span>💰</span>
            <span>{availableBalance.toFixed(2)} USDT</span>
          </div>
          {user?.role === 'admin' && (
            <button className="nav-btn" onClick={() => navigate('/admin')} style={{ color: 'var(--secondary)' }}>
              Admin
            </button>
          )}
          <button className="nav-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main className="main-content">{children}</main>
    </div>
  );
}
