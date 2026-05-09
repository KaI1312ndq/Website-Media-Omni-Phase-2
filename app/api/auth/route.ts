import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'

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

  // Check password (plain text comparison — will migrate to bcrypt later)
  if (user.password !== password) {
    return NextResponse.json({ error: 'Sai tài khoản hoặc mật khẩu' }, { status: 401 })
  }

  const session = { id: user.id, username: user.username, name: user.name, role: user.role, perms: user.perms }

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
    return NextResponse.json({ user: JSON.parse(session.value) })
  } catch {
    return NextResponse.json({ user: null })
  }
}
