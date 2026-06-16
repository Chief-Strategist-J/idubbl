import { create } from 'zustand';
import { MOCK_TRANSACTIONS, MOCK_DEPOSITS, MOCK_WITHDRAWALS } from '../mock/index.js';

const useWalletStore = create((set, get) => ({
  availableBalance: 500,
  lockedBalance: 5,
  pendingWithdrawals: 18,
  transactions: MOCK_TRANSACTIONS,
  deposits: MOCK_DEPOSITS,
  withdrawals: MOCK_WITHDRAWALS,

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

  submitDeposit: (data) => {
    const newDeposit = {
      id: `d${Date.now()}`,
      userId: 'u1',
      user: 'Alex Storm',
      ...data,
      status: 'pending',
      reviewedBy: null,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ deposits: [newDeposit, ...state.deposits] }));
    return { success: true };
  },

  submitWithdrawal: (data) => {
    const { availableBalance } = get();
    if (availableBalance < data.amount) return { success: false, error: 'Insufficient balance' };
    const newWithdrawal = {
      id: `w${Date.now()}`,
      userId: 'u1',
      user: 'Alex Storm',
      ...data,
      status: 'pending',
      reviewedBy: null,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      availableBalance: availableBalance - data.amount,
      pendingWithdrawals: state.pendingWithdrawals + data.amount,
      withdrawals: [newWithdrawal, ...state.withdrawals],
    }));
    return { success: true };
  },

  approveDeposit: (depositId) => {
    set((state) => {
      const deposit = state.deposits.find((d) => d.id === depositId);
      if (!deposit) return {};
      return {
        availableBalance: state.availableBalance + deposit.amount,
        deposits: state.deposits.map((d) =>
          d.id === depositId ? { ...d, status: 'approved', reviewedBy: 'admin1' } : d
        ),
      };
    });
  },

  rejectDeposit: (depositId) => {
    set((state) => ({
      deposits: state.deposits.map((d) =>
        d.id === depositId ? { ...d, status: 'rejected', reviewedBy: 'admin1' } : d
      ),
    }));
  },

  approveWithdrawal: (withdrawalId) => {
    set((state) => {
      const withdrawal = state.withdrawals.find((w) => w.id === withdrawalId);
      if (!withdrawal) return {};
      return {
        pendingWithdrawals: Math.max(0, state.pendingWithdrawals - withdrawal.amount),
        withdrawals: state.withdrawals.map((w) =>
          w.id === withdrawalId ? { ...w, status: 'approved', reviewedBy: 'admin1', paidAt: new Date().toISOString() } : w
        ),
      };
    });
  },

  rejectWithdrawal: (withdrawalId) => {
    set((state) => {
      const withdrawal = state.withdrawals.find((w) => w.id === withdrawalId);
      if (!withdrawal) return {};
      return {
        availableBalance: state.availableBalance + withdrawal.amount,
        pendingWithdrawals: Math.max(0, state.pendingWithdrawals - withdrawal.amount),
        withdrawals: state.withdrawals.map((w) =>
          w.id === withdrawalId ? { ...w, status: 'rejected', reviewedBy: 'admin1' } : w
        ),
      };
    });
  },
}));

export default useWalletStore;
