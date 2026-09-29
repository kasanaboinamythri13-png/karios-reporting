// src/pages/ceo/CeoProfilePage.jsx
import React from "react";
import { useAuth } from "../../context/useAuth";

export default function CeoProfilePage() {
  const { appUser } = useAuth();

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Profile</h1>
        <p>Your account details</p>
      </div>

      <div style={{ maxWidth: 480 }}>
        <div className="card" style={{ textAlign: "center", padding: "40px 24px" }}>
          <div className="profile-avatar">
            {appUser?.title?.charAt(0) || "C"}
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
            {appUser?.title || "CEO"}
          </h2>
          <div className="tag" style={{ display: "inline-flex", marginBottom: 24 }}>
            {appUser?.role || "CEO"}
          </div>

          <hr className="divider" />

          <div style={{ textAlign: "left" }}>
            <div className="report-field">
              <div className="report-field__label">Role</div>
              <div>{appUser?.role || "CEO"}</div>
            </div>
            <div className="report-field">
              <div className="report-field__label">Title</div>
              <div>{appUser?.title || "CEO"}</div>
            </div>
            <div className="report-field">
              <div className="report-field__label">Access Level</div>
              <div>Full Admin Access — All Departments</div>
            </div>
            <div className="report-field">
              <div className="report-field__label">Permissions</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                {["View All Reports", "Approve Reports", "Reject Reports", "Dashboard Overview"].map((p) => (
                  <span key={p} className="tag">{p}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Security</h2>
          <div className="report-field">
            <div className="report-field__label">Authentication</div>
            <div>Firebase Email / Password</div>
          </div>
          <div className="report-field">
            <div className="report-field__label">Session</div>
            <div>Auto-refreshed via Firebase SDK</div>
          </div>
        </div>
      </div>
    </div>
  );
}
