import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

// Blocks pages the user's role may not see. (The backend must ALSO check the role.)
export default function RoleRoute({ roles, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}
