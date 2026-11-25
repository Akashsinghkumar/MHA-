export const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';
export const BACKEND_ORIGIN = API_BASE.replace(/\/api\/?$/, '');

export function getToken() {
  try {
    return localStorage.getItem('mhaToken') || '';
  } catch {
    return '';
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem('mhaToken', token);
    else localStorage.removeItem('mhaToken');
  } catch {}
}

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export function resolveBackendImage(url) {
  if (!url) return '';
  if (url.startsWith('/uploads/')) return `${BACKEND_ORIGIN}${url}`;
  return url;
}
