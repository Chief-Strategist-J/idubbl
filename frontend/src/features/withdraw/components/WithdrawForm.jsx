import React, { useState, useEffect } from 'react';
import { Button, Card } from '../../../shared/components/ui/index.js';
import useWalletStore from '../../../shared/store/walletStore.js';
import useAuthStore from '../../../shared/store/authStore.js';
import { MIN_WITHDRAWAL } from '../../../shared/mock/index.js';

const IDUBBU_RATE = 1000;

export default function WithdrawForm() {
  const { depositBalance, winningsBalance, idubbuBalance, pendingWithdrawals, submitWithdrawal } = useWalletStore();
  const { user } = useAuthStore();
  const [form, setForm] = useState({ amount: '', network: 'TRC20 (TRON)', note: '' });
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [personalWallets, setPersonalWallets] = useState(null);
  const [walletLoading, setWalletLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const totalAvailable = winningsBalance || 0;

  // Fetch personal wallets on mount
  useEffect(() => {
    const fetchWallets = async () => {
      const userId = user?.id;
      if (!userId) return;
      try {
        let apiBase = import.meta.env.VITE_API_URL || 'https://idubbl-backend.onrender.com';
        if (!apiBase.startsWith('http')) apiBase = `https://${apiBase}`;
        const res = await fetch(`${apiBase}/api/wallet/personal`, {
          headers: { 'x-user-id': userId },
          credentials: 'include'
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setPersonalWallets(json.data);
          }
        }
      } catch (err) {
        console.error('Error fetching personal wallets:', err);
      } finally {
        setWalletLoading(false);
      }
    };
    fetchWallets();
  }, [user?.id]);

  const walletOptions = personalWallets ? [
    (personalWallets.tron?.address || (typeof personalWallets.tron === 'string' && personalWallets.tron)) && {
      label: `Tron (TRC-20) — ${personalWallets.tron.address || personalWallets.tron}`,
      address: personalWallets.tron.address || personalWallets.tron,
      network: 'TRC20 (TRON)'
    },
    (personalWallets.ethereum?.address || (typeof personalWallets.ethereum === 'string' && personalWallets.ethereum)) && {
      label: `Ethereum (ERC-20) — ${personalWallets.ethereum.address || personalWallets.ethereum}`,
      address: personalWallets.ethereum.address || personalWallets.ethereum,
      network: 'ERC20 (Ethereum)'
    },
  ].filter(Boolean) : [];

  const handleWalletSelect = (opt) => {
    setSelectedWallet(opt);
    setForm(f => ({ ...f, network: opt.network }));
  };

  const validate = () => {
    const errs = {};
    if (!form.amount || Number(form.amount) < MIN_WITHDRAWAL) errs.amount = `Minimum withdrawal is ${MIN_WITHDRAWAL} USDT`;
    if (Number(form.amount) > totalAvailable) errs.amount = `Exceeds available balance (${totalAvailable} USDT)`;
    if (!selectedWallet) errs.wallet = 'Please select a destination wallet';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    const result = await submitWithdrawal({
      amount: Number(form.amount),
      address: selectedWallet.address,
      network: form.network,
      note: form.note
    });
    setSubmitting(false);
    if (result?.success) {
      setSuccess(true);
      setForm({ amount: '', network: 'TRC20 (TRON)', note: '' });
      setSelectedWallet(null);
      setTimeout(() => setSuccess(false), 5000);
    } else {
      setErrors({ amount: result?.error || 'Withdrawal failed. Try again.' });
    }
  };

  return (
    <Card>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Request Withdrawal</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Withdraw USDT to one of your personal crypto wallet addresses.
      </p>

      {/* Balance Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{ padding: '0.75rem', background: 'linear-gradient(135deg, rgba(20,241,149,0.1), rgba(99,102,241,0.1))', borderRadius: 10, border: '1px solid rgba(20,241,149,0.2)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', margin: 0 }}>Idubbu Balance</p>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--secondary)', margin: '0.25rem 0 0 0' }}>
            {(idubbuBalance || 0).toLocaleString()}
          </p>
          <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>= {((depositBalance || 0) + (winningsBalance || 0)).toFixed(2)} USDT</span>
        </div>
        <div style={{ padding: '0.75rem', background: 'var(--accent-green-glow)', borderRadius: 10, border: '1px solid var(--accent-green-glow)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', margin: 0 }}>Winnings (USDT)</p>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--accent-green)', margin: '0.25rem 0 0 0' }}>{totalAvailable.toFixed(2)}</p>
          <span style={{ fontSize: '0.6rem', color: 'var(--accent-green)' }}>Withdrawable</span>
        </div>
        <div style={{ padding: '0.75rem', background: 'var(--accent-red-glow)', borderRadius: 10, border: '1px solid var(--accent-red-glow)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', margin: 0 }}>Pending</p>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--accent-red)', margin: '0.25rem 0 0 0' }}>{(pendingWithdrawals || 0).toFixed(2)}</p>
          <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>In review</span>
        </div>
      </div>

      {success && (
        <div style={{ background: 'var(--accent-green-glow)', border: '1px solid var(--accent-green-glow)', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.5rem', color: 'var(--accent-green)', fontSize: '0.9rem' }}>
          ✓ Withdrawal request submitted. Pending admin approval.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Amount */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>Amount (USDT)</label>
          <input
            type="number" name="amount" value={form.amount}
            onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
            placeholder={`Min. ${MIN_WITHDRAWAL}`} min={MIN_WITHDRAWAL} max={totalAvailable}
            style={{ width: '100%', padding: '0.7rem 1rem', borderRadius: 8, border: `1.5px solid ${errors.amount ? 'var(--accent-red)' : 'var(--border)'}`, background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '1rem', fontFamily: 'var(--font-sans)', boxSizing: 'border-box' }}
          />
          {errors.amount && <p style={{ color: 'var(--accent-red)', fontSize: '0.8rem', margin: '0.3rem 0 0' }}>{errors.amount}</p>}
        </div>

        {/* Wallet Selector */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>
            Select Destination Wallet
          </label>
          {walletLoading ? (
            <div style={{ padding: '0.75rem', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Loading your wallets...
            </div>
          ) : walletOptions.length === 0 ? (
            <div style={{ padding: '0.75rem', borderRadius: 8, border: '1.5px dashed var(--border)', background: 'var(--glass-bg)', color: 'var(--accent-warning)', fontSize: '0.85rem', textAlign: 'center' }}>
              ⚠️ No personal wallets generated yet.{' '}
              <a href="/deposit" style={{ color: 'var(--secondary)' }}>Generate one on the Deposit page.</a>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {walletOptions.map((opt, i) => (
                <button
                  key={i} type="button" onClick={() => handleWalletSelect(opt)}
                  style={{
                    width: '100%', padding: '0.85rem 1rem', borderRadius: 10, textAlign: 'left', cursor: 'pointer',
                    border: `2px solid ${selectedWallet?.address === opt.address ? 'var(--secondary)' : 'var(--border)'}`,
                    background: selectedWallet?.address === opt.address ? 'rgba(20,241,149,0.08)' : 'var(--input-bg)',
                    color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '0.8rem', transition: 'all 0.15s'
                  }}
                >
                  <span style={{ display: 'block', fontSize: '0.7rem', fontFamily: 'var(--font-sans)', color: 'var(--text-muted)', marginBottom: '2px' }}>
                    {opt.network}
                  </span>
                  {opt.address}
                </button>
              ))}
            </div>
          )}
          {errors.wallet && <p style={{ color: 'var(--accent-red)', fontSize: '0.8rem', margin: '0.3rem 0 0' }}>{errors.wallet}</p>}
        </div>

        {/* Note */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>Note (optional)</label>
          <input
            type="text" name="note" value={form.note}
            onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
            placeholder="Optional note"
            style={{ width: '100%', padding: '0.7rem 1rem', borderRadius: 8, border: '1.5px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'var(--font-sans)', boxSizing: 'border-box' }}
          />
        </div>

        <Button type="submit" fullWidth loading={submitting} disabled={totalAvailable <= 0 || walletOptions.length === 0}>
          Submit Withdrawal Request
        </Button>
        {totalAvailable <= 0 && <p style={{ color: 'var(--accent-warning)', fontSize: '0.85rem', textAlign: 'center', marginTop: '0.5rem' }}>No balance available to withdraw.</p>}
      </form>
    </Card>
  );
}
