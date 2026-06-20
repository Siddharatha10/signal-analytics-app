import "./StatusStates.css";

export function LoadingState({ label = "Loading data" }) {
  return (
    <div className="status-state status-state--loading">
      <span className="status-state__spinner" aria-hidden="true" />
      <span>{label}…</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="status-state status-state--error">
      <p>Couldn't load this data.</p>
      <p className="status-state__detail">{message}</p>
      {onRetry && (
        <button className="status-state__retry" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, detail }) {
  return (
    <div className="status-state status-state--empty">
      <p className="status-state__title">{title}</p>
      {detail && <p className="status-state__detail">{detail}</p>}
    </div>
  );
}
