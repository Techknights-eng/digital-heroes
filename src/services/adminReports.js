import { supabase } from '../lib/supabaseClient.js'

export async function getAdminReport(filters = {}) {
  if (!supabase) throw new Error('Reports are not configured yet.')
  const { data, error } = await supabase.functions.invoke('admin-reports', { body: filters })
  if (error || data?.error) {
    if (import.meta.env.DEV) console.error('Unable to load admin report.', error || data.error)
    throw new Error(data?.error || 'Unable to load analytics.')
  }
  return data
}

export function formatInr(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(value || 0))
}

export function formatDate(value) {
  return value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value)) : 'Not available'
}
