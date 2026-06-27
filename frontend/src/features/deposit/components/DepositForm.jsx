import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Select, Button, Card } from '../../../shared/components/ui/index.js';
import useWalletStore from '../../../shared/store/walletStore.js';
import { PLATFORM_WALLET, SUPPORTED_NETWORKS, MIN_DEPOSIT } from '../../../shared/mock/index.js';

const NETWORK_OPTIONS = SUPPORTED_NETWORKS.map((n) => ({ value: n, label: n }));
const IDUBBU_RATE = 1000;

export default function DepositForm() {
  const { submitDeposit } = useWalletStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ amount: '', network: SUPPORTED_NETWORKS[0], txHash: '', note: '' });
  const [copied, setCopied] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const copyAddress = () => {
    navigator.clipboard.writeText(PLATFORM_WALLET).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const validate = () => {
    const errs = {};
    if (!form.amount || Number(form.amount) < MIN_DEPOSIT) errs.amount = `Minimum deposit is ${MIN_DEPOSIT} USDT`;
    if (!form.txHash.trim()) errs.txHash = 'Transaction hash is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);
    await submitDeposit({ amount: Number(form.amount), network: form.network, txHash: form.txHash, note: form.note });
    setSuccess(true);
    setSubmitting(false);
    setForm({ amount: '', network: SUPPORTED_NETWORKS[0], txHash: '', note: '' });
    // Navigate to wallet after 2 seconds so user can see the success message
    setTimeout(() => navigate('/wallet'), 2000);
  };

  const estimatedIdubbu = form.amount ? Number(form.amount) * IDUBBU_RATE : 0;

  return (
    <Card>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Deposit USDT</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Send USDT to the address below and paste the transaction hash for review.<br />
        <strong style={{ color: 'var(--text-primary)' }}>Deposits are credited after confirmation.</strong>
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

      <form onSubmit={handleSubmit}>
        <Input label="Amount (USDT)" type="number" name="amount" value={form.amount} onChange={handleChange} placeholder={`Min. ${MIN_DEPOSIT}`} error={errors.amount} required />
        <Select label="Network" name="network" value={form.network} onChange={handleChange} options={NETWORK_OPTIONS} />
        <Input label="Transaction Hash" name="txHash" value={form.txHash} onChange={handleChange} placeholder="0x..." error={errors.txHash} required />
        <Input label="Note (optional)" name="note" value={form.note} onChange={handleChange} placeholder="Optional note for admin" />
        <Button type="submit" fullWidth loading={submitting}>Submit Deposit Request</Button>
      </form>
    </Card>
  );
}
