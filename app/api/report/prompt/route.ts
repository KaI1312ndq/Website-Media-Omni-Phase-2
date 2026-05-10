import { NextResponse } from 'next/server'
import { client as sanityClient } from '@/lib/sanity'
import { logger } from '@/lib/logger'

export const revalidate = 300 // 5 min cache; admins editing in Studio see change in 5min

export async function GET() {
  try {
    const prompt = await sanityClient.fetch<string | null>(`*[_type == "siteSettings"][0].reportAIPrompt`)
    return NextResponse.json({ prompt: prompt || null })
  } catch (e) {
    logger.error({ err: e, ctx: 'GET /api/report/prompt' }, 'fetch sanity prompt failed')
    return NextResponse.json({ prompt: null })
  }
}
