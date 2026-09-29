import { api } from './client.js';

// GET /notifications → { notifications, unreadCount }
export const listNotifications = () => api('/notifications');

export const markNotificationRead = (id) =>
  api(`/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' });

export const markAllNotificationsRead = () => api('/notifications/read-all', { method: 'PATCH' });
