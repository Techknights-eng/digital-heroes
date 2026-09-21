import { supabase } from '../lib/supabaseClient.js'

function requireSupabase() {
  if (!supabase) throw new Error('Golf scores are not configured yet.')
  return supabase
}

function getUserMessage(error) {
  const message = error?.message || ''
  if (message.toLowerCase().includes('already exists')) return 'A golf score already exists for this date.'
  if (message.toLowerCase().includes('between 1 and 45')) return 'Stableford score must be between 1 and 45.'
  if (message.toLowerCase().includes('authentication')) return 'Please sign in again to manage your golf scores.'
  return 'Unable to save your golf score. Please try again.'
}

function logSupabaseError(context, error) {
  if (import.meta.env.DEV) console.error(context, error)
}

export async function getGolfScores() {
  const client = requireSupabase()
  const { data, error } = await client
    .from('golf_scores')
    .select('id, score, score_date, created_at, updated_at')
    .order('score_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    logSupabaseError('Unable to load golf scores.', error)
    throw new Error('Unable to load your golf scores.')
  }
  return data || []
}

export async function addGolfScore(score, scoreDate) {
  const { data, error } = await requireSupabase().rpc('add_golf_score', {
    p_score: score,
    p_score_date: scoreDate,
  })
  if (error) {
    logSupabaseError('Unable to add golf score.', error)
    throw new Error(getUserMessage(error))
  }
  return data || []
}

export async function updateGolfScore(id, score, scoreDate) {
  const { data, error } = await requireSupabase().rpc('update_golf_score', {
    p_id: id,
    p_score: score,
    p_score_date: scoreDate,
  })
  if (error) {
    logSupabaseError('Unable to update golf score.', error)
    throw new Error(getUserMessage(error))
  }
  return data || []
}
