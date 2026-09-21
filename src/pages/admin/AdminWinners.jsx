import { Check, ExternalLink, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import DashboardCard from '../../components/dashboard/DashboardCard.jsx'
import EmptyState from '../../components/dashboard/EmptyState.jsx'
import ErrorState from '../../components/dashboard/ErrorState.jsx'
import LoadingState from '../../components/dashboard/LoadingState.jsx'
import { getAdminWinners, runWinnerWorkflow } from '../../services/winnerWorkflow.js'

function AdminWinners() {
  const [winners, setWinners] = useState([])
  const [filter, setFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [working, setWorking] = useState('')

  async function loadWinners() {
    setLoading(true)
    setError('')
    try {
      setWinners(await getAdminWinners())
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    getAdminWinners()
      .then((data) => {
        if (active) setWinners(data)
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

  async function review(action, id) {
    setWorking(id)
    setMessage('')
    try {
      await runWinnerWorkflow(action, { verification_id: id })
      setMessage(action === 'approve' ? 'Winner proof approved.' : 'Winner proof rejected.')
      await loadWinners()
    } catch (workflowError) {
      setMessage(workflowError.message)
    } finally {
      setWorking('')
    }
  }

  const visible = filter === 'ALL' ? winners : winners.filter((winner) => winner.status === filter)

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-coral">Admin workspace</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Winner verification</h1>
        <p className="mt-3 max-w-2xl leading-7 text-muted">Review private proof submissions. Approval creates a pending payout from the finalized prize amount.</p>
      </header>

      <div className="flex flex-wrap gap-2">
        {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => (
          <button key={status} onClick={() => setFilter(status)} className={`rounded-md border px-3 py-2 text-sm font-semibold ${filter === status ? 'border-forest bg-mint text-forest' : 'border-line bg-white text-muted'}`}>{status}</button>
        ))}
      </div>

      {message && <p className="rounded-md bg-mint p-3 text-sm text-forest" role="status">{message}</p>}
      {loading && <LoadingState label="Loading winner verifications" />}
      {!loading && error && <ErrorState title="Unable to load winners" description={error} onRetry={loadWinners} />}
      {!loading && !error && visible.length === 0 && <EmptyState title="No winner verifications" description="No records match this filter." />}
      {!loading && !error && visible.length > 0 && (
        <div className="space-y-4">
          {visible.map((winner) => (
            <DashboardCard key={winner.id} title={`${winner.draw_results?.draws?.draw_month || 'Draw'} - ${winner.draw_results?.match_count || 0}-number match`} eyebrow={winner.status}>
              <div className="grid gap-3 sm:grid-cols-3">
                <Info label="Winner ID" value={winner.user_id} />
                <Info label="Prize" value={winner.draw_results?.prize?.amount_per_winner ?? 'Not available'} />
                <Info label="Submitted" value={formatDate(winner.created_at)} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {winner.proof_url && <button onClick={async () => { try { const result = await runWinnerWorkflow('proof_url', { verification_id: winner.id }); window.open(result.url, '_blank', 'noopener,noreferrer') } catch (workflowError) { setMessage(workflowError.message) } }} className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink"><ExternalLink size={16} aria-hidden="true" />Open proof</button>}
                {winner.status === 'PENDING' && (
                  <>
                    <button disabled={working === winner.id} onClick={() => void review('approve', winner.id)} className="inline-flex items-center gap-2 rounded-md bg-forest px-3 py-2 text-sm font-semibold text-white"><Check size={16} aria-hidden="true" />Approve</button>
                    <button disabled={working === winner.id} onClick={() => void review('reject', winner.id)} className="inline-flex items-center gap-2 rounded-md border border-coral px-3 py-2 text-sm font-semibold text-coral"><X size={16} aria-hidden="true" />Reject</button>
                  </>
                )}
              </div>
              {winner.admin_notes && <p className="mt-4 text-sm text-muted">Admin notes: {winner.admin_notes}</p>}
            </DashboardCard>
          ))}
        </div>
      )}
    </div>
  )
}

function Info({ label, value }) {
  return <div className="rounded-md border border-line bg-paper p-3"><p className="text-xs uppercase tracking-wide text-muted">{label}</p><p className="mt-1 truncate text-sm font-semibold text-ink">{value}</p></div>
}

function formatDate(value) {
  return value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value)) : 'Not available'
}

export default AdminWinners
