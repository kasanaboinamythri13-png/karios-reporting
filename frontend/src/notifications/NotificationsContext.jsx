import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { listNotifications } from '../api/notifications.js';

// Keeps the unread count for the sidebar badge fresh:
// every 60 seconds and whenever the user comes back to the tab.
const REFRESH_MS = 60 * 1000;

const NotificationsContext = createContext({ unreadCount: 0, refresh: () => {} });

export function NotificationsProvider({ children }) {
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const { unreadCount: count } = await listNotifications();
      setUnreadCount(count || 0);
    } catch {
      // keep the last known count; the page itself shows errors
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, REFRESH_MS);
    window.addEventListener('focus', refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', refresh);
    };
  }, [refresh]);

  return (
    <NotificationsContext.Provider value={{ unreadCount, setUnreadCount, refresh }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
