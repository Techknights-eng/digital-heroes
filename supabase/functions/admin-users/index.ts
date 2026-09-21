import { createClient } from 'npm:@supabase/supabase-js@2.116.0'

const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Content-Type': 'application/json' }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers })
const allowedRoles = new Set(['ADMIN', 'SUBSCRIBER'])

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers })
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const authorization = request.headers.get('Authorization')
  const url = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!authorization || !url || !anonKey || !serviceRoleKey) return json({ error: 'Admin user management is not configured.' }, 500)

  const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } })
  const { data: userData, error: userError } = await userClient.auth.getUser()
  if (userError || !userData.user) return json({ error: 'Authentication is required.' }, 401)

  const adminClient = createClient(url, serviceRoleKey)
  const { data: adminProfile, error: adminProfileError } = await adminClient.from('profiles').select('role').eq('id', userData.user.id).maybeSingle()
  if (adminProfileError) {
    console.error('Unable to verify admin profile.', adminProfileError)
    return json({ error: 'Unable to verify administrator access.' }, 500)
  }
  if (adminProfile?.role?.toLowerCase() !== 'admin') return json({ error: 'Administrator access is required.' }, 403)

  const body = await request.json().catch(() => ({}))
  try {
    if (body.action === 'list') return json({ users: await listUsers(adminClient) })
    if (body.action === 'update') return json({ user: await updateUser(adminClient, userData.user.id, body) })
    return json({ error: 'Unknown admin user operation.' }, 400)
  } catch (error) {
    console.error('Admin user operation failed.', error)
    return json({ error: error instanceof Error ? error.message : 'Admin user operation failed.' }, 400)
  }
})

async function listUsers(client: ReturnType<typeof createClient>) {
  const { data: profiles, error: profileError } = await client
    .from('profiles')
    .select('id, full_name, phone, role, created_at, subscriptions(id, status, current_period_end, subscription_plans(name, billing_interval))')
    .order('created_at', { ascending: false })
    .range(0, 999)
  if (profileError) throw new Error('Unable to load user profiles.')

  const { data: authUsers, error: authError } = await client.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (authError) throw new Error('Unable to load user auth details.')
  const emailById = new Map((authUsers.users || []).map((user) => [user.id, user.email || '']))

  return (profiles || []).map((profile) => {
    const subscriptions = Array.isArray(profile.subscriptions) ? profile.subscriptions : []
    const latestSubscription = subscriptions[0] || null
    return { ...profile, email: emailById.get(profile.id) || '', latest_subscription: latestSubscription }
  })
}

async function updateUser(client: ReturnType<typeof createClient>, adminId: string, body: Record<string, unknown>) {
  const userId = String(body.user_id || '')
  if (!userId) throw new Error('A user is required.')

  const updates: Record<string, string | null> = {}
  if ('full_name' in body) updates.full_name = cleanText(body.full_name, 120)
  if ('phone' in body) updates.phone = cleanText(body.phone, 40)
  if ('role' in body) {
    const role = String(body.role || '').trim().toUpperCase()
    if (!allowedRoles.has(role)) throw new Error('Role must be ADMIN or SUBSCRIBER.')
    if (userId === adminId) throw new Error('Admins cannot change their own role from this screen.')
    updates.role = role
  }
  if (!Object.keys(updates).length) throw new Error('No editable profile fields were provided.')

  const { data, error } = await client.from('profiles').update(updates).eq('id', userId).select('id, full_name, phone, role, created_at').single()
  if (error) {
    console.error('Unable to update user profile.', error)
    throw new Error('Unable to update user profile.')
  }

  await client.from('admin_actions').insert({ admin_id: adminId, action: 'USER_PROFILE_UPDATED', metadata: { user_id: userId, fields: Object.keys(updates) } })
  return data
}

function cleanText(value: unknown, maxLength: number) {
  const text = String(value ?? '').trim()
  return text ? text.slice(0, maxLength) : null
}
