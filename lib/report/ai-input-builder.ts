/**
 * Build the user message that gets sent to the LLM alongside DEFAULT_SYS_PROMPT.
 *
 * Layout (per Brief V10 §4.2):
 *   - BRAND CONTEXT
 *   - TUẦN BÁO CÁO
 *   - SHOPEE — ACTUAL vs PLAN (3 hạng mục)
 *   - TIKTOK — ACTUAL vs PLAN (4 hạng mục)
 *   - WoW COMPARISON (4 tuần gần nhất, if available)
 *
 * Each hạng mục block includes plan, actual, derived metrics, and last
 * week's giải pháp (closed-loop track).
 */
import type { Brand, PlanData, ShopeeData, TiktokData, WeekInfo, PreviousSolutions } from './types'
import { buildBrandContext } from './types'

const fmt = (v: number) => (v ? Math.round(v).toLocaleString('vi-VN') : '0')
const pctStr = (actual: number, plan: number): string => {
  if (!plan) return '—'
  return `${((actual / plan) * 100).toFixed(0)}%`
}
const wowStr = (curr: number, prev: number): string => {
  if (!prev) return '—'
  const delta = ((curr - prev) / prev) * 100
  const sign = delta >= 0 ? '+' : ''
  return `${sign}${delta.toFixed(1)}% WoW`
}

interface BuildInput {
  brand: Brand | null
  weekInfo: WeekInfo
  shopeeChecked: boolean
  tiktokChecked: boolean
  shopeeData: ShopeeData
  tiktokData: TiktokData
  shopeePlan: PlanData | null
  tiktokPlan: PlanData | null
  previousSolutions: PreviousSolutions | null
  // Last 4 weeks reports (for WoW). Rows from /api/report?action=history
  weekHistory: Array<Record<string, number | string | null>>
}

/** Get plan value for a metric at the current week. */
function pv(plan: PlanData | null, key: string, weekNum: number): number {
  if (!plan) return 0
  const periodKey = `w${weekNum}` as 'w1'
  return plan[key]?.[periodKey] || 0
}

/** Pull a numeric value from a history row, coerced to number. */
function num(row: Record<string, number | string | null> | undefined, key: string): number {
  if (!row) return 0
  const v = row[key]
  return typeof v === 'number' ? v : parseFloat(String(v ?? 0)) || 0
}

export function buildAIInput(input: BuildInput): string {
  const {
    brand,
    weekInfo,
    shopeeChecked,
    tiktokChecked,
    shopeeData,
    tiktokData,
    shopeePlan,
    tiktokPlan,
    previousSolutions: prev,
    weekHistory,
  } = input

  const w = weekInfo.weekNum
  const prevWeekRow = weekHistory.find(r => parseInt(String(r.week_num)) === w - 1)
  const prevSol = (k: keyof PreviousSolutions): string =>
    (prev?.[k] && prev[k]!.trim()) || '— Không có (tuần đầu hoặc chưa generate AI)'

  let out = ''

  // ── 1. BRAND CONTEXT ──
  const brandCtx = buildBrandContext(brand)
  out += brandCtx || `=== BRAND CONTEXT ===\n${brand?.brand_name ?? '(không brand)'} — chưa fill context\n\n`

  // ── 2. TUẦN BÁO CÁO ──
  out += `=== TUẦN BÁO CÁO ===\n${weekInfo.label} (${weekInfo.start} → ${weekInfo.end}, ${weekInfo.days} ngày${weekInfo.isFull ? '' : ' — tuần lẻ'})\n\n`

  // ── 3. SHOPEE blocks ──
  if (shopeeChecked) {
    out += `=== SHOPEE — ACTUAL vs PLAN ===\n`

    // CPC
    {
      const planGmv = pv(shopeePlan, 's_cpc_doanh_so', w)
      const planCost = pv(shopeePlan, 's_cpc_chi_phi', w)
      const prevGmv = num(prevWeekRow, 's_cpc_doanh_so')
      const roas =
        shopeeData.s_cpc_chi_phi > 0 ? (shopeeData.s_cpc_doanh_so / shopeeData.s_cpc_chi_phi).toFixed(2) : '—'
      const cpc =
        shopeeData.s_cpc_luot_click > 0
          ? Math.round(shopeeData.s_cpc_chi_phi / shopeeData.s_cpc_luot_click)
          : 0
      const ctr =
        shopeeData.s_cpc_luot_xem > 0
          ? ((shopeeData.s_cpc_luot_click / shopeeData.s_cpc_luot_xem) * 100).toFixed(2)
          : '—'
      const cr =
        shopeeData.s_cpc_luot_click > 0
          ? ((shopeeData.s_cpc_don_hang / shopeeData.s_cpc_luot_click) * 100).toFixed(2)
          : '—'
      const aov =
        shopeeData.s_cpc_don_hang > 0 ? Math.round(shopeeData.s_cpc_doanh_so / shopeeData.s_cpc_don_hang) : 0
      out += `[Ads CPC]\n`
      out += `  Plan: GMV ${fmt(planGmv)} · Cost ${fmt(planCost)}\n`
      out += `  Actual: GMV ${fmt(shopeeData.s_cpc_doanh_so)} (${pctStr(shopeeData.s_cpc_doanh_so, planGmv)} plan, ${wowStr(shopeeData.s_cpc_doanh_so, prevGmv)}) · Cost ${fmt(shopeeData.s_cpc_chi_phi)} · Đơn ${shopeeData.s_cpc_don_hang}\n`
      out += `  Derived: ROAS ${roas} · CPC ${cpc.toLocaleString('vi-VN')} · CTR ${ctr}% · CR ${cr}% · AOV ${aov.toLocaleString('vi-VN')}\n`
      out += `  Đề xuất tuần trước: ${prevSol('shopee_ads_cpc')}\n\n`
    }
    // ND
    {
      const planGmv = pv(shopeePlan, 's_nd_gmv', w)
      const planCost = pv(shopeePlan, 's_nd_chi_phi', w)
      const prevGmv = num(prevWeekRow, 's_nd_gmv')
      const roas =
        shopeeData.s_nd_chi_phi > 0 ? (shopeeData.s_nd_gmv / shopeeData.s_nd_chi_phi).toFixed(2) : '—'
      const ctr =
        shopeeData.s_nd_luot_xem > 0
          ? ((shopeeData.s_nd_luot_click / shopeeData.s_nd_luot_xem) * 100).toFixed(2)
          : '—'
      const cpm =
        shopeeData.s_nd_luot_xem > 0
          ? Math.round((shopeeData.s_nd_chi_phi / shopeeData.s_nd_luot_xem) * 1000)
          : 0
      out += `[Ads Nhận Diện thương hiệu]\n`
      out += `  Plan: GMV ${fmt(planGmv)} · Cost ${fmt(planCost)}\n`
      out += `  Actual: GMV ${fmt(shopeeData.s_nd_gmv)} (${pctStr(shopeeData.s_nd_gmv, planGmv)} plan, ${wowStr(shopeeData.s_nd_gmv, prevGmv)}) · Cost ${fmt(shopeeData.s_nd_chi_phi)}\n`
      out += `  Derived: ROAS ${roas} · CTR ${ctr}% · CPM ${cpm.toLocaleString('vi-VN')} · Hiển thị ${fmt(shopeeData.s_nd_luot_xem)} · Click ${shopeeData.s_nd_luot_click}\n`
      out += `  Đề xuất tuần trước: ${prevSol('shopee_ads_nd')}\n\n`
    }
    // Live
    {
      const planGmv = pv(shopeePlan, 's_live_gmv', w)
      const planCost = pv(shopeePlan, 's_live_chi_phi', w)
      const prevGmv = num(prevWeekRow, 's_live_gmv')
      const roas =
        shopeeData.s_live_chi_phi > 0 ? (shopeeData.s_live_gmv / shopeeData.s_live_chi_phi).toFixed(2) : '—'
      out += `[Ads Livestream]\n`
      out += `  Plan: GMV ${fmt(planGmv)} · Cost ${fmt(planCost)}\n`
      out += `  Actual: GMV ${fmt(shopeeData.s_live_gmv)} (${pctStr(shopeeData.s_live_gmv, planGmv)} plan, ${wowStr(shopeeData.s_live_gmv, prevGmv)}) · Cost ${fmt(shopeeData.s_live_chi_phi)} · Lượt xem ${fmt(shopeeData.s_live_luot_xem)}\n`
      out += `  Derived: ROAS ${roas}\n`
      out += `  Đề xuất tuần trước: ${prevSol('shopee_ads_live')}\n\n`
    }
  }

  // ── 4. TIKTOK blocks ──
  if (tiktokChecked) {
    out += `=== TIKTOK — ACTUAL vs PLAN ===\n`

    // PGM
    {
      const planGmv = pv(tiktokPlan, 't_pgm_doanh_so', w)
      const planCost = pv(tiktokPlan, 't_pgm_chi_phi', w)
      const prevGmv = num(prevWeekRow, 't_pgm_doanh_so')
      const roas =
        tiktokData.t_pgm_chi_phi > 0 ? (tiktokData.t_pgm_doanh_so / tiktokData.t_pgm_chi_phi).toFixed(2) : '—'
      const cpc =
        tiktokData.t_pgm_luot_click > 0
          ? Math.round(tiktokData.t_pgm_chi_phi / tiktokData.t_pgm_luot_click)
          : 0
      const ctr =
        tiktokData.t_pgm_luot_xem > 0
          ? ((tiktokData.t_pgm_luot_click / tiktokData.t_pgm_luot_xem) * 100).toFixed(2)
          : '—'
      const cr =
        tiktokData.t_pgm_luot_click > 0
          ? ((tiktokData.t_pgm_don_hang / tiktokData.t_pgm_luot_click) * 100).toFixed(2)
          : '—'
      const cpm =
        tiktokData.t_pgm_luot_xem > 0
          ? Math.round((tiktokData.t_pgm_chi_phi / tiktokData.t_pgm_luot_xem) * 1000)
          : 0
      out += `[Ads PGM]\n`
      out += `  Plan: GMV ${fmt(planGmv)} · Cost ${fmt(planCost)}\n`
      out += `  Actual: GMV ${fmt(tiktokData.t_pgm_doanh_so)} (${pctStr(tiktokData.t_pgm_doanh_so, planGmv)} plan, ${wowStr(tiktokData.t_pgm_doanh_so, prevGmv)}) · Cost ${fmt(tiktokData.t_pgm_chi_phi)} · Đơn ${tiktokData.t_pgm_don_hang}\n`
      out += `  Derived: ROAS/ROI ${roas} · CPC ${cpc.toLocaleString('vi-VN')} · CTR ${ctr}% · CR ${cr}% · CPM ${cpm.toLocaleString('vi-VN')}\n`
      out += `  Đề xuất tuần trước: ${prevSol('tiktok_pgm')}\n\n`
    }
    // LGM
    {
      const planGmv = pv(tiktokPlan, 't_lgm_doanhthu', w)
      const planCost = pv(tiktokPlan, 't_lgm_chi_phi', w)
      const prevGmv = num(prevWeekRow, 't_lgm_doanhthu')
      const roi =
        tiktokData.t_lgm_chi_phi > 0 ? (tiktokData.t_lgm_doanhthu / tiktokData.t_lgm_chi_phi).toFixed(2) : '—'
      out += `[Ads LGM]\n`
      out += `  Plan: GMV ${fmt(planGmv)} · Cost ${fmt(planCost)}\n`
      out += `  Actual: GMV ${fmt(tiktokData.t_lgm_doanhthu)} (${pctStr(tiktokData.t_lgm_doanhthu, planGmv)} plan, ${wowStr(tiktokData.t_lgm_doanhthu, prevGmv)}) · Cost ${fmt(tiktokData.t_lgm_chi_phi)}\n`
      out += `  Derived: ROI ${roi}\n`
      out += `  Đề xuất tuần trước: ${prevSol('tiktok_lgm')}\n\n`
    }
    // Consideration
    {
      const planNg = pv(tiktokPlan, 't_con_nguoi', w)
      const planCost = pv(tiktokPlan, 't_con_chi_phi', w)
      const cpa =
        tiktokData.t_con_nguoi > 0 ? Math.round(tiktokData.t_con_chi_phi / tiktokData.t_con_nguoi) : 0
      const hasAny = tiktokData.t_con_nguoi > 0 || tiktokData.t_con_chi_phi > 0
      out += `[Consideration_Ads]\n`
      out += `  Plan: Người ${fmt(planNg)} · Cost ${fmt(planCost)}\n`
      out += hasAny
        ? `  Actual: Số người ${fmt(tiktokData.t_con_nguoi)} · Cost ${fmt(tiktokData.t_con_chi_phi)} · CPA ${cpa.toLocaleString('vi-VN')}\n`
        : `  Actual: — (chưa có data, user nhập tay)\n`
      out += `  Đề xuất tuần trước: ${prevSol('tiktok_consideration')}\n\n`
    }
    // Branding
    {
      const planView = pv(tiktokPlan, 't_brd_view', w)
      const planFol = pv(tiktokPlan, 't_brd_follow', w)
      const planCost = pv(tiktokPlan, 't_brd_chi_phi', w)
      const cpa =
        tiktokData.t_brd_follow > 0 ? Math.round(tiktokData.t_brd_chi_phi / tiktokData.t_brd_follow) : 0
      const hasAny = tiktokData.t_brd_view > 0 || tiktokData.t_brd_follow > 0 || tiktokData.t_brd_chi_phi > 0
      out += `[Branding_Ads]\n`
      out += `  Plan: View ${fmt(planView)} · Follow ${fmt(planFol)} · Cost ${fmt(planCost)}\n`
      out += hasAny
        ? `  Actual: View ${fmt(tiktokData.t_brd_view)} · Follow ${fmt(tiktokData.t_brd_follow)} · Cost ${fmt(tiktokData.t_brd_chi_phi)} · CPA ${cpa.toLocaleString('vi-VN')}\n`
        : `  Actual: — (chưa có data, user nhập tay)\n`
      out += `  Đề xuất tuần trước: ${prevSol('tiktok_branding')}\n\n`
    }
  }

  // ── 5. WoW comparison (last 4 weeks if available) ──
  const recentWeeks = weekHistory
    .filter(r => parseInt(String(r.week_num)) <= w)
    .sort((a, b) => parseInt(String(a.week_num)) - parseInt(String(b.week_num)))
    .slice(-4)

  if (recentWeeks.length >= 2) {
    out += `=== WoW COMPARISON (${recentWeeks.length} tuần gần nhất) ===\n`
    for (const r of recentWeeks) {
      const wn = r.week_num
      const sGmv = num(r, 's_cpc_doanh_so') + num(r, 's_nd_gmv') + num(r, 's_live_gmv')
      const sCost = num(r, 's_cpc_chi_phi') + num(r, 's_nd_chi_phi') + num(r, 's_live_chi_phi')
      const tGmv = num(r, 't_pgm_doanh_so') + num(r, 't_lgm_doanhthu')
      const tCost = num(r, 't_pgm_chi_phi') + num(r, 't_lgm_chi_phi')
      out += `W${wn}: Shopee GMV ${fmt(sGmv)} / Cost ${fmt(sCost)} (ROAS ${sCost ? (sGmv / sCost).toFixed(2) : '—'}) · TikTok GMV ${fmt(tGmv)} / Cost ${fmt(tCost)} (ROI ${tCost ? (tGmv / tCost).toFixed(2) : '—'})\n`
    }
    out += `\n`
  }

  return out
}
