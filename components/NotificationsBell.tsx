'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@/lib/icons'

interface NotificationItem {
  id: string
  recipient: string
  type: string
  title: string
  body: string | null
  link: string | null
  icon: string | null
  priority: string
  read_at: string | null
  created_at: string
}

function timeAgo(iso: string): string {
  const t = new Date(iso).getTime()
  if (!t) return ''
  const diff = Math.max(0, Date.now() - t)
  const s = Math.floor(diff / 1000)
  if (s < 60) return 'Vừa xong'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} phút trước`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} giờ trước`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d} ngày trước`
  return new Date(iso).toLocaleDateString('vi-VN')
}

function renderIcon(name: string | null) {
  if (name && (Icon as Record<string, (n?: number) => React.ReactElement>)[name]) {
    return (Icon as Record<string, (n?: number) => React.ReactElement>)[name](16)
  }
  return Icon.inbox(16)
}

export default function NotificationsBell({ isAdmin = false }: { isAdmin?: boolean }) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const router = useRouter()

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/notifications?limit=10', { cache: 'no-store' })
      if (!res.ok) return
      const j = await res.json()
      setItems(j.notifications || [])
      setUnread(j.unread_count || 0)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  // Poll every 60s; load on mount
  useEffect(() => {
    load()
    const id = setInterval(load, 60_000)
    return () => clearInterval(id)
  }, [load])

  // Click outside to close
  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  // Refresh when opening + compute fixed position
  useEffect(() => {
    if (!open) return
    load()
    const updatePos = () => {
      const r = btnRef.current?.getBoundingClientRect()
      if (r) setPos({ top: r.bottom + 8, right: window.innerWidth - r.right })
    }
    updatePos()
    window.addEventListener('resize', updatePos)
    window.addEventListener('scroll', updatePos, true)
    return () => {
      window.removeEventListener('resize', updatePos)
      window.removeEventListener('scroll', updatePos, true)
    }
  }, [open, load])

  async function handleClickItem(n: NotificationItem) {
    if (!n.read_at) {
      // optimistic
      setItems(prev => prev.map(x => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)))
      setUnread(u => Math.max(0, u - 1))
      try {
        await fetch('/api/notifications/read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: n.id }),
        })
      } catch {
        /* ignore */
      }
    }
    setOpen(false)
    if (n.link) router.push(n.link)
  }

  async function markAllRead() {
    setItems(prev => prev.map(x => (x.read_at ? x : { ...x, read_at: new Date().toISOString() })))
    setUnread(0)
    try {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      })
    } catch {
      /* ignore */
    }
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button
        ref={btnRef}
        type="button"
        className="ihd-icon"
        aria-label="Thông báo"
        onClick={() => setOpen(o => !o)}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {unread > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              minWidth: 16,
              height: 16,
              padding: '0 4px',
              borderRadius: 8,
              background: '#ef4444',
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #0a1424',
              lineHeight: 1,
            }}
          >
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && pos && (
        <div
          style={{
            position: 'fixed',
            top: pos.top,
            right: pos.right,
            width: 'min(360px, calc(100vw - 32px))',
            maxHeight: '70vh',
            background: '#0a1424',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            boxShadow: '0 16px 40px rgba(0,0,0,0.55)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '12px 14px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>Thông báo</div>
            <button
              type="button"
              onClick={markAllRead}
              disabled={unread === 0}
              style={{
                background: 'transparent',
                border: 'none',
                color: unread === 0 ? '#475569' : '#06b6d4',
                fontSize: 12,
                cursor: unread === 0 ? 'default' : 'pointer',
                padding: 0,
              }}
            >
              Đánh dấu đã đọc tất cả
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading && items.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                Đang tải...
              </div>
            ) : items.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8, color: '#475569' }}>
                  {Icon.inbox(28)}
                </div>
                Chưa có thông báo nào
              </div>
            ) : (
              items.map(n => {
                const isUnread = !n.read_at
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleClickItem(n)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      gap: 10,
                      padding: '10px 14px',
                      border: 'none',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      background: isUnread ? 'rgba(37,99,235,0.06)' : 'transparent',
                      color: 'inherit',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'background .15s',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = isUnread
                        ? 'rgba(37,99,235,0.12)'
                        : 'rgba(255,255,255,0.04)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = isUnread ? 'rgba(37,99,235,0.06)' : 'transparent'
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: 'rgba(37,99,235,0.15)',
                        color: '#60a5fa',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {renderIcon(n.icon)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#e2e8f0',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1,
                          }}
                        >
                          {n.title}
                        </div>
                        {isUnread && (
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: '#3b82f6',
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </div>
                      {n.body && (
                        <div
                          style={{
                            fontSize: 12,
                            color: '#94a3b8',
                            marginTop: 2,
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {n.body}
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                        {timeAgo(n.created_at)}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {isAdmin && items.length > 0 && (
            <div
              style={{
                borderTop: '1px solid rgba(255,255,255,0.08)',
                padding: '8px 14px',
                textAlign: 'center',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  router.push('/admin/notifications')
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#06b6d4',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Xem tất cả →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
