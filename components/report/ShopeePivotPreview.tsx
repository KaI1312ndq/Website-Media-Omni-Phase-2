'use client'

import { useMemo, useState } from 'react'
import { Icon } from '@/lib/icons'
import type { PivotRow, ShopeePivot } from '@/lib/report/parsers'

interface Props {
  pivot: ShopeePivot
}

const COLS: { key: keyof PivotRow | 'hinh_thuc' | 'loai_dvht'; label: string; align?: 'left' | 'right' }[] = [
  { key: 'hinh_thuc', label: 'Hình thức', align: 'left' },
  { key: 'loai_dvht', label: 'Loại Dịch vụ Hiển thị', align: 'left' },
  { key: 'gmv', label: 'GMV' },
  { key: 'cost', label: 'Cost' },
  { key: 'roas', label: 'ROAS' },
  { key: 'hien_thi', label: 'Hiển thị' },
  { key: 'clicks', label: 'Clicks' },
  { key: 'orders', label: 'Orders' },
  { key: 'cpc', label: 'CPC' },
  { key: 'cpm', label: 'CPM' },
  { key: 'ctr', label: 'CTR' },
  { key: 'cr', label: 'CR' },
  { key: 'pct_gmv', label: '%GMV' },
  { key: 'pct_cost', label: '%Cost' },
]

const VN_INT = new Intl.NumberFormat('vi-VN')
const VN_DEC = new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function fmtInt(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—'
  return VN_INT.format(v)
}

function fmtDecimal(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—'
  return VN_DEC.format(v)
}

function fmtPct(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—'
  return VN_DEC.format(v) + '%'
}

function cellValue(row: PivotRow, key: (typeof COLS)[number]['key']): string {
  switch (key) {
    case 'hinh_thuc':
      return row.hinh_thuc
    case 'loai_dvht':
      return row.loai_dvht
    case 'gmv':
    case 'cost':
    case 'hien_thi':
    case 'orders':
      return fmtInt(row[key] as number)
    case 'clicks':
    case 'cpc':
      return fmtInt(row[key] as number | null)
    case 'roas':
      return fmtDecimal(row.roas)
    case 'cpm':
      return fmtInt(row.cpm)
    case 'ctr':
    case 'cr':
      return fmtPct(row[key] as number | null)
    case 'pct_gmv':
    case 'pct_cost':
      return fmtPct(row[key] as number)
    default:
      return ''
  }
}

/**
 * Compute, for each row, how many consecutive following rows share the same
 * hinh_thuc. Used to render a vertical merged "Hình thức" cell via rowSpan.
 * Grand total (empty hinh_thuc) is never merged.
 */
function computeRowSpans(rows: PivotRow[]): number[] {
  const spans: number[] = new Array(rows.length).fill(0)
  let i = 0
  while (i < rows.length) {
    if (!rows[i].hinh_thuc || rows[i].isGrandTotal) {
      spans[i] = 1
      i++
      continue
    }
    let j = i
    while (j < rows.length && rows[j].hinh_thuc === rows[i].hinh_thuc && !rows[j].isGrandTotal) j++
    spans[i] = j - i
    i = j
  }
  return spans
}

export default function ShopeePivotPreview({ pivot }: Props) {
  const [copied, setCopied] = useState(false)

  // Build TSV (tab-separated values) — paste-friendly for Sheets/Excel/Lark.
  // Always emits a hinh_thuc value per row (no rowspan) so every cell has data.
  const tsv = useMemo(() => {
    const header = COLS.map(c => c.label).join('\t')
    const rows = pivot.rows.map(r => COLS.map(c => cellValue(r, c.key)).join('\t'))
    return [header, ...rows].join('\n')
  }, [pivot])

  async function copyTsv() {
    try {
      await navigator.clipboard.writeText(tsv)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: select+copy via temp textarea
      const ta = document.createElement('textarea')
      ta.value = tsv
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
      } catch {
        /* ignore */
      }
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (pivot.rows.length === 0) {
    return (
      <div
        style={{
          padding: 24,
          textAlign: 'center',
          color: '#94a3b8',
          background: 'rgba(255,255,255,.02)',
          borderRadius: 10,
        }}
      >
        Chưa có dữ liệu — upload file để xem preview.
      </div>
    )
  }

  const spans = computeRowSpans(pivot.rows)

  return (
    <div>
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ fontSize: 12, color: '#94a3b8' }}>
          Tip: kéo chuột chọn ô để copy từng phần — hoặc dùng nút →
        </div>
        <button
          type="button"
          onClick={copyTsv}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            background: copied ? 'rgba(16,185,129,.15)' : 'rgba(59,130,246,.12)',
            border: `1px solid ${copied ? 'rgba(16,185,129,.4)' : 'rgba(59,130,246,.3)'}`,
            color: copied ? '#34d399' : '#60a5fa',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            transition: 'all .15s',
          }}
        >
          {copied ? Icon.check(13) : Icon.send(13)}
          {copied ? 'Đã copy bảng!' : 'Copy bảng (TSV)'}
        </button>
      </div>

      <div
        style={{
          overflowX: 'auto',
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,.08)',
          userSelect: 'text', // allow selecting cells like a spreadsheet
        }}
      >
        <table
          style={{
            width: '100%',
            minWidth: 1100,
            borderCollapse: 'collapse',
            fontSize: 12.5,
            color: '#cbd5e1',
            userSelect: 'text',
          }}
        >
          <thead>
            <tr style={{ background: 'rgba(255,255,255,.04)' }}>
              {COLS.map(c => (
                <th
                  key={c.key}
                  style={{
                    textAlign: c.align ?? 'right',
                    padding: '10px 12px',
                    fontWeight: 700,
                    fontSize: 11,
                    color: '#94a3b8',
                    letterSpacing: '.04em',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid rgba(255,255,255,.08)',
                    borderRight: '1px solid rgba(255,255,255,.04)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pivot.rows.map((row, i) => {
              const isTotalRow = row.isTotal && !row.isGrandTotal
              const isGrand = row.isGrandTotal
              const span = spans[i]
              const showHinhThuc = span > 0

              return (
                <tr
                  key={i}
                  style={{
                    background: isGrand
                      ? 'rgba(37,99,235,.1)'
                      : isTotalRow
                        ? 'rgba(255,255,255,.03)'
                        : 'transparent',
                    fontWeight: isTotalRow || isGrand ? 700 : 400,
                    borderTop:
                      isTotalRow || isGrand
                        ? '1px solid rgba(255,255,255,.12)'
                        : '1px solid rgba(255,255,255,.04)',
                    color: isGrand ? '#e2e8f0' : '#cbd5e1',
                  }}
                >
                  {COLS.map(c => {
                    // Skip hinh_thuc cell for non-leading rows in a span
                    if (c.key === 'hinh_thuc' && !showHinhThuc) return null
                    const rowSpan = c.key === 'hinh_thuc' && showHinhThuc ? span : undefined
                    return (
                      <td
                        key={c.key}
                        rowSpan={rowSpan}
                        style={{
                          textAlign: c.align ?? 'right',
                          padding: '8px 12px',
                          whiteSpace: 'nowrap',
                          fontFamily: c.align === 'left' ? 'inherit' : 'var(--font-mono), monospace',
                          fontSize: c.align === 'left' ? 12.5 : 12,
                          borderRight: '1px solid rgba(255,255,255,.04)',
                          ...(c.key === 'hinh_thuc' && rowSpan && rowSpan > 1
                            ? {
                                verticalAlign: 'middle',
                                background: 'rgba(255,255,255,.025)',
                                fontWeight: 700,
                                color: '#cbd5e1',
                              }
                            : {}),
                        }}
                      >
                        {cellValue(row, c.key)}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
