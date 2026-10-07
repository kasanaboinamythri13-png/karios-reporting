// mobile/src/context/NotificationContext.js
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const isFetchingRef = useRef(false);

  const fetchNotifications = useCallback(async (isSilent = false) => {
    if (!user || isFetchingRef.current) return;
    if (!isSilent) setLoading(true);
    isFetchingRef.current = true;

    try {
      const res = await api.getNotifications();
      const list = res?.notifications || res?.data || (Array.isArray(res) ? res : []);
      const safeList = Array.isArray(list) ? list : [];
      setNotifications(safeList);

      const serverUnread = typeof res?.unreadCount === 'number'
        ? res.unreadCount
        : safeList.filter((n) => !n.is_read).length;

      setUnreadCount(serverUnread);
    } catch {
      // Silently keep current state on error
    } finally {
      isFetchingRef.current = false;
      if (!isSilent) setLoading(false);
    }
  }, [user]);

  // Initial load and periodic polling every 10 seconds for instant notification updates
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchNotifications(false);

    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [user, fetchNotifications]);

  const markAllAsRead = useCallback(async () => {
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    try {
      await api.markAllNotificationsRead();
    } catch {
      // Ignore background error
    }
  }, []);

  const markNotificationRead = useCallback(async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await api.markNotificationRead(id);
    } catch {
      // Ignore background error
    }
  }, []);

  const clearBadge = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const hasUnread = unreadCount > 0;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        hasUnread,
        loading,
        fetchNotifications,
        markAllAsRead,
        markNotificationRead,
        clearBadge,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
