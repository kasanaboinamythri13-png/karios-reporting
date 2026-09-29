// Every call to the backend goes through here.
// TODO (Member 1 + 2): add the Firebase ID token → headers.Authorization = `Bearer ${token}`
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export async function api(path, { method = 'GET', body, headers = {} } = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error?.message || `Request failed (${res.status})`);
  }
  return data;
}
