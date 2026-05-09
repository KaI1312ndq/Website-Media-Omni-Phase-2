import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

function startOfDay(d: Date) {
  const x = new Date(d); x.setHours(0, 0, 0, 0); return x
}
function isoDate(d: Date) {
  return d.toISOString().slice(0, 10)
}
function timeAgo(iso: string) {
  const t = new Date(iso).getTime()
  const diff = Date.now() - t
  const s = Math.floor(diff / 1000)
  if (s < 60) return `${s}s trước`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} phút trước`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} giờ trước`
  const d = Math.floor(h / 24)
  return `${d} ngày trước`
}

export async function GET() {
  try {
    const now = new Date()
    const today = startOfDay(now)
    const dayOfWeek = (today.getDay() + 6) % 7 // Mon=0
    const thisWeekStart = new Date(today); thisWeekStart.setDate(today.getDate() - dayOfWeek)
    const lastWeekStart = new Date(thisWeekStart); lastWeekStart.setDate(thisWeekStart.getDate() - 7)
    const lastWeekEnd = new Date(thisWeekStart)

    // Stats
    const safeCount = async (p: PromiseLike<{ count: number | null }>) => {
      try { const r = await p; return r.count || 0 } catch { return 0 }
    }
    const [quizzesDone, tasksDone, activeUsers, reportsDone, usersTotal] = await Promise.all([
      safeCount(supabaseAdmin.from('quiz_scores').select('*', { count: 'exact', head: true })),
      safeCount(supabaseAdmin.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'done')),
      safeCount(supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('status', 'active')),
      safeCount(supabaseAdmin.from('weekly_reports').select('*', { count: 'exact', head: true })),
      safeCount(supabaseAdmin.from('users').select('*', { count: 'exact', head: true })),
    ])

    const expected = usersTotal
    const completionRate = expected > 0 ? Math.min(100, Math.round((reportsDone / expected) * 100)) : 0

    // Week chart - quizzes per day
    const weekFromIso = isoDate(lastWeekStart)
    const { data: weekRows } = await supabaseAdmin
      .from('quiz_scores')
      .select('created_at')
      .gte('created_at', weekFromIso)

    const thisWeek = [0, 0, 0, 0, 0, 0, 0]
    const lastWeek = [0, 0, 0, 0, 0, 0, 0]
    for (const r of (weekRows || [])) {
      const d = new Date((r as { created_at: string }).created_at)
      if (d >= thisWeekStart) {
        const idx = Math.floor((d.getTime() - thisWeekStart.getTime()) / 86400000)
        if (idx >= 0 && idx < 7) thisWeek[idx]++
      } else if (d >= lastWeekStart && d < lastWeekEnd) {
        const idx = Math.floor((d.getTime() - lastWeekStart.getTime()) / 86400000)
        if (idx >= 0 && idx < 7) lastWeek[idx]++
      }
    }

    // Recent activity
    const [{ data: rq }, { data: rt }] = await Promise.all([
      supabaseAdmin.from('quiz_scores').select('name, quiz_type, created_at').order('created_at', { ascending: false }).limit(5),
      supabaseAdmin.from('tasks').select('assignee, task_name, created_at').eq('status', 'done').order('created_at', { ascending: false }).limit(5),
    ])

    const acts: Array<{ type: string; user_name: string; action_text: string; timestamp: string; ago: string }> = []
    for (const r of (rq || [])) {
      acts.push({ type: 'quiz', user_name: (r as any).name || '—', action_text: `đã hoàn thành ${(r as any).quiz_type || 'quiz'}`, timestamp: (r as any).created_at, ago: timeAgo((r as any).created_at) })
    }
    for (const r of (rt || [])) {
      acts.push({ type: 'task', user_name: (r as any).assignee || '—', action_text: `đã hoàn thành task "${(r as any).task_name}"`, timestamp: (r as any).created_at, ago: timeAgo((r as any).created_at) })
    }
    acts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json({
      stats: {
        quizzes_done: quizzesDone || 0,
        tasks_done: tasksDone || 0,
        active_users: activeUsers || 0,
        completion_rate: completionRate,
      },
      weekChart: { thisWeek, lastWeek },
      recentActivity: acts.slice(0, 5),
    })
  } catch (e: any) {
    return NextResponse.json({
      stats: { quizzes_done: 0, tasks_done: 0, active_users: 0, completion_rate: 0 },
      weekChart: { thisWeek: [0, 0, 0, 0, 0, 0, 0], lastWeek: [0, 0, 0, 0, 0, 0, 0] },
      recentActivity: [],
      error: e?.message || 'unknown',
    })
  }
}
