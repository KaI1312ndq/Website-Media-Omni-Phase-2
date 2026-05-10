'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface Cmd {
  id: string
  label: string
  hint?: string
  href?: string
  action?: () => void
}

const COMMANDS: Cmd[] = [
  { id: 'dashboard', label: 'Dashboard', hint: 'Trang tổng quan', href: '/dashboard' },
  { id: 'report', label: 'Báo cáo tuần', hint: 'Tạo + AI + XLSX', href: '/hub/report' },
  { id: 'analytics', label: 'Analytics', hint: 'Operations dashboard', href: '/hub/analytics' },
  { id: 'tasks', label: 'Tasks', hint: 'My Day · Team · Create', href: '/hub/tasks' },
  { id: 'scores', label: 'Scores', hint: 'Quiz scores + matrix', href: '/hub/scores' },
  { id: 'sop', label: 'SOP & Resources', hint: 'Tài liệu nội bộ', href: '/hub/sop' },
  { id: 'users', label: 'Users', hint: 'CRUD + perms (admin)', href: '/hub/users' },
  { id: 'leads', label: 'Leads', hint: 'CRM + CSV export (admin)', href: '/admin/leads' },
  { id: 'quiz', label: 'Quiz', hint: 'D1 + D2', href: '/quiz' },
  { id: 'studio', label: 'Sanity Studio', hint: 'CMS', href: '/studio' },
  { id: 'home', label: 'Public homepage', hint: 'mediaomni.site', href: '/' },
]

export default function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isToggle = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'
      if (isToggle) {
        e.preventDefault()
        setOpen(o => !o)
      } else if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    if (open) {
      setQ('')
      setActive(0)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return COMMANDS
    return COMMANDS.filter(
      c => c.label.toLowerCase().includes(s) || (c.hint ?? '').toLowerCase().includes(s) || c.id.includes(s),
    )
  }, [q])

  function run(c: Cmd) {
    setOpen(false)
    if (c.action) c.action()
    else if (c.href) router.push(c.href)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive(a => Math.min(a + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive(a => Math.max(a - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const c = filtered[active]
      if (c) run(c)
    }
  }

  if (!open) return null

  return (
    <div
      onClick={() => setOpen(false)}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(8, 12, 24, .55)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '14vh',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(560px, 92vw)',
          background: 'var(--paper, #fff)',
          borderRadius: 14,
          boxShadow: '0 24px 80px rgba(0,0,0,.4)',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,.08)',
        }}
      >
        <input
          ref={inputRef}
          value={q}
          onChange={e => {
            setQ(e.target.value)
            setActive(0)
          }}
          onKeyDown={onKeyDown}
          placeholder="Tìm trang… (↑↓ chọn · Enter mở · Esc thoát)"
          style={{
            width: '100%',
            padding: '18px 20px',
            border: 'none',
            outline: 'none',
            fontSize: '1rem',
            borderBottom: '1px solid var(--border, #eee)',
            background: 'transparent',
            color: 'var(--ink, #111)',
          }}
        />
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {filtered.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted, #888)', fontSize: '.9rem' }}>
              Không tìm thấy
            </div>
          )}
          {filtered.map((c, i) => (
            <button
              key={c.id}
              onMouseEnter={() => setActive(i)}
              onClick={() => run(c)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '12px 20px',
                background: i === active ? 'rgba(37,99,235,.12)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--ink, #111)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontFamily: 'inherit',
              }}
            >
              <span style={{ fontWeight: 600, fontSize: '.95rem' }}>{c.label}</span>
              {c.hint && <span style={{ color: 'var(--muted, #888)', fontSize: '.8rem' }}>{c.hint}</span>}
            </button>
          ))}
        </div>
        <div
          style={{
            padding: '8px 16px',
            fontSize: '.72rem',
            color: 'var(--muted, #888)',
            borderTop: '1px solid var(--border, #eee)',
            display: 'flex',
            gap: 16,
          }}
        >
          <span>↑↓ điều hướng</span>
          <span>↵ mở</span>
          <span>esc đóng</span>
          <span style={{ marginLeft: 'auto' }}>⌘K · Ctrl+K để mở</span>
        </div>
      </div>
    </div>
  )
}
