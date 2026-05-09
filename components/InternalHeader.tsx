'use client'

import Link from 'next/link'
import { SessionUser } from '@/lib/auth'

interface Props {
  user: SessionUser
  onMenuClick?: () => void
  greeting?: string
  subline?: string
}

export default function InternalHeader({ user, onMenuClick, greeting, subline }: Props) {
  const firstName = user.name.split(' ').pop() || user.name
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
      </div>
    </header>
  )
}
