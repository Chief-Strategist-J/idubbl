import React, { useState } from 'react';
import { Input, Select, Button, Card } from '../../../shared/components/ui/index.js';
import useWalletStore from '../../../shared/store/walletStore.js';
import { PLATFORM_WALLET, SUPPORTED_NETWORKS, MIN_DEPOSIT } from '../../../shared/mock/index.js';

const NETWORK_OPTIONS = SUPPORTED_NETWORKS.map((n) => ({ value: n, label: n }));

export default function DepositForm() {
  const { submitDeposit } = useWalletStore();
  const [form, setForm] = useState({ amount: '', network: SUPPORTED_NETWORKS[0], txHash: '', note: '' });
  const [copied, setCopied] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});

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

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    submitDeposit({ amount: Number(form.amount), network: form.network, txHash: form.txHash, note: form.note });
    setSuccess(true);
    setForm({ amount: '', network: SUPPORTED_NETWORKS[0], txHash: '', note: '' });
    setTimeout(() => setSuccess(false), 4000);
  };

  return (
    <Card>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: '0.5rem' }}>Deposit USDT</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
        Send USDT to the address below and paste the transaction hash for review.<br />
        <strong style={{ color: 'var(--text-primary)' }}>Deposits are credited after confirmation.</strong>
      </p>

      <div style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 12, padding: '1rem', marginBottom: '1.5rem' }}>
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
          ✓ Deposit request submitted. Pending admin review.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Input label="Amount (USDT)" type="number" name="amount" value={form.amount} onChange={handleChange} placeholder={`Min. ${MIN_DEPOSIT}`} error={errors.amount} required />
        <Select label="Network" name="network" value={form.network} onChange={handleChange} options={NETWORK_OPTIONS} />
        <Input label="Transaction Hash" name="txHash" value={form.txHash} onChange={handleChange} placeholder="0x..." error={errors.txHash} required />
        <Input label="Note (optional)" name="note" value={form.note} onChange={handleChange} placeholder="Optional note for admin" />
        <Button type="submit" fullWidth>Submit Deposit Request</Button>
      </form>
    </Card>
  );
}
