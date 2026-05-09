'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession, clearSession, setSession, SessionUser, initials } from '@/lib/auth'

const SVG = {
  quiz:     `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  tasks:    `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><polyline points="9 16 11 18 15 14"/></svg>`,
  score:    `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>`,
  blog:     `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  users:    `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>`,
  report:   `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
  analytics:`<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
  sop:      `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>`,
  migrate:  `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/></svg>`,
  home:     `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
}

type Card = { icon: string; title: string; desc: string; badge: string; label: string; url?: string; fn?: string }

const DASH_CFG: Record<string, { badge: string; badgeClass: string; sub: string; cards: Card[] }> = {
  admin: {
    badge: 'Admin / Lead', badgeClass: 'rb-admin',
    sub: 'Bạn có quyền truy cập toàn bộ hệ thống.',
    cards: [
      { icon: SVG.quiz,      title: 'Quiz Hub',           desc: 'Làm bài kiểm tra Dạng 1 & Dạng 2.',         badge: 'dcb-available', label: 'Sẵn sàng', url: '/quiz' },
      { icon: SVG.tasks,     title: 'Daily Tasks',         desc: 'Xem và quản lý task hàng ngày.',             badge: 'dcb-available', label: 'Mở',       url: '/hub/tasks' },
      { icon: SVG.score,     title: 'Bảng điểm Team',     desc: 'Xem điểm quiz của tất cả thành viên.',       badge: 'dcb-available', label: 'Xem ngay', fn: 'scores' },
      { icon: SVG.blog,      title: 'Blog CMS',            desc: 'Quản lý bài viết blog trong Sanity Studio.', badge: 'dcb-available', label: 'CMS',      url: '/studio' },
      { icon: SVG.users,     title: 'Quản lý thành viên', desc: 'Tạo, sửa, phân quyền tài khoản.',           badge: 'dcb-available', label: 'Mở',       url: '/hub/users' },
      { icon: SVG.report,    title: 'Weekly Report',       desc: 'Nhập data → AI nhận xét → Copy Lark.',      badge: 'dcb-available', label: 'Mở',       url: '/hub/report' },
      { icon: SVG.analytics, title: 'Analytics',           desc: 'Thống kê performance report theo brand.',    badge: 'dcb-available', label: 'Mở',       url: '/hub/analytics' },
      { icon: SVG.migrate,   title: 'Migration Tool',     desc: 'Đồng bộ data từ Google Sheets → Supabase.', badge: 'dcb-available', label: 'Chạy',     url: '/hub/migrate' },
      { icon: SVG.sop,       title: 'SOP & Resources',    desc: 'Tài liệu, template, checklist nội bộ.',      badge: 'dcb-soon',      label: 'Phase 4' },
    ],
  },
  member: {
    badge: 'Member', badgeClass: 'rb-member',
    sub: 'Làm bài quiz, xem kết quả và truy cập tài nguyên.',
    cards: [
      { icon: SVG.quiz,      title: 'Quiz Hub',       desc: 'Làm bài kiểm tra kiến thức.',                badge: 'dcb-available', label: 'Sẵn sàng', url: '/quiz' },
      { icon: SVG.tasks,     title: 'Daily Tasks',    desc: 'Xem task hàng ngày được assign.',            badge: 'dcb-available', label: 'Mở',       url: '/hub/tasks' },
      { icon: SVG.score,     title: 'Kết quả của tôi',desc: 'Xem lịch sử điểm các bài đã làm.',          badge: 'dcb-available', label: 'Xem',      fn: 'my-scores' },
      { icon: SVG.blog,      title: 'Blog CMS',       desc: 'Viết bài và chia sẻ kiến thức.',             badge: 'dcb-available', label: 'Viết bài', url: '/studio' },
      { icon: SVG.report,    title: 'Weekly Report',  desc: 'Nhập data → AI nhận xét → Copy Lark.',      badge: 'dcb-available', label: 'Mở',       url: '/hub/report' },
      { icon: SVG.analytics, title: 'Analytics',      desc: 'Thống kê performance report theo brand.',   badge: 'dcb-available', label: 'Mở',       url: '/hub/analytics' },
      { icon: SVG.sop,       title: 'SOP & Resources',desc: 'Tài liệu, template nội bộ.',                badge: 'dcb-soon',      label: 'Phase 4' },
    ],
  },
  upbase: {
    badge: 'UpBase Staff', badgeClass: 'rb-upbase',
    sub: 'Thử quiz kiến thức performance marketing.',
    cards: [
      { icon: SVG.quiz, title: 'Quiz Kiến thức', desc: 'Bài kiểm tra performance marketing.', badge: 'dcb-available', label: 'Sẵn sàng', url: '/quiz' },
      { icon: SVG.home, title: 'Trang chủ',       desc: 'Tổng quan năng lực Media Omni.',     badge: 'dcb-available', label: 'Xem',       url: '/' },
    ],
  },
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<SessionUser | null>(null)
  const [scores, setScores] = useState<Record<string, unknown>[] | null>(null)
  const [loadingScores, setLoadingScores] = useState(false)

  useEffect(() => {
    let u = getSession()
    if (!u) { router.push('/'); return }
    // Sync session from server cookie if needed
    fetch('/api/auth').then(r => r.json()).then(({ user: su }) => {
      if (su) { setSession(su); setUser(su) }
      else if (u) setUser(u)
      else router.push('/')
    })
  }, [router])

  async function logout() {
    await fetch('/api/auth', { method: 'DELETE' })
    clearSession()
    router.push('/')
  }

  async function loadScores(onlyMe: boolean) {
    setLoadingScores(true)
    const url = onlyMe ? `/api/quiz?username=${user?.username}` : '/api/quiz'
    const j = await fetch(url).then(r => r.json())
    setScores(j.data || [])
    setLoadingScores(false)
    setTimeout(() => document.getElementById('scores-section')?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'var(--f-mono)', color: 'var(--faint)' }}>Đang tải...</div>
      </div>
    )
  }

  const cfg = DASH_CFG[user.role] || DASH_CFG.member

  return (
    <>
      <nav id="main-nav" className="dash-nav scrolled">
        <div className="nav-inner">
          <a href="/" className="nav-logo"><span className="nav-logo-mark">MO</span>MediaOmni</a>
          <div className="nav-links">
            <a href="/" className="nav-link">← Trang chủ</a>
            <span className={`role-badge ${cfg.badgeClass}`}>{cfg.badge}</span>
            <span style={{ fontSize: '.84rem', color: 'rgba(255,255,255,.7)', fontWeight: 500 }}>{user.name}</span>
            <button className="nav-cta" style={{ background: 'rgba(239,68,68,.15)', border: '1px solid rgba(239,68,68,.3)' }} onClick={logout}>Đăng xuất</button>
          </div>
        </div>
      </nav>

      <div className="dash-page">
        <div className="dash-content">
          <div className="welcome-block">
            <div className="wb-left">
              <h1>Xin chào, {user.name.split(' ').pop()} 👋</h1>
              <p>{cfg.sub}</p>
            </div>
            <div className="wb-right" style={{ fontSize: '3rem' }}>🚀</div>
          </div>

          <div className="dash-cards">
            {cfg.cards.map((c, i) => (
              <div key={i}
                className={`dash-card${!c.url && !c.fn ? ' disabled' : ''}`}
                style={{ cursor: c.url || c.fn ? 'pointer' : 'default' }}
                onClick={() => {
                  if (c.url) router.push(c.url)
                  else if (c.fn === 'scores') loadScores(false)
                  else if (c.fn === 'my-scores') loadScores(true)
                }}
              >
                <div className="dc-icon" dangerouslySetInnerHTML={{ __html: c.icon }} />
                <div className="dc-title">{c.title}</div>
                <div className="dc-desc">{c.desc}</div>
                <span className={`dc-badge ${c.badge}`}>{c.label}</span>
              </div>
            ))}
          </div>

          {/* Quiz Scores */}
          {(scores !== null || loadingScores) && (
            <div id="scores-section" className="scores-section" style={{ marginTop: '2rem' }}>
              <div className="scores-hdr">
                <h2>📊 Bảng điểm Quiz</h2>
                <button className="btn-sm" onClick={() => setScores(null)}>Đóng</button>
              </div>
              <div className="scores-table">
                <div className="st-head">
                  <span>Thành viên</span><span>Chủ đề</span><span>Điểm</span><span>%</span><span>Ngày làm</span>
                </div>
                {loadingScores ? (
                  <div className="no-data">⏳ Đang tải...</div>
                ) : scores && scores.length > 0 ? scores.map((r, i) => {
                  const pct = Number(r.percentage) || 0
                  const cls = pct >= 80 ? 'sp-high' : pct >= 50 ? 'sp-mid' : 'sp-low'
                  return (
                    <div key={i} className="st-row">
                      <span className="st-name">{String(r.name || '—')}</span>
                      <span>{String(r.quiz_type || '—')}</span>
                      <span>{String(r.score || 0)}/{String(r.total || 0)}</span>
                      <span><span className={`score-pill ${cls}`}>{pct}%</span></span>
                      <span style={{ color: 'var(--faint)', fontSize: '.8rem' }}>
                        {r.created_at ? new Date(r.created_at as string).toLocaleDateString('vi-VN') : '—'}
                      </span>
                    </div>
                  )
                }) : <div className="no-data">Chưa có kết quả nào.</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
