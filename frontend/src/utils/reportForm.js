// Turns form inputs (strings) into report data, with the same rules as the backend
// (backend/src/modules/reports/reports.validation.js), so errors show next to each field.
import { MAX_TEXT } from '../components/FieldInput.jsx';

const MAX_MONEY = 999_999_999_999.99;

// Report data from the backend → input values (strings).
export function toFormValues(fields, data = {}) {
  return Object.fromEntries(fields.map((f) => [f.key, data?.[f.key] == null ? '' : String(data[f.key])]));
}

// → { data, errors }. errors is {} when everything is valid.
export function buildReportData(fields, values) {
  const data = {};
  const errors = {};

  for (const field of fields) {
    const raw = (values[field.key] ?? '').trim();

    if (raw === '') {
      if (field.required) errors[field.key] = `${field.label} is required`;
      continue; // optional and empty → leave it out
    }

    if (field.type === 'number' || field.type === 'currency') {
      const num = Number(raw);
      if (!Number.isFinite(num)) errors[field.key] = `${field.label} must be a number`;
      else if (num < 0) errors[field.key] = `${field.label} cannot be negative`;
      else if (field.type === 'number' && !Number.isInteger(num)) errors[field.key] = `${field.label} must be a whole number`;
      else if (field.type === 'currency' && num > MAX_MONEY) errors[field.key] = `${field.label} is too large`;
      else if (field.type === 'currency' && Math.abs(Math.round(num * 100) - num * 100) > 1e-6)
        errors[field.key] = `${field.label} can have at most 2 decimals`;
      else data[field.key] = num;
    } else if (raw.length > MAX_TEXT) {
      errors[field.key] = `${field.label} is too long (max ${MAX_TEXT} characters)`;
    } else {
      data[field.key] = raw;
    }
  }

  return { data, errors };
}

// The one number that best sums up a department's day (for lists and cards).
const HEADLINE = {
  FINANCE: { column: 'collections', label: 'Collections', money: true },
  SALES: { column: 'revenue_closed', label: 'Revenue', money: true },
  MARKETING: { column: 'marketing_spend', label: 'Spend', money: true },
  DEVELOPMENT: null,
};

export function headlineMetric(department) {
  return HEADLINE[department] || null;
}
