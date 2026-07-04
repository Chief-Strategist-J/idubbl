import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Input, Card } from '../../shared/components/ui/index.js';
import useAuthStore from '../../shared/store/authStore.js';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
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
            <Button type="submit" loading={loading} fullWidth>
              Log in
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
