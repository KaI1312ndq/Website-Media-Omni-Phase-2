import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromCookie } from '@/lib/session-server'
import { logger } from '@/lib/logger'
import { normalizeProductId } from '@/lib/products/parsers/master-tiktok'
import type { TiktokMasterRow } from '@/lib/products/types'

function trim(v: unknown, max = 500): string | null {
  if (typeof v !== 'string') return null
  const s = v.replace(/[<>]/g, '').trim()
  if (!s) return null
  return s.slice(0, max)
}

/* GET /api/products/tiktok?brand=<brand_name> */
export async function GET(req: NextRequest) {
  const session = await getSessionFromCookie()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const brand = (new URL(req.url).searchParams.get('brand') || '').trim()
  if (!brand) return NextResponse.json({ error: 'Missing brand' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('product_master_tiktok')
    .select('*')
    .eq('brand_name', brand)
    .order('ten_define', { ascending: true, nullsFirst: false })
    .order('product_id', { ascending: true })

  if (error) {
    logger.error({ err: error, ctx: 'GET /api/products/tiktok' }, 'fetch failed')
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ data: data || [] })
}

/* POST /api/products/tiktok
 *   - action=save:   upsert rows
 *   - action=import: INSERT-only (không ghi đè ten_define)
 */
export async function POST(req: NextRequest) {
  const session = await getSessionFromCookie()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const action = body.action as string
  const brand = trim(body.brand_name, 200)
  if (!brand) return NextResponse.json({ error: 'Missing brand_name' }, { status: 400 })

  if (action === 'save') {
    const rows = Array.isArray(body.rows) ? body.rows : []
    if (rows.length === 0) return NextResponse.json({ ok: true, updated: 0 })

    const now = new Date().toISOString()
    type SaveRow = {
      brand_name: string
      product_id: string
      ten_tiktok: string | null
      ten_define: string | null
      category: string | null
      updated_by: string
      updated_at: string
    }
    const payload: SaveRow[] = (rows as TiktokMasterRow[])
      .map((r): SaveRow | null => {
        const pid = normalizeProductId(r.product_id)
        if (!pid) return null
        return {
          brand_name: brand,
          product_id: pid,
          ten_tiktok: trim(r.ten_tiktok, 500),
          ten_define: trim(r.ten_define, 200),
          category: trim(r.category, 200),
          updated_by: session.username,
          updated_at: now,
        }
      })
      .filter((x): x is SaveRow => x !== null)

    if (payload.length === 0) return NextResponse.json({ ok: true, updated: 0 })

    const { error } = await supabaseAdmin
      .from('product_master_tiktok')
      .upsert(payload, { onConflict: 'brand_name,product_id' })
    if (error) {
      logger.error({ err: error, ctx: 'POST /api/products/tiktok save' }, 'upsert failed')
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true, updated: payload.length })
  }

  if (action === 'import') {
    const rows = Array.isArray(body.rows) ? body.rows : []
    if (rows.length === 0) return NextResponse.json({ ok: true, inserted: 0, skipped: 0 })

    const { data: existing, error: e1 } = await supabaseAdmin
      .from('product_master_tiktok')
      .select('product_id')
      .eq('brand_name', brand)
    if (e1) {
      logger.error({ err: e1, ctx: 'POST /api/products/tiktok import (select)' }, 'fetch existing failed')
      return NextResponse.json({ error: e1.message }, { status: 500 })
    }
    const existingSet = new Set((existing || []).map(e => String(e.product_id)))

    const now = new Date().toISOString()
    type ImportRow = { product_id?: unknown; ten_tiktok?: unknown; category?: unknown }
    type InsertRow = {
      brand_name: string
      product_id: string
      ten_tiktok: string | null
      category: string | null
      ten_define: null
      updated_by: string
      updated_at: string
    }
    const toInsert: InsertRow[] = (rows as ImportRow[])
      .map((r): InsertRow | null => {
        const pid = normalizeProductId(r.product_id)
        if (!pid) return null
        if (existingSet.has(pid)) return null
        return {
          brand_name: brand,
          product_id: pid,
          ten_tiktok: trim(r.ten_tiktok, 500),
          category: trim(r.category, 200),
          ten_define: null,
          updated_by: session.username,
          updated_at: now,
        }
      })
      .filter((x): x is InsertRow => x !== null)

    let inserted = 0
    if (toInsert.length > 0) {
      const { error: e2 } = await supabaseAdmin.from('product_master_tiktok').insert(toInsert)
      if (e2) {
        logger.error({ err: e2, ctx: 'POST /api/products/tiktok import (insert)' }, 'insert failed')
        return NextResponse.json({ error: e2.message }, { status: 500 })
      }
      inserted = toInsert.length
    }

    return NextResponse.json({ ok: true, inserted, skipped: rows.length - inserted })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionFromCookie()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = new URL(req.url).searchParams.get('id') || ''
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const { error } = await supabaseAdmin.from('product_master_tiktok').delete().eq('id', id)
  if (error) {
    logger.error({ err: error, ctx: 'DELETE /api/products/tiktok' }, 'delete failed')
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
