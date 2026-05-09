import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { isAssignedTo } from '@/lib/session-server'

/* GET ?username=X — list { brands: [{id, brand_name, assigned_members, isAll, included}] } */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const username = (searchParams.get('username') || '').trim().toLowerCase()
  if (!username) return NextResponse.json({ error: 'username required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('brands')
    .select('id, brand_name, assigned_members, active')
    .eq('active', true)
    .order('brand_name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const brands = (data || []).map(b => {
    const assigned = (b.assigned_members ?? '').trim()
    const isAll = assigned === 'all'
    return {
      id: b.id as string,
      brand_name: b.brand_name as string,
      assigned_members: assigned,
      isAll,
      included: isAll || isAssignedTo(assigned, username),
    }
  })
  return NextResponse.json({ brands })
}

/* POST { username, brand_ids: string[] } — set assignments atomically */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as { username?: string; brand_ids?: string[] } | null
  if (!body?.username || !Array.isArray(body.brand_ids)) {
    return NextResponse.json({ error: 'username and brand_ids[] required' }, { status: 400 })
  }
  const username = body.username.trim().toLowerCase()
  const want = new Set(body.brand_ids)

  const { data, error } = await supabaseAdmin
    .from('brands')
    .select('id, assigned_members')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const updates: Promise<{ error: { message: string } | null }>[] = []
  for (const b of data || []) {
    const cur = (b.assigned_members ?? '').trim()
    // Brands open to 'all' are immutable per requirement.
    if (cur === 'all') continue

    const list: string[] = cur ? cur.split(',').map((s: string) => s.trim()).filter(Boolean) : []
    const has = list.includes(username)
    const shouldHave = want.has(b.id)

    let next: string[] | null = null
    if (shouldHave && !has) next = [...list, username]
    else if (!shouldHave && has) next = list.filter(u => u !== username)

    if (next !== null) {
      const value = next.length ? next.join(',') : 'all'
      updates.push(
        Promise.resolve(
          supabaseAdmin.from('brands').update({ assigned_members: value }).eq('id', b.id)
        )
      )
    }
  }

  const results = await Promise.all(updates)
  const firstErr = results.find(r => r && r.error)
  if (firstErr && firstErr.error) return NextResponse.json({ error: firstErr.error.message }, { status: 500 })

  return NextResponse.json({ ok: true, updated: updates.length })
}
