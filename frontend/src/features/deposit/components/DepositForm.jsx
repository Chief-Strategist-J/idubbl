import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Select, Button, Card } from '../../../shared/components/ui/index.js';
import useWalletStore from '../../../shared/store/walletStore.js';
import useAuthStore from '../../../shared/store/authStore.js';
import { PLATFORM_WALLET, SUPPORTED_NETWORKS, MIN_DEPOSIT } from '../../../shared/mock/index.js';

const NETWORK_OPTIONS = SUPPORTED_NETWORKS.map((n) => ({ value: n, label: n }));
const IDUBBU_RATE = 1000;

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD (US Dollar)' },
  { value: 'NGN', label: 'NGN (Nigerian Naira)' },
  { value: 'GHS', label: 'GHS (Ghanaian Cedi)' },
  { value: 'KES', label: 'KES (Kenyan Shilling)' },
  { value: 'ZAR', label: 'ZAR (South African Rand)' },
  { value: 'EUR', label: 'EUR (Euro)' },
  { value: 'GBP', label: 'GBP (British Pound)' }
];

export default function DepositForm() {
  const { submitDeposit } = useWalletStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [method, setMethod] = useState('crypto'); // 'crypto' | 'flutterwave'
  const [form, setForm] = useState({ amount: '', network: SUPPORTED_NETWORKS[0], txHash: '', note: '' });
  const [flwCurrency, setFlwCurrency] = useState('USD');
  const [exchangeRates, setExchangeRates] = useState({ USD: 1, NGN: 1500, GHS: 15, KES: 130, ZAR: 18, EUR: 0.92, GBP: 0.79 });
  
  const [copied, setCopied] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Fetch live exchange rates to provide dynamic and accurate conversions
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(res => res.json())
      .then(data => {
        if (data && data.rates) {
          setExchangeRates(prev => ({
            ...prev,
            ...data.rates
          }));
        }
      })
      .catch(err => console.warn('Using fallback local exchange rates:', err));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const copyAddress = () => {
    navigator.clipboard.writeText(PLATFORM_WALLET).then(() => { 
      setCopied(true); 
      setTimeout(() => setCopied(false), 2000); 
    });
  };

  const validateCrypto = () => {
    const errs = {};
    if (!form.amount || Number(form.amount) < MIN_DEPOSIT) errs.amount = `Minimum deposit is ${MIN_DEPOSIT} USDT`;
    if (!form.txHash.trim()) errs.txHash = 'Transaction hash is required';
    return errs;
  };

  const handleCryptoSubmit = async (e) => {
    e.preventDefault();
    const errs = validateCrypto();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    const result = await submitDeposit({ 
      amount: Number(form.amount), 
      network: form.network, 
      txHash: form.txHash, 
      note: form.note 
    });
    setSubmitting(false);
    if (result?.success) {
      setSuccess(true);
      setForm({ amount: '', network: SUPPORTED_NETWORKS[0], txHash: '', note: '' });
      setTimeout(() => navigate('/wallet'), 2000);
    } else {
      setErrors({ txHash: result?.error || 'Deposit submission failed. Please try again.' });
    }
  };

  const rate = exchangeRates[flwCurrency] || 1;
  const currentMinDepositLocal = Math.ceil(MIN_DEPOSIT * rate);

  const handleFlutterwaveSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) < currentMinDepositLocal) {
      setErrors({ amount: `Minimum deposit is ${currentMinDepositLocal} ${flwCurrency}` });
      return;
    }
    
    // Calculate USD equivalent securely
    const usdAmount = Number(form.amount) / rate;
    
    setSubmitting(true);
    setErrors({});
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'https://idubbl-backend.onrender.com';
      const res = await fetch(`${apiBase}/api/payment/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(form.amount),
          currency: flwCurrency,
          usdAmount: Number(usdAmount.toFixed(2)), // pass USD equivalent for crediting
          customer: {
            email: user?.email || 'player@idubbl.com',
            name: user?.name || user?.email?.split('@')[0] || 'Player',
            phone: user?.phone || ''
          },
          description: `iDubbl Wallet Deposit (${form.amount} ${flwCurrency})`,
          gateway: 'flutterwave'
        })
      });

      const json = await res.json();
      if (res.ok && json.success && json.data?.paymentUrl) {
        window.location.href = json.data.paymentUrl;
      } else {
        setErrors({ amount: json.error || 'Failed to initiate payment. Please verify configuration.' });
      }
    } catch (err) {
      console.error(err);
      setErrors({ amount: 'Connection error during checkout. Please try again later.' });
    } finally {
      setSubmitting(false);
    }
  };

  const estimatedIdubbu = method === 'crypto' 
    ? (form.amount ? Number(form.amount) * IDUBBU_RATE : 0)
    : (form.amount ? (Number(form.amount) / rate) * IDUBBU_RATE : 0);

  return (
    <Card>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: '1rem' }}>Deposit Funds</h3>
      
      {/* Payment Method Selector Tab */}
      <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.35rem', borderRadius: '10px', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
        <button 
          type="button" 
          onClick={() => { setMethod('crypto'); setErrors({}); setForm({ ...form, amount: '' }); }}
          style={{ flex: 1, padding: '0.6rem', border: 'none', background: method === 'crypto' ? 'rgba(255,255,255,0.05)' : 'none', color: method === 'crypto' ? 'var(--accent-cyan)' : 'var(--text-muted)', cursor: 'pointer', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s ease' }}
        >
          🪙 USDT (Crypto)
        </button>
        <button 
          type="button" 
          onClick={() => { setMethod('flutterwave'); setErrors({}); setForm({ ...form, amount: '' }); }}
          style={{ flex: 1, padding: '0.6rem', border: 'none', background: method === 'flutterwave' ? 'rgba(255,255,255,0.05)' : 'none', color: method === 'flutterwave' ? 'var(--accent-cyan)' : 'var(--text-muted)', cursor: 'pointer', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s ease' }}
        >
          💳 Card / Flutterwave
        </button>
      </div>

      {method === 'crypto' ? (
        <>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
            Send USDT to the address below and paste the transaction hash for review.<br />
            <strong style={{ color: 'var(--text-primary)' }}>Deposits are credited after network confirmation.</strong>
          </p>

          {/* Rate Banner */}
          <div style={{ background: 'linear-gradient(135deg, rgba(20,241,149,0.12), rgba(99,102,241,0.12))', border: '1px solid rgba(20,241,149,0.25)', borderRadius: 12, padding: '0.85rem 1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>💎</span>
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: 'var(--secondary)', fontSize: '0.95rem' }}>1 USDT = 1,000 Idubbu</p>
              {estimatedIdubbu > 0 && (
                <p style={{ margin: '2px 0 0', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                  You will receive <strong style={{ color: 'var(--secondary)' }}>{estimatedIdubbu.toLocaleString()} Idubbu</strong>
                </p>
              )}
            </div>
          </div>

          <div style={{ background: 'var(--accent-cyan-glow)', border: '1px solid var(--accent-cyan-glow)', borderRadius: 12, padding: '1rem', marginBottom: '1.5rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Platform USDT Wallet Address</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <code style={{ flex: 1, color: 'var(--accent-cyan)', fontFamily: 'monospace', fontSize: '0.85rem', wordBreak: 'break-all' }}>{PLATFORM_WALLET}</code>
              <Button variant="secondary" onClick={copyAddress} style={{ flexShrink: 0, padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
                {copied ? '✓ Copied' : 'Copy'}
              </Button>
            </div>
          </div>

          <div style={{ background: 'var(--accent-warning-glow)', border: '1px solid var(--accent-warning-glow)', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--accent-warning)' }}>
            ⚠️ Minimum deposit: {MIN_DEPOSIT} USDT · Supported networks: TRC20, ERC20 only
          </div>

          {success && (
            <div style={{ background: 'var(--accent-green-glow)', border: '1px solid var(--accent-green-glow)', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.5rem', color: 'var(--accent-green)', fontSize: '0.9rem' }}>
              ✓ Deposit submitted! Taking you to your wallet...
            </div>
          )}

          <form onSubmit={handleCryptoSubmit}>
            <Input label="Amount (USDT)" type="number" name="amount" value={form.amount} onChange={handleChange} placeholder={`Min. ${MIN_DEPOSIT}`} error={errors.amount} required />
            <Select label="Network" name="network" value={form.network} onChange={handleChange} options={NETWORK_OPTIONS} />
            <Input label="Transaction Hash" name="txHash" value={form.txHash} onChange={handleChange} placeholder="0x..." error={errors.txHash} required />
            <Input label="Note (optional)" name="note" value={form.note} onChange={handleChange} placeholder="Optional note for admin" />
            <Button type="submit" fullWidth loading={submitting}>Submit Deposit Request</Button>
          </form>
        </>
      ) : (
        <>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
            Deposit funds instantly using your Visa, Mastercard, or Mobile Money account via Flutterwave secure checkout.
          </p>

          {/* Rate Banner */}
          <div style={{ background: 'linear-gradient(135deg, rgba(20,241,149,0.12), rgba(99,102,241,0.12))', border: '1px solid rgba(20,241,149,0.25)', borderRadius: 12, padding: '0.85rem 1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>💎</span>
            <div>
              <p style={{ margin: 0, fontWeight: 700, color: 'var(--secondary)', fontSize: '0.95rem' }}>
                1 USD = 1,000 Idubbu
              </p>
              <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                Exchange Rate: 1 USD ≈ {rate.toFixed(2)} {flwCurrency}
              </p>
              {estimatedIdubbu > 0 && (
                <p style={{ margin: '4px 0 0', color: 'var(--secondary)', fontSize: '0.85rem', fontWeight: 600 }}>
                  You will receive <strong style={{ color: 'var(--secondary)' }}>{Math.floor(estimatedIdubbu).toLocaleString()} Idubbu</strong>
                </p>
              )}
            </div>
          </div>

          <form onSubmit={handleFlutterwaveSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <Input 
                label={`Amount (${flwCurrency})`}
                type="number" 
                name="amount" 
                value={form.amount} 
                onChange={handleChange} 
                placeholder={`Min. ${currentMinDepositLocal}`} 
                error={errors.amount} 
                required 
              />
              <Select
                label="Currency"
                name="flwCurrency"
                value={flwCurrency}
                onChange={(e) => { setFlwCurrency(e.target.value); setErrors({}); }}
                options={CURRENCY_OPTIONS}
              />
            </div>
            
            <div style={{ marginTop: '1.5rem' }}>
              <Button type="submit" fullWidth loading={submitting}>
                💳 Pay with Flutterwave
              </Button>
            </div>
          </form>
        </>
      )}
    </Card>
  );
}
