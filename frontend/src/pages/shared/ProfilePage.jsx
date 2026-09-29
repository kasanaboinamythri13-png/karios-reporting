import { useAuth } from '../../auth/AuthContext.jsx';
import { departmentLabel, isCeo } from '../../auth/roles.js';

// Role and department only — no personal names.
export default function ProfilePage() {
  const { user, logout } = useAuth();

  return (
    <>
      <h1 className="page-title">Home / Profile</h1>
      <div className="card profile">
        <dl className="report-fields">
          <div className="report-field">
            <dt>Title</dt>
            <dd>{user.title}</dd>
          </div>
          <div className="report-field">
            <dt>Role</dt>
            <dd>{isCeo(user) ? 'CEO' : 'Department Head'}</dd>
          </div>
          {user.department && (
            <div className="report-field">
              <dt>Department</dt>
              <dd>{departmentLabel(user.department)}</dd>
            </div>
          )}
        </dl>
        <button type="button" className="button-secondary" onClick={logout}>
          Log out
        </button>
      </div>
    </>
  );
}
