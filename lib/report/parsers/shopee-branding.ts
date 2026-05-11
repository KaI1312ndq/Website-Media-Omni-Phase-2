import * as XLSX from 'xlsx'
import type { PivotRow } from './types'

const REQUIRED_COLS = ['Doanh số', 'Chi phí', 'Số lượt xem', 'Số lượt click', 'Sản phẩm đã bán']

/**
 * Parse Shopee Branding (Tăng nhận diện) CSV file.
 * Structure: rows 1-8 = metadata, rows 9-10 = blank, row 11 = headers, rows 12+ = data.
 * All rows → single group "Trang kết quả tìm kiếm".
 */
export async function parseShopeeBranding(file: File): Promise<PivotRow[]> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array', codepage: 65001, raw: true })
  const ws = wb.Sheets[wb.SheetNames[0]]
  if (!ws) throw new Error('File CSV trống hoặc không hợp lệ')

  // Skip 10 rows → header on row 11
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { range: 10, defval: null })

  if (data.length === 0) return []

  for (const col of REQUIRED_COLS) {
    if (!(col in data[0])) {
      throw new Error(`File Branding: không tìm thấy cột "${col}". Sàn có thể đã đổi format.`)
    }
  }

  const gmv = data.reduce((s, r) => s + (Number(r['Doanh số']) || 0), 0)
  const cost = data.reduce((s, r) => s + (Number(r['Chi phí']) || 0), 0)
  const hien_thi = data.reduce((s, r) => s + (Number(r['Số lượt xem']) || 0), 0)
  const clicks = data.reduce((s, r) => s + (Number(r['Số lượt click']) || 0), 0)
  const orders = data.reduce((s, r) => s + (Number(r['Sản phẩm đã bán']) || 0), 0)

  return [
    {
      hinh_thuc: 'Ads Branding',
      loai_dvht: 'Trang kết quả tìm kiếm',
      isTotal: false,
      gmv,
      cost,
      hien_thi,
      clicks,
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
