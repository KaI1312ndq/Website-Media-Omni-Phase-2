import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { notifyAdmins } from '@/lib/notify'

/* ── Plan metric keys (full 25 keys = same as actual) ── */
const SHOPEE_PLAN_KEYS = [
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
]
const TIKTOK_PLAN_KEYS = [
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
const ALL_PLAN_KEYS = [...SHOPEE_PLAN_KEYS, ...TIKTOK_PLAN_KEYS]
const PLAN_PERIODS = ['month', 'w1', 'w2', 'w3', 'w4', 'w5'] as const

/* Flat row → JSONB { metric: { w1, w2, ..., month } } filtered by platform */
function flatToJsonb(row: Record<string, unknown>, platform: string): Record<string, Record<string, number>> {
  const keys =
    platform === 'shopee' ? SHOPEE_PLAN_KEYS : platform === 'tiktok' ? TIKTOK_PLAN_KEYS : ALL_PLAN_KEYS
  const result: Record<string, Record<string, number>> = {}
  keys.forEach(k => {
    result[k] = {}
    PLAN_PERIODS.forEach(p => {
      const colName = `${k}__plan_${p}`
      result[k][p] = Number(row[colName]) || 0
    })
  })
  return result
}

/* JSONB → flat columns dict (for upsert) */
function jsonbToFlat(plan: Record<string, Record<string, number>>): Record<string, number> {
  const flat: Record<string, number> = {}
  Object.entries(plan || {}).forEach(([metric, periods]) => {
    if (!ALL_PLAN_KEYS.includes(metric)) return
    Object.entries(periods || {}).forEach(([period, val]) => {
      const sbPeriod = period === 'month' ? 'month' : period // 'w1'..'w5' or 'month'
      if (!PLAN_PERIODS.includes(sbPeriod as (typeof PLAN_PERIODS)[number])) return
      flat[`${metric}__plan_${sbPeriod}`] = Number(val) || 0
    })
  })
  return flat
}

/* ── GET ── */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action') || ''
  const brand = searchParams.get('brand') || ''
  const platform = searchParams.get('platform') || ''
  const month = parseInt(searchParams.get('month') || '0')
  const year = parseInt(searchParams.get('year') || '0')

  /* GET plan for a brand/platform/month/year (returns JSONB filtered by platform) */
  if (action === 'plan') {
    const { data, error } = await supabaseAdmin
      .from('monthly_plans')
      .select('*')
      .eq('brand_name', brand)
      .eq('month', month)
      .eq('year', year)
      .maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ data: null })
    return NextResponse.json({ data: flatToJsonb(data, platform) })
  }

  /* GET weekly history rows for a brand. If month+year given → that month only; else last 10 weeks across history */
  if (action === 'history') {
    if (month && year) {
      const { data, error } = await supabaseAdmin
        .from('weekly_reports')
        .select('*')
        .eq('brand_name', brand)
        .eq('month', month)
        .eq('year', year)
        .order('week_num', { ascending: true })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ data: data || [] })
    }
    // Broader history: last 10 weeks for chart
    const { data, error } = await supabaseAdmin
      .from('weekly_reports')
      .select('*')
      .eq('brand_name', brand)
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .order('week_num', { ascending: false })
      .limit(10)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: data || [] })
  }

  /* GET previous-week giai_phap per hạng mục (for AI closed-loop track) */
  if (action === 'previousSolutions') {
    const week = parseInt(searchParams.get('week') || '0')
    if (!brand || !month || !year || !week) {
      return NextResponse.json({ data: null })
    }
    // Find the most recent report BEFORE the current (year, month, week_num)
    // ordered lex on (year, month, week_num).
    const { data, error } = await supabaseAdmin
      .from('weekly_reports')
      .select(
        'year, month, week_num, s_cpc_giai_phap, s_nd_giai_phap, s_live_giai_phap, t_pgm_giai_phap, t_lgm_giai_phap, t_con_giai_phap, t_brd_giai_phap',
      )
      .eq('brand_name', brand)
      .or(
        `and(year.lt.${year}),and(year.eq.${year},month.lt.${month}),and(year.eq.${year},month.eq.${month},week_num.lt.${week})`,
      )
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .order('week_num', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error || !data) return NextResponse.json({ data: null })
    return NextResponse.json({
      data: {
        year: data.year,
        month: data.month,
        week: data.week_num,
        shopee_ads_cpc: data.s_cpc_giai_phap ?? '',
        shopee_ads_nd: data.s_nd_giai_phap ?? '',
        shopee_ads_live: data.s_live_giai_phap ?? '',
        tiktok_pgm: data.t_pgm_giai_phap ?? '',
        tiktok_lgm: data.t_lgm_giai_phap ?? '',
        tiktok_consideration: data.t_con_giai_phap ?? '',
        tiktok_branding: data.t_brd_giai_phap ?? '',
      },
    })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

/* ── POST ── */
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action } = body

  /* ── Save / upsert monthly plan (flat format, smart merge with existing row) ── */
  if (action === 'savePlan') {
    const { brand_name, month, year, plan_data, created_by } = body
    const flatUpdates = jsonbToFlat(plan_data)

    // Check if row exists for (username, brand_name, month, year)
    const { data: existing } = await supabaseAdmin
      .from('monthly_plans')
      .select('id')
      .eq('brand_name', brand_name)
      .eq('month', month)
      .eq('year', year)
      .maybeSingle()

    if (existing) {
      const { error } = await supabaseAdmin
        .from('monthly_plans')
        .update({ ...flatUpdates, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    } else {
      const { error } = await supabaseAdmin
        .from('monthly_plans')
        .insert({ username: created_by || null, brand_name, month, year, ...flatUpdates })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  }

  /* ── Save weekly report row (uses exact DB column names) ── */
  if (action === 'saveWeekly') {
    const {
      username,
      brand_name,
      month,
      year,
      week_num,
      week_start,
      week_end,
      // Shopee CPC
      s_cpc_doanh_so,
      s_cpc_chi_phi,
      s_cpc_luot_xem,
      s_cpc_luot_click,
      s_cpc_don_hang,
      // Shopee ND
      s_nd_gmv,
      s_nd_chi_phi,
      s_nd_luot_xem,
      s_nd_luot_click,
      // Shopee Live
      s_live_gmv,
      s_live_chi_phi,
      s_live_luot_xem,
      // TikTok PGM
      t_pgm_doanh_so,
      t_pgm_chi_phi,
      t_pgm_luot_xem,
      t_pgm_luot_click,
      t_pgm_don_hang,
      // TikTok LGM
      t_lgm_doanhthu,
      t_lgm_chi_phi,
      // TikTok Con
      t_con_nguoi,
      t_con_chi_phi,
      // TikTok Brand
      t_brd_view,
      t_brd_follow,
      t_brd_chi_phi,
      // Notes — V1 legacy
      highlight,
      lowlight,
      nhan_xet_thuc_trang,
      nhan_xet_van_de,
      nhan_xet_giai_phap,
      // V2 matrix (28 cells, all optional — written only if migration 05 applied)
      ai_matrix,
    } = body

    const baseRow: Record<string, unknown> = {
      username,
      brand_name,
      month,
      year,
      week_num,
      week_start: week_start || null,
      week_end: week_end || null,
      s_cpc_doanh_so: s_cpc_doanh_so || 0,
      s_cpc_chi_phi: s_cpc_chi_phi || 0,
      s_cpc_luot_xem: s_cpc_luot_xem || 0,
      s_cpc_luot_click: s_cpc_luot_click || 0,
      s_cpc_don_hang: s_cpc_don_hang || 0,
      s_nd_gmv: s_nd_gmv || 0,
      s_nd_chi_phi: s_nd_chi_phi || 0,
      s_nd_luot_xem: s_nd_luot_xem || 0,
      s_nd_luot_click: s_nd_luot_click || 0,
      s_live_gmv: s_live_gmv || 0,
      s_live_chi_phi: s_live_chi_phi || 0,
      s_live_luot_xem: s_live_luot_xem || 0,
      t_pgm_doanh_so: t_pgm_doanh_so || 0,
      t_pgm_chi_phi: t_pgm_chi_phi || 0,
      t_pgm_luot_xem: t_pgm_luot_xem || 0,
      t_pgm_luot_click: t_pgm_luot_click || 0,
      t_pgm_don_hang: t_pgm_don_hang || 0,
      t_lgm_doanhthu: t_lgm_doanhthu || 0,
      t_lgm_chi_phi: t_lgm_chi_phi || 0,
      t_con_nguoi: t_con_nguoi || 0,
      t_con_chi_phi: t_con_chi_phi || 0,
      t_brd_view: t_brd_view || 0,
      t_brd_follow: t_brd_follow || 0,
      t_brd_chi_phi: t_brd_chi_phi || 0,
      highlight: highlight || '',
      lowlight: lowlight || '',
      nhan_xet_thuc_trang: nhan_xet_thuc_trang || '',
      nhan_xet_van_de: nhan_xet_van_de || '',
      nhan_xet_giai_phap: nhan_xet_giai_phap || '',
    }

    // V2 matrix — write 28 cells if provided. Each entry: { plan, actual, danh_gia, giai_phap }
    if (ai_matrix && typeof ai_matrix === 'object') {
      const MATRIX_PREFIX: Record<string, string> = {
        shopee_ads_cpc: 's_cpc',
        shopee_ads_nd: 's_nd',
        shopee_ads_live: 's_live',
        tiktok_pgm: 't_pgm',
        tiktok_lgm: 't_lgm',
        tiktok_consideration: 't_con',
        tiktok_branding: 't_brd',
      }
      for (const [k, prefix] of Object.entries(MATRIX_PREFIX)) {
        const cell = (ai_matrix as Record<string, unknown>)[k]
        if (cell && typeof cell === 'object') {
          const c = cell as Record<string, unknown>
          baseRow[`${prefix}_plan`] = typeof c.plan === 'string' ? c.plan : ''
          baseRow[`${prefix}_actual`] = typeof c.actual === 'string' ? c.actual : ''
          baseRow[`${prefix}_danh_gia`] = typeof c.danh_gia === 'string' ? c.danh_gia : ''
          baseRow[`${prefix}_giai_phap`] = typeof c.giai_phap === 'string' ? c.giai_phap : ''
        }
      }
      baseRow.ai_schema_version = 2
    }

    const { error } = await supabaseAdmin
      .from('weekly_reports')
      .upsert(baseRow, { onConflict: 'username,brand_name,year,month,week_num' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Notify admins about new/updated weekly report
    await notifyAdmins({
      type: 'report_new',
      title: `Report mới — ${brand_name} W${week_num}`,
      body: `Tháng ${month}/${year} · by ${username || 'unknown'}`,
      link: `/hub/report?brand=${encodeURIComponent(brand_name || '')}`,
      icon: 'save',
      priority: 'normal',
    })

    return NextResponse.json({ ok: true })
  }

  /* ── AI analyze with DARA prompt ── */
  if (action === 'analyze') {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'No OPENAI_API_KEY' }, { status: 500 })

    const { dataForAI } = body
    const systemPrompt = `Bạn là chuyên gia phân tích hiệu suất quảng cáo Ecommerce tại Việt Nam.
Platform: TikTok Shop Ads và Shopee Ads (chỉ Marketplace).
Framework phân tích: DARA (Data → Analysis → Root cause → Action).

Phân tích dữ liệu sau và trả về JSON với các key:
- highlight: điểm tốt tuần này (2-3 bullet, tiếng Việt)
- lowlight: điểm cần cải thiện (2-3 bullet)
- shopee_thuc_trang: thực trạng Shopee (2-3 câu)
- shopee_van_de: vấn đề & root cause Shopee (2-3 câu)
- shopee_giai_phap: giải pháp & plan tuần tới Shopee (3-4 action cụ thể)
- tiktok_thuc_trang: thực trạng TikTok (2-3 câu)
- tiktok_van_de: vấn đề & root cause TikTok
- tiktok_giai_phap: giải pháp & plan tuần tới TikTok

Chỉ trả về JSON hợp lệ, không text khác.`

    const userPrompt = `DỮ LIỆU:\n${dataForAI}`

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 1500,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
      })
      const j = await res.json()
      const text: string = j.choices?.[0]?.message?.content || '{}'
      try {
        const parsed = JSON.parse(text)
        return NextResponse.json(parsed)
      } catch {
        return NextResponse.json({
          highlight: text.substring(0, 300),
          lowlight: '',
          shopee_thuc_trang: '',
          shopee_van_de: '',
          shopee_giai_phap: '',
          tiktok_thuc_trang: '',
          tiktok_van_de: '',
          tiktok_giai_phap: '',
        })
      }
    } catch (e) {
      return NextResponse.json({ error: String(e) }, { status: 500 })
    }
  }

  /* ── Add brand ── */
  if (action === 'addBrand') {
    const { brand_name } = body
    if (!brand_name) return NextResponse.json({ error: 'brand_name required' }, { status: 400 })
    const { error } = await supabaseAdmin.from('brands').insert({ brand_name })
    if (error && !error.message.includes('duplicate')) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
