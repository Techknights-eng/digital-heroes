import { supabase } from '../lib/supabaseClient.js'

function requireSupabase() {
  if (!supabase) throw new Error('Charity data is not configured yet.')
  return supabase
}

function friendlyError(error, fallback) {
  const message = error?.message?.toLowerCase() || ''
  if (message.includes('between 10 and 100')) return 'Contribution percentage must be between 10% and 100%.'
  if (message.includes('not available')) return 'That charity is no longer available.'
  return fallback
}

export async function getActiveCharities({ search = '', featuredOnly = false } = {}) {
  let query = requireSupabase().from('charities').select('*').eq('is_active', true).order('is_featured', { ascending: false }).order('name')
  if (search.trim()) query = query.ilike('name', `%${search.trim()}%`)
  if (featuredOnly) query = query.eq('is_featured', true)
  const { data, error } = await query
  if (error) throw new Error('Unable to load charities.')
  return data || []
}

export async function getCharityById(id) {
  if (!isDatabaseIdentifier(id)) return null
  const { data, error } = await requireSupabase().from('charities').select('*').eq('id', id).eq('is_active', true).maybeSingle()
  if (error) throw new Error('Unable to load this charity.')
  return data
}

export async function getCharityEvents(charityId) {
  if (!isDatabaseIdentifier(charityId)) return []
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await requireSupabase().from('charity_events').select('*').eq('charity_id', charityId).gte('event_date', today).order('event_date')
  if (error) throw new Error('Unable to load charity events.')
  return data || []
}

export async function getMyCharityContribution() {
  const { data, error } = await requireSupabase().from('charity_contributions').select('id, charity_id, percentage, amount, currency, created_at, charities(id, name, description, image_url, website_url, is_featured, is_active)').order('created_at', { ascending: false }).limit(1).maybeSingle()
  if (error) throw new Error('Unable to load your charity selection.')
  return data
}

export async function selectCharity(charityId, percentage) {
  const { data, error } = await requireSupabase().rpc('select_charity', { p_charity_id: String(charityId), p_percentage: percentage })
  if (error) throw new Error(friendlyError(error, 'Unable to save your charity selection.'))
  return data?.[0] || null
}

export async function getAdminCharities() {
  const { data, error } = await requireSupabase().from('charities').select('*').order('name')
  if (error) throw new Error('Unable to load charity management data.')
  return data || []
}

export async function createCharity(fields) {
  const { data, error } = await requireSupabase().from('charities').insert(fields).select().single()
  if (error) throw new Error('Unable to create the charity.')
  return data
}

export async function updateCharity(id, fields) {
  const { data, error } = await requireSupabase().from('charities').update(fields).eq('id', id).select().single()
  if (error) throw new Error('Unable to update the charity.')
  return data
}

function isDatabaseIdentifier(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) || /^\d+$/.test(value)
}