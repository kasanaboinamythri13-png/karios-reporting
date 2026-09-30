// src/components/shared/Sidebar.jsx
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import KariosLogo from "./KariosLogo";

// SVG Icons
const Icons = {
  overview:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  reports:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  home:      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  logout:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
};

export default function Sidebar({ role }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const isCEO = role === "CEO";

  const navItems = isCEO
    ? [
        { to: "/ceo", label: "Overview", icon: Icons.overview, end: true },
        { to: "/ceo/reports", label: "Reports",  icon: Icons.reports },
      ]
    : [
        { to: "/head", label: "Home", icon: Icons.home, end: true },
        { to: "/head/report", label: "Submit Report", icon: Icons.reports },
        { to: "/head/history", label: "My Reports", icon: Icons.reports },
      ];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar__logo" style={{ padding: "6px 8px 16px" }}>
        <KariosLogo size={30} subtitle="REPORTING" />
      </div>

      {/* Navigation */}
      <nav className="sidebar__nav">
        {isCEO && (
          <span className="sidebar__nav-section">CEO Admin</span>
        )}
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `sidebar__nav-item${isActive ? " active" : ""}`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar__footer">
        <button
          className="sidebar__nav-item"
          onClick={handleLogout}
          id="logout-btn"
          style={{ width: "100%", justifyContent: "flex-start", color: "var(--color-text-muted)" }}
        >
          {Icons.logout}
          Log out
        </button>
      </div>
    </aside>
  );
}
