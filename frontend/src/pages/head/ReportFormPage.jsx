import { useAuth } from '../../auth/AuthContext.jsx';

// Owner: Member 2
// TODO:
//   - Show the form fields for user.department (same list as backend/src/modules/reports/formFields.js)
//   - Currency fields show "$"
//   - Optional attachments (JPG / PNG / PDF, max 5, 10 MB each)
//   - Submit → POST /api/reports ; Edit (same day) → PATCH /api/reports/:id
//   - After success, go back to Home — status must update without a page reload
export default function ReportFormPage() {
  const { user } = useAuth();

  return (
    <>
      <h1>{user.title} — Daily report</h1>
      <div className="card muted">Form for the {user.department} department goes here.</div>
    </>
  );
}
