import * as XLSX from 'xlsx'
import type { PivotRow } from './types'
import { readShopeeSheet } from './shopee-common'

const REQUIRED_COLS = [
  'Loại Dịch vụ Hiển thị',
  'Doanh số',
  'Chi phí',
  'Số lượt xem',
  'Số lượt click',
  'Sản phẩm đã bán',
]

/**
 * Return raw rows (un-aggregated) sau khi tìm header — dùng cho drilldown
 * sản phẩm Phase 2C. Không filter, KHÔNG group.
 */
export async function parseShopeeCPCRaw(file: File): Promise<Record<string, unknown>[]> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array', codepage: 65001, raw: true })
  const ws = wb.Sheets[wb.SheetNames[0]]
  if (!ws) throw new Error('File CSV trống hoặc không hợp lệ')
  return readShopeeSheet(ws, REQUIRED_COLS, 'File CPC')
}

const GROUP_ORDER = ['Shop GMV Max', 'Dịch vụ Hiển thị Sản phẩm', 'Dịch vụ Hiển thị Shop'] as const

/**
 * Parse Shopee CPC CSV. Header row is found adaptively (chi tiết vs tổng quan
 * variants exist with different metadata heights). Empty
 * "Loại Dịch vụ Hiển thị" → group "Shop GMV Max".
 */
export async function parseShopeeCPC(file: File): Promise<PivotRow[]> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array', codepage: 65001, raw: true })
  const ws = wb.Sheets[wb.SheetNames[0]]
  if (!ws) throw new Error('File CSV trống hoặc không hợp lệ')

  const data = readShopeeSheet(ws, REQUIRED_COLS, 'File CPC')
  if (data.length === 0) return []

  // Group by "Loại Dịch vụ Hiển thị" — empty → "Shop GMV Max"
  const groups: Record<string, Record<string, unknown>[]> = {
    'Shop GMV Max': [],
    'Dịch vụ Hiển thị Sản phẩm': [],
    'Dịch vụ Hiển thị Shop': [],
  }

  for (const row of data) {
    const loai = String(row['Loại Dịch vụ Hiển thị'] ?? '').trim()
    const key = !loai ? 'Shop GMV Max' : loai
    if (groups[key]) {
      groups[key].push(row)
    }
    // Unknown groups silently skipped
  }

  // Helper: aggregate metrics từ một list rows
  function agg(rows: Record<string, unknown>[]) {
    return {
      gmv: rows.reduce((s, r) => s + (Number(r['Doanh số']) || 0), 0),
      cost: rows.reduce((s, r) => s + (Number(r['Chi phí']) || 0), 0),
      hien_thi: rows.reduce((s, r) => s + (Number(r['Số lượt xem']) || 0), 0),
      clicks: rows.reduce((s, r) => s + (Number(r['Số lượt click']) || 0), 0),
      orders: rows.reduce((s, r) => s + (Number(r['Sản phẩm đã bán']) || 0), 0),
    }
  }

  function makeRow(loai: string, m: ReturnType<typeof agg>, sub?: 'Thủ công' | 'Tự động'): PivotRow {
    return {
      hinh_thuc: 'Ads CPC',
      loai_dvht: loai,
      isTotal: false,
      isSubcat: !!sub,
      subcat_label: sub,
      ...m,
      // Derived computed in pivot.ts
      roas: 0,
      cpc: null,
      cpm: 0,
      ctr: null,
      cr: null,
      pct_gmv: 0,
      pct_cost: 0,
    }
  }

  // Split sub-cat theo "Phương thức đầu thầu" cho 2 loại SP + Shop.
  // Lưu ý header có thể là "Giá thầu thủ công" hoặc variant nhẹ → match contains.
  const SPLIT_GROUPS = new Set(['Dịch vụ Hiển thị Sản phẩm', 'Dịch vụ Hiển thị Shop'])
  function isManualBidding(row: Record<string, unknown>): boolean {
    const v = String(row['Phương thức đầu thầu'] ?? row['Phương thức đấu thầu'] ?? '').trim()
    // Brief: "Giá thầu thủ công" → Thủ công; tất cả còn lại → Tự động.
    return /thủ công/i.test(v)
  }

  // Build PivotRow per group (only groups with rows)
  const result: PivotRow[] = []
  for (const groupName of GROUP_ORDER) {
    const rows = groups[groupName]
    if (!rows || rows.length === 0) continue

    result.push(makeRow(groupName, agg(rows)))

    if (SPLIT_GROUPS.has(groupName)) {
      const manual = rows.filter(isManualBidding)
      const auto = rows.filter(r => !isManualBidding(r))
      if (manual.length > 0) result.push(makeRow(groupName, agg(manual), 'Thủ công'))
      if (auto.length > 0) result.push(makeRow(groupName, agg(auto), 'Tự động'))
    }
  }
  return result
}
