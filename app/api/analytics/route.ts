import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromCookie, isAssignedTo, canSeeAllBrands } from '@/lib/session-server'

/* ── Metric helpers ── */
type Row = Record<string, number | string | null | undefined>

const SHOPEE_GMV = ['s_cpc_doanh_so', 's_nd_gmv', 's_live_gmv']
const TIKTOK_GMV = ['t_pgm_doanh_so', 't_lgm_doanhthu']
const ALL_GMV = [...SHOPEE_GMV, ...TIKTOK_GMV]

const SHOPEE_CP = ['s_cpc_chi_phi', 's_nd_chi_phi', 's_live_chi_phi']
const TIKTOK_CP = ['t_pgm_chi_phi', 't_lgm_chi_phi', 't_con_chi_phi', 't_brd_chi_phi']
const ALL_CP = [...SHOPEE_CP, ...TIKTOK_CP]

function num(v: unknown): number {
  const n = Number(v)
  return isNaN(n) ? 0 : n
}
function sumKeys(row: Row | undefined | null, keys: string[]): number {
  if (!row) return 0
  return keys.reduce((a, k) => a + num(row[k]), 0)
}
function gmvOf(row: Row, platform: 'all' | 'shopee' | 'tiktok' = 'all'): number {
  return sumKeys(row, platform === 'shopee' ? SHOPEE_GMV : platform === 'tiktok' ? TIKTOK_GMV : ALL_GMV)
}
function cpOf(row: Row, platform: 'all' | 'shopee' | 'tiktok' = 'all'): number {
  return sumKeys(row, platform === 'shopee' ? SHOPEE_CP : platform === 'tiktok' ? TIKTOK_CP : ALL_CP)
}

/* Plan total (month) for a row from monthly_plans (flat columns: <metric>__plan_month). */
function planGmvMonth(row: Row): number {
  return ALL_GMV.reduce((a, k) => a + num(row[`${k}__plan_month`]), 0)
}
function planCpMonth(row: Row): number {
  return ALL_CP.reduce((a, k) => a + num(row[`${k}__plan_month`]), 0)
}

/* Permission-aware brand list. Returns brand_names this session may access. */
async function allowedBrandNames(): Promise<{ ok: boolean; names: string[]; isAdmin: boolean; username: string | null }> {
  const session = await getSessionFromCookie()
  const { data, error } = await supabaseAdmin.from('brands').select('brand_name, assigned_members, active').eq('active', true)
  if (error) return { ok: false, names: [], isAdmin: false, username: null }
  const all = (data || []).map(b => ({ name: String(b.brand_name), assigned: String(b.assigned_members || '') }))
  if (!session) return { ok: true, names: [], isAdmin: false, username: null }
  if (canSeeAllBrands(session)) return { ok: true, names: all.map(b => b.name), isAdmin: true, username: session.username }
  return {
    ok: true,
    names: all.filter(b => isAssignedTo(b.assigned, session.username)).map(b => b.name),
    isAdmin: false,
    username: session.username,
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action') || ''

  /* ─ list brands user can access ─ */
  if (action === 'brands') {
    const { names } = await allowedBrandNames()
    return NextResponse.json({ data: names })
  }

  /* ─ Summary: per-brand totals for given month + MoM deltas ─ */
  if (action === 'summary') {
    const month = parseInt(searchParams.get('month') || '0')
    const year = parseInt(searchParams.get('year') || '0')
    if (!month || !year) return NextResponse.json({ error: 'month/year required' }, { status: 400 })
    const platform = (searchParams.get('platform') || 'all') as 'all' | 'shopee' | 'tiktok'

    const { names } = await allowedBrandNames()
    if (!names.length) return NextResponse.json({ data: { brands: [], totals: null, prevTotals: null } })

    // Previous month for MoM
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year

    const [{ data: cur }, { data: prev }, { data: plans }] = await Promise.all([
      supabaseAdmin.from('weekly_reports').select('*').in('brand_name', names).eq('month', month).eq('year', year),
      supabaseAdmin.from('weekly_reports').select('*').in('brand_name', names).eq('month', prevMonth).eq('year', prevYear),
      supabaseAdmin.from('monthly_plans').select('*').in('brand_name', names).eq('month', month).eq('year', year),
    ])

    const planByBrand: Record<string, Row> = {}
    ;(plans || []).forEach(p => { planByBrand[String(p.brand_name)] = p as Row })

    const aggregate = (rows: Row[] | null) => {
      const map: Record<string, { gmv: number; cp: number; weeks: number }> = {}
      ;(rows || []).forEach(r => {
        const b = String(r.brand_name)
        if (!map[b]) map[b] = { gmv: 0, cp: 0, weeks: 0 }
        map[b].gmv += gmvOf(r, platform)
        map[b].cp += cpOf(r, platform)
        map[b].weeks += 1
      })
      return map
    }

    const curMap = aggregate(cur)
    const prevMap = aggregate(prev)

    const brandsOut = names.map(b => {
      const cm = curMap[b] || { gmv: 0, cp: 0, weeks: 0 }
      const pm = prevMap[b] || { gmv: 0, cp: 0, weeks: 0 }
      const plan = planByBrand[b]
      const planGmv = plan ? planGmvMonth(plan) : 0
      const planCp = plan ? planCpMonth(plan) : 0
      const roas = cm.cp > 0 ? cm.gmv / cm.cp : 0
      const prevRoas = pm.cp > 0 ? pm.gmv / pm.cp : 0
      return {
        brand: b,
        gmv: cm.gmv,
        cp: cm.cp,
        roas,
        planGmv,
        planCp,
        pctGmv: planGmv > 0 ? (cm.gmv / planGmv) * 100 : null,
        pctCp: planCp > 0 ? (cm.cp / planCp) * 100 : null,
        prevGmv: pm.gmv,
        prevCp: pm.cp,
        prevRoas,
        weeksReported: cm.weeks,
      }
    }).sort((a, b) => b.gmv - a.gmv)

    const totals = {
      gmv: brandsOut.reduce((a, b) => a + b.gmv, 0),
      cp: brandsOut.reduce((a, b) => a + b.cp, 0),
      activeBrands: brandsOut.filter(b => b.weeksReported > 0).length,
      get roas() { return this.cp > 0 ? this.gmv / this.cp : 0 },
    }
    const totalsObj = { gmv: totals.gmv, cp: totals.cp, activeBrands: totals.activeBrands, roas: totals.roas }

    const prevGmvSum = brandsOut.reduce((a, b) => a + b.prevGmv, 0)
    const prevCpSum = brandsOut.reduce((a, b) => a + b.prevCp, 0)
    const prevRoasAvg = prevCpSum > 0 ? prevGmvSum / prevCpSum : 0
    const prevActive = Object.keys(prevMap).filter(b => prevMap[b].weeks > 0).length
    const prevTotals = { gmv: prevGmvSum, cp: prevCpSum, roas: prevRoasAvg, activeBrands: prevActive }

    return NextResponse.json({ data: { brands: brandsOut, totals: totalsObj, prevTotals } })
  }

  /* ─ Brand detail: weekly rows + plan rows across a date range ─ */
  if (action === 'brand-detail') {
    const brand = searchParams.get('brand') || ''
    const fromMonth = parseInt(searchParams.get('fromMonth') || '0')
    const fromYear = parseInt(searchParams.get('fromYear') || '0')
    const toMonth = parseInt(searchParams.get('toMonth') || '0')
    const toYear = parseInt(searchParams.get('toYear') || '0')
    if (!brand || !fromMonth || !fromYear || !toMonth || !toYear) {
      return NextResponse.json({ error: 'brand + range required' }, { status: 400 })
    }
    const { names, isAdmin } = await allowedBrandNames()
    if (!isAdmin && !names.includes(brand)) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }
    const fromKey = fromYear * 100 + fromMonth
    const toKey = toYear * 100 + toMonth

    const { data: weekly } = await supabaseAdmin
      .from('weekly_reports').select('*').eq('brand_name', brand)
    const { data: plans } = await supabaseAdmin
      .from('monthly_plans').select('*').eq('brand_name', brand)

    const inRange = (m: number, y: number) => {
      const k = y * 100 + m
      return k >= fromKey && k <= toKey
    }
    const weeklyOut = (weekly || []).filter(r => inRange(Number(r.month), Number(r.year)))
      .sort((a, b) => (Number(a.year) - Number(b.year)) || (Number(a.month) - Number(b.month)) || (Number(a.week_num) - Number(b.week_num)))
    const plansOut = (plans || []).filter(r => inRange(Number(r.month), Number(r.year)))
      .sort((a, b) => (Number(a.year) - Number(b.year)) || (Number(a.month) - Number(b.month)))

    return NextResponse.json({ data: { weekly: weeklyOut, plans: plansOut } })
  }

  /* ─ Compare: same month, multiple brands, weekly breakdown ─ */
  if (action === 'compare') {
    const month = parseInt(searchParams.get('month') || '0')
    const year = parseInt(searchParams.get('year') || '0')
    const brandsParam = (searchParams.get('brands') || '').split(',').map(s => s.trim()).filter(Boolean)
    if (!month || !year || !brandsParam.length) return NextResponse.json({ error: 'month/year/brands required' }, { status: 400 })
    const { names, isAdmin } = await allowedBrandNames()
    const allowed = isAdmin ? brandsParam : brandsParam.filter(b => names.includes(b))
    if (!allowed.length) return NextResponse.json({ data: [] })

    const { data: weekly } = await supabaseAdmin
      .from('weekly_reports').select('*').in('brand_name', allowed).eq('month', month).eq('year', year)
    const { data: plans } = await supabaseAdmin
      .from('monthly_plans').select('*').in('brand_name', allowed).eq('month', month).eq('year', year)

    return NextResponse.json({ data: { weekly: weekly || [], plans: plans || [] } })
  }

  /* ─ Trend: 12-month back, weekly aggregation per brand ─ */
  if (action === 'trend') {
    const month = parseInt(searchParams.get('month') || '0')
    const year = parseInt(searchParams.get('year') || '0')
    const brandsParam = (searchParams.get('brands') || '').split(',').map(s => s.trim()).filter(Boolean)
    if (!month || !year) return NextResponse.json({ error: 'month/year required' }, { status: 400 })

    const { names, isAdmin } = await allowedBrandNames()
    const target = brandsParam.length
      ? (isAdmin ? brandsParam : brandsParam.filter(b => names.includes(b)))
      : names
    if (!target.length) return NextResponse.json({ data: { months: [], series: {} } })

    // Build last 12 months list
    const months: { m: number; y: number; key: string }[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1)
      months.push({ m: d.getMonth() + 1, y: d.getFullYear(), key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` })
    }
    const minKey = months[0].y * 100 + months[0].m
    const maxKey = months[11].y * 100 + months[11].m

    const { data: weekly } = await supabaseAdmin
      .from('weekly_reports').select('*').in('brand_name', target)

    const series: Record<string, { gmv: number[]; cp: number[]; roas: number[] }> = {}
    target.forEach(b => series[b] = { gmv: Array(12).fill(0), cp: Array(12).fill(0), roas: Array(12).fill(0) })
    ;(weekly || []).forEach(r => {
      const k = Number(r.year) * 100 + Number(r.month)
      if (k < minKey || k > maxKey) return
      const idx = months.findIndex(mm => mm.m === Number(r.month) && mm.y === Number(r.year))
      if (idx < 0) return
      const b = String(r.brand_name)
      if (!series[b]) return
      series[b].gmv[idx] += gmvOf(r as Row)
      series[b].cp[idx] += cpOf(r as Row)
    })
    Object.keys(series).forEach(b => {
      for (let i = 0; i < 12; i++) {
        const cp = series[b].cp[i]
        series[b].roas[i] = cp > 0 ? series[b].gmv[i] / cp : 0
      }
    })

    return NextResponse.json({ data: { months: months.map(m => m.key), series } })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
