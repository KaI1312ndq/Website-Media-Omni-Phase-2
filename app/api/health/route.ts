import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { client as sanityClient } from '@/lib/sanity'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function checkSupabase(): Promise<'ok' | 'fail'> {
  try {
    const { error } = await supabaseAdmin.from('users').select('id', { head: true, count: 'exact' }).limit(1)
    return error ? 'fail' : 'ok'
  } catch {
    return 'fail'
  }
}

async function checkSanity(): Promise<'ok' | 'fail'> {
  try {
    await sanityClient.fetch<number>('count(*[_type == "siteSettings"])')
    return 'ok'
  } catch {
    return 'fail'
  }
}

export async function GET() {
  const [db, sanity] = await Promise.all([checkSupabase(), checkSanity()])
  const status = db === 'ok' && sanity === 'ok' ? 'ok' : 'degraded'
  const httpCode = status === 'ok' ? 200 : 503

  return NextResponse.json(
    {
      status,
      db,
      sanity,
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'dev',
      env: process.env.VERCEL_ENV ?? 'local',
      time: new Date().toISOString(),
    },
    { status: httpCode },
  )
}
