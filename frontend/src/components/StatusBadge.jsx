const LABELS = {
  NOT_SUBMITTED: 'Not submitted',
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  MISSING: 'Missing',
};

export default function StatusBadge({ status }) {
  return <span className={`badge badge-${status.toLowerCase()}`}>{LABELS[status] || status}</span>;
}
