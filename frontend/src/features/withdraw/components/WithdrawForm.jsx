import React, { useState } from 'react';
import { Input, Select, Button, Card } from '../../../shared/components/ui/index.js';
import useWalletStore from '../../../shared/store/walletStore.js';
import { MIN_WITHDRAWAL, SUPPORTED_NETWORKS } from '../../../shared/mock/index.js';

const NETWORK_OPTIONS = SUPPORTED_NETWORKS.map((n) => ({ value: n, label: n }));

export default function WithdrawForm() {
  const { availableBalance, pendingWithdrawals, submitWithdrawal } = useWalletStore();
  const [form, setForm] = useState({ amount: '', address: '', network: SUPPORTED_NETWORKS[0], note: '' });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    const errs = {};
    if (!form.amount || Number(form.amount) < MIN_WITHDRAWAL) errs.amount = `Minimum withdrawal is ${MIN_WITHDRAWAL} USDT`;
    if (Number(form.amount) > availableBalance) errs.amount = 'Exceeds available balance';
    if (!form.address.trim()) errs.address = 'Wallet address required';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const result = submitWithdrawal({ amount: Number(form.amount), address: form.address, network: form.network, note: form.note });
    if (result.success) {
      setSuccess(true);
      setForm({ amount: '', address: '', network: SUPPORTED_NETWORKS[0], note: '' });
      setTimeout(() => setSuccess(false), 4000);
    } else {
      setErrors({ amount: result.error });
    }
  };

  return (
    <Card>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Request Withdrawal</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Request a withdrawal. Requests are reviewed before payout.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ padding: '1rem', background: 'var(--accent-cyan-glow)', borderRadius: 10, border: '1px solid var(--accent-cyan-glow)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Available to withdraw</p>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.3rem', color: 'var(--accent-cyan)' }}>{availableBalance.toFixed(2)} USDT</p>
        </div>
        <div style={{ padding: '1rem', background: 'var(--accent-red-glow)', borderRadius: 10, border: '1px solid var(--accent-red-glow)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Pending withdrawal</p>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.3rem', color: 'var(--accent-red)' }}>{pendingWithdrawals.toFixed(2)} USDT</p>
        </div>
      </div>

      {success && (
        <div style={{ background: 'var(--accent-green-glow)', border: '1px solid var(--accent-green-glow)', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.5rem', color: 'var(--accent-green)', fontSize: '0.9rem' }}>
          ✓ Withdrawal request submitted. Pending admin approval.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Input label="Amount (USDT)" type="number" name="amount" value={form.amount} onChange={handleChange} placeholder={`Min. ${MIN_WITHDRAWAL}`} error={errors.amount} required />
        <Input label="Destination Wallet Address" name="address" value={form.address} onChange={handleChange} placeholder="Your USDT wallet address" error={errors.address} required />
        <Select label="Network" name="network" value={form.network} onChange={handleChange} options={NETWORK_OPTIONS} />
        <Input label="Note (optional)" name="note" value={form.note} onChange={handleChange} placeholder="Optional note" />
        <Button type="submit" fullWidth>Submit Withdrawal Request</Button>
      </form>
    </Card>
  );
}
