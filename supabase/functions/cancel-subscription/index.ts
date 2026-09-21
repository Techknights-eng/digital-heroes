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
  if (!authorization || !supabaseUrl || !anonKey || !serviceRoleKey || !stripeSecretKey) return response({ error: 'Cancellation is not configured.' }, 500)

  const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } })
  const { data: userData, error: userError } = await userClient.auth.getUser()
  if (userError || !userData.user) return response({ error: 'Authentication is required.' }, 401)

  const adminClient = createClient(supabaseUrl, serviceRoleKey)
  const { data: subscription, error } = await adminClient
    .from('subscriptions')
    .select('id, provider_subscription_id, status, cancel_at_period_end')
    .eq('user_id', userData.user.id)
    .in('status', ['ACTIVE', 'PAST_DUE'])
    .order('current_period_end', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()

  if (error || !subscription?.provider_subscription_id) return response({ error: 'No active subscription was found.' }, 400)
  if (subscription.cancel_at_period_end) return response({ message: 'Cancellation is already scheduled.' })

  const stripe = new Stripe(stripeSecretKey)
  await stripe.subscriptions.update(subscription.provider_subscription_id, { cancel_at_period_end: true })
  await adminClient.from('subscriptions').update({ cancel_at_period_end: true }).eq('id', subscription.id).eq('user_id', userData.user.id)

  return response({ message: 'Subscription cancellation scheduled for the end of the current period.' })
})
