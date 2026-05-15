import type { ShopeeFileType, TiktokFileType, PivotRow, TiktokPGMData, TiktokLGMData } from './types'
import { parseShopeeCPC } from './shopee-cpc'
import { parseShopeeBranding } from './shopee-branding'
import { parseShopeeLive } from './shopee-live'
import { parseTiktokPGM } from './tiktok-pgm'
import { parseTiktokLGM } from './tiktok-lgm'

export * from './types'
export { parseShopeeCPC, parseShopeeBranding, parseShopeeLive }
export { parseTiktokPGM, parseTiktokLGM }
export { buildShopeePivot, pivotToAutoFill, toShopeeVerticalPivot } from './pivot'
export { buildTiktokPivot, tiktokToAutoFill } from './tiktok-pivot'

/**
 * Detect Shopee file type by filename. Returns null if not matched (user
 * should pick manually). Case-insensitive, normalized.
 *
 * Handles both Shopee export variants:
 *   - "Chi tiết" (single campaign):  "Báo cáo chi tiết Dịch vụ Hiển thị ..."
 *   - "Tổng quan" (multi-campaign):  "Dữ liệu tổng quan Dịch vụ Hiển thị ..."
 *
 * Order matters: Branding contains "thương hiệu" (unique), check it first.
 * Live: filename always contains "livestream" — either as "Quảng cáo
 * Livestream" (chi tiết) or "Dịch vụ Hiển thị Livestream" (tổng quan).
 * CPC: anything else with "dịch vụ hiển thị shopee" or shopee CPC keywords.
 */
export function detectFileType(filename: string): ShopeeFileType | null {
  const norm = filename
    .normalize('NFC')
    .toLowerCase()
    .replace(/[+_\-\s]+/g, ' ')

  if (/tăng nhận diện thương hiệu/.test(norm)) return 'shopee_branding'
  if (/livestream/.test(norm)) return 'shopee_live'
  if (/dịch vụ hiển thị shopee/.test(norm)) return 'shopee_cpc'
  return null
}

/**
 * Detect TikTok file type by filename. Real names from TikTok Ads Manager:
 *   PGM: creative_data_for_product_campaigns__{from}___{to}_.xlsx
 *   LGM: livestream_data_for_live_campaigns__{from}___{to}_.xlsx
 */
export function detectTiktokFileType(filename: string): TiktokFileType | null {
  const norm = filename
    .normalize('NFC')
    .toLowerCase()
    .replace(/[+_\-\s]+/g, ' ')

  if (/livestream data for live campaigns/.test(norm)) return 'tiktok_lgm'
  if (/creative data for product campaigns/.test(norm)) return 'tiktok_pgm'
  return null
}

/** Dispatch Shopee parser by type. */
export async function parseShopeeFile(file: File, fileType: ShopeeFileType): Promise<PivotRow[]> {
  switch (fileType) {
    case 'shopee_cpc':
      return parseShopeeCPC(file)
    case 'shopee_branding':
      return parseShopeeBranding(file)
    case 'shopee_live':
      return parseShopeeLive(file)
  }
}

/** Dispatch TikTok parser by type. Returns PGM or LGM data shape. */
export async function parseTiktokFile(
  file: File,
  fileType: TiktokFileType,
): Promise<TiktokPGMData | TiktokLGMData> {
  switch (fileType) {
    case 'tiktok_pgm':
      return parseTiktokPGM(file)
    case 'tiktok_lgm':
      return parseTiktokLGM(file)
  }
}
