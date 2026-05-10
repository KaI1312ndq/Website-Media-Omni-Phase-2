'use client'

import { Fragment, useEffect, useMemo, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getSession, SessionUser } from '@/lib/auth'
import { Skeleton, HubPageSkeleton } from '@/components/Skeleton'
import '@/app/(internal)/dashboard/dashboard.css'
import './analytics.css'

/* ─── Types ─── */
type PlatformToggle = 'shopee' | 'tiktok' | 'both'

interface BrandRow {
  brand: string
  gmv: number
  cp: number
  roas: number
  planGmv: number
  planCp: number
  pctGmv: number | null
  pctCp: number | null
  weeksReported: number
  lastWeekEnd: string | null
}
interface PlatformTotals {
  gmv: number
  cp: number
  roas: number
  activeBrands: number
}
interface SummaryResp {
  shopee: BrandRow[]
  tiktok: BrandRow[]
  totals: { shopee: PlatformTotals | null; tiktok: PlatformTotals | null }
}
interface PlanRow {
  brand_name: string
  has_plan: boolean
  shopee_pct: number | null
  tiktok_pct: number | null
  overall_pct: number | null
  missing_keys: string[]
  shopee_active: boolean
  tiktok_active: boolean
}
interface ReportDetailEntry {
  username: string
  created_at: string
  week_end: string | null
  has_data: boolean
}
interface ReportRow {
  brand_name: string
  weeks: { w1: boolean; w2: boolean; w3: boolean; w4: boolean; w5: boolean }
  weeks_count: number
  late_hours_avg: number | null
  detail: Record<number, ReportDetailEntry[]>
}
interface ConsistencyRow {
  brand_name: string
  week_num: number
  username: string
  group: string
  issues: string[]
}
interface TimingRow {
  username: string
  count: number
  avg_delay_hours: number
  on_time_pct: number
}
interface DailyRow {
  date: string
  count: number
}
interface CoverageSummary {
  total_brands: number
  brands_with_plan: number
  brands_without_plan: number
  avg_fill_pct: number
  total_actual_reports: number
  total_expected_reports: number
  missing_reports: number
  avg_late_hours: number | null
  expected_weeks: number
}
interface CoverageResp {
  plans: PlanRow[]
  reports: ReportRow[]
  consistency: ConsistencyRow[]
  timing: TimingRow[]
  daily_cadence: DailyRow[]
  summary: CoverageSummary | null
}

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
function pctClass(p: number | null | undefined): string {
  if (p === null || p === undefined) return 'an2-pct-none'
  if (p >= 100) return 'an2-pct-good'
  if (p >= 70) return 'an2-pct-warn'
  return 'an2-pct-bad'
}
function fmtLateHours(h: number | null | undefined): string {
  if (h === null || h === undefined || isNaN(Number(h))) return '—'
  const n = Number(h)
  if (n <= 0) return 'Đúng hạn'
  if (n < 24) return `${Math.round(n)}h`
  const d = Math.floor(n / 24)
  const r = Math.round(n - d * 24)
  return r > 0 ? `${d}d ${r}h` : `${d}d`
}
function lateClass(h: number | null | undefined): string {
  if (h === null || h === undefined) return ''
  if (h <= 0) return 'an2-pct-good'
  if (h <= 24) return 'an2-pct-warn'
  return 'an2-pct-bad'
}
function fmtDate(v: string | null | undefined): string {
  if (!v) return '—'
  const d = new Date(v)
  if (isNaN(d.getTime())) return v
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}
function progressBar(pct: number) {
  const clamped = Math.max(0, Math.min(100, pct))
  return (
    <div className="an2-progress">
      <div className="an2-progress-bar" style={{ width: `${clamped}%` }} />
    </div>
  )
}

type SortDir = 'asc' | 'desc'
type SortKey = 'brand' | 'plan_pct' | 'report_pct' | 'gmv_shopee' | 'gmv_tiktok' | 'roas' | 'last_reported'

function ArrowIcon({ dir }: { dir: SortDir | null }) {
  if (dir === null) return <span className="an2-arrow-none">▲▼</span>
  return (
    <span className={dir === 'asc' ? 'an2-arrow-asc' : 'an2-arrow-desc'}>{dir === 'asc' ? '▲' : '▼'}</span>
  )
}

/* ─── Page ─── */
export default function AnalyticsPage() {
  const router = useRouter()
  const now = new Date()
  const [user, setUser] = useState<SessionUser | null>(null)
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [allBrands, setAllBrands] = useState<string[]>([])
  const [selBrands, setSelBrands] = useState<string[]>([])
  const [platformToggle, setPlatformToggle] = useState<PlatformToggle>('both')
  const [ddOpen, setDdOpen] = useState(false)
  const [ddSearch, setDdSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<SummaryResp | null>(null)
  const [coverage, setCoverage] = useState<CoverageResp | null>(null)
  const [expandedReport, setExpandedReport] = useState<{ brand: string; week: number } | null>(null)

  const [sortKey, setSortKey] = useState<SortKey>('brand')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const ddRef = useRef<HTMLDivElement>(null)
  const cadenceRef = useRef<HTMLCanvasElement>(null)
  const cadenceInst = useRef<unknown>(null)

  /* auth */
  useEffect(() => {
    const u = getSession()
    if (u) setUser(u)
  }, [])

  /* load brands once */
  useEffect(() => {
    if (!user) return
    fetch('/api/analytics?action=brands', { credentials: 'include' })
      .then(r => r.json())
      .then(j => setAllBrands(j.data || []))
      .catch(() => setAllBrands([]))
  }, [user])

  /* close dropdown on outside */
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ddRef.current && !ddRef.current.contains(e.target as Node)) setDdOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  /* fetch summary + coverage whenever filters change */
  const reload = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const brandsQs = selBrands.length ? `&brands=${encodeURIComponent(selBrands.join(','))}` : ''
    try {
      const [sRes, cRes] = await Promise.all([
        fetch(`/api/analytics?action=summary&month=${month}&year=${year}${brandsQs}`, {
          credentials: 'include',
        }).then(r => r.json()),
        fetch(`/api/analytics?action=coverage&month=${month}&year=${year}${brandsQs}`, {
          credentials: 'include',
        }).then(r => r.json()),
      ])
      setSummary(sRes.data || null)
      setCoverage(cRes.data || null)
    } finally {
      setLoading(false)
    }
  }, [user, month, year, selBrands])

  useEffect(() => {
    reload()
  }, [reload])

  /* daily cadence chart */
  useEffect(() => {
    if (!coverage || !cadenceRef.current) return
    let cancelled = false
    ;(async () => {
      const Chart = (await import('chart.js/auto')).default
      if (cancelled) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (cadenceInst.current) (cadenceInst.current as any).destroy()
      const labels = coverage.daily_cadence.map(d => d.date.slice(5))
      const data = coverage.daily_cadence.map(d => d.count)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const opts: any = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#94a3b8' } },
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, font: { size: 10 }, color: '#94a3b8' },
            grid: { color: 'rgba(148,163,184,0.08)' },
          },
        },
      }
      cadenceInst.current = new Chart(cadenceRef.current!, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Reports',
              data,
              borderColor: '#22d3ee',
              backgroundColor: 'rgba(34,211,238,0.15)',
              borderWidth: 2,
              tension: 0.3,
              pointRadius: 3,
              pointBackgroundColor: '#22d3ee',
              fill: true,
            },
          ],
        },
        options: opts,
      })
    })()
    return () => {
      cancelled = true
    }
  }, [coverage])

  /* brand dropdown */
  const yearsOpts: number[] = []
  for (let y = 2024; y <= now.getFullYear() + 1; y++) yearsOpts.push(y)
  const filteredDD = allBrands.filter(b => b.toLowerCase().includes(ddSearch.toLowerCase()))
  const toggleBrand = (b: string) => setSelBrands(p => (p.includes(b) ? p.filter(x => x !== b) : [...p, b]))

  /* sortable comparison rows */
  const compareRows = useMemo(() => {
    if (!summary || !coverage) return []
    const planMap: Record<string, PlanRow> = {}
    coverage.plans.forEach(p => {
      planMap[p.brand_name] = p
    })
    const reportMap: Record<string, ReportRow> = {}
    coverage.reports.forEach(r => {
      reportMap[r.brand_name] = r
    })
    const shopeeMap: Record<string, BrandRow> = {}
    summary.shopee.forEach(b => {
      shopeeMap[b.brand] = b
    })
    const tiktokMap: Record<string, BrandRow> = {}
    summary.tiktok.forEach(b => {
      tiktokMap[b.brand] = b
    })
    const expectedWeeks = coverage.summary?.expected_weeks || 4
    const brands = Array.from(
      new Set([
        ...summary.shopee.map(b => b.brand),
        ...summary.tiktok.map(b => b.brand),
        ...coverage.plans.map(p => p.brand_name),
      ]),
    )
    return brands.map(b => {
      const sh = shopeeMap[b]
      const tk = tiktokMap[b]
      const plan = planMap[b]
      const rep = reportMap[b]
      const totalGmv = (sh?.gmv || 0) + (tk?.gmv || 0)
      const totalCp = (sh?.cp || 0) + (tk?.cp || 0)
      const roas = totalCp > 0 ? totalGmv / totalCp : 0
      const reportPct = expectedWeeks > 0 ? ((rep?.weeks_count || 0) / expectedWeeks) * 100 : 0
      const lastReported =
        sh?.lastWeekEnd && tk?.lastWeekEnd
          ? sh.lastWeekEnd > tk.lastWeekEnd
            ? sh.lastWeekEnd
            : tk.lastWeekEnd
          : sh?.lastWeekEnd || tk?.lastWeekEnd || null
      return {
        brand: b,
        plan_pct: plan?.overall_pct ?? null,
        report_pct: reportPct,
        gmv_shopee: plan?.shopee_active === false ? null : sh?.gmv || 0,
        gmv_tiktok: plan?.tiktok_active === false ? null : tk?.gmv || 0,
        roas,
        last_reported: lastReported,
      }
    })
  }, [summary, coverage])

  const sortedCompareRows = useMemo(() => {
    const arr = [...compareRows]
    arr.sort((a, b) => {
      let av: number | string = 0,
        bv: number | string = 0
      switch (sortKey) {
        case 'brand':
          av = a.brand.toLowerCase()
          bv = b.brand.toLowerCase()
          break
        case 'plan_pct':
          av = a.plan_pct ?? -1
          bv = b.plan_pct ?? -1
          break
        case 'report_pct':
          av = a.report_pct
          bv = b.report_pct
          break
        case 'gmv_shopee':
          av = a.gmv_shopee ?? -1
          bv = b.gmv_shopee ?? -1
          break
        case 'gmv_tiktok':
          av = a.gmv_tiktok ?? -1
          bv = b.gmv_tiktok ?? -1
          break
        case 'roas':
          av = a.roas
          bv = b.roas
          break
        case 'last_reported':
          av = a.last_reported || ''
          bv = b.last_reported || ''
          break
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return arr
  }, [compareRows, sortKey, sortDir])

  const onSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(k)
      setSortDir('asc')
    }
  }
  const arrowFor = (k: SortKey): SortDir | null => (sortKey === k ? sortDir : null)

  function exportCSV() {
    if (!sortedCompareRows.length) return
    const headers = ['Brand', 'Plan %', 'Report %', 'GMV Shopee', 'GMV TikTok', 'ROAS', 'Last reported']
    const lines = [headers.join(',')]
    sortedCompareRows.forEach(r => {
      lines.push(
        [
          `"${r.brand}"`,
          r.plan_pct ?? '',
          r.report_pct.toFixed(0),
          r.gmv_shopee ?? '',
          r.gmv_tiktok ?? '',
          r.roas.toFixed(2),
          r.last_reported || '',
        ].join(','),
      )
    })
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${month}-${year}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const showShopee = platformToggle !== 'tiktok'
  const showTiktok = platformToggle !== 'shopee'

  const summaryTotals = summary?.totals
  const cs = coverage?.summary

  if (!user) return <HubPageSkeleton title="Đang tải analytics..." />

  /* ─── RENDER ─── */
  return (
    <>
      <div className="an2">
        <div className="an2-pageHdr">
          <div />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="an2-export" onClick={exportCSV}>
              {'⬇'} Xuất CSV
            </button>
            <button className="an2-export" onClick={() => window.print()}>
              {'⎙'} Xuất PDF
            </button>
          </div>
        </div>

        {/* FILTERS */}
        <div className="an2-filters">
          <span className="lbl">Tháng</span>
          <select className="an2-sel" value={month} onChange={e => setMonth(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>
                Tháng {m}
              </option>
            ))}
          </select>
          <span className="lbl">Năm</span>
          <select className="an2-sel" value={year} onChange={e => setYear(Number(e.target.value))}>
            {yearsOpts.map(y => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <span className="lbl">Brand</span>
          <div className="an2-brand-wrap" ref={ddRef}>
            <div className="an2-brand-trig" onClick={() => setDdOpen(o => !o)}>
              {selBrands.length === 0 ? (
                <span className="an2-tag" style={{ background: 'rgba(255,255,255,0.06)', color: '#cbd5e1' }}>
                  Tất cả ({allBrands.length})
                </span>
              ) : (
                selBrands.map(b => (
                  <span key={b} className="an2-tag">
                    {b}
                    <button
                      className="an2-tag-rm"
                      onClick={e => {
                        e.stopPropagation()
                        setSelBrands(p => p.filter(x => x !== b))
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>
            {ddOpen && (
              <div className="an2-brand-dd">
                <input
                  type="text"
                  placeholder="Tìm brand..."
                  value={ddSearch}
                  onChange={e => setDdSearch(e.target.value)}
                  onClick={e => e.stopPropagation()}
                  autoFocus
                />
                <div className="an2-brand-opt" onClick={() => setSelBrands([])}>
                  <input type="checkbox" readOnly checked={selBrands.length === 0} />
                  <span>Tất cả</span>
                </div>
                {filteredDD.map(b => (
                  <div key={b} className="an2-brand-opt" onClick={() => toggleBrand(b)}>
                    <input type="checkbox" readOnly checked={selBrands.includes(b)} />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <span className="lbl">Platform</span>
          <div className="an2-pill">
            {(['shopee', 'tiktok', 'both'] as PlatformToggle[]).map(p => (
              <button
                key={p}
                onClick={() => setPlatformToggle(p)}
                className={platformToggle === p ? 'active' : ''}
              >
                {p === 'both' ? 'Cả 2' : p}
              </button>
            ))}
          </div>
          <button className="an2-refresh" onClick={reload}>
            ↻ Refresh
          </button>
        </div>

        {loading ? (
          <div className="an2-statgrid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="an2-card">
                <Skeleton width="60%" height={32} />
                <Skeleton width="80%" height={12} style={{ marginTop: 10 }} />
              </div>
            ))}
          </div>
        ) : !allBrands.length ? (
          <div className="an2-card" style={{ textAlign: 'center', padding: 30 }}>
            <p style={{ color: '#94a3b8' }}>
              Bạn chưa được assign brand nào. Liên hệ Admin để được phân quyền.
            </p>
          </div>
        ) : (
          <>
            {/* SECTION A — Performance */}
            <div className="an2-sec">
              <span className="an2-sec-letter">A.</span>
              <div className="an2-sec-text">
                <h2>Tổng quan hiệu suất</h2>
                <p>
                  Performance overview Shopee vs TikTok — Tháng {month}/{year}
                </p>
              </div>
            </div>
            <div className="an2-perf">
              {showShopee && (
                <div className="an2-platCard">
                  <div className="an2-platHdr shopee">Shopee</div>
                  <div className="an2-platBody">
                    <div className="an2-platStat">
                      <div className="v">{fmtNum(summaryTotals?.shopee?.gmv || 0)}</div>
                      <div className="l">GMV</div>
                    </div>
                    <div className="an2-platStat">
                      <div className="v">{fmtNum(summaryTotals?.shopee?.cp || 0)}</div>
                      <div className="l">Chi phí</div>
                    </div>
                    <div className="an2-platStat">
                      <div className="v">{(summaryTotals?.shopee?.roas || 0).toFixed(2)}x</div>
                      <div className="l">ROAS TB</div>
                    </div>
                    <div className="an2-platStat">
                      <div className="v">{summaryTotals?.shopee?.activeBrands || 0}</div>
                      <div className="l">Brand active</div>
                    </div>
                  </div>
                </div>
              )}
              {showTiktok && (
                <div className="an2-platCard">
                  <div className="an2-platHdr tiktok">TikTok</div>
                  <div className="an2-platBody">
                    <div className="an2-platStat">
                      <div className="v">{fmtNum(summaryTotals?.tiktok?.gmv || 0)}</div>
                      <div className="l">GMV</div>
                    </div>
                    <div className="an2-platStat">
                      <div className="v">{fmtNum(summaryTotals?.tiktok?.cp || 0)}</div>
                      <div className="l">Chi phí</div>
                    </div>
                    <div className="an2-platStat">
                      <div className="v">{(summaryTotals?.tiktok?.roas || 0).toFixed(2)}x</div>
                      <div className="l">ROI TB</div>
                    </div>
                    <div className="an2-platStat">
                      <div className="v">{summaryTotals?.tiktok?.activeBrands || 0}</div>
                      <div className="l">Brand active</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION B — Plan Completeness */}
            <div className="an2-sec">
              <span className="an2-sec-letter">B.</span>
              <div className="an2-sec-text">
                <h2>Plan Completeness</h2>
                <p>Tỷ lệ brand đã setup plan và % field plan đã fill</p>
              </div>
            </div>
            <div className="an2-statgrid">
              <div className="an2-card">
                <div className="an2-stat-val">
                  {cs?.brands_with_plan || 0}/{cs?.total_brands || 0}
                </div>
                <div className="an2-stat-lbl">Brand đã có plan</div>
                <div className="an2-stat-sub">
                  {cs
                    ? fmtPct((cs.brands_with_plan / Math.max(1, cs.total_brands)) * 100, 0) + ' coverage'
                    : ''}
                </div>
              </div>
              <div className={`an2-card ${cs && cs.brands_without_plan > 0 ? 'err' : 'ok'}`}>
                <div className="an2-stat-val">{cs?.brands_without_plan || 0}</div>
                <div className="an2-stat-lbl">Brand chưa nhập plan</div>
              </div>
              <div className="an2-card">
                <div className="an2-stat-val">{fmtPct(cs?.avg_fill_pct, 0)}</div>
                <div className="an2-stat-lbl">% field plan fill TB</div>
                <div style={{ marginTop: 8 }}>{progressBar(cs?.avg_fill_pct || 0)}</div>
              </div>
              <div className="an2-card">
                <div className="an2-stat-val">
                  {coverage?.plans.filter(p => p.has_plan && p.overall_pct !== null && p.overall_pct < 50)
                    .length || 0}
                </div>
                <div className="an2-stat-lbl">Plan &lt; 50% fill</div>
              </div>
            </div>
            <div className="an2-table-wrap">
              <table className="an2-tbl">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Brand</th>
                    <th>Shopee plan</th>
                    <th>TikTok plan</th>
                    <th style={{ textAlign: 'left' }}>Thiếu</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(coverage?.plans || []).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="an2-empty">
                        —
                      </td>
                    </tr>
                  ) : (
                    coverage!.plans.map(p => (
                      <tr key={p.brand_name}>
                        <td className="left">
                          <span className={`an2-pbadge ${p.has_plan ? 'yes' : 'no'}`}>
                            {p.has_plan ? 'Có' : 'Chưa'}
                          </span>
                          {p.brand_name}
                        </td>
                        <td>
                          {p.shopee_active ? (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                justifyContent: 'center',
                              }}
                            >
                              <span
                                className={pctClass(p.shopee_pct)}
                                style={{ minWidth: 36, fontSize: '.78rem' }}
                              >
                                {fmtPct(p.shopee_pct, 0)}
                              </span>
                              <div style={{ width: 70 }}>{progressBar(p.shopee_pct ?? 0)}</div>
                            </div>
                          ) : (
                            <span className="muted" style={{ fontStyle: 'italic' }}>
                              Không chạy
                            </span>
                          )}
                        </td>
                        <td>
                          {p.tiktok_active ? (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                justifyContent: 'center',
                              }}
                            >
                              <span
                                className={pctClass(p.tiktok_pct)}
                                style={{ minWidth: 36, fontSize: '.78rem' }}
                              >
                                {fmtPct(p.tiktok_pct, 0)}
                              </span>
                              <div style={{ width: 70 }}>{progressBar(p.tiktok_pct ?? 0)}</div>
                            </div>
                          ) : (
                            <span className="muted" style={{ fontStyle: 'italic' }}>
                              Không chạy
                            </span>
                          )}
                        </td>
                        <td className="left muted" style={{ fontSize: '.74rem' }}>
                          {p.missing_keys.length === 0 ? (
                            <span className="an2-pct-good">—</span>
                          ) : (
                            p.missing_keys.slice(0, 4).join(', ') +
                            (p.missing_keys.length > 4 ? `, +${p.missing_keys.length - 4}` : '')
                          )}
                        </td>
                        <td>
                          <Link
                            href={`/hub/report?brand=${encodeURIComponent(p.brand_name)}&month=${month}&year=${year}&openPlan=1`}
                            className="an2-link"
                          >
                            → Set plan
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* SECTION C — Report Completeness */}
            <div className="an2-sec">
              <span className="an2-sec-letter">C.</span>
              <div className="an2-sec-text">
                <h2>Report Completeness</h2>
                <p>Heatmap tuần, missing reports, độ trễ</p>
              </div>
            </div>
            <div className="an2-statgrid">
              <div className="an2-card">
                <div className="an2-stat-val">
                  {cs?.total_actual_reports || 0}/{cs?.total_expected_reports || 0}
                </div>
                <div className="an2-stat-lbl">Reports nộp</div>
                <div className="an2-stat-sub">
                  {cs && cs.total_expected_reports > 0
                    ? fmtPct((cs.total_actual_reports / cs.total_expected_reports) * 100, 0)
                    : '—'}
                </div>
              </div>
              <div className={`an2-card ${cs && cs.missing_reports > 0 ? 'err' : 'ok'}`}>
                <div className="an2-stat-val">{cs?.missing_reports || 0}</div>
                <div className="an2-stat-lbl">Reports missing</div>
              </div>
              <div className="an2-card">
                <div className="an2-stat-val">{fmtLateHours(cs?.avg_late_hours)}</div>
                <div className="an2-stat-lbl">Trễ trung bình</div>
              </div>
              <div className="an2-card">
                <div className="an2-stat-val">{cs?.expected_weeks || 0}</div>
                <div className="an2-stat-lbl">Tuần expected</div>
              </div>
            </div>
            <div className="an2-table-wrap">
              <table className="an2-tbl">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Brand</th>
                    <th>W1</th>
                    <th>W2</th>
                    <th>W3</th>
                    <th>W4</th>
                    <th>W5</th>
                    <th>Trễ TB</th>
                  </tr>
                </thead>
                <tbody>
                  {(coverage?.reports || []).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="an2-empty">
                        —
                      </td>
                    </tr>
                  ) : (
                    coverage!.reports.map(r => {
                      const cells: { num: number; ok: boolean }[] = [
                        { num: 1, ok: r.weeks.w1 },
                        { num: 2, ok: r.weeks.w2 },
                        { num: 3, ok: r.weeks.w3 },
                        { num: 4, ok: r.weeks.w4 },
                        { num: 5, ok: r.weeks.w5 },
                      ]
                      return (
                        <Fragment key={r.brand_name}>
                          <tr>
                            <td className="left">{r.brand_name}</td>
                            {cells.map(c => (
                              <td key={c.num}>
                                <button
                                  className={`an2-heatcell ${c.ok ? 'ok' : 'bad'}`}
                                  onClick={() =>
                                    setExpandedReport(prev =>
                                      prev && prev.brand === r.brand_name && prev.week === c.num
                                        ? null
                                        : { brand: r.brand_name, week: c.num },
                                    )
                                  }
                                  title={c.ok ? 'Đã có report' : 'Missing'}
                                >
                                  {c.ok ? '✓' : '✗'}
                                </button>
                              </td>
                            ))}
                            <td>
                              <span className={lateClass(r.late_hours_avg)}>
                                {fmtLateHours(r.late_hours_avg)}
                              </span>
                            </td>
                          </tr>
                          {expandedReport && expandedReport.brand === r.brand_name && (
                            <tr>
                              <td colSpan={7} className="left">
                                <div className="an2-detail">
                                  <strong>
                                    W{expandedReport.week} — {r.brand_name}
                                  </strong>
                                  {(() => {
                                    const entries = r.detail[expandedReport.week] || []
                                    if (!entries.length)
                                      return (
                                        <div style={{ color: '#64748b', fontStyle: 'italic', marginTop: 6 }}>
                                          Chưa có report tuần này.
                                        </div>
                                      )
                                    return (
                                      <table className="an2-tbl" style={{ marginTop: 10 }}>
                                        <thead>
                                          <tr>
                                            <th style={{ textAlign: 'left' }}>User</th>
                                            <th>Created</th>
                                            <th>Week end</th>
                                            <th>Có data?</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {entries.map((e, i) => (
                                            <tr key={i}>
                                              <td className="left">{e.username}</td>
                                              <td>{fmtDate(e.created_at)}</td>
                                              <td>{fmtDate(e.week_end)}</td>
                                              <td>
                                                {e.has_data ? (
                                                  <span className="an2-pct-good">Có</span>
                                                ) : (
                                                  <span className="an2-pct-bad">Trống</span>
                                                )}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    )
                                  })()}
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* SECTION D — Data Consistency */}
            <div className="an2-sec">
              <span className="an2-sec-letter">D.</span>
              <div className="an2-sec-text">
                <h2>Data Consistency</h2>
                <p>Row weekly_reports có chi phí + revenue nhưng thiếu engagement data</p>
              </div>
            </div>
            <div className="an2-table-wrap">
              <table className="an2-tbl">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Brand</th>
                    <th style={{ textAlign: 'left' }}>Tuần</th>
                    <th style={{ textAlign: 'left' }}>User</th>
                    <th style={{ textAlign: 'left' }}>Group</th>
                    <th style={{ textAlign: 'left' }}>Missing</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(coverage?.consistency || []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="an2-empty an2-pct-good">
                        Không có row inconsistent
                      </td>
                    </tr>
                  ) : (
                    coverage!.consistency.map((c, i) => (
                      <tr key={i}>
                        <td className="left">{c.brand_name}</td>
                        <td className="left">W{c.week_num}</td>
                        <td className="left">{c.username}</td>
                        <td className="left">{c.group}</td>
                        <td className="left an2-pct-bad" style={{ fontSize: '.78rem' }}>
                          {c.issues.join(', ')}
                        </td>
                        <td>
                          <Link
                            href={`/hub/report?brand=${encodeURIComponent(c.brand_name)}`}
                            className="an2-link"
                          >
                            → Sửa
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* SECTION E — Report Timing */}
            <div className="an2-sec">
              <span className="an2-sec-letter">E.</span>
              <div className="an2-sec-text">
                <h2>Report Timing</h2>
                <p>Cadence theo user và theo ngày trong tháng</p>
              </div>
            </div>
            <div className="an2-twocol">
              <div className="an2-card" style={{ padding: 0 }}>
                <div className="an2-block-hdr">Per-user timing</div>
                <div className="an2-table-wrap" style={{ border: 0 }}>
                  <table className="an2-tbl">
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left' }}>User</th>
                        <th>Reports</th>
                        <th>Trễ TB</th>
                        <th>% On-time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(coverage?.timing || []).length === 0 ? (
                        <tr>
                          <td colSpan={4} className="an2-empty">
                            —
                          </td>
                        </tr>
                      ) : (
                        coverage!.timing.map((t, i) => {
                          const isLate = t.avg_delay_hours > 0
                          return (
                            <tr
                              key={t.username}
                              style={{ background: i === 0 && isLate ? 'rgba(245,158,11,0.08)' : undefined }}
                            >
                              <td className="left">
                                {t.username}
                                {i === 0 && isLate ? (
                                  <span
                                    style={{
                                      marginLeft: 6,
                                      fontSize: '.7rem',
                                      color: '#fbbf24',
                                      fontWeight: 700,
                                    }}
                                  >
                                    ● Slowest
                                  </span>
                                ) : null}
                              </td>
                              <td>{t.count}</td>
                              <td>
                                <span className={lateClass(t.avg_delay_hours)}>
                                  {fmtLateHours(t.avg_delay_hours)}
                                </span>
                              </td>
                              <td>
                                <span className={pctClass(t.on_time_pct)}>{fmtPct(t.on_time_pct, 0)}</span>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="an2-card" style={{ padding: 0 }}>
                <div className="an2-block-hdr">Daily report cadence</div>
                <div className="an2-chart-wrap">
                  <canvas ref={cadenceRef} />
                </div>
              </div>
            </div>

            {/* SECTION F — Brand Comparison */}
            <div className="an2-sec">
              <span className="an2-sec-letter">F.</span>
              <div className="an2-sec-text">
                <h2>Brand Comparison</h2>
                <p>Click cột header để sort. Default: Brand asc.</p>
              </div>
            </div>
            <div className="an2-table-wrap">
              <table className="an2-tbl">
                <thead>
                  <tr>
                    <th className="sortable" onClick={() => onSort('brand')} style={{ textAlign: 'left' }}>
                      Brand <ArrowIcon dir={arrowFor('brand')} />
                    </th>
                    <th className="sortable" onClick={() => onSort('plan_pct')}>
                      Plan % <ArrowIcon dir={arrowFor('plan_pct')} />
                    </th>
                    <th className="sortable" onClick={() => onSort('report_pct')}>
                      Report % <ArrowIcon dir={arrowFor('report_pct')} />
                    </th>
                    <th className="sortable" onClick={() => onSort('gmv_shopee')}>
                      GMV Shopee <ArrowIcon dir={arrowFor('gmv_shopee')} />
                    </th>
                    <th className="sortable" onClick={() => onSort('gmv_tiktok')}>
                      GMV TikTok <ArrowIcon dir={arrowFor('gmv_tiktok')} />
                    </th>
                    <th className="sortable" onClick={() => onSort('roas')}>
                      ROAS <ArrowIcon dir={arrowFor('roas')} />
                    </th>
                    <th className="sortable" onClick={() => onSort('last_reported')}>
                      Last reported <ArrowIcon dir={arrowFor('last_reported')} />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCompareRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="an2-empty">
                        Không có dữ liệu
                      </td>
                    </tr>
                  ) : (
                    sortedCompareRows.map(r => (
                      <tr key={r.brand}>
                        <td className="left">{r.brand}</td>
                        <td>
                          <span className={pctClass(r.plan_pct)}>{fmtPct(r.plan_pct, 0)}</span>
                        </td>
                        <td>
                          <span className={pctClass(r.report_pct)}>{fmtPct(r.report_pct, 0)}</span>
                        </td>
                        <td>
                          {r.gmv_shopee === null ? <span className="muted">—</span> : fmtNum(r.gmv_shopee)}
                        </td>
                        <td>
                          {r.gmv_tiktok === null ? <span className="muted">—</span> : fmtNum(r.gmv_tiktok)}
                        </td>
                        <td>{r.roas > 0 ? r.roas.toFixed(2) + 'x' : '—'}</td>
                        <td>{fmtDate(r.last_reported)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  )
}
