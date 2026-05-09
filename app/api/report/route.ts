import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/* ── GET ── */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action    = searchParams.get('action') || ''
  const brand     = searchParams.get('brand') || ''
  const platform  = searchParams.get('platform') || ''
  const month     = parseInt(searchParams.get('month') || '0')
  const year      = parseInt(searchParams.get('year') || '0')

  /* GET plan for a brand/platform/month/year */
  if (action === 'plan') {
    const { data, error } = await supabaseAdmin
      .from('monthly_plans')
      .select('plan_data')
      .eq('brand_name', brand)
      .eq('platform', platform)
      .eq('month', month)
      .eq('year', year)
      .maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: data?.plan_data || null })
  }

  /* GET weekly history rows for a brand/platform in a month */
  if (action === 'history') {
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

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

/* ── POST ── */
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action } = body

  /* ── Save / upsert monthly plan ── */
  if (action === 'savePlan') {
    const { brand_name, platform, month, year, plan_data, created_by } = body
    const { error } = await supabaseAdmin
      .from('monthly_plans')
      .upsert(
        { brand_name, platform, month, year, plan_data, created_by, updated_at: new Date().toISOString() },
        { onConflict: 'brand_name,platform,month,year' }
      )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  /* ── Save weekly report row (uses exact DB column names) ── */
  if (action === 'saveWeekly') {
    const {
      username, brand_name, month, year, week_num, week_start, week_end,
      // Shopee CPC
      s_cpc_doanh_so, s_cpc_chi_phi, s_cpc_luot_xem, s_cpc_luot_click, s_cpc_don_hang,
      // Shopee ND
      s_nd_gmv, s_nd_chi_phi, s_nd_luot_xem, s_nd_luot_click,
      // Shopee Live
      s_live_gmv, s_live_chi_phi, s_live_luot_xem,
      // TikTok PGM
      t_pgm_doanh_so, t_pgm_chi_phi, t_pgm_luot_xem, t_pgm_luot_click, t_pgm_don_hang,
      // TikTok LGM
      t_lgm_doanhthu, t_lgm_chi_phi,
      // TikTok Con
      t_con_nguoi, t_con_chi_phi,
      // TikTok Brand
      t_brd_view, t_brd_follow, t_brd_chi_phi,
      // Notes
      highlight, lowlight,
      nhan_xet_thuc_trang, nhan_xet_van_de, nhan_xet_giai_phap,
    } = body

    const { error } = await supabaseAdmin
      .from('weekly_reports')
      .upsert({
        username, brand_name, month, year, week_num,
        week_start: week_start || null,
        week_end: week_end || null,
        s_cpc_doanh_so:   s_cpc_doanh_so   || 0,
        s_cpc_chi_phi:    s_cpc_chi_phi    || 0,
        s_cpc_luot_xem:   s_cpc_luot_xem   || 0,
        s_cpc_luot_click: s_cpc_luot_click || 0,
        s_cpc_don_hang:   s_cpc_don_hang   || 0,
        s_nd_gmv:         s_nd_gmv         || 0,
        s_nd_chi_phi:     s_nd_chi_phi     || 0,
        s_nd_luot_xem:    s_nd_luot_xem    || 0,
        s_nd_luot_click:  s_nd_luot_click  || 0,
        s_live_gmv:       s_live_gmv       || 0,
        s_live_chi_phi:   s_live_chi_phi   || 0,
        s_live_luot_xem:  s_live_luot_xem  || 0,
        t_pgm_doanh_so:   t_pgm_doanh_so   || 0,
        t_pgm_chi_phi:    t_pgm_chi_phi    || 0,
        t_pgm_luot_xem:   t_pgm_luot_xem   || 0,
        t_pgm_luot_click: t_pgm_luot_click || 0,
        t_pgm_don_hang:   t_pgm_don_hang   || 0,
        t_lgm_doanhthu:   t_lgm_doanhthu   || 0,
        t_lgm_chi_phi:    t_lgm_chi_phi    || 0,
        t_con_nguoi:      t_con_nguoi      || 0,
        t_con_chi_phi:    t_con_chi_phi    || 0,
        t_brd_view:       t_brd_view       || 0,
        t_brd_follow:     t_brd_follow     || 0,
        t_brd_chi_phi:    t_brd_chi_phi    || 0,
        highlight:        highlight        || '',
        lowlight:         lowlight         || '',
        nhan_xet_thuc_trang: nhan_xet_thuc_trang || '',
        nhan_xet_van_de:     nhan_xet_van_de     || '',
        nhan_xet_giai_phap:  nhan_xet_giai_phap  || '',
      }, { onConflict: 'username,brand_name,year,month,week_num' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
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
          'Authorization': `Bearer ${apiKey}`,
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
    const { error } = await supabaseAdmin
      .from('brands')
      .insert({ brand_name })
    if (error && !error.message.includes('duplicate')) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
