'use client'

/**
 * Tab "Sản phẩm" trong panel brand detail (/hub/brands).
 *
 * - Upload file Master .xlsx → preview → confirm INSERT (không ghi đè ten_define cũ).
 * - Edit inline cột "Tên define" (autocomplete suggest tên đã có).
 * - Save batch → upsert.
 *
 * Brief V11 §4.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { parseMasterFile } from '@/lib/products/parsers/master-xlsx'
import type { ProductMasterRow, ParsedMasterRow } from '@/lib/products/types'

interface Props {
  brandName: string
  onToast?: (msg: string, type?: 'success' | 'error') => void
}

export default function ProductMasterTab({ brandName, onToast }: Props) {
  const [rows, setRows] = useState<ProductMasterRow[]>([])
  const [draft, setDraft] = useState<Record<string, string>>({}) // ma_san_pham → ten_define edited
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [search, setSearch] = useState('')
  const [importing, setImporting] = useState(false)
  const [preview, setPreview] = useState<ParsedMasterRow[] | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    if (!brandName) return
    setLoading(true)
    try {
      const r = await fetch(`/api/products?brand=${encodeURIComponent(brandName)}`)
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Lỗi tải sản phẩm')
      setRows(j.data || [])
      setDraft({})
      setSelectedIds(new Set())
    } catch (e) {
      onToast?.(e instanceof Error ? e.message : 'Lỗi tải sản phẩm', 'error')
    } finally {
      setLoading(false)
    }
  }, [brandName, onToast])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return rows
    return rows.filter(
      r =>
        r.ma_san_pham.toLowerCase().includes(q) ||
        (r.ten_shopee ?? '').toLowerCase().includes(q) ||
        (r.ten_define ?? '').toLowerCase().includes(q) ||
        (r.sku_code ?? '').toLowerCase().includes(q),
    )
  }, [rows, search])

  // Suggestions: distinct ten_define đã có
  const defineSuggestions = useMemo(() => {
    const set = new Set<string>()
    for (const r of rows) {
      if (r.ten_define && r.ten_define.trim()) set.add(r.ten_define.trim())
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'vi'))
  }, [rows])

  // Group count per ten_define (kể cả draft chưa save)
  const groupCount = useMemo(() => {
    const m = new Map<string, number>()
    for (const r of rows) {
      const v = (draft[r.ma_san_pham] ?? r.ten_define ?? '').trim()
      if (!v) continue
      m.set(v, (m.get(v) ?? 0) + 1)
    }
    return m
  }, [rows, draft])

  const unsavedCount = useMemo(() => {
    let c = 0
    for (const r of rows) {
      if (r.ma_san_pham in draft) {
        const next = draft[r.ma_san_pham]
        const cur = r.ten_define ?? ''
        if (next !== cur) c++
      }
    }
    return c
  }, [rows, draft])

  function setRowDraft(ma: string, val: string) {
    setDraft(d => ({ ...d, [ma]: val }))
  }

  async function saveAll() {
    if (unsavedCount === 0) return
    setSaving(true)
    try {
      const payload = rows
        .filter(r => r.ma_san_pham in draft)
        .map(r => ({
          ma_san_pham: r.ma_san_pham,
          ten_shopee: r.ten_shopee,
          sku_code: r.sku_code,
          ten_define: draft[r.ma_san_pham].trim() || null,
        }))
      const r = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', brand_name: brandName, rows: payload }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Lỗi lưu')
      onToast?.(`Đã lưu ${j.updated} sản phẩm`, 'success')
      await load()
    } catch (e) {
      onToast?.(e instanceof Error ? e.message : 'Lỗi lưu', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function deleteSelected() {
    if (selectedIds.size === 0) return
    const n = selectedIds.size
    if (!confirm(`Xoá ${n} sản phẩm khỏi Master Shopee? Hành động không thể hoàn tác.`)) return
    setDeleting(true)
    try {
      const ids = rows.filter(r => r.id && selectedIds.has(r.id)).map(r => r.id!)
      const r = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', brand_name: brandName, ids }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Lỗi xoá')
      onToast?.(`Đã xoá ${j.deleted} sản phẩm Shopee`, 'success')
      await load()
    } catch (e) {
      onToast?.(e instanceof Error ? e.message : 'Lỗi xoá', 'error')
    } finally {
      setDeleting(false)
    }
  }

  async function deleteOne(id: string | undefined) {
    if (!id) return
    if (!confirm('Xoá sản phẩm này?')) return
    try {
      const r = await fetch(`/api/products?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Lỗi xoá')
      onToast?.('Đã xoá 1 sản phẩm', 'success')
      await load()
    } catch (e) {
      onToast?.(e instanceof Error ? e.message : 'Lỗi xoá', 'error')
    }
  }

  function toggleSelect(id: string | undefined) {
    if (!id) return
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    const ids = filtered.map(r => r.id).filter((x): x is string => !!x)
    const allSelected = ids.length > 0 && ids.every(id => selectedIds.has(id))
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (allSelected) ids.forEach(id => next.delete(id))
      else ids.forEach(id => next.add(id))
      return next
    })
  }

  async function handleFileChosen(file: File) {
    try {
      const parsed = await parseMasterFile(file)
      if (parsed.length === 0) {
        onToast?.('File không có dòng sản phẩm nào', 'error')
        return
      }
      // Mark existing
      const existSet = new Set(rows.map(r => r.ma_san_pham))
      parsed.forEach(p => {
        p.exists = existSet.has(p.ma_san_pham)
        const existing = rows.find(r => r.ma_san_pham === p.ma_san_pham)
        p.existing_ten_define = existing?.ten_define ?? null
      })
      setPreview(parsed)
    } catch (e) {
      onToast?.(e instanceof Error ? e.message : 'Lỗi đọc file', 'error')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function confirmImport() {
    if (!preview) return
    setImporting(true)
    try {
      const r = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'import', brand_name: brandName, rows: preview }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Lỗi import')
      onToast?.(`Đã import ${j.inserted} sản phẩm mới (${j.skipped} đã có, giữ nguyên)`, 'success')
      setPreview(null)
      await load()
    } catch (e) {
      onToast?.(e instanceof Error ? e.message : 'Lỗi import', 'error')
    } finally {
      setImporting(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '6px 10px',
    background: 'rgba(255,255,255,.04)',
    border: '1px solid rgba(255,255,255,.1)',
    borderRadius: 6,
    color: '#e2e8f0',
    fontSize: 12.5,
    fontFamily: 'inherit',
  } as const

  const definedCount = rows.filter(r => (draft[r.ma_san_pham] ?? r.ten_define ?? '').trim()).length

  return (
    <div>
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <input
          type="search"
          placeholder="Tìm Mã / tên Shopee / tên define..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, flex: 1, minWidth: 200, padding: '8px 12px' }}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={e => {
            const f = e.target.files?.[0]
            if (f) handleFileChosen(f)
          }}
          style={{ display: 'none' }}
        />
        <button className="btn-s" onClick={() => fileInputRef.current?.click()}>
          ⬆ Upload Master
        </button>
        {selectedIds.size > 0 && (
          <button
            className="btn-s"
            onClick={deleteSelected}
            disabled={deleting}
            style={{
              background: 'rgba(239,68,68,.12)',
              borderColor: 'rgba(239,68,68,.4)',
              color: '#fca5a5',
              fontWeight: 700,
            }}
            title={`Xoá ${selectedIds.size} sản phẩm đã chọn`}
          >
            {deleting ? 'Đang xoá...' : `Xoá đã chọn (${selectedIds.size})`}
          </button>
        )}
        <button
          className="btn-p"
          onClick={saveAll}
          disabled={saving || unsavedCount === 0}
          title={unsavedCount === 0 ? 'Không có thay đổi' : `Lưu ${unsavedCount} thay đổi`}
        >
          {saving ? 'Đang lưu...' : `Lưu (${unsavedCount})`}
        </button>
      </div>

      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10 }}>
        Tổng <strong>{rows.length}</strong> SP · Đã define <strong>{definedCount}</strong> · Nhóm{' '}
        <strong>{groupCount.size}</strong>
      </div>

      <datalist id="define-suggestions">
        {defineSuggestions.map(s => (
          <option key={s} value={s} />
        ))}
      </datalist>

      <div
        className="scroll-thin"
        style={{
          border: '1px solid rgba(255,255,255,.08)',
          borderRadius: 10,
          overflow: 'auto',
          maxHeight: 'calc(100vh - 320px)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, color: '#cbd5e1' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: '#0f172a' }}>
            <tr>
              <th style={{ ...thStyle(30), padding: '10px 8px' }}>
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && filtered.every(r => r.id && selectedIds.has(r.id))}
                  ref={el => {
                    if (!el) return
                    const ids = filtered.map(r => r.id).filter((x): x is string => !!x)
                    const any = ids.some(id => selectedIds.has(id))
                    const all = ids.length > 0 && ids.every(id => selectedIds.has(id))
                    el.indeterminate = any && !all
                  }}
                  onChange={toggleSelectAll}
                  title="Chọn tất cả (đang hiển thị)"
                />
              </th>
              <th style={thStyle(140)}>Mã SP</th>
              <th style={thStyle(110)}>SKU</th>
              <th style={thStyle()}>Tên Shopee</th>
              <th style={thStyle(220)}>Tên define</th>
              <th style={{ ...thStyle(48), textAlign: 'center' as const }}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>
                  Đang tải...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>
                  {rows.length === 0
                    ? 'Chưa có sản phẩm — upload file Master để bắt đầu.'
                    : 'Không khớp tìm kiếm.'}
                </td>
              </tr>
            ) : (
              filtered.map(r => {
                const draftVal = draft[r.ma_san_pham]
                const display = draftVal ?? r.ten_define ?? ''
                const isDirty = draftVal != null && draftVal !== (r.ten_define ?? '')
                const grpCount = groupCount.get(display.trim()) ?? 0
                return (
                  <tr
                    key={r.ma_san_pham}
                    style={{
                      borderTop: '1px solid rgba(255,255,255,.05)',
                      background: isDirty
                        ? 'rgba(251,191,36,.05)'
                        : r.id && selectedIds.has(r.id)
                          ? 'rgba(239,68,68,.05)'
                          : undefined,
                    }}
                  >
                    <td style={{ ...tdStyle, padding: '8px 8px' }}>
                      <input
                        type="checkbox"
                        checked={r.id ? selectedIds.has(r.id) : false}
                        onChange={() => toggleSelect(r.id)}
                      />
                    </td>
                    <td style={tdStyle}>
                      <code style={{ fontSize: 11.5, color: '#94a3b8' }}>{r.ma_san_pham}</code>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ fontSize: 11.5, color: '#94a3b8' }}>{r.sku_code || '—'}</span>
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          display: 'block',
                          maxHeight: 40,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          color: '#cbd5e1',
                          fontSize: 12,
                          lineHeight: 1.4,
                        }}
                        title={r.ten_shopee || ''}
                      >
                        {r.ten_shopee || '—'}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, position: 'relative' }}>
                      <input
                        type="text"
                        list="define-suggestions"
                        value={display}
                        onChange={e => setRowDraft(r.ma_san_pham, e.target.value)}
                        placeholder="Đặt tên ngắn..."
                        style={inputStyle}
                      />
                      {grpCount > 1 && display.trim() && (
                        <span
                          style={{
                            display: 'inline-block',
                            marginTop: 4,
                            fontSize: 10,
                            color: '#60a5fa',
                            fontWeight: 600,
                          }}
                        >
                          Group ({grpCount} SP)
                        </span>
                      )}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <button
                        onClick={() => deleteOne(r.id)}
                        title="Xoá SP này"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#64748b',
                          cursor: 'pointer',
                          padding: '4px 8px',
                          borderRadius: 4,
                          fontSize: 14,
                          lineHeight: 1,
                          transition: 'color .12s, background .12s',
                        }}
                        onMouseEnter={e => {
                          const el = e.currentTarget as HTMLButtonElement
                          el.style.color = '#fca5a5'
                          el.style.background = 'rgba(239,68,68,.1)'
                        }}
                        onMouseLeave={e => {
                          const el = e.currentTarget as HTMLButtonElement
                          el.style.color = '#64748b'
                          el.style.background = 'transparent'
                        }}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Preview modal */}
      {preview && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.6)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={() => !importing && setPreview(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#0f172a',
              border: '1px solid rgba(255,255,255,.1)',
              borderRadius: 12,
              padding: 20,
              maxWidth: 720,
              width: '100%',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#f1f5f9' }}>Preview Master Import</h3>
            <div style={{ fontSize: 12.5, color: '#94a3b8' }}>
              File chứa <strong>{preview.length}</strong> sản phẩm.{' '}
              <span style={{ color: '#34d399' }}>{preview.filter(p => !p.exists).length} mới</span> ·{' '}
              <span style={{ color: '#fbbf24' }}>{preview.filter(p => p.exists).length} đã có</span> (giữ
              nguyên tên define cũ).
            </div>

            <div
              style={{
                border: '1px solid rgba(255,255,255,.08)',
                borderRadius: 8,
                overflow: 'auto',
                flex: 1,
                minHeight: 200,
              }}
            >
              <table style={{ width: '100%', fontSize: 12, color: '#cbd5e1', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#0f172a' }}>
                  <tr>
                    <th style={thStyle(140)}>Mã SP</th>
                    <th style={thStyle()}>Tên Shopee</th>
                    <th style={thStyle(80)}>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map(p => (
                    <tr key={p.ma_san_pham} style={{ borderTop: '1px solid rgba(255,255,255,.05)' }}>
                      <td style={tdStyle}>
                        <code style={{ fontSize: 11 }}>{p.ma_san_pham}</code>
                      </td>
                      <td style={{ ...tdStyle, maxWidth: 320 }}>
                        <span
                          style={{
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={p.ten_shopee || ''}
                        >
                          {p.ten_shopee || '—'}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {p.exists ? (
                          <span style={{ fontSize: 10.5, color: '#fbbf24', fontWeight: 700 }}>Đã có</span>
                        ) : (
                          <span style={{ fontSize: 10.5, color: '#34d399', fontWeight: 700 }}>Mới</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn-s" onClick={() => setPreview(null)} disabled={importing}>
                Huỷ
              </button>
              <button className="btn-p" onClick={confirmImport} disabled={importing}>
                {importing ? 'Đang import...' : `Import ${preview.filter(p => !p.exists).length} mới`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function thStyle(width?: number): React.CSSProperties {
  return {
    textAlign: 'left',
    padding: '10px 12px',
    fontWeight: 700,
    fontSize: 11,
    color: '#94a3b8',
    letterSpacing: '.04em',
    textTransform: 'uppercase',
    borderBottom: '1px solid rgba(255,255,255,.08)',
    width,
    whiteSpace: 'nowrap',
  }
}

const tdStyle: React.CSSProperties = {
  padding: '8px 12px',
  verticalAlign: 'top',
}
