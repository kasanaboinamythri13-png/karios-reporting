// src/App.jsx — Root router with role-based guards
import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth }     from "./context/useAuth";
import { ThemeProvider }  from "./context/ThemeContext";
import { ToastProvider }  from "./context/ToastContext";

// Layouts
import CeoLayout from "./layouts/CeoLayout";

// Pages
import LoginPage           from "./pages/LoginPage";
import CeoOverviewPage     from "./pages/ceo/CeoOverviewPage";
import CeoReportsPage      from "./pages/ceo/CeoReportsPage";
import CeoReportDetailPage from "./pages/ceo/CeoReportDetailPage";
import CeoProfilePage      from "./pages/ceo/CeoProfilePage";

// Smart root redirect based on role
function RootRedirect() {
  const { appUser, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="loading-spinner" />
    </div>
  );
  if (!appUser) return <Navigate to="/login" replace />;
  return <Navigate to="/ceo" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"      element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />

      {/* CEO Area */}
      <Route path="/ceo" element={<CeoLayout />}>
        <Route index              element={<CeoOverviewPage />} />
        <Route path="reports"     element={<CeoReportsPage />} />
        <Route path="reports/:id" element={<CeoReportDetailPage />} />
        <Route path="profile"     element={<CeoProfilePage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}