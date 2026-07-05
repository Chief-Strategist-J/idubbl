import React, { useState } from 'react';
import AdminLayout from '../../../../shared/components/layout/AdminLayout.jsx';
import { PageHeader, Card, Table, Badge, Button, SearchBar } from '../../../../shared/components/ui/index.js';
import useWalletStore from '../../../../shared/store/walletStore.js';
import useAuthStore from '../../../../shared/store/authStore.js';

export default function AdminWithdrawalsPage() {
  const { withdrawals, approveWithdrawal, rejectWithdrawal, fetchAdminWithdrawals, currencies, fetchCurrencies, loading } = useWalletStore();
  const { user, updateUserPreferences } = useAuthStore();
  const [search, setSearch] = useState('');
  const [actionId, setActionId] = useState(null);
  const [exchangeRates, setExchangeRates] = useState({ USD: 1, NGN: 1500, GHS: 15, KES: 130, ZAR: 18, EUR: 0.92 });
  const [loadingRates, setLoadingRates] = useState(true);

  const showFullAddresses = user?.showFullAddresses ?? false;

  const toggleShowAddresses = async () => {
    await updateUserPreferences({ showFullAddresses: !showFullAddresses });
  };

  React.useEffect(() => {
    fetchAdminWithdrawals();
    fetchCurrencies();
    fetch('https://api.exchangerate-api.com/v4/latest/USD')
      .then(res => res.json())
      .then(data => {
        if (data && data.rates) {
          // Fill exchangeRates dynamically for all currencies we might support
          const updatedRates = { USD: 1 };
          if (currencies && currencies.length > 0) {
            currencies.forEach(c => {
              updatedRates[c.value] = data.rates[c.value] || 1;
            });
          } else {
            updatedRates.NGN = data.rates.NGN || 1500;
            updatedRates.GHS = data.rates.GHS || 15;
            updatedRates.KES = data.rates.KES || 130;
            updatedRates.ZAR = data.rates.ZAR || 18;
            updatedRates.EUR = data.rates.EUR || 0.92;
            updatedRates.GBP = data.rates.GBP || 0.79;
          }
          setExchangeRates(updatedRates);
        }
      })
      .catch(err => console.warn(err))
      .finally(() => setLoadingRates(false));
  }, [fetchAdminWithdrawals, fetchCurrencies, currencies.length]);

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this withdrawal request? This will trigger the payout.')) {
      return;
    }
    setActionId(id);
    const res = await approveWithdrawal(id);
    setActionId(null);
    if (!res?.success) {
      alert(`Failed to approve withdrawal: ${res?.error || 'Unknown error'}`);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to reject this withdrawal request?')) {
      return;
    }
    setActionId(id);
    const res = await rejectWithdrawal(id);
    setActionId(null);
    if (!res?.success) {
      alert(`Failed to reject withdrawal: ${res?.error || 'Unknown error'}`);
    }
  };

  const columns = [
    { key: 'id', label: 'Ref', render: (v) => <code style={{ fontSize: '0.8rem' }}>{v.toUpperCase()}</code> },
    { key: 'user', label: 'User' },
    { key: 'amount', label: 'Amount', render: (v) => `${v} USDT` },
    { 
      key: 'address', 
      label: 'Address', 
      render: (v) => {
        if (!v) return '—';
        const displayVal = showFullAddresses ? v : `${v.substring(0, 6)}...${v.substring(v.length - 6)}`;
        return <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{displayVal}</code>;
      }
    },
    { key: 'network', label: 'Network' },
    { key: 'status', label: 'Status', render: (v) => <Badge status={v} /> },
    { key: 'createdAt', label: 'Requested', render: (v) => new Date(v).toLocaleDateString() },
    {
      key: 'actions', label: 'Actions',
      render: (_, row) => row.status === 'pending' ? (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button 
            variant="primary" 
            onClick={() => handleApprove(row.id)} 
            disabled={actionId !== null}
            style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
          >
            {actionId === row.id ? 'Approving...' : 'Approve'}
          </Button>
          <Button 
            variant="danger" 
            onClick={() => handleReject(row.id)} 
            disabled={actionId !== null}
            style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
          >
            Reject
          </Button>
        </div>
      ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>,
    },
  ];

  const TARGET_CURRENCIES = currencies.length > 0 ? currencies.map(c => ({
    code: c.value,
    symbol: c.value === 'NGN' ? '₦' : c.value === 'GHS' ? 'GH₵' : c.value === 'KES' ? 'KSh' : c.value === 'ZAR' ? 'R' : c.value === 'EUR' ? '€' : c.value === 'GBP' ? '£' : c.value === 'TZS' ? 'TSh' : c.value === 'UGX' ? 'USh' : c.value === 'RWF' ? 'RF' : c.value === 'ZMW' ? 'ZK' : c.value === 'XOF' ? 'CFA' : '$',
    label: c.label.split(' - ')[1] || c.label
  })) : [
    { code: 'NGN', symbol: '₦', label: 'Nigeria' },
    { code: 'GHS', symbol: 'GH₵', label: 'Ghana' },
    { code: 'KES', symbol: 'KSh', label: 'Kenya' },
    { code: 'ZAR', symbol: 'R', label: 'South Africa' },
    { code: 'TZS', symbol: 'TSh', label: 'Tanzania' },
    { code: 'UGX', symbol: 'USh', label: 'Uganda' },
    { code: 'RWF', symbol: 'RF', label: 'Rwanda' },
    { code: 'ZMW', symbol: 'ZK', label: 'Zambia' },
    { code: 'XOF', symbol: 'CFA', label: 'West CFA' },
    { code: 'EUR', symbol: '€', label: 'Euro' },
    { code: 'GBP', symbol: '£', label: 'GBP' }
  ];

  const filtered = withdrawals.filter((w) =>
    !search || 
    (w.user && w.user.toLowerCase().includes(search.toLowerCase())) || 
    (w.address && w.address.includes(search))
  );

  return (
    <AdminLayout>
      <PageHeader title="Withdrawal Requests" subtitle="Review and approve withdrawal requests before payout." />
      
      <div style={{ marginBottom: '1.5rem' }}>
        <Card style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.50rem' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, fontWeight: 600 }}>USD Exchange Rates (Reference for Fiat/Bank payouts)</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem', marginTop: '0.25rem' }}>
            {TARGET_CURRENCIES.map(curr => {
              const rate = exchangeRates[curr.code] || 1;
              return (
                <div key={curr.code} style={{ padding: '0.4rem 0.5rem', background: 'var(--bg-darker)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{curr.code} ({curr.label})</div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent-green)' }}>
                    {loadingRates ? '...' : `${curr.symbol}${rate.toFixed(2)}`}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by user or address..." style={{ flex: 1 }} />
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <input 
              type="checkbox" 
              checked={showFullAddresses} 
              onChange={toggleShowAddresses} 
              style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
            />
            Show full crypto addresses
          </label>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', justifyContent: 'center', alignItems: 'center', minHeight: '200px', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>
            <div className="spinner" style={{ width: '32px', height: '32px', border: '3px solid var(--border)', borderTop: '3px solid var(--secondary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span>Loading withdrawals...</span>
          </div>
        ) : (
          <Table columns={columns} rows={filtered} emptyMessage="No withdrawal requests." />
        )}
      </Card>
    </AdminLayout>
  );
}
