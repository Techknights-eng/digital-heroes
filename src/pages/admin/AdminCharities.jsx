import { Pencil, Plus, Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import ErrorState from '../../components/dashboard/ErrorState.jsx'
import LoadingState from '../../components/dashboard/LoadingState.jsx'
import { createCharity, getAdminCharities, updateCharity } from '../../services/charities.js'

const blank = { name: '', description: '', image_url: '', website_url: '', is_active: true, is_featured: false }

function AdminCharities() {
  const [charities, setCharities] = useState([])
  const [form, setForm] = useState(blank)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function loadCharities() {
    setLoading(true)
    setError('')
    try {
      setCharities(await getAdminCharities())
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    getAdminCharities().then((data) => {
      if (active) setCharities(data)
    }).catch((loadError) => {
      if (active) setError(loadError.message)
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [])

  function startEdit(charity) {
    setEditingId(charity.id)
    setForm({ name: charity.name || '', description: charity.description || '', image_url: charity.image_url || '', website_url: charity.website_url || '', is_active: charity.is_active, is_featured: charity.is_featured })
    setMessage('')
  }

  function resetForm() {
    setEditingId(null)
    setForm(blank)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!form.name.trim()) return setMessage('Charity name is required.')
    setSaving(true)
    setMessage('')
    try {
      if (editingId) await updateCharity(editingId, form)
      else await createCharity(form)
      resetForm()
      await loadCharities()
      setMessage('Charity saved successfully.')
    } catch (saveError) {
      setMessage(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  return <div className="space-y-6"><header><p className="text-sm font-semibold text-coral">Admin workspace</p><h1 className="mt-2 text-3xl font-semibold text-ink">Charity management</h1><p className="mt-3 max-w-2xl leading-7 text-muted">Manage public charity records. Database RLS remains the final authorization layer.</p></header><section className="rounded-md border border-line bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-4"><h2 className="text-xl font-semibold text-ink">{editingId ? 'Edit charity' : 'Add charity'}</h2>{editingId && <button onClick={resetForm} className="text-sm font-semibold text-muted hover:text-ink">Cancel edit</button>}</div><form onSubmit={handleSubmit} className="mt-5 grid gap-4 sm:grid-cols-2"><AdminField label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} required /><AdminField label="Website URL" value={form.website_url} onChange={(value) => setForm({ ...form, website_url: value })} /><AdminField label="Image URL" value={form.image_url} onChange={(value) => setForm({ ...form, image_url: value })} /><label className="block text-sm font-medium text-ink sm:col-span-2"><span className="mb-2 block">Description</span><textarea rows="4" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="w-full rounded-md border border-line bg-paper px-3 py-3 outline-none focus:border-forest focus:ring-2 focus:ring-mint" /></label><label className="inline-flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} className="accent-forest" />Active</label><label className="inline-flex items-center gap-2 text-sm text-ink"><input type="checkbox" checked={form.is_featured} onChange={(event) => setForm({ ...form, is_featured: event.target.checked })} className="accent-forest" />Featured</label><div className="sm:col-span-2"><button disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-forest px-4 py-2 text-sm font-semibold text-white hover:bg-ink disabled:opacity-60">{editingId ? <Pencil size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}{saving ? 'Saving...' : editingId ? 'Save changes' : 'Add charity'}</button></div></form>{message && <p className="mt-4 rounded-md bg-mint p-3 text-sm text-forest" role="status">{message}</p>}</section>{loading && <LoadingState label="Loading charities" />}{!loading && error && <ErrorState title="Unable to load charities" description="Please try again shortly." onRetry={loadCharities} />}{!loading && !error && <section className="overflow-x-auto rounded-md border border-line bg-white shadow-sm"><table className="w-full min-w-[700px] text-left text-sm"><thead className="border-b border-line text-xs uppercase tracking-wide text-muted"><tr><th className="px-4 py-3">Charity</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Featured</th><th className="px-4 py-3 text-right">Action</th></tr></thead><tbody className="divide-y divide-line">{charities.map((charity) => <tr key={charity.id}><td className="px-4 py-4 font-semibold text-ink">{charity.name}</td><td className="px-4 py-4 text-muted">{charity.is_active ? 'Active' : 'Inactive'}</td><td className="px-4 py-4 text-muted">{charity.is_featured ? <span className="inline-flex items-center gap-1 text-forest"><Star size={15} aria-hidden="true" />Featured</span> : 'No'}</td><td className="px-4 py-4 text-right"><button onClick={() => startEdit(charity)} className="inline-flex items-center gap-2 rounded-md px-3 py-2 font-semibold text-forest hover:bg-mint"><Pencil size={16} aria-hidden="true" />Edit</button></td></tr>)}</tbody></table>{charities.length === 0 && <p className="p-6 text-sm text-muted">No charities found.</p>}</section>}</div>
}

function AdminField({ label, value, onChange, required = false }) {
  return <label className="block text-sm font-medium text-ink"><span className="mb-2 block">{label}</span><input required={required} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-md border border-line bg-paper px-3 py-3 outline-none focus:border-forest focus:ring-2 focus:ring-mint" /></label>
}

export default AdminCharities