// src/layouts/HeadLayout.jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import Sidebar from "../components/shared/Sidebar";
import TopBar from "../components/shared/TopBar";
import { useAuth } from "../context/useAuth";

export default function HeadLayout() {
  const { appUser, user, loading } = useAuth();
  const currentUser = appUser || user;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.role === "CEO") {
    return <Navigate to="/ceo" replace />;
  }

  return (
    <div className="app-layout">
      <Sidebar role={currentUser.role} />
      <div className="main-content">
        <TopBar title="Karios Reporting" subtitle={`${currentUser.title || "Department Head"} Portal`} />
        <div style={{ padding: "24px 32px" }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
