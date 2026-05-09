import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const GAS_URL = 'https://script.google.com/macros/s/AKfycbyRNS6gon5Nyn0Bt9vLpGmbdCJ13gTE8jgz_mhrRYunybgxDdwkcON_bP7SfIHtIL8J/exec'

/* GAS plan key → Supabase plan key mapping */
const W_MAP: Record<string, string> = {
  plan_month: 'month',
  plan_w1: 'w1',
  plan_w2: 'w2',
  plan_w3: 'w3',
  plan_w4: 'w4',
  plan_w5: 'w5',
}

const SHOPEE_KEYS = [
  's_cpc_doanh_so','s_cpc_chi_phi','s_cpc_luot_xem','s_cpc_luot_click','s_cpc_don_hang',
  's_nd_gmv','s_nd_chi_phi','s_nd_luot_xem','s_nd_luot_click',
  's_live_gmv','s_live_chi_phi','s_live_luot_xem',
]
const TIKTOK_KEYS = [
  't_pgm_doanh_so','t_pgm_chi_phi','t_pgm_luot_xem','t_pgm_luot_click','t_pgm_don_hang',
  't_lgm_doanhthu','t_lgm_chi_phi',
  't_con_nguoi','t_con_chi_phi',
  't_brd_view','t_brd_follow','t_brd_chi_phi',
]

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action } = body

  /* ── Fetch brands from GAS ── */
  if (action === 'fetchGASBrands') {
    try {
      const res = await fetch(`${GAS_URL}?action=getBrands`)
      const j = await res.json()
      return NextResponse.json({ ok: true, brands: j.data || [] })
    } catch (e) {
      return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
    }
  }

  /* ── Delete seed brands + import real brands ── */
  if (action === 'importBrands') {
    const { brands } = body as { brands: string[] }
    if (!brands?.length) return NextResponse.json({ ok: false, error: 'No brands' }, { status: 400 })

    // Delete all existing brands first
    const { error: delErr } = await supabaseAdmin.from('brands').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (delErr) return NextResponse.json({ ok: false, error: delErr.message }, { status: 500 })

    // Insert new brands
    const rows = brands.map((b: string) => ({ brand_name: b }))
    const { error: insErr } = await supabaseAdmin.from('brands').insert(rows)
    if (insErr) return NextResponse.json({ ok: false, error: insErr.message }, { status: 500 })
    return NextResponse.json({ ok: true, count: brands.length })
  }

  /* ── Migrate weekly data for brand + month + year ── */
  if (action === 'migrateWeekly') {
    const { brand, month, year } = body
    try {
      const url = `${GAS_URL}?action=getWeeklyHistory&brand_name=${encodeURIComponent(brand)}&month=${month}&year=${year}`
      const res = await fetch(url)
      const j = await res.json()
      const rows: Record<string, unknown>[] = j.data || []
      if (!rows.length) return NextResponse.json({ ok: true, count: 0 })

      // Upsert each row
      const toInsert = rows.map((r: Record<string, unknown>) => ({
        username:    r.username    || '',
        brand_name:  r.brand_name  || brand,
        month:       parseInt(String(r.month))  || month,
        year:        parseInt(String(r.year))   || year,
        week_num:    parseInt(String(r.week_num)) || 0,
        week_start:  r.week_start  || null,
        week_end:    r.week_end    || null,
        s_cpc_doanh_so:   parseFloat(String(r.s_cpc_doanh_so))   || 0,
        s_cpc_chi_phi:    parseFloat(String(r.s_cpc_chi_phi))    || 0,
        s_cpc_luot_xem:   parseFloat(String(r.s_cpc_luot_xem))   || 0,
        s_cpc_luot_click: parseFloat(String(r.s_cpc_luot_click)) || 0,
        s_cpc_don_hang:   parseFloat(String(r.s_cpc_don_hang))   || 0,
        s_nd_gmv:         parseFloat(String(r.s_nd_gmv))         || 0,
        s_nd_chi_phi:     parseFloat(String(r.s_nd_chi_phi))     || 0,
        s_nd_luot_xem:    parseFloat(String(r.s_nd_luot_xem))    || 0,
        s_nd_luot_click:  parseFloat(String(r.s_nd_luot_click))  || 0,
        s_live_gmv:       parseFloat(String(r.s_live_gmv))       || 0,
        s_live_chi_phi:   parseFloat(String(r.s_live_chi_phi))   || 0,
        s_live_luot_xem:  parseFloat(String(r.s_live_luot_xem))  || 0,
        t_pgm_doanh_so:   parseFloat(String(r.t_pgm_doanh_so))   || 0,
        t_pgm_chi_phi:    parseFloat(String(r.t_pgm_chi_phi))    || 0,
        t_pgm_luot_xem:   parseFloat(String(r.t_pgm_luot_xem))   || 0,
        t_pgm_luot_click: parseFloat(String(r.t_pgm_luot_click)) || 0,
        t_pgm_don_hang:   parseFloat(String(r.t_pgm_don_hang))   || 0,
        t_lgm_doanhthu:   parseFloat(String(r.t_lgm_doanhthu))   || 0,
        t_lgm_chi_phi:    parseFloat(String(r.t_lgm_chi_phi))    || 0,
        t_con_nguoi:      parseFloat(String(r.t_con_nguoi))      || 0,
        t_con_chi_phi:    parseFloat(String(r.t_con_chi_phi))    || 0,
        t_brd_view:       parseFloat(String(r.t_brd_view))       || 0,
        t_brd_follow:     parseFloat(String(r.t_brd_follow))     || 0,
        t_brd_chi_phi:    parseFloat(String(r.t_brd_chi_phi))    || 0,
        highlight:        String(r.highlight        || ''),
        lowlight:         String(r.lowlight         || ''),
        nhan_xet_thuc_trang: String(r.nhan_xet_thuc_trang || ''),
        nhan_xet_van_de:     String(r.nhan_xet_van_de     || ''),
        nhan_xet_giai_phap:  String(r.nhan_xet_giai_phap  || ''),
      }))

      const { error } = await supabaseAdmin
        .from('weekly_reports')
        .upsert(toInsert, { onConflict: 'username,brand_name,year,month,week_num' })
      if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true, count: toInsert.length })
    } catch (e) {
      return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
    }
  }

  /* ── Migrate plan data for brand + month + year ── */
  if (action === 'migratePlan') {
    const { brand, month, year } = body
    try {
      const url = `${GAS_URL}?action=getPlan&brand_name=${encodeURIComponent(brand)}&month=${month}&year=${year}`
      const res = await fetch(url)
      const j = await res.json()
      const gasPlan: Record<string, Record<string, number>> | null = j.data || null
      if (!gasPlan) return NextResponse.json({ ok: true, count: 0 })

      // Transform GAS plan format → Supabase plan format
      // GAS: { s_cpc_doanh_so: { plan_w1: 100, plan_month: 200, ... }, ... }
      // Supabase: { s_cpc_doanh_so: { w1: 100, month: 200, ... }, ... } per platform
      const transformPlan = (keys: string[]) => {
        const pd: Record<string, Record<string, number>> = {}
        keys.forEach(k => {
          if (gasPlan[k]) {
            pd[k] = {}
            Object.entries(gasPlan[k]).forEach(([gasW, val]) => {
              const sbW = W_MAP[gasW]
              if (sbW) pd[k][sbW] = val
            })
          }
        })
        return pd
      }

      const shopeePlan = transformPlan(SHOPEE_KEYS)
      const tiktokPlan = transformPlan(TIKTOK_KEYS)
      let count = 0

      // Check if shopee plan has any data
      const hasShopee = Object.values(shopeePlan).some(v => Object.values(v).some(n => n > 0))
      const hasTiktok = Object.values(tiktokPlan).some(v => Object.values(v).some(n => n > 0))

      if (hasShopee) {
        const { error } = await supabaseAdmin.from('monthly_plans').upsert({
          brand_name: brand, platform: 'shopee', month, year,
          plan_data: shopeePlan, updated_at: new Date().toISOString()
        }, { onConflict: 'brand_name,platform,month,year' })
        if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
        count++
      }
      if (hasTiktok) {
        const { error } = await supabaseAdmin.from('monthly_plans').upsert({
          brand_name: brand, platform: 'tiktok', month, year,
          plan_data: tiktokPlan, updated_at: new Date().toISOString()
        }, { onConflict: 'brand_name,platform,month,year' })
        if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
        count++
      }
      return NextResponse.json({ ok: true, count })
    } catch (e) {
      return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 })
}
