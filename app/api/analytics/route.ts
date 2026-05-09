import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSessionFromCookie, isAssignedTo, canSeeAllBrands } from '@/lib/session-server'

/* ── Metric helpers ── */
type Row = Record<string, number | string | null | undefined>

/* All 25 metric keys, split per platform */
const SHOPEE_KEYS = [
  's_cpc_doanh_so', 's_cpc_chi_phi', 's_cpc_luot_xem', 's_cpc_luot_click', 's_cpc_don_hang',
  's_nd_gmv', 's_nd_chi_phi', 's_nd_luot_xem', 's_nd_luot_click',
  's_live_gmv', 's_live_chi_phi', 's_live_luot_xem',
]
const TIKTOK_KEYS = [
  't_pgm_doanh_so', 't_pgm_chi_phi', 't_pgm_luot_xem', 't_pgm_luot_click', 't_pgm_don_hang',
  't_lgm_doanhthu', 't_lgm_chi_phi',
  't_con_nguoi', 't_con_chi_phi',
  't_brd_view', 't_brd_follow', 't_brd_chi_phi',
]
const ALL_KEYS = [...SHOPEE_KEYS, ...TIKTOK_KEYS]
const PLAN_PERIODS = ['plan_month', 'plan_w1', 'plan_w2', 'plan_w3', 'plan_w4', 'plan_w5']

const SHOPEE_GMV = ['s_cpc_doanh_so', 's_nd_gmv', 's_live_gmv']
const TIKTOK_GMV = ['t_pgm_doanh_so', 't_lgm_doanhthu']
const ALL_GMV = [...SHOPEE_GMV, ...TIKTOK_GMV]
const SHOPEE_CP = ['s_cpc_chi_phi', 's_nd_chi_phi', 's_live_chi_phi']
const TIKTOK_CP = ['t_pgm_chi_phi', 't_lgm_chi_phi', 't_con_chi_phi', 't_brd_chi_phi']
const ALL_CP = [...SHOPEE_CP, ...TIKTOK_CP]

/* PGM/CPC/ND engagement triplets to flag inconsistency
   (when cost+revenue > 0, these three engagement fields must be > 0) */
const CONSISTENCY_GROUPS: { prefix: string; label: string; cost: string; rev: string; engagement: string[] }[] = [
  { prefix: 's_cpc', label: 'Shopee CPC', cost: 's_cpc_chi_phi', rev: 's_cpc_doanh_so',
    engagement: ['s_cpc_luot_xem', 's_cpc_luot_click', 's_cpc_don_hang'] },
  { prefix: 's_nd', label: 'Shopee ND', cost: 's_nd_chi_phi', rev: 's_nd_gmv',
    engagement: ['s_nd_luot_xem', 's_nd_luot_click'] },
  { prefix: 't_pgm', label: 'TikTok PGM', cost: 't_pgm_chi_phi', rev: 't_pgm_doanh_so',
    engagement: ['t_pgm_luot_xem', 't_pgm_luot_click', 't_pgm_don_hang'] },
]

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
function planGmvMonth(row: Row): number { return ALL_GMV.reduce((a, k) => a + num(row[`${k}__plan_month`]), 0) }
function planCpMonth(row: Row): number { return ALL_CP.reduce((a, k) => a + num(row[`${k}__plan_month`]), 0) }

/* Count plan field fill-rate. Only counts cols > 0. */
function planFillPct(row: Row | undefined | null, keys: string[]): { pct: number; missing: string[] } {
  if (!row) return { pct: 0, missing: keys }
  let filled = 0
  const total = keys.length * PLAN_PERIODS.length
  const missingKeySet = new Set<string>()
  for (const k of keys) {
    let keyHasAny = false
    for (const p of PLAN_PERIODS) {
      if (num(row[`${k}__${p}`]) > 0) { filled += 1; keyHasAny = true }
    }
    if (!keyHasAny) missingKeySet.add(k)
  }
  return { pct: total > 0 ? (filled / total) * 100 : 0, missing: Array.from(missingKeySet) }
}

/* Permission-aware brand list. */
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

  /* ─ Summary: per-brand totals split into shopee/tiktok ─ */
  if (action === 'summary') {
    const month = parseInt(searchParams.get('month') || '0')
    const year = parseInt(searchParams.get('year') || '0')
    if (!month || !year) return NextResponse.json({ error: 'month/year required' }, { status: 400 })
    const brandsParam = (searchParams.get('brands') || '').split(',').map(s => s.trim()).filter(Boolean)

    const { names } = await allowedBrandNames()
    const target = brandsParam.length ? names.filter(n => brandsParam.includes(n)) : names
    if (!target.length) return NextResponse.json({ data: { shopee: [], tiktok: [], totals: { shopee: null, tiktok: null } } })

    const [{ data: cur }, { data: plans }] = await Promise.all([
      supabaseAdmin.from('weekly_reports').select('*').in('brand_name', target).eq('month', month).eq('year', year),
      supabaseAdmin.from('monthly_plans').select('*').in('brand_name', target).eq('month', month).eq('year', year),
    ])

    const planByBrand: Record<string, Row> = {}
    ;(plans || []).forEach(p => { planByBrand[String(p.brand_name)] = p as Row })

    const aggregate = (platform: 'shopee' | 'tiktok') => {
      const map: Record<string, { gmv: number; cp: number; weeks: number; lastWeekEnd: string | null }> = {}
      ;(cur || []).forEach(r => {
        const b = String(r.brand_name)
        if (!map[b]) map[b] = { gmv: 0, cp: 0, weeks: 0, lastWeekEnd: null }
        map[b].gmv += gmvOf(r as Row, platform)
        map[b].cp += cpOf(r as Row, platform)
        map[b].weeks += 1
        const we = r.week_end ? String(r.week_end) : null
        if (we && (!map[b].lastWeekEnd || we > map[b].lastWeekEnd!)) map[b].lastWeekEnd = we
      })
      return map
    }

    const buildRows = (platform: 'shopee' | 'tiktok') => {
      const planKeys = platform === 'shopee' ? SHOPEE_GMV : TIKTOK_GMV
      const cpKeys = platform === 'shopee' ? SHOPEE_CP : TIKTOK_CP
      const m = aggregate(platform)
      return target.map(b => {
        const c = m[b] || { gmv: 0, cp: 0, weeks: 0, lastWeekEnd: null }
        const plan = planByBrand[b]
        const planGmv = plan ? planKeys.reduce((a, k) => a + num(plan[`${k}__plan_month`]), 0) : 0
        const planCp = plan ? cpKeys.reduce((a, k) => a + num(plan[`${k}__plan_month`]), 0) : 0
        const roas = c.cp > 0 ? c.gmv / c.cp : 0
        return {
          brand: b,
          gmv: c.gmv,
          cp: c.cp,
          roas,
          planGmv,
          planCp,
          pctGmv: planGmv > 0 ? (c.gmv / planGmv) * 100 : null,
          pctCp: planCp > 0 ? (c.cp / planCp) * 100 : null,
          weeksReported: c.weeks,
          lastWeekEnd: c.lastWeekEnd,
        }
      })
    }

    const shopee = buildRows('shopee')
    const tiktok = buildRows('tiktok')
    const totals = {
      shopee: {
        gmv: shopee.reduce((a, b) => a + b.gmv, 0),
        cp: shopee.reduce((a, b) => a + b.cp, 0),
        activeBrands: shopee.filter(b => b.weeksReported > 0).length,
        get roas() { return this.cp > 0 ? this.gmv / this.cp : 0 },
      },
      tiktok: {
        gmv: tiktok.reduce((a, b) => a + b.gmv, 0),
        cp: tiktok.reduce((a, b) => a + b.cp, 0),
        activeBrands: tiktok.filter(b => b.weeksReported > 0).length,
        get roas() { return this.cp > 0 ? this.gmv / this.cp : 0 },
      },
    }
    const totalsObj = {
      shopee: { gmv: totals.shopee.gmv, cp: totals.shopee.cp, roas: totals.shopee.roas, activeBrands: totals.shopee.activeBrands },
      tiktok: { gmv: totals.tiktok.gmv, cp: totals.tiktok.cp, roas: totals.tiktok.roas, activeBrands: totals.tiktok.activeBrands },
    }

    return NextResponse.json({ data: { shopee, tiktok, totals: totalsObj } })
  }

  /* ─ Coverage: plan + report completeness, consistency, timing ─ */
  if (action === 'coverage') {
    const month = parseInt(searchParams.get('month') || '0')
    const year = parseInt(searchParams.get('year') || '0')
    if (!month || !year) return NextResponse.json({ error: 'month/year required' }, { status: 400 })
    const brandsParam = (searchParams.get('brands') || '').split(',').map(s => s.trim()).filter(Boolean)

    const { names } = await allowedBrandNames()
    const target = brandsParam.length ? names.filter(n => brandsParam.includes(n)) : names
    if (!target.length) {
      return NextResponse.json({ data: { plans: [], reports: [], consistency: [], timing: [], daily_cadence: [], summary: null } })
    }

    const [{ data: weekly }, { data: plans }] = await Promise.all([
      supabaseAdmin.from('weekly_reports').select('*').in('brand_name', target).eq('month', month).eq('year', year),
      supabaseAdmin.from('monthly_plans').select('*').in('brand_name', target).eq('month', month).eq('year', year),
    ])

    const planByBrand: Record<string, Row> = {}
    ;(plans || []).forEach(p => { planByBrand[String(p.brand_name)] = p as Row })

    /* Plan completeness rows */
    const planRows = target.map(b => {
      const p = planByBrand[b]
      const sh = planFillPct(p, SHOPEE_KEYS)
      const tk = planFillPct(p, TIKTOK_KEYS)
      const all = planFillPct(p, ALL_KEYS)
      return {
        brand_name: b,
        has_plan: !!p,
        shopee_pct: sh.pct,
        tiktok_pct: tk.pct,
        overall_pct: all.pct,
        missing_keys: all.missing,
      }
    })

    const brandsWithPlan = planRows.filter(r => r.has_plan).length
    const brandsWithoutPlan = target.length - brandsWithPlan
    const avgFillPct = planRows.length > 0
      ? planRows.reduce((a, r) => a + r.overall_pct, 0) / planRows.length
      : 0

    /* Report completeness — group weekly rows by (brand, week_num) */
    const weeksPresent: Record<string, Set<number>> = {}
    const weekDetail: Record<string, Record<number, { username: string; created_at: string; week_end: string | null; has_data: boolean }[]>> = {}
    const delaysByBrand: Record<string, number[]> = {}
    ;(weekly || []).forEach(r => {
      const b = String(r.brand_name)
      const w = Number(r.week_num)
      if (!weeksPresent[b]) weeksPresent[b] = new Set()
      weeksPresent[b].add(w)
      if (!weekDetail[b]) weekDetail[b] = {}
      if (!weekDetail[b][w]) weekDetail[b][w] = []
      const hasData = ALL_GMV.some(k => num((r as Row)[k]) > 0) || ALL_CP.some(k => num((r as Row)[k]) > 0)
      weekDetail[b][w].push({
        username: String(r.username || ''),
        created_at: String(r.created_at || ''),
        week_end: r.week_end ? String(r.week_end) : null,
        has_data: hasData,
      })
      if (r.week_end && r.created_at) {
        const we = new Date(String(r.week_end)).getTime()
        const ca = new Date(String(r.created_at)).getTime()
        if (!isNaN(we) && !isNaN(ca)) {
          const days = Math.max(0, (ca - we) / (1000 * 60 * 60 * 24))
          if (!delaysByBrand[b]) delaysByBrand[b] = []
          delaysByBrand[b].push(days)
        }
      }
    })

    const reportRows = target.map(b => {
      const set = weeksPresent[b] || new Set<number>()
      const ds = delaysByBrand[b] || []
      const avg = ds.length ? ds.reduce((a, x) => a + x, 0) / ds.length : null
      return {
        brand_name: b,
        weeks: { w1: set.has(1), w2: set.has(2), w3: set.has(3), w4: set.has(4), w5: set.has(5) },
        weeks_count: set.size,
        late_days_avg: avg,
        detail: weekDetail[b] || {},
      }
    })

    /* expected weeks for the month: count distinct week_nums seen across all brands; fallback 4 */
    const weekNumsSeen = new Set<number>()
    ;(weekly || []).forEach(r => weekNumsSeen.add(Number(r.week_num)))
    const expectedWeeksPerBrand = weekNumsSeen.size > 0 ? weekNumsSeen.size : 4
    const totalExpectedReports = expectedWeeksPerBrand * target.length
    const totalActualReports = reportRows.reduce((a, r) => a + r.weeks_count, 0)
    const allDelays = Object.values(delaysByBrand).flat()
    const avgDelayDays = allDelays.length ? allDelays.reduce((a, x) => a + x, 0) / allDelays.length : null

    /* Consistency — flag rows where cost & revenue > 0 but engagement zero */
    const consistency: { brand_name: string; week_num: number; username: string; group: string; issues: string[] }[] = []
    ;(weekly || []).forEach(r => {
      for (const g of CONSISTENCY_GROUPS) {
        const cost = num((r as Row)[g.cost])
        const rev = num((r as Row)[g.rev])
        if (cost > 0 && rev > 0) {
          const missing = g.engagement.filter(k => num((r as Row)[k]) === 0)
          if (missing.length) {
            consistency.push({
              brand_name: String(r.brand_name),
              week_num: Number(r.week_num),
              username: String(r.username || ''),
              group: g.label,
              issues: missing,
            })
          }
        }
      }
    })

    /* Timing per user */
    const userMap: Record<string, { count: number; delays: number[] }> = {}
    ;(weekly || []).forEach(r => {
      const u = String(r.username || '—')
      if (!userMap[u]) userMap[u] = { count: 0, delays: [] }
      userMap[u].count += 1
      if (r.week_end && r.created_at) {
        const we = new Date(String(r.week_end)).getTime()
        const ca = new Date(String(r.created_at)).getTime()
        if (!isNaN(we) && !isNaN(ca)) userMap[u].delays.push(Math.max(0, (ca - we) / (1000 * 60 * 60 * 24)))
      }
    })
    const timing = Object.entries(userMap).map(([username, v]) => {
      const avg = v.delays.length ? v.delays.reduce((a, x) => a + x, 0) / v.delays.length : 0
      const onTime = v.delays.length ? v.delays.filter(d => d <= 2).length / v.delays.length * 100 : 0
      return { username, count: v.count, avg_delay_days: avg, on_time_pct: onTime }
    }).sort((a, b) => b.avg_delay_days - a.avg_delay_days)

    /* Daily cadence — # reports created on each day */
    const dailyMap: Record<string, number> = {}
    ;(weekly || []).forEach(r => {
      if (!r.created_at) return
      const d = new Date(String(r.created_at))
      if (isNaN(d.getTime())) return
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      dailyMap[key] = (dailyMap[key] || 0) + 1
    })
    const daily_cadence = Object.entries(dailyMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({
      data: {
        plans: planRows,
        reports: reportRows,
        consistency,
        timing,
        daily_cadence,
        summary: {
          total_brands: target.length,
          brands_with_plan: brandsWithPlan,
          brands_without_plan: brandsWithoutPlan,
          avg_fill_pct: avgFillPct,
          total_actual_reports: totalActualReports,
          total_expected_reports: totalExpectedReports,
          missing_reports: Math.max(0, totalExpectedReports - totalActualReports),
          avg_delay_days: avgDelayDays,
          expected_weeks: expectedWeeksPerBrand,
        },
      },
    })
  }

  /* ─ Brand detail (preserved) ─ */
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
    if (!isAdmin && !names.includes(brand)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    const fromKey = fromYear * 100 + fromMonth
    const toKey = toYear * 100 + toMonth
    const { data: weekly } = await supabaseAdmin.from('weekly_reports').select('*').eq('brand_name', brand)
    const { data: plans } = await supabaseAdmin.from('monthly_plans').select('*').eq('brand_name', brand)
    const inRange = (m: number, y: number) => { const k = y * 100 + m; return k >= fromKey && k <= toKey }
    const weeklyOut = (weekly || []).filter(r => inRange(Number(r.month), Number(r.year)))
      .sort((a, b) => (Number(a.year) - Number(b.year)) || (Number(a.month) - Number(b.month)) || (Number(a.week_num) - Number(b.week_num)))
    const plansOut = (plans || []).filter(r => inRange(Number(r.month), Number(r.year)))
      .sort((a, b) => (Number(a.year) - Number(b.year)) || (Number(a.month) - Number(b.month)))
    return NextResponse.json({ data: { weekly: weeklyOut, plans: plansOut } })
  }

  /* ─ Compare (preserved) ─ */
  if (action === 'compare') {
    const month = parseInt(searchParams.get('month') || '0')
    const year = parseInt(searchParams.get('year') || '0')
    const brandsParam = (searchParams.get('brands') || '').split(',').map(s => s.trim()).filter(Boolean)
    if (!month || !year || !brandsParam.length) return NextResponse.json({ error: 'month/year/brands required' }, { status: 400 })
    const { names, isAdmin } = await allowedBrandNames()
    const allowed = isAdmin ? brandsParam : brandsParam.filter(b => names.includes(b))
    if (!allowed.length) return NextResponse.json({ data: [] })
    const { data: weekly } = await supabaseAdmin.from('weekly_reports').select('*').in('brand_name', allowed).eq('month', month).eq('year', year)
    const { data: plans } = await supabaseAdmin.from('monthly_plans').select('*').in('brand_name', allowed).eq('month', month).eq('year', year)
    return NextResponse.json({ data: { weekly: weekly || [], plans: plans || [] } })
  }

  /* ─ Trend (preserved) ─ */
  if (action === 'trend') {
    const month = parseInt(searchParams.get('month') || '0')
    const year = parseInt(searchParams.get('year') || '0')
    const brandsParam = (searchParams.get('brands') || '').split(',').map(s => s.trim()).filter(Boolean)
    if (!month || !year) return NextResponse.json({ error: 'month/year required' }, { status: 400 })
    const { names, isAdmin } = await allowedBrandNames()
    const target = brandsParam.length ? (isAdmin ? brandsParam : brandsParam.filter(b => names.includes(b))) : names
    if (!target.length) return NextResponse.json({ data: { months: [], series: {} } })
    const months: { m: number; y: number; key: string }[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1)
      months.push({ m: d.getMonth() + 1, y: d.getFullYear(), key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` })
    }
    const minKey = months[0].y * 100 + months[0].m
    const maxKey = months[11].y * 100 + months[11].m
    const { data: weekly } = await supabaseAdmin.from('weekly_reports').select('*').in('brand_name', target)
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
