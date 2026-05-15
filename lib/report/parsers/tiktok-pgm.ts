import * as XLSX from 'xlsx'
import type { TiktokPGMData } from './types'
import { PGM_COLS, sumCol, verifyColumns } from './tiktok-common'

/**
 * Trả raw rows (chưa aggregate) — dùng cho drilldown Phase 2D.
 * Product ID giữ dạng string để không mất precision (19 chữ số).
 */
export async function parseTiktokPGMRaw(file: File): Promise<Record<string, unknown>[]> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  if (!ws) throw new Error('File TikTok PGM trống hoặc không hợp lệ')
  // raw: false để Product ID không bị scientific notation
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null, raw: false })
}

/**
 * Parse TikTok PGM xlsx (creative data for product campaigns / creative_data...).
 * Sheet index 0 (often named "Data"). Header on row 1 (no metadata to skip).
 *
 * Accepts EN + VN column names — TikTok Ads Manager exports in the operator's
 * account language. See tiktok-common.ts PGM_COLS for synonyms.
 *
 * All rows → group "Ads_PGM"; SUM across all creatives.
 */
export async function parseTiktokPGM(file: File): Promise<TiktokPGMData> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  if (!ws) throw new Error('File TikTok PGM trống hoặc không hợp lệ')

  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null })
  if (data.length === 0) return { gmv: 0, cost: 0, hien_thi: 0, clicks: 0, orders: 0 }

  verifyColumns(
    data,
    [
      { label: 'Gross revenue', synonyms: PGM_COLS.gmv },
      { label: 'Cost', synonyms: PGM_COLS.cost },
      { label: 'Product ad impressions', synonyms: PGM_COLS.impressions },
      { label: 'Product ad clicks', synonyms: PGM_COLS.clicks },
      { label: 'SKU orders', synonyms: PGM_COLS.orders },
    ],
    'File TikTok PGM',
  )

  return {
    gmv: sumCol(data, PGM_COLS.gmv),
    cost: sumCol(data, PGM_COLS.cost),
    hien_thi: sumCol(data, PGM_COLS.impressions),
    clicks: sumCol(data, PGM_COLS.clicks),
    orders: sumCol(data, PGM_COLS.orders),
  }
}
