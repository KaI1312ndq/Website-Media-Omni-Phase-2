import type { ShopeeFileType, PivotRow } from './types'
import { parseShopeeCPC } from './shopee-cpc'
import { parseShopeeBranding } from './shopee-branding'
import { parseShopeeLive } from './shopee-live'

export * from './types'
export { parseShopeeCPC, parseShopeeBranding, parseShopeeLive }
export { buildShopeePivot, pivotToAutoFill } from './pivot'

/**
 * Detect Shopee file type by filename. Returns null if not matched (user
 * should pick manually). Case-insensitive, normalized.
 *
 * Real filenames from Seller Center:
 *   CPC:       "Dữ liệu Dịch vụ Hiển thị Shopee-..." OR "Dữ+liệu+Dịch+vụ+Hiển+thị+Shopee-..."
 *   Branding:  "Dữ liệu Dịch vụ Hiển thị Tăng nhận diện thương hiệu trên Trang kết quả tìm kiếm-..."
 *   Live:      "Dữ-Liệu-Quảng-Cáo-Livestream-..." (uses hyphens instead of spaces)
 */
export function detectFileType(filename: string): ShopeeFileType | null {
  const norm = filename
    .normalize('NFC')
    .toLowerCase()
    .replace(/[+_\-\s]+/g, ' ') // collapse separators to single space

  if (/quảng cáo livestream/.test(norm)) return 'shopee_live'
  if (/tăng nhận diện thương hiệu/.test(norm)) return 'shopee_branding'
  if (/dịch vụ hiển thị shopee/.test(norm)) return 'shopee_cpc'
  return null
}

/** Dispatch parser by type. */
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
