import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromCookie } from '@/lib/session-server'
import { logger } from '@/lib/logger'

/* GET /api/notifications?unread_only=true&limit=20 */
export async function GET(req: NextRequest) {
  const session = await getSessionFromCookie()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const unreadOnly = searchParams.get('unread_only') === 'true'
  const limit = Math.min(parseInt(searchParams.get('limit') || '20') || 20, 100)

  try {
    let q = supabaseAdmin
      .from('notifications')
      .select('*')
      .eq('recipient', session.username)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (unreadOnly) q = q.is('read_at', null)

    const { data, error } = await q
    if (error) throw error

    const { count: unreadCount } = await supabaseAdmin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('recipient', session.username)
      .is('read_at', null)

    const { count: total } = await supabaseAdmin
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('recipient', session.username)

    return NextResponse.json({
      notifications: data || [],
      unread_count: unreadCount || 0,
      total: total || 0,
    })
  } catch (e) {
    logger.error({ err: e, ctx: 'GET /api/notifications' }, 'fetch notifications failed')
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}

/* POST /api/notifications — internal use to create notification */
export async function POST(req: NextRequest) {
  const internalKey = process.env.INTERNAL_API_KEY
  if (internalKey) {
    const headerKey = req.headers.get('x-internal-key')
    if (headerKey !== internalKey) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  } else {
    // No internal key configured: still require authenticated session for safety
    const session = await getSessionFromCookie()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { recipient, type, title } = body
    if (!recipient || !type || !title) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    const { error } = await supabaseAdmin.from('notifications').insert({
      recipient: String(recipient),
      type: String(type),
      title: String(title),
      body: body.body || null,
      link: body.link || null,
      icon: body.icon || null,
      priority: body.priority || 'normal',
    })
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e) {
    logger.error({ err: e, ctx: 'POST /api/notifications' }, 'create notification failed')
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}

/* DELETE /api/notifications?id=X */
export async function DELETE(req: NextRequest) {
  const session = await getSessionFromCookie()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id') || ''
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('recipient', session.username)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e) {
    logger.error({ err: e, ctx: 'DELETE /api/notifications' }, 'delete notification failed')
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}
