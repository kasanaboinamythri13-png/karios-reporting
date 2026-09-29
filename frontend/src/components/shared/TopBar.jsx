// src/components/shared/TopBar.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/useAuth";

const SunIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
);
const MoonIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
);

export default function TopBar({ title, subtitle }) {
  const { theme, toggleTheme } = useTheme();
  const { appUser, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileOpen]);

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
    navigate("/login");
  };

  const isCEO = appUser?.role === "CEO";
  const initial = (appUser?.title || appUser?.role || "C").charAt(0).toUpperCase();

  // Permissions list based on role
  const permissions = isCEO
    ? ["View All Reports", "Approve Reports", "Reject Reports", "Dashboard Overview"]
    : ["Submit Daily Report", "Same-day Edit", "View Department History"];

  const accessLevel = isCEO
    ? "Full Admin Access — All Departments"
    : `Own Department (${appUser?.department || "Department"})`;

  return (
    <header className="topbar">
      <div>
        <div className="topbar__title">{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{subtitle}</div>}
      </div>

      <div className="topbar__actions" style={{ position: "relative" }}>
        {/* Single Dark mode toggle */}
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          id="topbar-theme-btn"
          aria-label="Toggle theme"
        >
          {theme === "light" ? <MoonIcon /> : <SunIcon />}
          {theme === "light" ? "Dark" : "Light"}
        </button>

        {/* Notifications */}
        <NotificationBell />

        {/* Profile Avatar / Trigger */}
        <div ref={profileRef} style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setProfileOpen((prev) => !prev)}
            id="topbar-profile-trigger"
            aria-label="User profile menu"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 10px 4px 4px",
              borderRadius: 24,
              border: "1px solid",
              borderColor: profileOpen ? "var(--color-primary)" : "var(--color-border)",
              background: profileOpen ? "var(--color-primary-light)" : "var(--color-surface)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: 14,
              }}
            >
              {initial}
            </div>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--color-text)",
                maxWidth: 120,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {appUser?.title || appUser?.role || "User"}
            </span>
            <span style={{ fontSize: 10, color: "var(--color-text-muted)" }}>
              {profileOpen ? "▲" : "▼"}
            </span>
          </button>

          {/* Profile Dropdown Popup (matching reference card) */}
          {profileOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 10px)",
                right: 0,
                width: 330,
                padding: "24px 20px 20px",
                zIndex: 99999,
                boxShadow: "0 12px 32px rgba(0, 0, 0, 0.18), 0 4px 12px rgba(0, 0, 0, 0.10)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text)",
              }}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setProfileOpen(false)}
                style={{
                  position: "absolute",
                  top: 14,
                  right: 14,
                  background: "none",
                  border: "none",
                  fontSize: 15,
                  cursor: "pointer",
                  color: "var(--color-text-muted)",
                  padding: 4,
                  lineHeight: 1,
                }}
                aria-label="Close profile popup"
              >
                ✕
              </button>

              {/* Avatar & Header Info */}
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #7c3aed, #9333ea)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 800,
                    fontSize: 26,
                    margin: "0 auto 10px",
                    boxShadow: "0 4px 14px rgba(124, 58, 237, 0.35)",
                  }}
                >
                  {initial}
                </div>
                <div style={{ fontWeight: 800, fontSize: 18, color: "var(--color-text)", letterSpacing: "-0.3px" }}>
                  {appUser?.title || appUser?.role}
                </div>
                <div
                  style={{
                    display: "inline-block",
                    padding: "2px 10px",
                    borderRadius: 12,
                    background: "var(--color-primary-light)",
                    color: "var(--color-primary)",
                    fontSize: 11,
                    fontWeight: 700,
                    marginTop: 4,
                  }}
                >
                  {appUser?.role}
                </div>
                <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 6 }}>
                  {appUser?.email || `${(appUser?.role || "user").toLowerCase()}@karios.local`}
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, backgroundColor: "var(--color-border)", margin: "16px 0" }} />

              {/* Details List (matching Image 2) */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12, textAlign: "left", fontSize: 13 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", marginBottom: 2 }}>
                    Role
                  </div>
                  <div style={{ fontWeight: 600, color: "var(--color-text)" }}>
                    {appUser?.role}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", marginBottom: 2 }}>
                    Title
                  </div>
                  <div style={{ fontWeight: 600, color: "var(--color-text)" }}>
                    {appUser?.title}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", marginBottom: 2 }}>
                    Access Level
                  </div>
                  <div style={{ fontWeight: 600, color: "var(--color-text)" }}>
                    {accessLevel}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", marginBottom: 6 }}>
                    Permissions
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {permissions.map((p) => (
                      <span
                        key={p}
                        style={{
                          padding: "3px 9px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          background: "var(--color-primary-light)",
                          color: "var(--color-primary)",
                          border: "1px solid var(--color-border)",
                        }}
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, backgroundColor: "var(--color-border)", margin: "18px 0 16px" }} />

              {/* Sign out button */}
              <button
                type="button"
                className="btn btn--danger w-full btn--sm"
                onClick={handleLogout}
                id="profile-dropdown-signout"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  fontWeight: 700,
                  padding: "9px 16px",
                  fontSize: 13,
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
