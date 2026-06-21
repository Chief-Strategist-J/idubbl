import { create } from 'zustand';

let apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
if (apiBase && !apiBase.startsWith('http://') && !apiBase.startsWith('https://')) {
  apiBase = `https://${apiBase}`;
}
const AUTH_API = `${apiBase}/api/auth`;

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  loading: false,

  checkSession: async () => {
    try {
      const res = await fetch(`${AUTH_API}/get-session`, {
        headers: {
          'Accept': 'application/json'
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.user) {
          set({ user: data.user, isAuthenticated: true });
          return;
        }
      }
      set({ user: null, isAuthenticated: false });
    } catch (err) {
      console.error('Check session error:', err);
      set({ user: null, isAuthenticated: false });
    }
  },

  login: async (email, password) => {
    try {
      const res = await fetch(`${AUTH_API}/sign-in/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      if (res.ok && data.user) {
        set({ user: data.user, isAuthenticated: true });
        return { success: true, role: data.user.role || 'player' };
      }
      return { success: false, error: data.message || 'Invalid credentials' };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: 'Network error during login' };
    }
  },

  signup: async (data) => {
    try {
      const name = `${data.firstName} ${data.lastName}`.trim();
      const res = await fetch(`${AUTH_API}/sign-up/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          name: name,
        })
      });
      
      const resData = await res.json();
      if (res.ok && resData.user) {
        set({ user: resData.user, isAuthenticated: true });
        return { success: true };
      }
      return { success: false, error: resData.message || 'Failed to sign up' };
    } catch (err) {
      console.error('Signup error:', err);
      return { success: false, error: 'Network error during signup' };
    }
  },

  logout: async () => {
    try {
      await fetch(`${AUTH_API}/sign-out`, {
        method: 'POST',
      });
    } catch (err) {
      console.error('Logout error:', err);
    }
    set({ user: null, isAuthenticated: false });
  },
}));

export default useAuthStore;
