import { supabase } from '../lib/supabaseClient.js'

function requireSupabase() {
  if (!supabase) throw new Error('Subscription services are not configured yet.')
  return supabase
}

function logSupabaseError(context, error) {
  if (import.meta.env.DEV) console.error(context, error)
}

export async function getActiveSubscriptionPlans() {
  const { data, error } = await requireSupabase()
    .from('subscription_plans')
    .select('id, name, billing_interval, amount, currency, is_active')
    .eq('is_active', true)
    .order('billing_interval')

  if (error) {
    logSupabaseError('Unable to load subscription plans.', error)
    throw new Error('Unable to load subscription plans.')
  }
  return data || []
}

export async function getMySubscription() {
  const { data, error } = await requireSupabase()
    .from('subscriptions')
    .select('id, user_id, plan_id, status, amount, currency, provider, provider_customer_id, provider_subscription_id, current_period_start, current_period_end, cancel_at_period_end, subscription_plans(name, billing_interval)')
    .order('current_period_end', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    logSupabaseError('Unable to load subscription.', error)
    throw new Error('Unable to load your subscription.')
  }
  return data
}

export async function getMySubscriptionPayments() {
  const { data, error } = await requireSupabase()
    .from('subscription_payments')
    .select('id, subscription_id, provider, provider_payment_id, amount, currency, status, paid_at, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    logSupabaseError('Unable to load subscription payments.', error)
    throw new Error('Unable to load your payment history.')
  }
  return data || []
}

export async function createCheckoutSession(planId) {
  const { data, error } = await requireSupabase().functions.invoke('create-checkout-session', {
    body: { plan_id: planId },
  })

  if (error || data?.error) {
    logSupabaseError('Unable to start checkout.', error || data.error)
    throw new Error(data?.error || 'Unable to start checkout. Please try again.')
  }
  return data
}

export async function requestCancellation() {
  const { data, error } = await requireSupabase().functions.invoke('cancel-subscription')
  if (error || data?.error) {
    logSupabaseError('Unable to request subscription cancellation.', error || data.error)
    throw new Error(data?.error || 'Unable to request subscription cancellation.')
  }
  return data
}

export function formatPlanAmount(amount, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(Number(amount))
}

export function formatSubscriptionDate(value) {
  if (!value) return 'Not available'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value))
}

export function getSubscriptionStatus(subscription) {
  return subscription?.status?.toUpperCase() || 'NONE'
}
