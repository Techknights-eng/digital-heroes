import { useEffect, useState } from 'react'
import DashboardCard from '../../components/dashboard/DashboardCard.jsx'
import EmptyState from '../../components/dashboard/EmptyState.jsx'
import ErrorState from '../../components/dashboard/ErrorState.jsx'
import LoadingState from '../../components/dashboard/LoadingState.jsx'
import { getAdminPayouts, runWinnerWorkflow } from '../../services/winnerWorkflow.js'

function AdminPayouts() {
  const [payouts, setPayouts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [reference, setReference] = useState({})

  async function loadPayouts() {
    setLoading(true)
    setError('')
    try {
      setPayouts(await getAdminPayouts())
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    getAdminPayouts()
      .then((data) => {
        if (active) setPayouts(data)
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

  async function markPaid(id) {
    setMessage('')
    try {
      await runWinnerWorkflow('mark_paid', { payout_id: id, payment_reference: reference[id] || '' })
      setMessage('Payout marked paid.')
      await loadPayouts()
    } catch (workflowError) {
      setMessage(workflowError.message)
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-coral">Admin workspace</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Payouts</h1>
        <p className="mt-3 max-w-2xl leading-7 text-muted">Record externally completed payouts only after winner verification is approved. No transfer is initiated here.</p>
      </header>

      {message && <p className="rounded-md bg-mint p-3 text-sm text-forest" role="status">{message}</p>}
      {loading && <LoadingState label="Loading payouts" />}
      {!loading && error && <ErrorState title="Unable to load payouts" description={error} onRetry={loadPayouts} />}
      {!loading && !error && payouts.length === 0 && <EmptyState title="No payouts yet" description="Approved winner verifications will create pending payout records." />}
      {!loading && !error && payouts.length > 0 && (
        <div className="space-y-4">
          {payouts.map((payout) => (
            <DashboardCard key={payout.id} title={`${payout.winner_verifications?.draw_results?.draws?.draw_month || 'Draw'} - ${payout.winner_verifications?.draw_results?.match_count || 0}-number match`} eyebrow={payout.status}>
              <div className="grid gap-3 sm:grid-cols-3">
                <Info label="Winner" value={payout.user_id} />
                <Info label="Amount" value={`${payout.currency || ''} ${payout.amount}`} />
                <Info label="Verification" value={payout.winner_verifications?.status || 'Not available'} />
              </div>
              {payout.status === 'PENDING' && payout.winner_verifications?.status === 'APPROVED' && (
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <input required placeholder="External payment reference" value={reference[payout.id] || ''} onChange={(event) => setReference({ ...reference, [payout.id]: event.target.value })} className="rounded-md border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-forest focus:ring-2 focus:ring-mint" />
                  <button onClick={() => void markPaid(payout.id)} className="rounded-md bg-forest px-4 py-2 text-sm font-semibold text-white">Mark paid</button>
                </div>
              )}
              {payout.payment_reference && <p className="mt-3 text-sm text-muted">Reference: {payout.payment_reference}</p>}
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

export default AdminPayouts
