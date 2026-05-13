/**
 * Types for Shopee CSV file parsers — Phase 2A.
 * See docs/hub-report-brief.md (Brief V9.1) for spec.
 */

export type ShopeeFileType = 'shopee_cpc' | 'shopee_branding' | 'shopee_live'

export type HinhThuc = 'Ads CPC' | 'Ads Branding' | 'Ads Live'

export interface ParsedFile {
  fileType: ShopeeFileType
  fileName: string
  rows: number // # of data rows parsed
  groups: PivotRow[] // per-group sub-rows (before subtotal / derived calc)
}

export interface PivotRow {
  hinh_thuc: HinhThuc | '' // '' for grand total
  loai_dvht: string // tên loại dịch vụ hiển thị / hoặc 'Total' / 'Tổng cộng'
  isTotal: boolean // true cho row "Total" của mỗi hình thức
  isGrandTotal?: boolean // true cho row "Tổng cộng" cuối bảng

  // Raw aggregated metrics (sum)
  gmv: number
  cost: number
  hien_thi: number
  clicks: number | null // null khi không có (Ads Live)
  orders: number

  // Derived (computed AFTER aggregation, per brief mục 5)
  roas: number // gmv / cost
  cpc: number | null // cost / clicks (null when clicks=null or 0)
  cpm: number // cost / hien_thi * 1000
  ctr: number | null // clicks / hien_thi * 100 (% — null when no clicks)
  cr: number | null // orders / clicks * 100 (% — null when no clicks)
  pct_gmv: number // gmv / grand_total_gmv * 100
  pct_cost: number // cost / grand_total_cost * 100
}

export interface ShopeePivot {
  rows: PivotRow[] // CPC subrows → CPC Total → Branding subrows → Branding Total → Live subrows → Live Total → Tổng cộng
  metadata: {
    cpc_present: boolean
    branding_present: boolean
    live_present: boolean
    shop_name?: string
    week_range?: string
  }
}

/* ════════════════════════════════════════════════════════════
   Shopee — vertical preview format (Brief: pivot dọc theo 4 nhóm
   hình thức, giống TikTok layout)
════════════════════════════════════════════════════════════ */

export type ShopeeVerticalHinhThuc = 'Ads tổng' | 'Ads CPC' | 'Ads nhận diện thương hiệu' | 'Ads livestream'

export type ShopeeMetricFormat = 'integer' | 'decimal' | 'percent'

export interface ShopeeVerticalRow {
  hinh_thuc: ShopeeVerticalHinhThuc
  metric: string
  value: number | null // null → render "—"
  format: ShopeeMetricFormat
  isBold: boolean // bold cho Ads tổng rows
}

export interface ShopeeVerticalPivot {
  rows: ShopeeVerticalRow[]
}

/** Aggregated Shopee actuals → maps directly into Step 2's 12 fields. */
export interface ShopeeAutoFill {
  s_cpc_doanh_so: number
  s_cpc_chi_phi: number
  s_cpc_luot_xem: number
  s_cpc_luot_click: number
  s_cpc_don_hang: number
  s_nd_gmv: number
  s_nd_chi_phi: number
  s_nd_luot_xem: number
  s_nd_luot_click: number
  s_live_gmv: number
  s_live_chi_phi: number
  s_live_luot_xem: number
}

/* ════════════════════════════════════════════════════════════
   TikTok — Phase 2B
════════════════════════════════════════════════════════════ */

export type TiktokFileType = 'tiktok_pgm' | 'tiktok_lgm'

export interface TiktokPGMData {
  gmv: number
  cost: number
  hien_thi: number
  clicks: number
  orders: number
}

export interface TiktokLGMData {
  gmv: number
  cost: number
}

export type TiktokHinhThuc = 'Ads_Total' | 'Ads_PGM' | 'Ads_LGM' | 'Consideration_Ads' | 'Branding_Ads'
export type TiktokValueFormat = 'integer' | 'decimal' | 'percent'

export interface TiktokPivotRow {
  hinh_thuc: TiktokHinhThuc
  metric: string
  value: number | null // null → render "—"
  format: TiktokValueFormat
  isBold: boolean // true for Ads_Total rows
}

export interface TiktokPivot {
  rows: TiktokPivotRow[]
  metadata: {
    pgm_present: boolean
    lgm_present: boolean
  }
}

/** Aggregated TikTok actuals → maps into 7 of Step 2's TikTok fields (PGM 5 + LGM 2). */
export interface TiktokAutoFill {
  t_pgm_doanh_so: number
  t_pgm_chi_phi: number
  t_pgm_luot_xem: number
  t_pgm_luot_click: number
  t_pgm_don_hang: number
  t_lgm_doanhthu: number
  t_lgm_chi_phi: number
}
