import { Plus, Play, Send, Settings2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../../components/dashboard/EmptyState.jsx'
import ErrorState from '../../components/dashboard/ErrorState.jsx'
import LoadingState from '../../components/dashboard/LoadingState.jsx'
import { getAdminDraws, runAdminDrawOperation } from '../../services/draws/index.js'

function AdminDraws() {
  const [draws, setDraws] = useState([])
  const [month, setMonth] = useState('')
  const [type, setType] = useState('RANDOM')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [working, setWorking] = useState('')

  async function loadDraws() {
    setLoading(true)
    setError('')
    try { setDraws(await getAdminDraws()) } catch (loadError) { setError(loadError.message) } finally { setLoading(false) }
  }

  useEffect(() => {
    let active = true
    getAdminDraws().then((data) => { if (active) setDraws(data) }).catch((loadError) => { if (active) setError(loadError.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  async function operate(action, drawId, successMessage) {
    setWorking(`${action}:${drawId}`)
    setMessage('')
    try { await runAdminDrawOperation(action, { draw_id: drawId }); setMessage(successMessage); await loadDraws() } catch (operationError) { setMessage(operationError.message) } finally { setWorking('') }
  }

  async function createDraw(event) {
    event.preventDefault()
    setWorking('create')
    setMessage('')
    try { await runAdminDrawOperation('create', { draw_month: month, draw_type: type }); setMonth(''); setMessage('Draw draft created.'); await loadDraws() } catch (operationError) { setMessage(operationError.message) } finally { setWorking('') }
  }

  return <div className="space-y-6"><header><p className="text-sm font-semibold text-coral">Admin workspace</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Draw management</h1><p className="mt-3 max-w-2xl leading-7 text-muted">Create and operate monthly draw drafts. Number range, score transformation, eligibility cutoff, prize-pool percentage, and rollover policy remain explicitly unconfigured.</p></header><section className="rounded-md border border-line bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><Settings2 className="text-coral" size={20} aria-hidden="true" /><h2 className="font-semibold text-ink">Configuration required</h2></div><p className="mt-3 text-sm leading-6 text-muted">Entry generation and simulation stay blocked until the unresolved PRD rules are configured server-side. Draft creation is available for planning.</p><form onSubmit={createDraw} className="mt-5 flex flex-col gap-3 sm:flex-row"><input required pattern="\d{4}-\d{2}" placeholder="YYYY-MM" value={month} onChange={(event) => setMonth(event.target.value)} className="rounded-md border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-forest focus:ring-2 focus:ring-mint" /><select value={type} onChange={(event) => setType(event.target.value)} className="rounded-md border border-line bg-paper px-3 py-2 text-sm"><option value="RANDOM">Random</option><option value="ALGORITHMIC">Algorithmic</option></select><button disabled={working === 'create'} className="inline-flex items-center justify-center gap-2 rounded-md bg-forest px-4 py-2 text-sm font-semibold text-white hover:bg-ink disabled:opacity-60"><Plus size={16} aria-hidden="true" />Create draft</button></form></section>{message && <p className="rounded-md bg-mint p-3 text-sm text-forest" role="status">{message}</p>}{loading && <LoadingState label="Loading draw management" />}{!loading && error && <ErrorState title="Unable to load draws" description="Please try again shortly." onRetry={loadDraws} />}{!loading && !error && draws.length === 0 && <EmptyState title="No draw drafts yet" description="Create a monthly draw draft to begin the admin workflow." />}{!loading && !error && draws.length > 0 && <section className="overflow-x-auto rounded-md border border-line bg-white shadow-sm"><table className="w-full min-w-[900px] text-left text-sm"><thead className="border-b border-line text-xs uppercase tracking-wide text-muted"><tr><th className="px-4 py-3">Month</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Subscribers</th><th className="px-4 py-3">Prize pool</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-line">{draws.map((draw) => <tr key={draw.id}><td className="px-4 py-4 font-semibold text-ink"><Link to={`/admin/draws/${draw.id}`} className="hover:text-forest">{draw.draw_month}</Link></td><td className="px-4 py-4 text-muted">{draw.draw_type}</td><td className="px-4 py-4 text-muted">{draw.status}</td><td className="px-4 py-4 text-muted">{draw.active_subscriber_count ?? 0}</td><td className="px-4 py-4 text-muted">{draw.prize_pool == null ? 'Not configured' : `${draw.currency || ''} ${draw.prize_pool}`}</td><td className="px-4 py-4 text-right"><div className="flex justify-end gap-2">{draw.status === 'DRAFT' && <button onClick={() => operate('generate_entries', draw.id, 'Entries generated.')} disabled={working === `generate_entries:${draw.id}`} className="inline-flex items-center gap-1 rounded-md px-2 py-2 font-semibold text-forest hover:bg-mint"><Plus size={15} aria-hidden="true" />Entries</button>}{draw.status === 'DRAFT' && <button onClick={() => operate('simulate', draw.id, 'Simulation completed.')} disabled={working === `simulate:${draw.id}`} className="inline-flex items-center gap-1 rounded-md px-2 py-2 font-semibold text-forest hover:bg-mint"><Play size={15} aria-hidden="true" />Simulate</button>}{draw.status === 'SIMULATED' && <button onClick={() => operate('publish', draw.id, 'Draw published.')} disabled={working === `publish:${draw.id}`} className="inline-flex items-center gap-1 rounded-md px-2 py-2 font-semibold text-forest hover:bg-mint"><Send size={15} aria-hidden="true" />Publish</button>}</div></td></tr>)}</tbody></table></section>}</div>
}

export default AdminDraws
