import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button, Input, Card } from '../../shared/components/ui/index.js';
import useAuthStore from '../../shared/store/authStore.js';

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuthStore();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '', referral: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'Required';
    if (!form.lastName.trim()) errs.lastName = 'Required';
    if (!form.email.includes('@')) errs.email = 'Valid email required';
    if (form.password.length < 8) errs.password = 'Minimum 8 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    setTimeout(() => {
      signup(form);
      setLoading(false);
      navigate('/dashboard');
    }, 700);
  };

  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100vh', display: 'flex' }}>
      <div style={{ width: '100%', maxWidth: 480, padding: '1rem' }}>
        <div className="logo" style={{ justifyContent: 'center', marginBottom: '2rem', fontSize: '2rem' }}>iDubbl</div>

        <Card>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Create your account</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
            Create your account to start playing, funding your wallet, and joining matches.
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
              <Input label="First name" name="firstName" value={form.firstName} onChange={handleChange} error={errors.firstName} required />
              <Input label="Last name" name="lastName" value={form.lastName} onChange={handleChange} error={errors.lastName} required />
            </div>
            <Input label="Email" type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" error={errors.email} required />
            <Input label="Phone" type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+1 555-0100" />
            <Input label="Password" type="password" name="password" value={form.password} onChange={handleChange} error={errors.password} hint="Minimum 8 characters" required />
            <Input label="Confirm password" type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} error={errors.confirmPassword} required />
            <Input label="Referral code (optional)" name="referral" value={form.referral} onChange={handleChange} placeholder="FRIEND123" />

            <Button type="submit" loading={loading} fullWidth>Create account</Button>
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
