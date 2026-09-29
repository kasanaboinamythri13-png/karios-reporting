// IDs in the database are UUIDs. Checking the format first means a bad id in the URL
// becomes a clean 404 instead of a PostgreSQL "invalid input syntax for type uuid" 500 error.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value) {
  return typeof value === 'string' && UUID_RE.test(value);
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isDateString(value) {
  return typeof value === 'string' && DATE_RE.test(value) && !Number.isNaN(Date.parse(value));
}
