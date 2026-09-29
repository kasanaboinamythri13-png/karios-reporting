import { formatUSD } from '../utils/currency.js';

// Read-only view of a report's answers.
// fields: the form schema (labels + types). Without it, keys are shown as readable labels.
export default function ReportFields({ fields, data }) {
  const list = fields?.length ? fields : Object.keys(data || {}).map((key) => ({ key, label: humanize(key) }));

  return (
    <dl className="report-fields">
      {list.map((field) => {
        const value = data?.[field.key];
        const empty = value === undefined || value === null || value === '';
        return (
          <div key={field.key} className={field.type === 'textarea' ? 'report-field wide' : 'report-field'}>
            <dt>{field.label}</dt>
            <dd className={empty ? 'muted' : undefined}>
              {empty ? '—' : field.type === 'currency' ? formatUSD(value) : String(value)}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

// "tasksCompleted" → "Tasks completed"
function humanize(key) {
  const words = key.replace(/([A-Z])/g, ' $1').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
