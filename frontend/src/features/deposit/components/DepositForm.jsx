import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Coins, 
  CreditCard, 
  Copy, 
  Check, 
  Info, 
  ShieldCheck, 
  ArrowRightLeft,
  DollarSign,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { Input, Select, Button, Card } from '../../../shared/components/ui/index.js';
import useWalletStore from '../../../shared/store/walletStore.js';
import useAuthStore from '../../../shared/store/authStore.js';
import { PLATFORM_WALLET, SUPPORTED_NETWORKS, MIN_DEPOSIT } from '../../../shared/mock/index.js';

const NETWORK_OPTIONS = SUPPORTED_NETWORKS.map((n) => ({ value: n, label: n }));
const IDUBBU_RATE = 1000;

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'NGN', label: 'NGN - Nigerian Naira' },
  { value: 'GHS', label: 'GHS - Ghanaian Cedi' },
  { value: 'KES', label: 'KES - Kenyan Shilling' },
  { value: 'ZAR', label: 'ZAR - South African Rand' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' }
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
  const [loadingRates, setLoadingRates] = useState(true);

  useEffect(() => {
    setLoadingRates(true);
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
      .catch(err => console.warn('Using fallback local exchange rates:', err))
      .finally(() => setLoadingRates(false));
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
          usdAmount: Number(usdAmount.toFixed(2)),
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
    <Card style={{ 
      background: 'var(--card-bg)', 
      border: '1px solid var(--border)', 
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
      borderRadius: '16px',
      padding: '2rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <Coins style={{ color: 'var(--secondary)', width: '24px', height: '24px' }} />
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>Deposit Funds</h3>
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
        Fund your wallet with credit to participate in challenges and game duels.
      </p>
      
      {/* Payment Method Selector Tab */}
      <div style={{ 
        display: 'flex', 
        gap: '0.35rem', 
        background: 'rgba(255,255,255,0.03)', 
        padding: '0.35rem', 
        borderRadius: '12px', 
        marginBottom: '1.75rem', 
        border: '1px solid var(--border)' 
      }}>
        <button 
          type="button" 
          onClick={() => { setMethod('crypto'); setErrors({}); setForm({ ...form, amount: '' }); }}
          style={{ 
            flex: 1, 
            padding: '0.75rem', 
            border: 'none', 
            background: method === 'crypto' ? 'rgba(20,241,149,0.08)' : 'transparent', 
            color: method === 'crypto' ? 'var(--secondary)' : 'var(--text-muted)', 
            cursor: 'pointer', 
            borderRadius: '9px', 
            fontSize: '0.9rem', 
            fontWeight: 600, 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease-in-out' 
          }}
        >
          <Coins style={{ width: '16px', height: '16px' }} />
          Crypto (USDT)
        </button>
        <button 
          type="button" 
          onClick={() => { setMethod('flutterwave'); setErrors({}); setForm({ ...form, amount: '' }); }}
          style={{ 
            flex: 1, 
            padding: '0.75rem', 
            border: 'none', 
            background: method === 'flutterwave' ? 'rgba(20,241,149,0.08)' : 'transparent', 
            color: method === 'flutterwave' ? 'var(--secondary)' : 'var(--text-muted)', 
            cursor: 'pointer', 
            borderRadius: '9px', 
            fontSize: '0.9rem', 
            fontWeight: 600, 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease-in-out' 
          }}
        >
          <CreditCard style={{ width: '16px', height: '16px' }} />
          Card / Mobile Money
        </button>
      </div>

      {method === 'crypto' ? (
        <>
          {/* Rate Summary Card */}
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(20,241,149,0.08), rgba(99,102,241,0.08))', 
            border: '1px solid rgba(20,241,149,0.18)', 
            borderRadius: '12px', 
            padding: '1rem 1.25rem', 
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Conversion Rate</p>
              <p style={{ margin: '0.2rem 0 0', fontWeight: 700, color: 'var(--secondary)', fontSize: '1.2rem', fontFamily: 'var(--font-display)' }}>1 USDT = 1,000 Idubbu</p>
            </div>
            {estimatedIdubbu > 0 && (
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Estimated Credit</p>
                <p style={{ margin: '0.2rem 0 0', fontWeight: 800, color: 'var(--accent-cyan)', fontSize: '1.2rem', fontFamily: 'var(--font-display)' }}>
                  {estimatedIdubbu.toLocaleString()}💎
                </p>
              </div>
            )}
          </div>

          {/* Copy Address Widget */}
          <div style={{ 
            background: 'rgba(0,0,0,0.25)', 
            border: '1px solid var(--border)', 
            borderRadius: '12px', 
            padding: '1rem', 
            marginBottom: '1.5rem',
            position: 'relative'
          }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 0.5rem 0' }}>USDT Platform Deposit Address</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <code style={{ 
                flex: 1, 
                color: 'var(--accent-cyan)', 
                fontFamily: 'monospace', 
                fontSize: '0.9rem', 
                wordBreak: 'break-all',
                background: 'rgba(255,255,255,0.02)',
                padding: '0.5rem',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>{PLATFORM_WALLET}</code>
              <button 
                type="button" 
                onClick={copyAddress}
                style={{ 
                  flexShrink: 0, 
                  background: copied ? 'rgba(20,241,149,0.1)' : 'rgba(255,255,255,0.05)', 
                  border: `1px solid ${copied ? 'var(--secondary)' : 'var(--border)'}`, 
                  color: copied ? 'var(--secondary)' : 'var(--text-primary)',
                  padding: '0.6rem 1rem', 
                  fontSize: '0.85rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontWeight: 600,
                  transition: 'all 0.15s ease'
                }}
              >
                {copied ? <Check style={{ width: '14px', height: '14px' }} /> : <Copy style={{ width: '14px', height: '14px' }} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <div style={{ 
            background: 'rgba(245,158,11,0.06)', 
            border: '1px solid rgba(245,158,11,0.2)', 
            borderRadius: '10px', 
            padding: '0.85rem 1rem', 
            marginBottom: '1.5rem', 
            fontSize: '0.85rem', 
            color: '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem'
          }}>
            <AlertTriangle style={{ width: '18px', height: '18px', flexShrink: 0 }} />
            <span>Minimum deposit is {MIN_DEPOSIT} USDT. Sending less or using non-supported networks will result in permanent loss.</span>
          </div>

          {success && (
            <div style={{ 
              background: 'rgba(16,185,129,0.08)', 
              border: '1px solid rgba(16,185,129,0.3)', 
              borderRadius: '10px', 
              padding: '0.85rem 1rem', 
              marginBottom: '1.5rem', 
              color: 'var(--accent-green)', 
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Check style={{ width: '18px', height: '18px' }} />
              <span>Deposit request successfully submitted! Redirecting to dashboard...</span>
            </div>
          )}

          <form onSubmit={handleCryptoSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input label="Amount (USDT)" type="number" name="amount" value={form.amount} onChange={handleChange} placeholder={`Min. ${MIN_DEPOSIT}`} error={errors.amount} required />
            <Select label="Network" name="network" value={form.network} onChange={handleChange} options={NETWORK_OPTIONS} />
            <Input label="Transaction Hash" name="txHash" value={form.txHash} onChange={handleChange} placeholder="Paste 64-character hash" error={errors.txHash} required />
            <Input label="Note (optional)" name="note" value={form.note} onChange={handleChange} placeholder="Optional reference note" />
            
            <div style={{ marginTop: '0.5rem' }}>
              <Button type="submit" fullWidth loading={submitting} style={{
                background: 'var(--secondary)',
                color: '#04130d',
                fontWeight: 700,
                fontSize: '1rem',
                padding: '0.85rem'
              }}>
                Submit Deposit Request
              </Button>
            </div>
          </form>
        </>
      ) : (
        <>
          {/* Rate Summary Card */}
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(20,241,149,0.08), rgba(99,102,241,0.08))', 
            border: '1px solid rgba(20,241,149,0.18)', 
            borderRadius: '12px', 
            padding: '1rem 1.25rem', 
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Conversion Rate</p>
              <p style={{ margin: '0.2rem 0 0', fontWeight: 700, color: 'var(--secondary)', fontSize: '1.2rem', fontFamily: 'var(--font-display)' }}>1 USD = 1,000 Idubbu</p>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Exchange Rate: 1 USD ≈ {loadingRates ? '...' : `${rate.toFixed(2)} ${flwCurrency}`}
              </span>
            </div>
            {estimatedIdubbu > 0 && (
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Estimated Credit</p>
                <p style={{ margin: '0.2rem 0 0', fontWeight: 800, color: 'var(--accent-cyan)', fontSize: '1.2rem', fontFamily: 'var(--font-display)' }}>
                  {Math.floor(estimatedIdubbu).toLocaleString()}💎
                </p>
              </div>
            )}
          </div>

          <form onSubmit={handleFlutterwaveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '0.75rem' }}>
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

            {/* Dynamic Checkout Invoice Breakdown */}
            {form.amount && Number(form.amount) > 0 && (
              <div style={{ 
                background: 'rgba(255,255,255,0.02)', 
                border: '1px solid var(--border)', 
                borderRadius: '12px', 
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Payment Amount</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{Number(form.amount).toLocaleString()} {flwCurrency}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>USD Equivalent</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>${(Number(form.amount) / rate).toFixed(2)} USD</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Transaction Fee</span>
                  <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>FREE (0%)</span>
                </div>
                <div style={{ borderTop: '1px dashed var(--border)', margin: '0.25rem 0' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 700 }}>
                  <span style={{ color: 'var(--text-primary)' }}>You will receive</span>
                  <span style={{ color: 'var(--secondary)' }}>{Math.floor(estimatedIdubbu).toLocaleString()} Idubbu Credits</span>
                </div>
              </div>
            )}

            <div style={{ 
              background: 'rgba(20,241,149,0.03)', 
              border: '1px solid rgba(20,241,149,0.15)', 
              borderRadius: '10px', 
              padding: '0.85rem 1rem', 
              fontSize: '0.85rem', 
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem'
            }}>
              <ShieldCheck style={{ width: '18px', height: '18px', color: 'var(--secondary)', flexShrink: 0 }} />
              <span>Payments are processed securely via Flutterwave. Cards, banks, and mobile wallets are accepted.</span>
            </div>

            <div style={{ marginTop: '0.5rem' }}>
              <Button type="submit" fullWidth loading={submitting} style={{
                background: 'var(--secondary)',
                color: '#04130d',
                fontWeight: 700,
                fontSize: '1rem',
                padding: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}>
                💳 Pay with Flutterwave
                <ChevronRight style={{ width: '16px', height: '16px' }} />
              </Button>
            </div>
          </form>
        </>
      )}
    </Card>
  );
}
