import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './shared/store/authStore.js';

import LandingPage from './features/landing/LandingPage.jsx';
import LoginPage from './features/auth/LoginPage.jsx';
import SignupPage from './features/auth/SignupPage.jsx';
import ForgotPasswordPage from './features/auth/ForgotPasswordPage.jsx';
import ResetPasswordPage from './features/auth/ResetPasswordPage.jsx';
import DashboardPage from './features/dashboard/DashboardPage.jsx';
import DepositPage from './features/deposit/DepositPage.jsx';
import LobbyPage from './features/lobby/LobbyPage.jsx';
import QueuePage from './features/queue/QueuePage.jsx';
import GamePage from './features/game/GamePage.jsx';
import ResultPage from './features/result/ResultPage.jsx';
import WithdrawPage from './features/withdraw/WithdrawPage.jsx';
import TransactionsPage from './features/transactions/TransactionsPage.jsx';
import AdminDashboardHome from './features/admin/AdminDashboardHome.jsx';
import AdminDepositsPage from './features/admin/features/deposits/AdminDepositsPage.jsx';
import AdminWithdrawalsPage from './features/admin/features/withdrawals/AdminWithdrawalsPage.jsx';
import AdminMatchesPage from './features/admin/features/matches/AdminMatchesPage.jsx';
import AdminUsersPage from './features/admin/features/users/AdminUsersPage.jsx';
import AdminTiersPage from './features/admin/features/tiers/AdminTiersPage.jsx';
import AdminLedgerPage from './features/admin/features/ledger/AdminLedgerPage.jsx';
import AdminAuditPage from './features/admin/features/audit/AdminAuditPage.jsx';

function ProtectedRoute({ children }) {
  const { isAuthenticated, sessionChecked } = useAuthStore();
  if (!sessionChecked) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', background: 'var(--bg-darker)' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid var(--border)', borderTop: '4px solid var(--secondary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <span>Loading session...</span>
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { isAuthenticated, user, sessionChecked } = useAuthStore();
  if (!sessionChecked) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', background: 'var(--bg-darker)' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid var(--border)', borderTop: '4px solid var(--secondary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <span>Verifying admin authorization...</span>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'admin') return children;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  const { checkSession } = useAuthStore();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/deposit" element={<ProtectedRoute><DepositPage /></ProtectedRoute>} />
        <Route path="/lobby" element={<ProtectedRoute><LobbyPage /></ProtectedRoute>} />
        <Route path="/queue/:tierId" element={<ProtectedRoute><QueuePage /></ProtectedRoute>} />
        <Route path="/game/:matchId" element={<ProtectedRoute><GamePage /></ProtectedRoute>} />
        <Route path="/result" element={<ProtectedRoute><ResultPage /></ProtectedRoute>} />
        <Route path="/withdraw" element={<ProtectedRoute><WithdrawPage /></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute><TransactionsPage /></ProtectedRoute>} />

        <Route path="/admin" element={<AdminRoute><AdminDashboardHome /></AdminRoute>} />
        <Route path="/admin/deposits" element={<AdminRoute><AdminDepositsPage /></AdminRoute>} />
        <Route path="/admin/withdrawals" element={<AdminRoute><AdminWithdrawalsPage /></AdminRoute>} />
        <Route path="/admin/matches" element={<AdminRoute><AdminMatchesPage /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
        <Route path="/admin/tiers" element={<AdminRoute><AdminTiersPage /></AdminRoute>} />
        <Route path="/admin/ledger" element={<AdminRoute><AdminLedgerPage /></AdminRoute>} />
        <Route path="/admin/audit" element={<AdminRoute><AdminAuditPage /></AdminRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
