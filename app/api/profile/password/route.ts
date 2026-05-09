import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromCookie } from '@/lib/session-server'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const session = await getSessionFromCookie()
  if (!session) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })

  const { currentPassword, newPassword } = await req.json().catch(() => ({}))
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 })
  }
  if (String(newPassword).length < 6) {
    return NextResponse.json({ error: 'Mật khẩu mới phải ít nhất 6 ký tự' }, { status: 400 })
  }

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, password')
    .eq('id', session.id)
    .single()

  if (error || !user) return NextResponse.json({ error: 'Không tìm thấy tài khoản' }, { status: 404 })

  const stored = String(user.password || '')
  const looksHashed = stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')

  let ok = false
  if (looksHashed) {
    ok = await bcrypt.compare(String(currentPassword), stored)
  } else {
    ok = stored === String(currentPassword)
  }
  if (!ok) return NextResponse.json({ error: 'Mật khẩu hiện tại không đúng' }, { status: 401 })

  const hashed = await bcrypt.hash(String(newPassword), 10)
  const { error: updErr } = await supabaseAdmin
    .from('users')
    .update({ password: hashed })
    .eq('id', session.id)
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
