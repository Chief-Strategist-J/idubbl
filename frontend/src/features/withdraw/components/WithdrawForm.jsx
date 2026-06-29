import React, { useState, useEffect } from 'react';
import { Button, Card, Input } from '../../../shared/components/ui/index.js';
import useWalletStore from '../../../shared/store/walletStore.js';
import useAuthStore from '../../../shared/store/authStore.js';
import { MIN_WITHDRAWAL } from '../../../shared/mock/index.js';

const IDUBBU_RATE = 1000;

export default function WithdrawForm() {
  const { depositBalance, winningsBalance, idubbuBalance, pendingWithdrawals, submitWithdrawal } = useWalletStore();
  const { user } = useAuthStore();
  
  const [method, setMethod] = useState('crypto'); // 'crypto' | 'flutterwave'
  const [form, setForm] = useState({ amount: '', network: 'TRC20 (TRON)', note: '' });
  const [flwForm, setFlwForm] = useState({ bankCode: '', accountNumber: '', accountName: '' });
  
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

  const validateCrypto = () => {
    const errs = {};
    if (!form.amount || Number(form.amount) < MIN_WITHDRAWAL) errs.amount = `Minimum withdrawal is ${MIN_WITHDRAWAL} USDT`;
    if (Number(form.amount) > totalAvailable) errs.amount = `Exceeds available balance (${totalAvailable} USDT)`;
    if (!selectedWallet) errs.wallet = 'Please select a destination wallet';
    return errs;
  };

  const validateFlw = () => {
    const errs = {};
    if (!form.amount || Number(form.amount) < MIN_WITHDRAWAL) errs.amount = `Minimum withdrawal is ${MIN_WITHDRAWAL} USDT`;
    if (Number(form.amount) > totalAvailable) errs.amount = `Exceeds available balance (${totalAvailable} USDT)`;
    if (!flwForm.accountNumber.trim()) errs.accountNumber = 'Account number is required';
    if (!flwForm.bankCode.trim()) errs.bankCode = 'Bank name/code is required';
    if (!flwForm.accountName.trim()) errs.accountName = 'Account holder name is required';
    return errs;
  };

  const handleCryptoSubmit = async (e) => {
    e.preventDefault();
    const errs = validateCrypto();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    setErrors({});
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

  const handleFlwSubmit = async (e) => {
    e.preventDefault();
    const errs = validateFlw();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    setErrors({});
    
    // Package bank details into the address field in a stringified JSON format
    const bankDetails = JSON.stringify({
      bankCode: flwForm.bankCode.trim(),
      accountNumber: flwForm.accountNumber.trim(),
      accountName: flwForm.accountName.trim()
    });

    const result = await submitWithdrawal({
      amount: Number(form.amount),
      address: bankDetails,
      network: 'FLUTTERWAVE',
      note: form.note
    });
    
    setSubmitting(false);
    if (result?.success) {
      setSuccess(true);
      setForm({ amount: '', network: 'TRC20 (TRON)', note: '' });
      setFlwForm({ bankCode: '', accountNumber: '', accountName: '' });
      setTimeout(() => setSuccess(false), 5000);
    } else {
      setErrors({ amount: result?.error || 'Withdrawal failed. Try again.' });
    }
  };

  return (
    <Card>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: '1rem' }}>Request Withdrawal</h3>
      
      {/* Payment Method Selector Tab */}
      <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.35rem', borderRadius: '10px', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
        <button 
          type="button" 
          onClick={() => { setMethod('crypto'); setErrors({}); }}
          style={{ flex: 1, padding: '0.6rem', border: 'none', background: method === 'crypto' ? 'rgba(255,255,255,0.05)' : 'none', color: method === 'crypto' ? 'var(--accent-cyan)' : 'var(--text-muted)', cursor: 'pointer', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s ease' }}
        >
          🪙 USDT (Crypto)
        </button>
        <button 
          type="button" 
          onClick={() => { setMethod('flutterwave'); setErrors({}); }}
          style={{ flex: 1, padding: '0.6rem', border: 'none', background: method === 'flutterwave' ? 'rgba(255,255,255,0.05)' : 'none', color: method === 'flutterwave' ? 'var(--accent-cyan)' : 'var(--text-muted)', cursor: 'pointer', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s ease' }}
        >
          🏦 Bank (Flutterwave)
        </button>
      </div>

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

      {method === 'crypto' ? (
        <form onSubmit={handleCryptoSubmit}>
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
      ) : (
        <form onSubmit={handleFlwSubmit}>
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

          {/* Payout Type Selector */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>Withdrawal Channel</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                type="button" 
                onClick={() => setFlwForm(prev => ({ ...prev, type: 'bank' }))}
                style={{ flex: 1, padding: '0.5rem', border: '1px solid var(--border)', background: (flwForm.type || 'bank') === 'bank' ? 'var(--secondary-glow)' : 'none', color: (flwForm.type || 'bank') === 'bank' ? 'var(--secondary)' : 'var(--text-muted)', cursor: 'pointer', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s' }}
              >
                🏦 Bank Account
              </button>
              <button 
                type="button" 
                onClick={() => setFlwForm(prev => ({ ...prev, type: 'mobile_money' }))}
                style={{ flex: 1, padding: '0.5rem', border: '1px solid var(--border)', background: (flwForm.type || 'bank') === 'mobile_money' ? 'var(--secondary-glow)' : 'none', color: (flwForm.type || 'bank') === 'mobile_money' ? 'var(--secondary)' : 'var(--text-muted)', cursor: 'pointer', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s' }}
              >
                📱 Mobile Money
              </button>
            </div>
          </div>

          {/* Account/Phone Number */}
          <Input 
            label={(flwForm.type || 'bank') === 'bank' ? 'Account Number' : 'Phone Number'} 
            value={flwForm.accountNumber} 
            onChange={e => setFlwForm({ ...flwForm, accountNumber: e.target.value })} 
            placeholder={(flwForm.type || 'bank') === 'bank' ? 'e.g. 0123456789' : 'e.g. +254712345678'} 
            error={errors.accountNumber} 
            required 
          />

          {/* Bank / MM Provider */}
          <Input 
            label={(flwForm.type || 'bank') === 'bank' ? 'Bank Name or Code' : 'Mobile Money Provider (e.g. M-Pesa, MTN)'} 
            value={flwForm.bankCode} 
            onChange={e => setFlwForm({ ...flwForm, bankCode: e.target.value })} 
            placeholder={(flwForm.type || 'bank') === 'bank' ? 'e.g. 044 (Access Bank)' : 'e.g. M-Pesa (MPS) or MTN (MTN)'} 
            error={errors.bankCode} 
            required 
          />

          {/* Account/Registered Name */}
          <Input 
            label={(flwForm.type || 'bank') === 'bank' ? 'Account Name' : 'Registered Full Name'} 
            value={flwForm.accountName} 
            onChange={e => setFlwForm({ ...flwForm, accountName: e.target.value })} 
            placeholder="e.g. John Doe" 
            error={errors.accountName} 
            required 
          />

          {/* Note */}
          <div style={{ marginBottom: '1rem', marginTop: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>Note (optional)</label>
            <input
              type="text" name="note" value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              placeholder="Optional note"
              style={{ width: '100%', padding: '0.7rem 1rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'var(--font-sans)', boxSizing: 'border-box' }}
            />
          </div>

          <Button type="submit" fullWidth loading={submitting} disabled={totalAvailable <= 0}>
            Submit {(flwForm.type || 'bank') === 'bank' ? 'Bank' : 'Mobile Money'} Withdrawal
          </Button>
          {totalAvailable <= 0 && <p style={{ color: 'var(--accent-warning)', fontSize: '0.85rem', textAlign: 'center', marginTop: '0.5rem' }}>No balance available to withdraw.</p>}
        </form>
      )}
    </Card>
  );
}
