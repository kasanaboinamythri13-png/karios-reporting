// Every call to the backend goes through here.
// The login token is attached automatically (Firebase ID token, or a dev token in development).
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

let getToken = null;
let onUnauthorized = null;

// fn returns the current token. For Firebase it's user.getIdToken(), which renews
// the token by itself when it's about to expire (they last 1 hour).
export function setTokenProvider(fn) {
  getToken = fn;
}

// Called when the backend answers 401 (token missing, expired or user deactivated).
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

// Error with the HTTP status and backend error code, so pages can react to 404 / 409 / 503 etc.
export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function api(path, { method = 'GET', body, headers = {} } = {}) {
  let res;
  try {
    let token = getToken ? await getToken() : null;
    if (!token) {
      try {
        const { getAuth } = await import('firebase/auth');
        const fbUser = getAuth().currentUser;
        if (fbUser) token = await fbUser.getIdToken();
      } catch {}
    }
    if (!token) {
      try {
        const s = sessionStorage.getItem('karios_mock_user');
        if (s) {
          const u = JSON.parse(s);
          token = u.role === 'CEO' ? 'dev-ceo' : `dev-${(u.department || u.role || 'user').toLowerCase()}`;
        }
      } catch {}
    }
    if (!token) {
      try {
        token = localStorage.getItem('karios-dev-token');
      } catch {}
    }

    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection and try again.', 0, 'NETWORK_ERROR');
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && onUnauthorized) onUnauthorized();
    throw new ApiError(data?.error?.message || `Request failed (${res.status})`, res.status, data?.error?.code);
  }
  return data;
}

// Builds "?a=1&b=2", skipping empty values.
export function toQuery(params = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, value);
  }
  const text = search.toString();
  return text ? `?${text}` : '';
}
