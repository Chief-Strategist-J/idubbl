import { create } from 'zustand';
import useAuthStore from './authStore.js';

let apiBase = import.meta.env.VITE_API_URL || 'https://idubbl-backend.onrender.com';
if (apiBase && !apiBase.startsWith('http://') && !apiBase.startsWith('https://')) {
  apiBase = `https://${apiBase}`;
}
const BASE_URL = `${apiBase}/api/wallet`;
const ADMIN_BASE_URL = `${apiBase}/api/admin`;

const useWalletStore = create((set, get) => ({
  depositBalance: 0,
  winningsBalance: 0,
  availableBalance: 0,
  idubbuBalance: 0,
  idubbuRate: 1000,
  lockedBalance: 0,
  pendingWithdrawals: 0,
  transactions: [],
  deposits: [],
  withdrawals: [],
  adminUsers: [],
  platformRevenue: 0,
  totalFees: 0,
  loading: false,

  fetchWalletData: async (userId) => {
    const currentUserId = userId || useAuthStore.getState().user?.id;
    if (!currentUserId) return;
    set({ loading: true });
    try {
      const balRes = await fetch(`${BASE_URL}/balance`, {
        headers: { 'x-user-id': currentUserId },
        credentials: 'include'
      });
      const balJson = await balRes.json();
      const balance = balJson.success ? balJson.data : balJson;

      const txRes = await fetch(`${BASE_URL}/transactions`, {
        headers: { 'x-user-id': currentUserId },
        credentials: 'include'
      });
      const txJson = await txRes.json();
      const transactions = txJson.success ? (txJson.data || []) : (txJson || []);

      const deposits = transactions.filter(t => t.type === 'deposit');
      const withdrawals = transactions.filter(t => t.type === 'withdrawal');

      set({
        depositBalance: balance.depositBalance || 0,
        winningsBalance: balance.winningsBalance || 0,
        idubbuBalance: balance.idubbuBalance || 0,
        idubbuRate: balance.idubbuRate || 1000,
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

  fetchAdminDeposits: async () => {
    const currentUserId = useAuthStore.getState().user?.id;
    set({ loading: true });
    try {
      const res = await fetch(`${ADMIN_BASE_URL}/deposits`, {
        headers: currentUserId ? { 'x-user-id': currentUserId } : {},
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success) {
        set({ deposits: json.data || [], loading: false });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      console.error('Error fetching admin deposits:', error);
      set({ loading: false });
    }
  },

  fetchAdminWithdrawals: async () => {
    const currentUserId = useAuthStore.getState().user?.id;
    set({ loading: true });
    try {
      const res = await fetch(`${ADMIN_BASE_URL}/withdrawals`, {
        headers: currentUserId ? { 'x-user-id': currentUserId } : {},
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success) {
        set({ withdrawals: json.data || [], loading: false });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      console.error('Error fetching admin withdrawals:', error);
      set({ loading: false });
    }
  },

  fetchAdminLedger: async () => {
    const currentUserId = useAuthStore.getState().user?.id;
    set({ loading: true });
    try {
      const res = await fetch(`${ADMIN_BASE_URL}/ledger`, {
        headers: currentUserId ? { 'x-user-id': currentUserId } : {},
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success) {
        const data = json.data || {};
        set({
          transactions: data.logs || [],
          platformRevenue: data.platformRevenue || 0,
          totalFees: data.totalFees || 0,
          loading: false
        });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      console.error('Error fetching admin ledger:', error);
      set({ loading: false });
    }
  },

  fetchAdminUsers: async () => {
    const currentUserId = useAuthStore.getState().user?.id;
    set({ loading: true });
    try {
      const res = await fetch(`${ADMIN_BASE_URL}/users`, {
        headers: currentUserId ? { 'x-user-id': currentUserId } : {},
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success) {
        set({ adminUsers: json.data || [], loading: false });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      console.error('Error fetching admin users:', error);
      set({ loading: false });
    }
  },

  reserveForMatch: (amount) => {
    const { availableBalance, depositBalance, winningsBalance, lockedBalance } = get();
    if (availableBalance < amount) return false;
    
    let newDepositBalance = depositBalance;
    let newWinningsBalance = winningsBalance;
    
    if (depositBalance >= amount) {
      newDepositBalance = depositBalance - amount;
    } else {
      const remaining = amount - depositBalance;
      newDepositBalance = 0;
      newWinningsBalance = winningsBalance - remaining;
    }

    set({ 
      depositBalance: newDepositBalance,
      winningsBalance: newWinningsBalance,
      availableBalance: availableBalance - amount, 
      lockedBalance: lockedBalance + amount 
    });
    return true;
  },

  releaseReservation: (amount) => {
    const { availableBalance, depositBalance, lockedBalance } = get();
    set({ 
      depositBalance: depositBalance + amount,
      availableBalance: availableBalance + amount, 
      lockedBalance: Math.max(0, lockedBalance - amount) 
    });
  },

  creditWinnings: (amount) => {
    const { availableBalance, winningsBalance, lockedBalance } = get();
    set({ 
      winningsBalance: winningsBalance + amount,
      availableBalance: availableBalance + amount, 
      lockedBalance: Math.max(0, lockedBalance - (amount / 2)) 
    });
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
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        await get().fetchWalletData(currentUserId);
        return { success: true };
      }
      const errData = await response.json();
      return { success: false, error: errData.message || errData.error };
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
        credentials: 'include',
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
      return { success: false, error: errData.message || errData.error };
    } catch (error) {
      console.error('Withdrawal submission error:', error);
      return { success: false, error: 'Network error submitting withdrawal' };
    }
  },

  approveDeposit: async (depositId, userId) => {
    const currentUserId = userId || useAuthStore.getState().user?.id;
    try {
      const response = await fetch(`${BASE_URL}/admin/deposit/${depositId}/approve`, {
        method: 'POST',
        headers: currentUserId ? { 'x-user-id': currentUserId } : {},
        credentials: 'include'
      });
      if (response.ok) {
        if (useAuthStore.getState().user?.role === 'admin') {
          await get().fetchAdminDeposits();
        } else {
          await get().fetchWalletData(currentUserId);
        }
      }
    } catch (error) {
      console.error('Error approving deposit:', error);
    }
  },

  rejectDeposit: async (depositId, userId) => {
    const currentUserId = userId || useAuthStore.getState().user?.id;
    try {
      const response = await fetch(`${BASE_URL}/admin/deposit/${depositId}/reject`, {
        method: 'POST',
        headers: currentUserId ? { 'x-user-id': currentUserId } : {},
        credentials: 'include'
      });
      if (response.ok) {
        if (useAuthStore.getState().user?.role === 'admin') {
          await get().fetchAdminDeposits();
        } else {
          await get().fetchWalletData(currentUserId);
        }
      }
    } catch (error) {
      console.error('Error rejecting deposit:', error);
    }
  },

  approveWithdrawal: async (withdrawalId, userId) => {
    const currentUserId = userId || useAuthStore.getState().user?.id;
    try {
      const response = await fetch(`${BASE_URL}/admin/withdraw/${withdrawalId}/approve`, {
        method: 'POST',
        headers: currentUserId ? { 'x-user-id': currentUserId } : {},
        credentials: 'include'
      });
      if (response.ok) {
        if (useAuthStore.getState().user?.role === 'admin') {
          await get().fetchAdminWithdrawals();
        } else {
          await get().fetchWalletData(currentUserId);
        }
      }
    } catch (error) {
      console.error('Error approving withdrawal:', error);
    }
  },

  rejectWithdrawal: async (withdrawalId, userId) => {
    const currentUserId = userId || useAuthStore.getState().user?.id;
    try {
      const response = await fetch(`${BASE_URL}/admin/withdraw/${withdrawalId}/reject`, {
        method: 'POST',
        headers: currentUserId ? { 'x-user-id': currentUserId } : {},
        credentials: 'include'
      });
      if (response.ok) {
        if (useAuthStore.getState().user?.role === 'admin') {
          await get().fetchAdminWithdrawals();
        } else {
          await get().fetchWalletData(currentUserId);
        }
      }
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
    }
  },
}));

export default useWalletStore;
