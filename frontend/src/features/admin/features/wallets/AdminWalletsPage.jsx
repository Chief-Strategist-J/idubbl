import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../../shared/components/layout/AdminLayout.jsx';
import { PageHeader, Card, Table, Button, SearchBar } from '../../../../shared/components/ui/index.js';
import useWalletStore from '../../../../shared/store/walletStore.js';

export default function AdminWalletsPage() {
  const { adminUsers, fetchAdminUsers, loading } = useWalletStore();
  const [search, setSearch] = useState('');
  const [balances, setBalances] = useState({});
  const [checkingId, setCheckingId] = useState(null);

  useEffect(() => {
    fetchAdminUsers();
  }, [fetchAdminUsers]);

  const apiBase = (() => {
    let base = import.meta.env.VITE_API_URL || 'https://idubbl-backend.onrender.com';
    if (base && !base.startsWith('http://') && !base.startsWith('https://')) {
      base = `https://${base}`;
    }
    return base;
  })();

  const checkLiveBalance = async (userId) => {
    setCheckingId(userId);
    try {
      const res = await fetch(`${apiBase}/api/wallet/personal/balance`, {
        headers: { 'x-user-id': userId }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setBalances(prev => ({
            ...prev,
            [userId]: {
              tron: json.data.tron?.balance ?? 0,
              ethereum: json.data.ethereum?.balance ?? 0
            }
          }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingId(null);
    }
  };

  const usersWithWallets = adminUsers.filter(u => u.personalWallets);

  const filtered = usersWithWallets.filter((u) => {
    const name = u.name || `${u.firstName || ''} ${u.lastName || ''}`;
    const email = u.email || '';
    return !search || `${name} ${email} ${u.id || u._id}`.toLowerCase().includes(search.toLowerCase());
  });

  const COLUMNS = [
    { key: 'name', label: 'Player Name', render: (_, row) => row.name || `${row.firstName || ''} ${row.lastName || ''}`.trim() || 'No Name' },
    { key: 'email', label: 'Email' },
    {
      key: 'personalWallets',
      label: 'Tron Address (TRC-20)',
      render: (v, row) => (
        <div>
          <code style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--accent-cyan)' }}>{v.tron || '—'}</code>
          {balances[row.id || row._id] !== undefined && (
            <div style={{ fontSize: '0.8rem', color: 'var(--accent-green)', fontWeight: 600, marginTop: '2px' }}>
              Balance: {balances[row.id || row._id].tron} USDT
            </div>
          )}
        </div>
      )
    },
    {
      key: 'personalWallets_eth',
      label: 'Ethereum Address (ERC-20)',
      render: (_, row) => {
        const v = row.personalWallets;
        return (
          <div>
            <code style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--accent-cyan)' }}>{v.ethereum || '—'}</code>
            {balances[row.id || row._id] !== undefined && (
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-green)', fontWeight: 600, marginTop: '2px' }}>
                Balance: {balances[row.id || row._id].ethereum} USDT
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => checkLiveBalance(row.id || row._id)}
          loading={checkingId === (row.id || row._id)}
        >
          Check On-Chain Balance
        </Button>
      )
    }
  ];

  return (
    <AdminLayout>
      <PageHeader title="On-Chain Crypto Wallets" subtitle="View user-generated deposit addresses and check live balances on-chain." />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <Card style={{ padding: '1rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 0.25rem 0' }}>Total On-chain Wallets</p>
          <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>{usersWithWallets.length}</h2>
        </Card>
      </div>

      <Card>
        <div style={{ marginBottom: '1.5rem' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by name, email, or address..." />
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', justifyContent: 'center', alignItems: 'center', minHeight: '200px', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>
            <div className="spinner" style={{ width: '32px', height: '32px', border: '3px solid var(--border)', borderTop: '3px solid var(--secondary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span>Loading crypto wallets...</span>
          </div>
        ) : (
          <Table columns={COLUMNS} rows={filtered} emptyMessage="No crypto wallets generated yet." />
        )}
      </Card>
    </AdminLayout>
  );
}
