'use client'

import { useEffect, useState, useMemo, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { getSession, SessionUser } from '@/lib/auth'
import { HubPageSkeleton } from '@/components/Skeleton'
import { Icon } from '@/lib/icons'
import '@/app/(internal)/dashboard/dashboard.css'
import './leads.css'

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'closed'

interface Lead {
  id: string
  name: string
  email: string
  phone?: string | null
  brand?: string | null
  channels?: string[] | null
  monthly_budget?: string | null
  note?: string | null
  status: LeadStatus
  source?: string | null
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
  ip_address?: string | null
  user_agent?: string | null
  contacted_at?: string | null
  contacted_by?: string | null
  created_at: string
  updated_at?: string | null
}

interface LeadResp {
  leads: Lead[]
  total: number
  by_status: Record<LeadStatus, number>
}

const STATUS_LABEL: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Đã liên hệ',
  qualified: 'Qualified',
  closed: 'Closed',
}

const CHANNEL_COLOR: Record<string, string> = {
  shopee: 'lc-shopee',
  tiktok: 'lc-tiktok',
  meta: 'lc-meta',
  google: 'lc-google',
  livestream: 'lc-live',
}

const PAGE_SIZE = 20

export default function AdminLeadsPage() {
  const router = useRouter()
  const [me, setMe] = useState<SessionUser | null>(null)
  const [data, setData] = useState<LeadResp | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<LeadStatus | ''>('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    const u = getSession()
    if (!u) {
      router.push('/')
      return
    }
    if (u.role !== 'admin') {
      router.push('/dashboard')
      return
    }
    setMe(u)
  }, [router])

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filter) params.set('status', filter)
      if (fromDate) params.set('from_date', fromDate)
      if (toDate) params.set('to_date', toDate)
      if (q.trim()) params.set('q', q.trim())
      const r = await fetch(`/api/leads?${params.toString()}`)
      const j = await r.json()
      if (r.ok) setData(j)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (me) load()
  }, [me, filter, fromDate, toDate]) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = data?.leads || []
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageRows = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page])

  async function updateStatus(id: string, status: LeadStatus) {
    const r = await fetch('/api/leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    })
    if (r.ok) load()
  }

  async function remove(id: string) {
    if (!confirm('Xóa lead này? Không thể khôi phục.')) return
    const r = await fetch(`/api/leads?id=${id}`, { method: 'DELETE' })
    if (r.ok) load()
  }

  function exportCsv() {
    const headers = [
      'Date',
      'Name',
      'Email',
      'Phone',
      'Brand',
      'Channels',
      'Budget',
      'Status',
      'Note',
      'UTM Source',
      'UTM Medium',
      'UTM Campaign',
    ]
    const rows = filtered.map(l => [
      new Date(l.created_at).toLocaleString('vi-VN'),
      l.name,
      l.email,
      l.phone || '',
      l.brand || '',
      (l.channels || []).join(';'),
      l.monthly_budget || '',
      l.status,
      (l.note || '').replace(/[\r\n]+/g, ' '),
      l.utm_source || '',
      l.utm_medium || '',
      l.utm_campaign || '',
    ])
    const csv = [headers, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!me) return <HubPageSkeleton title="Đang tải leads..." />

  const stats = data?.by_status || { new: 0, contacted: 0, qualified: 0, closed: 0 }
  const total = (stats.new || 0) + (stats.contacted || 0) + (stats.qualified || 0) + (stats.closed || 0)

  return (
    <div className="leads-page">
      {/* STATS */}
      <div className="leads-stats">
        <StatCard label="Tổng leads" value={total} icon={Icon.users(18)} accent="blue" />
        <StatCard label="New" value={stats.new || 0} icon={Icon.send(18)} accent="cyan" />
        <StatCard label="Đã liên hệ" value={stats.contacted || 0} icon={Icon.check(18)} accent="yellow" />
        <StatCard label="Qualified" value={stats.qualified || 0} icon={Icon.trending(18)} accent="green" />
      </div>

      {/* FILTER BAR */}
      <div className="leads-filter">
        <select
          value={filter}
          onChange={e => {
            setFilter(e.target.value as LeadStatus | '')
            setPage(1)
          }}
        >
          <option value="">Tất cả</option>
          <option value="new">New</option>
          <option value="contacted">Đã liên hệ</option>
          <option value="qualified">Qualified</option>
          <option value="closed">Closed</option>
        </select>
        <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
        <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
        <input
          type="search"
          placeholder="Tìm tên / email / brand"
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') load()
          }}
        />
        <button className="lp-btn" onClick={load}>
          Refresh
        </button>
        <button className="lp-btn lp-btn-primary" onClick={exportCsv} disabled={filtered.length === 0}>
          Export CSV
        </button>
      </div>

      {/* TABLE */}
      <div className="leads-table-wrap">
        {loading ? (
          <div className="lp-loading">Đang tải...</div>
        ) : filtered.length === 0 ? (
          <div className="lp-empty">Không có lead nào.</div>
        ) : (
          <table className="leads-table">
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Tên</th>
                <th>Liên hệ</th>
                <th>Brand</th>
                <th>Kênh</th>
                <th>Budget</th>
                <th>Status</th>
                <th>Note</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map(l => (
                <Fragment key={l.id}>
                  <tr className="lp-row" onClick={() => setExpanded(expanded === l.id ? null : l.id)}>
                    <td className="lp-date">
                      {new Date(l.created_at).toLocaleDateString('vi-VN')}
                      <br />
                      <span>
                        {new Date(l.created_at).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>
                    <td className="lp-name">{l.name}</td>
                    <td className="lp-contact">
                      <div>{l.email}</div>
                      {l.phone && <div className="lp-phone">{l.phone}</div>}
                    </td>
                    <td>{l.brand || '-'}</td>
                    <td>
                      <div className="lp-chans">
                        {(l.channels || []).map(c => (
                          <span key={c} className={`lp-chan ${CHANNEL_COLOR[c] || ''}`}>
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="lp-budget">{l.monthly_budget || '-'}</td>
                    <td onClick={e => e.stopPropagation()}>
                      <select
                        className={`lp-status lp-st-${l.status}`}
                        value={l.status}
                        onChange={e => updateStatus(l.id, e.target.value as LeadStatus)}
                      >
                        {(['new', 'contacted', 'qualified', 'closed'] as LeadStatus[]).map(s => (
                          <option key={s} value={s}>
                            {STATUS_LABEL[s]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="lp-note-preview">
                      {l.note ? (l.note.length > 40 ? l.note.slice(0, 40) + '…' : l.note) : '-'}
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="lp-actions">
                        {l.status === 'new' && (
                          <button
                            className="lp-act"
                            title="Đã liên hệ"
                            onClick={() => updateStatus(l.id, 'contacted')}
                          >
                            {Icon.check(14)}
                          </button>
                        )}
                        <button className="lp-act lp-act-danger" title="Xóa" onClick={() => remove(l.id)}>
                          {Icon.trash(14)}
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expanded === l.id && (
                    <tr className="lp-expand-row">
                      <td colSpan={9}>
                        <div className="lp-expand">
                          <div>
                            <strong>Note đầy đủ:</strong> {l.note || '-'}
                          </div>
                          <div>
                            <strong>UTM:</strong> {l.utm_source || '-'} · {l.utm_medium || '-'} ·{' '}
                            {l.utm_campaign || '-'}
                          </div>
                          <div>
                            <strong>IP:</strong> {l.ip_address || '-'}
                          </div>
                          <div>
                            <strong>User-Agent:</strong> <span className="lp-ua">{l.user_agent || '-'}</span>
                          </div>
                          <div>
                            <strong>Timeline:</strong> tạo {new Date(l.created_at).toLocaleString('vi-VN')}
                            {l.contacted_at
                              ? ` · liên hệ ${new Date(l.contacted_at).toLocaleString('vi-VN')} bởi ${l.contacted_by || '-'}`
                              : ''}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="leads-pager">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            ‹ Trước
          </button>
          <span>
            Trang {page} / {totalPages}
          </span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            Sau ›
          </button>
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string
  value: number
  icon: React.ReactNode
  accent: string
}) {
  return (
    <div className={`leads-stat-card lsc-${accent}`}>
      <div className="lsc-icon">{icon}</div>
      <div className="lsc-body">
        <div className="lsc-val">{value}</div>
        <div className="lsc-lbl">{label}</div>
      </div>
    </div>
  )
}
