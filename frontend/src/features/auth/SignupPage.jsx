import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Input, Card } from '../../shared/components/ui/index.js';
import useAuthStore from '../../shared/store/authStore.js';

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuthStore();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '', referral: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'This field is required.';
    if (!form.lastName.trim()) errs.lastName = 'This field is required.';
    if (!form.email.trim() || !form.email.includes('@')) errs.email = 'Enter a valid email address.';
    if (form.password.length < 8 || !/\d/.test(form.password)) errs.password = 'Password must be at least 8 characters and include a number.';
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords don't match.";
    if (!termsAccepted) errs.terms = "You must confirm you're 18 or older and accept the Terms to continue.";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const result = await signup(form);
      setLoading(false);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setErrors({ submit: result.error });
      }
    } catch (_err) {
      setLoading(false);
      setErrors({ submit: 'An error occurred during signup.' });
    }
  };

  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100vh', display: 'flex' }}>
      <div style={{ width: '100%', maxWidth: 480, padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <img className="logo-img" src="/black-logo.jpeg" alt="iDubbl" style={{ width: '120px', height: '120px', borderRadius: '24px', boxShadow: '0 6px 20px rgba(0,0,0,0.4)' }} />
        </div>

        <Card>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Create your account</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
            Create your account to start playing, funding your wallet, and joining matches.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="signup-name-grid">
              <Input label="First name" name="firstName" value={form.firstName} onChange={handleChange} error={errors.firstName} required />
              <Input label="Last name" name="lastName" value={form.lastName} onChange={handleChange} error={errors.lastName} required />
            </div>
            <Input label="Email" type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" error={errors.email} required />
            <Input label="Phone" type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+1 555-0100" />
            <Input label="Password" type="password" name="password" value={form.password} onChange={handleChange} error={errors.password} hint="Minimum 8 characters" required />
            <Input label="Confirm password" type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} error={errors.confirmPassword} required />
            <Input label="Referral code (optional)" name="referral" value={form.referral} onChange={handleChange} placeholder="FRIEND123" />

            {/* 18+ Terms checkbox — required per design.md §3.2 */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  style={{ marginTop: '3px', accentColor: 'var(--primary)', width: 16, height: 16, flexShrink: 0 }}
                />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  I'm 18 or older and I agree to the{' '}
                  <a href="/terms" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Terms of Service</a>
                  {' '}and{' '}
                  <a href="/privacy" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Privacy Policy</a>.
                </span>
              </label>
              {errors.terms && <p style={{ color: 'var(--accent-red)', fontSize: '0.8rem', marginTop: '0.4rem' }}>{errors.terms}</p>}
            </div>

            {errors.submit && <p style={{ color: 'var(--accent-red)', fontSize: '0.85rem', marginBottom: '1rem' }}>{errors.submit}</p>}
            <Button type="submit" loading={loading} fullWidth>Sign up</Button>
          </form>

          <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Log in</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
