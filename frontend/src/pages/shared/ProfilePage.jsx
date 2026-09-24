import { useAuth } from '../../auth/AuthContext.jsx';

// Role and department only — no personal names.
export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <>
      <h1>Profile</h1>
      <div className="card">
        <p>
          <strong>Title:</strong> {user.title}
        </p>
        <p>
          <strong>Role:</strong> {user.role}
        </p>
        {user.department && (
          <p>
            <strong>Department:</strong> {user.department}
          </p>
        )}
      </div>
    </>
  );
}
