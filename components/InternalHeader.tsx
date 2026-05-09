'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SessionUser, initials } from '@/lib/auth'
import { Icon } from '@/lib/icons'

interface Props {
  user: SessionUser
  onMenuClick?: () => void
  greeting?: string
  subline?: string
  onOpenProfile?: () => void
  onLogout?: () => void
}

export default function InternalHeader({ user, onMenuClick, greeting, subline, onOpenProfile, onLogout }: Props) {
  const firstName = user.name.split(' ').pop() || user.name
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [menuOpen])

  return (
    <header className="ihd">
      <div className="ihd-left">
        <button className="ihd-burger" onClick={onMenuClick} aria-label="Mở menu">
          <span/><span/><span/>
        </button>
        <div className="ihd-greet">
          <h1>{greeting || `Xin chào, ${firstName} 👋`}</h1>
          <p>{subline || 'Chào mừng bạn quay trở lại hệ thống Media Omni.'}</p>
        </div>
      </div>
      <div className="ihd-right">
        <div className="ihd-search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="search" placeholder="Tìm kiếm tính năng..." />
        </div>
        <button className="ihd-icon" aria-label="Thông báo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
          <span className="ihd-dot"/>
        </button>
        <button className="ihd-icon" aria-label="Trợ giúp">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </button>
        <Link href="/hub/report" className="ihd-cta">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Tạo nhanh
        </Link>

        <div ref={wrapRef} style={{ position: 'relative', marginLeft: 4 }}>
          <button
            type="button"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Tài khoản"
            style={{
              width: 32, height: 32, borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.1)',
              background: 'linear-gradient(135deg,#2563EB,#06B6D4)',
              color: '#fff', fontWeight: 700, fontSize: 12,
              cursor: 'pointer', padding: 0, overflow: 'hidden',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              transition: 'box-shadow .2s, border-color .2s',
              boxShadow: menuOpen ? '0 0 0 3px rgba(37,99,235,0.3)' : 'none',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(37,99,235,0.5)' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
          >
            {user.avatar_url
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={user.avatar_url} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span>{initials(user.name)}</span>}
          </button>

          {menuOpen && (
            <div
              style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 180,
                background: '#0a1424', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10, boxShadow: '0 12px 32px rgba(0,0,0,0.45)',
                padding: 6, zIndex: 80,
              }}
            >
              <button
                type="button"
                style={menuItem}
                onClick={() => { setMenuOpen(false); onOpenProfile?.() }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              ><span style={{ display: 'inline-flex' }}>{Icon.users(14)}</span><span>Tài khoản</span></button>
              <button
                type="button"
                style={menuItem}
                onClick={() => { setMenuOpen(false); router.push('/') }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              ><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg><span>Trang công khai</span></button>
              <button
                type="button"
                style={{ ...menuItem, color: '#f87171' }}
                onClick={() => { setMenuOpen(false); onLogout?.() }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(248,113,113,0.08)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              ><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg><span>Đăng xuất</span></button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

const menuItem: React.CSSProperties = {
  width: '100%', textAlign: 'left',
  padding: '10px 14px', border: 'none', background: 'transparent',
  color: 'inherit', fontSize: 13, cursor: 'pointer', borderRadius: 6,
  display: 'flex', alignItems: 'center', gap: 8,
  transition: 'background .15s',
}
