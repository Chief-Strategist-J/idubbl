import React, { useState } from 'react';
import { Input, Select, Button, Card } from '../../../shared/components/ui/index.js';
import useAuthStore from '../../../shared/store/authStore.js';

const apiBase = (() => {
  let base = import.meta.env.VITE_API_URL || 'https://idubbl-backend.onrender.com';
  if (base && !base.startsWith('http://') && !base.startsWith('https://')) {
    base = `https://${base}`;
  }
  return base;
})();

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD ($) - US Dollar' },
  { value: 'NGN', label: 'NGN (₦) - Nigerian Naira' },
  { value: 'KES', label: 'KES (KSh) - Kenyan Shilling' },
  { value: 'GHS', label: 'GHS (₵) - Ghanaian Cedi' },
];

export default function UsdtDepositForm() {
  const { user } = useAuthStore();
  const [form, setForm] = useState({ amount: '', currency: 'USD' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validate = () => {
    const newErrors = {};
    const amountNum = Number(form.amount);
    if (!form.amount || isNaN(amountNum) || amountNum <= 0) {
      newErrors.amount = 'Please enter a valid deposit amount.';
    } else if (form.currency === 'USD' && amountNum < 5) {
      newErrors.amount = 'Minimum deposit is 5 USD.';
    } else if (form.currency === 'NGN' && amountNum < 2000) {
      newErrors.amount = 'Minimum deposit is 2,000 NGN.';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);

    try {
      const response = await fetch(`${apiBase}/api/payment/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        credentials: 'include',
        body: JSON.stringify({
          amount: Number(form.amount),
          currency: form.currency,
          customer: {
            email: user?.email || 'guest@idubbl.com',
            name: user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User',
            phone: user?.phone || '',
          },
          description: 'iDubbl Wallet Deposit',
        }),
      });

      const resData = await response.json();
      if (response.ok && resData.success && resData.data?.paymentUrl) {
        // Redirect user to Flutterwave Payment Link
        window.location.href = resData.data.paymentUrl;
      } else {
        throw new Error(resData.message || resData.error || 'Failed to initiate Flutterwave checkout.');
      }
    } catch (err) {
      console.error('Flutterwave initiation error:', err);
      setSubmitError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{
      background: 'linear-gradient(135deg, rgba(20,24,33,0.95) 0%, rgba(20,24,33,0.8) 100%)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      borderRadius: '16px',
    }}>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.4rem',
          fontWeight: 700,
          marginBottom: '0.4rem',
          background: 'linear-gradient(135deg, var(--accent-green) 0%, #00c47a 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Secure Card & Bank Deposit
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
          Top up your wallet securely via Flutterwave. Supports Cards, Mobile Money, and Bank Transfer.
        </p>
      </div>

      {/* Flutterwave logo branding */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        background: 'rgba(255, 176, 32, 0.06)',
        border: '1px solid rgba(255, 176, 32, 0.2)',
        borderRadius: '10px',
        padding: '0.65rem 1rem',
        marginBottom: '1.5rem',
      }}>
        <span style={{ fontSize: '1.1rem' }}>💳</span>
        <span style={{
          fontSize: '0.85rem',
          color: 'var(--text-primary)',
          fontWeight: 500
        }}>
          Powered by <strong style={{ color: '#ffb020' }}>Flutterwave</strong> Secure Payment Gateway
        </span>
      </div>

      {submitError && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 10,
          padding: '0.75rem 1rem',
          marginBottom: '1.25rem',
          color: 'var(--accent-red, #ef4444)',
          fontSize: '0.875rem',
        }}>
          ⚠️ {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Select
          label="Currency"
          name="currency"
          value={form.currency}
          onChange={handleChange}
          options={CURRENCY_OPTIONS}
        />

        <Input
          label={`Amount (${form.currency})`}
          type="number"
          name="amount"
          value={form.amount}
          onChange={handleChange}
          placeholder={form.currency === 'USD' ? 'Minimum 5 USD' : 'Minimum 2,000 NGN'}
          error={errors.amount}
          required
        />

        <div style={{ marginTop: '0.75rem' }}>
          <Button type="submit" loading={loading} fullWidth>
            Proceed to Flutterwave Checkout
          </Button>
        </div>
      </form>

      {/* Review time note */}
      <p style={{
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.8rem',
        marginTop: '1.25rem',
        marginBottom: 0,
        lineHeight: 1.5,
      }}>
        🔒 Your payment info is encrypted and processed directly by Flutterwave.
      </p>
    </Card>
  );
}

