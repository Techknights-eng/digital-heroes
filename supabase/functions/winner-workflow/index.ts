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
  if (!authorization || !url || !anonKey || !serviceRoleKey) return json({ error: 'Winner workflow is not configured.' }, 500)
  const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } })
  const { data: userData, error: userError } = await userClient.auth.getUser()
  if (userError || !userData.user) return json({ error: 'Authentication is required.' }, 401)
  const adminClient = createClient(url, serviceRoleKey)
  const body = await request.json().catch(() => ({}))
  try {
    if (body.action === 'submit_proof') return json(await submitProof(adminClient, userData.user.id, body))
    const { data: profile } = await adminClient.from('profiles').select('role').eq('id', userData.user.id).maybeSingle()
    if (profile?.role?.toLowerCase() !== 'admin') return json({ error: 'Administrator access is required.' }, 403)
    if (body.action === 'approve') return json(await review(adminClient, userData.user.id, body, 'APPROVED'))
    if (body.action === 'reject') return json(await review(adminClient, userData.user.id, body, 'REJECTED'))
    if (body.action === 'create_payout') return json(await createPayout(adminClient, userData.user.id, body))
    if (body.action === 'mark_paid') return json(await markPaid(adminClient, userData.user.id, body))
    if (body.action === 'proof_url') return json(await proofUrl(adminClient, body))
    return json({ error: 'Unknown winner workflow operation.' }, 400)
  } catch (error) { return json({ error: error instanceof Error ? error.message : 'Winner workflow failed.' }, 400) }
})

async function submitProof(client: ReturnType<typeof createClient>, userId: string, body: Record<string, unknown>) {
  const resultId = String(body.draw_result_id || '')
  const proofData = String(body.proof_data || '')
  const contentType = String(body.content_type || '')
  const fileName = String(body.file_name || '')
  if (!resultId || !proofData || !['image/png', 'image/jpeg', 'image/webp', 'application/pdf'].includes(contentType)) throw new Error('A PNG, JPEG, WEBP, or PDF proof file is required.')
  const bytes = Uint8Array.from(atob(proofData), (char) => char.charCodeAt(0))
  if (bytes.byteLength > 10 * 1024 * 1024) throw new Error('Proof files must be 10 MB or smaller.')
  if (!matchesFileSignature(bytes, contentType)) throw new Error('The proof file content does not match its file type.')
  const { data: result } = await client.from('draw_results').select('id, user_id, match_count, draw_id, draws(status, prizes(tier, amount_per_winner))').eq('id', resultId).eq('user_id', userId).maybeSingle()
  const prize = prizeForResult(result)
  if (!result || !['PUBLISHED', 'COMPLETED'].includes(result.draws?.status) || ![3, 4, 5].includes(result.match_count) || !prize) throw new Error('Only qualifying published winners can submit proof.')
  const { data: existing } = await client.from('winner_verifications').select('id, status').eq('draw_result_id', resultId).eq('user_id', userId).maybeSingle()
  if (existing?.status === 'APPROVED') throw new Error('Approved proof cannot be replaced.')
  const path = `${userId}/${resultId}/${crypto.randomUUID()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const upload = await client.storage.from('winner-proofs').upload(path, bytes, { contentType, upsert: false })
  if (upload.error) throw new Error('Unable to store proof securely.')
  const row = { draw_result_id: resultId, user_id: userId, proof_url: path, status: 'PENDING', admin_notes: null, reviewed_by: null, reviewed_at: null }
  const saved = existing ? await client.from('winner_verifications').update(row).eq('id', existing.id).select().single() : await client.from('winner_verifications').insert(row).select().single()
  if (saved.error) throw new Error('Unable to save proof submission.')
  return saved.data
}

function matchesFileSignature(bytes: Uint8Array, contentType: string) {
  if (contentType === 'image/png') return bytes.slice(0, 8).every((value, index) => value === [137, 80, 78, 71, 13, 10, 26, 10][index])
  if (contentType === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  if (contentType === 'application/pdf') return new TextDecoder().decode(bytes.slice(0, 5)) === '%PDF-'
  if (contentType === 'image/webp') return new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF' && new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP'
  return false
}

async function review(client: ReturnType<typeof createClient>, adminId: string, body: Record<string, unknown>, status: 'APPROVED' | 'REJECTED') {
  const verificationId = String(body.verification_id || '')
  const { data: verification } = await client.from('winner_verifications').select('id, status, draw_result_id, user_id').eq('id', verificationId).maybeSingle()
  if (!verification || verification.status !== 'PENDING') throw new Error('Only pending verifications can be reviewed.')
  const { data, error } = await client.from('winner_verifications').update({ status, admin_notes: body.admin_notes || null, reviewed_by: adminId, reviewed_at: new Date().toISOString() }).eq('id', verificationId).eq('status', 'PENDING').select().single()
  if (error) throw new Error('Unable to update verification.')
  await client.from('admin_actions').insert({ admin_id: adminId, action: status === 'APPROVED' ? 'WINNER_PROOF_APPROVED' : 'WINNER_PROOF_REJECTED', metadata: { verification_id: verificationId, draw_result_id: verification.draw_result_id, admin_notes: body.admin_notes || null } })
  if (status === 'APPROVED') await createPayout(client, adminId, { verification_id: verificationId })
  return data
}

async function createPayout(client: ReturnType<typeof createClient>, adminId: string, body: Record<string, unknown>) {
  const verificationId = String(body.verification_id || '')
  const { data: verification } = await client.from('winner_verifications').select('id, user_id, status, draw_result_id, draw_results(match_count, draws(currency, prizes(tier, amount_per_winner)))').eq('id', verificationId).maybeSingle()
  const prize = prizeForResult(verification?.draw_results)
  if (!verification || verification.status !== 'APPROVED' || !prize) throw new Error('Payout requires an approved winner with a finalized prize.')
  const amount = prize.amount_per_winner
  const { data, error } = await client.from('payouts').upsert({ winner_verification_id: verification.id, user_id: verification.user_id, amount, currency: verification.draw_results.draws?.currency || 'INR', status: 'PENDING' }, { onConflict: 'winner_verification_id' }).select().single()
  if (error) throw new Error('Unable to create payout.')
  await client.from('admin_actions').insert({ admin_id: adminId, action: 'PAYOUT_CREATED', metadata: { payout_id: data.id, verification_id: verification.id, amount } })
  return data
}

function prizeForResult(result: any) {
  const prizes = result?.draws?.prizes || []
  return prizes.find((prize: any) => tierMatches(prize.tier, result?.match_count)) || null
}

function tierMatches(tier: unknown, matchCount: unknown) {
  const matchText = String(matchCount)
  const tierText = String(tier || '').toUpperCase()
  return Number(tier) === Number(matchCount) || tierText === matchText || tierText.startsWith(matchText) || tierText.includes(`${matchText}_`)
}

async function markPaid(client: ReturnType<typeof createClient>, adminId: string, body: Record<string, unknown>) {
  const payoutId = String(body.payout_id || '')
  const reference = String(body.payment_reference || '').trim()
  if (!reference) throw new Error('A payment reference is required.')
  const { data: payout } = await client.from('payouts').select('id, status, amount, user_id, winner_verification_id, winner_verifications(status)').eq('id', payoutId).maybeSingle()
  if (!payout || payout.status !== 'PENDING' || payout.winner_verifications?.status !== 'APPROVED') throw new Error('Only pending payouts for approved winners can be marked paid.')
  const { data, error } = await client.from('payouts').update({ status: 'PAID', payment_reference: reference, paid_at: new Date().toISOString() }).eq('id', payoutId).eq('status', 'PENDING').select().single()
  if (error) throw new Error('Unable to mark payout paid.')
  await client.from('admin_actions').insert({ admin_id: adminId, action: 'PAYOUT_MARKED_PAID', metadata: { payout_id: payoutId, amount: payout.amount } })
  return data
}

async function proofUrl(client: ReturnType<typeof createClient>, body: Record<string, unknown>) {
  const { data: verification } = await client.from('winner_verifications').select('proof_url').eq('id', String(body.verification_id || '')).maybeSingle()
  if (!verification?.proof_url) throw new Error('Proof file not found.')
  const { data, error } = await client.storage.from('winner-proofs').createSignedUrl(verification.proof_url, 300)
  if (error) throw new Error('Unable to open proof file.')
  return { url: data.signedUrl }
}
