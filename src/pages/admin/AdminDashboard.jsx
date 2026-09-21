import { BarChart3, CircleDollarSign, HeartHandshake, ShieldCheck, Trophy, UsersRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import DashboardCard from '../../components/dashboard/DashboardCard.jsx'
import LoadingState from '../../components/dashboard/LoadingState.jsx'
import ErrorState from '../../components/dashboard/ErrorState.jsx'
import MetricCard from '../../components/reports/MetricCard.jsx'
import { formatInr, getAdminReport } from '../../services/adminReports.js'
import { useAuth } from '../../context/AuthContextValue.js'

function AdminDashboard() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [error, setError] = useState('')
  async function loadReport() {
    setError('')
    try {
      setReport(await getAdminReport())
    } catch (loadError) {
      setError(loadError.message)
    }
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
    return () => {
      active = false
    }
  }, [])
  async function handleSignOut() { try { await signOut(); navigate('/login', { replace: true }) } catch (signOutError) { setError(signOutError.message) } }
  if (error) return <ErrorState title="Unable to load admin summary" description={error} onRetry={loadReport} />
  if (!report) return <LoadingState label="Loading admin summary" />
  const overview = report.overview || {}
  return <div className="space-y-6"><header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold text-coral">Admin workspace</p><h1 className="mt-2 text-3xl font-semibold text-ink">Welcome, {profile?.full_name || 'Admin'}</h1><p className="mt-2 text-muted">A concise view of current operations.</p></div><button onClick={handleSignOut} className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink hover:border-coral hover:text-coral">Log out</button></header><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><MetricCard label="Active subscribers" value={overview.activeSubscribers ?? 0} /><MetricCard label="Pending verifications" value={overview.pendingVerifications ?? 0} /><MetricCard label="Pending payouts" value={overview.pendingPayouts ?? 0} /><MetricCard label="Paid payouts" value={overview.paidPayouts ?? 0} /><MetricCard label="Recorded charity amounts" value={overview.totalCharityContributionAmount?.INR ? formatInr(overview.totalCharityContributionAmount.INR) : 'Not available'} /><MetricCard label="Draws" value={overview.drawCount ?? 0} /></div><DashboardCard title="Operations" description="Use the focused workspaces for administration and the reports page for read-only analytics." /><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><AdminLink icon={UsersRound} label="Manage users" to="/admin/users" /><AdminLink icon={CircleDollarSign} label="Subscriptions" to="/admin/subscriptions" /><AdminLink icon={HeartHandshake} label="Charities" to="/admin/charities" /><AdminLink icon={Trophy} label="Draws" to="/admin/draws" /><AdminLink icon={ShieldCheck} label="Winners" to="/admin/winners" /><AdminLink icon={CircleDollarSign} label="Payouts" to="/admin/payouts" /><AdminLink icon={BarChart3} label="Reports" to="/admin/reports" /></div></div>
}

function AdminLink({ icon: Icon, label, to }) { return <Link to={to} className="flex items-center gap-3 rounded-md border border-line bg-white p-4 text-sm font-semibold text-ink shadow-sm hover:border-forest hover:text-forest"><Icon size={18} aria-hidden="true" />{label}</Link> }
export default AdminDashboard
