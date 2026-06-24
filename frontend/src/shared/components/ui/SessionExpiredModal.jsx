import React, { useState, useEffect } from 'react';
import useAuthStore from '../../store/authStore.js';
import { useNavigate } from 'react-router-dom';

export default function SessionExpiredModal() {
  const { isAuthenticated, sessionChecked } = useAuthStore();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);

  // Show when session was previously authenticated but now isn't
  useEffect(() => {
    if (sessionChecked && !isAuthenticated) {
      // Only show if there was previously a session (token in storage)
      const hadSession = localStorage.getItem('idubbl_session_active');
      if (hadSession) {
        setShow(true);
      }
    }
    if (isAuthenticated) {
      localStorage.setItem('idubbl_session_active', '1');
      setShow(false);
    }
  }, [isAuthenticated, sessionChecked]);

  const handleLogin = () => {
    localStorage.removeItem('idubbl_session_active');
    setShow(false);
    navigate('/login');
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem',
    }}>
      <div style={{
        background: 'var(--bg-dark)',
        border: '1px solid var(--border)',
        borderRadius: '16px',
        padding: '2rem',
        maxWidth: 380,
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: '1.4rem',
          fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)',
        }}>Session expired</h2>
        <p style={{
          color: 'var(--text-secondary)', fontSize: '0.9rem',
          lineHeight: 1.6, marginBottom: '1.75rem',
        }}>
          Please log in again to continue.
        </p>
        <button
          onClick={handleLogin}
          style={{
            width: '100%', background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))',
            color: 'var(--bg-darker)', border: 'none', borderRadius: '8px',
            padding: '0.85rem', fontFamily: 'var(--font-sans)', fontWeight: 600,
            fontSize: '1rem', cursor: 'pointer', minHeight: '48px',
          }}
        >
          Log in
        </button>
      </div>
    </div>
  );
}
