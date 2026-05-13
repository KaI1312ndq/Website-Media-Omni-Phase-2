'use client'

import { useMemo, useState } from 'react'
import { Icon } from '@/lib/icons'
import {
  toShopeeVerticalPivot,
  type ShopeePivot,
  type ShopeeMetricFormat,
  type ShopeeVerticalRow,
} from '@/lib/report/parsers'

interface Props {
  pivot: ShopeePivot
}

const VN_INT = new Intl.NumberFormat('vi-VN')
const VN_DEC = new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function fmt(value: number | null, format: ShopeeMetricFormat): string {
  if (value === null || !isFinite(value)) return '—'
  if (format === 'percent') return VN_DEC.format(value) + '%'
  if (format === 'decimal') return VN_DEC.format(value)
  return VN_INT.format(Math.round(value))
}

/** Compute rowspan per group of consecutive same hinh_thuc rows. */
function computeRowSpans(rows: ShopeeVerticalRow[]): number[] {
  const spans = new Array(rows.length).fill(0)
  let i = 0
  while (i < rows.length) {
    let j = i
    while (j < rows.length && rows[j].hinh_thuc === rows[i].hinh_thuc) j++
    spans[i] = j - i
    i = j
  }
  return spans
}

const HINH_THUC_COLOR: Record<string, { bg: string; text: string }> = {
  'Ads tổng': { bg: 'rgba(37,99,235,.12)', text: '#93c5fd' },
  'Ads CPC': { bg: 'rgba(168,85,247,.1)', text: '#c4b5fd' },
  'Ads nhận diện thương hiệu': { bg: 'rgba(249,115,22,.1)', text: '#fdba74' },
  'Ads livestream': { bg: 'rgba(16,185,129,.1)', text: '#6ee7b7' },
}

export default function ShopeePivotPreview({ pivot }: Props) {
  const [copied, setCopied] = useState(false)

  const vertical = useMemo(() => toShopeeVerticalPivot(pivot), [pivot])

  // Copy only the "Thực hiện" column (one value per line) — so user can
  // paste straight into the values column of their template in Lark/Sheets.
  const valuesText = useMemo(() => vertical.rows.map(r => fmt(r.value, r.format)).join('\n'), [vertical])

  async function copyValues() {
    try {
      await navigator.clipboard.writeText(valuesText)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = valuesText
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
      } catch {
        /* ignore */
      }
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (vertical.rows.length === 0) {
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

  const spans = computeRowSpans(vertical.rows)

  return (
    <div>
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
          Tip: kéo chuột chọn ô để copy đoạn — hoặc bấm nút để copy cột giá trị
        </div>
        <button
          type="button"
          onClick={copyValues}
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
          title="Copy 26 giá trị cột Thực hiện — paste thẳng vào template Lark/Sheets"
        >
          {copied ? Icon.check(13) : Icon.send(13)}
          {copied ? `Đã copy ${vertical.rows.length} giá trị!` : `Copy cột giá trị (${vertical.rows.length})`}
        </button>
      </div>

      <div
        style={{
          overflowX: 'auto',
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,.08)',
          userSelect: 'text',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 13,
            color: '#cbd5e1',
            userSelect: 'text',
          }}
        >
          <thead>
            <tr style={{ background: 'rgba(255,255,255,.04)' }}>
              <th
                style={{
                  textAlign: 'left',
                  padding: '10px 14px',
                  fontWeight: 700,
                  fontSize: 11,
                  color: '#94a3b8',
                  letterSpacing: '.04em',
                  textTransform: 'uppercase',
                  borderBottom: '1px solid rgba(255,255,255,.08)',
                  borderRight: '1px solid rgba(255,255,255,.04)',
                  width: 220,
                }}
              >
                Hình thức
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '10px 14px',
                  fontWeight: 700,
                  fontSize: 11,
                  color: '#94a3b8',
                  letterSpacing: '.04em',
                  textTransform: 'uppercase',
                  borderBottom: '1px solid rgba(255,255,255,.08)',
                  borderRight: '1px solid rgba(255,255,255,.04)',
                }}
              >
                Metric
              </th>
              <th
                style={{
                  textAlign: 'right',
                  padding: '10px 14px',
                  fontWeight: 700,
                  fontSize: 11,
                  color: '#94a3b8',
                  letterSpacing: '.04em',
                  textTransform: 'uppercase',
                  borderBottom: '1px solid rgba(255,255,255,.08)',
                  width: 220,
                }}
              >
                Thực hiện
              </th>
            </tr>
          </thead>
          <tbody>
            {vertical.rows.map((row, i) => {
              const span = spans[i]
              const showHinhThuc = span > 0
              const color = HINH_THUC_COLOR[row.hinh_thuc] ?? HINH_THUC_COLOR['Ads CPC']
              return (
                <tr
                  key={i}
                  style={{
                    background: row.isBold ? color.bg : 'transparent',
                    fontWeight: row.isBold ? 700 : 400,
                    color: row.isBold ? '#e2e8f0' : '#cbd5e1',
                    borderTop: '1px solid rgba(255,255,255,.04)',
                  }}
                >
                  {showHinhThuc && (
                    <td
                      rowSpan={span}
                      style={{
                        padding: '10px 14px',
                        verticalAlign: 'middle',
                        background: color.bg,
                        color: color.text,
                        fontWeight: 700,
                        fontSize: 12.5,
                        borderRight: '1px solid rgba(255,255,255,.06)',
                      }}
                    >
                      {row.hinh_thuc}
                    </td>
                  )}
                  <td style={{ padding: '8px 14px', borderRight: '1px solid rgba(255,255,255,.04)' }}>
                    {row.metric}
                  </td>
                  <td
                    style={{
                      padding: '8px 14px',
                      textAlign: 'right',
                      fontFamily: 'var(--font-mono), "Be Vietnam Pro", ui-monospace, monospace',
                      fontSize: 12.5,
                    }}
                  >
                    {fmt(row.value, row.format)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
