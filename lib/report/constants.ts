/**
 * Constants for the Weekly Report tool.
 */
import type { ShopeeData, TiktokData } from './types'

/** Ordered list of all actual metric keys — used for paste fill direction. */
export const ACTUAL_KEYS_ORDER = [
  's_cpc_doanh_so',
  's_cpc_chi_phi',
  's_cpc_luot_xem',
  's_cpc_luot_click',
  's_cpc_don_hang',
  's_nd_gmv',
  's_nd_chi_phi',
  's_nd_luot_xem',
  's_nd_luot_click',
  's_live_gmv',
  's_live_chi_phi',
  's_live_luot_xem',
  't_pgm_doanh_so',
  't_pgm_chi_phi',
  't_pgm_luot_xem',
  't_pgm_luot_click',
  't_pgm_don_hang',
  't_lgm_doanhthu',
  't_lgm_chi_phi',
  't_con_nguoi',
  't_con_chi_phi',
  't_brd_view',
  't_brd_follow',
  't_brd_chi_phi',
]

export const PLAN_PERIODS_ORDER = ['month', 'w1', 'w2', 'w3', 'w4', 'w5'] as const

export const EMPTY_SHOPEE: ShopeeData = {
  s_cpc_doanh_so: 0,
  s_cpc_chi_phi: 0,
  s_cpc_luot_xem: 0,
  s_cpc_luot_click: 0,
  s_cpc_don_hang: 0,
  s_nd_gmv: 0,
  s_nd_chi_phi: 0,
  s_nd_luot_xem: 0,
  s_nd_luot_click: 0,
  s_live_gmv: 0,
  s_live_chi_phi: 0,
  s_live_luot_xem: 0,
}

export const EMPTY_TIKTOK: TiktokData = {
  t_pgm_doanh_so: 0,
  t_pgm_chi_phi: 0,
  t_pgm_luot_xem: 0,
  t_pgm_luot_click: 0,
  t_pgm_don_hang: 0,
  t_lgm_doanhthu: 0,
  t_lgm_chi_phi: 0,
  t_con_nguoi: 0,
  t_con_chi_phi: 0,
  t_brd_view: 0,
  t_brd_follow: 0,
  t_brd_chi_phi: 0,
}
