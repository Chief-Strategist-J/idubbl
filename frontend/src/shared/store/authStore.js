import { create } from 'zustand';
import { persist } from 'zustand/middleware';

let apiBase = import.meta.env.VITE_API_URL || 'https://idubbl-backend.onrender.com';
if (apiBase && !apiBase.startsWith('http://') && !apiBase.startsWith('https://')) {
  apiBase = `https://${apiBase}`;
}
const AUTH_API = `${apiBase}/api/auth`;

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      loading: false,
      sessionChecked: false,

      // Called on app boot — validates persisted session with backend.
      // Shows user as logged-in instantly from localStorage, then confirms
      // with the server in background. Only logs out if server rejects.
      checkSession: async () => {
        // If we already have a user in localStorage, mark as checked immediately
        // so the app renders without a loading flash. Then verify with server.
        const { user: cachedUser } = get();
        if (cachedUser) {
          set({ sessionChecked: true });
        } else {
          set({ loading: true });
        }

        const token = localStorage.getItem('idubbl_bearer_token');
        const headers = { 'Accept': 'application/json' };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        try {
          const res = await fetch(`${AUTH_API}/get-session`, {
            headers,
            credentials: 'include'
          });

          if (res.ok) {
            const data = await res.json();
            if (data && data.user) {
              const loginPortal = localStorage.getItem('idubbl_login_portal') || 'player';
              const role = (loginPortal === 'admin' && data.user.role === 'admin') ? 'admin' : 'player';
              localStorage.setItem('idubbl_role', role);
              set({
                user: { ...data.user, role },
                isAuthenticated: true,
                loading: false,
                sessionChecked: true,
              });
              return;
            }
          }

          // Server says no valid session — clear everything
          localStorage.removeItem('idubbl_login_portal');
          localStorage.removeItem('idubbl_role');
          localStorage.removeItem('idubbl_bearer_token');
          set({ user: null, isAuthenticated: false, loading: false, sessionChecked: true });
        } catch (err) {
          // Network error — keep user logged in from localStorage if we have them.
          // They'll be verified again on the next successful request.
          console.warn('Session check failed (network error) — keeping cached session:', err.message);
          if (!get().user) {
            localStorage.removeItem('idubbl_login_portal');
            localStorage.removeItem('idubbl_role');
            localStorage.removeItem('idubbl_bearer_token');
            set({ user: null, isAuthenticated: false, loading: false, sessionChecked: true });
          } else {
            set({ loading: false, sessionChecked: true });
          }
        }
      },

      login: async (email, password, portal = 'player') => {
        set({ loading: true });
        try {
          const res = await fetch(`${AUTH_API}/sign-in/email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-portal': portal
            },
            credentials: 'include',
            body: JSON.stringify({ email, password })
          });

          const data = await res.json();
          set({ loading: false });
          if (res.ok && data.user) {
            const token = res.headers.get('set-auth-token');
            if (token) {
              localStorage.setItem('idubbl_bearer_token', token);
            }
            localStorage.setItem('idubbl_login_portal', portal);
            const role = (portal === 'admin' && data.user.role === 'admin') ? 'admin' : 'player';
            localStorage.setItem('idubbl_role', role);
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
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              email: data.email,
              password: data.password,
              name: name,
              enteredReferralCode: data.referral,
            })
          });

          const resData = await res.json();
          set({ loading: false });
          if (res.ok && resData.user) {
            const token = res.headers.get('set-auth-token');
            if (token) {
              localStorage.setItem('idubbl_bearer_token', token);
            }
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
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, redirectTo })
          });
          const data = await res.json();
          set({ loading: false });
          if (res.ok) return { success: true };
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
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ newPassword, token })
          });
          const data = await res.json();
          set({ loading: false });
          if (res.ok) return { success: true };
          return { success: false, error: data.message || 'Failed to reset password' };
        } catch (err) {
          console.error('Reset password error:', err);
          set({ loading: false });
          return { success: false, error: 'Network error resetting password' };
        }
      },

      logout: async () => {
        localStorage.removeItem('idubbl_login_portal');
        localStorage.removeItem('idubbl_role');
        localStorage.removeItem('idubbl_bearer_token');
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
    }),
    {
      name: 'idubbl-auth',          // localStorage key
      partialize: (state) => ({     // Only persist what's needed
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
