import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import { hasRole } from './roles.js';
import { Loading } from '../components/Feedback.jsx';

// Blocks pages the user's role may not see. (The backend ALSO checks the role.)
export default function RoleRoute({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading full />;
  if (!user) return <Navigate to="/login" replace />;
  if (!hasRole(user, roles)) return <Navigate to="/" replace />;
  return children;
}
