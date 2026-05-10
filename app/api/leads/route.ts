import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromCookie } from '@/lib/session-server'
import { notifyAdmins } from '@/lib/notify'
import { checkRateLimit, clientIp } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

/* ── Validation helpers ── */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^0\d{9}$/
const VALID_CHANNELS = ['shopee', 'tiktok', 'meta', 'google', 'livestream']
const VALID_BUDGETS = ['<50M', '50-200M', '200-500M', '>500M']
const VALID_STATUS = ['new', 'contacted', 'qualified', 'closed']

function trim(v: unknown, max = 1000): string {
  if (typeof v !== 'string') return ''
  return v.replace(/[<>]/g, '').trim().slice(0, max)
}

function isAdmin(session: { role?: string } | null): boolean {
  if (!session) return false
  const r = String(session.role || '').toLowerCase()
  return r === 'admin' || r === 'lead'
}

/* ── POST /api/leads — public ── */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const name = trim(body.name, 100)
    const email = trim(body.email, 200).toLowerCase()
    const phone = trim(body.phone, 30)
    const brand = trim(body.brand, 200)
    const note = trim(body.note, 2000)
    const monthly_budget = trim(body.monthly_budget, 20)
    const channels: string[] = Array.isArray(body.channels)
      ? body.channels.filter((c: unknown) => typeof c === 'string' && VALID_CHANNELS.includes(c as string))
      : []

    if (name.length < 2) return NextResponse.json({ error: 'Tên phải tối thiểu 2 ký tự' }, { status: 400 })
    if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'Email không hợp lệ' }, { status: 400 })
    if (phone && !PHONE_RE.test(phone)) return NextResponse.json({ error: 'Số điện thoại không hợp lệ' }, { status: 400 })
    if (channels.length === 0) return NextResponse.json({ error: 'Vui lòng chọn ít nhất 1 kênh' }, { status: 400 })
    if (!VALID_BUDGETS.includes(monthly_budget)) return NextResponse.json({ error: 'Vui lòng chọn budget' }, { status: 400 })

    const ip = clientIp(req)
    const ua = req.headers.get('user-agent') || ''

    if (ip !== 'unknown' && !checkRateLimit('leads', ip, 3, 60 * 60_000)) {
      return NextResponse.json({ error: 'Quá nhiều yêu cầu, vui lòng thử lại sau' }, { status: 429 })
    }

    // Cloudflare Turnstile verify (only when configured)
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY
    if (turnstileSecret) {
      const token = typeof body.turnstile_token === 'string' ? body.turnstile_token : ''
      if (!token) return NextResponse.json({ error: 'Thiếu xác thực bảo mật' }, { status: 400 })
      const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret: turnstileSecret, response: token, remoteip: ip }),
      })
      const verifyJson = (await verifyRes.json().catch(() => ({}))) as { success?: boolean }
      if (!verifyJson.success) {
        return NextResponse.json({ error: 'Xác thực bảo mật thất bại' }, { status: 400 })
      }
    }

    const insert = {
      name, email, phone: phone || null, brand: brand || null,
      channels, monthly_budget,
      note: note || null,
      status: 'new', source: 'homepage',
      utm_source: trim(body.utm_source, 100) || null,
      utm_medium: trim(body.utm_medium, 100) || null,
      utm_campaign: trim(body.utm_campaign, 100) || null,
      ip_address: ip || null,
      user_agent: ua || null,
    }

    const { data, error } = await supabaseAdmin.from('leads').insert(insert).select('id').single()
    if (error) {
      logger.error({ err: error, ctx: 'POST /api/leads insert' }, 'insert lead failed')
      return NextResponse.json({ error: 'Không thể lưu lead' }, { status: 500 })
    }

    // Fire notifications to admins (non-blocking on failure)
    await notifyAdmins({
      type: 'lead_new',
      title: `Lead mới — ${name}`,
      body: `${email}${brand ? ' · ' + brand : ''}${monthly_budget ? ' · ' + monthly_budget : ''}`,
      link: '/admin/leads',
      icon: 'send',
      priority: 'high',
    })

    return NextResponse.json({ ok: true, lead_id: data.id })
  } catch (err) {
    logger.error({ err, ctx: 'POST /api/leads' }, 'unhandled error')
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}

/* ── GET /api/leads — admin only ── */
export async function GET(req: NextRequest) {
  const session = await getSessionFromCookie()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || ''
  const fromDate = searchParams.get('from_date') || ''
  const toDate = searchParams.get('to_date') || ''
  const q = (searchParams.get('q') || '').trim()

  let query = supabaseAdmin.from('leads').select('*').order('created_at', { ascending: false })
  if (status && VALID_STATUS.includes(status)) query = query.eq('status', status)
  if (fromDate) query = query.gte('created_at', fromDate)
  if (toDate) query = query.lte('created_at', toDate)
  if (q) query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,brand.ilike.%${q}%`)

  const { data: leads, error } = await query
  if (error) {
    logger.error({ err: error, ctx: 'GET /api/leads' }, 'fetch leads failed')
    return NextResponse.json({ error: 'Không thể tải leads' }, { status: 500 })
  }

  // Aggregate by_status (full table, not filtered)
  const { data: allRows } = await supabaseAdmin.from('leads').select('status')
  const by_status: Record<string, number> = { new: 0, contacted: 0, qualified: 0, closed: 0 }
  ;(allRows || []).forEach((r: { status: string }) => {
    if (by_status[r.status] !== undefined) by_status[r.status]++
  })

  return NextResponse.json({ leads: leads || [], total: (leads || []).length, by_status })
}

/* ── PATCH /api/leads — admin only ── */
export async function PATCH(req: NextRequest) {
  const session = await getSessionFromCookie()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const body = await req.json()
    const id = trim(body.id, 100)
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (body.status && VALID_STATUS.includes(body.status)) {
      update.status = body.status
      if (body.status === 'contacted') {
        update.contacted_at = new Date().toISOString()
        update.contacted_by = session?.username || 'unknown'
      }
    }
    if (typeof body.note === 'string') update.note = trim(body.note, 2000)
    if (body.contacted_at) update.contacted_at = body.contacted_at
    if (body.contacted_by) update.contacted_by = trim(body.contacted_by, 100)

    const { error } = await supabaseAdmin.from('leads').update(update).eq('id', id)
    if (error) {
      logger.error({ err: error, ctx: 'PATCH /api/leads update' }, 'update lead failed')
      return NextResponse.json({ error: 'Không thể cập nhật' }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error({ err, ctx: 'PATCH /api/leads' }, 'unhandled error')
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 })
  }
}

/* ── DELETE /api/leads?id=X — admin only ── */
export async function DELETE(req: NextRequest) {
  const session = await getSessionFromCookie()
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id') || ''
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await supabaseAdmin.from('leads').delete().eq('id', id)
  if (error) {
    logger.error({ err: error, ctx: 'DELETE /api/leads' }, 'delete lead failed')
    return NextResponse.json({ error: 'Không thể xóa' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
