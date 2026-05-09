import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const assignee = searchParams.get('assignee')
  const date = searchParams.get('date')
  const week_start = searchParams.get('week_start')
  const week_end = searchParams.get('week_end')

  let query = supabaseAdmin.from('tasks').select('*').order('date').order('time_start', { nullsFirst: true })

  if (assignee) query = query.eq('assignee', assignee)
  if (date) query = query.eq('date', date)
  if (week_start && week_end) query = query.gte('date', week_start).lte('date', week_end)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action, id, ...fields } = body

  if (action === 'toggle') {
    const { error } = await supabaseAdmin.from('tasks').update({ status: fields.status }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'delete') {
    const { error } = await supabaseAdmin.from('tasks').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // Create
  const { data, error } = await supabaseAdmin.from('tasks').insert([{
    task_name: fields.task_name,
    description: fields.description || null,
    assignee: fields.assignee,
    assignee_name: fields.assignee_name || null,
    date: fields.date,
    time_start: fields.time_start || null,
    time_end: fields.time_end || null,
    priority: fields.priority || 'medium',
    status: 'todo',
    created_by: fields.created_by,
    created_name: fields.created_name,
  }]).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, data })
}
