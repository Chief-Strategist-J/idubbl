import { create } from 'zustand';
import { MOCK_USERS } from '../mock/index.js';

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,

  login: (email, password) => {
    const found = MOCK_USERS.find((u) => u.email === email);
    if (found) {
      set({ user: found, isAuthenticated: true });
      return { success: true, role: found.role };
    }
    return { success: false, error: 'Invalid credentials' };
  },

  signup: (data) => {
    const newUser = {
      id: `u${Date.now()}`,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      status: 'active',
      role: 'player',
      createdAt: new Date().toISOString(),
    };
    set({ user: newUser, isAuthenticated: true });
    return { success: true };
  },

  logout: () => set({ user: null, isAuthenticated: false }),
}));

export default useAuthStore;
