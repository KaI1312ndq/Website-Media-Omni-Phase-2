import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const username = searchParams.get('username')

  let query = supabaseAdmin.from('quiz_scores').select('*').order('created_at', { ascending: false })
  if (username) query = query.eq('username', username)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { data, error } = await supabaseAdmin.from('quiz_scores').insert([{
    username: body.username,
    name: body.name,
    quiz_type: body.quiz_type,
    score: body.score,
    total: body.total,
    percentage: Math.round((body.score / body.total) * 100),
  }]).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, data })
}
