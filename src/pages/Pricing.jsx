import { Check, CreditCard } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContextValue.js'
import { createCheckoutSession, formatPlanAmount, getActiveSubscriptionPlans } from '../services/subscriptions.js'
import ErrorState from '../components/dashboard/ErrorState.jsx'
import LoadingState from '../components/dashboard/LoadingState.jsx'

function Pricing() {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')

  useEffect(() => {
    let active = true
    getActiveSubscriptionPlans()
      .then((data) => {
        if (active) setPlans(data)
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

  async function handleSubscribe(plan) {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/pricing' } } })
      return
    }
    setCheckoutLoading(true)
    setCheckoutError('')
    try {
      const result = await createCheckoutSession(plan.id)
      if (!result?.url) throw new Error('Checkout is unavailable right now.')
      window.location.assign(result.url)
    } catch (checkoutFailure) {
      setCheckoutError(checkoutFailure.message)
      setCheckoutLoading(false)
    }
  }

  const monthlyPlan = plans.find((plan) => String(plan.billing_interval).toUpperCase() === 'MONTHLY')
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="max-w-2xl"><p className="text-sm font-semibold text-forest">Membership</p><h1 className="mt-2 text-4xl font-semibold tracking-tight text-ink">A simple way to play for impact</h1><p className="mt-3 leading-7 text-muted">Start with the confirmed monthly plan. Subscription status is confirmed by Stripe webhooks after payment processing.</p></header>
      {loading && <div className="mt-8"><LoadingState label="Loading subscription plans" /></div>}
      {!loading && error && <div className="mt-8"><ErrorState title="Unable to load pricing" description="Please try again shortly." /></div>}
      {!loading && !error && <div className="mt-8 grid gap-5 md:grid-cols-2"><PlanCard plan={monthlyPlan} onSubscribe={handleSubscribe} loading={checkoutLoading} /><div className="rounded-md border border-line bg-paper p-6"><p className="text-sm font-semibold text-muted">Yearly</p><h2 className="mt-2 text-2xl font-semibold text-ink">Coming soon</h2><p className="mt-3 leading-7 text-muted">Yearly pricing has not been confirmed yet and is not available for purchase.</p></div></div>}
      {checkoutError && <p className="mt-5 rounded-md border border-coral/30 bg-coral/10 p-3 text-sm text-ink" role="alert">{checkoutError}</p>}
    </div>
  )
}

function PlanCard({ plan, onSubscribe, loading }) {
  if (!plan) return <div className="rounded-md border border-coral/30 bg-coral/10 p-6"><h2 className="font-semibold text-ink">Monthly plan unavailable</h2><p className="mt-2 text-sm leading-6 text-muted">The monthly plan is not configured for checkout yet.</p></div>
  return <article className="rounded-md border border-forest bg-white p-6 shadow-sm"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-forest">Monthly</p><h2 className="mt-2 text-3xl font-semibold text-ink">{formatPlanAmount(plan.amount, plan.currency)}<span className="text-base font-medium text-muted"> / month</span></h2></div><span className="grid size-11 place-items-center rounded-md bg-mint text-forest"><CreditCard size={21} aria-hidden="true" /></span></div><ul className="mt-6 space-y-3 text-sm text-muted"><li className="flex gap-2"><Check className="shrink-0 text-forest" size={18} aria-hidden="true" />Secure Stripe test checkout</li><li className="flex gap-2"><Check className="shrink-0 text-forest" size={18} aria-hidden="true" />Minimum charity contribution remains 10%</li><li className="flex gap-2"><Check className="shrink-0 text-forest" size={18} aria-hidden="true" />Cancel at the end of your billing period</li></ul><button onClick={() => onSubscribe(plan)} disabled={loading} className="mt-7 w-full rounded-md bg-forest px-4 py-3 text-sm font-semibold text-white hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60">{loading ? 'Starting checkout...' : 'Subscribe'}</button></article>
}

export default Pricing
