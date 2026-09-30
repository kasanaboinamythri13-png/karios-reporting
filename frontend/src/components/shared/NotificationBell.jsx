// src/components/shared/NotificationBell.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "../../context/useAuth";

export default function NotificationBell() {
  const [open, setOpen]     = useState(false);
  const [notifs, setNotifs] = useState([]);
  const ref = useRef(null);
  const navigate = useNavigate();
  const { appUser } = useAuth();

  const fetchNotifs = async () => {
    try {
      const { data } = await api.get("/notifications");
      setNotifs(Array.isArray(data) ? data : data.notifications || data.data || []);
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetchNotifs();
    // Live polling every 15s so new notifications appear without page reload
    const timer = setInterval(fetchNotifs, 15_000);
    return () => clearInterval(timer);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unread = notifs.filter((n) => !n.read_at && !n.is_read).length;

  const markRead = async (n) => {
    try {
      await api.patch(`/notifications/${n.id}/read`);
      setNotifs((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, read_at: new Date().toISOString(), is_read: true } : item))
      );
    } catch { /* silent */ }

    setOpen(false);
    if (n.report_id) {
      if (appUser?.role === "CEO") {
        navigate(`/ceo/reports/${n.report_id}`);
      } else {
        navigate(`/reports/${n.report_id}`);
      }
    }
  };

  return (
    <div style={{ position: "relative" }} ref={ref}>
      <button
        type="button"
        className={`notif-btn${open ? " active" : ""}`}
        id="notif-bell-btn"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ""}`}
        title="Notifications"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm7-6V11a7 7 0 0 0-5.5-6.84V3.5a1.5 1.5 0 0 0-3 0v.66A7 7 0 0 0 5 11v5l-1.7 1.7A1 1 0 0 0 4 19.4h16a1 1 0 0 0 .7-1.7Z"
            fill="currentColor"
          />
        </svg>
        {unread > 0 && (
          <span className="notif-badge">{unread > 9 ? "9+" : unread}</span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown" role="dialog" aria-label="Notifications">
          <div className="notif-dropdown__header">
            <span>Notifications</span>
            {unread > 0 && (
              <span style={{ fontSize: 12, fontWeight: 500, color: "var(--color-primary)" }}>
                {unread} unread
              </span>
            )}
          </div>

          {notifs.length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--color-text-muted)", fontSize: 14 }}>
              No notifications yet
            </div>
          ) : (
            notifs.slice(0, 10).map((n) => {
              const isUnread = !n.read_at && !n.is_read;
              return (
                <div
                  key={n.id}
                  className={`notif-item${isUnread ? " unread" : ""}`}
                  onClick={() => markRead(n)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="notif-item__icon">
                    {n.type === "REPORT_REVIEW" ? "📋" : "🔔"}
                  </div>
                  <div className="notif-item__body">
                    <div className="notif-item__title">{n.title}</div>
                    <div className="notif-item__msg">{n.body}</div>
                    <div className="notif-item__time">
                      {n.created_at ? formatDistanceToNow(new Date(n.created_at), { addSuffix: true }) : ""}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
