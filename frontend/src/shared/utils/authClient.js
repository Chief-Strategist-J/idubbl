import { createAuthClient } from 'better-auth/client';
import { passkeyClient } from '@better-auth/passkey/client';

let apiBase = import.meta.env.VITE_API_URL || 'https://idubbl-backend.onrender.com';
if (apiBase && !apiBase.startsWith('http://') && !apiBase.startsWith('https://')) {
  apiBase = `https://${apiBase}`;
}

export const authClient = createAuthClient({
  baseURL: apiBase,
  plugins: [
    passkeyClient()
  ]
});
