import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Card } from '../../shared/components/ui/index.js';
import useAuthStore from '../../shared/store/authStore.js';

export default function AdminLoginPage() {
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
      localStorage.setItem('idubbl_role', 'admin');
      // Pass 'admin' portal to verify role restriction
      const result = await login(form.email, form.password, 'admin');
      setLoading(false);
      if (result.success) {
        navigate('/admin');
      } else {
        setError(result.error || 'Access denied.');
      }
    } catch (err) {
      setLoading(false);
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="app-container" style={{ 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh', 
      display: 'flex',
      background: 'radial-gradient(circle at top right, rgba(168, 85, 247, 0.15), transparent 60%), radial-gradient(circle at bottom left, rgba(239, 68, 68, 0.1), transparent 60%)'
    }}>
      <div style={{ width: '100%', maxWidth: 420, padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <img 
            className="logo-img" 
            src="/black-logo.jpeg" 
            alt="iDubbl" 
            style={{ 
              width: '100px', 
              height: '100px', 
              borderRadius: '24px', 
              boxShadow: '0 6px 25px rgba(168, 85, 247, 0.25)',
              border: '2px solid rgba(168, 85, 247, 0.4)'
            }} 
          />
        </div>

        <Card style={{ border: '1px solid rgba(168, 85, 247, 0.3)' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(168, 85, 247, 0.1)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            borderRadius: '99px',
            padding: '0.25rem 0.75rem',
            fontSize: '0.75rem',
            color: '#c084fc',
            fontWeight: 600,
            marginBottom: '1rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            🛡️ Secure Admin Portal
          </div>

          <h2 style={{ 
            fontFamily: 'var(--font-display)', 
            fontSize: '1.5rem', 
            marginBottom: '0.5rem', 
            color: 'var(--text-primary)',
            background: 'linear-gradient(135deg, #fff, #c084fc)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Admin Sign In
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Log in to manage deposits, match ledgers, and withdrawals.
          </p>

          <div style={{
            background: 'rgba(239, 68, 68, 0.05)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: 8,
            padding: '0.75rem 1rem',
            marginBottom: '1.5rem',
            fontSize: '0.8rem',
            color: '#f87171',
            lineHeight: 1.5,
          }}>
            🔒 Authorized Access Only. All administrative actions are recorded and audited.
          </div>

          <form onSubmit={handleSubmit}>
            <Input 
              label="Admin Email" 
              type="email" 
              name="email" 
              value={form.email} 
              onChange={handleChange} 
              placeholder="admin@idubbl.com" 
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
            <Button 
              type="submit" 
              loading={loading} 
              fullWidth
              style={{
                background: 'linear-gradient(135deg, #a855f7, #7e22ce)',
                color: '#fff',
                border: 'none',
                boxShadow: '0 4px 15px rgba(168, 85, 247, 0.4)'
              }}
            >
              Enter Dashboard
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
