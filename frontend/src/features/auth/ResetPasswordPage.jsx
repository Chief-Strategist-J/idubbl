import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Button, Input, Card } from '../../shared/components/ui/index.js';
import useAuthStore from '../../shared/store/authStore.js';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword } = useAuthStore();
  const token = searchParams.get('token');

  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!token) {
      setError('Invalid or expired reset token.');
      return;
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword(form.password, token);
      setLoading(false);
      if (res.success) {
        setSuccess(true);
      } else {
        setError(res.error);
      }
    } catch (err) {
      setLoading(false);
      setError('An error occurred resetting your password.');
    }
  };

  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100vh', display: 'flex' }}>
      <div style={{ width: '100%', maxWidth: 420, padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <img src="/black-logo.jpeg" alt="iDubbl" style={{ width: '120px', height: '120px', borderRadius: '24px', boxShadow: '0 6px 20px rgba(0,0,0,0.4)' }} />
        </div>

        <Card>
          {success ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
              <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '0.75rem' }}>Password Reset</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Your password has been successfully reset. You can now log in with your new password.
              </p>
              <Link to="/login" style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: 'bold' }}>Go to login</Link>
            </div>
          ) : (
            <>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Set new password</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>Enter and confirm your new password below.</p>
              
              {!token && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.5rem', color: '#f87171', fontSize: '0.85rem' }}>
                  ⚠️ Reset token is missing from the URL. Please request a new password reset link.
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <Input label="New Password" type="password" name="password" value={form.password} onChange={handleChange} placeholder="••••••••" hint="Minimum 8 characters" required disabled={!token} />
                <Input label="Confirm New Password" type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="••••••••" required disabled={!token} />
                {error && <p style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}
                <Button type="submit" loading={loading} fullWidth disabled={!token}>Reset password</Button>
              </form>
              <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
                <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Back to login</Link>
              </p>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
