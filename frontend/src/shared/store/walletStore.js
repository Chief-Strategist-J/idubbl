import { create } from 'zustand';
import useAuthStore from './authStore.js';

let apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
if (apiBase && !apiBase.startsWith('http://') && !apiBase.startsWith('https://')) {
  apiBase = `https://${apiBase}`;
}
const BASE_URL = `${apiBase}/api/wallet`;

const useWalletStore = create((set, get) => ({
  availableBalance: 0,
  lockedBalance: 0,
  pendingWithdrawals: 0,
  transactions: [],
  deposits: [],
  withdrawals: [],
  loading: false,

  // Fetch balance and transactions from the backend API
  fetchWalletData: async (userId) => {
    const currentUserId = userId || useAuthStore.getState().user?.id;
    if (!currentUserId) return;
    set({ loading: true });
    try {
      // Fetch Balance
      const balRes = await fetch(`${BASE_URL}/balance`, {
        headers: { 'x-user-id': currentUserId }
      });
      const balance = await balRes.json();

      // Fetch Transactions
      const txRes = await fetch(`${BASE_URL}/transactions`, {
        headers: { 'x-user-id': currentUserId }
      });
      const transactions = await txRes.json();

      // Separate deposits and withdrawals for compatibility with mock structure
      const deposits = transactions.filter(t => t.type === 'deposit');
      const withdrawals = transactions.filter(t => t.type === 'withdrawal');

      set({
        availableBalance: balance.availableBalance,
        lockedBalance: balance.lockedBalance,
        pendingWithdrawals: balance.pendingWithdrawals,
        transactions,
        deposits,
        withdrawals,
        loading: false
      });
    } catch (error) {
      console.error('Failed to load wallet data:', error);
      set({ loading: false });
    }
  },

  reserveForMatch: (amount) => {
    const { availableBalance, lockedBalance } = get();
    if (availableBalance < amount) return false;
    set({ availableBalance: availableBalance - amount, lockedBalance: lockedBalance + amount });
    return true;
  },

  releaseReservation: (amount) => {
    const { availableBalance, lockedBalance } = get();
    set({ availableBalance: availableBalance + amount, lockedBalance: Math.max(0, lockedBalance - amount) });
  },

  creditWinnings: (amount) => {
    const { availableBalance, lockedBalance } = get();
    set({ availableBalance: availableBalance + amount, lockedBalance: Math.max(0, lockedBalance - (amount / 2)) });
  },

  submitDeposit: async (data, userId) => {
    const currentUserId = userId || useAuthStore.getState().user?.id;
    if (!currentUserId) return { success: false, error: 'User session not found' };
    try {
      const response = await fetch(`${BASE_URL}/deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUserId
        },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        await get().fetchWalletData(currentUserId);
        return { success: true };
      }
      const errData = await response.json();
      return { success: false, error: errData.error };
    } catch (error) {
      console.error('Deposit submission error:', error);
      return { success: false, error: 'Network error submitting deposit' };
    }
  },

  submitWithdrawal: async (data, userId) => {
    const currentUserId = userId || useAuthStore.getState().user?.id;
    if (!currentUserId) return { success: false, error: 'User session not found' };
    try {
      const response = await fetch(`${BASE_URL}/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUserId
        },
        body: JSON.stringify({
          amount: data.amount,
          address: data.address,
          network: data.network,
        }),
      });

      if (response.ok) {
        await get().fetchWalletData(currentUserId);
        return { success: true };
      }
      const errData = await response.json();
      return { success: false, error: errData.error };
    } catch (error) {
      console.error('Withdrawal submission error:', error);
      return { success: false, error: 'Network error submitting withdrawal' };
    }
  },

  approveDeposit: async (depositId, userId) => {
    const currentUserId = userId || useAuthStore.getState().user?.id;
    try {
      const response = await fetch(`${BASE_URL}/admin/deposit/${depositId}/approve`, {
        method: 'POST'
      });
      if (response.ok) {
        await get().fetchWalletData(currentUserId);
      }
    } catch (error) {
      console.error('Error approving deposit:', error);
    }
  },

  rejectDeposit: async (depositId, userId) => {
    const currentUserId = userId || useAuthStore.getState().user?.id;
    try {
      const response = await fetch(`${BASE_URL}/admin/deposit/${depositId}/reject`, {
        method: 'POST'
      });
      if (response.ok) {
        await get().fetchWalletData(currentUserId);
      }
    } catch (error) {
      console.error('Error rejecting deposit:', error);
    }
  },

  approveWithdrawal: async (withdrawalId, userId) => {
    const currentUserId = userId || useAuthStore.getState().user?.id;
    try {
      const response = await fetch(`${BASE_URL}/admin/withdraw/${withdrawalId}/approve`, {
        method: 'POST'
      });
      if (response.ok) {
        await get().fetchWalletData(currentUserId);
      }
    } catch (error) {
      console.error('Error approving withdrawal:', error);
    }
  },

  rejectWithdrawal: async (withdrawalId, userId) => {
    const currentUserId = userId || useAuthStore.getState().user?.id;
    try {
      const response = await fetch(`${BASE_URL}/admin/withdraw/${withdrawalId}/reject`, {
        method: 'POST'
      });
      if (response.ok) {
        await get().fetchWalletData(currentUserId);
      }
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
    }
  },
}));

export default useWalletStore;
