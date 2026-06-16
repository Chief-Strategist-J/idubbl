import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore.js';

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

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-darker)' }}>
      <aside style={{ width: 240, background: 'var(--bg-dark)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '1.5rem 0', flexShrink: 0 }}>
        <div className="logo" style={{ paddingLeft: '1.5rem', marginBottom: '2rem', fontSize: '1.5rem' }} onClick={() => navigate('/admin')}>
          <span>i</span>Dubbl <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>Admin</span>
        </div>

        <nav style={{ flex: 1 }}>
          {ADMIN_NAV.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  width: '100%', padding: '0.75rem 1.5rem', background: 'none', border: 'none',
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  fontFamily: 'var(--font-sans)', fontSize: '0.95rem', fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer', textAlign: 'left',
                  borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 8 }}>{user?.firstName} {user?.lastName}</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="nav-btn" style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }} onClick={() => navigate('/dashboard')}>Player view</button>
            <button className="nav-btn" style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem' }} onClick={() => { logout(); navigate('/'); }}>Logout</button>
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto', maxHeight: '100vh' }}>
        {children}
      </main>
    </div>
  );
}
