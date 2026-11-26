const isLocalhost =
  typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname);

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (isLocalhost ? 'http://127.0.0.1:5000/api' : 'https://mha-production-c977c1c9.up.railway.app/api');

export function getAdminToken() {
  return sessionStorage.getItem('mha_admin_token') || '';
}

export function setAdminToken(token) {
  if (token) sessionStorage.setItem('mha_admin_token', token);
  else sessionStorage.removeItem('mha_admin_token');
}

export function getAdminUser() {
  try {
    return JSON.parse(sessionStorage.getItem('mha_admin_user') || 'null');
  } catch {
    return null;
  }
}

export function setAdminUser(user) {
  if (user) sessionStorage.setItem('mha_admin_user', JSON.stringify(user));
  else sessionStorage.removeItem('mha_admin_user');
}

export async function apiFetch(path, options = {}) {
  const token = getAdminToken();
  const headers = { ...(options.headers || {}) };

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    setAdminToken('');
    setAdminUser(null);
    if (typeof window !== 'undefined' && !window.location.pathname.endsWith('/login')) {
      window.location.href = '/login';
    }
  }
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}
