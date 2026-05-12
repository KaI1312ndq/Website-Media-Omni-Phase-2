import * as XLSX from 'xlsx'
import type { TiktokPGMData } from './types'

// Brief V9.2 §4 (file 1): all rows → group "Ads_PGM"; SUM across all creatives.
const REQUIRED_COLS = ['Gross revenue', 'Cost', 'Product ad impressions', 'Product ad clicks', 'SKU orders']

/**
 * Parse TikTok PGM xlsx (creative_data_for_product_campaigns_*.xlsx).
 * Sheet index 0 (named "Data" in sample, but we don't hardcode the name).
 * Header on row 1 (no metadata rows to skip).
 */
export async function parseTiktokPGM(file: File): Promise<TiktokPGMData> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  if (!ws) throw new Error('File TikTok PGM trống hoặc không hợp lệ')

  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null })
  if (data.length === 0) return { gmv: 0, cost: 0, hien_thi: 0, clicks: 0, orders: 0 }

  for (const col of REQUIRED_COLS) {
    if (!(col in data[0])) {
      throw new Error(`File TikTok PGM: không tìm thấy cột "${col}". Sàn có thể đã đổi format.`)
    }
  }

  return {
    gmv: data.reduce((s, r) => s + (Number(r['Gross revenue']) || 0), 0),
    cost: data.reduce((s, r) => s + (Number(r['Cost']) || 0), 0),
    hien_thi: data.reduce((s, r) => s + (Number(r['Product ad impressions']) || 0), 0),
    clicks: data.reduce((s, r) => s + (Number(r['Product ad clicks']) || 0), 0),
    orders: data.reduce((s, r) => s + (Number(r['SKU orders']) || 0), 0),
  }
}
