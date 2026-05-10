/**
 * Shared types for the Weekly Report tool.
 */

export type Brand = { id: string; brand_name: string }

export type PlanData = Record<
  string,
  { w1: number; w2: number; w3: number; w4: number; w5: number; month: number }
>

export type WeekInfo = {
  weekNum: number
  month: number
  year: number
  quarter: number
  label: string
  start: string // dd/MM/yyyy
  end: string
  startISO: string // yyyy-MM-dd
  endISO: string
  days: number
  isFull: boolean
}

export type ShopeeData = {
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

export type TiktokData = {
  t_pgm_doanh_so: number
  t_pgm_chi_phi: number
  t_pgm_luot_xem: number
  t_pgm_luot_click: number
  t_pgm_don_hang: number
  t_lgm_doanhthu: number
  t_lgm_chi_phi: number
  t_con_nguoi: number
  t_con_chi_phi: number
  t_brd_view: number
  t_brd_follow: number
  t_brd_chi_phi: number
}

export type AIResult = {
  highlight: string
  lowlight: string
  shopee_thuc_trang: string
  shopee_van_de: string
  shopee_giai_phap: string
  tiktok_thuc_trang: string
  tiktok_van_de: string
  tiktok_giai_phap: string
}
