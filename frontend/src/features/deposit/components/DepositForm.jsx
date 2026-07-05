import React, { useState, useEffect, useRef } from 'react';
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
  ChevronDown,
  TrendingUp,
  Sparkles,
  Search
} from 'lucide-react';
import { Input, Select, Button, Card } from '../../../shared/components/ui/index.js';
import useWalletStore from '../../../shared/store/walletStore.js';
import useAuthStore from '../../../shared/store/authStore.js';
import { PLATFORM_WALLET, SUPPORTED_NETWORKS, MIN_DEPOSIT } from '../../../shared/mock/index.js';

const NETWORK_OPTIONS = SUPPORTED_NETWORKS.map((n) => ({ value: n, label: n }));
const IDUBBU_RATE = 1;
const FALLBACK_CURRENCY_LIST = [
  { value: 'USD', label: 'USD - US Dollar', flag: '🇺🇸' },
  { value: 'NGN', label: 'NGN - Nigerian Naira', flag: '🇳🇬' },
  { value: 'GHS', label: 'GHS - Ghanaian Cedi', flag: '🇬🇭' },
  { value: 'KES', label: 'KES - Kenyan Shilling', flag: '🇰🇪' },
  { value: 'ZAR', label: 'ZAR - South African Rand', flag: '🇿🇦' },
  { value: 'EUR', label: 'EUR - Euro', flag: '🇪🇺' },
  { value: 'GBP', label: 'GBP - British Pound', flag: '🇬🇧' },
  { value: 'TZS', label: 'TZS - Tanzanian Shilling', flag: '🇹🇿' },
  { value: 'UGX', label: 'UGX - Ugandan Shilling', flag: '🇺🇬' },
  { value: 'RWF', label: 'RWF - Rwandan Franc', flag: '🇷🇼' },
  { value: 'ZMW', label: 'ZMW - Zambian Kwacha', flag: '🇿🇲' },
  { value: 'XOF', label: 'XOF - West African CFA', flag: '🇨🇮' },
  { value: 'XAF', label: 'XAF - Central African CFA', flag: '🇨🇲' }
];

export default function DepositForm() {
  const { submitDeposit, currencies, fetchCurrencies } = useWalletStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const CURRENCY_LIST = currencies.length > 0 ? currencies : FALLBACK_CURRENCY_LIST;

  const [method, setMethod] = useState(user?.hideCryptoWallet === true ? 'flutterwave' : 'crypto'); // 'crypto' | 'flutterwave'
  const [form, setForm] = useState({ amount: '', network: SUPPORTED_NETWORKS[0], txHash: '', note: '' });
  const [flwCurrency, setFlwCurrency] = useState('USD');
  const [exchangeRates, setExchangeRates] = useState({ USD: 1, NGN: 1500, GHS: 15, KES: 130, ZAR: 18, EUR: 0.92, GBP: 0.79 });
  
  const [copied, setCopied] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingRates, setLoadingRates] = useState(true);
  
  // Custom Dropdown States
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchCurrencies();
  }, [fetchCurrencies]);

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

  // Handle clicking outside the dropdown to close it
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user?.id || user?._id
        },
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

  // Filter currency options based on search query
  const filteredCurrencies = CURRENCY_LIST.filter(curr => 
    curr.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
    curr.value.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCurrencyObj = CURRENCY_LIST.find(curr => curr.value === flwCurrency) || CURRENCY_LIST[0] || { flag: '🇺🇸', value: 'USD' };

  return (
    <Card hover={false}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <Coins style={{ color: 'var(--secondary)', width: '24px', height: '24px' }} />
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Fund Wallet</h3>
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
        Fund your wallet with credit to participate in challenges and game duels. Select your preferred method below:
      </p>
      
      {/* Premium Method Selector Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: user?.hideCryptoWallet === true ? '1fr' : '1fr 1fr',
        gap: '0.75rem', 
        marginBottom: '1.5rem' 
      }}>
        {user?.hideCryptoWallet !== true && (
          <div 
            onClick={() => { setMethod('crypto'); setErrors({}); setForm({ ...form, amount: '' }); }}
            style={{ 
              padding: '1rem', 
              borderRadius: '12px', 
              cursor: 'pointer', 
              background: method === 'crypto' ? 'var(--accent-cyan-glow)' : 'var(--bg-darker)', 
              border: `1.5px solid ${method === 'crypto' ? 'var(--secondary)' : 'var(--border)'}`, 
              transition: 'all 0.2s ease',
              boxShadow: method === 'crypto' ? '0 0 10px var(--primary-glow)' : 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Coins style={{ width: '18px', height: '18px', color: method === 'crypto' ? 'var(--secondary)' : 'var(--text-muted)' }} />
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Crypto USDT</h4>
            </div>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pay manually via TRC20/ERC20 network.</p>
          </div>
        )}

        <div 
          onClick={() => { setMethod('flutterwave'); setErrors({}); setForm({ ...form, amount: '' }); }}
          style={{ 
            padding: '1rem', 
            borderRadius: '12px', 
            cursor: 'pointer', 
            background: method === 'flutterwave' ? 'var(--accent-cyan-glow)' : 'var(--bg-darker)', 
            border: `1.5px solid ${method === 'flutterwave' ? 'var(--secondary)' : 'var(--border)'}`, 
            transition: 'all 0.2s ease',
            boxShadow: method === 'flutterwave' ? '0 0 10px var(--primary-glow)' : 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <CreditCard style={{ width: '18px', height: '18px', color: method === 'flutterwave' ? 'var(--secondary)' : 'var(--text-muted)' }} />
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Cards & Pay</h4>
          </div>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Instant deposits via Flutterwave checkout.</p>
        </div>
      </div>

      {method === 'crypto' && user?.hideCryptoWallet !== true ? (
        <>
          {/* Rate Summary Card */}
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(20,241,149,0.06), rgba(99,102,241,0.06))', 
            border: '1px solid var(--border)', 
            borderRadius: '12px', 
            padding: '1rem 1.25rem', 
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Conversion Rate</p>
              <p style={{ margin: '0.2rem 0 0', fontWeight: 700, color: 'var(--secondary)', fontSize: '1.15rem' }}>1 USDT = 1,000 Idubbu</p>
            </div>
            {estimatedIdubbu > 0 && (
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Estimated Credit</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                  <Sparkles style={{ width: '15px', height: '15px', color: 'var(--accent-cyan)' }} />
                  <p style={{ margin: 0, fontWeight: 800, color: 'var(--accent-cyan)', fontSize: '1.15rem' }}>
                    {estimatedIdubbu.toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Copy Address Widget */}
          <div style={{ 
            background: 'var(--bg-darker)', 
            border: '1px solid var(--border)', 
            borderRadius: '12px', 
            padding: '1rem', 
            marginBottom: '1.5rem'
          }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', margin: '0 0 0.5rem 0' }}>Platform USDT Wallet Address</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <code style={{ 
                flex: 1, 
                color: 'var(--accent-cyan)', 
                fontFamily: 'monospace', 
                fontSize: '0.85rem', 
                wordBreak: 'break-all'
              }}>{PLATFORM_WALLET}</code>
              <button 
                type="button" 
                onClick={copyAddress}
                style={{ 
                  flexShrink: 0, 
                  background: copied ? 'rgba(20,241,149,0.1)' : 'var(--bg-dark)', 
                  border: `1px solid ${copied ? 'var(--secondary)' : 'var(--border)'}`, 
                  color: copied ? 'var(--secondary)' : 'var(--text-primary)',
                  padding: '0.5rem 1rem', 
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
            background: 'var(--accent-warning-glow)', 
            border: '1px solid var(--accent-warning-glow)', 
            borderRadius: '10px', 
            padding: '0.85rem 1rem', 
            marginBottom: '1.5rem', 
            fontSize: '0.85rem', 
            color: 'var(--accent-warning)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.6rem'
          }}>
            <AlertTriangle style={{ width: '16px', height: '16px', flexShrink: 0, marginTop: '2px' }} />
            <span>Minimum deposit: {MIN_DEPOSIT} USDT · Supported networks: TRC20, ERC20 only</span>
          </div>

          {success && (
            <div style={{ 
              background: 'var(--accent-green-glow)', 
              border: '1px solid var(--accent-green-glow)', 
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
              <span>Deposit request submitted! Redirecting in a moment...</span>
            </div>
          )}

          <form onSubmit={handleCryptoSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Input label="Amount (USDT)" type="number" name="amount" value={form.amount} onChange={handleChange} placeholder={`Min. ${MIN_DEPOSIT}`} error={errors.amount} required />
            <Select label="Network" name="network" value={form.network} onChange={handleChange} options={NETWORK_OPTIONS} />
            <Input label="Transaction Hash" name="txHash" value={form.txHash} onChange={handleChange} placeholder="0x..." error={errors.txHash} required />
            <Input label="Note (optional)" name="note" value={form.note} onChange={handleChange} placeholder="Optional reference note" />
            <Button type="submit" fullWidth loading={submitting} disabled={!form.amount || Number(form.amount) < MIN_DEPOSIT} style={{
              opacity: (!form.amount || Number(form.amount) < MIN_DEPOSIT) ? 0.5 : 1,
              cursor: (!form.amount || Number(form.amount) < MIN_DEPOSIT) ? 'not-allowed' : 'pointer'
            }}>Submit Deposit Request</Button>
          </form>
        </>
      ) : (
        <>
          {/* Rate Summary Card */}
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(20,241,149,0.06), rgba(99,102,241,0.06))', 
            border: '1px solid var(--border)', 
            borderRadius: '12px', 
            padding: '1rem 1.25rem', 
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Conversion Rate</p>
              <p style={{ margin: '0.2rem 0 0', fontWeight: 700, color: 'var(--secondary)', fontSize: '1.15rem' }}>1 USD = 1,000 Idubbu</p>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.2rem' }}>
                <TrendingUp style={{ width: '12px', height: '12px' }} />
                1 USD ≈ {loadingRates ? '...' : `${rate.toFixed(2)} ${flwCurrency}`}
              </span>
            </div>
            {estimatedIdubbu > 0 && (
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.75rem' }}>Estimated Credit</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                  <Sparkles style={{ width: '15px', height: '15px', color: 'var(--accent-cyan)' }} />
                  <p style={{ margin: 0, fontWeight: 800, color: 'var(--accent-cyan)', fontSize: '1.15rem' }}>
                    {Math.floor(estimatedIdubbu).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleFlutterwaveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
              gap: '1rem', 
              alignItems: 'end' 
            }}>
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
              
              {/* Premium Custom Searchable Dropdown */}
              <div ref={dropdownRef} className="form-group" style={{ position: 'relative', width: '100%' }}>
                <label className="form-label">
                  Currency
                </label>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="form-input"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    boxSizing: 'border-box',
                    textAlign: 'left',
                    padding: '0.75rem 1rem',
                    borderColor: dropdownOpen ? 'var(--border-focus)' : 'var(--border)',
                    boxShadow: dropdownOpen ? '0 0 10px var(--primary-glow)' : 'none'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '1.2rem', lineHeight: '1' }}>{selectedCurrencyObj.flag}</span>
                    <span>{selectedCurrencyObj.value}</span>
                  </span>
                  <ChevronDown style={{ width: '15px', height: '15px', color: 'var(--text-muted)', transition: 'transform 0.2s', transform: dropdownOpen ? 'rotate(180deg)' : 'none' }} />
                </button>

                {dropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '110%',
                    left: 0,
                    right: 0,
                    zIndex: 9999,
                    background: 'var(--bg-darker)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                    padding: '0.5rem',
                    minWidth: '200px',
                    maxHeight: '260px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}>
                    {/* Search Field */}
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Search style={{ width: '14px', height: '14px', color: 'var(--text-muted)', position: 'absolute', left: '0.65rem' }} />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search..."
                        className="form-input"
                        style={{
                          padding: '0.4rem 0.5rem 0.4rem 1.85rem',
                          fontSize: '0.8rem',
                          height: '34px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    {/* List Items */}
                    <div style={{ 
                      overflowY: 'auto', 
                      flex: 1, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '3px',
                      paddingRight: '2px'
                    }}>
                      {filteredCurrencies.length === 0 ? (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '0.75rem' }}>
                          No currencies found
                        </div>
                      ) : (
                        filteredCurrencies.map(curr => (
                          <button
                            key={curr.value}
                            type="button"
                            onClick={() => {
                              setFlwCurrency(curr.value);
                              setDropdownOpen(false);
                              setSearchQuery('');
                            }}
                            style={{
                              width: '100%',
                              padding: '0.55rem 0.65rem',
                              border: 'none',
                              background: flwCurrency === curr.value ? 'var(--accent-cyan-glow)' : 'transparent',
                              color: flwCurrency === curr.value ? 'var(--secondary)' : 'var(--text-primary)',
                              borderRadius: '6px',
                              textAlign: 'left',
                              cursor: 'pointer',
                              fontSize: '0.82rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span style={{ fontSize: '1.15rem' }}>{curr.flag}</span>
                            <span style={{ fontWeight: flwCurrency === curr.value ? 700 : 500 }}>{curr.label}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Dynamic Checkout Invoice Breakdown */}
            {form.amount && Number(form.amount) > 0 && (
              <div style={{ 
                background: 'var(--bg-darker)', 
                border: '1px solid var(--border)', 
                borderRadius: '12px', 
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
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
                <div style={{ borderTop: '1px dashed var(--border)', margin: '0.25rem 0' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 800 }}>
                  <span style={{ color: 'var(--text-primary)' }}>You will receive</span>
                  <span style={{ color: 'var(--secondary)' }}>{Math.floor(estimatedIdubbu).toLocaleString()} Idubbu Credits</span>
                </div>
              </div>
            )}

            <div style={{ 
              background: 'var(--accent-green-glow)', 
              border: '1px solid var(--accent-green-glow)', 
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
              <span>Secure Checkout. Payments are processed encrypted using SSL protocols. Deposits are settled instantly.</span>
            </div>

            <Button type="submit" fullWidth loading={submitting} disabled={!form.amount || (Number(form.amount) / rate) < MIN_DEPOSIT} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              height: '46px',
              opacity: (!form.amount || (Number(form.amount) / rate) < MIN_DEPOSIT) ? 0.5 : 1,
              cursor: (!form.amount || (Number(form.amount) / rate) < MIN_DEPOSIT) ? 'not-allowed' : 'pointer'
            }}>
              💳 Pay with Flutterwave
              <ChevronRight style={{ width: '18px', height: '18px' }} />
            </Button>
          </form>
        </>
      )}
    </Card>
  );
}
