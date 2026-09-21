import { supabase } from '../../lib/supabaseClient.js'

function requireSupabase() {
  if (!supabase) throw new Error('Draw services are not configured yet.')
  return supabase
}

export async function getPublishedDraws() {
  const { data, error } = await requireSupabase().from('draws').select('id, draw_month, draw_type, status, prize_pool, currency, winning_numbers, published_at').in('status', ['PUBLISHED', 'COMPLETED']).order('draw_month', { ascending: false })
  if (error) throw new Error('Unable to load published draws.')
  return data || []
}

export async function getMyDrawParticipation(drawId) {
  const { data, error } = await requireSupabase().from('draw_entries').select('id, draw_id, entry_numbers, eligible, draw_results(match_count, matched_numbers, prizes(tier, amount_per_winner))').eq('draw_id', drawId).maybeSingle()
  if (error) throw new Error('Unable to load your draw participation.')
  return data
}

export async function getAdminDraws() {
  const { data, error } = await requireSupabase().from('draws').select('*').order('draw_month', { ascending: false })
  if (error) throw new Error('Unable to load draw management data.')
  return data || []
}

export async function getAdminDraw(drawId) {
  const { data, error } = await requireSupabase().from('draws').select('*, draw_entries(*), draw_results(*), prizes(*)').eq('id', drawId).single()
  if (error) throw new Error('Unable to load draw details.')
  return data
}

export async function runAdminDrawOperation(action, payload = {}) {
  const { data, error } = await requireSupabase().functions.invoke('draw-engine', { body: { action, ...payload } })
  if (error || data?.error) throw new Error(data?.error || 'Unable to complete draw operation.')
  return data
}