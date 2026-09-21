function BarChart({ title, items, valueKey = 'value', labelKey = 'label', formatter = (value) => value }) {
  const max = Math.max(...items.map((item) => Number(item[valueKey] || 0)), 1)
  return <section className="rounded-md border border-line bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold text-ink">{title}</h2>{items.length === 0 ? <p className="mt-4 text-sm text-muted">No data available for the selected period.</p> : <div className="mt-5 space-y-4">{items.map((item) => <div key={String(item[labelKey])}><div className="flex justify-between gap-3 text-sm"><span className="truncate text-muted">{item[labelKey]}</span><span className="font-semibold text-ink">{formatter(item[valueKey])}</span></div><div className="mt-2 h-2 rounded-full bg-paper"><div className="h-2 rounded-full bg-forest" style={{ width: `${Math.max(Number(item[valueKey] || 0) / max * 100, item[valueKey] ? 3 : 0)}%` }} /></div></div>)}</div>}</section>
}
export default BarChart
