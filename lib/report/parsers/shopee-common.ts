import * as XLSX from 'xlsx'

/**
 * Find the header row index by looking for cells that include ALL of the
 * required column names. Returns 0-based row index (the row that contains
 * column headers — i.e. `range:` value for sheet_to_json).
 *
 * Shopee Seller Center exports 2 flavours of the same report:
 *   - "Báo cáo chi tiết ..." — many metadata rows, headers ~row 11/12
 *   - "Báo cáo ..." (tổng quan) — fewer metadata rows, headers ~row 7
 * Hardcoding `range:` per flavour is brittle — adaptive detection is safer
 * and survives future Shopee format tweaks.
 */
export function findHeaderRow(ws: XLSX.WorkSheet, requiredCols: string[], maxScan = 40): number {
  const grid = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    blankrows: true,
    defval: null,
  }) as unknown[][]

  for (let i = 0; i < Math.min(grid.length, maxScan); i++) {
    const row = grid[i] ?? []
    const cells = new Set(row.map(c => String(c ?? '').trim()))
    if (requiredCols.every(col => cells.has(col))) return i
  }
  return -1
}

/**
 * Parse a Shopee CSV/xlsx sheet adaptively — caller passes the column names
 * that MUST exist; we find the header row by scanning and skip metadata
 * automatically.
 *
 * Throws a friendly Vietnamese error if no row contains all required cols.
 */
export function readShopeeSheet(
  ws: XLSX.WorkSheet,
  requiredCols: string[],
  fileLabel: string,
): Record<string, unknown>[] {
  const headerIdx = findHeaderRow(ws, requiredCols)
  if (headerIdx < 0) {
    throw new Error(
      `${fileLabel}: không tìm thấy header (cần cột ${requiredCols
        .slice(0, 3)
        .map(c => `"${c}"`)
        .join(', ')}...). Sàn có thể đã đổi format hoặc file sai loại.`,
    )
  }
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    range: headerIdx,
    defval: null,
  })
}
