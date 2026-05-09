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

  // Vietnamese date string DD/M/YYYY
  const today = new Date()
  const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`

  const { data, error } = await supabaseAdmin.from('quiz_scores').insert([{
    username:     body.username,
    name:         body.name,
    role:         body.role || null,                                  // admin / member / upbase
    quiz_type:    body.quiz_type,                                     // 'Dạng 1 - Benchmark', 'Dạng 2 - Chỉ số Ads', etc.
    topic:        body.topic || null,                                 // 'Benchmark ALL · ALL', 'Chỉ số Ads', etc.
    score:        body.score,
    total:        body.total,
    percentage:   Math.round((body.score / body.total) * 100),
    duration_min: body.duration_min || 0,                             // Thời gian làm bài (phút)
    quiz_date:    body.quiz_date || dateStr,                          // Ngày làm (định dạng VN)
  }]).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, data })
}
