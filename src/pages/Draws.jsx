import { CalendarClock, Hash, Trophy } from 'lucide-react'
import { useEffect, useState } from 'react'
import DashboardCard from '../components/dashboard/DashboardCard.jsx'
import EmptyState from '../components/dashboard/EmptyState.jsx'
import ErrorState from '../components/dashboard/ErrorState.jsx'
import LoadingState from '../components/dashboard/LoadingState.jsx'
import { getMyDrawParticipation, getPublishedDraws } from '../services/draws/index.js'

function Draws() {
  const [draws, setDraws] = useState([])
  const [selected, setSelected] = useState(null)
  const [participation, setParticipation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getPublishedDraws().then((data) => {
      if (!active) return
      setDraws(data)
      setSelected(data[0] || null)
    }).catch((loadError) => {
      if (active) setError(loadError.message)
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!selected) return
    let active = true
    getMyDrawParticipation(selected.id).then((data) => {
      if (active) setParticipation(data)
    }).catch(() => {
      if (active) setParticipation(null)
    })
    return () => { active = false }
  }, [selected])

  if (loading) return <LoadingState label="Loading published draws" />
  if (error) return <ErrorState title="Unable to load draws" description="Please try again shortly." />
  return <div className="space-y-6"><header><p className="text-sm font-semibold text-forest">Draw participation</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Draws</h1><p className="mt-3 max-w-2xl leading-7 text-muted">Only published draw information is visible here. Admin simulations remain private until publication.</p></header>{draws.length === 0 && <EmptyState title="No published draws yet" description="Published monthly draw results will appear here when available." />}{draws.length > 0 && <><div className="flex gap-2 overflow-x-auto">{draws.map((draw) => <button key={draw.id} onClick={() => setSelected(draw)} className={`whitespace-nowrap rounded-md border px-3 py-2 text-sm font-semibold ${selected?.id === draw.id ? 'border-forest bg-mint text-forest' : 'border-line bg-white text-muted'}`}>{draw.draw_month}</button>)}</div><div className="grid gap-4 md:grid-cols-2"><DashboardCard icon={CalendarClock} eyebrow="Published draw" title={selected.draw_month}><p className="text-sm text-muted">Status: {selected.status}</p><p className="mt-2 text-sm text-muted">Winning numbers: {selected.winning_numbers?.join(', ') || 'Not available'}</p></DashboardCard><DashboardCard icon={Hash} eyebrow="Your participation" title={participation?.eligible ? 'Eligible entry' : 'No entry recorded'}>{participation ? <><p className="text-sm text-muted">Entry: {participation.entry_numbers?.join(', ') || 'Not available'}</p>{participation.draw_results?.[0] && <p className="mt-2 font-semibold text-forest">Match count: {participation.draw_results[0].match_count}</p>}</> : <p className="text-sm leading-6 text-muted">Your entry and match result will appear here if you participated.</p>}</DashboardCard></div><DashboardCard icon={Trophy} eyebrow="Prize information" title="Published prize tiers"><p className="text-sm leading-6 text-muted">Prize details become visible from published draw records. Winner verification and payouts are handled in a later phase.</p></DashboardCard></>}</div>
}

export default Draws
