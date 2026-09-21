import Stripe from 'npm:stripe@18.5.0'
import { createClient } from 'npm:@supabase/supabase-js@2.116.0'

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

function iso(unixSeconds?: number | null) {
  return unixSeconds ? new Date(unixSeconds * 1000).toISOString() : null
}

function mapStatus(status: string) {
  if (status === 'active') return 'ACTIVE'
  if (status === 'past_due') return 'PAST_DUE'
  if (status === 'canceled') return 'CANCELLED'
  if (status === 'incomplete_expired') return 'EXPIRED'
  return 'PAST_DUE'
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const signature = request.headers.get('Stripe-Signature')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!signature || !webhookSecret || !stripeSecretKey || !supabaseUrl || !serviceRoleKey) return json({ error: 'Webhook is not configured.' }, 500)

  const stripe = new Stripe(stripeSecretKey)
  const payload = await request.text()
  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(payload, signature, webhookSecret)
  } catch {
    return json({ error: 'Invalid webhook signature.' }, 400)
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey)
  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode === 'subscription' && session.subscription) {
        const stripeSubscription = await stripe.subscriptions.retrieve(String(session.subscription))
        await syncSubscription(adminClient, stripeSubscription, session.metadata?.user_id, session.metadata?.plan_id, String(session.customer || ''))
      }
    }

    if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription
      await syncSubscription(adminClient, subscription, subscription.metadata?.user_id, subscription.metadata?.plan_id, String(subscription.customer || ''))
    }

    if (event.type === 'invoice.paid' || event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice
      await syncPayment(adminClient, invoice, event)
    }
  } catch (error) {
    console.error('Stripe webhook processing failed', error)
    return json({ error: 'Webhook processing failed.' }, 500)
  }

  return json({ received: true })
})

async function syncSubscription(client: ReturnType<typeof createClient>, subscription: Stripe.Subscription, metadataUserId?: string, metadataPlanId?: string, customerId?: string) {
  let userId = metadataUserId
  let planId = metadataPlanId
  const existing = await client.from('subscriptions').select('id, user_id, plan_id').eq('provider_subscription_id', subscription.id).maybeSingle()
  if (existing.data) {
    userId ||= existing.data.user_id
    planId ||= existing.data.plan_id
  }
  if (!userId) throw new Error('Subscription user metadata is missing.')

  const price = subscription.items.data[0]?.price
  const amount = price?.unit_amount == null ? null : Number(price.unit_amount) / 100
  const currency = price?.currency?.toUpperCase() || 'INR'
  const row = {
    user_id: userId,
    plan_id: planId || null,
    status: mapStatus(subscription.status),
    amount,
    currency,
    provider: 'STRIPE',
    provider_customer_id: customerId || String(subscription.customer || ''),
    provider_subscription_id: subscription.id,
    current_period_start: iso(subscription.current_period_start),
    current_period_end: iso(subscription.current_period_end),
    cancel_at_period_end: subscription.cancel_at_period_end,
  }

  if (existing.data?.id) await client.from('subscriptions').update(row).eq('id', existing.data.id)
  else await client.from('subscriptions').insert(row)
}

async function syncPayment(client: ReturnType<typeof createClient>, invoice: Stripe.Invoice, event: Stripe.Event) {
  const providerPaymentId = invoice.id
  const { data: duplicate } = await client.from('subscription_payments').select('id').or(`provider_event_id.eq.${event.id},provider_payment_id.eq.${providerPaymentId}`).maybeSingle()
  if (duplicate) return

  const providerSubscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id
  if (!providerSubscriptionId) return
  const { data: subscription } = await client.from('subscriptions').select('id,user_id').eq('provider_subscription_id', providerSubscriptionId).maybeSingle()
  if (!subscription) return

  await client.from('subscription_payments').insert({
    subscription_id: subscription.id,
    user_id: subscription.user_id,
    provider: 'STRIPE',
    provider_payment_id: providerPaymentId,
    provider_event_id: event.id,
    amount: Number((event.type === 'invoice.paid' ? invoice.amount_paid : invoice.amount_due) || 0) / 100,
    currency: String(invoice.currency || 'INR').toUpperCase(),
    status: event.type === 'invoice.paid' ? 'PAID' : 'FAILED',
    paid_at: event.type === 'invoice.paid' ? iso(invoice.status_transitions?.paid_at) : null,
  })
}
