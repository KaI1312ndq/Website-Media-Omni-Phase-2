/**
 * Parser Master TikTok — Brief V12 §4.
 *
 * File: Tiktoksellercenter_batchedit_*_basic_information_template.xlsx
 *   - 6 sheets, CHỈ đọc sheet "Template"
 *   - 4 dòng metadata đầu (V3 / "ID sản phẩm" / "Bắt buộc" / "Không thể chỉnh sửa")
 *   - Header ở dòng 5: product_id, category, brand, product_name, product_description
 *
 * Product ID dài 19 chữ số → MUST keep as string (raw:false hoặc convert ngay).
 */

import * as XLSX from 'xlsx'
import type { ParsedTiktokMasterRow } from '../types'

/** Đưa Product ID về string an toàn, không mất precision. */
export function normalizeProductId(raw: unknown): string {
  if (raw == null) return ''
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw)) return ''
    return raw.toFixed(0)
  }
  const s = String(raw).trim()
  if (!s || s.toLowerCase() === 'nan') return ''
  if (/^[\d.]+e[+-]?\d+$/i.test(s)) {
    // Scientific notation đã matter — convert lại
    const n = Number(s)
    if (Number.isFinite(n)) return n.toFixed(0)
  }
  return s
}

export async function parseTiktokMasterFile(file: File): Promise<ParsedTiktokMasterRow[]> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })

  // CHỈ đọc sheet "Template"
  if (!wb.SheetNames.includes('Template')) {
    throw new Error('File phải là TikTok Seller Center batch edit template (cần sheet "Template").')
  }
  const ws = wb.Sheets['Template']

  // Skip 4 metadata rows → header ở index 4 (0-based)
  // raw: false để giữ Product ID dạng string (tránh scientific notation)
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    range: 4,
    defval: null,
    raw: false,
  })

  if (data.length === 0) return []
  if (!('product_id' in data[0]) || !('product_name' in data[0])) {
    throw new Error(
      'Sheet "Template" thiếu cột "product_id" hoặc "product_name". File có đúng template Seller Center?',
    )
  }

  const seen = new Set<string>()
  const result: ParsedTiktokMasterRow[] = []

  for (const row of data) {
    const pid = normalizeProductId(row['product_id'])
    if (!pid) continue
    if (seen.has(pid)) continue
    seen.add(pid)

    const ten = row['product_name']
    const cat = row['category']
    result.push({
      product_id: pid,
      ten_tiktok: ten ? String(ten).trim() : null,
      category: cat ? String(cat).trim() : null,
    })
  }

  return result
}
