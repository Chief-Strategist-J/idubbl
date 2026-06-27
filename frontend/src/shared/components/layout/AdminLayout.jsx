import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore.js';
import ThemeToggle from '../ui/ThemeToggle.jsx';

const ADMIN_NAV = [
  { label: 'Dashboard', path: '/admin', icon: '📊' },
  { label: 'Deposits', path: '/admin/deposits', icon: '💳' },
  { label: 'Withdrawals', path: '/admin/withdrawals', icon: '💸' },
  { label: 'Live Matches', path: '/admin/matches', icon: '⚔️' },
  { label: 'Users', path: '/admin/users', icon: '👥' },
  { label: 'Tiers', path: '/admin/tiers', icon: '🏆' },
  { label: 'Ledger', path: '/admin/ledger', icon: '📒' },
  { label: 'Audit Log', path: '/admin/audit', icon: '🔍' },
];

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const goTo = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  return (
    <div className="admin-shell">
      {/* Mobile top bar */}
      <header className="admin-mobile-bar">
        <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => goTo('/admin')}>
          <img className="logo-img" src="/black-logo.jpeg" alt="iDubbl" style={{ height: '36px', borderRadius: '6px' }} />
          <span style={{ fontSize: '0.65rem', background: 'rgba(20, 241, 149, 0.15)', color: 'var(--secondary)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'var(--font-sans)' }}>Admin</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ThemeToggle />
          <button
            className="hamburger-btn"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label="Toggle sidebar"
          >
            <span className={`hamburger-line ${sidebarOpen ? 'open' : ''}`} />
            <span className={`hamburger-line ${sidebarOpen ? 'open' : ''}`} />
            <span className={`hamburger-line ${sidebarOpen ? 'open' : ''}`} />
          </button>
        </div>
      </header>

      {/* Overlay */}
      {sidebarOpen && <div className="nav-overlay" onClick={() => setSidebarOpen(false)} />}

      <div className="admin-body">
        {/* Sidebar */}
        <aside className={`admin-sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
          <div className="logo admin-sidebar-logo" onClick={() => goTo('/admin')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <img className="logo-img" src="/black-logo.jpeg" alt="iDubbl" style={{ height: '40px', borderRadius: '8px' }} />
            <span style={{ fontSize: '0.7rem', background: 'rgba(20, 241, 149, 0.15)', color: 'var(--secondary)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'var(--font-sans)' }}>Admin</span>
          </div>

          <nav style={{ flex: 1 }}>
            {ADMIN_NAV.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => goTo(item.path)}
                  className={`admin-nav-item ${isActive ? 'active' : ''}`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="admin-sidebar-footer">
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 8 }}>
              {user?.firstName} {user?.lastName}
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="nav-btn" style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }} onClick={() => goTo('/dashboard')}>
                Player view
              </button>
              <button className="nav-btn" style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }} onClick={() => { logout(); navigate('/admin/login'); }}>
                Logout
              </button>
              <ThemeToggle style={{ fontSize: '0.8rem' }} />
            </div>
          </div>
        </aside>

        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
