import * as XLSX from 'xlsx'
import type { ParsedMasterRow } from '../types'

/**
 * Parse Master file .xlsx (Shopee Seller Center export).
 *
 * Format expected (Brief V11 §5):
 *   - 2 metadata rows ở đầu file → skip
 *   - Header row 3: "Mã Sản phẩm" | "SKU Sản phẩm" | "Tên Sản phẩm" | ...
 *
 * Adaptive: scan tối đa 10 row đầu để tìm header, để chịu được file có
 * số metadata rows khác (1, 2, 3 dòng).
 *
 * Mã SP có thể là số dài 10-11 chữ số → SheetJS đôi khi đọc thành number
 * + scientific notation. Convert sang string an toàn.
 */
export async function parseMasterFile(file: File): Promise<ParsedMasterRow[]> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array', codepage: 65001, raw: true })
  const ws = wb.Sheets[wb.SheetNames[0]]
  if (!ws) throw new Error('File Master trống hoặc không hợp lệ.')

  // Adaptive header detection — tìm row chứa cả "Mã Sản phẩm" + "Tên Sản phẩm"
  const grid = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    blankrows: true,
    defval: null,
  }) as unknown[][]

  let headerIdx = -1
  for (let i = 0; i < Math.min(grid.length, 10); i++) {
    const cells = new Set((grid[i] ?? []).map(c => String(c ?? '').trim()))
    if (cells.has('Mã Sản phẩm') && cells.has('Tên Sản phẩm')) {
      headerIdx = i
      break
    }
  }
  if (headerIdx < 0) {
    throw new Error(
      'File Master không đúng format. Cần có cột "Mã Sản phẩm" và "Tên Sản phẩm" trong 10 dòng đầu.',
    )
  }

  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    range: headerIdx,
    defval: null,
  })

  const seen = new Set<string>()
  const result: ParsedMasterRow[] = []

  for (const row of data) {
    const ma = normalizeMaSP(row['Mã Sản phẩm'])
    if (!ma) continue
    if (seen.has(ma)) continue
    seen.add(ma)

    const ten = row['Tên Sản phẩm']
    const sku = row['SKU Sản phẩm']

    result.push({
      ma_san_pham: ma,
      ten_shopee: ten ? String(ten).trim() : null,
      sku_code: sku ? String(sku).trim() : null,
    })
  }

  return result
}

/**
 * Mã SP có thể là number (đọc bằng SheetJS sang scientific) hoặc string.
 * Trả về dạng chuỗi số nguyên (không có dấu chấm/E).
 */
export function normalizeMaSP(raw: unknown): string {
  if (raw == null) return ''
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw)) return ''
    return raw.toFixed(0)
  }
  const s = String(raw).trim()
  if (!s || s.toLowerCase() === 'nan') return ''
  // Trường hợp Excel đọc thành "5.3856e+10"
  if (/^[\d.]+e[+-]?\d+$/i.test(s)) {
    const n = Number(s)
    if (Number.isFinite(n)) return n.toFixed(0)
  }
  return s
}
