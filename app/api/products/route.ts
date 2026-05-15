import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromCookie } from '@/lib/session-server'
import { logger } from '@/lib/logger'
import { normalizeMaSP } from '@/lib/products/parsers/master-xlsx'
import type { ProductMasterRow } from '@/lib/products/types'

function trim(v: unknown, max = 500): string | null {
  if (typeof v !== 'string') return null
  const s = v.replace(/[<>]/g, '').trim()
  if (!s) return null
  return s.slice(0, max)
}

/* GET /api/products?brand=<brand_name>
 * Trả tất cả product_master rows cho brand, sort ten_define ASC then ma_san_pham ASC.
 */
export async function GET(req: NextRequest) {
  const session = await getSessionFromCookie()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const brand = (new URL(req.url).searchParams.get('brand') || '').trim()
  if (!brand) return NextResponse.json({ error: 'Missing brand' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('product_master')
    .select('*')
    .eq('brand_name', brand)
    .order('ten_define', { ascending: true, nullsFirst: false })
    .order('ma_san_pham', { ascending: true })

  if (error) {
    logger.error({ err: error, ctx: 'GET /api/products' }, 'fetch products failed')
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data || [] })
}

/* POST /api/products
 *   - action=save:   body { brand_name, rows: ProductMasterRow[] } → upsert
 *   - action=import: body { brand_name, rows: ParsedMasterRow[] }  → INSERT mới,
 *                    KHÔNG ghi đè ten_define của Mã đã có.
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

    // Upsert per row. Mã SP rỗng → skip.
    const now = new Date().toISOString()
    type SaveRow = {
      brand_name: string
      ma_san_pham: string
      ten_shopee: string | null
      ten_define: string | null
      sku_code: string | null
      updated_by: string
      updated_at: string
    }
    const payload: SaveRow[] = (rows as ProductMasterRow[])
      .map((r): SaveRow | null => {
        const ma = normalizeMaSP(r.ma_san_pham)
        if (!ma) return null
        return {
          brand_name: brand,
          ma_san_pham: ma,
          ten_shopee: trim(r.ten_shopee, 500),
          ten_define: trim(r.ten_define, 200),
          sku_code: trim(r.sku_code, 100),
          updated_by: session.username,
          updated_at: now,
        }
      })
      .filter((x): x is SaveRow => x !== null)

    if (payload.length === 0) return NextResponse.json({ ok: true, updated: 0 })

    const { error } = await supabaseAdmin
      .from('product_master')
      .upsert(payload, { onConflict: 'brand_name,ma_san_pham' })
    if (error) {
      logger.error({ err: error, ctx: 'POST /api/products save' }, 'upsert products failed')
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true, updated: payload.length })
  }

  if (action === 'import') {
    const rows = Array.isArray(body.rows) ? body.rows : []
    if (rows.length === 0) return NextResponse.json({ ok: true, inserted: 0, skipped: 0 })

    // Lấy danh sách Mã đã tồn tại để KHÔNG ghi đè ten_define
    const { data: existing, error: e1 } = await supabaseAdmin
      .from('product_master')
      .select('ma_san_pham')
      .eq('brand_name', brand)
    if (e1) {
      logger.error({ err: e1, ctx: 'POST /api/products import (select)' }, 'fetch existing failed')
      return NextResponse.json({ error: e1.message }, { status: 500 })
    }
    const existingSet = new Set((existing || []).map(e => String(e.ma_san_pham)))

    const now = new Date().toISOString()
    type ImportRow = {
      ma_san_pham?: unknown
      ten_shopee?: unknown
      sku_code?: unknown
    }
    type InsertRow = {
      brand_name: string
      ma_san_pham: string
      ten_shopee: string | null
      sku_code: string | null
      ten_define: null
      updated_by: string
      updated_at: string
    }
    const toInsert: InsertRow[] = (rows as ImportRow[])
      .map((r): InsertRow | null => {
        const ma = normalizeMaSP(r.ma_san_pham)
        if (!ma) return null
        if (existingSet.has(ma)) return null
        return {
          brand_name: brand,
          ma_san_pham: ma,
          ten_shopee: trim(r.ten_shopee, 500),
          sku_code: trim(r.sku_code, 100),
          ten_define: null,
          updated_by: session.username,
          updated_at: now,
        }
      })
      .filter((x): x is InsertRow => x !== null)

    let inserted = 0
    if (toInsert.length > 0) {
      const { error: e2 } = await supabaseAdmin.from('product_master').insert(toInsert)
      if (e2) {
        logger.error({ err: e2, ctx: 'POST /api/products import (insert)' }, 'insert failed')
        return NextResponse.json({ error: e2.message }, { status: 500 })
      }
      inserted = toInsert.length
    }

    return NextResponse.json({
      ok: true,
      inserted,
      skipped: rows.length - inserted,
    })
  }

  if (action === 'delete') {
    const ids = Array.isArray(body.ids) ? body.ids.filter((x: unknown) => typeof x === 'string') : []
    if (ids.length === 0) return NextResponse.json({ ok: true, deleted: 0 })
    const { error } = await supabaseAdmin
      .from('product_master')
      .delete()
      .eq('brand_name', brand)
      .in('id', ids)
    if (error) {
      logger.error({ err: error, ctx: 'POST /api/products delete' }, 'bulk delete failed')
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true, deleted: ids.length })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

/* DELETE /api/products?id=<uuid> */
export async function DELETE(req: NextRequest) {
  const session = await getSessionFromCookie()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = new URL(req.url).searchParams.get('id') || ''
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const { error } = await supabaseAdmin.from('product_master').delete().eq('id', id)
  if (error) {
    logger.error({ err: error, ctx: 'DELETE /api/products' }, 'delete failed')
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
