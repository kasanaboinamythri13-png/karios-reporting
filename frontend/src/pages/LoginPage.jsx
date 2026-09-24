import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

// TODO (Member 2): real login form — email + password → Firebase → GET /api/me
const DEV_USERS = [
  { role: 'HEAD', department: 'DEVELOPER', title: 'Developer Head' },
  { role: 'HEAD', department: 'SALES', title: 'Sales Head' },
  { role: 'HEAD', department: 'MARKETING', title: 'Marketing Head' },
  { role: 'HEAD', department: 'FINANCE', title: 'Finance Head' },
  { role: 'CEO', department: null, title: 'CEO' },
];

export default function LoginPage() {
  const { user, devLogin } = useAuth();
  if (user) return <Navigate to="/" replace />;

  return (
    <div className="login">
      <h1>Karios Reporting</h1>

      <form className="card" onSubmit={(e) => e.preventDefault()}>
        <label>
          Company email
          <input type="email" placeholder="you@karios.com" disabled />
        </label>
        <label>
          Password
          <input type="password" disabled />
        </label>
        <button disabled>Log in (coming soon)</button>
      </form>

      <div className="card">
        <p className="muted">Development only — continue as:</p>
        <div className="dev-users">
          {DEV_USERS.map((u) => (
            <button key={u.title} onClick={() => devLogin(u)}>
              {u.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
