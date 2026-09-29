import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';

// Owner: Member 2
// TODO: load today's report from GET /api/reports/today and show its real status
//       (Not submitted / Submitted / Approved / Rejected + CEO comment).
export default function HeadHomePage() {
  const { user } = useAuth();

  return (
    <>
      <h1>Welcome, {user.title}</h1>
      <div className="card">
        <p>
          Today's report: <StatusBadge status="NOT_SUBMITTED" />
        </p>
        <Link className="button" to="/head/report">
          Submit today's report
        </Link>
      </div>
    </>
  );
}
