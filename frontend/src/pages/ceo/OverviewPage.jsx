import StatusBadge from '../../components/StatusBadge.jsx';

// Owner: Member 3
// TODO: GET /api/dashboard/overview → submitted / missing per department, blockers, key $ metrics.
//       Must update automatically when a head submits (no page reload).
const DEPARTMENTS = ['Developer Head', 'Sales Head', 'Marketing Head', 'Finance Head'];

export default function OverviewPage() {
  return (
    <>
      <h1>Company overview — today</h1>
      <div className="grid">
        {DEPARTMENTS.map((title) => (
          <div className="card" key={title}>
            <strong>{title}</strong>
            <p>
              <StatusBadge status="MISSING" />
            </p>
          </div>
        ))}
      </div>
      <div className="card muted">Blockers and key metrics go here.</div>
    </>
  );
}
