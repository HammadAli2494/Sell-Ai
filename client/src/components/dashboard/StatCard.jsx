function StatCard({ label, value, hint }) {
  return (
    <article className="ui-card ui-card-hover min-w-0 p-4">
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted">{label}</p>
      <p className="mt-2 truncate text-2xl font-semibold tracking-tight text-ink">{value}</p>
      {hint ? <p className="mt-1 text-xs text-faint">{hint}</p> : null}
    </article>
  );
}

export default StatCard;
