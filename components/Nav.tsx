'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SessionUser {
  id: string
  username: string
  name: string
  role: string
  avatar_url?: string | null
}

export default function Nav() {
  const pathname = usePathname()
  // Hide public Nav on internal routes (Studio, Dashboard, Hub, Quiz)
  const internalRoutes = ['/studio', '/dashboard', '/hub', '/quiz']
  if (pathname && internalRoutes.some(p => pathname.startsWith(p))) return null
  const isHome = pathname === '/'
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState<SessionUser | null>(null)
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/auth', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(j => { if (!cancelled && j?.user) setUser(j.user) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [pathname])

  useEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const sp = document.getElementById('sp')

    const onScroll = () => {
      const y = window.scrollY
      // Always show dark nav on non-home pages; on home page only after scroll
      nav.classList.toggle('scrolled', !isHome || y > 10)
      if (sp) {
        const max = document.documentElement.scrollHeight - window.innerHeight
        sp.style.width = max > 0 ? (y / max * 100) + '%' : '0%'
      }
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  const navLinks = isHome
    ? [
        { href: '#hero', label: 'Home' },
        { href: '#services', label: 'Services' },
        { href: '#brands', label: 'Brands' },
        { href: '/case-studies', label: 'Case Studies' },
        { href: '#partners', label: 'Partners' },
        { href: '#team', label: 'Team' },
        { href: '#blog', label: 'Blog' },
      ]
    : [
        { href: '/', label: 'Home' },
        { href: '/case-studies', label: 'Case Studies' },
        { href: '/blog', label: 'Blog' },
      ]

  return (
    <>
      <nav id="main-nav" ref={navRef}>
        <div className="nav-inner">
          <Link href="/" className="nav-logo">
            <span className="nav-logo-mark">MO</span>
            MediaOmni
          </Link>
          <div className="nav-links">
            {navLinks.map(({ href, label }) => (
              <a key={href} href={href} className="nav-link">
                {label}
              </a>
            ))}
            {user ? (
              <Link href="/dashboard" className="nav-cta" title={`Đăng nhập với ${user.name}`}>
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" width={20} height={20} style={{ borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2" />
                  </svg>
                )}
                {user.name.split(' ').slice(-1)[0]} → Dashboard
              </Link>
            ) : (
              <button className="nav-cta" onClick={() => openLoginModal()}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Đăng nhập
              </button>
            )}
          </div>
          <button
            className={`nav-toggle${menuOpen ? ' open' : ''}`}
            id="nav-toggle"
            aria-label="Menu"
            onClick={() => setMenuOpen(o => !o)}
          >
            <span /><span /><span />
          </button>
        </div>
        <div className={`nav-mob${menuOpen ? ' open' : ''}`} id="nav-mob">
          {navLinks.map(({ href, label }) => (
            <a key={href} href={href} className="nav-mob-link" onClick={() => setMenuOpen(false)}>
              {label}
            </a>
          ))}
          {user ? (
            <Link href="/dashboard" className="nav-mob-cta" onClick={() => setMenuOpen(false)}>
              {user.name} → Dashboard
            </Link>
          ) : (
            <button className="nav-mob-cta" onClick={() => { setMenuOpen(false); openLoginModal() }}>
              Đăng nhập
            </button>
          )}
        </div>
      </nav>
      {menuOpen && (
        <div className="mob-overlay open" onClick={() => setMenuOpen(false)} />
      )}
    </>
  )
}

function openLoginModal() {
  const modal = document.getElementById('login-modal')
  if (modal) modal.classList.add('open')
}
