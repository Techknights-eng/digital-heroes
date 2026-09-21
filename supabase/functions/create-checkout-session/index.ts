import Stripe from 'npm:stripe@18.5.0'
import { createClient } from 'npm:@supabase/supabase-js@2.116.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders })
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return response({ error: 'Method not allowed' }, 405)

  const authorization = request.headers.get('Authorization')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
  const monthlyPriceId = Deno.env.get('STRIPE_MONTHLY_PRICE_ID')
  const siteUrl = Deno.env.get('SITE_URL')

  if (!authorization || !supabaseUrl || !anonKey || !serviceRoleKey || !stripeSecretKey || !siteUrl) {
    return response({ error: 'Checkout is not configured.' }, 500)
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
  })
  const { data: userData, error: userError } = await userClient.auth.getUser()
  if (userError || !userData.user) return response({ error: 'Authentication is required.' }, 401)

  const body = await request.json().catch(() => ({}))
  const planId = body?.plan_id
  if (!planId) return response({ error: 'A subscription plan is required.' }, 400)

  const adminClient = createClient(supabaseUrl, serviceRoleKey)
  const { data: plan, error: planError } = await adminClient
    .from('subscription_plans')
    .select('id, name, billing_interval, amount, currency, is_active')
    .eq('id', planId)
    .eq('is_active', true)
    .maybeSingle()

  if (planError || !plan) return response({ error: 'That subscription plan is unavailable.' }, 400)
  if (String(plan.billing_interval).toUpperCase() !== 'MONTHLY' || plan.amount == null) {
    return response({ error: 'That subscription plan is not configured for checkout.' }, 400)
  }

  const { data: profile } = await adminClient.from('profiles').select('full_name').eq('id', userData.user.id).maybeSingle()
  const stripe = new Stripe(stripeSecretKey)
  const { data: existingSubscription } = await adminClient
    .from('subscriptions')
    .select('provider_customer_id')
    .eq('user_id', userData.user.id)
    .not('provider_customer_id', 'is', null)
    .order('current_period_end', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()
  let customerId = existingSubscription?.provider_customer_id || ''
  if (!customerId && userData.user.email) {
    const existingCustomers = await stripe.customers.list({ email: userData.user.email, limit: 1 })
    customerId = existingCustomers.data[0]?.id || ''
  }
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: userData.user.email,
      name: profile?.full_name || undefined,
      metadata: { user_id: userData.user.id },
    })
    customerId = customer.id
  }

  const lineItem = monthlyPriceId
    ? { price: monthlyPriceId, quantity: 1 }
    : {
        price_data: {
          currency: String(plan.currency).toLowerCase(),
          unit_amount: Math.round(Number(plan.amount) * 100),
          recurring: { interval: 'month' },
          product_data: { name: plan.name },
        },
        quantity: 1,
      }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [lineItem],
    metadata: { user_id: userData.user.id, plan_id: String(plan.id) },
    subscription_data: { metadata: { user_id: userData.user.id, plan_id: String(plan.id) } },
    success_url: `${siteUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/subscription/cancelled`,
  })

  return response({ url: session.url, session_id: session.id })
})
