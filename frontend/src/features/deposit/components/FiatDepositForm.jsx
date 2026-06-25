import React, { useState } from 'react';
import { Input, Button, Card } from '../../../shared/components/ui/index.js';
import useAuthStore from '../../../shared/store/authStore.js';

const apiBase = (() => {
  let base = import.meta.env.VITE_API_URL || 'https://idubbl-backend.onrender.com';
  if (base && !base.startsWith('http://') && !base.startsWith('https://')) {
    base = `https://${base}`;
  }
  return base;
})();

const DEPOSIT_ADDRESS = 'TRC20_ADDRESS_FROM_BACKEND';

export default function UsdtDepositForm() {
  const { user } = useAuthStore();
  const [form, setForm] = useState({ amount: '', txHash: '', note: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.amount || Number(form.amount) < 10) {
      newErrors.amount = 'Amount must be at least 10 USDT.';
    }
    if (!form.txHash.trim()) {
      newErrors.txHash = 'Please paste a valid transaction hash.';
    }
    return newErrors;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(DEPOSIT_ADDRESS);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for browsers without clipboard API
      const el = document.createElement('textarea');
      el.value = DEPOSIT_ADDRESS;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
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
      const response = await fetch(`${apiBase}/api/wallet/deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
        },
        credentials: 'include',
        body: JSON.stringify({
          amount: Number(form.amount),
          txHash: form.txHash.trim(),
          note: form.note.trim(),
        }),
      });
      const data = await response.json();
      if (response.ok && (data.success !== false)) {
        setSuccess(true);
        setForm({ amount: '', txHash: '', note: '' });
      } else {
        throw new Error(data.message || data.error || 'Failed to submit deposit.');
      }
    } catch (err) {
      console.error('Deposit submit error:', err);
      setSubmitError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '2rem 1rem',
          gap: '1rem',
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'var(--accent-green-glow)',
            border: '2px solid var(--accent-green)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
          }}>
            ✓
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', color: 'var(--accent-green)', margin: 0 }}>
            Deposit Submitted
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: 360, lineHeight: 1.6, margin: 0 }}>
            We'll review and credit your wallet shortly.
          </p>
          <Button
            variant="secondary"
            onClick={() => setSuccess(false)}
            style={{ marginTop: '0.5rem' }}
          >
            Submit Another
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.3rem',
          fontWeight: 700,
          marginBottom: '0.35rem',
          background: 'linear-gradient(135deg, var(--accent-green) 0%, #00c47a 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Deposit USDT
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
          Send USDT to the address below and paste the transaction hash for review.
        </p>
      </div>

      {/* Network badge */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
          Network
        </label>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
          borderRadius: 10,
          padding: '0.65rem 1rem',
          cursor: 'not-allowed',
          opacity: 0.85,
        }}>
          <span style={{ fontSize: '0.9rem' }}>🔒</span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            fontSize: '0.95rem',
            color: 'var(--text-primary)',
            letterSpacing: '0.03em',
          }}>
            USDT · TRC-20
          </span>
        </div>
      </div>

      {/* Warning banner */}
      <div style={{
        background: 'var(--accent-warning-glow)',
        border: '1px solid rgba(255, 176, 32, 0.35)',
        borderLeft: '3px solid var(--accent-warning)',
        borderRadius: 10,
        padding: '0.75rem 1rem',
        marginBottom: '1.25rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.6rem',
      }}>
        <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: '0.05rem' }}>⚠️</span>
        <p style={{ color: 'var(--accent-warning)', fontSize: '0.85rem', fontWeight: 500, lineHeight: 1.5, margin: 0 }}>
          Only send USDT on the TRC-20 network. Funds sent on the wrong network cannot be recovered.
        </p>
      </div>

      {/* Minimum notice */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        padding: '0.5rem 0.75rem',
        background: 'rgba(0, 227, 122, 0.06)',
        border: '1px solid rgba(0, 227, 122, 0.15)',
        borderRadius: 8,
      }}>
        <span style={{ fontSize: '0.85rem' }}>ℹ️</span>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          Minimum deposit: <strong style={{ color: 'var(--accent-green)' }}>10 USDT</strong>
        </span>
      </div>

      {/* QR Code placeholder */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
        <div style={{
          width: 200,
          height: 200,
          background: 'var(--bg-card)',
          border: '2px dashed rgba(255,255,255,0.12)',
          borderRadius: 16,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.4rem',
        }}>
          {/* QR Grid Pattern */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 3,
            width: 80,
            marginBottom: '0.5rem',
            opacity: 0.25,
          }}>
            {Array.from({ length: 25 }).map((_, i) => (
              <div key={i} style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                background: [0,1,2,3,4,5,9,10,14,15,19,20,21,22,23,24].includes(i)
                  ? 'var(--text-secondary)'
                  : 'transparent',
              }} />
            ))}
          </div>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>QR Code</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.4, maxWidth: 140 }}>
            Scan to get deposit address
          </span>
        </div>
      </div>

      {/* Address block */}
      <div style={{ marginBottom: '1.75rem' }}>
        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          Platform deposit address
        </label>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0',
          background: 'var(--bg-card)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
          overflow: 'hidden',
        }}>
          <div style={{
            flex: 1,
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            color: 'var(--text-primary)',
            padding: '0.75rem 1rem',
            overflowX: 'auto',
            wordBreak: 'break-all',
            letterSpacing: '0.02em',
          }}>
            {DEPOSIT_ADDRESS}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            style={{
              flexShrink: 0,
              background: copied ? 'var(--accent-green-glow)' : 'rgba(255,255,255,0.05)',
              border: 'none',
              borderLeft: '1px solid rgba(255,255,255,0.08)',
              padding: '0.75rem 1rem',
              cursor: 'pointer',
              color: copied ? 'var(--accent-green)' : 'var(--text-secondary)',
              fontSize: '0.8rem',
              fontWeight: 600,
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              whiteSpace: 'nowrap',
            }}
          >
            {copied ? (
              <>✓ Address copied.</>
            ) : (
              <>📋 Copy</>
            )}
          </button>
        </div>
      </div>

      {/* Form */}
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

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <Input
          label="Amount sent (USDT)"
          type="number"
          name="amount"
          value={form.amount}
          onChange={handleChange}
          placeholder="Minimum 10 USDT"
          error={errors.amount}
        />
        <Input
          label="Transaction hash"
          type="text"
          name="txHash"
          value={form.txHash}
          onChange={handleChange}
          placeholder="Paste the transaction ID from your wallet or exchange"
          error={errors.txHash}
        />
        <Input
          label="Note (optional)"
          type="text"
          name="note"
          value={form.note}
          onChange={handleChange}
          placeholder="Optional note for our review team"
        />

        <div style={{ marginTop: '0.5rem' }}>
          <Button type="submit" loading={loading} fullWidth>
            Submit for review
          </Button>
        </div>
      </form>

      {/* Review time note */}
      <p style={{
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.8rem',
        marginTop: '1rem',
        marginBottom: 0,
        lineHeight: 1.5,
      }}>
        🕐 Review usually takes under 30 minutes during active hours.
      </p>
    </Card>
  );
}
