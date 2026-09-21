import { Pencil, Plus, Trophy, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { addGolfScore, getGolfScores, updateGolfScore } from '../services/golfScores.js'
import EmptyState from '../components/dashboard/EmptyState.jsx'
import ErrorState from '../components/dashboard/ErrorState.jsx'
import LoadingState from '../components/dashboard/LoadingState.jsx'

function Scores() {
  const [scores, setScores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingScore, setEditingScore] = useState(null)

  async function loadScores() {
    setLoading(true)
    setError('')
    try {
      setScores(await getGolfScores())
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    getGolfScores()
      .then((data) => {
        if (active) setScores(data)
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

  function openAddForm() {
    setMessage('')
    setEditingScore(null)
    setFormOpen(true)
  }

  function openEditForm(score) {
    setMessage('')
    setEditingScore(score)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditingScore(null)
  }

  async function handleSave(form) {
    if (editingScore) {
      await updateGolfScore(editingScore.id, form.score, form.scoreDate)
      setMessage('Golf score updated successfully.')
    } else {
      await addGolfScore(form.score, form.scoreDate)
      setMessage('Golf score added successfully.')
    }
    closeForm()
    await loadScores()
  }

  return (
    <div>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-forest">Your score history</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Golf scores</h1>
          <p className="mt-3 max-w-2xl leading-7 text-muted">Maintain your latest five Stableford scores. Each date can have one score, and the newest five are retained.</p>
        </div>
        <button onClick={openAddForm} className="inline-flex items-center gap-2 self-start rounded-md bg-forest px-4 py-2 text-sm font-semibold text-white hover:bg-ink sm:self-auto"><Plus size={17} aria-hidden="true" />Add Score</button>
      </header>

      {message && <p className="mt-5 rounded-md border border-forest/20 bg-mint p-3 text-sm font-medium text-forest" role="status">{message}</p>}
      <section className="mt-6 rounded-md border border-line bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-md bg-mint text-forest"><Trophy size={19} aria-hidden="true" /></span><div><h2 className="font-semibold text-ink">Latest five scores</h2><p className="text-sm text-muted">Newest scores appear first.</p></div></div>
        <div className="mt-5">
          {loading && <LoadingState label="Loading your scores..." />}
          {!loading && error && <ErrorState title="Unable to load your golf scores" description="Please try again. Your existing scores have not been changed." onRetry={loadScores} />}
          {!loading && !error && scores.length === 0 && <EmptyState title="No golf scores yet." description="Add your first Stableford score to start building your score history." action={<button onClick={openAddForm} className="rounded-md bg-forest px-3 py-2 text-sm font-semibold text-white hover:bg-ink">Add Score</button>} />}
          {!loading && !error && scores.length > 0 && <ScoreTable scores={scores} onEdit={openEditForm} />}
        </div>
      </section>

      {formOpen && <ScoreForm score={editingScore} onCancel={closeForm} onSave={handleSave} />}
    </div>
  )
}

function ScoreTable({ scores, onEdit }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[480px] text-left text-sm"><thead className="border-b border-line text-xs uppercase tracking-wide text-muted"><tr><th className="px-3 py-3 font-semibold">Score</th><th className="px-3 py-3 font-semibold">Date</th><th className="px-3 py-3 text-right font-semibold">Actions</th></tr></thead><tbody className="divide-y divide-line">{scores.map((score) => <tr key={score.id}><td className="px-3 py-4 font-semibold text-ink">{score.score}</td><td className="px-3 py-4 text-muted">{formatDate(score.score_date)}</td><td className="px-3 py-4 text-right"><button onClick={() => onEdit(score)} className="inline-flex items-center gap-2 rounded-md px-3 py-2 font-semibold text-forest hover:bg-mint"><Pencil size={16} aria-hidden="true" />Edit</button></td></tr>)}</tbody></table></div>
}

function ScoreForm({ score, onCancel, onSave }) {
  const [form, setForm] = useState({ score: score?.score?.toString() || '', scoreDate: score?.score_date || '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    const numericScore = Number(form.score)
    if (!Number.isInteger(numericScore) || numericScore < 1 || numericScore > 45) {
      setError('Stableford score must be a whole number between 1 and 45.')
      return
    }
    if (!form.scoreDate) {
      setError('Choose a date for this score.')
      return
    }

    setError('')
    setSaving(true)
    try {
      await onSave({ score: numericScore, scoreDate: form.scoreDate })
    } catch (saveError) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  return <div className="fixed inset-0 z-30 grid place-items-center bg-ink/40 p-4" role="presentation"><div className="w-full max-w-md rounded-md border border-line bg-white p-6 shadow-xl" role="dialog" aria-modal="true" aria-labelledby="score-form-title"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-forest">Score history</p><h2 id="score-form-title" className="mt-1 text-2xl font-semibold text-ink">{score ? 'Edit score' : 'Add score'}</h2></div><button onClick={onCancel} className="grid size-9 place-items-center rounded-md text-muted hover:bg-paper hover:text-ink" aria-label="Close score form"><X size={19} aria-hidden="true" /></button></div><form onSubmit={handleSubmit} className="mt-6 space-y-5"><label className="block text-sm font-medium text-ink"><span className="mb-2 block">Stableford score</span><input required type="number" min="1" max="45" step="1" inputMode="numeric" value={form.score} onChange={(event) => setForm({ ...form, score: event.target.value })} className="w-full rounded-md border border-line bg-paper px-3 py-3 outline-none focus:border-forest focus:ring-2 focus:ring-mint" /></label><label className="block text-sm font-medium text-ink"><span className="mb-2 block">Score date</span><input required type="date" value={form.scoreDate} onChange={(event) => setForm({ ...form, scoreDate: event.target.value })} className="w-full rounded-md border border-line bg-paper px-3 py-3 outline-none focus:border-forest focus:ring-2 focus:ring-mint" /></label>{error && <p className="rounded-md border border-coral/30 bg-coral/10 p-3 text-sm text-ink" role="alert">{error}</p>}<div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" onClick={onCancel} className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink hover:border-forest hover:text-forest">Cancel</button><button disabled={saving} className="rounded-md bg-forest px-4 py-2 text-sm font-semibold text-white hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'Saving...' : score ? 'Save changes' : 'Add Score'}</button></div></form></div></div>
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`))
}

export default Scores
