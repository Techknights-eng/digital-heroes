import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import DashboardCard from '../../components/dashboard/DashboardCard.jsx'
import EmptyState from '../../components/dashboard/EmptyState.jsx'
import ErrorState from '../../components/dashboard/ErrorState.jsx'
import LoadingState from '../../components/dashboard/LoadingState.jsx'
import { getAdminDraw } from '../../services/draws/index.js'

function AdminDrawDetail() {
  const { id } = useParams()
  const [draw, setDraw] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getAdminDraw(id).then((data) => { if (active) setDraw(data) }).catch((loadError) => { if (active) setError(loadError.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])

  if (loading) return <LoadingState label="Loading draw details" />
  if (error) return <ErrorState title="Unable to load draw details" description="Please try again shortly." />
  if (!draw) return <EmptyState title="Draw not found" description="This draw is unavailable." action={<Link to="/admin/draws" className="rounded-md bg-forest px-3 py-2 text-sm font-semibold text-white">Back to draws</Link>} />

  const prizes = draw.prizes || []
  return <div className="space-y-6"><header><Link to="/admin/draws" className="text-sm font-semibold text-forest hover:text-ink">Back to draws</Link><h1 className="mt-3 text-3xl font-semibold text-ink">Draw {draw.draw_month}</h1><p className="mt-2 text-muted">{draw.draw_type} · {draw.status}</p></header><DashboardCard title="Draw information"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Info label="Active subscribers" value={draw.active_subscriber_count ?? 0} /><Info label="Prize pool" value={draw.prize_pool == null ? 'Not configured' : `${draw.currency || ''} ${draw.prize_pool}`} /><Info label="Rollover" value={draw.jackpot_rollover == null ? 'Not configured' : `${draw.currency || ''} ${draw.jackpot_rollover}`} /><Info label="Winning numbers" value={draw.winning_numbers?.join(', ') || 'Not published'} /></div></DashboardCard><DashboardCard title="Prize table">{prizes.length === 0 ? <EmptyState title="No prize data" description="Prize data will appear after a completed simulation." /> : <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead className="border-b border-line text-xs uppercase tracking-wide text-muted"><tr><th className="px-3 py-3">Tier</th><th className="px-3 py-3">Pool %</th><th className="px-3 py-3">Pool amount</th><th className="px-3 py-3">Winners</th><th className="px-3 py-3">Amount / winner</th></tr></thead><tbody className="divide-y divide-line">{prizes.map((prize) => <tr key={prize.id}><td className="px-3 py-4 font-semibold text-ink">{prize.tier} Match</td><td className="px-3 py-4 text-muted">{prize.pool_percentage}%</td><td className="px-3 py-4 text-muted">{prize.pool_amount}</td><td className="px-3 py-4 text-muted">{prize.winner_count}</td><td className="px-3 py-4 text-muted">{prize.amount_per_winner}</td></tr>)}</tbody></table></div>}</DashboardCard><DashboardCard title="Eligible entries"><p className="text-sm text-muted">{draw.draw_entries?.length || 0} entries stored. Entry numbers are not editable from the admin UI.</p></DashboardCard></div>
}

function Info({ label, value }) {
  return <div className="rounded-md border border-line bg-paper p-4"><p className="text-sm text-muted">{label}</p><p className="mt-2 font-semibold text-ink">{value}</p></div>
}

export default AdminDrawDetail
