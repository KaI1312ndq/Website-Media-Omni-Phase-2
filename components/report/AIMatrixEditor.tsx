'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  AI_MATRIX_KEYS,
  AI_MATRIX_LABEL,
  type AIMatrixCell,
  type AIMatrixKey,
  type AIResult,
} from '@/lib/report/types'

interface Props {
  value: AIResult
  onChange: (next: AIResult) => void
  /** Hide rows from a platform the user didn't pick at Step 1. */
  shopeeChecked: boolean
  tiktokChecked: boolean
  /** localStorage key for autosave. Empty disables autosave. */
  autosaveKey?: string
}

type CellField = keyof AIMatrixCell

const CELL_COLS: { key: CellField; label: string; minHeight: number }[] = [
  { key: 'plan', label: 'Plan + đề xuất tuần trước', minHeight: 90 },
  { key: 'actual', label: 'Actual', minHeight: 90 },
  { key: 'danh_gia', label: 'Đánh giá', minHeight: 110 },
  { key: 'giai_phap', label: 'Giải pháp / Đề xuất', minHeight: 110 },
]

const ROW_TINT: Record<AIMatrixKey, string> = {
  shopee_ads_cpc: 'rgba(59,130,246,.04)',
  shopee_ads_nd: 'rgba(168,85,247,.04)',
  shopee_ads_live: 'rgba(249,115,22,.04)',
  tiktok_pgm: 'rgba(34,197,94,.04)',
  tiktok_lgm: 'rgba(20,184,166,.04)',
  tiktok_consideration: 'rgba(244,114,182,.04)',
  tiktok_branding: 'rgba(234,179,8,.04)',
}

export default function AIMatrixEditor({
  value,
  onChange,
  shopeeChecked,
  tiktokChecked,
  autosaveKey,
}: Props) {
  const visibleKeys = useMemo<AIMatrixKey[]>(() => {
    return AI_MATRIX_KEYS.filter(k => {
      const platform = AI_MATRIX_LABEL[k].platform
      if (platform === 'Shopee') return shopeeChecked
      if (platform === 'TikTok') return tiktokChecked
      return true
    })
  }, [shopeeChecked, tiktokChecked])

  // Group consecutive same-platform keys for rowSpan computation
  const platformSpans = useMemo(() => {
    const spans: number[] = []
    let i = 0
    while (i < visibleKeys.length) {
      const platform = AI_MATRIX_LABEL[visibleKeys[i]].platform
      let j = i
      while (j < visibleKeys.length && AI_MATRIX_LABEL[visibleKeys[j]].platform === platform) j++
      spans[i] = j - i
      for (let k = i + 1; k < j; k++) spans[k] = 0 // subsequent rows skip cell
      i = j
    }
    return spans
  }, [visibleKeys])

  function updateCell(rowKey: AIMatrixKey, field: CellField, val: string) {
    const next: AIResult = {
      ...value,
      [rowKey]: { ...value[rowKey], [field]: val },
    }
    onChange(next)
  }

  function updateOverview(field: 'highlight' | 'lowlight', val: string) {
    onChange({ ...value, [field]: val })
  }

  // ── Autosave to localStorage (debounced 10s) ──
  const lastSavedRef = useRef<string>('')
  useEffect(() => {
    if (!autosaveKey) return
    const serialized = JSON.stringify(value)
    if (serialized === lastSavedRef.current) return
    const t = setTimeout(() => {
      try {
        localStorage.setItem(autosaveKey, serialized)
        lastSavedRef.current = serialized
      } catch {
        /* quota or private mode — ignore */
      }
    }, 10_000)
    return () => clearTimeout(t)
  }, [value, autosaveKey])

  const textareaStyle = useCallback(
    (minHeight: number) =>
      ({
        width: '100%',
        minHeight,
        padding: '8px 10px',
        background: 'rgba(255,255,255,.03)',
        border: '1px solid rgba(255,255,255,.08)',
        borderRadius: 6,
        color: '#e2e8f0',
        fontSize: 12.5,
        fontFamily: 'inherit',
        resize: 'vertical' as const,
        lineHeight: 1.55,
        whiteSpace: 'pre-wrap' as const,
      }) as const,
    [],
  )

  return (
    <div>
      {/* ── Overview: highlight + lowlight ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
        <div
          style={{
            border: '1px solid rgba(16,185,129,.25)',
            background: 'rgba(16,185,129,.06)',
            borderRadius: 10,
            padding: '12px 14px',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#34d399',
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            Highlight
          </div>
          <textarea
            value={value.highlight}
            onChange={e => updateOverview('highlight', e.target.value)}
            placeholder="2-3 điểm sáng tuần này (mỗi bullet • một dòng)..."
            style={{
              ...textareaStyle(90),
              background: 'transparent',
              border: 'none',
              padding: 0,
              color: '#6ee7b7',
            }}
          />
        </div>
        <div
          style={{
            border: '1px solid rgba(239,68,68,.25)',
            background: 'rgba(239,68,68,.06)',
            borderRadius: 10,
            padding: '12px 14px',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#fca5a5',
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            Lowlight
          </div>
          <textarea
            value={value.lowlight}
            onChange={e => updateOverview('lowlight', e.target.value)}
            placeholder="2-3 điểm cần xử lý..."
            style={{
              ...textareaStyle(90),
              background: 'transparent',
              border: 'none',
              padding: 0,
              color: '#fca5a5',
            }}
          />
        </div>
      </div>

      {/* ── Matrix table ── */}
      <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid rgba(255,255,255,.08)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, color: '#cbd5e1' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,.04)' }}>
              <th style={thStyle(110)}>Sàn</th>
              <th style={thStyle(180)}>Hạng mục</th>
              {CELL_COLS.map(c => (
                <th key={c.key} style={thStyle(undefined, 'left')}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleKeys.map((rowKey, i) => {
              const cell = value[rowKey]
              const span = platformSpans[i]
              const labelInfo = AI_MATRIX_LABEL[rowKey]
              return (
                <tr
                  key={rowKey}
                  style={{
                    background: ROW_TINT[rowKey],
                    borderTop: '1px solid rgba(255,255,255,.06)',
                  }}
                >
                  {span > 0 && (
                    <td
                      rowSpan={span}
                      style={{
                        padding: '12px 10px',
                        verticalAlign: 'middle',
                        textAlign: 'center',
                        fontWeight: 800,
                        color: labelInfo.platform === 'Shopee' ? '#fb923c' : '#a78bfa',
                        fontSize: 14,
                        borderRight: '1px solid rgba(255,255,255,.08)',
                        background:
                          labelInfo.platform === 'Shopee' ? 'rgba(249,115,22,.06)' : 'rgba(168,85,247,.06)',
                      }}
                    >
                      {labelInfo.platform}
                    </td>
                  )}
                  <td
                    style={{
                      padding: '12px 12px',
                      fontWeight: 700,
                      color: '#e2e8f0',
                      borderRight: '1px solid rgba(255,255,255,.06)',
                      verticalAlign: 'top',
                      fontSize: 12.5,
                    }}
                  >
                    {labelInfo.label}
                  </td>
                  {CELL_COLS.map(col => (
                    <td
                      key={col.key}
                      style={{
                        padding: 8,
                        borderRight: '1px solid rgba(255,255,255,.04)',
                        verticalAlign: 'top',
                      }}
                    >
                      <textarea
                        value={cell[col.key]}
                        onChange={e => updateCell(rowKey, col.key, e.target.value)}
                        placeholder="—"
                        style={textareaStyle(col.minHeight)}
                      />
                    </td>
                  ))}
                </tr>
              )
            })}
            {visibleKeys.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>
                  Chưa chọn platform nào ở Bước 1.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {autosaveKey && (
        <div style={{ marginTop: 8, fontSize: 11, color: '#64748b', textAlign: 'right' }}>
          Tự lưu vào trình duyệt sau 10 giây không gõ — không thay thế nút "Lưu báo cáo".
        </div>
      )}
    </div>
  )
}

function thStyle(width?: number, align: 'left' | 'right' = 'left'): React.CSSProperties {
  return {
    textAlign: align,
    padding: '10px 12px',
    fontWeight: 700,
    fontSize: 11,
    color: '#94a3b8',
    letterSpacing: '.04em',
    textTransform: 'uppercase',
    borderBottom: '1px solid rgba(255,255,255,.08)',
    borderRight: '1px solid rgba(255,255,255,.04)',
    whiteSpace: 'nowrap',
    width,
  }
}
