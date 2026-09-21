import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardCard from '../components/dashboard/DashboardCard.jsx'
import ErrorState from '../components/dashboard/ErrorState.jsx'
import LoadingState from '../components/dashboard/LoadingState.jsx'
import StatCard from '../components/dashboard/StatCard.jsx'
import { formatPlanAmount, formatSubscriptionDate, getMySubscription, getMySubscriptionPayments, getSubscriptionStatus, requestCancellation } from '../services/subscriptions.js'

function Subscription() {
  const [subscription, setSubscription] = useState(null)
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [message, setMessage] = useState('')
  const [cancelling, setCancelling] = useState(false)

  async function loadSubscription() {
    setLoading(true)
    setError('')
    try {
      const [currentSubscription, paymentHistory] = await Promise.all([getMySubscription(), getMySubscriptionPayments()])
      setSubscription(currentSubscription)
      setPayments(paymentHistory)
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    Promise.all([getMySubscription(), getMySubscriptionPayments()]).then(([currentSubscription, paymentHistory]) => {
      if (!active) return
      setSubscription(currentSubscription)
      setPayments(paymentHistory)
    }).catch((loadError) => {
      if (active) setError(loadError.message)
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [])

  async function handleCancel() {
    setCancelling(true)
    setActionError('')
    setMessage('')
    try {
      const result = await requestCancellation()
      setMessage(result?.message || 'Cancellation scheduled for the end of the current period.')
      await loadSubscription()
    } catch (cancelError) {
      setActionError(cancelError.message)
    } finally {
      setCancelling(false)
    }
  }

  if (loading) return <LoadingState label="Loading subscription" />
  if (error) return <ErrorState title="Unable to load your subscription" description="Please try again shortly." onRetry={loadSubscription} />

  const status = getSubscriptionStatus(subscription)
  const plan = subscription?.subscription_plans
  return <div className="space-y-6"><header><p className="text-sm font-semibold text-forest">Membership</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Subscription</h1><p className="mt-3 max-w-2xl leading-7 text-muted">Your billing status comes from the database and Stripe webhook processing.</p></header>{message && <p className="rounded-md border border-forest/20 bg-mint p-3 text-sm text-forest" role="status">{message}</p>}{actionError && <p className="rounded-md border border-coral/30 bg-coral/10 p-3 text-sm text-ink" role="alert">{actionError}</p>}{!subscription && <DashboardCard title="No active subscription" description="Choose the confirmed monthly plan to start checkout." action={<Link to="/pricing" className="rounded-md bg-forest px-3 py-2 text-sm font-semibold text-white hover:bg-ink">View pricing</Link>} />}{subscription && <><DashboardCard title={plan?.name || 'Current subscription'} eyebrow="Current plan"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><StatCard label="Status" value={status} /><StatCard label="Amount" value={formatPlanAmount(subscription.amount, subscription.currency)} detail="Per billing period" /><StatCard label="Current period" value={formatSubscriptionDate(subscription.current_period_start)} detail={`Ends ${formatSubscriptionDate(subscription.current_period_end)}`} /><StatCard label="Renewal" value={formatSubscriptionDate(subscription.current_period_end)} /></div>{subscription.cancel_at_period_end ? <p className="mt-5 rounded-md bg-paper p-3 text-sm text-muted">Cancellation is scheduled for the end of the current billing period.</p> : ['ACTIVE', 'PAST_DUE'].includes(status) && <button onClick={handleCancel} disabled={cancelling} className="mt-5 rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink hover:border-coral hover:text-coral disabled:opacity-60">{cancelling ? 'Requesting cancellation...' : 'Cancel subscription'}</button>}</DashboardCard><DashboardCard title="Payment history" description="Confirmed Stripe payments will appear here after webhook processing.">{payments.length === 0 ? <p className="text-sm text-muted">No payment records available yet.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[480px] text-left text-sm"><thead className="border-b border-line text-xs uppercase tracking-wide text-muted"><tr><th className="px-3 py-3">Status</th><th className="px-3 py-3">Amount</th><th className="px-3 py-3">Paid</th></tr></thead><tbody className="divide-y divide-line">{payments.map((payment) => <tr key={payment.id}><td className="px-3 py-4 text-muted">{payment.status}</td><td className="px-3 py-4 font-semibold text-ink">{formatPlanAmount(payment.amount, payment.currency)}</td><td className="px-3 py-4 text-muted">{formatSubscriptionDate(payment.paid_at)}</td></tr>)}</tbody></table></div>}</DashboardCard></>}</div>
}

export default Subscription
