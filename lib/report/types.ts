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

/** Single matrix cell — 1 row × 4 columns in the email pivot table. */
export type AIMatrixCell = {
  plan: string
  actual: string
  danh_gia: string
  giai_phap: string
}

/** The 7 hạng mục in V2 schema, in render order. */
export const AI_MATRIX_KEYS = [
  'shopee_ads_cpc',
  'shopee_ads_nd',
  'shopee_ads_live',
  'tiktok_pgm',
  'tiktok_lgm',
  'tiktok_consideration',
  'tiktok_branding',
] as const
export type AIMatrixKey = (typeof AI_MATRIX_KEYS)[number]

/** Empty cell template — used when AI returns null/missing or when initialising. */
export const EMPTY_CELL: AIMatrixCell = { plan: '', actual: '', danh_gia: '', giai_phap: '' }

/**
 * AI report result.
 *
 * V2 schema (matrix) is the canonical output. Legacy V1 aggregate fields
 * (shopee_thuc_trang, ...) are derived from the matrix at parse time for
 * backward compat with the existing email render + save path. Once Phase B
 * (matrix-native UI) ships, the V1 fields can be dropped.
 */
export type AIResult = {
  highlight: string
  lowlight: string

  // V2 matrix — 7 hạng mục × 4 cells
  shopee_ads_cpc: AIMatrixCell
  shopee_ads_nd: AIMatrixCell
  shopee_ads_live: AIMatrixCell
  tiktok_pgm: AIMatrixCell
  tiktok_lgm: AIMatrixCell
  tiktok_consideration: AIMatrixCell
  tiktok_branding: AIMatrixCell

  // V1 aggregate fields — derived from V2 matrix, kept for legacy UI + DB
  shopee_thuc_trang: string
  shopee_van_de: string
  shopee_giai_phap: string
  tiktok_thuc_trang: string
  tiktok_van_de: string
  tiktok_giai_phap: string
}

/** Build empty AIResult (all fields blank). */
export function emptyAIResult(): AIResult {
  return {
    highlight: '',
    lowlight: '',
    shopee_ads_cpc: { ...EMPTY_CELL },
    shopee_ads_nd: { ...EMPTY_CELL },
    shopee_ads_live: { ...EMPTY_CELL },
    tiktok_pgm: { ...EMPTY_CELL },
    tiktok_lgm: { ...EMPTY_CELL },
    tiktok_consideration: { ...EMPTY_CELL },
    tiktok_branding: { ...EMPTY_CELL },
    shopee_thuc_trang: '',
    shopee_van_de: '',
    shopee_giai_phap: '',
    tiktok_thuc_trang: '',
    tiktok_van_de: '',
    tiktok_giai_phap: '',
  }
}

/** Display label per matrix key — used in UI table + AI input. */
export const AI_MATRIX_LABEL: Record<AIMatrixKey, { platform: 'Shopee' | 'TikTok'; label: string }> = {
  shopee_ads_cpc: { platform: 'Shopee', label: 'Ads CPC' },
  shopee_ads_nd: { platform: 'Shopee', label: 'Ads nhận diện thương hiệu' },
  shopee_ads_live: { platform: 'Shopee', label: 'Ads livestream' },
  tiktok_pgm: { platform: 'TikTok', label: 'Ads PGM' },
  tiktok_lgm: { platform: 'TikTok', label: 'Ads LGM' },
  tiktok_consideration: { platform: 'TikTok', label: 'Consideration_Ads' },
  tiktok_branding: { platform: 'TikTok', label: 'Branding_Ads' },
}

/** DB column prefix per matrix key — for save/load. */
export const AI_MATRIX_DB_PREFIX: Record<AIMatrixKey, string> = {
  shopee_ads_cpc: 's_cpc',
  shopee_ads_nd: 's_nd',
  shopee_ads_live: 's_live',
  tiktok_pgm: 't_pgm',
  tiktok_lgm: 't_lgm',
  tiktok_consideration: 't_con',
  tiktok_branding: 't_brd',
}

/**
 * Parse AI JSON output → strict AIResult.
 * Missing/invalid cells default to "—" (per Brief §10 case 5).
 * Also derives V1 aggregate fields for legacy compat.
 */
export function parseAIResult(raw: unknown): AIResult {
  const out = emptyAIResult()
  if (!raw || typeof raw !== 'object') return out
  const o = raw as Record<string, unknown>

  if (typeof o.highlight === 'string') out.highlight = o.highlight
  if (typeof o.lowlight === 'string') out.lowlight = o.lowlight

  const sanitizeCell = (v: unknown): AIMatrixCell => {
    if (!v || typeof v !== 'object') return { ...EMPTY_CELL }
    const c = v as Record<string, unknown>
    return {
      plan: typeof c.plan === 'string' ? c.plan : '',
      actual: typeof c.actual === 'string' ? c.actual : '',
      danh_gia: typeof c.danh_gia === 'string' ? c.danh_gia : '',
      giai_phap: typeof c.giai_phap === 'string' ? c.giai_phap : '',
    }
  }

  for (const k of AI_MATRIX_KEYS) {
    out[k] = sanitizeCell(o[k])
  }

  // Derive V1 aggregates (legacy compat)
  const joinPlatform = (platformKeys: AIMatrixKey[], cellField: keyof AIMatrixCell): string =>
    platformKeys
      .map(k => {
        const v = out[k][cellField]
        if (!v || v === '—') return ''
        return `[${AI_MATRIX_LABEL[k].label}]\n${v}`
      })
      .filter(Boolean)
      .join('\n\n')

  const shopeeKeys: AIMatrixKey[] = ['shopee_ads_cpc', 'shopee_ads_nd', 'shopee_ads_live']
  const tiktokKeys: AIMatrixKey[] = ['tiktok_pgm', 'tiktok_lgm', 'tiktok_consideration', 'tiktok_branding']
  out.shopee_thuc_trang = joinPlatform(shopeeKeys, 'actual')
  out.shopee_van_de = joinPlatform(shopeeKeys, 'danh_gia')
  out.shopee_giai_phap = joinPlatform(shopeeKeys, 'giai_phap')
  out.tiktok_thuc_trang = joinPlatform(tiktokKeys, 'actual')
  out.tiktok_van_de = joinPlatform(tiktokKeys, 'danh_gia')
  out.tiktok_giai_phap = joinPlatform(tiktokKeys, 'giai_phap')

  return out
}

/** Previous-week giai_phap per hạng mục — fed back into prompt for closed-loop track.
 *  Includes year/month/week metadata so UI can show "Đề xuất W3 T4/2026...". */
export type PreviousSolutions = Partial<Record<AIMatrixKey, string>> & {
  year?: number
  month?: number
  week?: number
}
