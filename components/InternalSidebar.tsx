'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { SessionUser, initials } from '@/lib/auth'

type Item = {
  href?: string
  label: string
  icon: JSX.Element
  adminOnly?: boolean
  disabled?: boolean
  badge?: string
  match?: (path: string) => boolean
}

const I = {
  home: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
  ),
  quiz: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
  ),
  task: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
  ),
  score: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>
  ),
  users: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
  ),
  report: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
  ),
  analytics: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
  ),
  sop: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
  ),
  leads: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l18-8-8 18-2-8-8-2z"/></svg>
  ),
  logout: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
  ),
  user: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  ),
}

interface Props {
  user: SessionUser
  onLogout: () => void
  open?: boolean
  onClose?: () => void
  collapsed?: boolean
  setCollapsed?: (v: boolean) => void
  onOpenProfile?: () => void
}

export default function InternalSidebar({ user, onLogout, open, onClose, collapsed, setCollapsed, onOpenProfile }: Props) {
  const pathname = usePathname() || ''
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState(user)
  const isAdmin = currentUser.role === 'admin'
  useEffect(() => { setCurrentUser(user) }, [user])

  const items: Item[] = [
    { href: '/dashboard', label: 'Tổng quan', icon: I.home, match: (p) => p === '/dashboard' },
    { href: '/quiz', label: 'Quiz Hub', icon: I.quiz },
    { href: '/hub/tasks', label: 'Daily Tasks', icon: I.task },
    { href: '/hub/scores', label: isAdmin ? 'Bảng điểm Team' : 'Kết quả của tôi', icon: I.score },
    ...(isAdmin ? [{ href: '/hub/users', label: 'Quản lý thành viên', icon: I.users } as Item] : []),
    { href: '/hub/report', label: 'Weekly Report', icon: I.report },
    { href: '/hub/analytics', label: 'Analytics', icon: I.analytics },
    ...(isAdmin ? [{ href: '/admin/leads', label: 'Leads', icon: I.leads } as Item] : []),
    { label: 'SOP & Resources', icon: I.sop, disabled: true, badge: 'Phase 4' },
  ]

  const isCollapsed = !!collapsed

  return (
    <>
      {open && <div className="isb-overlay" onClick={onClose} />}
      <aside className={`isb${open ? ' open' : ''}${isCollapsed ? ' collapsed' : ''}`}>
        <div className="isb-top">
          <Link href="/dashboard" className="isb-brand" title={isCollapsed ? 'MediaOmni' : undefined}>
            <span className="isb-mark">MO</span>
            <span className="isb-brand-text">MediaOmni</span>
          </Link>
          {setCollapsed && (
            <button
              type="button"
              className="isb-toggle"
              onClick={() => setCollapsed(!isCollapsed)}
              aria-label={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
              title={isCollapsed ? 'Mở rộng' : 'Thu gọn'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform .25s ease' }}>
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
          )}
        </div>

        <nav className="isb-nav">
          {items.map((it, i) => {
            const active = it.match
              ? it.match(pathname)
              : it.href ? pathname.startsWith(it.href.split('#')[0]) && it.href !== '/dashboard' : false
            const cls = `isb-item${active ? ' active' : ''}${it.disabled ? ' disabled' : ''}`
            const tip = isCollapsed ? it.label : undefined
            if (it.disabled || !it.href) {
              return (
                <div key={i} className={cls} title={tip}>
                  <span className="isb-icon">{it.icon}</span>
                  <span className="isb-label">{it.label}</span>
                  {it.badge && <span className="isb-badge">{it.badge}</span>}
                </div>
              )
            }
            return (
              <Link key={i} href={it.href} className={cls} onClick={onClose} title={tip}>
                <span className="isb-icon">{it.icon}</span>
                <span className="isb-label">{it.label}</span>
                {it.badge && <span className="isb-badge">{it.badge}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="isb-bottom">
          {!isCollapsed && (
            <div className="isb-decor" aria-hidden>
              <svg width="100%" height="60" viewBox="0 0 200 60" fill="none">
                <circle cx="100" cy="80" r="60" stroke="rgba(96,165,250,0.25)" strokeWidth="1"/>
                <circle cx="100" cy="80" r="50" stroke="rgba(96,165,250,0.15)" strokeWidth="1"/>
                <circle cx="40" cy="20" r="1.5" fill="rgba(147,197,253,0.7)"/>
                <circle cx="160" cy="15" r="1" fill="rgba(147,197,253,0.5)"/>
                <circle cx="170" cy="35" r="1.2" fill="rgba(147,197,253,0.6)"/>
                <circle cx="20" cy="40" r="1" fill="rgba(147,197,253,0.4)"/>
              </svg>
            </div>
          )}
          <div className="isb-user" onClick={() => setMenuOpen(o => !o)} title={isCollapsed ? currentUser.name : undefined}>
            <div className="isb-avatar">
              {currentUser.avatar_url
                ? <img src={currentUser.avatar_url} alt={currentUser.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                : initials(currentUser.name)}
            </div>
            <div className="isb-user-info">
              <div className="isb-user-name">{currentUser.name}</div>
              <div className="isb-user-role">{currentUser.role}</div>
            </div>
            <svg className="isb-caret" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
          </div>
          {menuOpen && (
            <div className="isb-menu">
              <button className="isb-menu-item" onClick={() => { onOpenProfile?.(); setMenuOpen(false) }}>
                {I.user} <span>Tài khoản</span>
              </button>
              <button className="isb-menu-item" onClick={() => { router.push('/'); setMenuOpen(false) }}>
                {I.home} <span>Trang công khai</span>
              </button>
              <button className="isb-menu-item danger" onClick={onLogout}>
                {I.logout} <span>Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
