import * as XLSX from 'xlsx'
import type { TiktokLGMData } from './types'

// Brief V9.2 §4 (file 2): "Gross revenue" + "Cost" (NOT "Current shop" / "Net Cost")
const REQUIRED_COLS = ['Gross revenue', 'Cost']

/**
 * Parse TikTok LGM xlsx (livestream_data_for_live_campaigns_*.xlsx).
 * Each row = 1 LIVE session. SUM across all rows.
 *
 * IMPORTANT (per Brief CRITICAL): use the bare "Gross revenue" + "Cost" columns,
 * NOT "Gross revenue (Current shop)" or "Net Cost" — those are scoped subsets.
 */
export async function parseTiktokLGM(file: File): Promise<TiktokLGMData> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  if (!ws) throw new Error('File TikTok LGM trống hoặc không hợp lệ')

  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null })
  if (data.length === 0) return { gmv: 0, cost: 0 }

  for (const col of REQUIRED_COLS) {
    if (!(col in data[0])) {
      throw new Error(`File TikTok LGM: không tìm thấy cột "${col}". Sàn có thể đã đổi format.`)
    }
  }

  return {
    gmv: data.reduce((s, r) => s + (Number(r['Gross revenue']) || 0), 0),
    cost: data.reduce((s, r) => s + (Number(r['Cost']) || 0), 0),
  }
}
