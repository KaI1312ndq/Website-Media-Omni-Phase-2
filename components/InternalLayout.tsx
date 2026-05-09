'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { SessionUser } from '@/lib/auth'
import InternalSidebar from './InternalSidebar'
import InternalHeader from './InternalHeader'

interface Props {
  user: SessionUser
  onLogout: () => void
  children: React.ReactNode
  greeting?: string
  subline?: string
}

export default function InternalLayout({ user, onLogout, children, greeting, subline }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    try {
      const v = localStorage.getItem('mo_sidebar_collapsed')
      if (v === '1') setCollapsed(true)
    } catch {}
  }, [])

  function toggleCollapsed(v: boolean) {
    setCollapsed(v)
    try { localStorage.setItem('mo_sidebar_collapsed', v ? '1' : '0') } catch {}
  }

  const styleVar = { '--sb-w': collapsed ? '64px' : '250px' } as CSSProperties

  return (
    <div className="il-shell" data-collapsed={collapsed ? 'true' : 'false'} style={styleVar}>
      <InternalSidebar
        user={user}
        onLogout={onLogout}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        collapsed={collapsed}
        setCollapsed={toggleCollapsed}
      />
      <div className="il-main">
        <InternalHeader user={user} onMenuClick={() => setDrawerOpen(true)} greeting={greeting} subline={subline} />
        <main className="il-content">{children}</main>
      </div>
    </div>
  )
}
