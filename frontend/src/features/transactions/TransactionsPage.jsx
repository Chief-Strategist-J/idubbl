import React, { useState, useEffect } from 'react';
import AppLayout from '../../shared/components/layout/AppLayout.jsx';
import { PageHeader, Card, Table, Badge, SearchBar } from '../../shared/components/ui/index.js';
import useWalletStore from '../../shared/store/walletStore.js';
import useAuthStore from '../../shared/store/authStore.js';

const TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'deposit', label: 'Deposits' },
  { value: 'winnings', label: 'Winnings' },
  { value: 'match_reserve', label: 'Match Reserve' },
  { value: 'match_loss', label: 'Match Loss' },
  { value: 'withdrawal', label: 'Withdrawals' },
  { value: 'refund', label: 'Refunds' },
];

const COLUMNS = [
  { key: 'refId', label: 'Ref ID', render: (v, row) => {
      const hash = row.txHash || row.payoutTxHash || v;
      const isMock = !hash || hash.startsWith('test_') || hash.startsWith('mock_') || hash.startsWith('simulated_') || hash === '12';
      
      const apiBase = import.meta.env.VITE_API_URL || 'https://idubbl-backend.onrender.com';
      const isMainnet = apiBase.includes('idubbl-backend.onrender.com');
      const isTron = (row.network || '').toUpperCase().includes('TRON') || (row.network || '').toUpperCase().includes('TRC20');
      
      const tronExplorer = isMainnet ? 'https://tronscan.org' : 'https://shasta.tronscan.org';
      const ethExplorer = isMainnet ? 'https://etherscan.io' : 'https://sepolia.etherscan.io';
      
      const explorerUrl = isMock ? null : (isTron ? `${tronExplorer}/#/transaction/${hash}` : `${ethExplorer}/tx/${hash}`);
      
      const label = v || row.txHash || (row._id ? row._id.toString().substring(0, 10) : '—');
      
      if (hash && explorerUrl) {
        return (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', textDecoration: 'underline', fontFamily: 'monospace' }}
          >
            {label}
          </a>
        );
      }
      return <code style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{label}</code>;
  }},
  { key: 'description', label: 'Description', render: (v, row) => v || row.note || `${row.type ? row.type.charAt(0).toUpperCase() + row.type.slice(1) : 'Transaction'} (${row.method || 'Platform'})` },
  { key: 'type', label: 'Type', render: (v) => <span style={{ textTransform: 'capitalize', color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem' }}>{v ? v.replace('_', ' ') : '—'}</span> },
  { key: 'amount', label: 'Amount', render: (v, row) => {
      const isNegative = row.type === 'withdrawal' || row.type === 'loss' || row.type === 'match_loss' || row.type === 'match_entry' || row.type === 'match_reserve';
      const color = isNegative ? 'var(--accent-red)' : 'var(--accent-green)';
      const prefix = isNegative ? '-' : '+';
      return <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color }}>{prefix}{v || 0} USDT</span>;
  }},
  { key: 'status', label: 'Status', render: (v) => <Badge status={v} /> },
  { key: 'date', label: 'Date', render: (v, row) => new Date(v || row.createdAt).toLocaleString() },
];

export default function TransactionsPage() {
  const { fetchWalletData, transactions } = useWalletStore();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetchWalletData(user.id);
    }
  }, [user?.id, fetchWalletData]);

  const filtered = transactions.filter((t) => {
    const refIdStr = t.refId || t.txHash || (t._id ? t._id.toString() : '');
    const descStr = t.description || t.note || `${t.type} (${t.method || 'Platform'})`;
    const matchesSearch = !search || refIdStr.toLowerCase().includes(search.toLowerCase()) || descStr.toLowerCase().includes(search.toLowerCase());
    const matchesType = !typeFilter || t.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <AppLayout>
      <PageHeader title="Transaction History" subtitle="All wallet activity is recorded here." />

      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          <SearchBar value={search} onChange={setSearch} placeholder="Search by ref ID or description..." style={{ width: '100%' }} />
          
          {/* Categories Horizontal Scroll */}
          <div 
            className="hide-scrollbar" 
            style={{ 
              display: 'flex', 
              gap: '0.5rem', 
              overflowX: 'auto', 
              paddingBottom: '0.25rem',
              alignItems: 'center'
            }}
          >
            {TYPE_OPTIONS.map((opt) => {
              const isActive = typeFilter === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setTypeFilter(opt.value)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    border: '1px solid',
                    borderColor: isActive ? 'var(--primary)' : 'var(--border)',
                    background: isActive ? 'rgba(20, 241, 149, 0.15)' : 'var(--bg-darker)',
                    color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = 'var(--text-secondary)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <Table columns={COLUMNS} rows={filtered} emptyMessage="No transactions match your filters." />
      </Card>
    </AppLayout>
  );
}
