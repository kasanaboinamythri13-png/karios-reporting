// src/App.jsx — Root router with role-based guards
import React from "react";
import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth }     from "./context/useAuth";
import { ThemeProvider }  from "./context/ThemeContext";
import { ToastProvider }  from "./context/ToastContext";

// Layouts
import CeoLayout from "./layouts/CeoLayout";
import HeadLayout from "./layouts/HeadLayout";

// Pages - Auth
import LoginPage           from "./pages/LoginPage";

// Pages - CEO
import CeoOverviewPage     from "./pages/ceo/CeoOverviewPage";
import CeoReportsPage      from "./pages/ceo/CeoReportsPage";
import CeoReportDetailPage from "./pages/ceo/CeoReportDetailPage";
import CeoProfilePage      from "./pages/ceo/CeoProfilePage";

// Pages - Department Head
import HeadHomePage        from "./pages/head/HeadHomePage";
import ReportFormPage      from "./pages/head/ReportFormPage";
import ReportHistoryPage   from "./pages/head/ReportHistoryPage";

// Pages - Shared
import ReportDetailPage    from "./pages/shared/ReportDetailPage";
import NotificationsPage   from "./pages/shared/NotificationsPage";
import ProfilePage         from "./pages/shared/ProfilePage";

// Smart root redirect based on role
function RootRedirect() {
  const { appUser, user, loading } = useAuth();
  const currentUser = appUser || user;

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="loading-spinner" />
    </div>
  );
  if (!currentUser) return <Navigate to="/login" replace />;
  return <Navigate to={currentUser.role === "CEO" ? "/ceo" : "/head"} replace />;
}

// Pages used by both roles get the CEO or Head layout, depending on who is signed in
function RoleLayout() {
  const { appUser, user } = useAuth();
  const currentUser = appUser || user;
  return currentUser?.role === "CEO" ? <CeoLayout /> : <HeadLayout />;
}

// The CEO has their own report page (with Approve / Reject)
function ReportRoute() {
  const { appUser, user } = useAuth();
  const { id } = useParams();
  const currentUser = appUser || user;
  if (currentUser?.role === "CEO") return <Navigate to={`/ceo/reports/${id}`} replace />;
  return <ReportDetailPage />;
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

      {/* Head Area */}
      <Route path="/head" element={<HeadLayout />}>
        <Route index              element={<HeadHomePage />} />
        <Route path="report"      element={<ReportFormPage />} />
        <Route path="reports"     element={<ReportHistoryPage />} />
        <Route path="history"     element={<ReportHistoryPage />} />
      </Route>

      {/* Shared routes — shown inside the signed-in user's layout (sidebar + top bar) */}
      <Route element={<RoleLayout />}>
        <Route path="/reports/:id"   element={<ReportRoute />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile"       element={<ProfilePage />} />
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