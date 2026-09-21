import { supabase } from '../lib/supabaseClient.js'

function requireSupabase() {
  if (!supabase) throw new Error('Winner workflow is not configured yet.')
  return supabase
}

function logSupabaseError(context, error) {
  if (import.meta.env.DEV) console.error(context, error)
}

function prizeForResult(result) {
  const prizes = result?.draws?.prizes || result?.draw_results?.draws?.prizes || []
  const matchCount = result.match_count || result.draw_results?.match_count
  return prizes.find((prize) => tierMatches(prize.tier, matchCount)) || null
}

function tierMatches(tier, matchCount) {
  const matchText = String(matchCount)
  const tierText = String(tier || '').toUpperCase()
  return Number(tier) === Number(matchCount) || tierText === matchText || tierText.startsWith(matchText) || tierText.includes(`${matchText}_`)
}

function withPrize(result) {
  const prize = prizeForResult(result)
  const verification = result.winner_verifications?.[0]
  return {
    ...result,
    prize,
    prizes: prize ? [prize] : [],
    payouts: verification?.payouts || [],
  }
}

function withNestedPrize(row) {
  const result = row.draw_results
  const prize = prizeForResult(result || {})
  return {
    ...row,
    prize,
    draw_results: result ? { ...result, prize, prizes: prize ? [prize] : [] } : result,
  }
}

export async function getMyWinnings() {
  const { data, error } = await requireSupabase()
    .from('draw_results')
    .select('id, draw_id, user_id, match_count, matched_numbers, draws(draw_month, status, currency, prizes(tier, amount_per_winner)), winner_verifications(id, status, admin_notes, reviewed_at, payouts(id, amount, currency, status, payment_reference, paid_at))')
    .in('match_count', [3, 4, 5])
    .order('id', { ascending: false })
  if (error) {
    logSupabaseError('Unable to load winnings from draw_results.', error)
    throw new Error('Unable to load your winnings.')
  }
  return (data || []).map(withPrize)
}

export async function getAdminWinners() {
  const { data, error } = await requireSupabase()
    .from('winner_verifications')
    .select('id, draw_result_id, user_id, proof_url, status, admin_notes, reviewed_by, reviewed_at, created_at, draw_results(draw_id, match_count, matched_numbers, draws(draw_month, status, currency, prizes(tier, amount_per_winner))), payouts(id, amount, currency, status, payment_reference, paid_at)')
    .order('created_at', { ascending: false })
  if (error) {
    logSupabaseError('Unable to load winner verifications.', error)
    throw new Error('Unable to load winner verifications.')
  }
  return (data || []).map(withNestedPrize)
}

export async function getAdminPayouts() {
  const { data, error } = await requireSupabase()
    .from('payouts')
    .select('id, winner_verification_id, user_id, amount, currency, status, payment_reference, paid_at, created_at, winner_verifications(status, draw_result_id, draw_results(draw_id, match_count, draws(draw_month, currency, prizes(tier, amount_per_winner))))')
    .order('created_at', { ascending: false })
  if (error) {
    logSupabaseError('Unable to load payouts.', error)
    throw new Error('Unable to load payouts.')
  }
  return (data || []).map((payout) => ({ ...payout, winner_verifications: withNestedPrize(payout.winner_verifications || {}) }))
}

export async function submitWinnerProof(drawResultId, file) {
  const allowed = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
  if (!file) throw new Error('Choose a proof file.')
  if (!allowed.includes(file.type)) throw new Error('Proof must be PNG, JPEG, WEBP, or PDF.')
  if (file.size > 10 * 1024 * 1024) throw new Error('Proof files must be 10 MB or smaller.')
  const bytes = new Uint8Array(await file.arrayBuffer())
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  const { data, error } = await requireSupabase().functions.invoke('winner-workflow', { body: { action: 'submit_proof', draw_result_id: drawResultId, proof_data: btoa(binary), content_type: file.type, file_name: file.name } })
  if (error || data?.error) throw new Error(data?.error || 'Unable to submit proof.')
  return data
}

export async function runWinnerWorkflow(action, payload) {
  const { data, error } = await requireSupabase().functions.invoke('winner-workflow', { body: { action, ...payload } })
  if (error || data?.error) throw new Error(data?.error || 'Unable to complete winner workflow.')
  return data
}
