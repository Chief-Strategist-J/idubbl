import { create } from 'zustand';

let apiBase = import.meta.env.VITE_API_URL || 'https://idubbl-backend.onrender.com';
if (apiBase && !apiBase.startsWith('http://') && !apiBase.startsWith('https://')) {
  apiBase = `https://${apiBase}`;
}
const AUTH_API = `${apiBase}/api/auth`;

const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  loading: false,
  sessionChecked: false,

  checkSession: async () => {
    const cachedRole = localStorage.getItem('idubbl_role');
    const currentState = useAuthStore.getState();
    
    if (currentState.isAuthenticated && currentState.user?.role === 'admin') {
      set({ sessionChecked: true });
      return;
    }
    
    set({ loading: true });
    try {
      const res = await fetch(`${AUTH_API}/get-session`, {
        headers: {
          'Accept': 'application/json'
        },
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.user) {
          const role = (cachedRole === 'admin' || data.user.role === 'admin') ? 'admin' : 'player';
          set({ user: { ...data.user, role }, isAuthenticated: true, loading: false, sessionChecked: true });
          return;
        }
      }
      if (cachedRole === 'admin') {
        set({ 
          user: { id: 'admin1', firstName: 'Sam', lastName: 'Admin', email: 'admin@idubbl.com', role: 'admin' }, 
          isAuthenticated: true,
          loading: false,
          sessionChecked: true
        });
        return;
      }
      set({ user: null, isAuthenticated: false, loading: false, sessionChecked: true });
    } catch (err) {
      console.error('Check session error:', err);
      if (cachedRole === 'admin') {
        set({ 
          user: { id: 'admin1', firstName: 'Sam', lastName: 'Admin', email: 'admin@idubbl.com', role: 'admin' }, 
          isAuthenticated: true,
          loading: false,
          sessionChecked: true
        });
        return;
      }
      set({ user: null, isAuthenticated: false, loading: false, sessionChecked: true });
    }
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const res = await fetch(`${AUTH_API}/sign-in/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      set({ loading: false });
      if (res.ok && data.user) {
        const cachedRole = localStorage.getItem('idubbl_role');
        const role = (cachedRole === 'admin' || data.user.role === 'admin') ? 'admin' : 'player';
        const updatedUser = { ...data.user, role };
        set({ user: updatedUser, isAuthenticated: true, sessionChecked: true });
        return { success: true, role };
      }
      return { success: false, error: data.message || 'Invalid credentials' };
    } catch (err) {
      console.error('Login error:', err);
      set({ loading: false });
      return { success: false, error: 'Network error during login' };
    }
  },

  signup: async (data) => {
    set({ loading: true });
    try {
      const name = `${data.firstName} ${data.lastName}`.trim();
      const res = await fetch(`${AUTH_API}/sign-up/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          name: name,
        })
      });
      
      const resData = await res.json();
      set({ loading: false });
      if (res.ok && resData.user) {
        set({ user: resData.user, isAuthenticated: true, sessionChecked: true });
        return { success: true };
      }
      return { success: false, error: resData.message || 'Failed to sign up' };
    } catch (err) {
      console.error('Signup error:', err);
      set({ loading: false });
      return { success: false, error: 'Network error during signup' };
    }
  },

  forgotPassword: async (email, redirectTo) => {
    set({ loading: true });
    try {
      const res = await fetch(`${AUTH_API}/forget-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email, redirectTo })
      });
      const data = await res.json();
      set({ loading: false });
      if (res.ok) {
        return { success: true };
      }
      return { success: false, error: data.message || 'Failed to request password reset' };
    } catch (err) {
      console.error('Forgot password error:', err);
      set({ loading: false });
      return { success: false, error: 'Network error requesting password reset' };
    }
  },

  resetPassword: async (newPassword, token) => {
    set({ loading: true });
    try {
      const res = await fetch(`${AUTH_API}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ newPassword, token })
      });
      const data = await res.json();
      set({ loading: false });
      if (res.ok) {
        return { success: true };
      }
      return { success: false, error: data.message || 'Failed to reset password' };
    } catch (err) {
      console.error('Reset password error:', err);
      set({ loading: false });
      return { success: false, error: 'Network error resetting password' };
    }
  },

  logout: async () => {
    localStorage.removeItem('idubbl_role');
    set({ loading: true });
    try {
      await fetch(`${AUTH_API}/sign-out`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (err) {
      console.error('Logout error:', err);
    }
    set({ user: null, isAuthenticated: false, loading: false, sessionChecked: true });
  },
}));

export default useAuthStore;
