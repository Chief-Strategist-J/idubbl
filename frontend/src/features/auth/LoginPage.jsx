import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Input, Card } from '../../shared/components/ui/index.js';
import useAuthStore from '../../shared/store/authStore.js';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, signInWithSocial, loginWithPasskey } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      localStorage.setItem('idubbl_role', 'player');
      // Pass 'player' portal to verify role restriction
      const result = await login(form.email, form.password, 'player');
      setLoading(false);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error);
      }
    } catch (_err) {
      setLoading(false);
      setError('An error occurred. Please try again.');
    }
  };

  const handleSocialLogin = async (provider) => {
    setError('');
    setLoading(true);
    try {
      const result = await signInWithSocial(provider);
      if (!result.success) {
        setError(result.error);
        setLoading(false);
      }
    } catch (err) {
      setLoading(false);
      setError(`Failed to sign in with ${provider}.`);
    }
  };

  const handlePasskeyLogin = async () => {
    if (!form.email) {
      setError('Please enter your email to sign in with passkey.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await loginWithPasskey(form.email);
      setLoading(false);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Passkey authentication failed.');
    }
  };

  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100vh', display: 'flex' }}>
      <div style={{ width: '100%', maxWidth: 420, padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <img className="logo-img" src="/black-logo.jpeg" alt="iDubbl" style={{ width: '120px', height: '120px', borderRadius: '24px', boxShadow: '0 6px 20px rgba(0,0,0,0.4)' }} />
        </div>

        <Card>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            Welcome back
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2.5rem' }}>
            Log in to check your balance and jump into a match.
          </p>

          <form onSubmit={handleSubmit}>
            <Input 
              label="Email" 
              type="email" 
              name="email" 
              value={form.email} 
              onChange={handleChange} 
              placeholder="you@example.com" 
              required 
            />
            <Input 
              label="Password" 
              type="password" 
              name="password" 
              value={form.password} 
              onChange={handleChange} 
              placeholder="••••••••" 
              required 
            />
            {error && <p style={{ color: 'var(--accent-red)', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}
            
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
              <Button type="submit" loading={loading} style={{ flex: 1 }}>
                Log in
              </Button>
              <Button 
                type="button" 
                onClick={handlePasskeyLogin} 
                disabled={loading}
                variant="secondary"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '0.5rem',
                  backgroundColor: 'var(--surface-light)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-primary)'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 6v6a3 3 0 0 1-6 0v-1.5m6 1.5a3 3 0 0 0-6 0v1.5m6-1.5a3 3 0 0 1-6 0V6a3 3 0 0 1 6 0z"/>
                  <path d="M12 2a10 10 0 0 0-10 10c0 5.523 4.477 10 10 10s10-4.477 10-10A10 10 0 0 0 12 2z"/>
                </svg>
                Passkey
              </Button>
            </div>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', color: 'var(--text-secondary)' }}>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border)' }} />
            <span style={{ padding: '0 0.75rem', fontSize: '0.8rem', textTransform: 'uppercase', tracking: '0.05em' }}>or sign in with</span>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border)' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {/* Google */}
            <button 
              onClick={() => handleSocialLogin('google')}
              disabled={loading}
              title="Google"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '42px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface-light)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.77c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </button>

            {/* Apple */}
            <button 
              onClick={() => handleSocialLogin('apple')}
              disabled={loading}
              title="Apple"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '42px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface-light)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.58 2.95-1.39z"/>
              </svg>
            </button>

            {/* Microsoft */}
            <button 
              onClick={() => handleSocialLogin('microsoft')}
              disabled={loading}
              title="Microsoft"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '42px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface-light)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <svg width="20" height="20" viewBox="0 0 23 23">
                <path fill="#f35325" d="M0 0h11v11H0z"/>
                <path fill="#81bc06" d="M12 0h11v11H12z"/>
                <path fill="#05a6f0" d="M0 12h11v11H0z"/>
                <path fill="#ffba08" d="M12 12h11v11H12z"/>
              </svg>
            </button>

            {/* SSO / Generic */}
            <button 
              onClick={() => handleSocialLogin('sso')}
              disabled={loading}
              title="SSO Login"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '42px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface-light)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'var(--font-display)',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                color: 'var(--text-primary)'
              }}
            >
              SSO
            </button>
          </div>

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
