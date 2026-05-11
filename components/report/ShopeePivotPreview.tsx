'use client'

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

export default function ShopeePivotPreview({ pivot }: Props) {
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

  return (
    <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid rgba(255,255,255,.08)' }}>
      <table
        style={{
          width: '100%',
          minWidth: 1100,
          borderCollapse: 'collapse',
          fontSize: 12.5,
          color: '#cbd5e1',
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
                {COLS.map(c => (
                  <td
                    key={c.key}
                    style={{
                      textAlign: c.align ?? 'right',
                      padding: '8px 12px',
                      whiteSpace: 'nowrap',
                      fontFamily: c.align === 'left' ? 'inherit' : 'var(--font-mono), monospace',
                      fontSize: c.align === 'left' ? 12.5 : 12,
                    }}
                  >
                    {cellValue(row, c.key)}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
