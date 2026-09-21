function MetricCard({ label, value, detail }) {
  return <article className="rounded-md border border-line bg-white p-4 shadow-sm"><p className="text-sm text-muted">{label}</p><p className="mt-2 text-2xl font-semibold text-ink">{value}</p>{detail && <p className="mt-1 text-xs text-muted">{detail}</p>}</article>
}
export default MetricCard
