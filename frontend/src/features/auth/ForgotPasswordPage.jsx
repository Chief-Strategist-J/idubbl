import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input, Card } from '../../shared/components/ui/index.js';
import useAuthStore from '../../shared/store/authStore.js';

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuthStore();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const res = await forgotPassword(email, redirectTo);
      setLoading(false);
      if (res.success) {
        setSent(true);
      } else {
        setError(res.error);
      }
    } catch (err) {
      setLoading(false);
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100vh', display: 'flex' }}>
      <div style={{ width: '100%', maxWidth: 420, padding: '1rem' }}>
        <div className="logo" style={{ justifyContent: 'center', marginBottom: '2rem', fontSize: '2rem' }}>iDubbl</div>

        <Card>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📧</div>
              <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '0.75rem' }}>Check your email</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                If an account exists for {email}, you will receive a password reset link shortly.
              </p>
              <Link to="/login" style={{ color: 'var(--primary)', fontSize: '0.9rem' }}>Back to login</Link>
            </div>
          ) : (
            <>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Reset password</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>Enter your email and we will send a reset link.</p>
              <form onSubmit={handleSubmit}>
                <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
                {error && <p style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}
                <Button type="submit" loading={loading} fullWidth>Send reset link</Button>
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
