/**
 * Shared types for the Weekly Report tool.
 */

export type Brand = {
  id: string
  brand_name: string
  // Context fields (all nullable — fill richer for better AI analysis)
  industry?: string | null
  product_type?: string | null
  target_audience?: string | null
  price_range?: string | null // 'Premium' | 'Mid' | 'Mass'
  brand_stage?: string | null // 'New' | 'Growing' | 'Mature'
  monthly_budget?: string | null
  roas_target?: string | null
  seasonality?: string | null
  live_schedule?: string | null
  key_kpis?: string | null
  notes?: string | null
}

/** Build a multi-line BRAND CONTEXT block for AI userMsg. Returns empty string
 *  when no fields are filled — so prompt stays clean when context is missing. */
export function buildBrandContext(brand: Brand | null | undefined): string {
  if (!brand) return ''
  const rows: Array<[string, string | null | undefined]> = [
    ['Brand', brand.brand_name],
    ['Industry', brand.industry],
    ['Product type', brand.product_type],
    ['Target audience', brand.target_audience],
    ['Price range', brand.price_range],
    ['Brand stage', brand.brand_stage],
    ['Monthly budget', brand.monthly_budget],
    ['ROAS target', brand.roas_target],
    ['Seasonality', brand.seasonality],
    ['Live schedule', brand.live_schedule],
    ['Key KPIs', brand.key_kpis],
    ['Notes', brand.notes],
  ]
  const filled = rows.filter(([, v]) => typeof v === 'string' && v.trim().length > 0)
  // Need at least brand_name + 1 other field to be worth emitting
  if (filled.length <= 1) return ''
  const body = filled.map(([k, v]) => `${k}: ${v}`).join('\n')
  return `=== BRAND CONTEXT ===\n${body}\n\n`
}

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
