import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromCookie } from '@/lib/session-server'
import { logger } from '@/lib/logger'

/**
 * GET /api/products/counts
 *   Trả counts SP đã define cho cả Shopee + TikTok per brand.
 *   Response: {
 *     shopee: { 'BrandA': 5, ... },
 *     tiktok: { 'BrandA': 17, ... }
 *   }
 *
 * "Đã define" = ten_define IS NOT NULL AND ten_define <> ''.
 */
export async function GET() {
  const session = await getSessionFromCookie()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const [shp, tk] = await Promise.all([
      supabaseAdmin.from('product_master').select('brand_name, ten_define').not('ten_define', 'is', null),
      supabaseAdmin
        .from('product_master_tiktok')
        .select('brand_name, ten_define')
        .not('ten_define', 'is', null),
    ])

    const shopee: Record<string, number> = {}
    for (const r of shp.data || []) {
      if (!r.ten_define || !String(r.ten_define).trim()) continue
      shopee[r.brand_name] = (shopee[r.brand_name] ?? 0) + 1
    }
    const tiktok: Record<string, number> = {}
    for (const r of tk.data || []) {
      if (!r.ten_define || !String(r.ten_define).trim()) continue
      tiktok[r.brand_name] = (tiktok[r.brand_name] ?? 0) + 1
    }

    return NextResponse.json({ shopee, tiktok })
  } catch (e) {
    logger.error({ err: e, ctx: 'GET /api/products/counts' }, 'counts failed')
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
