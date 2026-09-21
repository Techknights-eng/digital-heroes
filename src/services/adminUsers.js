import { supabase } from '../lib/supabaseClient.js'

function requireSupabase() {
  if (!supabase) throw new Error('Admin user management is not configured yet.')
  return supabase
}

function logError(context, error) {
  if (import.meta.env.DEV) console.error(context, error)
}

export async function getAdminUsers() {
  const { data, error } = await requireSupabase().functions.invoke('admin-users', { body: { action: 'list' } })
  if (error || data?.error) {
    logError('Unable to load admin users.', error || data.error)
    throw new Error(data?.error || 'Unable to load users.')
  }
  return data?.users || []
}

export async function updateAdminUser(userId, updates) {
  const { data, error } = await requireSupabase().functions.invoke('admin-users', { body: { action: 'update', user_id: userId, ...updates } })
  if (error || data?.error) {
    logError('Unable to update admin user.', error || data.error)
    throw new Error(data?.error || 'Unable to update user.')
  }
  return data?.user
}
