'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

/* ─── Types ─── */
interface WeekDef { w: number; start: Date; end: Date }
interface WeekHistory { week_num: number | string; created_at?: string; updated_at?: string;
  s_cpc_doanh_so?: number; s_nd_gmv?: number; s_live_gmv?: number; t_pgm_doanh_so?: number; t_lgm_doanhthu?: number;
  s_cpc_chi_phi?: number; s_nd_chi_phi?: number; s_live_chi_phi?: number; t_pgm_chi_phi?: number;
  t_lgm_chi_phi?: number; t_con_chi_phi?: number; t_brd_chi_phi?: number }
interface Plan { [key: string]: { plan_month?: number } }
interface BrandData { plan: Plan | null; history: WeekHistory[]; weeks: WeekDef[] }

/* ─── Constants ─── */
const API = 'https://script.google.com/macros/s/AKfycbwmLt2SFY5iMg22qrUmvxmgI5Njwje5wRYGdHIwxizQvELMAHKmVlahHj0XJVOMuYMu/exec'
const COLORS = ['#2563EB','#06B6D4','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#14B8A6']

/* ─── Utils ─── */
function getWeeksOfMonth(year: number, month: number): WeekDef[] {
  const weeks: WeekDef[] = []
  let d = new Date(year, month - 1, 1)
  let w = 1
  while (d.getMonth() === month - 1) {
    const start = new Date(d)
    const end   = new Date(d)
    while (end.getMonth() === month - 1 && end.getDay() !== 0) end.setDate(end.getDate() + 1)
    if (end.getMonth() !== month - 1) end.setDate(end.getDate() - 1)
    weeks.push({ w, start: new Date(start), end: new Date(end) })
    end.setDate(end.getDate() + 1)
    d = new Date(end)
    w++
  }
  return weeks
}

function fmtNum(v: number | null | undefined): string {
  if (v === null || v === undefined || isNaN(v as number)) return '—'
  const n = Math.round(parseFloat(String(v)))
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (n >= 1e4) return Math.round(n / 1e3) + 'K'
  return n.toLocaleString('en-US')
}

function fmtDate(d?: string): string {
  if (!d) return '—'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return '—'
  return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')} ${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`
}

function fmtDay(d?: string): string {
  if (!d) return ''
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return ''
  return ['CN','T2','T3','T4','T5','T6','T7'][dt.getDay()]
}

function fmtShort(d: Date): string { return `${d.getDate()}/${d.getMonth()+1}` }

function pctColor(pct: number | null): string {
  if (pct === null || pct === undefined) return 'pct-none'
  if (pct >= 100) return 'pct-good'
  if (pct >= 70)  return 'pct-warn'
  return 'pct-bad'
}

function gmvOf(h: WeekHistory) {
  return (parseFloat(String(h.s_cpc_doanh_so??0))+parseFloat(String(h.s_nd_gmv??0))+parseFloat(String(h.s_live_gmv??0))+parseFloat(String(h.t_pgm_doanh_so??0))+parseFloat(String(h.t_lgm_doanhthu??0)))
}
function cpOf(h: WeekHistory) {
  return (parseFloat(String(h.s_cpc_chi_phi??0))+parseFloat(String(h.s_nd_chi_phi??0))+parseFloat(String(h.s_live_chi_phi??0))+parseFloat(String(h.t_pgm_chi_phi??0))+parseFloat(String(h.t_lgm_chi_phi??0))+parseFloat(String(h.t_con_chi_phi??0))+parseFloat(String(h.t_brd_chi_phi??0)))
}

/* ─── Main page ─── */
export default function AnalyticsPage() {
  const router   = useRouter()
  const now      = new Date()
  const [month, setMonth]     = useState(now.getMonth() + 1)
  const [year,  setYear]      = useState(now.getFullYear())
  const [allBrands, setAllBrands]   = useState<string[]>([])
  const [selBrands, setSelBrands]   = useState<string[]>([])
  const [ddOpen, setDdOpen]         = useState(false)
  const [ddSearch, setDdSearch]     = useState('')
  const [loading, setLoading]       = useState(false)
  const [data, setData]             = useState<Record<string, BrandData>>({})
  const [rendered, setRendered]     = useState(false)
  const chartGmvRef = useRef<HTMLCanvasElement>(null)
  const chartCpRef  = useRef<HTMLCanvasElement>(null)
  const chartInstGmv = useRef<unknown>(null)
  const chartInstCp  = useRef<unknown>(null)
  const ddRef = useRef<HTMLDivElement>(null)

  /* auth guard */
  useEffect(() => {
    const user = typeof window !== 'undefined' ? localStorage.getItem('mo_user') : null
    if (!user) { router.replace('/') }
  }, [router])

  /* fetch brands on mount */
  useEffect(() => {
    fetch(`${API}?action=getBrands`)
      .then(r => r.json())
      .then(j => { if (j.ok && j.data) setAllBrands(j.data) })
      .catch(() => {})
  }, [])

  /* close dropdown on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ddRef.current && !ddRef.current.contains(e.target as Node)) setDdOpen(false)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [])

  /* load data */
  const loadData = useCallback(async () => {
    const brands = selBrands.length > 0 ? selBrands : allBrands
    if (!brands.length) return
    setLoading(true)
    setRendered(false)
    const weeks = getWeeksOfMonth(year, month)
    const newData: Record<string, BrandData> = {}
    await Promise.all(brands.map(async brand => {
      const [pj, hj] = await Promise.race([
        Promise.all([
          fetch(`${API}?action=getPlan&brand_name=${encodeURIComponent(brand)}&month=${month}&year=${year}`).then(r=>r.json()).catch(()=>({ok:false})),
          fetch(`${API}?action=getWeeklyHistory&brand_name=${encodeURIComponent(brand)}&month=${month}&year=${year}`).then(r=>r.json()).catch(()=>({ok:false})),
        ]),
        new Promise<[{ok:false},{ok:false}]>(res => setTimeout(() => res([{ok:false},{ok:false}]), 20000))
      ])
      newData[brand] = {
        plan:    (pj as {ok:boolean;data?:Plan}).ok ? ((pj as {ok:boolean;data?:Plan}).data ?? null) : null,
        history: (hj as {ok:boolean;data?:WeekHistory[]}).ok ? ((hj as {ok:boolean;data?:WeekHistory[]}).data ?? []) : [],
        weeks,
      }
    }))
    setData(newData)
    setLoading(false)
    setRendered(true)
  }, [allBrands, selBrands, month, year])

  /* draw charts after render */
  useEffect(() => {
    if (!rendered) return
    drawCharts()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rendered, data])

  async function drawCharts() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Chart = (await import('chart.js/auto')).default
    const brands   = selBrands.length > 0 ? selBrands : allBrands
    const weeks    = getWeeksOfMonth(year, month)
    const labels   = weeks.map(w => `W${w.w}`)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (chartInstGmv.current) (chartInstGmv.current as any).destroy()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (chartInstCp.current)  (chartInstCp.current  as any).destroy()

    if (!chartGmvRef.current || !chartCpRef.current) return

    const mkDatasets = (fn: (h: WeekHistory) => number) => brands.map((b, i) => ({
      label: b,
      data:  weeks.map(w => { const h = data[b]?.history.find(r => parseInt(String(r.week_num)) === w.w); return h ? fn(h) : 0 }),
      backgroundColor: COLORS[i % COLORS.length] + 'cc',
      borderColor:     COLORS[i % COLORS.length],
      borderWidth: 1, borderRadius: 4,
    }))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const opts: any = {
      responsive: true,
      plugins: {
        legend: { position: 'bottom', labels: { font: { family: 'Be Vietnam Pro', size: 11 }, boxWidth: 12, padding: 12 } },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tooltip: { callbacks: { label: (ctx: any) => `${ctx.dataset.label ?? ''}: ${fmtNum(ctx.raw)}` } },
      },
      scales: {
        x: { stacked: true, grid: { display: false } },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        y: { stacked: true, grid: { color: 'rgba(37,99,235,.07)' }, ticks: { callback: (v: any) => fmtNum(v) } },
      },
    }

    chartInstGmv.current = new Chart(chartGmvRef.current, { type: 'bar', data: { labels, datasets: mkDatasets(gmvOf) }, options: opts })
    chartInstCp.current  = new Chart(chartCpRef.current,  { type: 'bar', data: { labels, datasets: mkDatasets(cpOf)  }, options: opts })
  }

  /* derived brand data for tables */
  const brands  = selBrands.length > 0 ? selBrands : allBrands
  const weeks   = getWeeksOfMonth(year, month)
  const today   = new Date()
  const currentWeek = weeks.find(w => today >= w.start && today <= w.end)?.w ?? (weeks.at(-1)?.w ?? null)

  const bData = brands.map(brand => {
    const { plan, history } = data[brand] ?? { plan: null, history: [] }
    const weekMap: Record<number, WeekHistory> = {}
    ;(history ?? []).forEach(h => { weekMap[parseInt(String(h.week_num))] = h })

    const gmvTotal = weeks.reduce((a, w) => { const h = weekMap[w.w]; return h ? a + gmvOf(h) : a }, 0)
    const cpTotal  = weeks.reduce((a, w) => { const h = weekMap[w.w]; return h ? a + cpOf(h)  : a }, 0)
    const roas     = cpTotal > 0 ? gmvTotal / cpTotal : null

    const planGmv = plan ? (parseFloat(String((plan as Plan).s_cpc_doanh_so?.plan_month??0))+parseFloat(String((plan as Plan).s_nd_gmv?.plan_month??0))+parseFloat(String((plan as Plan).s_live_gmv?.plan_month??0))+parseFloat(String((plan as Plan).t_pgm_doanh_so?.plan_month??0))+parseFloat(String((plan as Plan).t_lgm_doanhthu?.plan_month??0))) : null
    const planCp  = plan ? (parseFloat(String((plan as Plan).s_cpc_chi_phi?.plan_month??0))+parseFloat(String((plan as Plan).s_nd_chi_phi?.plan_month??0))+parseFloat(String((plan as Plan).s_live_chi_phi?.plan_month??0))+parseFloat(String((plan as Plan).t_pgm_chi_phi?.plan_month??0))+parseFloat(String((plan as Plan).t_lgm_chi_phi?.plan_month??0))+parseFloat(String((plan as Plan).t_con_chi_phi?.plan_month??0))+parseFloat(String((plan as Plan).t_brd_chi_phi?.plan_month??0))) : null

    const reportedWeeks = weeks.filter(w => weekMap[w.w]).map(w => w.w)
    const pctGmv = planGmv && gmvTotal ? Math.round(gmvTotal / planGmv * 100) : null
    const pctCp  = planCp  && cpTotal  ? Math.round(cpTotal  / planCp  * 100) : null
    const hasPlan = !!plan

    return { brand, hasPlan, weekMap, gmvTotal, cpTotal, roas, planGmv, planCp, pctGmv, pctCp, reportedWeeks }
  })

  const totalBrands         = brands.length
  const brandsWithPlan      = bData.filter(d => d.hasPlan).length
  const brandsWithAnyReport = bData.filter(d => d.reportedWeeks.length > 0).length
  const brandsThisWeek      = bData.filter(d => currentWeek && d.weekMap[currentWeek]).length
  const missingThisWeek     = totalBrands - brandsThisWeek

  /* brand dropdown helpers */
  const toggleBrand = (b: string) => setSelBrands(prev => prev.includes(b) ? prev.filter(x=>x!==b) : [...prev, b])
  const filtered = allBrands.filter(b => b.toLowerCase().includes(ddSearch.toLowerCase()))

  const yearsOpts = []
  for (let y = 2024; y <= now.getFullYear() + 1; y++) yearsOpts.push(y)

  return (
    <div className="an" style={{ maxWidth: 1100, margin: '0 auto', padding: '88px 20px 80px' }}>
      {/* Back */}
      <div style={{ marginBottom: 6 }}>
        <Link href="/dashboard" style={{ fontSize: '.82rem', color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          Dashboard
        </Link>
      </div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--ink)' }}>Analytics</h1>
        <p style={{ color: 'var(--muted)', fontSize: '.88rem', marginTop: 4 }}>Tổng quan hiệu suất, tiến độ report và số liệu theo brand.</p>
      </div>

      {/* FILTERS */}
      <div className="an-filters">
        <div>
          <label className="an-label">Tháng</label>
          <select className="an-sel" value={month} onChange={e => setMonth(Number(e.target.value))}>
            {Array.from({length:12},(_,i)=>i+1).map(m => <option key={m} value={m}>Tháng {m}</option>)}
          </select>
        </div>
        <div>
          <label className="an-label">Năm</label>
          <select className="an-sel" value={year} onChange={e => setYear(Number(e.target.value))}>
            {yearsOpts.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label className="an-label">Brand</label>
          <div className="filter-brand-wrap" ref={ddRef}>
            <div
              className="brand-tag-list"
              onClick={() => setDdOpen(o => !o)}
              style={{ cursor: 'pointer', minWidth: 140, padding: '4px 10px', border: '1.5px solid var(--border)', borderRadius: 8, background: '#fff' }}
            >
              {selBrands.length === 0
                ? <span className="brand-tag brand-tag-all">Tất cả</span>
                : selBrands.map(b => (
                  <span key={b} className="brand-tag">
                    {b}
                    <button className="brand-tag-rm" onClick={e => { e.stopPropagation(); setSelBrands(p => p.filter(x=>x!==b)) }}>×</button>
                  </span>
                ))}
            </div>
            {ddOpen && (
              <div className="brand-dropdown open">
                <input
                  className="brand-dd-search"
                  placeholder="Tìm brand..."
                  value={ddSearch}
                  onChange={e => setDdSearch(e.target.value)}
                  onClick={e => e.stopPropagation()}
                  autoFocus
                />
                <div>
                  <div className="brand-dd-opt">
                    <input type="checkbox" id="chk-all" checked={selBrands.length === 0} onChange={() => setSelBrands([])} />
                    <label htmlFor="chk-all" style={{ cursor: 'pointer' }}>Tất cả</label>
                  </div>
                  {filtered.map(b => (
                    <div key={b} className="brand-dd-opt">
                      <input type="checkbox" id={`chk-${b}`} checked={selBrands.includes(b)} onChange={() => toggleBrand(b)} />
                      <label htmlFor={`chk-${b}`} style={{ cursor: 'pointer' }}>{b}</label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <button
          className="an-sel filter-refresh"
          onClick={loadData}
          style={{ marginLeft: 'auto', background: 'var(--blue)', color: '#fff', borderColor: 'var(--blue)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
          Tải dữ liệu
        </button>
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="an-loading">
          <div className="spin" />
          <br /><br />
          Đang tải dữ liệu {brands.length} brand...
        </div>
      ) : !rendered ? (
        <div className="an-loading" style={{ color: 'var(--faint)' }}>
          Chọn filter và nhấn <b>Tải dữ liệu</b> để xem Analytics.
        </div>
      ) : (
        <>
          {/* COVERAGE CARDS */}
          <div className="an-cards">
            <div className="an-card">
              <div className="an-card-val">{totalBrands}</div>
              <div className="an-card-lbl">Brand đang theo dõi</div>
              <div className="an-card-sub">Tháng {month}/{year}</div>
            </div>
            <div className={`an-card ${brandsWithPlan === totalBrands ? 'ok' : brandsWithPlan > 0 ? 'warn' : 'err'}`}>
              <div className="an-card-val">{brandsWithPlan}/{totalBrands}</div>
              <div className="an-card-lbl">Brand đã có Plan tháng</div>
              <div className="an-card-sub">{totalBrands - brandsWithPlan > 0 ? `Còn ${totalBrands - brandsWithPlan} chưa set plan` : 'Tất cả đã có plan ✓'}</div>
            </div>
            <div className={`an-card ${brandsWithAnyReport === totalBrands ? 'ok' : brandsWithAnyReport > 0 ? 'warn' : 'err'}`}>
              <div className="an-card-val">{brandsWithAnyReport}/{totalBrands}</div>
              <div className="an-card-lbl">Brand đã nộp Report</div>
              <div className="an-card-sub">Ít nhất 1 tuần trong tháng</div>
            </div>
            <div className={`an-card ${missingThisWeek === 0 ? 'ok' : 'err'}`}>
              <div className="an-card-val">{missingThisWeek}</div>
              <div className="an-card-lbl">Chưa nộp{currentWeek ? ` W${currentWeek}` : ''}</div>
              <div className="an-card-sub">
                {missingThisWeek > 0
                  ? bData.filter(d => currentWeek && !d.weekMap[currentWeek]).map(d=>d.brand).join(', ')
                  : 'Đã đủ ✓'}
              </div>
            </div>
          </div>

          {/* STATUS MATRIX */}
          <div className="an-sec"><h2>Trạng thái Report theo tuần</h2><p>✅ Đã nộp &nbsp;❌ Chưa nộp &nbsp;— Tuần chưa đến</p></div>
          <div className="an-block">
            <div className="matrix-wrap">
              <table className="matrix-tbl">
                <thead>
                  <tr>
                    <th>Brand</th>
                    {weeks.map(w => <th key={w.w}>W{w.w}<br /><span style={{fontWeight:400,fontSize:'.7rem'}}>{fmtShort(w.start)}–{fmtShort(w.end)}</span></th>)}
                    <th>Plan?</th>
                    <th>% nộp</th>
                  </tr>
                </thead>
                <tbody>
                  {bData.map(d => {
                    const pctRpt = Math.round(d.reportedWeeks.length / weeks.length * 100)
                    return (
                      <tr key={d.brand}>
                        <td>{d.brand}</td>
                        {weeks.map(w => {
                          const has    = !!d.weekMap[w.w]
                          const future = w.start > today
                          return (
                            <td key={w.w}>
                              {future && !has
                                ? <span className="badge badge-none">–</span>
                                : has
                                ? <span className="badge badge-ok">✅</span>
                                : <span className="badge badge-miss">❌</span>}
                            </td>
                          )
                        })}
                        <td><span className={`plan-badge ${d.hasPlan ? 'plan-yes' : 'plan-no'}`}>{d.hasPlan ? 'Có' : 'Chưa có'}</span></td>
                        <td><span className={pctColor(pctRpt)}>{pctRpt}%</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* TIMING TABLE */}
          <div className="an-sec"><h2>Thời gian nộp Report</h2><p>Ngày giờ brand submit weekly report vào hệ thống</p></div>
          <div className="an-block">
            <div className="matrix-wrap">
              <table className="timing-tbl">
                <thead>
                  <tr>
                    <th>Brand</th>
                    {weeks.map(w => <th key={w.w}>W{w.w}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {bData.map(d => (
                    <tr key={d.brand}>
                      <td>{d.brand}</td>
                      {weeks.map(w => {
                        const h  = d.weekMap[w.w]
                        const ts = h?.created_at ?? h?.updated_at
                        return (
                          <td key={w.w}>
                            {h ? <>{fmtDate(ts)}<span className="t-day">{fmtDay(ts)}</span></> : '—'}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* METRICS TABLE */}
          <div className="an-sec"><h2>Tổng hợp chỉ số theo Brand</h2><p>Lũy tiến MTD từ các tuần đã nộp</p></div>
          <div className="an-block">
            <div className="matrix-wrap">
              <table className="metrics-tbl">
                <thead>
                  <tr>
                    <th>Brand</th><th>Tuần gần nhất</th>
                    <th>GMV Ads (MTD)</th><th>Plan GMV</th><th>% Plan GMV</th>
                    <th>Chi phí (MTD)</th><th>Plan CP</th><th>% Plan CP</th>
                    <th>ROAS/ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {bData.length === 0 ? (
                    <tr><td colSpan={9} style={{textAlign:'center',color:'var(--faint)',fontStyle:'italic',padding:20}}>Không có dữ liệu</td></tr>
                  ) : bData.map(d => {
                    const lastW = d.reportedWeeks.length > 0 ? `W${Math.max(...d.reportedWeeks)}` : '—'
                    return (
                      <tr key={d.brand}>
                        <td>{d.brand}</td>
                        <td>{lastW}</td>
                        <td>{fmtNum(d.gmvTotal)}</td>
                        <td>{d.planGmv ? fmtNum(d.planGmv) : '—'}</td>
                        <td><span className={pctColor(d.pctGmv)}>{d.pctGmv !== null ? `${d.pctGmv}%` : '—'}</span></td>
                        <td>{fmtNum(d.cpTotal)}</td>
                        <td>{d.planCp ? fmtNum(d.planCp) : '—'}</td>
                        <td><span className={pctColor(d.pctCp)}>{d.pctCp !== null ? `${d.pctCp}%` : '—'}</span></td>
                        <td>{d.roas !== null ? `${d.roas.toFixed(2)}x` : '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* CHARTS */}
          <div className="chart-row">
            <div className="chart-box">
              <h3>GMV Ads theo tuần (MTD)</h3>
              <canvas ref={chartGmvRef} height={180} />
            </div>
            <div className="chart-box">
              <h3>Chi phí Ads theo tuần</h3>
              <canvas ref={chartCpRef} height={180} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
