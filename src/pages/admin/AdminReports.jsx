import { Download, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import BarChart from '../../components/reports/BarChart.jsx'
import MetricCard from '../../components/reports/MetricCard.jsx'
import ErrorState from '../../components/dashboard/ErrorState.jsx'
import LoadingState from '../../components/dashboard/LoadingState.jsx'
import { formatDate, formatInr, getAdminReport } from '../../services/adminReports.js'

const emptyReport = { overview: {}, subscriptions: {}, revenue: {}, charity: {}, draws: {}, winners: {}, payouts: {}, tables: {} }

function AdminReports() {
  const [filters, setFilters] = useState({ from: '', to: '', subscriptionStatus: '', charity: '', draw: '', payoutStatus: '' })
  const [report, setReport] = useState(emptyReport)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadReport(nextFilters = filters) {
    setLoading(true); setError('')
    try { setReport(await getAdminReport(nextFilters)) } catch (loadError) { setError(loadError.message) } finally { setLoading(false) }
  }
  useEffect(() => {
    let active = true
    getAdminReport()
      .then((data) => {
        if (active) setReport(data)
      })
      .catch((loadError) => {
        if (active) setError(loadError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])
  function update(key, value) { const next = { ...filters, [key]: value }; setFilters(next); void loadReport(next) }
  if (loading) return <LoadingState label="Loading analytics..." />
  if (error) return <ErrorState title="Unable to load analytics" description="Please try again." onRetry={() => loadReport()} />
  const overview = report.overview || {}
  const revenueInr = report.revenue?.paid?.INR ?? 0
  const paidPayoutInr = report.payouts?.paidAmounts?.INR ?? 0
  const charityInr = report.charity?.amount?.INR ?? 0
  const exportRows = report.tables?.payments || []
  return <div className="space-y-8"><header><p className="text-sm font-semibold text-coral">Admin workspace</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Reports & analytics</h1><p className="mt-3 max-w-3xl leading-7 text-muted">Read-only operational summaries from subscriptions, payments, charities, draws, winners, and payouts. Amount-based metrics use recorded INR values only.</p></header><section className="rounded-md border border-line bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold text-ink">Filters</h2><button onClick={() => void loadReport()} className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink"><RefreshCw size={15} aria-hidden="true" />Refresh</button></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6"><Filter label="From" type="date" value={filters.from} onChange={(value) => setFilters({ ...filters, from: value })} /><Filter label="To" type="date" value={filters.to} onChange={(value) => setFilters({ ...filters, to: value })} /><Select label="Subscription" value={filters.subscriptionStatus} onChange={(value) => update('subscriptionStatus', value)} options={['', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED']} /><Select label="Payout" value={filters.payoutStatus} onChange={(value) => update('payoutStatus', value)} options={['', 'PENDING', 'PAID']} /><button onClick={() => void loadReport()} className="self-end rounded-md bg-forest px-3 py-2 text-sm font-semibold text-white">Apply dates</button><button onClick={() => downloadCsv(exportRows)} className="inline-flex items-center justify-center gap-2 self-end rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink"><Download size={15} aria-hidden="true" />Export payments</button></div></section><section><h2 className="mb-4 text-xl font-semibold text-ink">Overview</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5"><MetricCard label="Registered users" value={overview.totalUsers ?? 0} /><MetricCard label="Active subscribers" value={overview.activeSubscribers ?? 0} /><MetricCard label="Inactive / expired" value={overview.inactiveSubscribers ?? 0} /><MetricCard label="Paid revenue" value={formatInr(revenueInr)} /><MetricCard label="Paid payouts" value={formatInr(paidPayoutInr)} /></div><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5"><MetricCard label="Charity amounts recorded" value={charityInr ? formatInr(charityInr) : 'Not available'} detail="Uses stored contribution amounts" /><MetricCard label="Draws" value={overview.drawCount ?? 0} /><MetricCard label="Winners" value={overview.winnerCount ?? 0} /><MetricCard label="Pending verification" value={overview.pendingVerifications ?? 0} /><MetricCard label="Pending payouts" value={overview.pendingPayouts ?? 0} /></div></section><section><h2 className="mb-4 text-xl font-semibold text-ink">Subscribers & subscriptions</h2><div className="grid gap-4 lg:grid-cols-2"><BarChart title="Subscribers by plan" items={Object.entries(report.subscriptions?.byPlan || {}).map(([label, value]) => ({ label, value }))} /><BarChart title="Subscription states" items={[['ACTIVE', report.subscriptions?.active], ['PAST_DUE', report.subscriptions?.pastDue], ['CANCELLED', report.subscriptions?.cancelled], ['EXPIRED', report.subscriptions?.expired]].map(([label, value]) => ({ label, value: value || 0 }))} /></div></section><section><h2 className="mb-4 text-xl font-semibold text-ink">Charity contributions</h2><div className="grid gap-4 lg:grid-cols-2"><BarChart title="Contributions by charity" items={(report.charity?.byCharity || []).map((item) => ({ label: item.charity, value: item.amount }))} formatter={formatInr} /><BarChart title="Contributors by charity" items={(report.charity?.byCharity || []).map((item) => ({ label: item.charity, value: item.contributors }))} /></div></section><section><h2 className="mb-4 text-xl font-semibold text-ink">Draws, winners & payouts</h2><div className="grid gap-4 lg:grid-cols-3"><BarChart title="Winners by match tier" items={Object.entries(report.winners?.byTier || {}).map(([label, value]) => ({ label: `${label} match`, value }))} /><BarChart title="Prize pools by draw" items={(report.draws?.prizePools || []).map((item) => ({ label: item.drawMonth, value: item.prizePool || 0 }))} formatter={formatInr} /><BarChart title="Payout state" items={[['PENDING', report.payouts?.pending], ['PAID', report.payouts?.paid]].map(([label, value]) => ({ label, value: value || 0 }))} /></div><p className="mt-4 text-sm text-muted">Yearly revenue and prize-pool contribution percentages are not configured unless recorded in the database.</p></section><section><h2 className="mb-4 text-xl font-semibold text-ink">Recent payments</h2><ReportTable rows={report.tables?.payments || []} columns={[['status', 'Status'], ['amount', 'Amount'], ['currency', 'Currency'], ['paid_at', 'Paid date']]} /></section></div>
}

function Filter({ label, type, value, onChange }) { return <label className="block text-sm font-medium text-ink"><span className="mb-1 block">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-md border border-line bg-paper px-2 py-2 text-sm" /></label> }
function Select({ label, value, onChange, options }) { return <label className="block text-sm font-medium text-ink"><span className="mb-1 block">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-md border border-line bg-paper px-2 py-2 text-sm">{options.map((option) => <option key={option} value={option}>{option || 'All'}</option>)}</select></label> }
function ReportTable({ rows, columns }) { if (!rows.length) return <p className="rounded-md border border-dashed border-line bg-paper p-6 text-sm text-muted">No data available for the selected period.</p>; return <div className="overflow-x-auto rounded-md border border-line bg-white"><table className="w-full min-w-[600px] text-left text-sm"><thead className="border-b border-line text-xs uppercase tracking-wide text-muted"><tr>{columns.map(([, label]) => <th key={label} className="px-3 py-3">{label}</th>)}</tr></thead><tbody className="divide-y divide-line">{rows.map((row, index) => <tr key={row.id || index}>{columns.map(([key]) => <td key={key} className="px-3 py-3 text-muted">{key.includes('date') || key === 'paid_at' ? formatDate(row[key]) : key === 'amount' ? formatInr(row[key]) : row[key] ?? 'Not available'}</td>)}</tr>)}</tbody></table></div> }
function downloadCsv(rows) { const columns = ['id', 'user_id', 'amount', 'currency', 'status', 'paid_at']; const csv = [columns.join(','), ...rows.map((row) => columns.map((key) => JSON.stringify(row[key] ?? '')).join(','))].join('\n'); const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); const link = document.createElement('a'); link.href = url; link.download = 'digital-heroes-payments.csv'; link.click(); URL.revokeObjectURL(url) }
export default AdminReports
