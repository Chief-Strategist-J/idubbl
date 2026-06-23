import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Input, Card } from '../../shared/components/ui/index.js';
import useAuthStore from '../../shared/store/authStore.js';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [roleMode, setRoleMode] = useState('player'); // 'player' | 'admin'
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Direct pass for dev simplicity if you select Admin mode
      if (roleMode === 'admin') {
        const adminEmail = form.email || 'admin@idubbl.com';
        
        // Immediately enforce admin state globally in memory & local storage to prevent dashboard redirects
        localStorage.setItem('idubbl_role', 'admin');
        useAuthStore.setState({ 
          user: { id: 'admin1', firstName: 'Sam', lastName: 'Admin', email: adminEmail, role: 'admin' }, 
          isAuthenticated: true 
        });
        
        // Try real login in background, but route to admin immediately
        login(adminEmail, form.password || 'AdminPassword123').catch(console.error);
        setLoading(false);
        navigate('/admin');
      } else {
        localStorage.setItem('idubbl_role', 'player');
        // Enforce user/player role on login
        const result = await login(form.email, form.password);
        setLoading(false);
        if (result.success) {
          // If the logged in user is actually an admin, go to admin, else dashboard
          if (result.role === 'admin') {
            localStorage.setItem('idubbl_role', 'admin');
            useAuthStore.setState({ user: { ...useAuthStore.getState().user, role: 'admin' } });
            navigate('/admin');
          } else {
            // Force player role to avoid leftover admin state
            useAuthStore.setState({ user: { ...useAuthStore.getState().user, role: 'player' } });
            navigate('/dashboard');
          }
        } else {
          setError(result.error);
        }
      }
    } catch (err) {
      setLoading(false);
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100vh', display: 'flex' }}>
      <div style={{ width: '100%', maxWidth: 420, padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <img className="logo-img" src="/black-logo.jpeg" alt="iDubbl" style={{ width: '120px', height: '120px', borderRadius: '24px', boxShadow: '0 6px 20px rgba(0,0,0,0.4)' }} />
        </div>

        <Card>
          {/* Role selector tabs */}
          <div style={{ display: 'flex', background: 'var(--glass-bg)', borderRadius: '10px', padding: '0.35rem', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
            <button 
              type="button"
              onClick={() => { setRoleMode('player'); setError(''); }}
              style={{
                flex: 1,
                padding: '0.65rem',
                border: 'none',
                borderRadius: '8px',
                background: roleMode === 'player' ? 'var(--primary)' : 'var(--glass-bg)',
                color: roleMode === 'player' ? '#04130d' : 'var(--text-primary)',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: roleMode === 'player' ? '0 4px 12px var(--primary-glow)' : 'none',
                marginRight: '0.25rem'
              }}
            >
              🎮 Player Login
            </button>
            <button 
              type="button"
              onClick={() => { setRoleMode('admin'); setError(''); }}
              style={{
                flex: 1,
                padding: '0.65rem',
                border: 'none',
                borderRadius: '8px',
                background: roleMode === 'admin' ? 'var(--secondary)' : 'var(--glass-bg)',
                color: roleMode === 'admin' ? '#04130d' : 'var(--text-primary)',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: roleMode === 'admin' ? '0 4px 12px var(--secondary-glow)' : 'none',
                marginLeft: '0.25rem'
              }}
            >
              🛡️ Admin Login
            </button>
          </div>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            {roleMode === 'admin' ? 'Admin Portal Access' : 'Welcome back'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2.5rem' }}>
            {roleMode === 'admin' ? 'Log in to manage deposits, match ledger and withdrawals.' : 'Log in to play and manage your wallet.'}
          </p>

          <form onSubmit={handleSubmit}>
            <Input 
              label={roleMode === 'admin' ? "Admin Email" : "Email"} 
              type="email" 
              name="email" 
              value={form.email} 
              onChange={handleChange} 
              placeholder={roleMode === 'admin' ? "admin@idubbl.com" : "you@example.com"} 
              required={roleMode !== 'admin'} 
            />
            <Input 
              label="Password" 
              type="password" 
              name="password" 
              value={form.password} 
              onChange={handleChange} 
              placeholder="••••••••" 
              required={roleMode !== 'admin'} 
            />
            {error && <p style={{ color: 'var(--accent-red)', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}
            <Button type="submit" loading={loading} fullWidth>
              {roleMode === 'admin' ? 'Access Admin Panel' : 'Log in'}
            </Button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            <Link to="/forgot-password" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Forgot password?</Link>
            <span style={{ margin: '0 0.75rem' }}>·</span>
            <Link to="/signup" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Create account</Link>
          </div>

        </Card>
      </div>
    </div>
  );
}
