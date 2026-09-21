import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthShell, Field } from './Login.jsx'
import { useAuth } from '../context/AuthContextValue.js'

function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.')
    if (form.password.length < 8) return setError('Password must be at least 8 characters.')
    setSubmitting(true)

    try {
      const data = await signUp(form.email, form.password, form.fullName)
      if (data.session) navigate('/dashboard', { replace: true })
      else setMessage('Account created. Check your email to confirm your address before signing in.')
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return <AuthShell title="Create your account" description="Join Digital Heroes and make every month of play count."><form onSubmit={handleSubmit} className="space-y-5"><Field label="Full name" type="text" value={form.fullName} onChange={(value) => setForm({ ...form, fullName: value })} /><Field label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} /><Field label="Password" type="password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} /><Field label="Confirm password" type="password" value={form.confirmPassword} onChange={(value) => setForm({ ...form, confirmPassword: value })} />{error && <p className="rounded-md border border-coral/30 bg-coral/10 p-3 text-sm text-ink">{error}</p>}{message && <p className="rounded-md border border-forest/20 bg-mint p-3 text-sm text-forest">{message}</p>}<button disabled={submitting} className="w-full rounded-md bg-forest px-4 py-3 text-sm font-semibold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60">{submitting ? 'Creating account...' : 'Create account'}</button></form><p className="mt-6 text-center text-sm text-muted">Already registered? <Link className="font-semibold text-forest hover:text-ink" to="/login">Sign in</Link></p></AuthShell>
}

export default Signup