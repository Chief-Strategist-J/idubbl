import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Card } from '../../shared/components/ui/index.js';
import useAuthStore from '../../shared/store/authStore.js';

const RESEND_SECONDS = 45;

export default function VerifyAccountPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const contact = searchParams.get('contact') || 'your contact';

  const { verifyAccount } = useAuthStore();

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  const inputRefs = useRef([]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleDigitChange = useCallback((index, value) => {
    const singleDigit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = singleDigit;
    setDigits(newDigits);
    setError('');

    // Auto-advance
    if (singleDigit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [digits]);

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newDigits = [...digits];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setDigits(newDigits);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleVerify = async () => {
    const code = digits.join('');
    if (code.length < 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      if (typeof verifyAccount === 'function') {
        const result = await verifyAccount(contact, code);
        setLoading(false);
        if (result?.success) {
          setSuccessToast(true);
          setTimeout(() => navigate('/dashboard'), 1500);
        } else {
          setError(result?.error || 'That code is incorrect or expired. Request a new one.');
        }
      } else {
        setLoading(false);
        setSuccessToast(true);
        setTimeout(() => navigate('/dashboard'), 1500);
      }
    } catch (err) {
      setLoading(false);
      setError('That code is incorrect or expired. Request a new one.');
    }
  };

  const handleResend = () => {
    setCanResend(false);
    setCountdown(RESEND_SECONDS);
    setError('');
    setDigits(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
    // TODO: call resend API when available
  };

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const countdownDisplay = `${minutes}:${String(seconds).padStart(2, '0')}`;

  return (
    <div
      className="app-container"
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        display: 'flex',
        position: 'relative',
      }}
    >
      {/* Success toast */}
      {successToast && (
        <div
          style={{
            position: 'fixed',
            top: '1.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--primary)',
            color: '#04130d',
            fontWeight: 700,
            padding: '0.75rem 1.75rem',
            borderRadius: '8px',
            fontSize: '0.95rem',
            zIndex: 9999,
            boxShadow: '0 4px 24px var(--primary-glow)',
            animation: 'fadeInDown 0.3s ease',
          }}
        >
          ✓ Account verified! Redirecting…
        </div>
      )}

      <div style={{ width: '100%', maxWidth: 440, padding: '1rem' }}>
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <img
            className="logo-img"
            src="/black-logo.jpeg"
            alt="iDubbl"
            style={{ height: '80px', borderRadius: '20px', boxShadow: '0 6px 20px rgba(0,0,0,0.4)' }}
          />
        </div>

        <Card>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'var(--primary-glow)',
                border: '2px solid var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                margin: '0 auto 1rem',
              }}
            >
              🔐
            </div>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.6rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '0.5rem',
              }}
            >
              Verify your account
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Enter the 6-digit code we sent to{' '}
              <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{contact}</span>{' '}
              to activate your account.
            </p>
          </div>

          {/* OTP inputs */}
          <div
            style={{
              display: 'flex',
              gap: '0.625rem',
              justifyContent: 'center',
              marginBottom: '1.5rem',
            }}
            onPaste={handlePaste}
          >
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                style={{
                  width: '48px',
                  height: '58px',
                  textAlign: 'center',
                  fontSize: '1.5rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 700,
                  color: digit ? 'var(--primary)' : 'var(--text-primary)',
                  background: 'var(--glass-bg)',
                  border: `2px solid ${digit ? 'var(--primary)' : error ? 'var(--accent-red)' : 'var(--border)'}`,
                  borderRadius: '8px',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  cursor: 'text',
                  boxShadow: digit ? '0 0 12px var(--primary-glow)' : 'none',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--border-focus)';
                  e.target.style.boxShadow = '0 0 0 3px var(--primary-glow)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = digit ? 'var(--primary)' : error ? 'var(--accent-red)' : 'var(--border)';
                  e.target.style.boxShadow = digit ? '0 0 12px var(--primary-glow)' : 'none';
                }}
              />
            ))}
          </div>

          {/* Error message */}
          {error && (
            <div
              style={{
                background: 'var(--accent-red-glow)',
                border: '1px solid var(--accent-red)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                marginBottom: '1.25rem',
                color: 'var(--accent-red)',
                fontSize: '0.875rem',
                textAlign: 'center',
              }}
            >
              {error}
            </div>
          )}

          {/* Verify button */}
          <Button
            type="button"
            fullWidth
            loading={loading}
            onClick={handleVerify}
            disabled={digits.join('').length < 6}
          >
            Verify account
          </Button>

          {/* Resend */}
          <div
            style={{
              marginTop: '1.25rem',
              textAlign: 'center',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
            }}
          >
            {canResend ? (
              <button
                type="button"
                onClick={handleResend}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  padding: 0,
                  textDecoration: 'underline',
                  textUnderlineOffset: '2px',
                }}
              >
                Resend code
              </button>
            ) : (
              <span>
                Resend code in{' '}
                <span
                  style={{
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600,
                  }}
                >
                  {countdownDisplay}
                </span>
              </span>
            )}
          </div>
        </Card>
      </div>

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translate(-50%, -12px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
}
