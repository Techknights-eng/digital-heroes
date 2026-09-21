import { HeartHandshake } from 'lucide-react'
import { useEffect, useState } from 'react'
import CharitySelector from '../components/charity/CharitySelector.jsx'
import ContributionPercentage from '../components/charity/ContributionPercentage.jsx'
import DashboardCard from '../components/dashboard/DashboardCard.jsx'
import EmptyState from '../components/dashboard/EmptyState.jsx'
import ErrorState from '../components/dashboard/ErrorState.jsx'
import LoadingState from '../components/dashboard/LoadingState.jsx'
import { getActiveCharities, getMyCharityContribution, selectCharity } from '../services/charities.js'

function Charity() {
  const [contribution, setContribution] = useState(null)
  const [charities, setCharities] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [percentage, setPercentage] = useState(10)
  const [choosing, setChoosing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [message, setMessage] = useState('')

  async function loadPage() {
    setLoading(true)
    setError('')
    try {
      const [currentContribution, activeCharities] = await Promise.all([getMyCharityContribution(), getActiveCharities()])
      setContribution(currentContribution)
      setCharities(activeCharities)
      setSelectedId(currentContribution?.charity_id || '')
      setPercentage(Math.max(10, Math.min(100, currentContribution?.percentage || 10)))
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    Promise.all([getMyCharityContribution(), getActiveCharities()]).then(([currentContribution, activeCharities]) => {
      if (!active) return
      setContribution(currentContribution)
      setCharities(activeCharities)
      setSelectedId(currentContribution?.charity_id || '')
      setPercentage(Math.max(10, Math.min(100, currentContribution?.percentage || 10)))
    }).catch((loadError) => {
      if (active) setError(loadError.message)
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [])

  async function handleSave() {
    if (!selectedId) {
      setSaveError('Choose an active charity first.')
      return
    }
    setSaving(true)
    setSaveError('')
    setMessage('')
    try {
      await selectCharity(selectedId, percentage)
      await loadPage()
      setChoosing(false)
      setMessage('Charity selection saved successfully.')
    } catch (saveFailure) {
      setSaveError(saveFailure.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingState label="Loading your charity selection" />
  if (error) return <ErrorState title="Unable to load your charity selection" description="Please try again shortly." onRetry={loadPage} />

  const selectedCharity = contribution?.charities
  return <div className="space-y-6"><header><p className="text-sm font-semibold text-forest">Your impact</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">My charity</h1><p className="mt-3 max-w-2xl leading-7 text-muted">Choose an active charity and set the percentage of your subscription contribution.</p></header>{message && <p className="rounded-md border border-forest/20 bg-mint p-3 text-sm font-medium text-forest" role="status">{message}</p>}{!selectedCharity && !choosing && <DashboardCard icon={HeartHandshake} eyebrow="Selected charity" title="No charity selected yet."><EmptyState title="Choose a charity" description="Select an active charity to connect it to your subscriber account." action={<button onClick={() => setChoosing(true)} className="rounded-md bg-forest px-4 py-2 text-sm font-semibold text-white hover:bg-ink">Choose a charity</button>} /></DashboardCard>}{selectedCharity && !choosing && <DashboardCard icon={HeartHandshake} eyebrow="Current charity" title={selectedCharity.name}><div className="grid gap-5 md:grid-cols-[160px_1fr]"><div className="aspect-square rounded-md bg-paper">{selectedCharity.image_url && <img src={selectedCharity.image_url} alt="" className="size-full rounded-md object-cover" />}</div><div><p className="leading-7 text-muted">{selectedCharity.description || 'Charity description coming soon.'}</p><p className="mt-4 text-sm font-semibold text-forest">Contribution: {contribution.percentage}%</p><p className="mt-2 text-sm text-muted">{contribution.amount == null ? 'Contribution amount pending subscription data.' : `${contribution.currency || ''} ${contribution.amount}`}</p><button onClick={() => setChoosing(true)} className="mt-5 rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink hover:border-forest hover:text-forest">Change charity</button></div></div></DashboardCard>}{choosing && <section className="rounded-md border border-line bg-white p-5 shadow-sm"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-xl font-semibold text-ink">Choose an active charity</h2><p className="mt-1 text-sm text-muted">Your selection is saved to your subscriber account.</p></div><button onClick={() => setChoosing(false)} className="text-sm font-semibold text-muted hover:text-ink">Cancel</button></div><div className="mt-5"><CharitySelector charities={charities} selectedId={selectedId} onSelect={setSelectedId} /></div><div className="mt-6 max-w-md"><ContributionPercentage value={percentage} onChange={setPercentage} />{saveError && <p className="mt-4 rounded-md border border-coral/30 bg-coral/10 p-3 text-sm text-ink" role="alert">{saveError}</p>}<button onClick={handleSave} disabled={saving} className="mt-5 rounded-md bg-forest px-4 py-2 text-sm font-semibold text-white hover:bg-ink disabled:opacity-60">{saving ? 'Saving...' : 'Save selection'}</button></div></section>}</div>
}

export default Charity
