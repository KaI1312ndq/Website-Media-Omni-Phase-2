import * as XLSX from 'xlsx'
import type { TiktokLGMData } from './types'
import { LGM_COLS, sumCol, verifyColumns } from './tiktok-common'

/**
 * Parse TikTok LGM xlsx (livestream data for live campaigns).
 * Each row = 1 LIVE session. SUM across all rows.
 *
 * Accepts EN + VN column names. CRITICAL (per Brief V9.2 §4): use the bare
 * "Gross revenue" / "Doanh thu gộp" + "Cost" / "Chi phí" columns — NOT the
 * "(Current shop)" / "(Cửa hàng hiện tại)" or "Net Cost" / "Chi phí ròng"
 * variants (those are scoped subsets).
 */
export async function parseTiktokLGM(file: File): Promise<TiktokLGMData> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  if (!ws) throw new Error('File TikTok LGM trống hoặc không hợp lệ')

  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null })
  if (data.length === 0) return { gmv: 0, cost: 0 }

  verifyColumns(
    data,
    [
      { label: 'Gross revenue', synonyms: LGM_COLS.gmv },
      { label: 'Cost', synonyms: LGM_COLS.cost },
    ],
    'File TikTok LGM',
  )

  return {
    gmv: sumCol(data, LGM_COLS.gmv),
    cost: sumCol(data, LGM_COLS.cost),
  }
}
