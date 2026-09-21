import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContextValue.js'

function Login() {
  const { signIn, isAdmin, isAuthenticated, loading, profile, profileError } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState(location.state?.error || '')
  const [submitting, setSubmitting] = useState(false)
  const displayError = profileError || error

  useEffect(() => {
    if (!loading && isAuthenticated && profile) {
      navigate(isAdmin ? '/admin' : location.state?.from?.pathname || '/dashboard', { replace: true })
    }
  }, [isAdmin, isAuthenticated, loading, location.state, navigate, profile, profileError])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await signIn(form.email, form.password)
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell title="Welcome back" description="Sign in to continue your Digital Heroes journey.">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Email" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} />
        <Field label="Password" type="password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} />
        {displayError && <p className="rounded-md border border-coral/30 bg-coral/10 p-3 text-sm text-ink">{displayError}</p>}
        <button disabled={submitting} className="w-full rounded-md bg-forest px-4 py-3 text-sm font-semibold text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60">
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">New to Digital Heroes? <Link className="font-semibold text-forest hover:text-ink" to="/signup">Create an account</Link></p>
    </AuthShell>
  )
}

function Field({ label, type, value, onChange }) {
  return <label className="block text-sm font-medium text-ink"><span className="mb-2 block">{label}</span><input required type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-md border border-line bg-paper px-3 py-3 outline-none transition focus:border-forest focus:ring-2 focus:ring-mint" /></label>
}

function AuthShell({ title, description, children }) {
  return <section className="mx-auto grid min-h-[calc(100svh-10rem)] max-w-md place-items-center px-4 py-12"><div className="w-full rounded-md border border-line bg-white p-6 shadow-sm sm:p-8"><p className="text-sm font-semibold text-forest">Digital Heroes</p><h1 className="mt-3 text-3xl font-semibold text-ink">{title}</h1><p className="mt-2 leading-7 text-muted">{description}</p><div className="mt-8">{children}</div></div></section>
}

export { AuthShell, Field }
export default Login