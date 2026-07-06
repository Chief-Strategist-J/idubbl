import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input, Card } from '../../shared/components/ui/index.js';
import useAuthStore from '../../shared/store/authStore.js';

export default function ForgotPasswordPage() {
  const { forgotPassword, resetPasswordOtp } = useAuthStore();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // OTP Form States
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);

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
    } catch (_err) {
      setLoading(false);
      setError('An error occurred. Please try again.');
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (otp.trim().length !== 6) {
      setError('Verification code must be exactly 6 digits.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await resetPasswordOtp(email, otp.trim(), password);
      setLoading(false);
      if (res.success) {
        setSuccess(true);
      } else {
        setError(res.error);
      }
    } catch (_err) {
      setLoading(false);
      setError('An error occurred resetting your password.');
    }
  };

  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100vh', display: 'flex' }}>
      <div style={{ width: '100%', maxWidth: 420, padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <img className="logo-img" src="/black-logo.jpeg" alt="iDubbl" style={{ width: '120px', height: '120px', borderRadius: '24px', boxShadow: '0 6px 20px rgba(0,0,0,0.4)' }} />
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
          ) : sent ? (
            <>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Verify Code</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                We've sent a 6-digit verification code to <strong>{email}</strong>. Enter it below to reset your password.
              </p>
              <form onSubmit={handleResetSubmit}>
                <Input 
                  label="Verification Code (OTP)" 
                  type="text" 
                  value={otp} 
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                  placeholder="123456" 
                  required 
                />
                <Input 
                  label="New Password" 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  hint="Minimum 8 characters" 
                  required 
                />
                <Input 
                  label="Confirm New Password" 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  placeholder="••••••••" 
                  required 
                />
                {error && <p style={{ color: 'var(--accent-red)', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}
                <Button type="submit" loading={loading} fullWidth>Reset password</Button>
              </form>
              <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
                <span 
                  onClick={() => { setSent(false); setError(''); }} 
                  style={{ color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Change email address
                </span>
              </p>
            </>
          ) : (
            <>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Reset your password</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                Enter the email or phone on your account and we'll send you a reset code.
              </p>
              <form onSubmit={handleSubmit}>
                <Input label="Email or phone" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com or +1 555 000 0000" required />
                {error && <p style={{ color: 'var(--accent-red)', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}
                <Button type="submit" loading={loading} fullWidth>Send reset code</Button>
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
