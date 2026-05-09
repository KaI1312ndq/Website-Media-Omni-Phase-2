import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  if (!username || !password) {
    return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 })
  }

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('username', username.toLowerCase())
    .eq('status', 'active')
    .single()

  if (error || !user) {
    return NextResponse.json({ error: 'Sai tài khoản hoặc mật khẩu' }, { status: 401 })
  }

  // Check password — supports both bcrypt-hashed and legacy plain text
  const stored = String(user.password || '')
  const looksHashed = stored.startsWith('$2a$') || stored.startsWith('$2b$') || stored.startsWith('$2y$')
  const ok = looksHashed ? await bcrypt.compare(String(password), stored) : stored === password
  if (!ok) {
    return NextResponse.json({ error: 'Sai tài khoản hoặc mật khẩu' }, { status: 401 })
  }

  const session = { id: user.id, username: user.username, name: user.name, role: user.role, perms: user.perms, avatar_url: user.avatar_url ?? null }

  const cookieStore = await cookies()
  cookieStore.set('mo_session', JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })

  return NextResponse.json({ ok: true, user: session })
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete('mo_session')
  return NextResponse.json({ ok: true })
}

export async function GET() {
  const cookieStore = await cookies()
  const session = cookieStore.get('mo_session')
  if (!session) return NextResponse.json({ user: null })
  try {
    const parsed = JSON.parse(session.value)
    // Refresh avatar_url from DB so changes propagate
    if (parsed?.id) {
      const { data } = await supabaseAdmin.from('users').select('avatar_url').eq('id', parsed.id).maybeSingle()
      if (data) parsed.avatar_url = data.avatar_url ?? null
    }
    return NextResponse.json({ user: parsed })
  } catch {
    return NextResponse.json({ user: null })
  }
}
