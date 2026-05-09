import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const username = searchParams.get('username')

  let query = supabaseAdmin.from('brands').select('*').eq('active', true).order('brand_name')
  if (username) query = query.contains('assigned_members', [username])

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action, id, ...fields } = body

  if (action === 'create') {
    const { error } = await supabaseAdmin.from('brands').insert([{
      brand_name: fields.brand_name,
      assigned_members: fields.assigned_members || [],
    }])
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'update') {
    const { error } = await supabaseAdmin.from('brands').update({
      brand_name: fields.brand_name,
      assigned_members: fields.assigned_members,
      active: fields.active,
    }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
