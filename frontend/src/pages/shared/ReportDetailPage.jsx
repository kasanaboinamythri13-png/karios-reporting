import { useParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext.jsx';

// Owner: Member 3
// TODO: GET /api/reports/:id → show fields, attachments, status, CEO comment.
//       CEO only: Approve / Reject + optional comment → POST /api/reports/:id/review
//       Head: "Edit" button if the report is from today and not approved.
export default function ReportDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();

  return (
    <>
      <h1>Report {id}</h1>
      <div className="card muted">Report details go here.</div>
      {user.role === 'CEO' && <div className="card muted">Approve / Reject panel goes here.</div>}
    </>
  );
}
