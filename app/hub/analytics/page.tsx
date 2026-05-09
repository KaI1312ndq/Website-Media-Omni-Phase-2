'use client'

import { Fragment, useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { Skeleton } from '@/components/Skeleton'

/* ─── Types ─── */
type Platform = 'all' | 'shopee' | 'tiktok'
type Metric = 'gmv' | 'cp' | 'roas'

interface BrandSummary {
  brand: string
  gmv: number
  cp: number
  roas: number
  planGmv: number
  planCp: number
  pctGmv: number | null
  pctCp: number | null
  prevGmv: number
  prevCp: number
  prevRoas: number
  weeksReported: number
}
interface Totals { gmv: number; cp: number; roas: number; activeBrands: number }
interface SummaryResp { brands: BrandSummary[]; totals: Totals | null; prevTotals: Totals | null }
interface TrendResp { months: string[]; series: Record<string, { gmv: number[]; cp: number[]; roas: number[] }> }
interface WeeklyRow {
  brand_name: string; week_num: number; month: number; year: number
  s_cpc_doanh_so?: number; s_nd_gmv?: number; s_live_gmv?: number; t_pgm_doanh_so?: number; t_lgm_doanhthu?: number
  s_cpc_chi_phi?: number; s_nd_chi_phi?: number; s_live_chi_phi?: number; t_pgm_chi_phi?: number
  t_lgm_chi_phi?: number; t_con_chi_phi?: number; t_brd_chi_phi?: number
}

/* ─── Const ─── */
const COLORS = ['#2563EB', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6']

/* ─── Utils ─── */
function fmtNum(v: number | null | undefined): string {
  if (v === null || v === undefined || isNaN(Number(v))) return '—'
  const n = Math.round(Number(v))
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(1) + 'B'
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + 'M'
  if (Math.abs(n) >= 1e4) return Math.round(n / 1e3) + 'K'
  return n.toLocaleString('en-US')
}
function fmtPct(v: number | null | undefined, digits = 0): string {
  if (v === null || v === undefined || isNaN(Number(v))) return '—'
  return `${Number(v).toFixed(digits)}%`
}
function pctClass(p: number | null): string {
  if (p === null || p === undefined) return ''
  if (p >= 100) return 'pct-good'
  if (p >= 70) return 'pct-warn'
  return 'pct-bad'
}
function delta(cur: number, prev: number): { sign: '+' | '-' | '='; pct: number } {
  if (!prev) return { sign: cur > 0 ? '+' : '=', pct: 0 }
  const d = ((cur - prev) / prev) * 100
  return { sign: d > 0.5 ? '+' : d < -0.5 ? '-' : '=', pct: Math.abs(d) }
}
function gmvW(r: WeeklyRow, p: Platform = 'all'): number {
  const s = Number(r.s_cpc_doanh_so || 0) + Number(r.s_nd_gmv || 0) + Number(r.s_live_gmv || 0)
  const t = Number(r.t_pgm_doanh_so || 0) + Number(r.t_lgm_doanhthu || 0)
  return p === 'shopee' ? s : p === 'tiktok' ? t : s + t
}
function cpW(r: WeeklyRow, p: Platform = 'all'): number {
  const s = Number(r.s_cpc_chi_phi || 0) + Number(r.s_nd_chi_phi || 0) + Number(r.s_live_chi_phi || 0)
  const t = Number(r.t_pgm_chi_phi || 0) + Number(r.t_lgm_chi_phi || 0) + Number(r.t_con_chi_phi || 0) + Number(r.t_brd_chi_phi || 0)
  return p === 'shopee' ? s : p === 'tiktok' ? t : s + t
}

/* ─── Page ─── */
export default function AnalyticsPage() {
  const router = useRouter()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [allBrands, setAllBrands] = useState<string[]>([])
  const [selBrands, setSelBrands] = useState<string[]>([])
  const [ddOpen, setDdOpen] = useState(false)
  const [ddSearch, setDdSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)
  const [summary, setSummary] = useState<SummaryResp | null>(null)
  const [trend, setTrend] = useState<TrendResp | null>(null)
  const [trendMetric, setTrendMetric] = useState<Metric>('gmv')
  const [trendPlatform, setTrendPlatform] = useState<Platform>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [expandData, setExpandData] = useState<Record<string, WeeklyRow[]>>({})

  const ddRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInst = useRef<unknown>(null)

  /* auth */
  useEffect(() => {
    const u = getSession()
    if (!u) { router.replace('/'); return }
    setAuthChecked(true)
  }, [router])

  /* load brands once */
  useEffect(() => {
    if (!authChecked) return
    fetch('/api/analytics?action=brands', { credentials: 'include' })
      .then(r => r.json())
      .then(j => setAllBrands(j.data || []))
      .catch(() => setAllBrands([]))
  }, [authChecked])

  /* close dropdown on outside */
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ddRef.current && !ddRef.current.contains(e.target as Node)) setDdOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  /* fetch summary + trend whenever filters change */
  const reload = useCallback(async () => {
    if (!authChecked) return
    setLoading(true)
    const brandsQs = selBrands.length ? `&brands=${encodeURIComponent(selBrands.join(','))}` : ''
    try {
      const [sRes, tRes] = await Promise.all([
        fetch(`/api/analytics?action=summary&month=${month}&year=${year}&platform=${trendPlatform}`, { credentials: 'include' }).then(r => r.json()),
        fetch(`/api/analytics?action=trend&month=${month}&year=${year}${brandsQs}`, { credentials: 'include' }).then(r => r.json()),
      ])
      setSummary(sRes.data || null)
      setTrend(tRes.data || null)
    } finally {
      setLoading(false)
    }
  }, [authChecked, month, year, selBrands, trendPlatform])

  useEffect(() => { reload() }, [reload])

  /* draw chart */
  useEffect(() => {
    if (!trend || !chartRef.current) return
    let cancelled = false
    ;(async () => {
      const Chart = (await import('chart.js/auto')).default
      if (cancelled) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (chartInst.current) (chartInst.current as any).destroy()

      // Default to top 5 by current month GMV if no selection
      let series = trend.series
      let displayBrands = Object.keys(series)
      if (!selBrands.length && summary) {
        const top5 = summary.brands.slice(0, 5).map(b => b.brand)
        displayBrands = top5.filter(b => series[b])
      } else if (selBrands.length) {
        displayBrands = selBrands.filter(b => series[b])
      }

      const datasets = displayBrands.map((b, i) => ({
        label: b,
        data: series[b][trendMetric],
        borderColor: COLORS[i % COLORS.length],
        backgroundColor: COLORS[i % COLORS.length] + '22',
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 3,
      }))

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const opts: any = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { font: { family: 'Be Vietnam Pro', size: 11 }, boxWidth: 12, padding: 10 } },
          tooltip: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${trendMetric === 'roas' ? Number(ctx.raw).toFixed(2) + 'x' : fmtNum(ctx.raw)}` },
          },
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            grid: { color: 'rgba(37,99,235,.07)' },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ticks: { callback: (v: any) => trendMetric === 'roas' ? Number(v).toFixed(1) + 'x' : fmtNum(Number(v)) },
          },
        },
      }
      chartInst.current = new Chart(chartRef.current!, {
        type: 'line',
        data: { labels: trend.months, datasets },
        options: opts,
      })
    })()
    return () => { cancelled = true }
  }, [trend, summary, trendMetric, selBrands])

  /* expand brand row */
  async function toggleExpand(brand: string) {
    if (expanded === brand) { setExpanded(null); return }
    setExpanded(brand)
    if (!expandData[brand]) {
      const r = await fetch(`/api/analytics?action=compare&month=${month}&year=${year}&brands=${encodeURIComponent(brand)}`, { credentials: 'include' }).then(x => x.json())
      const weekly: WeeklyRow[] = r.data?.weekly || []
      setExpandData(prev => ({ ...prev, [brand]: weekly.sort((a, b) => a.week_num - b.week_num) }))
    }
  }

  /* derived */
  const yearsOpts = []
  for (let y = 2024; y <= now.getFullYear() + 1; y++) yearsOpts.push(y)
  const filteredDD = allBrands.filter(b => b.toLowerCase().includes(ddSearch.toLowerCase()))
  const toggleBrand = (b: string) => setSelBrands(p => p.includes(b) ? p.filter(x => x !== b) : [...p, b])

  const sBrands = summary?.brands || []
  const top5Gmv = [...sBrands].sort((a, b) => b.gmv - a.gmv).slice(0, 5)
  const top5Roas = [...sBrands].filter(b => b.cp > 0).sort((a, b) => b.roas - a.roas).slice(0, 5)
  const bottom5Plan = [...sBrands].filter(b => b.pctGmv !== null).sort((a, b) => (a.pctGmv || 0) - (b.pctGmv || 0)).slice(0, 5)

  const totals = summary?.totals
  const prevTotals = summary?.prevTotals

  const renderArrow = (cur: number, prev: number) => {
    const d = delta(cur, prev)
    if (d.sign === '=') return <span style={{ color: 'var(--faint)', fontSize: '.78rem' }}>= 0%</span>
    const color = d.sign === '+' ? 'var(--success)' : 'var(--error)'
    return <span style={{ color, fontSize: '.78rem', fontWeight: 600 }}>{d.sign === '+' ? '↑' : '↓'} {d.pct.toFixed(1)}% MoM</span>
  }

  return (
    <div className="an" style={{ maxWidth: 1200, margin: '0 auto', padding: '88px 20px 80px' }}>
      <div style={{ marginBottom: 6 }}>
        <Link href="/dashboard" style={{ fontSize: '.82rem', color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          Dashboard
        </Link>
      </div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 800, color: 'var(--ink)' }}>Analytics</h1>
        <p style={{ color: 'var(--muted)', fontSize: '.88rem', marginTop: 4 }}>Tổng quan hiệu suất multi-brand từ Supabase weekly_reports + monthly_plans.</p>
      </div>

      {/* FILTERS */}
      <div className="an-filters">
        <div>
          <label className="an-label">Tháng</label>
          <select className="an-sel" value={month} onChange={e => setMonth(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>Tháng {m}</option>)}
          </select>
        </div>
        <div>
          <label className="an-label">Năm</label>
          <select className="an-sel" value={year} onChange={e => setYear(Number(e.target.value))}>
            {yearsOpts.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
          <label className="an-label">Brand</label>
          <div className="filter-brand-wrap" ref={ddRef} style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
            <div
              className="brand-tag-list"
              onClick={() => setDdOpen(o => !o)}
              style={{ cursor: 'pointer', minHeight: 36, padding: '4px 10px', border: '1.5px solid var(--border)', borderRadius: 8, background: '#fff' }}
            >
              {selBrands.length === 0
                ? <span className="brand-tag brand-tag-all">Tất cả ({allBrands.length})</span>
                : selBrands.map(b => (
                  <span key={b} className="brand-tag">
                    {b}
                    <button className="brand-tag-rm" onClick={e => { e.stopPropagation(); setSelBrands(p => p.filter(x => x !== b)) }}>×</button>
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
                  {filteredDD.map(b => (
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
      </div>

      {/* CONTENT */}
      {loading ? (
        <>
          <div className="an-cards">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="an-card"><Skeleton width="60%" height={32} /><Skeleton width="80%" height={12} style={{ marginTop: 10 }} /></div>
            ))}
          </div>
          <div className="an-block" style={{ padding: 18 }}><Skeleton width="100%" height={220} /></div>
        </>
      ) : !allBrands.length ? (
        <div className="an-block" style={{ padding: 30, textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)' }}>Bạn chưa được assign brand nào. Liên hệ Admin để được phân quyền.</p>
        </div>
      ) : (
        <>
          {/* SUMMARY CARDS */}
          <div className="an-cards">
            <div className="an-card">
              <div className="an-card-val">{fmtNum(totals?.gmv || 0)}</div>
              <div className="an-card-lbl">Tổng GMV ({trendPlatform === 'all' ? 'all' : trendPlatform})</div>
              <div className="an-card-sub">{prevTotals ? renderArrow(totals?.gmv || 0, prevTotals.gmv) : null}</div>
            </div>
            <div className="an-card">
              <div className="an-card-val">{fmtNum(totals?.cp || 0)}</div>
              <div className="an-card-lbl">Tổng Chi phí</div>
              <div className="an-card-sub">{prevTotals ? renderArrow(totals?.cp || 0, prevTotals.cp) : null}</div>
            </div>
            <div className="an-card">
              <div className="an-card-val">{(totals?.roas || 0).toFixed(2)}x</div>
              <div className="an-card-lbl">ROAS trung bình</div>
              <div className="an-card-sub">{prevTotals ? renderArrow(totals?.roas || 0, prevTotals.roas) : null}</div>
            </div>
            <div className="an-card">
              <div className="an-card-val">{totals?.activeBrands || 0}</div>
              <div className="an-card-lbl">Brand active</div>
              <div className="an-card-sub">{prevTotals ? `Tháng trước: ${prevTotals.activeBrands}` : ''}</div>
            </div>
          </div>

          {/* TOP / BOTTOM */}
          <div className="an-sec"><h2>Top &amp; Bottom Performers</h2><p>Tháng {month}/{year}</p></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginBottom: 28 }}>
            <div className="an-block" style={{ padding: 14 }}>
              <h3 style={{ fontSize: '.9rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>Top 5 GMV</h3>
              <table className="metrics-tbl">
                <thead><tr><th>Brand</th><th>GMV</th></tr></thead>
                <tbody>
                  {top5Gmv.length === 0
                    ? <tr><td colSpan={2} style={{ textAlign: 'center', color: 'var(--faint)' }}>—</td></tr>
                    : top5Gmv.map(b => <tr key={b.brand}><td>{b.brand}</td><td>{fmtNum(b.gmv)}</td></tr>)}
                </tbody>
              </table>
            </div>
            <div className="an-block" style={{ padding: 14 }}>
              <h3 style={{ fontSize: '.9rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>Top 5 ROAS</h3>
              <table className="metrics-tbl">
                <thead><tr><th>Brand</th><th>ROAS</th></tr></thead>
                <tbody>
                  {top5Roas.length === 0
                    ? <tr><td colSpan={2} style={{ textAlign: 'center', color: 'var(--faint)' }}>—</td></tr>
                    : top5Roas.map(b => <tr key={b.brand}><td>{b.brand}</td><td>{b.roas.toFixed(2)}x</td></tr>)}
                </tbody>
              </table>
            </div>
            <div className="an-block" style={{ padding: 14 }}>
              <h3 style={{ fontSize: '.9rem', fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>Bottom 5 % Plan GMV</h3>
              <table className="metrics-tbl">
                <thead><tr><th>Brand</th><th>% Plan</th></tr></thead>
                <tbody>
                  {bottom5Plan.length === 0
                    ? <tr><td colSpan={2} style={{ textAlign: 'center', color: 'var(--faint)' }}>Chưa có plan</td></tr>
                    : bottom5Plan.map(b => <tr key={b.brand}><td>{b.brand}</td><td><span className={pctClass(b.pctGmv)}>{fmtPct(b.pctGmv)}</span></td></tr>)}
                </tbody>
              </table>
            </div>
          </div>

          {/* TREND */}
          <div className="an-sec" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 8 }}>
            <div><h2>Trend 12 tháng</h2><p>{selBrands.length ? `${selBrands.length} brand được chọn` : 'Top 5 brand theo GMV'}</p></div>
            <div style={{ display: 'flex', gap: 8 }}>
              <select className="an-sel" value={trendMetric} onChange={e => setTrendMetric(e.target.value as Metric)}>
                <option value="gmv">GMV</option>
                <option value="cp">Chi phí</option>
                <option value="roas">ROAS</option>
              </select>
              <select className="an-sel" value={trendPlatform} onChange={e => setTrendPlatform(e.target.value as Platform)}>
                <option value="all">Tất cả</option>
                <option value="shopee">Shopee</option>
                <option value="tiktok">TikTok</option>
              </select>
            </div>
          </div>
          <div className="an-block" style={{ padding: 18, marginBottom: 28 }}>
            <div style={{ position: 'relative', height: 320 }}>
              <canvas ref={chartRef} />
            </div>
          </div>

          {/* COMPARISON TABLE */}
          <div className="an-sec"><h2>Bảng so sánh Brand</h2><p>Click vào brand để xem chi tiết theo tuần</p></div>
          <div className="an-block">
            <div className="matrix-wrap" style={{ overflowX: 'auto' }}>
              <table className="metrics-tbl">
                <thead>
                  <tr>
                    <th>Brand</th><th>Plan GMV</th><th>Actual GMV</th><th>%</th>
                    <th>Plan CP</th><th>Actual CP</th><th>%</th>
                    <th>ROAS</th><th>Δ MoM</th>
                  </tr>
                </thead>
                <tbody>
                  {sBrands.length === 0
                    ? <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--faint)', fontStyle: 'italic', padding: 20 }}>Không có dữ liệu</td></tr>
                    : sBrands.map(b => (
                      <Fragment key={b.brand}>
                        <tr style={{ cursor: 'pointer' }} onClick={() => toggleExpand(b.brand)}>
                          <td>{expanded === b.brand ? '▼ ' : '▶ '}{b.brand}</td>
                          <td>{b.planGmv ? fmtNum(b.planGmv) : '—'}</td>
                          <td>{fmtNum(b.gmv)}</td>
                          <td><span className={pctClass(b.pctGmv)}>{fmtPct(b.pctGmv)}</span></td>
                          <td>{b.planCp ? fmtNum(b.planCp) : '—'}</td>
                          <td>{fmtNum(b.cp)}</td>
                          <td><span className={pctClass(b.pctCp)}>{fmtPct(b.pctCp)}</span></td>
                          <td>{b.cp > 0 ? b.roas.toFixed(2) + 'x' : '—'}</td>
                          <td>
                            {(() => {
                              const d = delta(b.gmv, b.prevGmv)
                              if (d.sign === '=') return <span style={{ color: 'var(--faint)' }}>=</span>
                              return <span style={{ color: d.sign === '+' ? 'var(--success)' : 'var(--error)', fontWeight: 600 }}>{d.sign === '+' ? '↑' : '↓'} {d.pct.toFixed(0)}%</span>
                            })()}
                          </td>
                        </tr>
                        {expanded === b.brand && (
                          <tr>
                            <td colSpan={9} style={{ background: 'var(--paper)', padding: 12 }}>
                              {!expandData[b.brand]
                                ? <Skeleton width="100%" height={60} />
                                : expandData[b.brand].length === 0
                                ? <span style={{ color: 'var(--faint)', fontStyle: 'italic' }}>Chưa có weekly report tháng này</span>
                                : (
                                  <table className="metrics-tbl" style={{ background: '#fff', borderRadius: 8 }}>
                                    <thead><tr><th>Tuần</th><th>GMV</th><th>Chi phí</th><th>ROAS</th></tr></thead>
                                    <tbody>
                                      {expandData[b.brand].map(w => {
                                        const g = gmvW(w, trendPlatform)
                                        const c = cpW(w, trendPlatform)
                                        return (
                                          <tr key={w.week_num}>
                                            <td>W{w.week_num}</td>
                                            <td>{fmtNum(g)}</td>
                                            <td>{fmtNum(c)}</td>
                                            <td>{c > 0 ? (g / c).toFixed(2) + 'x' : '—'}</td>
                                          </tr>
                                        )
                                      })}
                                    </tbody>
                                  </table>
                                )}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
