import { Link, useLocation } from 'react-router-dom'

function SubscriptionResult({ cancelled = false }) {
  const location = useLocation()
  const sessionId = new URLSearchParams(location.search).get('session_id')
  return <section className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6"><div className="rounded-md border border-line bg-white p-8 shadow-sm"><p className="text-sm font-semibold text-forest">Subscription checkout</p><h1 className="mt-3 text-3xl font-semibold text-ink">{cancelled ? 'Subscription checkout was cancelled.' : 'Payment processing completed.'}</h1><p className="mt-4 leading-7 text-muted">{cancelled ? 'No subscription change was made. You can return to pricing whenever you are ready.' : 'Your subscription status is confirmed after Stripe payment and webhook processing. This page does not assume an active subscription.'}</p>{sessionId && <p className="mt-4 text-xs text-muted">Checkout session received. Awaiting webhook confirmation.</p>}<div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">{cancelled ? <Link to="/pricing" className="rounded-md bg-forest px-4 py-3 text-sm font-semibold text-white hover:bg-ink">Return to Pricing</Link> : <Link to="/dashboard" className="rounded-md bg-forest px-4 py-3 text-sm font-semibold text-white hover:bg-ink">Go to Dashboard</Link>}</div></div></section>
}

export default SubscriptionResult
