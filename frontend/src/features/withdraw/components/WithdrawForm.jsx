import React, { useState, useEffect } from 'react';
import { Button, Card, Input } from '../../../shared/components/ui/index.js';
import useWalletStore from '../../../shared/store/walletStore.js';
import useAuthStore from '../../../shared/store/authStore.js';
import { MIN_WITHDRAWAL } from '../../../shared/mock/index.js';
import { Coins, CreditCard, ShieldAlert, ShieldCheck, Shield, AlertTriangle, CheckCircle, XCircle, RefreshCw, Zap } from 'lucide-react';
import QoreID from '@qore-id/web-sdk';

const IDUBBU_RATE = 1000;

export default function WithdrawForm() {
  const { depositBalance, winningsBalance, idubbuBalance, pendingWithdrawals, submitWithdrawal } = useWalletStore();
  const { user } = useAuthStore();
  
  // KYC State
  const [kycStatus, setKycStatus] = useState('loading'); // 'loading' | 'unverified' | 'pending' | 'verified' | 'failed'
  const [kycDetails, setKycDetails] = useState(null);
  const [kycActionLoading, setKycActionLoading] = useState(false);
  const [simulationModalOpen, setSimulationModalOpen] = useState(false);

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

  let apiBase = import.meta.env.VITE_API_URL || 'https://idubbl-backend.onrender.com';
  if (!apiBase.startsWith('http')) apiBase = `https://${apiBase}`;

  // Fetch KYC status on mount
  const fetchKycStatus = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${apiBase}/api/kyc/status`, {
        headers: { 'x-user-id': user.id },
        credentials: 'include'
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setKycStatus(json.kycStatus || 'unverified');
          setKycDetails(json.kycDetails);
        }
      } else {
        setKycStatus('unverified');
      }
    } catch (err) {
      console.error('Error fetching KYC status:', err);
      setKycStatus('unverified');
    }
  };

  useEffect(() => {
    fetchKycStatus();
  }, [user?.id]);

  // Fetch personal wallets on mount
  useEffect(() => {
    const fetchWallets = async () => {
      const userId = user?.id;
      if (!userId) return;
      try {
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

  // Set up QoreID Web SDK event listeners
  useEffect(() => {
    try {
      QoreID.on('success', async (data) => {
        console.log('QoreID SDK success:', data);
        // Request backend verification update
        await fetch(`${apiBase}/api/kyc/simulate`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-id': user?.id
          },
          body: JSON.stringify({ status: 'verified' })
        });
        fetchKycStatus();
      });

      QoreID.on('error', async (err) => {
        console.error('QoreID SDK error:', err);
        await fetch(`${apiBase}/api/kyc/simulate`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-id': user?.id
          },
          body: JSON.stringify({ status: 'failed' })
        });
        fetchKycStatus();
      });

      QoreID.on('close', () => {
        console.log('QoreID SDK closed');
      });
    } catch (e) {
      console.warn('QoreID event subscription failed:', e);
    }
  }, [user?.id]);

  const handleStartKyc = async () => {
    setKycActionLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/kyc/session`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user?.id
        },
        credentials: 'include'
      });
      const data = await res.json();
      setKycActionLoading(false);

      if (data.success) {
        if (data.simulation) {
          // Open simulator modal
          setSimulationModalOpen(true);
        } else {
          // Initialize QoreID Web SDK
          await QoreID.start({
            token: data.sdkSessionToken,
            customerReference: `idubbl-${user?.id}`,
            applicantData: {
              firstname: user?.name?.split(' ')[0] || 'User',
              lastname: user?.name?.split(' ')?.slice(1)?.join(' ') || 'Player',
              email: user?.email
            }
          });
        }
      } else {
        alert(data.error || 'Failed to initialize KYC. Falling back to simulation...');
        setSimulationModalOpen(true);
      }
    } catch (err) {
      console.error('Error starting QoreID flow:', err);
      setKycActionLoading(false);
      setSimulationModalOpen(true);
    }
  };

  // Simulating from mock modal
  const handleSimulateStatus = async (status) => {
    setKycActionLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/kyc/simulate`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user?.id
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        setKycStatus(data.kycStatus);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setKycActionLoading(false);
      setSimulationModalOpen(false);
    }
  };

  const walletOptions = personalWallets ? [
    (personalWallets.tron?.address || (typeof personalWallets.tron === 'string' && personalWallets.tron)) && {
      label: `Tron (TRC-20) — ${personalWallets.tron.address || personalWallets.tron}`,
      address: personalWallets.tron.address || personalWallets.tron,
      network: 'TRC20 (TRON)'
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

  // Render KYC View
  if (kycStatus !== 'verified') {
    return (
      <Card style={{ position: 'relative', overflow: 'hidden', minHeight: '380px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {/* Glow effect */}
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '120%', height: '120%', background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 60%)', zIndex: 0, pointerEvents: 'none' }} />
        
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '1.5rem 1rem' }}>
          
          {/* Header State Icons */}
          <div style={{ display: 'inline-flex', padding: '1.25rem', borderRadius: '50%', background: 'rgba(99,102,241,0.08)', border: '1.5px solid rgba(99,102,241,0.2)', color: 'var(--secondary)', marginBottom: '1.5rem' }}>
            {kycStatus === 'loading' ? (
              <RefreshCw style={{ width: '40px', height: '40px', animation: 'spin 2s linear infinite' }} />
            ) : kycStatus === 'pending' ? (
              <RefreshCw style={{ width: '40px', height: '40px', color: 'var(--accent-warning)', animation: 'spin 3s linear infinite' }} />
            ) : kycStatus === 'failed' ? (
              <XCircle style={{ width: '40px', height: '40px', color: 'var(--accent-red)' }} />
            ) : (
              <ShieldAlert style={{ width: '40px', height: '40px' }} />
            )}
          </div>

          {kycStatus === 'loading' ? (
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>Loading KYC Status</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '340px', margin: '0 auto 1.5rem auto' }}>Checking your identity verification status with QoreID...</p>
            </div>
          ) : kycStatus === 'pending' ? (
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--accent-warning)' }}>Verification Pending</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '340px', margin: '0 auto 1.5rem auto', lineHeight: '1.4' }}>
                Your QoreID verification is currently being processed. Withdrawals will automatically unlock once verified.
              </p>
              
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginBottom: '1rem' }}>
                <Button onClick={fetchKycStatus} loading={kycActionLoading} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                  <RefreshCw style={{ width: '16px', height: '16px' }} /> Refresh Status
                </Button>
              </div>
            </div>
          ) : kycStatus === 'failed' ? (
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--accent-red)' }}>Verification Failed</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '340px', margin: '0 auto 1.5rem auto', lineHeight: '1.4' }}>
                Unfortunately, your identity documents could not be verified by QoreID. Please try again with valid credentials.
              </p>
              <Button onClick={handleStartKyc} loading={kycActionLoading} fullWidth>
                Retry KYC Verification
              </Button>
            </div>
          ) : (
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>KYC Verification Required</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '340px', margin: '0 auto 1.5rem auto', lineHeight: '1.4' }}>
                To comply with regulatory standards and enable withdrawals, please verify your identity using QoreID.
              </p>
              <Button onClick={handleStartKyc} loading={kycActionLoading} fullWidth style={{ background: 'linear-gradient(135deg, var(--secondary) 0%, var(--primary-glow) 100%)', border: 'none', fontWeight: 700 }}>
                Verify Identity with QoreID
              </Button>
            </div>
          )}

          {/* Developer Quick Controls */}
          <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '10px' }}>
            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>
              🛠️ Developer Simulation Controls
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button 
                onClick={() => handleSimulateStatus('verified')} 
                style={{ padding: '0.35rem 0.6rem', fontSize: '0.7rem', background: 'var(--accent-green-glow)', border: '1px solid rgba(20,241,149,0.3)', color: 'var(--accent-green)', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
              >
                Simulate Success
              </button>
              <button 
                onClick={() => handleSimulateStatus('failed')} 
                style={{ padding: '0.35rem 0.6rem', fontSize: '0.7rem', background: 'var(--accent-red-glow)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--accent-red)', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
              >
                Simulate Fail
              </button>
              <button 
                onClick={() => handleSimulateStatus('pending')} 
                style={{ padding: '0.35rem 0.6rem', fontSize: '0.7rem', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: 'var(--accent-warning)', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
              >
                Simulate Pending
              </button>
            </div>
          </div>

        </div>

        {/* Custom Simulation Modal (QoreID Mock UI) */}
        {simulationModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '90%', maxWidth: '440px', background: '#111827', border: '1.5px solid #374151', borderRadius: '16px', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', textAlign: 'center', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '1rem', right: '1rem', cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setSimulationModalOpen(false)}>✕</div>
              
              {/* QoreID Mock Branding */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '28px', height: '28px', background: '#3b82f6', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '0.85rem' }}>Q</div>
                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#f3f4f6', letterSpacing: '0.5px' }}>qore<span style={{ color: '#3b82f6' }}>ID</span></span>
                <span style={{ fontSize: '0.65rem', background: '#1e3a8a', color: '#60a5fa', padding: '0.15rem 0.35rem', borderRadius: '4px', fontWeight: 700 }}>SANDBOX SIMULATOR</span>
              </div>

              <h4 style={{ color: '#f9fafb', fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>Verify Your Identity</h4>
              <p style={{ color: '#9ca3af', fontSize: '0.8rem', marginBottom: '1.5rem', lineHeight: '1.4' }}>
                You are about to test the QoreID identity verification SDK integration. Please choose a simulated result below.
              </p>

              {/* Mock Applicant Data Preview */}
              <div style={{ background: '#1f2937', padding: '1rem', borderRadius: '10px', textAlign: 'left', marginBottom: '1.5rem', border: '1px solid #374151' }}>
                <span style={{ display: 'block', fontSize: '0.65rem', color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Applicant Details</span>
                <div style={{ fontSize: '0.8rem', color: '#e5e7eb', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div><strong>Name:</strong> {user?.name || 'User Player'}</div>
                  <div><strong>Email:</strong> {user?.email || 'user@example.com'}</div>
                  <div><strong>Ref:</strong> idubbl-{user?.id}</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button 
                  onClick={() => handleSimulateStatus('verified')}
                  style={{ width: '100%', padding: '0.75rem', background: '#10b981', hover: { background: '#059669' }, color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.2s' }}
                >
                  ✓ Pass Verification (Simulate Success)
                </button>
                <button 
                  onClick={() => handleSimulateStatus('failed')}
                  style={{ width: '100%', padding: '0.75rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.2s' }}
                >
                  ✕ Reject Verification (Simulate Failure)
                </button>
              </div>

              <p style={{ color: '#6b7280', fontSize: '0.7rem', marginTop: '1.25rem' }}>
                Real production integrations will prompt users for document upload (NIN, Drivers License, BVN, Voter Card) or liveness detection.
              </p>
            </div>
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', margin: 0 }}>Request Withdrawal</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(20,241,149,0.08)', padding: '0.25rem 0.5rem', borderRadius: '6px', border: '1px solid rgba(20,241,149,0.2)' }}>
          <ShieldCheck style={{ width: '14px', height: '14px', color: 'var(--accent-green)' }} />
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--accent-green)', textTransform: 'uppercase' }}>KYC Verified</span>
        </div>
      </div>
      
      {/* Payment Method Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div 
          onClick={() => { setMethod('crypto'); setErrors({}); }}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: method === 'crypto' ? 'var(--secondary-glow)' : 'var(--bg-card)', color: 'var(--secondary)' }}>
              <Coins style={{ width: '20px', height: '20px' }} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontWeight: 700, margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Crypto USDT</p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Withdraw directly to Tron or Ethereum wallets.</p>
            </div>
          </div>
        </div>

        <div 
          onClick={() => { setMethod('flutterwave'); setErrors({}); }}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: method === 'flutterwave' ? 'var(--secondary-glow)' : 'var(--bg-card)', color: 'var(--secondary)' }}>
              <CreditCard style={{ width: '20px', height: '20px' }} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontWeight: 700, margin: 0, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Bank & MM</p>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Withdraw in local currency via Flutterwave.</p>
            </div>
          </div>
        </div>
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
