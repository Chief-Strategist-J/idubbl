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
  referralCode: '',
  referrals: [],

  fetchReferralsData: async () => {
    const currentUserId = useAuthStore.getState().user?.id;
    if (!currentUserId) return;
    try {
      const res = await fetch(`${BASE_URL}/referrals`, {
        headers: { 'x-user-id': currentUserId },
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success) {
        set({
          referralCode: json.referralCode || '',
          referrals: json.referrals || []
        });
      }
    } catch (error) {
      console.error('Error fetching referrals data:', error);
    }
  },

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

      const localKey = `idubbl_wallet_${currentUserId}`;
      const localData = JSON.parse(localStorage.getItem(localKey) || '{}');

      // Server is the single source of truth. Safeguard all values so they are never negative.
      const depositBalance = Math.max(0, balance.depositBalance !== undefined ? balance.depositBalance : (localData.depositBalance ?? 1000));
      const winningsBalance = Math.max(0, balance.winningsBalance !== undefined ? balance.winningsBalance : (localData.winningsBalance ?? 0));
      const lockedBalance = Math.max(0, balance.lockedBalance !== undefined ? balance.lockedBalance : (localData.lockedBalance ?? 0));
      const pendingWithdrawals = Math.max(0, balance.pendingWithdrawals !== undefined ? balance.pendingWithdrawals : (localData.pendingWithdrawals ?? 0));
      const idubbuBalance = Math.max(0, balance.idubbuBalance !== undefined ? balance.idubbuBalance : (localData.idubbuBalance ?? 1000000));
      const idubbuRate = balance.idubbuRate || 1000;

      const localTxs = localData.transactions ?? [];
      const mergedTx = [
        ...transactions,
        ...localTxs.filter(lt => !transactions.some(mt => mt._id === lt._id || mt.refId === lt.refId))
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const syncedState = { depositBalance, winningsBalance, lockedBalance, idubbuBalance, pendingWithdrawals, transactions: mergedTx };
      localStorage.setItem(localKey, JSON.stringify(syncedState));

      set({
        depositBalance,
        winningsBalance,
        idubbuBalance,
        idubbuRate,
        availableBalance: depositBalance + winningsBalance,
        lockedBalance,
        pendingWithdrawals,
        transactions: mergedTx,
        deposits: mergedTx.filter(t => t.type === 'deposit'),
        withdrawals: mergedTx.filter(t => t.type === 'withdrawal'),
        loading: false
      });
    } catch (error) {
      console.error('Failed to load wallet data, loading from localStorage fallback:', error);
      const localKey = `idubbl_wallet_${currentUserId}`;
      const localData = JSON.parse(localStorage.getItem(localKey) || '{}');
      const depositBalance = localData.depositBalance ?? 1000;
      const winningsBalance = localData.winningsBalance ?? 0;
      const txs = localData.transactions || [];
      set({
        depositBalance,
        winningsBalance,
        lockedBalance: localData.lockedBalance ?? 0,
        pendingWithdrawals: localData.pendingWithdrawals ?? 0,
        idubbuBalance: localData.idubbuBalance ?? 1000000,
        idubbuRate: 1000,
        availableBalance: depositBalance + winningsBalance,
        transactions: txs,
        deposits: txs.filter(t => t.type === 'deposit'),
        withdrawals: txs.filter(t => t.type === 'withdrawal'),
        loading: false
      });
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
      set({ deposits: json.success ? (json.data || []) : get().deposits, loading: false });
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
      set({ withdrawals: json.success ? (json.data || []) : get().withdrawals, loading: false });
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
      set({ adminUsers: json.success ? (json.data || []) : get().adminUsers, loading: false });
    } catch (error) {
      console.error('Error fetching admin users:', error);
      set({ loading: false });
    }
  },

  // SRP: reserve entry fee locally + persist to backend
  reserveForMatch: async (amount, matchMeta = {}) => {
    const { availableBalance, depositBalance, winningsBalance, lockedBalance, idubbuBalance, idubbuRate, pendingWithdrawals } = get();
    if (availableBalance < amount) return false;
    const fromDeposit = Math.min(depositBalance, amount);
    const nextDeposit = depositBalance - fromDeposit;
    const nextWinnings = winningsBalance - (amount - fromDeposit);
    const nextLocked = lockedBalance + amount;
    const nextIdubbu = (idubbuBalance || 0) - amount * (idubbuRate || 1000);
    set({
      depositBalance: nextDeposit,
      winningsBalance: nextWinnings,
      availableBalance: availableBalance - amount,
      lockedBalance: nextLocked,
      idubbuBalance: nextIdubbu,
    });
    const userId = useAuthStore.getState().user?.id;
    if (userId) {
      localStorage.setItem(`idubbl_wallet_${userId}`, JSON.stringify({
        depositBalance: nextDeposit,
        winningsBalance: nextWinnings,
        lockedBalance: nextLocked,
        idubbuBalance: nextIdubbu,
        pendingWithdrawals
      }));
      // Persist to backend
      try {
        await fetch(`${BASE_URL}/match/join-deduct`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
          credentials: 'include',
          body: JSON.stringify({ entryFee: amount, ...matchMeta }),
        });
      } catch (e) { console.error('Failed to persist match join:', e); }
    }
    return true;
  },

  // SRP: release locked fee (on match cancel / error only)
  releaseReservation: (amount) => {
    const { availableBalance, depositBalance, winningsBalance, lockedBalance, idubbuBalance, idubbuRate, pendingWithdrawals } = get();
    const nextDeposit = depositBalance + amount;
    const nextLocked = Math.max(0, lockedBalance - amount);
    const nextIdubbu = (idubbuBalance || 0) + amount * (idubbuRate || 1000);
    set({
      depositBalance: nextDeposit,
      availableBalance: availableBalance + amount,
      lockedBalance: nextLocked,
      idubbuBalance: nextIdubbu,
    });
    const userId = useAuthStore.getState().user?.id;
    if (userId) {
      localStorage.setItem(`idubbl_wallet_${userId}`, JSON.stringify({
        depositBalance: nextDeposit,
        winningsBalance,
        lockedBalance: nextLocked,
        idubbuBalance: nextIdubbu,
        pendingWithdrawals
      }));
    }
  },

  // SRP: settle match result — credit winner, record loss, or refund tie, always persists to backend
  creditWinnings: async (prize, matchMeta = {}) => {
    const { winningsBalance, availableBalance, lockedBalance, idubbuBalance, idubbuRate, depositBalance, pendingWithdrawals } = get();
    const entryFee = matchMeta.entryFee || 0;
    const isWinner = prize > 0;
    const isTie = matchMeta.isTie || false;
    const nextLocked = Math.max(0, lockedBalance - entryFee);

    let nextWinnings = winningsBalance;
    let nextDeposit = depositBalance;
    let nextIdubbu = idubbuBalance || 0;
    let nextAvailable = availableBalance;

    if (isWinner) {
      nextWinnings = winningsBalance + prize;
      nextIdubbu = (idubbuBalance || 0) + prize * (idubbuRate || 1000);
      nextAvailable = availableBalance + prize;
      set({
        winningsBalance: nextWinnings,
        availableBalance: nextAvailable,
        lockedBalance: nextLocked,
        idubbuBalance: nextIdubbu,
      });
    } else if (isTie) {
      nextDeposit = depositBalance + entryFee;
      nextIdubbu = (idubbuBalance || 0) + entryFee * (idubbuRate || 1000);
      nextAvailable = availableBalance + entryFee;
      set({
        depositBalance: nextDeposit,
        availableBalance: nextAvailable,
        lockedBalance: nextLocked,
        idubbuBalance: nextIdubbu,
      });
    } else {
      nextAvailable = Math.max(0, availableBalance - entryFee);
      set({
        lockedBalance: nextLocked,
        availableBalance: nextAvailable,
      });
    }

    const userId = useAuthStore.getState().user?.id;
    if (userId) {
      localStorage.setItem(`idubbl_wallet_${userId}`, JSON.stringify({
        depositBalance: nextDeposit,
        winningsBalance: nextWinnings,
        lockedBalance: nextLocked,
        idubbuBalance: nextIdubbu,
        pendingWithdrawals
      }));
      // Persist to backend
      try {
        await fetch(`${BASE_URL}/match/settle`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
          credentials: 'include',
          body: JSON.stringify({ isWinner, isTie, prize, ...matchMeta, tier: matchMeta.tierName || matchMeta.tier }),
        });
        // Refresh real balance from server
        await get().fetchWalletData(userId);
      } catch (e) { console.error('Failed to persist match settle:', e); }
    }
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
        const { winningsBalance, pendingWithdrawals, depositBalance, idubbuBalance, lockedBalance } = get();
        const nextWinnings = Math.max(0, (winningsBalance || 0) - data.amount);
        const nextPending = (pendingWithdrawals || 0) + data.amount;
        set({
          winningsBalance: nextWinnings,
          pendingWithdrawals: nextPending,
          availableBalance: (depositBalance || 0) + nextWinnings
        });
        localStorage.setItem(`idubbl_wallet_${currentUserId}`, JSON.stringify({
          depositBalance,
          winningsBalance: nextWinnings,
          lockedBalance,
          idubbuBalance,
          pendingWithdrawals: nextPending
        }));
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
