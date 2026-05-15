/**
 * Shared helpers for TikTok xlsx parsers.
 *
 * TikTok Ads Manager exports column names in the user's locale — English OR
 * Vietnamese depending on account language. The parsers accept BOTH so the
 * tool keeps working regardless of which language the operator's TikTok
 * account is set to.
 */

/** Resolve a column synonym set against an actual row — return the first key
 *  that exists in the row, or null if none match. */
export function resolveCol(row: Record<string, unknown>, synonyms: readonly string[]): string | null {
  for (const s of synonyms) if (s in row) return s
  return null
}

/** Sum a column across all data rows. `synonyms` = list of column names that
 *  may appear (different TikTok locales). Returns 0 if no synonym matches. */
export function sumCol(rows: Record<string, unknown>[], synonyms: readonly string[]): number {
  const col = rows.length > 0 ? resolveCol(rows[0], synonyms) : null
  if (!col) return 0
  return rows.reduce((s, r) => s + (Number(r[col]) || 0), 0)
}

/** Verify at least one synonym for each required column group exists in the
 *  data. Throws a friendly Vietnamese error listing the missing groups. */
export function verifyColumns(
  rows: Record<string, unknown>[],
  required: { label: string; synonyms: readonly string[] }[],
  fileLabel: string,
): void {
  if (rows.length === 0) return
  const missing: string[] = []
  for (const { label, synonyms } of required) {
    if (!resolveCol(rows[0], synonyms)) {
      missing.push(`"${label}" (${synonyms.join(' / ')})`)
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `${fileLabel}: không tìm thấy cột ${missing.join(', ')}. Sàn có thể đã đổi format hoặc đổi ngôn ngữ export.`,
    )
  }
}

/* ── Column synonyms per metric (English first, Vietnamese fallback) ── */

export const PGM_COLS = {
  gmv: ['Gross revenue', 'Doanh thu gộp'] as const,
  cost: ['Cost', 'Chi phí'] as const,
  impressions: ['Product ad impressions', 'Số lượt hiển thị quảng cáo sản phẩm'] as const,
  clicks: ['Product ad clicks', 'Số lượt nhấp vào quảng cáo sản phẩm'] as const,
  orders: ['SKU orders', 'Số lượng đơn hàng SKU'] as const,
}

export const LGM_COLS = {
  // IMPORTANT: NOT "Gross revenue (Current shop)" / "Doanh thu gộp (Cửa hàng hiện tại)"
  // — those are scoped subsets, per Brief V9.2 §4.
  gmv: ['Gross revenue', 'Doanh thu gộp'] as const,
  // IMPORTANT: NOT "Net Cost" / "Chi phí ròng".
  cost: ['Cost', 'Chi phí'] as const,
}
