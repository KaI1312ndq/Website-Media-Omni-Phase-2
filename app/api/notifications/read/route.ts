import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromCookie } from '@/lib/session-server'
import { logger } from '@/lib/logger'

/* POST /api/notifications/read — body: { id?: string, all?: boolean } */
export async function POST(req: NextRequest) {
  const session = await getSessionFromCookie()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json().catch(() => ({}))
    const { id, all } = body || {}
    const now = new Date().toISOString()

    if (all) {
      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ read_at: now })
        .eq('recipient', session.username)
        .is('read_at', null)
      if (error) throw error
      return NextResponse.json({ ok: true })
    }

    if (id) {
      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ read_at: now })
        .eq('id', id)
        .eq('recipient', session.username)
      if (error) throw error
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Missing id or all' }, { status: 400 })
  } catch (e) {
    logger.error({ err: e, ctx: 'POST /api/notifications/read' }, 'mark-read failed')
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
