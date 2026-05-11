import * as XLSX from 'xlsx'
import type { PivotRow } from './types'

// NOTE: column names DIFFER from CPC/Branding (per Brief V9.1 mục 4 file 3)
//   "Lượt xem" (no "Số" prefix)
//   "Số đơn hàng" (not "Sản phẩm đã bán")
//   No "Số lượt click" → clicks = null
const REQUIRED_COLS = ['Doanh số', 'Chi phí', 'Lượt xem', 'Số đơn hàng']

/**
 * Parse Shopee Livestream CSV file.
 * Structure: rows 1-10 = metadata, row 11 = blank, row 12 = headers, rows 13+ = data.
 * Skip 11 rows → header on row 12.
 * All rows → single group "Tối ưu doanh thu".
 * clicks = null (column doesn't exist).
 */
export async function parseShopeeLive(file: File): Promise<PivotRow[]> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array', codepage: 65001, raw: true })
  const ws = wb.Sheets[wb.SheetNames[0]]
  if (!ws) throw new Error('File CSV trống hoặc không hợp lệ')

  // Skip 11 rows → header on row 12
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { range: 11, defval: null })

  if (data.length === 0) return []

  for (const col of REQUIRED_COLS) {
    if (!(col in data[0])) {
      throw new Error(`File Live: không tìm thấy cột "${col}". Sàn có thể đã đổi format.`)
    }
  }

  const gmv = data.reduce((s, r) => s + (Number(r['Doanh số']) || 0), 0)
  const cost = data.reduce((s, r) => s + (Number(r['Chi phí']) || 0), 0)
  const hien_thi = data.reduce((s, r) => s + (Number(r['Lượt xem']) || 0), 0)
  const orders = data.reduce((s, r) => s + (Number(r['Số đơn hàng']) || 0), 0)

  return [
    {
      hinh_thuc: 'Ads Live',
      loai_dvht: 'Tối ưu doanh thu',
      isTotal: false,
      gmv,
      cost,
      hien_thi,
      clicks: null, // Source file has no clicks column
      orders,
      roas: 0,
      cpc: null,
      cpm: 0,
      ctr: null,
      cr: null,
      pct_gmv: 0,
      pct_cost: 0,
    },
  ]
}
