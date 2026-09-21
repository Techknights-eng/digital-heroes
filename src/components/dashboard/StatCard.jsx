function StatCard({ label, value, detail }) {
  return (
    <div className="rounded-md border border-line bg-paper p-4">
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className="mt-2 text-xl font-semibold text-ink">{value}</p>
      {detail && <p className="mt-1 text-sm text-muted">{detail}</p>}
    </div>
  )
}

export default StatCard