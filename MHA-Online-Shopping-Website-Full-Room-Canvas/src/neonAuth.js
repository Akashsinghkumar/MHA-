import { createAuthClient } from '@neon/auth';
import { BetterAuthReactAdapter } from '@neon/auth/react/adapters';

const neonAuthUrl = import.meta.env.VITE_NEON_AUTH_URL;

let client = null;
if (neonAuthUrl) {
  try {
    client = createAuthClient(neonAuthUrl, {
      adapter: BetterAuthReactAdapter(),
    });
  } catch (err) {
    console.warn('Neon Auth init skipped:', err);
  }
}

export const authClient = client;
