'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession, clearSession, setSession, SessionUser } from '@/lib/auth'
import InternalLayout from '@/components/InternalLayout'
import '@/app/dashboard/dashboard.css'
import '@/app/hub/analytics/analytics.css'

interface Attempt {
  id?: string
  username: string
  name: string | null
  quiz_type: string | null
  topic: string | null
  score: number | null
  total: number | null
  percentage: number | null
  duration_min: number | null
  quiz_date: string | null
  created_at: string
}
interface ScoresResp {
  summary: {
    total_attempts: number
    avg_pct: number
    top_user: { username: string; name: string; pct: number } | null
    active_users: number
  }
  distribution: { range: string; count: number }[]
  topUsers: { username: string; name: string; avg_pct: number; attempts: number }[]
  matrix: {
    users: { username: string; name: string }[]
    topics: string[]
    scores: Record<string, Record<string, number>>
  }
  attempts: Attempt[]
}

interface UserRow { username: string; name: string; role: string }

function fmtDateVN(s: string) {
  if (!s) return '—'
  const d = new Date(s)
  if (isNaN(d.getTime())) return s
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

function pctClass(p: number) {
  if (p >= 85) return 'an2-pct-good'
  if (p >= 70) return 'an2-pct-warn'
  return 'an2-pct-bad'
}
function pctBg(p: number) {
  if (p >= 85) return 'rgba(16,185,129,0.18)'
  if (p >= 70) return 'rgba(245,158,11,0.16)'
  return 'rgba(239,68,68,0.16)'
}

export default function ScoresPage() {
  const router = useRouter()
  const [user, setUser] = useState<SessionUser | null>(null)

  // Filters — default last 30 days
  const today = new Date()
  const last30 = new Date(today); last30.setDate(today.getDate() - 30)
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const [fromDate, setFromDate] = useState(fmt(last30))
  const [toDate, setToDate] = useState(fmt(today))
  const [quizType, setQuizType] = useState<string>('')
  const [filterUser, setFilterUser] = useState<string>('')
  const [users, setUsers] = useState<UserRow[]>([])

  const [data, setData] = useState<ScoresResp | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20

  const distChartRef = useRef<HTMLCanvasElement>(null)
  const distChartInst = useRef<unknown>(null)
  const topChartRef = useRef<HTMLCanvasElement>(null)
  const topChartInst = useRef<unknown>(null)

  /* Auth */
  useEffect(() => {
    const u = getSession()
    if (!u) { router.replace('/'); return }
    setUser(u)
    fetch('/api/auth').then(r => r.json()).then(({ user: su }) => {
      if (su) { setSession(su); setUser(su) }
    }).catch(() => {})
  }, [router])

  async function logout() {
    try { await fetch('/api/auth', { method: 'DELETE' }) } catch {}
    clearSession()
    router.push('/')
  }

  /* Load users list (admin only) */
  useEffect(() => {
    if (!user || user.role !== 'admin') return
    fetch('/api/users').then(r => r.json()).then(j => {
      setUsers((j.users || []).filter((u: UserRow) => u.role !== 'upbase'))
    }).catch(() => setUsers([]))
  }, [user])

  /* Load data */
  useEffect(() => {
    if (!user) return
    setLoading(true)
    const params = new URLSearchParams()
    if (fromDate) params.set('fromDate', fromDate)
    if (toDate) params.set('toDate', toDate)
    if (quizType) params.set('quizType', quizType)
    if (filterUser) params.set('username', filterUser)
    fetch(`/api/scores?${params.toString()}`, { credentials: 'include' })
      .then(r => r.json())
      .then(j => { setData(j); setPage(1) })
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [user, fromDate, toDate, quizType, filterUser])

  /* Distribution chart */
  useEffect(() => {
    if (!data || !distChartRef.current) return
    let cancelled = false
    ;(async () => {
      const Chart = (await import('chart.js/auto')).default
      if (cancelled) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (distChartInst.current) (distChartInst.current as any).destroy()
      const colors = ['#ef4444', '#f59e0b', '#22d3ee', '#10b981']
      distChartInst.current = new Chart(distChartRef.current!, {
        type: 'bar',
        data: {
          labels: data.distribution.map(d => d.range),
          datasets: [{
            label: 'Số bài',
            data: data.distribution.map(d => d.count),
            backgroundColor: colors,
            borderRadius: 6,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: '#94a3b8', font: { size: 11 } }, grid: { display: false } },
            y: { ticks: { color: '#94a3b8', stepSize: 1, precision: 0 }, grid: { color: 'rgba(148,163,184,0.08)' }, beginAtZero: true },
          },
        },
      })
    })()
    return () => { cancelled = true }
  }, [data])

  /* Top users chart */
  useEffect(() => {
    if (!data || !topChartRef.current) return
    let cancelled = false
    ;(async () => {
      const Chart = (await import('chart.js/auto')).default
      if (cancelled) return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (topChartInst.current) (topChartInst.current as any).destroy()
      const items = data.topUsers
      topChartInst.current = new Chart(topChartRef.current!, {
        type: 'bar',
        data: {
          labels: items.map(u => u.name),
          datasets: [{
            label: 'Điểm trung bình (%)',
            data: items.map(u => u.avg_pct),
            backgroundColor: items.map(u => u.avg_pct >= 85 ? '#10b981' : u.avg_pct >= 70 ? '#22d3ee' : '#f59e0b'),
            borderRadius: 6,
          }],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { max: 100, ticks: { color: '#94a3b8', font: { size: 10 }, callback: (v) => v + '%' }, grid: { color: 'rgba(148,163,184,0.08)' } },
            y: { ticks: { color: '#cbd5e1', font: { size: 11 } }, grid: { display: false } },
          },
        },
      })
    })()
    return () => { cancelled = true }
  }, [data])

  /* Pagination slice */
  const attempts = data?.attempts || []
  const pages = Math.max(1, Math.ceil(attempts.length / PAGE_SIZE))
  const slice = useMemo(() => attempts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [attempts, page])

  /* Quiz types options derived from data */
  const quizTypes = useMemo(() => {
    const s = new Set<string>()
    attempts.forEach(a => { if (a.quiz_type) s.add(a.quiz_type) })
    return Array.from(s)
  }, [attempts])

  if (!user) return null

  const isAdmin = user.role === 'admin'

  return (
    <InternalLayout user={user} onLogout={logout} greeting="Bảng điểm Team" subline="Tổng hợp điểm quiz toàn team.">
      <div className="an2">
        <div className="an2-pageHdr">
          <div>
            <h1>Bảng điểm Team</h1>
            <p>{isAdmin ? 'Tổng hợp điểm quiz toàn team. Filter theo quiz, ngày, user.' : 'Lịch sử điểm quiz của bạn.'}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="an2-filters">
          <span className="lbl">Quiz</span>
          <select className="an2-sel" value={quizType} onChange={e => setQuizType(e.target.value)}>
            <option value="">Tất cả</option>
            {quizTypes.map(q => <option key={q} value={q}>{q}</option>)}
          </select>
          <span className="lbl">Từ ngày</span>
          <input className="an2-sel" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          <span className="lbl">Đến</span>
          <input className="an2-sel" type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
          {isAdmin && (
            <>
              <span className="lbl">User</span>
              <select className="an2-sel" value={filterUser} onChange={e => setFilterUser(e.target.value)}>
                <option value="">Tất cả</option>
                {users.map(u => <option key={u.username} value={u.username}>{u.name}</option>)}
              </select>
            </>
          )}
          <button className="an2-refresh" onClick={() => {
            setFromDate(fmt(last30)); setToDate(fmt(today)); setQuizType(''); setFilterUser('')
          }}>↻ Reset</button>
        </div>

        {loading ? (
          <div className="an2-card" style={{ textAlign: 'center', padding: 40 }}>
            <p style={{ color: '#94a3b8' }}>Đang tải...</p>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="an2-statgrid">
              <div className="an2-card">
                <div className="an2-stat-val">{data?.summary.total_attempts || 0}</div>
                <div className="an2-stat-lbl">Tổng số bài đã làm</div>
              </div>
              <div className="an2-card">
                <div className="an2-stat-val">{data?.summary.avg_pct || 0}%</div>
                <div className="an2-stat-lbl">Điểm trung bình</div>
              </div>
              <div className="an2-card">
                <div className="an2-stat-val" style={{ fontSize: '1.5rem' }}>
                  {data?.summary.top_user?.name || '—'}
                </div>
                <div className="an2-stat-lbl">Top performer</div>
                <div className="an2-stat-sub">{data?.summary.top_user ? data.summary.top_user.pct + '%' : ''}</div>
              </div>
              <div className="an2-card">
                <div className="an2-stat-val">{data?.summary.active_users || 0}</div>
                <div className="an2-stat-lbl">User active</div>
              </div>
            </div>

            {/* Distribution + Top */}
            <div className="an2-twocol">
              <div className="an2-card" style={{ padding: 0 }}>
                <div className="an2-block-hdr">Phân bố điểm</div>
                <div className="an2-chart-wrap" style={{ height: 260 }}>
                  <canvas ref={distChartRef} />
                </div>
              </div>
              <div className="an2-card" style={{ padding: 0 }}>
                <div className="an2-block-hdr">Top 10 users</div>
                <div className="an2-chart-wrap" style={{ height: 260 }}>
                  {(data?.topUsers || []).length === 0 ? (
                    <div className="an2-empty">Chưa có dữ liệu.</div>
                  ) : <canvas ref={topChartRef} />}
                </div>
              </div>
            </div>

            {/* Matrix */}
            <div className="an2-sec">
              <span className="an2-sec-letter">M.</span>
              <div className="an2-sec-text">
                <h2>Score by user × topic</h2>
                <p>Điểm % cao nhất user đạt được cho mỗi topic.</p>
              </div>
            </div>
            <div className="an2-table-wrap">
              <table className="an2-tbl">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>User</th>
                    {(data?.matrix.topics || []).map(t => <th key={t}>{t}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {(data?.matrix.users || []).length === 0 ? (
                    <tr><td colSpan={1 + (data?.matrix.topics.length || 0)} className="an2-empty">Không có dữ liệu</td></tr>
                  ) : data!.matrix.users.map(u => (
                    <tr key={u.username}>
                      <td className="left">{u.name}</td>
                      {data!.matrix.topics.map(t => {
                        const v = data!.matrix.scores[u.username]?.[t]
                        if (v === undefined) return <td key={t} className="muted">—</td>
                        return (
                          <td key={t} style={{ background: pctBg(v), fontWeight: 700 }}>
                            <span className={pctClass(v)}>{v}%</span>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* History */}
            <div className="an2-sec">
              <span className="an2-sec-letter">H.</span>
              <div className="an2-sec-text">
                <h2>Lịch sử chi tiết</h2>
                <p>Tất cả lần làm bài trong khoảng thời gian đã chọn.</p>
              </div>
            </div>
            <div className="an2-table-wrap">
              <table className="an2-tbl">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>User</th>
                    <th style={{ textAlign: 'left' }}>Quiz</th>
                    <th style={{ textAlign: 'left' }}>Topic</th>
                    <th>Score</th>
                    <th>%</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {slice.length === 0 ? (
                    <tr><td colSpan={6} className="an2-empty">Không có bài làm nào</td></tr>
                  ) : slice.map((r, i) => {
                    const p = r.percentage ?? (r.total ? Math.round((r.score || 0) / r.total * 100) : 0)
                    return (
                      <tr key={r.id || `${r.username}-${i}-${r.created_at}`}>
                        <td className="left">{r.name || r.username}</td>
                        <td className="left">{r.quiz_type || '—'}</td>
                        <td className="left">{r.topic || '—'}</td>
                        <td>{r.score ?? 0}/{r.total ?? 0}</td>
                        <td><span className={pctClass(p)}>{p}%</span></td>
                        <td>{fmtDateVN(r.created_at)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 14 }}>
                <button className="an2-refresh" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>←</button>
                <span style={{ alignSelf: 'center', color: '#94a3b8', fontSize: '.85rem' }}>Trang {page}/{pages}</span>
                <button className="an2-refresh" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page >= pages}>→</button>
              </div>
            )}
          </>
        )}
      </div>
    </InternalLayout>
  )
}
