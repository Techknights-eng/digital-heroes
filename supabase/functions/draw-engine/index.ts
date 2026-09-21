import { createClient } from 'npm:@supabase/supabase-js@2.116.0'

const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Content-Type': 'application/json' }
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers })
const tierPercentages = { 5: 40, 4: 35, 3: 25 }

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers })
  if (request.method !== 'POST') return response({ error: 'Method not allowed' }, 405)
  const authorization = request.headers.get('Authorization')
  const url = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!authorization || !url || !anonKey || !serviceRoleKey) return response({ error: 'Draw engine is not configured.' }, 500)

  const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } })
  const { data: userData, error: userError } = await userClient.auth.getUser()
  if (userError || !userData.user) return response({ error: 'Authentication is required.' }, 401)
  const adminClient = createClient(url, serviceRoleKey)
  const { data: profile } = await adminClient.from('profiles').select('role').eq('id', userData.user.id).maybeSingle()
  if (profile?.role?.toLowerCase() !== 'admin') return response({ error: 'Administrator access is required.' }, 403)

  const body = await request.json().catch(() => ({}))
  try {
    if (body.action === 'create') return response(await createDraft(adminClient, userData.user.id, body))
    if (body.action === 'generate_entries') return response(await generateEntries(adminClient, userData.user.id, body.draw_id))
    if (body.action === 'simulate') return response(await simulate(adminClient, userData.user.id, body.draw_id))
    if (body.action === 'publish') return response(await publish(adminClient, userData.user.id, body.draw_id))
    return response({ error: 'Unknown draw operation.' }, 400)
  } catch (error) {
    return response({ error: error instanceof Error ? error.message : 'Draw operation failed.' }, 400)
  }
})

async function createDraft(client: ReturnType<typeof createClient>, adminId: string, body: Record<string, unknown>) {
  if (!/^\d{4}-\d{2}$/.test(String(body.draw_month || ''))) throw new Error('Draw month must use YYYY-MM format.')
  if (!['RANDOM', 'ALGORITHMIC'].includes(String(body.draw_type))) throw new Error('Draw type must be RANDOM or ALGORITHMIC.')
  const { data: existing } = await client.from('draws').select('id').eq('draw_month', body.draw_month).maybeSingle()
  if (existing) throw new Error('A draw already exists for that month.')
  const { count } = await client.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'ACTIVE')
  const { data, error } = await client.from('draws').insert({ draw_month: body.draw_month, draw_type: body.draw_type, status: 'DRAFT', active_subscriber_count: count || 0, jackpot_rollover: 0 }).select().single()
  if (error) throw new Error('Unable to create draw draft.')
  await audit(client, adminId, 'DRAW_CREATED', { draw_id: data.id, draw_month: body.draw_month })
  return data
}

async function generateEntries(client: ReturnType<typeof createClient>, adminId: string, drawId: string) {
  const draw = await getDraw(client, drawId)
  if (draw.status !== 'DRAFT') throw new Error('Entries can only be generated for a draft draw.')
  requireConfiguration()
  const { data: subscribers } = await client.from('subscriptions').select('user_id').eq('status', 'ACTIVE')
  const rows = []
  for (const subscriber of subscribers || []) {
    const { data: score } = await client.from('golf_scores').select('score').eq('user_id', subscriber.user_id).order('score_date', { ascending: false }).limit(1).maybeSingle()
    if (!score) continue
    rows.push({ draw_id: drawId, user_id: subscriber.user_id, entry_numbers: scoreToNumbers(score.score), eligible: true })
  }
  if (rows.length) {
    const { error } = await client.from('draw_entries').upsert(rows, { onConflict: 'draw_id,user_id', ignoreDuplicates: true })
    if (error) throw new Error('Unable to generate draw entries.')
  }
  await audit(client, adminId, 'DRAW_ENTRIES_GENERATED', { draw_id: drawId, entry_count: rows.length })
  return { draw_id: drawId, entry_count: rows.length }
}

async function simulate(client: ReturnType<typeof createClient>, adminId: string, drawId: string) {
  const draw = await getDraw(client, drawId)
  if (draw.status !== 'DRAFT' && draw.status !== 'SIMULATED') throw new Error('Only drafts can be simulated.')
  requireConfiguration()
  const { data: entries } = await client.from('draw_entries').select('user_id, entry_numbers').eq('draw_id', drawId).eq('eligible', true)
  const winningNumbers = secureNumbers()
  const counts = { 5: 0, 4: 0, 3: 0 }
  const results = (entries || []).map((entry) => {
    const matchedNumbers = (entry.entry_numbers || []).filter((number: number) => winningNumbers.includes(number))
    const matchCount = matchedNumbers.length
    if (matchCount in counts) counts[matchCount as 3 | 4 | 5] += 1
    return { user_id: entry.user_id, match_count: matchCount, matched_numbers: matchedNumbers }
  }).filter((result) => result.match_count >= 3)
  const prizePool = calculatePrizePool(draw.active_subscriber_count || 0)
  const prizes = calculatePrizes(prizePool, counts)
  const simulation = { winning_numbers: winningNumbers, results, counts, prizes, configuration_required: false }
  const { error } = await client.from('draws').update({ status: 'SIMULATED', simulation_data: simulation, prize_pool: prizePool }).eq('id', drawId).eq('status', draw.status)
  if (error) throw new Error('Unable to save draw simulation.')
  await audit(client, adminId, 'DRAW_SIMULATED', { draw_id: drawId, result_count: results.length })
  return simulation
}

async function publish(client: ReturnType<typeof createClient>, adminId: string, drawId: string) {
  const draw = await getDraw(client, drawId)
  if (draw.status !== 'SIMULATED') throw new Error('A draw must be simulated before publishing.')
  if (!draw.simulation_data?.winning_numbers) throw new Error('Draw simulation is incomplete.')
  const simulation = draw.simulation_data
  const { error: resultError } = await client.from('draw_results').upsert(simulation.results.map((result: Record<string, unknown>) => ({ draw_id: drawId, ...result })), { onConflict: 'draw_id,user_id' })
  if (resultError) throw new Error('Unable to save draw results.')
  const { error: prizeError } = await client.from('prizes').upsert(simulation.prizes.map((prize: Record<string, unknown>) => ({ draw_id: drawId, tier: prize.tier, pool_percentage: prize.poolPercentage, pool_amount: prize.poolAmount, winner_count: prize.winnerCount, amount_per_winner: prize.amountPerWinner, rollover_amount: prize.rolloverAmount })), { onConflict: 'draw_id,tier' })
  if (prizeError) throw new Error('Unable to save draw prizes.')
  const { data, error } = await client.from('draws').update({ status: 'PUBLISHED', winning_numbers: simulation.winning_numbers, published_at: new Date().toISOString() }).eq('id', drawId).eq('status', 'SIMULATED').select().single()
  if (error) throw new Error('Unable to publish draw.')
  await audit(client, adminId, 'DRAW_PUBLISHED', { draw_id: drawId })
  return data
}

async function getDraw(client: ReturnType<typeof createClient>, drawId: string) {
  const { data, error } = await client.from('draws').select('*').eq('id', drawId).single()
  if (error || !data) throw new Error('Draw not found.')
  return data
}

function requireConfiguration() {
  throw new Error('Draw configuration is incomplete: draw number range, score-to-draw-number transformation, prize-pool contribution percentage, eligibility cutoff, and jackpot rollover policy must be configured.')
}

function scoreToNumbers(_score: number) { throw new Error('Score-to-draw-number transformation is not configured.') }
function secureNumbers() { throw new Error('Draw number range is not configured.') }
function calculatePrizePool(_count: number) { throw new Error('Prize-pool contribution percentage is not configured.') }
function calculatePrizes(_pool: number, _counts: Record<number, number>) { throw new Error('Prize calculation cannot run until draw configuration is complete.') }

async function audit(client: ReturnType<typeof createClient>, adminId: string, action: string, metadata: Record<string, unknown>) {
  await client.from('admin_actions').insert({ admin_id: adminId, action, metadata })
}
