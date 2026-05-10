'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSession, SessionUser, initials } from '@/lib/auth'
import { HubPageSkeleton } from '@/components/Skeleton'
import './dashboard.css'

type CardDef = {
  key: string
  icon: JSX.Element
  title: string
  desc: string
  badge: 'ready' | 'open' | 'soon' | 'new'
  badgeText: string
  url?: string
  fn?: 'scores' | 'my-scores'
  disabled?: boolean
}

const ICON = {
  quiz: (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  task: (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <polyline points="9 14 11 16 15 12" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="16" y1="2" x2="16" y2="6" />
    </svg>
  ),
  score: (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  ),
  users: (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
    </svg>
  ),
  report: (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  analytics: (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  sop: (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  ),
  kb: (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  arrow: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  ),
}

interface DashStats {
  quizzes_done: number
  tasks_done: number
  active_users: number
  completion_rate: number
}
interface DashData {
  stats: DashStats
  weekChart: { thisWeek: number[]; lastWeek: number[] }
  recentActivity: Array<{
    type: string
    user_name: string
    action_text: string
    timestamp: string
    ago?: string
  }>
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<SessionUser | null>(null)
  const [data, setData] = useState<DashData | null>(null)
  const [scores, setScores] = useState<Record<string, unknown>[] | null>(null)
  const [loadingScores, setLoadingScores] = useState(false)
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<any>(null)

  useEffect(() => {
    const u = getSession()
    if (u) setUser(u)
  }, [])

  useEffect(() => {
    if (!user) return
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(setData)
      .catch(() =>
        setData({
          stats: { quizzes_done: 0, tasks_done: 0, active_users: 0, completion_rate: 0 },
          weekChart: { thisWeek: [0, 0, 0, 0, 0, 0, 0], lastWeek: [0, 0, 0, 0, 0, 0, 0] },
          recentActivity: [],
        }),
      )
  }, [user])

  // Render chart
  useEffect(() => {
    if (!data || !chartRef.current) return
    let cancelled = false
    ;(async () => {
      const Chart = (await import('chart.js/auto')).default
      if (cancelled || !chartRef.current) return
      if (chartInstance.current) chartInstance.current.destroy()
      const labels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
      chartInstance.current = new Chart(chartRef.current, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Tuần này',
              data: data.weekChart.thisWeek,
              borderColor: '#22d3ee',
              backgroundColor: 'rgba(34, 211, 238, 0.12)',
              fill: true,
              tension: 0.35,
              borderWidth: 2.4,
              pointRadius: 3,
              pointBackgroundColor: '#22d3ee',
            },
            {
              label: 'Tuần trước',
              data: data.weekChart.lastWeek,
              borderColor: '#94a3b8',
              borderDash: [5, 4],
              backgroundColor: 'transparent',
              fill: false,
              tension: 0.35,
              borderWidth: 1.6,
              pointRadius: 2,
              pointBackgroundColor: '#94a3b8',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: '#cbd5e1', boxWidth: 12, font: { size: 11 } },
              position: 'bottom',
            },
          },
          scales: {
            x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { display: false } },
            y: {
              ticks: { color: '#64748b', font: { size: 10 }, precision: 0 },
              grid: { color: 'rgba(148,163,184,0.08)' },
              beginAtZero: true,
            },
          },
        },
      })
    })()
    return () => {
      cancelled = true
      if (chartInstance.current) {
        chartInstance.current.destroy()
        chartInstance.current = null
      }
    }
  }, [data])

  async function loadScores(onlyMe: boolean) {
    setLoadingScores(true)
    const url = onlyMe ? `/api/quiz?username=${user?.username}` : '/api/quiz'
    try {
      const j = await fetch(url).then(r => r.json())
      setScores(j.data || [])
    } catch {
      setScores([])
    }
    setLoadingScores(false)
    setTimeout(() => document.getElementById('scores')?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  if (!user) {
    return <HubPageSkeleton title="Đang tải dashboard..." />
  }

  const isAdmin = user.role === 'admin'

  const adminCards: CardDef[] = [
    {
      key: 'quiz',
      icon: ICON.quiz,
      title: 'Quiz Hub',
      desc: 'Làm bài kiểm tra Dạng 1 & Dạng 2.',
      badge: 'ready',
      badgeText: 'Sẵn sàng',
      url: '/quiz',
    },
    {
      key: 'tasks',
      icon: ICON.task,
      title: 'Daily Tasks',
      desc: 'Xem và quản lý task hàng ngày.',
      badge: 'open',
      badgeText: 'Mở',
      url: '/hub/tasks',
    },
    {
      key: 'score',
      icon: ICON.score,
      title: 'Bảng điểm Team',
      desc: 'Xem điểm quiz của tất cả thành viên.',
      badge: 'open',
      badgeText: 'Xem ngay',
      url: '/hub/scores',
    },
    {
      key: 'users',
      icon: ICON.users,
      title: 'Quản lý thành viên',
      desc: 'Tạo, sửa, phân quyền tài khoản.',
      badge: 'open',
      badgeText: 'Mở',
      url: '/hub/users',
    },
    {
      key: 'report',
      icon: ICON.report,
      title: 'Weekly Report',
      desc: 'Nhập data → AI nhận xét → Copy Lark.',
      badge: 'open',
      badgeText: 'Mở',
      url: '/hub/report',
    },
    {
      key: 'analytics',
      icon: ICON.analytics,
      title: 'Analytics',
      desc: 'Thống kê performance report theo brand.',
      badge: 'open',
      badgeText: 'Mở',
      url: '/hub/analytics',
    },
    {
      key: 'sop',
      icon: ICON.sop,
      title: 'SOP & Resources',
      desc: 'Tài liệu, template, checklist nội bộ.',
      badge: 'open',
      badgeText: 'Mở',
      url: '/hub/sop',
    },
    {
      key: 'kb',
      icon: ICON.kb,
      title: 'Knowledge Base',
      desc: 'Tìm kiếm kiến thức & hướng dẫn.',
      badge: 'open',
      badgeText: 'Khám phá',
      url: '/hub/sop',
    },
  ]

  const memberCards: CardDef[] = [
    {
      key: 'quiz',
      icon: ICON.quiz,
      title: 'Quiz Hub',
      desc: 'Làm bài kiểm tra kiến thức.',
      badge: 'ready',
      badgeText: 'Sẵn sàng',
      url: '/quiz',
    },
    {
      key: 'tasks',
      icon: ICON.task,
      title: 'Daily Tasks',
      desc: 'Xem task hàng ngày được assign.',
      badge: 'open',
      badgeText: 'Mở',
      url: '/hub/tasks',
    },
    {
      key: 'score',
      icon: ICON.score,
      title: 'Kết quả của tôi',
      desc: 'Xem lịch sử điểm các bài đã làm.',
      badge: 'open',
      badgeText: 'Xem',
      url: '/hub/scores',
    },
    {
      key: 'report',
      icon: ICON.report,
      title: 'Weekly Report',
      desc: 'Nhập data → AI nhận xét → Copy Lark.',
      badge: 'open',
      badgeText: 'Mở',
      url: '/hub/report',
    },
    {
      key: 'analytics',
      icon: ICON.analytics,
      title: 'Analytics',
      desc: 'Thống kê performance report theo brand.',
      badge: 'open',
      badgeText: 'Mở',
      url: '/hub/analytics',
    },
    {
      key: 'sop',
      icon: ICON.sop,
      title: 'SOP & Resources',
      desc: 'Tài liệu, template nội bộ.',
      badge: 'open',
      badgeText: 'Mở',
      url: '/hub/sop',
    },
    {
      key: 'kb',
      icon: ICON.kb,
      title: 'Knowledge Base',
      desc: 'Tìm kiếm kiến thức & hướng dẫn.',
      badge: 'open',
      badgeText: 'Khám phá',
      url: '/hub/sop',
    },
  ]

  const cards = isAdmin ? adminCards : memberCards
  const stats = data?.stats

  function CardEl({ c }: { c: CardDef }) {
    const onClick = () => {
      if (c.disabled) return
      if (c.url) router.push(c.url)
      else if (c.fn === 'scores') loadScores(false)
      else if (c.fn === 'my-scores') loadScores(true)
    }
    return (
      <div className={`dCard${c.disabled ? ' disabled' : ''}`} onClick={onClick}>
        <div className="dcRow">
          <div className="dcIcon">{c.icon}</div>
          <div className="dcArrow">{ICON.arrow}</div>
        </div>
        <div className="dcTitle">{c.title}</div>
        <div className="dcDesc">{c.desc}</div>
        <span className={`dcBadge ${c.badge}`}>{c.badgeText}</span>
      </div>
    )
  }

  const notifications = [
    {
      icon: '✉️',
      title: 'Weekly Report đang mở để nhập liệu',
      sub: 'Hãy submit báo cáo brand của bạn trước thứ 6.',
      date: 'Hôm nay',
      cls: 'b1',
    },
    {
      icon: '📋',
      title: 'Quiz Dạng 2 đã cập nhật câu hỏi mới',
      sub: 'Vào Quiz Hub để thử bài kiểm tra mới nhất.',
      date: 'Hôm qua',
      cls: 'b2',
    },
    {
      icon: '📅',
      title: 'Training nội bộ — Thứ 6, lúc 10:00 AM',
      sub: 'Chủ đề: Optimize ROAS cho TikTok Shop.',
      date: '3 ngày tới',
      cls: 'b3',
    },
  ]

  return (
    <>
      {/* Cards grid */}
      <div className="dashCardsGrid">
        {cards.map(c => (
          <CardEl key={c.key} c={c} />
        ))}
      </div>

      {/* Quick stats */}
      <div className="statsBlock">
        <div className="statsHeader">
          <div>
            <h2>Tổng quan nhanh</h2>
            <p>Hiệu suất hoạt động của team trong tuần.</p>
          </div>
        </div>
        <div className="statsGrid">
          <div className="statsLeft">
            <div className="statCard">
              <div className="statHead">
                <span className="si">{ICON.quiz}</span> Bài quiz đã hoàn thành
              </div>
              <div className="statValue">{stats?.quizzes_done ?? '—'}</div>
              <div className="statTrend">↑ Tổng tích luỹ</div>
            </div>
            <div className="statCard">
              <div className="statHead">
                <span className="si">{ICON.task}</span> Tasks đã hoàn thành
              </div>
              <div className="statValue">{stats?.tasks_done ?? '—'}</div>
              <div className="statTrend">↑ Tổng tích luỹ</div>
            </div>
            <div className="statCard">
              <div className="statHead">
                <span className="si">{ICON.users}</span> Thành viên hoạt động
              </div>
              <div className="statValue">{stats?.active_users ?? '—'}</div>
              <div className="statTrend">→ Hiện tại</div>
            </div>
            <div className="statCard">
              <div className="statHead">
                <span className="si">{ICON.report}</span> Tỷ lệ hoàn thành
              </div>
              <div className="statValue">{stats?.completion_rate ?? 0}%</div>
              <div className="statTrend">Reports / Users</div>
            </div>
          </div>
          <div className="chartBox">
            <h3>Hiệu suất tuần này vs tuần trước</h3>
            <div className="chartCanvas">
              <canvas ref={chartRef} />
            </div>
          </div>
        </div>
      </div>

      {/* Activity + Notifications */}
      <div className="bottomGrid">
        <div className="panel">
          <div className="panelHead">
            <h3>Hoạt động gần đây</h3>
            <Link href="/hub/analytics">Xem tất cả</Link>
          </div>
          {data?.recentActivity && data.recentActivity.length > 0 ? (
            data.recentActivity.map((a, i) => (
              <div key={i} className="actItem">
                <div className="actAvatar">{initials(a.user_name)}</div>
                <div className="actBody">
                  <div className="actText">
                    <b>{a.user_name}</b> {a.action_text}
                  </div>
                  <div className="actTime">{a.ago || ''}</div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ color: '#94a3b8', fontSize: '0.85rem', padding: '12px 0' }}>
              {data ? 'Chưa có hoạt động nào.' : 'Đang tải...'}
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panelHead">
            <h3>Thông báo</h3>
            <a href="#">Xem tất cả</a>
          </div>
          {notifications.map((n, i) => (
            <div key={i} className="notifItem">
              <div className={`notifIcon ${n.cls}`}>{n.icon}</div>
              <div className="notifBody">
                <div className="notifTitle">{n.title}</div>
                <div className="notifSub">{n.sub}</div>
              </div>
              <div className="notifDate">{n.date}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scores section (legacy feature) */}
      {(scores !== null || loadingScores) && (
        <div id="scores" className="scoresBlock">
          <div className="panelHead">
            <h2>Bảng điểm Quiz</h2>
            <button
              onClick={() => setScores(null)}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#cbd5e1',
                padding: '6px 14px',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              Đóng
            </button>
          </div>
          {loadingScores ? (
            <div style={{ color: '#94a3b8', padding: '12px 0' }}>Đang tải...</div>
          ) : scores && scores.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                <thead>
                  <tr style={{ color: '#94a3b8', textAlign: 'left' }}>
                    <th style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      Thành viên
                    </th>
                    <th style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      Chủ đề
                    </th>
                    <th style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      Điểm
                    </th>
                    <th style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      %
                    </th>
                    <th style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      Ngày
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {scores.map((r, i) => {
                    const pct = Number(r.percentage) || 0
                    const color = pct >= 80 ? '#34d399' : pct >= 50 ? '#fbbf24' : '#f87171'
                    return (
                      <tr key={i} style={{ color: '#e2e8f0' }}>
                        <td style={{ padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          {String(r.name || '—')}
                        </td>
                        <td style={{ padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          {String(r.quiz_type || '—')}
                        </td>
                        <td style={{ padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          {String(r.score || 0)}/{String(r.total || 0)}
                        </td>
                        <td
                          style={{ padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)', color }}
                        >
                          {pct}%
                        </td>
                        <td
                          style={{
                            padding: '10px',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            color: '#94a3b8',
                          }}
                        >
                          {r.created_at ? new Date(r.created_at as string).toLocaleDateString('vi-VN') : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ color: '#94a3b8', padding: '12px 0' }}>Chưa có kết quả nào.</div>
          )}
        </div>
      )}
    </>
  )
}
