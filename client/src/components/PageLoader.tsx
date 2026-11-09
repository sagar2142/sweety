export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
