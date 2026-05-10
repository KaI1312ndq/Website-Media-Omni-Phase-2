'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { SessionUser, setSession } from '@/lib/auth'
import InternalSidebar from './InternalSidebar'
import InternalHeader from './InternalHeader'
import ProfileModal from './ProfileModal'
import CommandPalette from './CommandPalette'

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
  const [profileOpen, setProfileOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState(user)

  useEffect(() => {
    setCurrentUser(user)
  }, [user])

  useEffect(() => {
    try {
      const v = localStorage.getItem('mo_sidebar_collapsed')
      if (v === '1') setCollapsed(true)
    } catch {}
  }, [])

  function toggleCollapsed(v: boolean) {
    setCollapsed(v)
    try {
      localStorage.setItem('mo_sidebar_collapsed', v ? '1' : '0')
    } catch {}
  }

  const styleVar = { '--sb-w': collapsed ? '64px' : '250px' } as CSSProperties

  return (
    <div className="il-shell" data-collapsed={collapsed ? 'true' : 'false'} style={styleVar}>
      <InternalSidebar
        user={currentUser}
        onLogout={onLogout}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        collapsed={collapsed}
        setCollapsed={toggleCollapsed}
        onOpenProfile={() => setProfileOpen(true)}
      />
      <div className="il-main">
        <InternalHeader
          user={currentUser}
          onMenuClick={() => setDrawerOpen(true)}
          greeting={greeting}
          subline={subline}
          onOpenProfile={() => setProfileOpen(true)}
          onLogout={onLogout}
        />
        <main className="il-content">{children}</main>
      </div>
      {profileOpen && (
        <ProfileModal
          user={currentUser}
          onClose={() => setProfileOpen(false)}
          onUpdate={u => {
            setCurrentUser(u)
            setSession(u)
          }}
        />
      )}
      <CommandPalette />
    </div>
  )
}
