/**
 * Parser file "Chiến Dịch Nhóm" — Brief V11 update.
 *
 * Mỗi campaign nhóm (Mã sản phẩm = '-' trong file CPC chính) cần kèm 1 file
 * chi tiết để biết các SP con + số liệu — distribute xuống đúng define group
 * thay vì hiển thị 1 row tổng "🏷️".
 *
 * Format file (CSV/xlsx export từ Shopee Ads → Chiến Dịch Nhóm → tab Chi tiết):
 *   Line 1: "Ad Group - <Tên nhóm> Report - Shopee Việt Nam"
 *   Line 2-6: metadata (Tên đăng nhập, Tên gian hàng, ...)
 *   Line 7: blank
 *   Line 8: header "Thứ tự,Chiến dịch / Tên sản phẩm,Mã sản phẩm,Trạng thái,..."
 *   Line 9: Thứ tự=1 — Mã='-' — row TỔNG của nhóm
 *   Line 10+: per-SP rows (Mã = mã sản phẩm thật)
 */

import * as XLSX from 'xlsx'
import { normalizeMaSP } from '@/lib/products/parsers/master-xlsx'

export interface GroupSubProduct {
  ma_san_pham: string
  ten_product: string
  gmv: number
  cost: number
  hien_thi: number
  clicks: number
  orders: number
}

export interface GroupDetailFile {
  /** Tên nhóm — match với "Tên Dịch vụ Hiển thị" trong main CPC. */
  group_name: string
  /** Sub-products (đã loại row TỔNG). */
  products: GroupSubProduct[]
  /** Totals từ row TỔNG — để verify khớp main CPC. */
  totals: {
    gmv: number
    cost: number
    hien_thi: number
    clicks: number
    orders: number
  }
}

const REQUIRED_COLS = [
  'Chiến dịch / Tên sản phẩm',
  'Mã sản phẩm',
  'Số lượt xem',
  'Số lượt click',
  'Sản phẩm đã bán',
  'Doanh số',
  'Chi phí',
]

function num(v: unknown): number {
  if (v == null) return 0
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0
  const s = String(v).trim().replace(/,/g, '')
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

/**
 * Parse file "Chiến Dịch Nhóm".
 * Header được tìm adaptive (scan tối đa 20 dòng) để chịu được file có ít/nhiều metadata.
 */
export async function parseShopeeGroupFile(file: File): Promise<GroupDetailFile> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array', codepage: 65001, raw: true })
  const ws = wb.Sheets[wb.SheetNames[0]]
  if (!ws) throw new Error('File nhóm trống hoặc không hợp lệ.')

  const grid = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    blankrows: true,
    defval: null,
  }) as unknown[][]

  let headerIdx = -1
  for (let i = 0; i < Math.min(grid.length, 20); i++) {
    const cells = new Set((grid[i] ?? []).map(c => String(c ?? '').trim()))
    if (REQUIRED_COLS.every(c => cells.has(c))) {
      headerIdx = i
      break
    }
  }
  if (headerIdx < 0) {
    throw new Error(
      'File nhóm không đúng format — cần cột "Chiến dịch / Tên sản phẩm", "Mã sản phẩm", "Doanh số", "Chi phí".',
    )
  }

  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    range: headerIdx,
    defval: null,
  })

  // Row đầu tiên có Mã = '-' và Thứ tự = 1 là row TỔNG → group_name là cột "Chiến dịch / Tên sản phẩm"
  let groupName = ''
  const totals = { gmv: 0, cost: 0, hien_thi: 0, clicks: 0, orders: 0 }
  const products: GroupSubProduct[] = []

  for (const row of data) {
    const maRaw = row['Mã sản phẩm']
    const maNorm = normalizeMaSP(maRaw)
    const maStr = maNorm || String(maRaw ?? '').trim()
    const ten = String(row['Chiến dịch / Tên sản phẩm'] ?? '').trim()
    if (!ten) continue

    if (!maStr || maStr === '-') {
      // Row tổng nhóm
      if (!groupName) {
        groupName = ten
        totals.gmv = num(row['Doanh số'])
        totals.cost = num(row['Chi phí'])
        totals.hien_thi = num(row['Số lượt xem'])
        totals.clicks = num(row['Số lượt click'])
        totals.orders = num(row['Sản phẩm đã bán'])
      }
      continue
    }

    products.push({
      ma_san_pham: maNorm,
      ten_product: ten,
      gmv: num(row['Doanh số']),
      cost: num(row['Chi phí']),
      hien_thi: num(row['Số lượt xem']),
      clicks: num(row['Số lượt click']),
      orders: num(row['Sản phẩm đã bán']),
    })
  }

  if (!groupName) {
    // Fallback: extract from line 1 "Ad Group - <NAME> Report - ..."
    const line1 = String(grid[0]?.[0] ?? '')
    const m = line1.match(/^Ad Group\s*-\s*(.+?)\s+Report\b/i)
    if (m) groupName = m[1].trim()
  }

  if (!groupName) {
    throw new Error(
      'Không xác định được tên nhóm trong file (cần row Thứ tự=1 với Mã=-, hoặc dòng tiêu đề "Ad Group - <Tên>").',
    )
  }

  return { group_name: groupName, products, totals }
}
