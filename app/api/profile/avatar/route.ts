import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@sanity/client'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromCookie } from '@/lib/session-server'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'
export const maxDuration = 60

const MAX_SIZE = 5 * 1024 * 1024 // 5MB

function getSanityWriteClient() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
  const token = process.env.SANITY_API_TOKEN
  if (!projectId || !token) return null
  return createClient({
    projectId,
    dataset,
    apiVersion: '2024-01-01',
    token,
    useCdn: false,
  })
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromCookie()
  if (!session) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Yêu cầu phải là multipart/form-data' }, { status: 400 })
  }
  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Thiếu file' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File vượt quá 5MB' }, { status: 413 })
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'File phải là ảnh' }, { status: 400 })
  }

  const sanity = getSanityWriteClient()
  if (!sanity) {
    return NextResponse.json({ error: 'Sanity chưa được cấu hình (thiếu SANITY_API_TOKEN)' }, { status: 500 })
  }

  // Upload tới Sanity assets
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  let asset
  try {
    asset = await sanity.assets.upload('image', buffer, {
      filename: file.name || `avatar-${session.username}.png`,
      contentType: file.type || 'image/png',
    })
  } catch (e: any) {
    return NextResponse.json({ error: 'Upload Sanity lỗi: ' + (e?.message || 'unknown') }, { status: 500 })
  }

  const url: string = asset.url
  const assetId: string = asset._id

  // Update Supabase users.avatar_url
  const { error: updErr } = await supabaseAdmin
    .from('users')
    .update({ avatar_url: url })
    .eq('id', session.id)
  if (updErr) {
    return NextResponse.json({ error: 'DB lỗi: ' + updErr.message }, { status: 500 })
  }

  // Sync với teamMember nếu có match theo name (case-insensitive, trimmed)
  let syncedToSanity = false
  let matchedTeamName: string | null = null
  try {
    const normalizedName = (session.name || '').trim()
    // Try exact first, then case-insensitive
    let tm = await sanity.fetch<{ _id: string; name: string } | null>(
      `*[_type == "teamMember" && name == $name][0]{_id, name}`,
      { name: normalizedName }
    )
    if (!tm?._id) {
      tm = await sanity.fetch<{ _id: string; name: string } | null>(
        `*[_type == "teamMember" && lower(name) == lower($name)][0]{_id, name}`,
        { name: normalizedName }
      )
    }
    if (tm?._id) {
      await sanity
        .patch(tm._id)
        .set({ avatar: { _type: 'image', asset: { _type: 'reference', _ref: assetId } } })
        .commit()
      syncedToSanity = true
      matchedTeamName = tm.name
    }
  } catch (e) {
    logger.error({ err: e, ctx: 'avatar Sanity sync' }, 'sanity sync failed')
  }

  // Revalidate homepage để Team section show ảnh mới (revalidate luôn cả khi không sync Sanity, vì có thể HomeClient sẽ đọc từ users.avatar_url ở phase sau)
  try {
    revalidatePath('/')
    revalidatePath('/dashboard')
  } catch {}

  // Refresh session cookie với avatar_url mới
  try {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const next = { ...session, avatar_url: url }
    cookieStore.set('mo_session', JSON.stringify(next), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
  } catch {}

  return NextResponse.json({ ok: true, url, synced_to_sanity: syncedToSanity, matched_team_name: matchedTeamName })
}
