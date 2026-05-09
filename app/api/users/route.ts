import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, username, name, role, status, perms, created_at')
    .order('created_at')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ users: data })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action, username, ...fields } = body

  if (action === 'create') {
    const { error } = await supabaseAdmin.from('users').insert([{
      username: username.toLowerCase(),
      name: fields.name,
      password: fields.password,
      role: fields.role || 'member',
      status: fields.status || 'active',
      perms: fields.perms || {},
    }])
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'update') {
    const updates: Record<string, unknown> = {}
    if (fields.name) updates.name = fields.name
    if (fields.role) updates.role = fields.role
    if (fields.status) updates.status = fields.status
    if (fields.perms !== undefined) updates.perms = fields.perms
    if (fields.password) updates.password = fields.password

    const { error } = await supabaseAdmin.from('users').update(updates).eq('username', username)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'delete') {
    const { error } = await supabaseAdmin.from('users').delete().eq('username', username)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
