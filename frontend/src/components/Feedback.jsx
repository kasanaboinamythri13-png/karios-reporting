// The same loading / error / empty screens on every page.

export function Loading({ label = 'Loading…', full = false }) {
  return (
    <div className={full ? 'loading loading-full' : 'loading'} role="status">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorBanner({ error, onRetry }) {
  if (!error) return null;
  const message = typeof error === 'string' ? error : friendlyMessage(error);
  return (
    <div className="alert alert-error" role="alert">
      <span>{message}</span>
      {onRetry && (
        <button type="button" className="button-secondary button-small" onClick={() => onRetry()}>
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, children }) {
  return (
    <div className="card empty-state">
      <strong>{title}</strong>
      {children && <p className="muted">{children}</p>}
    </div>
  );
}

export function friendlyMessage(error) {
  switch (error?.status) {
    case 403:
      return error.message || "You don't have access to this.";
    case 404:
      return 'Not found. It may have been removed, or it belongs to someone else.';
    case 503:
      return error.message || 'This service is not available right now.';
    default:
      return error?.message || 'Something went wrong.';
  }
}
