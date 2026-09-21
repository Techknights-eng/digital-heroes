import { Link } from 'react-router-dom'

function Unauthorized() {
  return <section className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6"><div className="rounded-md border border-line bg-white p-8 shadow-sm"><p className="text-sm font-semibold text-coral">Access denied</p><h1 className="mt-3 text-3xl font-semibold text-ink">Administrator access required</h1><p className="mx-auto mt-3 max-w-lg leading-7 text-muted">Your account does not have administrator access. You can continue to your subscriber dashboard.</p><Link to="/dashboard" className="mt-8 inline-flex rounded-md bg-forest px-5 py-3 text-sm font-semibold text-white hover:bg-ink">Back to dashboard</Link></div></section>
}

export default Unauthorized