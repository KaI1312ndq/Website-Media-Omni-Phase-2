import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromCookie, isAssignedTo, canSeeAllBrands } from '@/lib/session-server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const usernameParam = searchParams.get('username') || ''
  const session = await getSessionFromCookie()

  const { data, error } = await supabaseAdmin
    .from('brands').select('*').eq('active', true).order('brand_name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const all = data || []

  // Server-side permission. Session > query param.
  let filtered = all
  if (session) {
    if (!canSeeAllBrands(session)) {
      filtered = all.filter(b => isAssignedTo(b.assigned_members, session.username))
    }
  } else if (usernameParam) {
    // Legacy fallback for clients passing ?username=
    filtered = all.filter(b => isAssignedTo(b.assigned_members, usernameParam))
  }

  return NextResponse.json({ data: filtered })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action, id, ...fields } = body

  const normalizeAssigned = (v: unknown): string => {
    if (Array.isArray(v)) return v.join(',')
    if (typeof v === 'string') return v.trim() || 'all'
    return 'all'
  }

  if (action === 'create') {
    const { error } = await supabaseAdmin.from('brands').insert([{
      brand_name: fields.brand_name,
      assigned_members: normalizeAssigned(fields.assigned_members),
    }])
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'update') {
    const { error } = await supabaseAdmin.from('brands').update({
      brand_name: fields.brand_name,
      assigned_members: normalizeAssigned(fields.assigned_members),
      active: fields.active,
    }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
