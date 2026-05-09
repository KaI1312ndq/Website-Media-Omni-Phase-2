'use client'

import { useState } from 'react'
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
  return (
    <div className="il-shell">
      <InternalSidebar user={user} onLogout={onLogout} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <div className="il-main">
        <InternalHeader user={user} onMenuClick={() => setDrawerOpen(true)} greeting={greeting} subline={subline} />
        <main className="il-content">{children}</main>
      </div>
    </div>
  )
}
