import React, { useState } from 'react';
import { Input, Select, Button, Card } from '../../../shared/components/ui/index.js';
import useAuthStore from '../../../shared/store/authStore.js';

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD (US Dollar)' },
  { value: 'INR', label: 'INR (Indian Rupee)' },
  { value: 'NGN', label: 'NGN (Nigerian Naira)' },
  { value: 'EUR', label: 'EUR (Euro)' }
];

export default function FiatDepositForm() {
  const { user } = useAuthStore();
  const [form, setForm] = useState({
    amount: '',
    currency: 'USD',
    email: user?.email || '',
    name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Player'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let apiBase = import.meta.env.VITE_API_URL || 'https://idubbl-backend.onrender.com';
      if (apiBase && !apiBase.startsWith('http://') && !apiBase.startsWith('https://')) {
        apiBase = `https://${apiBase}`;
      }
      const response = await fetch(`${apiBase}/api/payment/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Number(form.amount),
          currency: form.currency,
          customer: {
            name: form.name,
            email: form.email,
          },
          description: `Deposit of ${form.amount} ${form.currency} into iDubbl wallet`
        }),
      });

      const data = await response.json();

      if (response.ok && data.paymentUrl) {
        // Redirect user to payment checkout (Flutterwave / Juspay)
        window.location.href = data.paymentUrl;
      } else {
        throw new Error(data.error || 'Failed to initiate checkout link');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Card / Local Payment</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Deposit fiat directly using your card or local bank payment methods via our secure active gateway.
      </p>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.5rem', color: '#f87171', fontSize: '0.9rem' }}>
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Input 
          label="Amount" 
          type="number" 
          name="amount" 
          value={form.amount} 
          onChange={handleChange} 
          placeholder="0.00" 
          required 
        />
        <Select 
          label="Currency" 
          name="currency" 
          value={form.currency} 
          onChange={handleChange} 
          options={CURRENCY_OPTIONS} 
        />
        <Input 
          label="Billing Name" 
          name="name" 
          value={form.name} 
          onChange={handleChange} 
          placeholder="First Last" 
          required 
        />
        <Input 
          label="Email Address" 
          type="email" 
          name="email" 
          value={form.email} 
          onChange={handleChange} 
          placeholder="billing@example.com" 
          required 
        />
        <Button type="submit" loading={loading} fullWidth>
          Pay with Active Gateway
        </Button>
      </form>
    </Card>
  );
}
