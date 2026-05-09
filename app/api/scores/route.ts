import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromCookie } from '@/lib/session-server'

type Row = {
  username: string
  name: string | null
  role: string | null
  quiz_type: string | null
  topic: string | null
  score: number | null
  total: number | null
  percentage: number | null
  duration_min: number | null
  quiz_date: string | null
  created_at: string
}

function pctOf(score: number, total: number): number {
  if (!total) return 0
  return Math.round((score / total) * 100)
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const session = await getSessionFromCookie()

  const fromDate = searchParams.get('fromDate') || ''
  const toDate = searchParams.get('toDate') || ''
  const quizType = searchParams.get('quizType') || ''
  let username = searchParams.get('username') || ''

  // Members locked to their own scores
  if (session && session.role !== 'admin') {
    username = session.username
  }

  let query = supabaseAdmin
    .from('quiz_scores')
    .select('*')
    .order('created_at', { ascending: false })

  if (fromDate) query = query.gte('created_at', fromDate)
  if (toDate) {
    // include the entire toDate day
    const t = new Date(toDate)
    t.setDate(t.getDate() + 1)
    query = query.lt('created_at', t.toISOString().slice(0, 10))
  }
  if (quizType) query = query.eq('quiz_type', quizType)
  if (username) query = query.eq('username', username)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const attempts: Row[] = (data || []) as Row[]

  // Summary
  const totalAttempts = attempts.length
  const avgPct = totalAttempts > 0
    ? Math.round(attempts.reduce((a, r) => a + (r.percentage ?? pctOf(r.score || 0, r.total || 0)), 0) / totalAttempts)
    : 0
  const userAvg: Record<string, { name: string; sum: number; count: number }> = {}
  attempts.forEach(r => {
    if (!r.username) return
    const p = r.percentage ?? pctOf(r.score || 0, r.total || 0)
    if (!userAvg[r.username]) userAvg[r.username] = { name: r.name || r.username, sum: 0, count: 0 }
    userAvg[r.username].sum += p
    userAvg[r.username].count += 1
  })
  let topUser: { username: string; name: string; pct: number } | null = null
  Object.entries(userAvg).forEach(([u, v]) => {
    const pct = v.count > 0 ? Math.round(v.sum / v.count) : 0
    if (!topUser || pct > topUser.pct) topUser = { username: u, name: v.name, pct }
  })
  const activeUsers = Object.keys(userAvg).length

  // Distribution
  const ranges = [
    { range: '0-50%', min: 0, max: 50 },
    { range: '50-70%', min: 50, max: 70 },
    { range: '70-85%', min: 70, max: 85 },
    { range: '85-100%', min: 85, max: 101 },
  ]
  const distribution = ranges.map(r => ({
    range: r.range,
    count: attempts.filter(a => {
      const p = a.percentage ?? pctOf(a.score || 0, a.total || 0)
      return p >= r.min && p < r.max
    }).length,
  }))

  // Top users
  const topUsers = Object.entries(userAvg)
    .map(([u, v]) => ({ username: u, name: v.name, avg_pct: Math.round(v.sum / Math.max(1, v.count)), attempts: v.count }))
    .sort((a, b) => b.avg_pct - a.avg_pct)
    .slice(0, 10)

  // Matrix user × topic with max %
  const usersSet = new Set<string>()
  const topicsSet = new Set<string>()
  const scores: Record<string, Record<string, number>> = {}
  const userNames: Record<string, string> = {}
  attempts.forEach(r => {
    const u = r.username
    const t = r.topic || r.quiz_type || 'Khác'
    if (!u) return
    usersSet.add(u)
    topicsSet.add(t)
    userNames[u] = r.name || u
    const p = r.percentage ?? pctOf(r.score || 0, r.total || 0)
    if (!scores[u]) scores[u] = {}
    if (scores[u][t] === undefined || p > scores[u][t]) scores[u][t] = p
  })
  const users = Array.from(usersSet).map(u => ({ username: u, name: userNames[u] || u }))
  const topics = Array.from(topicsSet)

  return NextResponse.json({
    summary: {
      total_attempts: totalAttempts,
      avg_pct: avgPct,
      top_user: topUser,
      active_users: activeUsers,
    },
    distribution,
    topUsers,
    matrix: { users, topics, scores },
    attempts,
  })
}
