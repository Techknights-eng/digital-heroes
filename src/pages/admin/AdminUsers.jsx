import { Pencil, Save, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import EmptyState from '../../components/dashboard/EmptyState.jsx'
import ErrorState from '../../components/dashboard/ErrorState.jsx'
import LoadingState from '../../components/dashboard/LoadingState.jsx'
import { useAuth } from '../../context/AuthContextValue.js'
import { getAdminUsers, updateAdminUser } from '../../services/adminUsers.js'

function AdminUsers() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ full_name: '', phone: '', role: 'SUBSCRIBER' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function loadUsers() {
    setLoading(true)
    setError('')
    try {
      setUsers(await getAdminUsers())
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    getAdminUsers()
      .then((data) => {
        if (active) setUsers(data)
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

  function startEdit(row) {
    setMessage('')
    setEditing(row)
    setForm({ full_name: row.full_name || '', phone: row.phone || '', role: String(row.role || 'SUBSCRIBER').toUpperCase() })
  }

  async function submit(event) {
    event.preventDefault()
    if (!editing) return
    setSaving(true)
    setMessage('')
    try {
      await updateAdminUser(editing.id, form)
      setMessage('User profile updated.')
      setEditing(null)
      await loadUsers()
    } catch (saveError) {
      setMessage(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-coral">Admin workspace</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">Users</h1>
        <p className="mt-3 max-w-2xl leading-7 text-muted">View subscriber profiles, subscription status, and update allowed profile fields through server-side admin controls.</p>
      </header>

      {message && <p className="rounded-md bg-mint p-3 text-sm text-forest" role="status">{message}</p>}

      {editing && (
        <section className="rounded-md border border-line bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-ink">Edit user</h2>
              <p className="mt-1 text-sm text-muted">{editing.email || editing.id}</p>
            </div>
            <button onClick={() => setEditing(null)} className="grid size-9 place-items-center rounded-md text-muted hover:bg-paper hover:text-ink" aria-label="Cancel edit"><X size={18} aria-hidden="true" /></button>
          </div>
          <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Full name" value={form.full_name} onChange={(value) => setForm({ ...form, full_name: value })} />
            <Field label="Phone" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
            <label className="block text-sm font-medium text-ink">
              <span className="mb-2 block">Role</span>
              <select value={form.role} disabled={editing.id === currentUser?.id} onChange={(event) => setForm({ ...form, role: event.target.value })} className="w-full rounded-md border border-line bg-paper px-3 py-3 outline-none focus:border-forest focus:ring-2 focus:ring-mint disabled:opacity-70">
                <option value="SUBSCRIBER">SUBSCRIBER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </label>
            <div className="flex items-end">
              <button disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-forest px-4 py-3 text-sm font-semibold text-white hover:bg-ink disabled:opacity-60"><Save size={16} aria-hidden="true" />{saving ? 'Saving...' : 'Save changes'}</button>
            </div>
          </form>
        </section>
      )}

      {loading && <LoadingState label="Loading users" />}
      {!loading && error && <ErrorState title="Unable to load users" description={error} onRetry={loadUsers} />}
      {!loading && !error && users.length === 0 && <EmptyState title="No users found" description="Profiles will appear here after signup creates database records." />}
      {!loading && !error && users.length > 0 && (
        <section className="overflow-x-auto rounded-md border border-line bg-white shadow-sm">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
              <tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">Subscription</th><th className="px-4 py-3">Renewal</th><th className="px-4 py-3 text-right">Action</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-4"><p className="font-semibold text-ink">{row.full_name || 'Not provided'}</p><p className="mt-1 text-xs text-muted">{row.email || row.id}</p></td>
                  <td className="px-4 py-4 text-muted">{row.role || 'SUBSCRIBER'}</td>
                  <td className="px-4 py-4 text-muted">{row.phone || 'Not provided'}</td>
                  <td className="px-4 py-4 text-muted">{row.latest_subscription?.status || 'No active subscription'}</td>
                  <td className="px-4 py-4 text-muted">{formatDate(row.latest_subscription?.current_period_end)}</td>
                  <td className="px-4 py-4 text-right"><button onClick={() => startEdit(row)} className="inline-flex items-center gap-2 rounded-md px-3 py-2 font-semibold text-forest hover:bg-mint"><Pencil size={16} aria-hidden="true" />Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}

function Field({ label, value, onChange }) {
  return <label className="block text-sm font-medium text-ink"><span className="mb-2 block">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-md border border-line bg-paper px-3 py-3 outline-none focus:border-forest focus:ring-2 focus:ring-mint" /></label>
}

function formatDate(value) {
  return value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value)) : 'Not available'
}

export default AdminUsers
