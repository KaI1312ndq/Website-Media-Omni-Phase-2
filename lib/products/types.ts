/**
 * Product Master types — Brief V11 §3.1.
 *
 * 1 row = 1 Mã Sản phẩm Shopee (UNIQUE per brand).
 * Nhiều Mã có thể chung `ten_define` → group khi drilldown.
 */

export interface ProductMasterRow {
  id?: string
  brand_name: string
  ma_san_pham: string
  ten_shopee: string | null
  ten_define: string | null
  sku_code: string | null
  updated_by?: string | null
  updated_at?: string | null
}

/** Row sau khi parse file Master (chưa lưu DB). */
export interface ParsedMasterRow {
  ma_san_pham: string
  ten_shopee: string | null
  sku_code: string | null
  /** True nếu Mã đã tồn tại trong DB cho brand này. */
  exists?: boolean
  /** Tên define hiện có trong DB — KHÔNG ghi đè khi import. */
  existing_ten_define?: string | null
}
