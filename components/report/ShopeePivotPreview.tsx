'use client'

import { useMemo, useState } from 'react'
import { Icon } from '@/lib/icons'
import {
  toShopeeVerticalPivot,
  type PivotRow,
  type ShopeePivot,
  type ShopeeMetricFormat,
  type ShopeeVerticalRow,
} from '@/lib/report/parsers'

interface Props {
  pivot: ShopeePivot
}

type ViewMode = 'vertical' | 'horizontal'

const VN_INT = new Intl.NumberFormat('vi-VN')
const VN_DEC = new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function fmt(value: number | null, format: ShopeeMetricFormat): string {
  if (value === null || !isFinite(value)) return '—'
  if (format === 'percent') return VN_DEC.format(value) + '%'
  if (format === 'decimal') return VN_DEC.format(value)
  return VN_INT.format(Math.round(value))
}

function fmtInt(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—'
  return VN_INT.format(Math.round(v))
}

function fmtDec(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—'
  return VN_DEC.format(v)
}

function fmtPct(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—'
  return VN_DEC.format(v) + '%'
}

/** Compute rowspan per group of consecutive same hinh_thuc rows. */
function computeRowSpans<T extends { hinh_thuc: string }>(rows: T[]): number[] {
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
  'Ads Branding': { bg: 'rgba(249,115,22,.1)', text: '#fdba74' },
  'Ads Live': { bg: 'rgba(16,185,129,.1)', text: '#6ee7b7' },
  'Ads nhận diện thương hiệu': { bg: 'rgba(249,115,22,.1)', text: '#fdba74' },
  'Ads livestream': { bg: 'rgba(16,185,129,.1)', text: '#6ee7b7' },
}

const HORIZONTAL_COLS: {
  key: keyof PivotRow | 'hinh_thuc' | 'loai_dvht'
  label: string
  align?: 'left' | 'right'
}[] = [
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

function horizontalCellValue(row: PivotRow, key: (typeof HORIZONTAL_COLS)[number]['key']): string {
  switch (key) {
    case 'hinh_thuc':
      return row.isGrandTotal ? 'Tổng cộng' : row.hinh_thuc
    case 'loai_dvht':
      return row.isGrandTotal ? '' : row.loai_dvht
    case 'gmv':
    case 'cost':
    case 'hien_thi':
    case 'orders':
      return fmtInt(row[key] as number)
    case 'clicks':
    case 'cpc':
      return fmtInt(row[key] as number | null)
    case 'roas':
      return fmtDec(row.roas)
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

async function clipboardWrite(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    try {
      document.execCommand('copy')
    } catch {
      /* ignore */
    }
    document.body.removeChild(ta)
  }
}

export default function ShopeePivotPreview({ pivot }: Props) {
  const [view, setView] = useState<ViewMode>('vertical')
  const [copiedKind, setCopiedKind] = useState<'values' | 'table' | null>(null)

  const vertical = useMemo(() => toShopeeVerticalPivot(pivot), [pivot])

  // ── Vertical view: 3 cols (Hình thức / Metric / Thực hiện) ──
  const verticalValuesText = useMemo(
    () => vertical.rows.map(r => fmt(r.value, r.format)).join('\n'),
    [vertical],
  )
  const verticalTableText = useMemo(() => {
    const header = ['Hình thức', 'Metric', 'Thực hiện'].join('\t')
    const rows = vertical.rows.map(r => [r.hinh_thuc, r.metric, fmt(r.value, r.format)].join('\t'))
    return [header, ...rows].join('\n')
  }, [vertical])

  // ── Horizontal view: 14 cols, original layout from screenshot ──
  // Values only: each row's 12 numeric columns (skip Hình thức + Loại DVHT),
  // tab-separated, one row per line.
  const horizontalValuesText = useMemo(() => {
    return pivot.rows
      .map(r =>
        HORIZONTAL_COLS.slice(2)
          .map(c => horizontalCellValue(r, c.key))
          .join('\t'),
      )
      .join('\n')
  }, [pivot])
  const horizontalTableText = useMemo(() => {
    const header = HORIZONTAL_COLS.map(c => c.label).join('\t')
    const rows = pivot.rows.map(r => HORIZONTAL_COLS.map(c => horizontalCellValue(r, c.key)).join('\t'))
    return [header, ...rows].join('\n')
  }, [pivot])

  async function doCopy(kind: 'values' | 'table') {
    const text =
      view === 'vertical'
        ? kind === 'values'
          ? verticalValuesText
          : verticalTableText
        : kind === 'values'
          ? horizontalValuesText
          : horizontalTableText
    await clipboardWrite(text)
    setCopiedKind(kind)
    setTimeout(() => setCopiedKind(null), 2000)
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
        <div
          style={{
            display: 'inline-flex',
            background: 'rgba(255,255,255,.04)',
            borderRadius: 8,
            padding: 3,
            border: '1px solid rgba(255,255,255,.06)',
          }}
        >
          {[
            { val: 'vertical' as ViewMode, label: 'Dọc (3 cột)' },
            { val: 'horizontal' as ViewMode, label: 'Ngang (14 cột)' },
          ].map(opt => (
            <button
              key={opt.val}
              type="button"
              onClick={() => setView(opt.val)}
              style={{
                padding: '6px 12px',
                background: view === opt.val ? 'rgba(59,130,246,.18)' : 'transparent',
                color: view === opt.val ? '#60a5fa' : '#94a3b8',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                transition: 'all .15s',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <CopyButton
            kind="values"
            copied={copiedKind === 'values'}
            onClick={() => doCopy('values')}
            view={view}
          />
          <CopyButton
            kind="table"
            copied={copiedKind === 'table'}
            onClick={() => doCopy('table')}
            view={view}
          />
        </div>
      </div>

      {/* Table */}
      <div
        className="scroll-thin"
        style={{
          overflowX: 'auto',
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,.08)',
          userSelect: 'text',
        }}
      >
        {view === 'vertical' ? <VerticalTable rows={vertical.rows} /> : <HorizontalTable rows={pivot.rows} />}
      </div>
    </div>
  )
}

function CopyButton({
  kind,
  copied,
  onClick,
  view,
}: {
  kind: 'values' | 'table'
  copied: boolean
  onClick: () => void
  view: ViewMode
}) {
  const isValues = kind === 'values'
  const labelIdle = isValues
    ? view === 'vertical'
      ? 'Copy giá trị (1 cột)'
      : 'Copy giá trị (12 cột)'
    : 'Copy cả bảng (TSV)'
  const labelCopied = isValues ? 'Đã copy giá trị!' : 'Đã copy cả bảng!'
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        background: copied
          ? 'rgba(16,185,129,.15)'
          : isValues
            ? 'rgba(59,130,246,.12)'
            : 'rgba(168,85,247,.12)',
        border: `1px solid ${
          copied ? 'rgba(16,185,129,.4)' : isValues ? 'rgba(59,130,246,.3)' : 'rgba(168,85,247,.3)'
        }`,
        color: copied ? '#34d399' : isValues ? '#60a5fa' : '#c4b5fd',
        borderRadius: 6,
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: 600,
        transition: 'all .15s',
      }}
      title={
        isValues
          ? 'Copy chỉ các số (paste vào template có sẵn)'
          : 'Copy nguyên bảng kèm header (paste vào sheet trống)'
      }
    >
      {copied ? Icon.check(13) : Icon.send(13)}
      {copied ? labelCopied : labelIdle}
    </button>
  )
}

function thStyle(width?: number, align: 'left' | 'right' = 'right'): React.CSSProperties {
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

/* ── Vertical (current) ── */
function VerticalTable({ rows }: { rows: ShopeeVerticalRow[] }) {
  const spans = computeRowSpans(rows)
  return (
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
          <th style={thStyle(220, 'left')}>Hình thức</th>
          <th style={thStyle(undefined, 'left')}>Metric</th>
          <th style={thStyle(220, 'right')}>Thực hiện</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => {
          const span = spans[i]
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
              {span > 0 && (
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
  )
}

/* ── Horizontal (original 14 cols, like the screenshot user attached) ── */
function HorizontalTable({ rows }: { rows: PivotRow[] }) {
  // For rowSpan we need to group by hinh_thuc (skip grand total which has '').
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

  return (
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
          {HORIZONTAL_COLS.map(c => (
            <th key={c.key} style={thStyle(undefined, c.align ?? 'right')}>
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, idx) => {
          const isTotalRow = row.isTotal && !row.isGrandTotal
          const isGrand = !!row.isGrandTotal
          const span = spans[idx]
          const showHinhThuc = span > 0
          const color = HINH_THUC_COLOR[row.hinh_thuc] ?? HINH_THUC_COLOR['Ads CPC']
          return (
            <tr
              key={idx}
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
              {HORIZONTAL_COLS.map(c => {
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
                      fontFamily:
                        c.align === 'left'
                          ? 'inherit'
                          : 'var(--font-mono), "Be Vietnam Pro", ui-monospace, monospace',
                      fontSize: c.align === 'left' ? 12.5 : 12,
                      borderRight: '1px solid rgba(255,255,255,.04)',
                      ...(c.key === 'hinh_thuc' && rowSpan && rowSpan > 1
                        ? {
                            verticalAlign: 'middle',
                            background: color.bg,
                            color: color.text,
                            fontWeight: 700,
                          }
                        : {}),
                    }}
                  >
                    {horizontalCellValue(row, c.key)}
                  </td>
                )
              })}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
