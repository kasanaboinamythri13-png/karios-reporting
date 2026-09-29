// src/layouts/CeoLayout.jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import Sidebar from "../components/shared/Sidebar";
import TopBar from "../components/shared/TopBar";
import { useAuth } from "../context/useAuth";

export default function CeoLayout() {
  const { appUser, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!appUser || appUser.role !== "CEO") {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-layout">
      <Sidebar role="CEO" />
      <div className="main-content">
        <TopBar title="Karios Admin" subtitle="CEO Dashboard" />
        <Outlet />
      </div>
    </div>
  );
}
