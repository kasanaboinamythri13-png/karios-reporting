// Status as a colored dot + text (see the design): ● Approved
const LABELS = {
  NOT_SUBMITTED: 'Not submitted',
  SUBMITTED: 'Pending review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  MISSING: 'Not submitted',
};

export default function StatusBadge({ status }) {
  return <span className={`status status-${status.toLowerCase()}`}>{LABELS[status] || status}</span>;
}
