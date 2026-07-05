import { useState, useEffect } from 'react';
import AdminLayout from '../../../../shared/components/layout/AdminLayout.jsx';
import { PageHeader, Card, Table, Badge, Button, SearchBar } from '../../../../shared/components/ui/index.js';
import useWalletStore from '../../../../shared/store/walletStore.js';

export default function AdminUsersPage() {
  const { adminUsers, fetchAdminUsers, loading, manualTopup, currencies, fetchCurrencies } = useWalletStore();
  const [search, setSearch] = useState('');
  const [localUsers, setLocalUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [topupAmount, setTopupAmount] = useState('');
  const [balanceType, setBalanceType] = useState('depositBalance');
  const [topupMethod, setTopupMethod] = useState('manual'); // 'manual' | 'crypto' | 'flutterwave'
  const [topupCurrency, setTopupCurrency] = useState('USD');
  const [exchangeRates, setExchangeRates] = useState({});
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [topupLoading, setTopupLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchAdminUsers();
    fetchCurrencies();
  }, [fetchAdminUsers, fetchCurrencies]);

  useEffect(() => {
    fetch('https://api.exchangerate-api.com/v4/latest/USD')
      .then(res => res.json())
      .then(data => {
        if (data && data.rates) {
          setExchangeRates(data.rates);
        }
      })
      .catch(err => console.error('Error fetching exchange rates:', err));
  }, []);

  useEffect(() => {
    setLocalUsers(adminUsers);
  }, [adminUsers]);

  const toggleSuspend = (id) => {
    setLocalUsers((prev) => 
      prev.map((u) => {
        const uId = u.id || u._id;
        if (uId === id) {
          const newStatus = (u.status || 'active') === 'active' ? 'suspended' : 'active';
          return { ...u, status: newStatus };
        }
        return u;
      })
    );
  };

  const handleTopupSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (!topupAmount || isNaN(Number(topupAmount)) || Number(topupAmount) <= 0) {
      setErrorMsg('Please enter a valid positive amount.');
      return;
    }

    setTopupLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const rate = exchangeRates[topupCurrency] || 1;
    const usdAmount = Number(topupAmount) / rate;

    if (topupMethod === 'flutterwave') {
      try {
        const apiBase = import.meta.env.VITE_API_URL || 'https://idubbl-backend.onrender.com';
        const targetUserId = selectedUser.id || selectedUser._id;
        const res = await fetch(`${apiBase}/api/payment/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': targetUserId
          },
          body: JSON.stringify({
            amount: Number(topupAmount),
            currency: topupCurrency,
            usdAmount: Number(usdAmount.toFixed(4)),
            gateway: 'flutterwave',
            customer: {
              email: selectedUser.email,
              name: selectedUser.name || selectedUser.email?.split('@')[0] || 'Player',
              phone: selectedUser.phone || ''
            },
            description: `Admin Topup for ${selectedUser.email} - ${topupCurrency} ${topupAmount}`
          })
        });
        const data = await res.json();
        setTopupLoading(false);
        if (res.ok && data.success && data.paymentLink) {
          setSuccessMsg('Redirecting to Flutterwave checkout...');
          setTimeout(() => {
            window.location.href = data.paymentLink;
          }, 1000);
        } else {
          setErrorMsg(data.error || 'Failed to create Flutterwave checkout session.');
        }
      } catch (err) {
        setTopupLoading(false);
        setErrorMsg('Network error initializing Flutterwave checkout.');
      }
      return;
    }

    const res = await manualTopup(selectedUser.id || selectedUser._id, {
      amount: Number(topupAmount),
      balanceType,
      reference,
      notes,
      method: topupMethod,
      currency: topupCurrency,
      usdAmount: Number(usdAmount.toFixed(4))
    });

    setTopupLoading(false);
    if (res.success) {
      setSuccessMsg(res.message || 'Account successfully topped up!');
      setTopupAmount('');
      setReference('');
      setNotes('');
      setTopupMethod('manual');
      setTopupCurrency('USD');
      // Delay closing modal slightly so user sees success message
      setTimeout(() => {
        setSelectedUser(null);
        setSuccessMsg('');
      }, 1500);
    } else {
      setErrorMsg(res.error || 'Failed to complete top up.');
    }
  };

  const COLUMNS = [
    { key: 'id', label: 'ID', render: (v, row) => <code style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{(v || row._id || '').substring(0, 8)}</code> },
    { key: 'name', label: 'Name', render: (_, row) => row.name || `${row.firstName || ''} ${row.lastName || ''}`.trim() || 'No Name' },
    { key: 'email', label: 'Email' },
    { key: 'referralCode', label: 'Ref Code', render: (v) => v ? <strong style={{ color: 'var(--primary)', fontFamily: 'var(--font-display)', fontSize: '0.85rem' }}>{v}</strong> : '—' },
    { key: 'referredBy', label: 'Referred By', render: (v) => v ? <code style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>{v}</code> : '—' },
    {
      key: 'referredUsersList',
      label: 'Referrals (Total / Funded)',
      render: (v) => {
        const list = v || [];
        const fundedCount = list.filter(r => r.funded).length;
        return (
          <span style={{ fontSize: '0.85rem' }}>
            <strong>{list.length}</strong> referred / <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>{fundedCount}</span> funded
          </span>
        );
      }
    },
    { 
      key: 'balances', 
      label: 'Balances (USDT)', 
      render: (v) => v ? (
        <div style={{ fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--accent-green)' }}>{v.availableBalance || 0}</span> avail / <span style={{ color: 'var(--text-muted)' }}>{v.lockedBalance || 0}</span> lock / <span style={{ color: 'var(--accent-warning)' }}>{v.pendingWithdrawals || 0}</span> pend
        </div>
      ) : '—' 
    },
    { key: 'role', label: 'Role', render: (v) => <Badge status={v === 'admin' ? 'approved' : 'pending'} label={v} /> },
    { key: 'status', label: 'Status', render: (v) => <Badge status={v || 'active'} /> },
    { key: 'createdAt', label: 'Joined', render: (v) => new Date(v).toLocaleDateString() },
    {
      key: 'actions', label: 'Actions',
      render: (_, row) => {
        const status = row.status || 'active';
        return (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button variant="primary" onClick={() => setSelectedUser(row)} style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}>
              Top Up
            </Button>
            <Button variant={status === 'active' ? 'danger' : 'secondary'} onClick={() => toggleSuspend(row.id || row._id)} style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}>
              {status === 'active' ? 'Suspend' : 'Reactivate'}
            </Button>
          </div>
        );
      },
    },
  ];

  const filtered = localUsers.filter((u) => {
    const name = u.name || `${u.firstName || ''} ${u.lastName || ''}`;
    const email = u.email || '';
    return !search || `${name} ${email}`.toLowerCase().includes(search.toLowerCase());
  });

  const totalPersonalWallets = localUsers.filter(u => u.personalWallets && (u.personalWallets.tron || u.personalWallets.ethereum)).length;

  const CURRENCY_LIST = currencies && currencies.length > 0 ? currencies : [
    { value: 'USD', label: 'USD - US Dollar', flag: '🇺🇸' },
    { value: 'NGN', label: 'NGN - Nigerian Naira', flag: '🇳🇬' },
    { value: 'GHS', label: 'GHS - Ghanaian Cedi', flag: '🇬🇭' },
    { value: 'KES', label: 'KES - Kenyan Shilling', flag: '🇰🇪' },
    { value: 'ZAR', label: 'ZAR - South African Rand', flag: '🇿🇦' }
  ];

  return (
    <AdminLayout>
      <PageHeader title="Users" subtitle="Search, view, and manage player accounts." />
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <Card style={{ padding: '1rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 0.25rem 0' }}>Total Registered Users</p>
          <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>{localUsers.length}</h2>
        </Card>
        <Card style={{ padding: '1rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0 0 0.25rem 0' }}>Generated Crypto Wallets</p>
          <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-green)' }}>{totalPersonalWallets}</h2>
        </Card>
      </div>

      <Card>
        <div style={{ marginBottom: '1.5rem' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by name or email..." />
        </div>
        
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', justifyContent: 'center', alignItems: 'center', minHeight: '200px', color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>
            <div className="spinner" style={{ width: '32px', height: '32px', border: '3px solid var(--border)', borderTop: '3px solid var(--secondary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span>Loading users...</span>
          </div>
        ) : (
          <Table columns={COLUMNS} rows={filtered} emptyMessage="No users found." />
        )}
      </Card>

      {/* Manual Top-up Modal Dialog */}
      {selectedUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'var(--card-bg, #1a1a1a)', border: '1px solid var(--border, #333)', borderRadius: '12px', padding: '2rem', width: '90%', maxWidth: '500px', fontFamily: 'var(--font-sans, sans-serif)', color: 'var(--text, #fff)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '0.5rem', fontSize: '1.25rem', fontWeight: 700 }}>Manual Top Up</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary, #aaa)', marginBottom: '1.5rem' }}>
              Crediting account for: <strong>{selectedUser.name || selectedUser.email}</strong>
            </p>

            <form onSubmit={handleTopupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Method selector — always shown first */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Top Up Method</label>
                <select
                  value={topupMethod}
                  onChange={(e) => setTopupMethod(e.target.value)}
                  style={{ padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--input-bg, #222)', color: '#fff', fontSize: '1rem' }}
                >
                  <option value="manual">Manual Credit (Internal)</option>
                  <option value="crypto">USDT Crypto Deposit</option>
                  <option value="flutterwave">Flutterwave Checkout Deposit</option>
                </select>
              </div>

              {/* Amount — always shown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Amount {topupMethod !== 'flutterwave' ? `(${topupCurrency})` : '(USD)'}
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0.00"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  style={{ padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--input-bg, #222)', color: '#fff', fontSize: '1rem' }}
                />
              </div>

              {/* Flutterwave info banner — shown only for flutterwave */}
              {topupMethod === 'flutterwave' && (
                <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(100, 200, 255, 0.06)', border: '1px solid rgba(100, 200, 255, 0.2)', fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                  💳 This will open a <strong style={{ color: '#fff' }}>Flutterwave Checkout</strong> page for the user. The amount above will be charged in USD via card/bank. No extra fields needed.
                </div>
              )}

              {/* Fields only shown for manual / crypto */}
              {topupMethod !== 'flutterwave' && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Currency</label>
                    <select
                      value={topupCurrency}
                      onChange={(e) => setTopupCurrency(e.target.value)}
                      style={{ padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--input-bg, #222)', color: '#fff', fontSize: '1rem' }}
                    >
                      {CURRENCY_LIST.map((curr) => (
                        <option key={curr.value} value={curr.value}>
                          {curr.flag} {curr.label || curr.value}
                        </option>
                      ))}
                    </select>
                  </div>

                  {topupCurrency !== 'USD' && topupCurrency !== 'USDT' && (
                    <div style={{ padding: '0.75rem', borderRadius: '8px', border: '1px dashed var(--border)', backgroundColor: 'rgba(255, 255, 255, 0.02)', display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Live Exchange Rate:</span>
                        <strong style={{ color: '#fff' }}>1 USD ≈ {exchangeRates[topupCurrency] || '...'} {topupCurrency}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '0.25rem', marginTop: '0.25rem' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Estimated Credit:</span>
                        <strong style={{ color: 'var(--secondary)' }}>
                          {topupAmount && !isNaN(Number(topupAmount))
                            ? (Number(topupAmount) / (exchangeRates[topupCurrency] || 1)).toFixed(2)
                            : '0.00'}{' '}
                          USDT
                        </strong>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Balance Target</label>
                    <select
                      value={balanceType}
                      onChange={(e) => setBalanceType(e.target.value)}
                      style={{ padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--input-bg, #222)', color: '#fff', fontSize: '1rem' }}
                    >
                      <option value="depositBalance">Deposit Balance (e.g. Crypto Buy/Deposits)</option>
                      <option value="winningsBalance">Winnings Balance (e.g. Manual adjustments)</option>
                    </select>
                  </div>

                  {topupMethod === 'crypto' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Reference / Tx Hash</label>
                      <input
                        type="text"
                        placeholder="e.g. TRON transaction hash or payment reference"
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        style={{ padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--input-bg, #222)', color: '#fff', fontSize: '1rem' }}
                      />
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Admin Notes</label>
                    <textarea
                      placeholder="Reason for manual credit, e.g. 'Manually verified TRC20 deposit'"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      style={{ padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--border)', backgroundColor: 'var(--input-bg, #222)', color: '#fff', fontSize: '1rem', minHeight: '60px', resize: 'vertical' }}
                    />
                  </div>
                </>
              )}

              {errorMsg && <div style={{ color: 'var(--accent-danger, #ff4d4d)', fontSize: '0.875rem', fontWeight: 500 }}>{errorMsg}</div>}
              {successMsg && <div style={{ color: 'var(--accent-green, #4dff4d)', fontSize: '0.875rem', fontWeight: 500 }}>{successMsg}</div>}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                <Button type="button" variant="secondary" onClick={() => setSelectedUser(null)} disabled={topupLoading}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={topupLoading}>
                  {topupLoading ? 'Processing...' : topupMethod === 'flutterwave' ? 'Open Flutterwave' : 'Confirm Top Up'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
