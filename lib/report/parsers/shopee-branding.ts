import * as XLSX from 'xlsx'
import type { PivotRow } from './types'
import { readShopeeSheet } from './shopee-common'

const REQUIRED_COLS = ['Doanh số', 'Chi phí', 'Số lượt xem', 'Số lượt click', 'Sản phẩm đã bán']

/**
 * Parse Shopee Branding (Tăng nhận diện thương hiệu) CSV.
 *
 * Shopee exports 2 variants of this report — header row position differs:
 *   - "Báo cáo chi tiết ..." (single campaign): header around row 11
 *   - "Báo cáo Dịch vụ Hiển thị Tăng nhận diện..." aka "Tổng quan"
 *     (multi-campaign): header around row 7
 * readShopeeSheet finds the header row adaptively by scanning for required
 * column names, so both variants work without hardcoded `range:`.
 *
 * All data rows → single group "Trang kết quả tìm kiếm" (sums across all
 * campaigns when the file is the tổng quan variant).
 */
export async function parseShopeeBranding(file: File): Promise<PivotRow[]> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array', codepage: 65001, raw: true })
  const ws = wb.Sheets[wb.SheetNames[0]]
  if (!ws) throw new Error('File CSV trống hoặc không hợp lệ')

  const data = readShopeeSheet(ws, REQUIRED_COLS, 'File Branding')
  if (data.length === 0) return []

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
