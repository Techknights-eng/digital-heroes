import { createClient } from 'npm:@supabase/supabase-js@2.116.0'

const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Content-Type': 'application/json' }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers })

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers })
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  const authorization = request.headers.get('Authorization')
  const url = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!authorization || !url || !anonKey || !serviceRoleKey) return json({ error: 'Reports are not configured.' }, 500)

  const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } })
  const { data: userData, error: userError } = await userClient.auth.getUser()
  if (userError || !userData.user) return json({ error: 'Authentication is required.' }, 401)
  const adminClient = createClient(url, serviceRoleKey)
  const { data: profile } = await adminClient.from('profiles').select('role').eq('id', userData.user.id).maybeSingle()
  if (profile?.role?.toLowerCase() !== 'admin') return json({ error: 'Administrator access is required.' }, 403)

  const filters = await request.json().catch(() => ({}))
  try { return json(await buildReport(adminClient, filters)) } catch (error) { console.error(error); return json({ error: 'Unable to load analytics.' }, 500) }
})

async function rows(client: ReturnType<typeof createClient>, table: string, select: string) {
  const { data, error } = await client.from(table).select(select).range(0, 999)
  if (error) throw error
  return data || []
}

async function buildReport(client: ReturnType<typeof createClient>, filters: Record<string, string>) {
  const from = filters.from ? new Date(`${filters.from}T00:00:00Z`) : null
  const to = filters.to ? new Date(`${filters.to}T23:59:59.999Z`) : null
  const inRange = (value: string | null | undefined) => { if (!value) return true; const date = new Date(value); return (!from || date >= from) && (!to || date <= to) }
  const [users, subscriptions, payments, contributions, draws, entries, results, verifications, payouts] = await Promise.all([
    rows(client, 'profiles', 'id,full_name,role,created_at'),
    rows(client, 'subscriptions', 'id,user_id,plan_id,status,amount,currency,provider_subscription_id,current_period_start,current_period_end,created_at,subscription_plans(name,billing_interval)'),
    rows(client, 'subscription_payments', 'id,user_id,subscription_id,amount,currency,status,paid_at,created_at'),
    rows(client, 'charity_contributions', 'id,user_id,charity_id,percentage,amount,currency,created_at,charities(name)'),
    rows(client, 'draws', 'id,draw_month,status,draw_type,prize_pool,currency,active_subscriber_count,jackpot_rollover,published_at'),
    rows(client, 'draw_entries', 'id,draw_id,user_id,eligible'),
    rows(client, 'draw_results', 'id,draw_id,user_id,match_count,matched_numbers'),
    rows(client, 'winner_verifications', 'id,user_id,draw_result_id,status,created_at,reviewed_at'),
    rows(client, 'payouts', 'id,user_id,winner_verification_id,amount,currency,status,paid_at,created_at'),
  ])
  const filteredSubscriptions = subscriptions.filter((row) => inRange(row.created_at || row.current_period_start) && (!filters.subscriptionStatus || row.status === filters.subscriptionStatus) && (!filters.plan || row.subscription_plans?.name === filters.plan))
  const filteredPayments = payments.filter((row) => inRange(row.paid_at || row.created_at))
  const filteredContributions = contributions.filter((row) => inRange(row.created_at) && (!filters.charity || row.charity_id === filters.charity))
  const filteredDraws = draws.filter((row) => inRange(row.published_at || `${row.draw_month}-01`) && (!filters.draw || row.id === filters.draw))
  const drawIds = new Set(filteredDraws.map((row) => row.id))
  const filteredEntries = entries.filter((row) => drawIds.has(row.draw_id))
  const filteredResults = results.filter((row) => drawIds.has(row.draw_id) && [3, 4, 5].includes(row.match_count))
  const resultIds = new Set(filteredResults.map((row) => row.id))
  const filteredVerifications = verifications.filter((row) => resultIds.has(row.draw_result_id))
  const filteredPayouts = payouts.filter((row) => inRange(row.paid_at || row.created_at) && (!filters.payoutStatus || row.status === filters.payoutStatus))
  const paidPayments = filteredPayments.filter((row) => row.status === 'PAID')
  const paidPayouts = filteredPayouts.filter((row) => row.status === 'PAID')
  const amountByCurrency = (items: Record<string, unknown>[], status?: string) => items.filter((item) => !status || item.status === status).reduce((output, item) => { const currency = String(item.currency || 'INR').toUpperCase(); output[currency] = (output[currency] || 0) + Number(item.amount || 0); return output }, {} as Record<string, number>)
  const tierCounts = filteredResults.reduce((output, row) => { output[row.match_count] = (output[row.match_count] || 0) + 1; return output }, {} as Record<string, number>)
  const contributionsByCharity = filteredContributions.reduce((output, row) => { const name = row.charities?.name || 'Unknown charity'; const key = String(row.charity_id); output[key] ||= { charityId: row.charity_id, charity: name, contributors: 0, amount: 0, percentageTotal: 0 }; output[key].contributors += 1; output[key].amount += Number(row.amount || 0); output[key].percentageTotal += Number(row.percentage || 0); return output }, {} as Record<string, Record<string, unknown>>)
  const planCounts = filteredSubscriptions.reduce((output, row) => { const plan = row.subscription_plans?.name || 'Unknown plan'; output[plan] = (output[plan] || 0) + 1; return output }, {} as Record<string, number>)
  const report = {
    filters: { from: filters.from || null, to: filters.to || null },
    overview: { totalUsers: users.length, activeSubscribers: subscriptions.filter((row) => row.status === 'ACTIVE').length, inactiveSubscribers: subscriptions.filter((row) => ['CANCELLED', 'EXPIRED'].includes(row.status)).length, activeMonthlySubscriptions: subscriptions.filter((row) => row.status === 'ACTIVE' && row.subscription_plans?.billing_interval === 'MONTHLY').length, totalCharityContributionAmount: amountByCurrency(filteredContributions), drawCount: filteredDraws.length, winnerCount: filteredResults.length, pendingVerifications: filteredVerifications.filter((row) => row.status === 'PENDING').length, pendingPayouts: filteredPayouts.filter((row) => row.status === 'PENDING').length, paidPayouts: paidPayouts.length },
    subscriptions: { totalUsers: users.length, active: subscriptions.filter((row) => row.status === 'ACTIVE').length, pastDue: subscriptions.filter((row) => row.status === 'PAST_DUE').length, cancelled: subscriptions.filter((row) => row.status === 'CANCELLED').length, expired: subscriptions.filter((row) => row.status === 'EXPIRED').length, byPlan: planCounts, payments: { success: paidPayments.length, failed: filteredPayments.filter((row) => row.status === 'FAILED').length } },
    revenue: { paid: amountByCurrency(paidPayments, 'PAID'), failed: amountByCurrency(filteredPayments, 'FAILED'), paidPaymentCount: paidPayments.length },
    charity: { amount: amountByCurrency(filteredContributions), contributors: new Set(filteredContributions.map((row) => row.user_id)).size, byCharity: Object.values(contributionsByCharity) },
    draws: { total: filteredDraws.length, published: filteredDraws.filter((row) => row.status === 'PUBLISHED').length, completed: filteredDraws.filter((row) => row.status === 'COMPLETED').length, eligibleEntries: filteredEntries.filter((row) => row.eligible).length, averageEntries: filteredDraws.length ? Math.round(filteredEntries.filter((row) => row.eligible).length / filteredDraws.length * 100) / 100 : 0, winners: filteredResults.length, byTier: tierCounts, prizePools: filteredDraws.map((row) => ({ drawMonth: row.draw_month, prizePool: row.prize_pool, rollover: row.jackpot_rollover, currency: row.currency })) },
    winners: { total: filteredResults.length, pending: filteredVerifications.filter((row) => row.status === 'PENDING').length, approved: filteredVerifications.filter((row) => row.status === 'APPROVED').length, rejected: filteredVerifications.filter((row) => row.status === 'REJECTED').length, byTier: tierCounts },
    payouts: { pending: filteredPayouts.filter((row) => row.status === 'PENDING').length, paid: paidPayouts.length, amounts: amountByCurrency(filteredPayouts), paidAmounts: amountByCurrency(paidPayouts, 'PAID'), averagePaid: paidPayouts.length ? paidPayouts.reduce((sum, row) => sum + Number(row.amount || 0), 0) / paidPayouts.length : 0 },
    tables: { subscribers: filteredSubscriptions.slice(0, 100), payments: filteredPayments.slice(0, 100), contributions: filteredContributions.slice(0, 100), winners: filteredVerifications.slice(0, 100), payouts: filteredPayouts.slice(0, 100) },
  }
  return report
}
