/**
 * TikTok Product Drilldown + Auth Section — Brief V12 §5, §6.
 *
 * Section 1 (Theo sản phẩm):
 *   - Filter: bỏ rows Product ID không trong Master (Q1)
 *   - Group theo Tên define → drilldown: Thẻ sản phẩm + Top N Video
 *
 * Section 2 (Theo loại video):
 *   - Phân loại theo Authorization type:
 *       Video code → Video KOC
 *       Affiliate mass authorization → Video Aff
 *       TikTok Shop official account / Business Center → Video Kênh
 *       NaN auth + Creative=Video → Video Aff (Q2)
 *       Product card → row riêng "Thẻ sản phẩm" (KHÔNG vào phân loại auth)
 */

import { parseTiktokPGMRaw } from './tiktok-pgm'
import { PGM_COLS, PGM_DRILL_COLS, resolveCol } from './tiktok-common'
import { normalizeProductId } from '@/lib/products/parsers/master-tiktok'
import type { TiktokMasterRow } from '@/lib/products/types'

/* ── Section 1 types ── */

export interface TiktokVideoRow {
  video_id: string
  video_title: string
  tiktok_account: string
  authorization_type: string
  product_id?: string
  gmv: number
  cost: number
  hien_thi: number
  clicks: number
  orders: number
  roas: number
  cpc: number
  cpm: number
  ctr: number
  cr: number
  aov: number
}

export interface TiktokProductCard {
  gmv: number
  cost: number
  hien_thi: number
  clicks: number
  orders: number
  roas: number
  cpc: number
  cpm: number
  ctr: number
  cr: number
  aov: number
  n_cards: number
}

export interface TiktokProductRow {
  ten_define: string
  is_undefined: boolean
  gmv: number
  cost: number
  hien_thi: number
  clicks: number
  orders: number
  roas: number
  cpc: number
  cpm: number
  ctr: number
  cr: number
  aov: number
  n_creatives: number
  product_card: TiktokProductCard | null
  top_videos: TiktokVideoRow[]
  total_videos: number
}

export interface TiktokProductDrilldownTotal {
  gmv: number
  cost: number
  hien_thi: number
  clicks: number
  orders: number
  roas: number
  cpc: number
  cpm: number
  ctr: number
  cr: number
  aov: number
  n_creatives: number
}

export interface TiktokProductDrilldown {
  rows: TiktokProductRow[]
  total: TiktokProductDrilldownTotal
  topN: number
  total_rows_in_file: number
  filtered_out: number
  master_empty: boolean
}

/* ── Section 2 types ── */

export interface TiktokAuthRow {
  loai: 'Thẻ sản phẩm' | 'Video Kênh' | 'Video KOC' | 'Video Aff'
  gmv: number
  cost: number
  hien_thi: number
  clicks: number
  orders: number
  roas: number
  cpc: number
  cpm: number
  ctr: number
  cr: number
  aov: number
  n: number
}

export interface TiktokAuthTotalRow {
  label: string
  gmv: number
  cost: number
  hien_thi: number
  clicks: number
  orders: number
  roas: number
  cpc: number
  cpm: number
  ctr: number
  cr: number
  aov: number
  n: number
}

export interface TiktokAuthSection {
  productCard: TiktokAuthRow
  videoRows: TiktokAuthRow[] // sorted: Kênh → KOC → Aff
  /** Sub-aggregate: gộp Video KOC + Video Aff (cat nhỏ hơn). */
  videoKocAff: TiktokAuthTotalRow
  videoSubtotal: TiktokAuthTotalRow
  grandTotal: TiktokAuthTotalRow
}

/* ── Section "Top Videos" (toàn bộ video sorted GMV) ── */

export interface TiktokTopVideos {
  videos: TiktokVideoRow[]
  /** Mapping product_id → ten_define (nếu có) cho mỗi video — để hiện kèm SP. */
  ten_define_map: Record<string, string | null>
  /** Tổng số video trong file (filter Creative type = Video). */
  total_videos: number
  /** Subtotal của top N hiện đang trả về. */
  subtotal: {
    gmv: number
    cost: number
    hien_thi: number
    clicks: number
    orders: number
    roas: number
    cpc: number
    cpm: number
    ctr: number
    cr: number
    aov: number
  }
  /** Top N đang áp dụng (Infinity = tất cả). */
  topN: number
}

/* ── Helpers ── */

function num(v: unknown): number {
  if (v == null) return 0
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0
  const s = String(v).trim().replace(/,/g, '')
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

function getCellResolver(rows: Record<string, unknown>[]) {
  if (rows.length === 0) {
    return {
      pid: null,
      ct: null,
      auth: null,
      vid: null,
      vtitle: null,
      account: null,
      gmv: null,
      cost: null,
      imp: null,
      click: null,
      orders: null,
    } as const
  }
  const r = rows[0]
  return {
    pid: resolveCol(r, PGM_DRILL_COLS.product_id),
    ct: resolveCol(r, PGM_DRILL_COLS.creative_type),
    auth: resolveCol(r, PGM_DRILL_COLS.authorization_type),
    vid: resolveCol(r, PGM_DRILL_COLS.video_id),
    vtitle: resolveCol(r, PGM_DRILL_COLS.video_title),
    account: resolveCol(r, PGM_DRILL_COLS.tiktok_account),
    gmv: resolveCol(r, PGM_COLS.gmv),
    cost: resolveCol(r, PGM_COLS.cost),
    imp: resolveCol(r, PGM_COLS.impressions),
    click: resolveCol(r, PGM_COLS.clicks),
    orders: resolveCol(r, PGM_COLS.orders),
  } as const
}

type ColMap = ReturnType<typeof getCellResolver>

function get(row: Record<string, unknown>, key: string | null): unknown {
  if (!key) return null
  return row[key]
}

function aggregate(rows: Record<string, unknown>[], cols: ColMap) {
  const gmv = rows.reduce((s, r) => s + num(get(r, cols.gmv)), 0)
  const cost = rows.reduce((s, r) => s + num(get(r, cols.cost)), 0)
  const hien_thi = rows.reduce((s, r) => s + num(get(r, cols.imp)), 0)
  const clicks = rows.reduce((s, r) => s + num(get(r, cols.click)), 0)
  const orders = rows.reduce((s, r) => s + num(get(r, cols.orders)), 0)
  return {
    gmv,
    cost,
    hien_thi,
    clicks,
    orders,
    roas: cost ? gmv / cost : 0,
    cpc: clicks ? cost / clicks : 0,
    cpm: hien_thi ? (cost / hien_thi) * 1000 : 0,
    ctr: hien_thi ? (clicks / hien_thi) * 100 : 0,
    cr: clicks ? (orders / clicks) * 100 : 0,
    aov: orders ? gmv / orders : 0,
  }
}

function toVideoRow(row: Record<string, unknown>, cols: ColMap): TiktokVideoRow {
  const gmv = num(get(row, cols.gmv))
  const cost = num(get(row, cols.cost))
  const hien_thi = num(get(row, cols.imp))
  const clicks = num(get(row, cols.click))
  const orders = num(get(row, cols.orders))
  return {
    video_id: String(get(row, cols.vid) ?? '').trim(),
    video_title: String(get(row, cols.vtitle) ?? '(không tên)').trim() || '(không tên)',
    tiktok_account: String(get(row, cols.account) ?? '').trim(),
    authorization_type: String(get(row, cols.auth) ?? '').trim(),
    product_id: normalizeProductId(get(row, cols.pid)),
    gmv,
    cost,
    hien_thi,
    clicks,
    orders,
    roas: cost ? gmv / cost : 0,
    cpc: clicks ? cost / clicks : 0,
    cpm: hien_thi ? (cost / hien_thi) * 1000 : 0,
    ctr: hien_thi ? (clicks / hien_thi) * 100 : 0,
    cr: clicks ? (orders / clicks) * 100 : 0,
    aov: orders ? gmv / orders : 0,
  }
}

/* ── Auth mapping (Brief V12 §6) ── */

const AUTH_MAP: Record<string, 'Video Kênh' | 'Video KOC' | 'Video Aff'> = {
  'Video code': 'Video KOC',
  'Affiliate mass authorization': 'Video Aff',
  'TikTok Shop official account': 'Video Kênh',
  'Business Center': 'Video Kênh',
  // Vietnamese fallbacks
  'Mã video': 'Video KOC',
  'Uỷ quyền hàng loạt liên kết': 'Video Aff',
  'Tài khoản chính thức TikTok Shop': 'Video Kênh',
  'Trung tâm Doanh nghiệp': 'Video Kênh',
}

function isProductCard(row: Record<string, unknown>, cols: ColMap): boolean {
  const v = String(get(row, cols.ct) ?? '')
    .trim()
    .toLowerCase()
  return v === 'product card' || v === 'thẻ sản phẩm'
}

function isVideo(row: Record<string, unknown>, cols: ColMap): boolean {
  const v = String(get(row, cols.ct) ?? '')
    .trim()
    .toLowerCase()
  return v === 'video'
}

function mapVideoAuth(row: Record<string, unknown>, cols: ColMap): 'Video Kênh' | 'Video KOC' | 'Video Aff' {
  const raw = String(get(row, cols.auth) ?? '').trim()
  if (!raw || raw.toLowerCase() === 'nan') return 'Video Aff' // Q2
  return AUTH_MAP[raw] ?? 'Video Aff'
}

/* ── Section 1 build ── */

export interface BuildTiktokDrilldownOpts {
  topN?: number
}

export function buildTiktokProductDrilldownFromRaw(
  rawRows: Record<string, unknown>[],
  master: TiktokMasterRow[],
  opts: BuildTiktokDrilldownOpts = {},
): TiktokProductDrilldown {
  const topN = opts.topN ?? 10
  const total_in_file = rawRows.length
  const cols = getCellResolver(rawRows)

  // Build maps from Master
  const defineMap = new Map<string, string>()
  const undefinedMap = new Map<string, string>() // pid → ten_tiktok
  for (const m of master) {
    const pid = normalizeProductId(m.product_id)
    if (!pid) continue
    if (m.ten_define && m.ten_define.trim()) defineMap.set(pid, m.ten_define.trim())
    else if (m.ten_tiktok) undefinedMap.set(pid, m.ten_tiktok)
  }

  // Filter + bucket
  type Enriched = { row: Record<string, unknown>; key: string; is_undefined: boolean }
  const enriched: Enriched[] = []
  let filtered_out = 0

  for (const r of rawRows) {
    const pid = normalizeProductId(get(r, cols.pid))
    if (!pid) {
      filtered_out++
      continue
    }
    const def = defineMap.get(pid)
    if (def) {
      enriched.push({ row: r, key: def, is_undefined: false })
      continue
    }
    const tt = undefinedMap.get(pid)
    if (tt) {
      enriched.push({
        row: r,
        key: `⚠️ Chưa định nghĩa: ${tt.slice(0, 50)}`,
        is_undefined: true,
      })
      continue
    }
    // Không có trong Master → BỎ (Q1)
    filtered_out++
  }

  // Group
  const groups = new Map<string, Enriched[]>()
  for (const e of enriched) {
    let arr = groups.get(e.key)
    if (!arr) {
      arr = []
      groups.set(e.key, arr)
    }
    arr.push(e)
  }

  const rows: TiktokProductRow[] = []
  groups.forEach((items, key) => {
    const allRows = items.map(e => e.row)
    const agg = aggregate(allRows, cols)
    const productCards = allRows.filter(r => isProductCard(r, cols))
    const videos = allRows.filter(r => isVideo(r, cols))

    let pcOut: TiktokProductCard | null = null
    if (productCards.length > 0) {
      const pcAgg = aggregate(productCards, cols)
      pcOut = { ...pcAgg, n_cards: productCards.length }
    }

    const topVideos = videos
      .map(r => toVideoRow(r, cols))
      .sort((a, b) => b.gmv - a.gmv)
      .slice(0, topN === Infinity ? videos.length : topN)

    rows.push({
      ten_define: key,
      is_undefined: items[0].is_undefined,
      ...agg,
      n_creatives: items.length,
      product_card: pcOut,
      top_videos: topVideos,
      total_videos: videos.length,
    })
  })

  rows.sort((a, b) => b.gmv - a.gmv)

  // Total
  const total: TiktokProductDrilldownTotal = (() => {
    const gmv = rows.reduce((s, r) => s + r.gmv, 0)
    const cost = rows.reduce((s, r) => s + r.cost, 0)
    const hien_thi = rows.reduce((s, r) => s + r.hien_thi, 0)
    const clicks = rows.reduce((s, r) => s + r.clicks, 0)
    const orders = rows.reduce((s, r) => s + r.orders, 0)
    const n_creatives = rows.reduce((s, r) => s + r.n_creatives, 0)
    return {
      gmv,
      cost,
      hien_thi,
      clicks,
      orders,
      roas: cost ? gmv / cost : 0,
      cpc: clicks ? cost / clicks : 0,
      cpm: hien_thi ? (cost / hien_thi) * 1000 : 0,
      ctr: hien_thi ? (clicks / hien_thi) * 100 : 0,
      cr: clicks ? (orders / clicks) * 100 : 0,
      aov: orders ? gmv / orders : 0,
      n_creatives,
    }
  })()

  return {
    rows,
    total,
    topN,
    total_rows_in_file: total_in_file,
    filtered_out,
    master_empty: master.length === 0 || (defineMap.size === 0 && undefinedMap.size === 0),
  }
}

/* ── Section 2 build ── */

export function buildTiktokAuthSectionFromRaw(rawRows: Record<string, unknown>[]): TiktokAuthSection {
  const cols = getCellResolver(rawRows)
  const productCards = rawRows.filter(r => isProductCard(r, cols))
  const videos = rawRows.filter(r => isVideo(r, cols))

  // Group videos by mapped auth
  const buckets = new Map<'Video Kênh' | 'Video KOC' | 'Video Aff', Record<string, unknown>[]>([
    ['Video Kênh', []],
    ['Video KOC', []],
    ['Video Aff', []],
  ])
  for (const v of videos) {
    const loai = mapVideoAuth(v, cols)
    buckets.get(loai)!.push(v)
  }

  const order: Array<'Video Kênh' | 'Video KOC' | 'Video Aff'> = ['Video Kênh', 'Video KOC', 'Video Aff']
  const videoRows: TiktokAuthRow[] = order.map(loai => {
    const items = buckets.get(loai) ?? []
    return { loai, ...aggregate(items, cols), n: items.length }
  })

  const productCard: TiktokAuthRow = {
    loai: 'Thẻ sản phẩm',
    ...aggregate(productCards, cols),
    n: productCards.length,
  }

  // Sub-aggregate: KOC + Aff (cat nhỏ hơn, dùng để so sánh Kênh vs Influencer)
  const kocAffItems = [...(buckets.get('Video KOC') ?? []), ...(buckets.get('Video Aff') ?? [])]
  const videoKocAff: TiktokAuthTotalRow = {
    label: 'Video (KOC + Aff)',
    ...aggregate(kocAffItems, cols),
    n: kocAffItems.length,
  }

  const videoSubtotal: TiktokAuthTotalRow = {
    label: 'Tổng Video',
    ...aggregate(videos, cols),
    n: videos.length,
  }

  // Grand total = Video + Product Card (KHÔNG cộng creative khác như "Image", v.v.
  // — vì brief chỉ định Video + PC)
  const both = [...videos, ...productCards]
  const grandTotal: TiktokAuthTotalRow = {
    label: 'TỔNG (Video + PC)',
    ...aggregate(both, cols),
    n: both.length,
  }

  return { productCard, videoRows, videoKocAff, videoSubtotal, grandTotal }
}

/* ── Section "Top Videos" build ── */

export function buildTiktokTopVideosFromRaw(
  rawRows: Record<string, unknown>[],
  master: TiktokMasterRow[],
  topN: number = 10,
): TiktokTopVideos {
  const cols = getCellResolver(rawRows)
  const videos = rawRows.filter(r => isVideo(r, cols))
  const all: TiktokVideoRow[] = videos.map(r => toVideoRow(r, cols))
  all.sort((a, b) => b.gmv - a.gmv)
  const sliced = topN === Infinity ? all : all.slice(0, topN)

  // Master lookup: product_id → ten_define
  const ten_define_map: Record<string, string | null> = {}
  for (const m of master) {
    const pid = normalizeProductId(m.product_id)
    if (pid) ten_define_map[pid] = m.ten_define ?? m.ten_tiktok ?? null
  }

  // Subtotal of sliced
  const gmv = sliced.reduce((s, v) => s + v.gmv, 0)
  const cost = sliced.reduce((s, v) => s + v.cost, 0)
  const hien_thi = sliced.reduce((s, v) => s + v.hien_thi, 0)
  const clicks = sliced.reduce((s, v) => s + v.clicks, 0)
  const orders = sliced.reduce((s, v) => s + v.orders, 0)

  return {
    videos: sliced,
    ten_define_map,
    total_videos: all.length,
    subtotal: {
      gmv,
      cost,
      hien_thi,
      clicks,
      orders,
      roas: cost ? gmv / cost : 0,
      cpc: clicks ? cost / clicks : 0,
      cpm: hien_thi ? (cost / hien_thi) * 1000 : 0,
      ctr: hien_thi ? (clicks / hien_thi) * 100 : 0,
      cr: clicks ? (orders / clicks) * 100 : 0,
      aov: orders ? gmv / orders : 0,
    },
    topN,
  }
}

/* ── Convenience: one-shot from file ── */

export async function buildTiktokSections(
  creativeFile: File,
  master: TiktokMasterRow[],
  topN: number = 10,
  topVideosN: number = 10,
): Promise<{
  drilldown: TiktokProductDrilldown
  auth: TiktokAuthSection
  topVideos: TiktokTopVideos
}> {
  const raw = await parseTiktokPGMRaw(creativeFile)
  const drilldown = buildTiktokProductDrilldownFromRaw(raw, master, { topN })
  const auth = buildTiktokAuthSectionFromRaw(raw)
  const topVideos = buildTiktokTopVideosFromRaw(raw, master, topVideosN)
  return { drilldown, auth, topVideos }
}
