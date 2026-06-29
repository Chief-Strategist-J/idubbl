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
  ChevronRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { Input, Select, Button, Card } from '../../../shared/components/ui/index.js';
import useWalletStore from '../../../shared/store/walletStore.js';
import useAuthStore from '../../../shared/store/authStore.js';
import { PLATFORM_WALLET, SUPPORTED_NETWORKS, MIN_DEPOSIT } from '../../../shared/mock/index.js';

const NETWORK_OPTIONS = SUPPORTED_NETWORKS.map((n) => ({ value: n, label: n }));
const IDUBBU_RATE = 1000;

// Full list of currencies officially supported by Flutterwave
const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'NGN', label: 'NGN - Nigerian Naira' },
  { value: 'GHS', label: 'GHS - Ghanaian Cedi' },
  { value: 'KES', label: 'KES - Kenyan Shilling' },
  { value: 'ZAR', label: 'ZAR - South African Rand' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'GBP', label: 'GBP - British Pound' },
  { value: 'TZS', label: 'TZS - Tanzanian Shilling' },
  { value: 'UGX', label: 'UGX - Ugandan Shilling' },
  { value: 'RWF', label: 'RWF - Rwandan Franc' },
  { value: 'ZMW', label: 'ZMW - Zambian Kwacha' },
  { value: 'XOF', label: 'XOF - West African CFA' },
  { value: 'XAF', label: 'XAF - Central African CFA' },
  { value: 'CAD', label: 'CAD - Canadian Dollar' },
  { value: 'AUD', label: 'AUD - Australian Dollar' },
  { value: 'INR', label: 'INR - Indian Rupee' },
  { value: 'AED', label: 'AED - UAE Dirham' },
  { value: 'CNY', label: 'CNY - Chinese Yuan' },
  { value: 'SLL', label: 'SLL - Sierra Leonean Leone' },
  { value: 'LRD', label: 'LRD - Liberian Dollar' },
  { value: 'MWK', label: 'MWK - Malawian Kwacha' },
  { value: 'MAD', label: 'MAD - Moroccan Dirham' },
  { value: 'EGP', label: 'EGP - Egyptian Pound' },
  { value: 'CVE', label: 'CVE - Cape Verdean Escudo' },
  { value: 'MUR', label: 'MUR - Mauritian Rupee' },
  { value: 'GMD', label: 'GMD - Gambian Dalasi' },
  { value: 'BIF', label: 'BIF - Burundian Franc' },
  { value: 'CDF', label: 'CDF - Congolese Franc' }
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
      background: 'rgba(15, 23, 42, 0.65)', 
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.08)', 
      boxShadow: '0 20px 40px 0 rgba(0, 0, 0, 0.45)',
      borderRadius: '24px',
      padding: '2.5rem',
      maxWidth: '650px',
      margin: '0 auto'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <Coins style={{ color: 'var(--secondary)', width: '28px', height: '28px' }} />
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>Fund Wallet</h3>
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '2rem', lineHeight: 1.6 }}>
        Fund your wallet with credit to participate in challenges and game duels. Select your preferred method below:
      </p>
      
      {/* Premium Method Selector Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem', 
        marginBottom: '2rem' 
      }}>
        <div 
          onClick={() => { setMethod('crypto'); setErrors({}); setForm({ ...form, amount: '' }); }}
          style={{ 
            padding: '1.25rem', 
            borderRadius: '16px', 
            cursor: 'pointer', 
            background: method === 'crypto' ? 'linear-gradient(135deg, rgba(20,241,149,0.08) 0%, rgba(99,102,241,0.02) 100%)' : 'rgba(255,255,255,0.02)', 
            border: `2px solid ${method === 'crypto' ? 'var(--secondary)' : 'rgba(255,255,255,0.05)'}`, 
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: method === 'crypto' ? '0 8px 24px rgba(20,241,149,0.1)' : 'none',
            transform: method === 'crypto' ? 'translateY(-2px)' : 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ 
              background: method === 'crypto' ? 'rgba(20,241,149,0.15)' : 'rgba(255,255,255,0.05)', 
              padding: '0.5rem', 
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Coins style={{ width: '20px', height: '20px', color: method === 'crypto' ? 'var(--secondary)' : 'var(--text-muted)' }} />
            </div>
            {method === 'crypto' && <span style={{ background: 'var(--secondary)', width: '8px', height: '8px', borderRadius: '50%' }}></span>}
          </div>
          <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Crypto USDT</h4>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>Pay manually via Tron or Ethereum network.</p>
        </div>

        <div 
          onClick={() => { setMethod('flutterwave'); setErrors({}); setForm({ ...form, amount: '' }); }}
          style={{ 
            padding: '1.25rem', 
            borderRadius: '16px', 
            cursor: 'pointer', 
            background: method === 'flutterwave' ? 'linear-gradient(135deg, rgba(20,241,149,0.08) 0%, rgba(99,102,241,0.02) 100%)' : 'rgba(255,255,255,0.02)', 
            border: `2px solid ${method === 'flutterwave' ? 'var(--secondary)' : 'rgba(255,255,255,0.05)'}`, 
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: method === 'flutterwave' ? '0 8px 24px rgba(20,241,149,0.1)' : 'none',
            transform: method === 'flutterwave' ? 'translateY(-2px)' : 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ 
              background: method === 'flutterwave' ? 'rgba(20,241,149,0.15)' : 'rgba(255,255,255,0.05)', 
              padding: '0.5rem', 
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CreditCard style={{ width: '20px', height: '20px', color: method === 'flutterwave' ? 'var(--secondary)' : 'var(--text-muted)' }} />
            </div>
            {method === 'flutterwave' && <span style={{ background: 'var(--secondary)', width: '8px', height: '8px', borderRadius: '50%' }}></span>}
          </div>
          <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Cards & Mobile Money</h4>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>Instant deposits with local currencies via Flutterwave.</p>
        </div>
      </div>

      {method === 'crypto' ? (
        <>
          {/* Rate Summary Card */}
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(20,241,149,0.06) 0%, rgba(99,102,241,0.06) 100%)', 
            border: '1px solid rgba(20,241,149,0.15)', 
            borderRadius: '16px', 
            padding: '1.25rem 1.5rem', 
            marginBottom: '1.75rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>Rate conversion</p>
              <p style={{ margin: '0.25rem 0 0', fontWeight: 800, color: 'var(--secondary)', fontSize: '1.3rem', fontFamily: 'var(--font-display)' }}>1 USDT = 1,000 Idubbu</p>
            </div>
            {estimatedIdubbu > 0 && (
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Estimated Credit</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                  <Sparkles style={{ width: '16px', height: '16px', color: 'var(--accent-cyan)' }} />
                  <p style={{ margin: 0, fontWeight: 800, color: 'var(--accent-cyan)', fontSize: '1.3rem', fontFamily: 'var(--font-display)' }}>
                    {estimatedIdubbu.toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Copy Address Widget */}
          <div style={{ 
            background: 'rgba(0, 0, 0, 0.3)', 
            border: '1px solid rgba(255, 255, 255, 0.05)', 
            borderRadius: '16px', 
            padding: '1.25rem', 
            marginBottom: '1.75rem'
          }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600, margin: '0 0 0.6rem 0' }}>Platform USDT Wallet Address</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'nowrap' }}>
              <code style={{ 
                flex: 1, 
                color: 'var(--accent-cyan)', 
                fontFamily: 'monospace', 
                fontSize: '0.85rem', 
                wordBreak: 'break-all',
                background: 'rgba(255,255,255,0.01)',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.05)',
                userSelect: 'all'
              }}>{PLATFORM_WALLET}</code>
              <button 
                type="button" 
                onClick={copyAddress}
                style={{ 
                  flexShrink: 0, 
                  background: copied ? 'rgba(20,241,149,0.12)' : 'rgba(255,255,255,0.03)', 
                  border: `1px solid ${copied ? 'var(--secondary)' : 'rgba(255,255,255,0.08)'}`, 
                  color: copied ? 'var(--secondary)' : 'var(--text-primary)',
                  padding: '0.7rem 1.25rem', 
                  fontSize: '0.85rem',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 700,
                  transition: 'all 0.2s ease',
                  boxShadow: copied ? '0 0 12px rgba(20,241,149,0.15)' : 'none'
                }}
              >
                {copied ? <Check style={{ width: '15px', height: '15px' }} /> : <Copy style={{ width: '15px', height: '15px' }} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div style={{ 
            background: 'rgba(245,158,11,0.04)', 
            border: '1px solid rgba(245,158,11,0.15)', 
            borderRadius: '12px', 
            padding: '1rem 1.25rem', 
            marginBottom: '1.75rem', 
            fontSize: '0.85rem', 
            color: '#f59e0b',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            lineHeight: 1.5
          }}>
            <AlertTriangle style={{ width: '18px', height: '18px', flexShrink: 0, marginTop: '2px' }} />
            <span><strong>Notice:</strong> Minimum deposit is {MIN_DEPOSIT} USDT. Sending less or using non-supported networks (e.g. BSC, Polygon) will result in permanent loss.</span>
          </div>

          {success && (
            <div style={{ 
              background: 'rgba(16,185,129,0.08)', 
              border: '1px solid rgba(16,185,129,0.25)', 
              borderRadius: '12px', 
              padding: '1rem 1.25rem', 
              marginBottom: '1.75rem', 
              color: 'var(--accent-green)', 
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem'
            }}>
              <Check style={{ width: '20px', height: '20px' }} />
              <span>Deposit request successfully submitted! Redirecting to dashboard...</span>
            </div>
          )}

          <form onSubmit={handleCryptoSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <Input label="Amount (USDT)" type="number" name="amount" value={form.amount} onChange={handleChange} placeholder={`Min. ${MIN_DEPOSIT}`} error={errors.amount} required />
            <Select label="Network" name="network" value={form.network} onChange={handleChange} options={NETWORK_OPTIONS} />
            <Input label="Transaction Hash" name="txHash" value={form.txHash} onChange={handleChange} placeholder="Paste your blockchain transaction hash (txID)" error={errors.txHash} required />
            <Input label="Note (optional)" name="note" value={form.note} onChange={handleChange} placeholder="Optional reference note" />
            
            <div style={{ marginTop: '0.75rem' }}>
              <Button type="submit" fullWidth loading={submitting} style={{
                background: 'var(--secondary)',
                color: '#04130d',
                fontWeight: 700,
                fontSize: '1rem',
                padding: '0.9rem',
                borderRadius: '12px'
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
            background: 'linear-gradient(135deg, rgba(20,241,149,0.06) 0%, rgba(99,102,241,0.06) 100%)', 
            border: '1px solid rgba(20,241,149,0.15)', 
            borderRadius: '16px', 
            padding: '1.25rem 1.5rem', 
            marginBottom: '1.75rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>Rate conversion</p>
              <p style={{ margin: '0.25rem 0 0', fontWeight: 800, color: 'var(--secondary)', fontSize: '1.3rem', fontFamily: 'var(--font-display)' }}>1 USD = 1,000 Idubbu</p>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.25rem' }}>
                <TrendingUp style={{ width: '13px', height: '13px' }} />
                1 USD ≈ {loadingRates ? '...' : `${rate.toFixed(4)} ${flwCurrency}`}
              </span>
            </div>
            {estimatedIdubbu > 0 && (
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Estimated Credit</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                  <Sparkles style={{ width: '16px', height: '16px', color: 'var(--accent-cyan)' }} />
                  <p style={{ margin: 0, fontWeight: 800, color: 'var(--accent-cyan)', fontSize: '1.3rem', fontFamily: 'var(--font-display)' }}>
                    {Math.floor(estimatedIdubbu).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleFlutterwaveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem' }}>
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
                background: 'rgba(0, 0, 0, 0.2)', 
                border: '1px solid rgba(255,255,255,0.04)', 
                borderRadius: '16px', 
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.2)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Payment Amount</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{Number(form.amount).toLocaleString()} {flwCurrency}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>USD Equivalent</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>${(Number(form.amount) / rate).toFixed(2)} USD</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Transaction Fee</span>
                  <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>FREE (0%)</span>
                </div>
                <div style={{ borderTop: '1px dashed rgba(255,255,255,0.08)', margin: '0.25rem 0' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 800 }}>
                  <span style={{ color: 'var(--text-primary)' }}>You will receive</span>
                  <span style={{ color: 'var(--secondary)' }}>{Math.floor(estimatedIdubbu).toLocaleString()} Idubbu Credits</span>
                </div>
              </div>
            )}

            <div style={{ 
              background: 'rgba(20,241,149,0.02)', 
              border: '1px solid rgba(20,241,149,0.12)', 
              borderRadius: '12px', 
              padding: '1rem', 
              fontSize: '0.85rem', 
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              lineHeight: 1.5
            }}>
              <ShieldCheck style={{ width: '18px', height: '18px', color: 'var(--secondary)', flexShrink: 0, marginTop: '2px' }} />
              <span>Secure Payment Gateway. All information is encrypted using 256-bit SSL protocols. Local currency deposits are settled instantly.</span>
            </div>

            <div style={{ marginTop: '0.5rem' }}>
              <Button type="submit" fullWidth loading={submitting} style={{
                background: 'var(--secondary)',
                color: '#04130d',
                fontWeight: 700,
                fontSize: '1rem',
                padding: '0.9rem',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}>
                💳 Pay with Flutterwave
                <ChevronRight style={{ width: '18px', height: '18px' }} />
              </Button>
            </div>
          </form>
        </>
      )}
    </Card>
  );
}
