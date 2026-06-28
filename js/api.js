import { API_BASE } from './config.js';
import { getToken, clearAuth } from './auth.js';

/**
 * Thin fetch wrapper: attaches the JWT, parses JSON, and throws a clean
 * Error(message) on failure so callers can show a toast/empty state.
 */
export async function api(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(API_BASE + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('שגיאת רשת — לא ניתן להגיע לשרת');
  }

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    /* empty body */
  }

  if (!res.ok || (payload && payload.success === false)) {
    if (res.status === 401) {
      clearAuth();
      if (!location.pathname.endsWith('login.html')) location.replace('login.html');
    }
    throw new Error((payload && payload.error) || `שגיאה (${res.status})`);
  }

  return payload;
}

export const apiGet = (p, o) => api(p, { ...o, method: 'GET' });
export const apiPost = (p, body, o) => api(p, { ...o, method: 'POST', body });
export const apiPut = (p, body, o) => api(p, { ...o, method: 'PUT', body });
export const apiPatch = (p, body, o) => api(p, { ...o, method: 'PATCH', body });
export const apiDelete = (p, o) => api(p, { ...o, method: 'DELETE' });
