import { CircleDollarSign, Upload } from 'lucide-react'
import { useEffect, useState } from 'react'
import DashboardCard from '../components/dashboard/DashboardCard.jsx'
import EmptyState from '../components/dashboard/EmptyState.jsx'
import ErrorState from '../components/dashboard/ErrorState.jsx'
import LoadingState from '../components/dashboard/LoadingState.jsx'
import StatCard from '../components/dashboard/StatCard.jsx'
import { getMyWinnings, submitWinnerProof } from '../services/winnerWorkflow.js'

function Winnings() {
  const [winnings, setWinnings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [uploading, setUploading] = useState('')

  async function loadWinnings() {
    setLoading(true); setError('')
    try { setWinnings(await getMyWinnings()) } catch (loadError) { setError(loadError.message) } finally { setLoading(false) }
  }
  useEffect(() => { let active = true; getMyWinnings().then((data) => { if (active) setWinnings(data) }).catch((loadError) => { if (active) setError(loadError.message) }).finally(() => { if (active) setLoading(false) }); return () => { active = false } }, [])

  async function handleUpload(resultId, file) {
    setUploading(resultId); setMessage('')
    try { await submitWinnerProof(resultId, file); setMessage('Proof submitted. Verification is pending.'); await loadWinnings() } catch (uploadError) { setMessage(uploadError.message) } finally { setUploading('') }
  }

  if (loading) return <LoadingState label="Loading your winnings" />
  if (error) return <ErrorState title="Unable to load your winnings" description="Please try again shortly." onRetry={loadWinnings} />
  const counts = { total: winnings.length, pending: winnings.filter((item) => !item.winner_verifications?.length || item.winner_verifications[0]?.status === 'PENDING').length, paid: winnings.filter((item) => item.payouts?.[0]?.status === 'PAID').length }
  return <div className="space-y-6"><header><p className="text-sm font-semibold text-forest">Payment status</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Winnings</h1><p className="mt-3 max-w-2xl leading-7 text-muted">Proof review is required before any payout can be recorded.</p></header>{message && <p className="rounded-md bg-mint p-3 text-sm text-forest" role="status">{message}</p>}<div className="grid gap-4 sm:grid-cols-3"><StatCard label="Qualifying results" value={counts.total} /><StatCard label="Pending verification" value={counts.pending} /><StatCard label="Paid winnings" value={counts.paid} /></div>{winnings.length === 0 && <EmptyState title="No winnings yet." description="Qualifying published draw results will appear here." />}{winnings.length > 0 && <div className="space-y-4">{winnings.map((item) => <WinnerCard key={item.id} item={item} uploading={uploading === item.id} onUpload={handleUpload} />)}</div>}</div>
}

function WinnerCard({ item, uploading, onUpload }) {
  const verification = item.winner_verifications?.[0]
  const payout = item.payouts?.[0]
  const status = payout?.status === 'PAID' ? 'Paid' : verification?.status === 'APPROVED' ? 'Verified - payout pending' : verification?.status === 'REJECTED' ? 'Proof rejected' : verification ? 'Verification pending' : 'Proof required'
  return <DashboardCard icon={CircleDollarSign} eyebrow={item.draws?.draw_month || 'Published draw'} title={`${item.match_count}-number match`}><div className="grid gap-3 sm:grid-cols-3"><StatCard label="Matched numbers" value={item.matched_numbers?.join(', ') || 'Not available'} /><StatCard label="Prize amount" value={item.prizes?.[0]?.amount_per_winner == null ? 'Not available' : `${item.draws?.currency || ''} ${item.prizes[0].amount_per_winner}`} /><StatCard label="Status" value={status} /></div>{['PENDING', 'REJECTED', undefined].includes(verification?.status) && payout?.status !== 'PAID' && <label className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-md bg-forest px-4 py-2 text-sm font-semibold text-white hover:bg-ink"><Upload size={16} aria-hidden="true" />{uploading ? 'Uploading...' : verification?.status === 'REJECTED' ? 'Resubmit proof' : 'Submit proof'}<input type="file" accept="image/png,image/jpeg,image/webp,application/pdf" disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; if (file) void onUpload(item.id, file); event.target.value = '' }} className="sr-only" /></label>}</DashboardCard>
}

export default Winnings
