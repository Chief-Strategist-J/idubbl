import React, { useState, useEffect } from 'react';
import { Button, Card, Input } from '../../../shared/components/ui/index.js';
import useAuthStore from '../../../shared/store/authStore.js';

const apiBase = (() => {
  let base = import.meta.env.VITE_API_URL || 'https://idubbl-backend.onrender.com';
  if (base && !base.startsWith('http://') && !base.startsWith('https://')) {
    base = `https://${base}`;
  }
  return base;
})();

export default function PersonalWalletsWidget() {
  const { user } = useAuthStore();
  const activeUserId = user?.id || 'u1';

  const [wallets, setWallets] = useState(null);
  const [balances, setBalances] = useState(null);
  const [loading, setLoading] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ tronAddress: '', ethereumAddress: '' });
  const [copiedText, setCopiedText] = useState({});
  const [showKey, setShowKey] = useState({ tron: false, ethereum: false });

  const fetchWallets = async () => {
    if (!activeUserId) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/wallet/personal`, {
        headers: { 'x-user-id': activeUserId }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setWallets(json.data);
          setEditForm({
            tronAddress: json.data?.tron?.address || '',
            ethereumAddress: json.data?.ethereum?.address || ''
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!activeUserId) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/wallet/personal/create`, {
        method: 'POST',
        headers: { 'x-user-id': activeUserId }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setWallets(json.data);
          setEditForm({
            tronAddress: json.data?.tron?.address || '',
            ethereumAddress: json.data?.ethereum?.address || ''
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!activeUserId) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/wallet/personal/edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': activeUserId
        },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        setEditing(false);
        fetchWallets();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBalances = async () => {
    if (!activeUserId) return;
    setBalanceLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/wallet/personal/balance`, {
        headers: { 'x-user-id': activeUserId }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setBalances(json.data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBalanceLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!activeUserId) return;
    if (!window.confirm('Are you sure you want to delete/reset your generated crypto wallets?')) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/wallet/personal`, {
        method: 'DELETE',
        headers: { 'x-user-id': activeUserId }
      });
      if (res.ok) {
        setWallets(null);
        setBalances(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeUserId) {
      fetchWallets();
      fetchBalances();
    }
  }, [activeUserId]);

  const copyToClipboard = (address, type) => {
    navigator.clipboard.writeText(address);
    setCopiedText(prev => ({ ...prev, [type]: true }));
    setTimeout(() => {
      setCopiedText(prev => ({ ...prev, [type]: false }));
    }, 2000);
  };

  return (
    <Card style={{ marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', margin: 0 }}>My Personal Crypto Addresses</h3>
        {wallets && (
          <Button variant="secondary" size="sm" onClick={() => setEditing(!editing)}>
            {editing ? 'Cancel' : 'Edit Addresses'}
          </Button>
        )}
      </div>

      {!wallets ? (
        <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Generate your own unique personal addresses to deposit USDT directly to your account.
          </p>
          <Button onClick={handleGenerate} loading={loading}>
            Generate My Deposit Wallets
          </Button>
        </div>
      ) : editing ? (
        <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input
            label="USDT TRC20 (Tron) Address"
            value={editForm.tronAddress}
            onChange={(e) => setEditForm({ ...editForm, tronAddress: e.target.value })}
            placeholder="T..."
          />
          <Input
            label="USDT ERC20 (Ethereum) Address"
            value={editForm.ethereumAddress}
            onChange={(e) => setEditForm({ ...editForm, ethereumAddress: e.target.value })}
            placeholder="0x..."
          />
          <Button type="submit" loading={loading}>Save Custom Addresses</Button>
        </form>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>USDT TRC-20 (TRON)</span>
              {balances?.tron && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                  <span style={{ color: 'var(--accent-green)', fontWeight: 600, fontSize: '0.85rem' }}>
                    USDT: {balances.tron.balance} USDT
                  </span>
                  {balances.tron.nativeBalance !== undefined && (
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 500 }}>
                      Gas: {balances.tron.nativeBalance} TRX
                    </span>
                  )}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <code style={{ flex: 1, wordBreak: 'break-all', fontSize: '0.85rem' }}>{wallets.tron?.address}</code>
              <Button size="sm" variant="secondary" onClick={() => copyToClipboard(wallets.tron?.address, 'tron')}>
                {copiedText['tron'] ? 'Copied!' : 'Copy'}
              </Button>
            </div>
             <div style={{ display: 'flex', gap: '1rem', marginTop: '0.35rem', alignItems: 'center' }}>
              <a
                href={`${wallets.tron?.explorerBase || balances?.tron?.explorerBase || 'https://tronscan.org'}/#/address/${wallets.tron?.address}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', textDecoration: 'underline', fontWeight: 500 }}
              >
                View on Tronscan Explorer
              </a>
              <button
                type="button"
                onClick={() => setShowKey({ ...showKey, tron: !showKey.tron })}
                style={{ background: 'none', border: 'none', color: 'var(--accent-warning)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline', fontWeight: 500, padding: 0 }}
              >
                {showKey.tron ? 'Hide Private Key' : 'Reveal Private Key'}
              </button>
            </div>
            
            {showKey.tron && wallets.tron?.privateKey && (
              <div style={{ marginTop: '0.5rem', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255, 171, 0, 0.05)', border: '1px solid rgba(255, 171, 0, 0.15)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-warning)', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>⚠️ PRIVATE KEY (Do not share!):</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <code style={{ flex: 1, wordBreak: 'break-all', fontSize: '0.8rem', color: 'var(--text-primary)' }}>{wallets.tron?.privateKey}</code>
                  <Button size="sm" variant="secondary" onClick={() => copyToClipboard(wallets.tron?.privateKey, 'tron_key')}>
                    {copiedText['tron_key'] ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>USDT ERC-20 (Ethereum)</span>
              {balances?.ethereum && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                  <span style={{ color: 'var(--accent-green)', fontWeight: 600, fontSize: '0.85rem' }}>
                    USDT: {balances.ethereum.balance} USDT
                  </span>
                  {balances.ethereum.nativeBalance !== undefined && (
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontWeight: 500 }}>
                      Gas: {balances.ethereum.nativeBalance} ETH
                    </span>
                  )}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <code style={{ flex: 1, wordBreak: 'break-all', fontSize: '0.85rem' }}>{wallets.ethereum?.address}</code>
              <Button size="sm" variant="secondary" onClick={() => copyToClipboard(wallets.ethereum?.address, 'ethereum')}>
                {copiedText['ethereum'] ? 'Copied!' : 'Copy'}
              </Button>
            </div>
             <div style={{ display: 'flex', gap: '1rem', marginTop: '0.35rem', alignItems: 'center' }}>
              <a
                href={`${wallets.ethereum?.explorerBase || balances?.ethereum?.explorerBase || 'https://etherscan.io'}/address/${wallets.ethereum?.address}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', textDecoration: 'underline', fontWeight: 500 }}
              >
                View on Etherscan Explorer
              </a>
              <button
                type="button"
                onClick={() => setShowKey({ ...showKey, ethereum: !showKey.ethereum })}
                style={{ background: 'none', border: 'none', color: 'var(--accent-warning)', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline', fontWeight: 500, padding: 0 }}
              >
                {showKey.ethereum ? 'Hide Private Key' : 'Reveal Private Key'}
              </button>
            </div>
            
            {showKey.ethereum && wallets.ethereum?.privateKey && (
              <div style={{ marginTop: '0.5rem', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255, 171, 0, 0.05)', border: '1px solid rgba(255, 171, 0, 0.15)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-warning)', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>⚠️ PRIVATE KEY (Do not share!):</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <code style={{ flex: 1, wordBreak: 'break-all', fontSize: '0.8rem', color: 'var(--text-primary)' }}>{wallets.ethereum?.privateKey}</code>
                  <Button size="sm" variant="secondary" onClick={() => copyToClipboard(wallets.ethereum?.privateKey, 'eth_key')}>
                    {copiedText['eth_key'] ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <Button variant="secondary" onClick={fetchBalances} loading={balanceLoading} style={{ flex: 1 }}>
              Refresh Balances
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={loading} style={{ flex: 1 }}>
              Reset Wallets
            </Button>
          </div>

          <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255, 171, 0, 0.05)', border: '1px solid rgba(255, 171, 0, 0.1)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-warning)', fontWeight: 600 }}>⚠️ Testnet Sandbox Faucets:</span>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <strong>TRON (Shasta)</strong>: Get test TRX/USDT from the <a href="https://shasta.tronex.io/join/getJoinPage" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-cyan)', textDecoration: 'underline', fontWeight: 600 }}>Shasta Faucet</a> or <a href="https://faucet.triangleplatform.com/tron/shasta" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-cyan)', textDecoration: 'underline', fontWeight: 600 }}>Triangle Faucet</a>.
            </p>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <strong>Ethereum (Sepolia)</strong>: Get test gas ETH from the <a href="https://sepolia-faucet.pk910.de/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-cyan)', textDecoration: 'underline', fontWeight: 600 }}>Sepolia PoW Faucet</a> (No mainnet balance required), <a href="https://faucets.chain.link/sepolia" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-cyan)', textDecoration: 'underline', fontWeight: 600 }}>Chainlink Faucet</a> (Requires login), or <a href="https://faucet.quicknode.com/ethereum/sepolia" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-cyan)', textDecoration: 'underline', fontWeight: 600 }}>QuickNode Faucet</a>.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
