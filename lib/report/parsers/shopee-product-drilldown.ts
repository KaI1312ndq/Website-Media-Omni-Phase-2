/**
 * Shopee Product Drilldown — Brief V11 §6.
 *
 * Filter file CPC để chỉ giữ row "Dịch vụ Hiển thị Sản phẩm", rồi group
 * theo "Tên define" từ Product Master.
 *
 *   - Mã SP có define → group theo `ten_define`
 *   - Mã SP rỗng / dấu '-' → campaign tổng (🏷️) — không group
 *   - Mã SP không có trong Master → "⚠️ Chưa định nghĩa"
 *
 * Subtotal section này KHÁC subtotal pivot CPC chính (do filter) — accept.
 */

import { parseShopeeCPCRaw } from './shopee-cpc'
import { normalizeMaSP } from '@/lib/products/parsers/master-xlsx'
import type { ProductMasterRow } from '@/lib/products/types'
import type { GroupDetailFile } from './shopee-group'

export interface CampaignRow {
  name: string // Tên Dịch vụ Hiển thị
  ma_san_pham: string // Raw (UI ẩn)
  gmv: number
  cost: number
  hien_thi: number
  clicks: number
  orders: number
  roas: number
  cpc: number
  cpm: number
  ctr: number // %
  cr: number // %
  aov: number
}

export interface ProductDrilldownRow {
  ten_define: string
  is_campaign_tong: boolean
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
  n_camps: number
  campaigns: CampaignRow[] // sort GMV desc, slice topN
}

export interface ProductDrilldownTotal {
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
  n_camps: number
}

/** Mỗi campaign nhóm (Mã='-' và Loại=SP) cần kèm 1 file chi tiết. */
export interface DetectedGroup {
  /** Tên Dịch vụ Hiển thị từ main CPC — dùng để match file nhóm. */
  campaign_name: string
  /** Tổng metrics từ main CPC (verify với file nhóm). */
  gmv: number
  cost: number
  hien_thi: number
  clicks: number
  orders: number
  /** True nếu file nhóm đã được upload + parse. */
  resolved: boolean
}

export interface ProductDrilldown {
  rows: ProductDrilldownRow[]
  total: ProductDrilldownTotal
  /** Danh sách nhóm phát hiện — UI hiện slot upload cho từng nhóm. */
  detectedGroups: DetectedGroup[]
  topN: number
  total_camps_in_file: number
  filtered_out: number
}

const LOAI_PRODUCT = 'Dịch vụ Hiển thị Sản phẩm'

type Enriched = {
  row: Record<string, unknown>
  key: string
  is_tong: boolean
  is_undefined: boolean
}

function num(v: unknown): number {
  return Number(v) || 0
}

function toCampaign(row: Record<string, unknown>): CampaignRow {
  const name = String(row['Tên Dịch vụ Hiển thị'] ?? '').trim() || '(không tên)'
  const ma = normalizeMaSP(row['Mã sản phẩm']) || String(row['Mã sản phẩm'] ?? '').trim()
  const gmv = num(row['Doanh số'])
  const cost = num(row['Chi phí'])
  const hien_thi = num(row['Số lượt xem'])
  const clicks = num(row['Số lượt click'])
  const orders = num(row['Sản phẩm đã bán'])
  return {
    name,
    ma_san_pham: ma,
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

export interface BuildDrilldownOpts {
  topN?: number
  defineMap: Map<string, string> // ma_san_pham → ten_define
  /** Files chi tiết nhóm — key = group_name. Khi có → distribute SP con
   *  vào define groups thay cho row "🏷️ campaign nhóm" tổng. */
  groupDetails?: Map<string, GroupDetailFile>
}

/** Build drilldown từ raw CPC rows + Master. */
export function buildDrilldownFromRaw(
  rawRows: Record<string, unknown>[],
  opts: BuildDrilldownOpts,
): ProductDrilldown {
  const topN = opts.topN ?? 10
  const defineMap = opts.defineMap
  const groupDetails = opts.groupDetails ?? new Map<string, GroupDetailFile>()

  // Filter chỉ "Dịch vụ Hiển thị Sản phẩm"
  const total_in_file = rawRows.length
  const filtered = rawRows.filter(r => {
    const loai = String(r['Loại Dịch vụ Hiển thị'] ?? '').trim()
    return loai === LOAI_PRODUCT
  })
  const filtered_out = total_in_file - filtered.length

  // ── Detect groups + resolve ──
  const detectedGroups: DetectedGroup[] = []
  const enriched: Enriched[] = []

  for (const row of filtered) {
    const maRaw = row['Mã sản phẩm']
    const maNorm = normalizeMaSP(maRaw)
    const maStr = maNorm || String(maRaw ?? '').trim()
    const tenDV = String(row['Tên Dịch vụ Hiển thị'] ?? '').trim() || '(campaign không tên)'

    if (!maStr || maStr === '-') {
      // Đây là CAMPAIGN NHÓM — cần kèm file chi tiết
      const detail = groupDetails.get(tenDV)
      detectedGroups.push({
        campaign_name: tenDV,
        gmv: num(row['Doanh số']),
        cost: num(row['Chi phí']),
        hien_thi: num(row['Số lượt xem']),
        clicks: num(row['Số lượt click']),
        orders: num(row['Sản phẩm đã bán']),
        resolved: !!detail,
      })

      if (detail) {
        // Distribute từng SP con vào enriched
        for (const sub of detail.products) {
          const subDefine = defineMap.get(sub.ma_san_pham)
          const subRow: Record<string, unknown> = {
            'Tên Dịch vụ Hiển thị': sub.ten_product,
            'Mã sản phẩm': sub.ma_san_pham,
            'Doanh số': sub.gmv,
            'Chi phí': sub.cost,
            'Số lượt xem': sub.hien_thi,
            'Số lượt click': sub.clicks,
            'Sản phẩm đã bán': sub.orders,
            __from_group: tenDV, // marker để UI biết SP này từ nhóm nào
          }
          if (subDefine) {
            enriched.push({ row: subRow, key: subDefine, is_tong: false, is_undefined: false })
          } else {
            enriched.push({
              row: subRow,
              key: `⚠️ Chưa định nghĩa: ${sub.ten_product.slice(0, 50)}`,
              is_tong: false,
              is_undefined: true,
            })
          }
        }
      } else {
        // Chưa có file nhóm → giữ row tổng "🏷️" như cũ
        enriched.push({ row, key: `🏷️ ${tenDV}`, is_tong: true, is_undefined: false })
      }
      continue
    }

    // SP có mã → resolve qua Master
    const define = defineMap.get(maNorm)
    if (define) {
      enriched.push({ row, key: define, is_tong: false, is_undefined: false })
    } else {
      enriched.push({
        row,
        key: `⚠️ Chưa định nghĩa: ${tenDV.slice(0, 50)}`,
        is_tong: false,
        is_undefined: true,
      })
    }
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

  // Aggregate
  const rows: ProductDrilldownRow[] = []
  groups.forEach((items, key) => {
    const gmv = items.reduce((s: number, e: Enriched) => s + num(e.row['Doanh số']), 0)
    const cost = items.reduce((s: number, e: Enriched) => s + num(e.row['Chi phí']), 0)
    const hien_thi = items.reduce((s: number, e: Enriched) => s + num(e.row['Số lượt xem']), 0)
    const clicks = items.reduce((s: number, e: Enriched) => s + num(e.row['Số lượt click']), 0)
    const orders = items.reduce((s: number, e: Enriched) => s + num(e.row['Sản phẩm đã bán']), 0)

    rows.push({
      ten_define: key,
      is_campaign_tong: items[0].is_tong,
      is_undefined: items[0].is_undefined,
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
      n_camps: items.length,
      campaigns: items
        .map((e: Enriched) => toCampaign(e.row))
        .sort((a: CampaignRow, b: CampaignRow) => b.gmv - a.gmv)
        .slice(0, topN === Infinity ? items.length : topN),
    })
  })

  rows.sort((a, b) => b.gmv - a.gmv)

  // Total
  const total: ProductDrilldownTotal = (() => {
    const gmv = rows.reduce((s, r) => s + r.gmv, 0)
    const cost = rows.reduce((s, r) => s + r.cost, 0)
    const hien_thi = rows.reduce((s, r) => s + r.hien_thi, 0)
    const clicks = rows.reduce((s, r) => s + r.clicks, 0)
    const orders = rows.reduce((s, r) => s + r.orders, 0)
    const n_camps = rows.reduce((s, r) => s + r.n_camps, 0)
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
      n_camps,
    }
  })()

  return {
    rows,
    total,
    detectedGroups,
    topN,
    total_camps_in_file: total_in_file,
    filtered_out,
  }
}

/** Convenience: parse file + build drilldown one-shot. */
export async function buildShopeeProductDrilldown(
  cpcFile: File,
  master: ProductMasterRow[],
  topN: number = 10,
  groupDetails?: Map<string, GroupDetailFile>,
): Promise<ProductDrilldown> {
  const raw = await parseShopeeCPCRaw(cpcFile)
  const defineMap = new Map<string, string>()
  for (const m of master) {
    if (m.ten_define && m.ten_define.trim()) {
      defineMap.set(normalizeMaSP(m.ma_san_pham), m.ten_define.trim())
    }
  }
  return buildDrilldownFromRaw(raw, { defineMap, topN, groupDetails })
}
