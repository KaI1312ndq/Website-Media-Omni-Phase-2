'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import InternalLayout from '@/components/InternalLayout'
import { getSession, setSession, clearSession, SessionUser } from '@/lib/auth'

const TITLES: Record<string, { greeting: string; subline: string }> = {
  '/dashboard': { greeting: '', subline: 'Chào mừng bạn quay trở lại hệ thống Media Omni.' },
  '/hub/analytics': {
    greeting: 'Analytics — Operations',
    subline: 'Plan completeness, report coverage, data consistency & report timing.',
  },
  '/hub/scores': {
    greeting: 'Bảng điểm Team',
    subline: 'Tổng hợp điểm quiz toàn team. Filter theo quiz, ngày, user.',
  },
  '/hub/tasks': { greeting: 'Daily Tasks', subline: 'Quản lý task hàng ngày của bạn và team.' },
  '/hub/users': {
    greeting: 'Quản lý thành viên',
    subline: 'Phân quyền tính năng cho từng thành viên Media Omni.',
  },
  '/hub/report': { greeting: 'Weekly Report Tool', subline: 'Nhập data → AI nhận xét → Copy Lark.' },
  '/hub/brands': {
    greeting: 'Brand Context',
    subline: 'Điền context ngành / sản phẩm / target / KPI — AI báo cáo tuần sẽ phân tích sắc hơn.',
  },
  '/admin/leads': {
    greeting: 'Lead Management',
    subline: 'Quản lý leads từ form audit miễn phí — filter, export, theo dõi pipeline.',
  },
  '/quiz': { greeting: 'Quiz Hub', subline: 'Kiểm tra kiến thức benchmark Ads & chỉ số.' },
}

export default function InternalRouteLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname() || ''
  const [user, setUser] = useState<SessionUser | null>(null)

  useEffect(() => {
    const u = getSession()
    if (!u) {
      router.push('/')
      return
    }
    setUser(u)
    fetch('/api/auth')
      .then(r => r.json())
      .then(({ user: su }) => {
        if (su) {
          setSession(su)
          setUser(su)
        } else if (!u) router.push('/')
      })
      .catch(() => {})
  }, [router])

  async function logout() {
    try {
      await fetch('/api/auth', { method: 'DELETE' })
    } catch {}
    clearSession()
    router.push('/')
  }

  if (!user) {
    return (
      <div
        className="loadingScreen"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--f-mono)',
          color: 'var(--faint)',
        }}
      >
        Đang tải...
      </div>
    )
  }

  const firstName = user.name.split(' ').pop() || user.name
  const cfg = TITLES[pathname] ?? {
    greeting: `Xin chào, ${firstName}`,
    subline: 'Chào mừng bạn quay trở lại hệ thống Media Omni.',
  }
  const greeting = cfg.greeting || `Xin chào, ${firstName}`

  return (
    <InternalLayout user={user} onLogout={logout} greeting={greeting} subline={cfg.subline}>
      {children}
    </InternalLayout>
  )
}
