// mobile/src/services/api.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, USE_MOCK_DATA } from '../config/api.config';

import { auth } from './firebase';

let authToken = null;

export const setAuthToken = (token) => {
  authToken = token;
};

export const getStoredAuthToken = async () => {
  if (authToken) return authToken;
  try {
    let token = (await AsyncStorage.getItem('@karios_auth_token')) || (await AsyncStorage.getItem('karios_token'));
    if (!token && auth?.currentUser) {
      token = await auth.currentUser.getIdToken();
    }
    authToken = token;
    return token;
  } catch {
    return null;
  }
};

export class ApiError extends Error {
  constructor(message, status = 500, code = 'ERROR') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function request(endpoint, options = {}) {
  const { method = 'GET', body, headers = {} } = options;
  const token = await getStoredAuthToken();

  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const res = await fetch(url, config);
    const contentType = res.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const data = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      const errMsg = (isJson && data?.error?.message) || (isJson && data?.message) || `Request failed with status ${res.status}`;
      throw new ApiError(errMsg, res.status, data?.error?.code);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      error.message || 'Cannot reach server. Please verify your connection or API base URL.',
      0,
      'NETWORK_ERROR'
    );
  }
}

export const api = {
  // Auth & Profile
  getMe: () => request('/me'),

  // CEO Dashboard
  getCeoOverview: (date) => request(`/dashboard/overview${date ? `?date=${encodeURIComponent(date)}` : ''}`),
  
  // Reports
  getFormSchema: () => request('/reports/form-schema'),
  getTodayReport: () => request('/reports/today'),
  getReports: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.append(k, v);
    });
    const qs = query.toString();
    return request(`/reports${qs ? `?${qs}` : ''}`);
  },
  getReport: async (id) => {
    const res = await request(`/reports/${encodeURIComponent(id)}`);
    return res?.report || res;
  },
  getReportById: async (id) => {
    const res = await request(`/reports/${encodeURIComponent(id)}`);
    return res?.report || res;
  },
  submitReport: (body) => request('/reports', { method: 'POST', body }),
  updateReport: (id, body) => request(`/reports/${encodeURIComponent(id)}`, { method: 'PATCH', body }),
  reviewReport: (id, { status, comment }) =>
    request(`/reports/${encodeURIComponent(id)}/review`, {
      method: 'POST',
      body: { status, comment },
    }),

  // Notifications
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id) => request(`/notifications/${encodeURIComponent(id)}/read`, { method: 'POST' }),
  markAllNotificationsRead: () => request('/notifications/read-all', { method: 'POST' }),
};

export default api;
