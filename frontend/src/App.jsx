import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext.jsx';
import RoleRoute from './auth/RoleRoute.jsx';
import Layout from './components/Layout.jsx';

import LoginPage from './pages/LoginPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

import HeadHomePage from './pages/head/HeadHomePage.jsx';
import ReportFormPage from './pages/head/ReportFormPage.jsx';
import ReportHistoryPage from './pages/head/ReportHistoryPage.jsx';

import OverviewPage from './pages/ceo/OverviewPage.jsx';
import AllReportsPage from './pages/ceo/AllReportsPage.jsx';

import ReportDetailPage from './pages/shared/ReportDetailPage.jsx';
import NotificationsPage from './pages/shared/NotificationsPage.jsx';
import ProfilePage from './pages/shared/ProfilePage.jsx';

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'CEO' ? '/ceo' : '/head'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<HomeRedirect />} />

      {/* Head area — Member 2 */}
      <Route element={<RoleRoute roles={['HEAD']}><Layout /></RoleRoute>}>
        <Route path="/head" element={<HeadHomePage />} />
        <Route path="/head/report" element={<ReportFormPage />} />
        <Route path="/head/history" element={<ReportHistoryPage />} />
      </Route>

      {/* CEO area — Member 3 */}
      <Route element={<RoleRoute roles={['CEO']}><Layout /></RoleRoute>}>
        <Route path="/ceo" element={<OverviewPage />} />
        <Route path="/ceo/reports" element={<AllReportsPage />} />
      </Route>

      {/* Shared */}
      <Route element={<RoleRoute roles={['HEAD', 'CEO']}><Layout /></RoleRoute>}>
        <Route path="/reports/:id" element={<ReportDetailPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
