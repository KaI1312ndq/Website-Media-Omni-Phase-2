import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/* assigned_members is a STRING in DB ("all" or "user1,user2,..."). */
function isAssignedTo(assigned: string | null | undefined, username: string): boolean {
  if (!assigned) return false
  const trimmed = assigned.trim()
  if (trimmed === 'all') return true
  return trimmed.split(',').map(s => s.trim()).includes(username)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const username = searchParams.get('username')

  const { data, error } = await supabaseAdmin
    .from('brands').select('*').eq('active', true).order('brand_name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Filter in code (since assigned_members is now text, not array)
  const filtered = username
    ? (data || []).filter(b => isAssignedTo(b.assigned_members, username))
    : (data || [])

  return NextResponse.json({ data: filtered })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action, id, ...fields } = body

  // Normalize assigned_members → always store as string
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
