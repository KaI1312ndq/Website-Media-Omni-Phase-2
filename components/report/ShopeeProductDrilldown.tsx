'use client'

/**
 * Shopee Product Drilldown — Brief V11 §7.
 *
 * Hiển thị bên dưới ShopeePivotPreview ở Step 1.5.
 * Filter "Dịch vụ Hiển thị Sản phẩm" + group theo Tên define.
 */

import { useMemo, useState } from 'react'
import type {
  ProductDrilldown,
  ProductDrilldownRow,
  CampaignRow,
} from '@/lib/report/parsers/shopee-product-drilldown'

interface Props {
  drilldown: ProductDrilldown
  /** Nếu Master rỗng → show empty-state CTA. */
  masterEmpty?: boolean
  brandName?: string
  topN: number
  onTopNChange: (n: number) => void
}

type TopNOption = 5 | 10 | 20 | 'All'

const fmtInt = (v: number) => (v === 0 ? '—' : Math.round(v).toLocaleString('vi-VN'))
const fmtDec = (v: number, digits = 2) =>
  v === 0 ? '—' : v.toLocaleString('vi-VN', { minimumFractionDigits: digits, maximumFractionDigits: digits })
const fmtPct = (v: number) =>
  v === 0 ? '—' : v.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%'

const COLS: { key: string; label: string; fmt: (v: number) => string; align?: 'right' }[] = [
  { key: 'gmv', label: 'GMV', fmt: fmtInt, align: 'right' },
  { key: 'cost', label: 'Cost', fmt: fmtInt, align: 'right' },
  { key: 'roas', label: 'ROAS', fmt: v => fmtDec(v, 2), align: 'right' },
  { key: 'cpc', label: 'CPC', fmt: fmtInt, align: 'right' },
  { key: 'ctr', label: 'CTR', fmt: fmtPct, align: 'right' },
  { key: 'cr', label: 'CR', fmt: fmtPct, align: 'right' },
  { key: 'cpm', label: 'CPM', fmt: fmtInt, align: 'right' },
  { key: 'hien_thi', label: 'Hiển thị', fmt: fmtInt, align: 'right' },
  { key: 'clicks', label: 'Click', fmt: fmtInt, align: 'right' },
  { key: 'orders', label: 'Đơn', fmt: fmtInt, align: 'right' },
  { key: 'aov', label: 'AOV', fmt: fmtInt, align: 'right' },
]

export default function ShopeeProductDrilldown({
  drilldown,
  masterEmpty,
  brandName,
  topN,
  onTopNChange,
}: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [copiedKind, setCopiedKind] = useState<'values' | 'table' | null>(null)

  function toggle(key: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // ── TSV exports ──
  const tableText = useMemo(() => {
    const header = ['#', 'Sản phẩm', ...COLS.map(c => c.label), 'Camps'].join('\t')
    const lines = drilldown.rows.map((r, i) =>
      [i + 1, r.ten_define, ...COLS.map(c => formatCell(r, c.key, c.fmt)), r.n_camps].join('\t'),
    )
    const total = [
      '',
      'TỔNG',
      ...COLS.map(c => formatCell(drilldown.total, c.key, c.fmt)),
      drilldown.total.n_camps,
    ].join('\t')
    return [header, ...lines, total].join('\n')
  }, [drilldown])

  const valuesText = useMemo(() => {
    const lines = drilldown.rows.map(r =>
      [r.ten_define, ...COLS.map(c => formatCell(r, c.key, c.fmt)), r.n_camps].join('\t'),
    )
    const total = [
      'TỔNG',
      ...COLS.map(c => formatCell(drilldown.total, c.key, c.fmt)),
      drilldown.total.n_camps,
    ].join('\t')
    return [...lines, total].join('\n')
  }, [drilldown])

  async function copy(kind: 'values' | 'table') {
    const text = kind === 'table' ? tableText : valuesText
    await writeClipboard(text)
    setCopiedKind(kind)
    setTimeout(() => setCopiedKind(null), 1400)
  }

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
        <div style={{ fontSize: 12, color: '#94a3b8' }}>
          {drilldown.rows.length} nhóm SP · {drilldown.total.n_camps} campaign · Filter:{' '}
          {drilldown.total_camps_in_file - drilldown.filtered_out}/{drilldown.total_camps_in_file} row
        </div>
        <div style={{ flex: 1 }} />
        <label
          style={{ fontSize: 12, color: '#cbd5e1', display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          Top campaigns
          <select
            value={topN === Infinity ? 'All' : topN}
            onChange={e => {
              const v = e.target.value
              onTopNChange(v === 'All' ? Infinity : Number(v))
            }}
            style={selectStyle}
          >
            {[5, 10, 20].map(n => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
            <option value="All">All</option>
          </select>
        </label>
        <CopyBtn kind="values" copied={copiedKind === 'values'} onClick={() => copy('values')} />
        <CopyBtn kind="table" copied={copiedKind === 'table'} onClick={() => copy('table')} />
      </div>

      {masterEmpty && (
        <div
          style={{
            border: '1px solid rgba(251,191,36,.25)',
            background: 'rgba(251,191,36,.06)',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 12.5,
            color: '#fbbf24',
            marginBottom: 12,
          }}
        >
          Chưa có Product Master cho brand <strong>{brandName}</strong>. Tất cả sản phẩm sẽ hiện{' '}
          <span style={{ color: '#fbbf24' }}>⚠️ Chưa định nghĩa</span>. Vào{' '}
          <a href="/hub/brands" style={{ color: '#60a5fa', textDecoration: 'underline' }}>
            Hub Brands
          </a>{' '}
          → tab Sản phẩm để upload Master.
        </div>
      )}

      {/* Table */}
      <div
        style={{
          border: '1px solid rgba(255,255,255,.08)',
          borderRadius: 10,
          overflow: 'auto',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, color: '#cbd5e1' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,.04)' }}>
              <th style={thStyle(40)}>#</th>
              <th style={thStyle()}>Sản phẩm</th>
              {COLS.map(c => (
                <th key={c.key} style={thStyle(undefined, 'right')}>
                  {c.label}
                </th>
              ))}
              <th style={thStyle(60, 'right')}>Camps</th>
            </tr>
          </thead>
          <tbody>
            {drilldown.rows.map((row, idx) => (
              <ProductRow
                key={row.ten_define + idx}
                row={row}
                index={idx + 1}
                expanded={expanded.has(row.ten_define)}
                onToggle={() => toggle(row.ten_define)}
              />
            ))}
            {drilldown.rows.length === 0 && (
              <tr>
                <td colSpan={3 + COLS.length} style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>
                  Không có row "Dịch vụ Hiển thị Sản phẩm" trong file.
                </td>
              </tr>
            )}
            {/* TỔNG row */}
            {drilldown.rows.length > 0 && (
              <tr
                style={{
                  borderTop: '2px solid rgba(255,255,255,.15)',
                  background: 'rgba(96,165,250,.08)',
                  fontWeight: 700,
                }}
              >
                <td style={tdStyle}></td>
                <td style={{ ...tdStyle, fontWeight: 800, color: '#f1f5f9' }}>TỔNG</td>
                {COLS.map(c => (
                  <td
                    key={c.key}
                    style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
                  >
                    {formatCell(drilldown.total, c.key, c.fmt)}
                  </td>
                ))}
                <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  {drilldown.total.n_camps}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ── Row component ── */
function ProductRow({
  row,
  index,
  expanded,
  onToggle,
}: {
  row: ProductDrilldownRow
  index: number
  expanded: boolean
  onToggle: () => void
}) {
  const nameColor = row.is_undefined ? '#fbbf24' : row.is_campaign_tong ? '#60a5fa' : '#e2e8f0'
  return (
    <>
      <tr
        onClick={onToggle}
        style={{
          borderTop: '1px solid rgba(255,255,255,.05)',
          cursor: 'pointer',
          background: expanded ? 'rgba(255,255,255,.03)' : undefined,
        }}
      >
        <td style={{ ...tdStyle, color: '#64748b', fontSize: 11.5 }}>{index}</td>
        <td style={{ ...tdStyle, color: nameColor, fontWeight: row.is_undefined ? 500 : 600 }}>
          <span style={{ display: 'inline-block', width: 14, color: '#64748b', fontSize: 11 }}>
            {expanded ? '▼' : '▶'}
          </span>{' '}
          {row.ten_define}
        </td>
        {COLS.map(c => (
          <td key={c.key} style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
            {formatCell(row, c.key, c.fmt)}
          </td>
        ))}
        <td style={{ ...tdStyle, textAlign: 'right', color: '#94a3b8' }}>{row.n_camps}</td>
      </tr>
      {expanded &&
        row.campaigns.map((camp, i) => (
          <tr
            key={`${row.ten_define}-${i}`}
            style={{
              borderTop: '1px solid rgba(255,255,255,.04)',
              background: 'rgba(255,255,255,.015)',
              fontSize: 11.5,
            }}
          >
            <td style={tdStyle}></td>
            <td style={{ ...tdStyle, paddingLeft: 32, color: '#94a3b8' }}>└ {camp.name}</td>
            {COLS.map(c => (
              <td
                key={c.key}
                style={{
                  ...tdStyle,
                  textAlign: 'right',
                  color: '#94a3b8',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {formatCell(camp, c.key, c.fmt)}
              </td>
            ))}
            <td style={tdStyle}></td>
          </tr>
        ))}
      {expanded && row.n_camps > row.campaigns.length && (
        <tr style={{ background: 'rgba(255,255,255,.015)' }}>
          <td></td>
          <td
            colSpan={1 + COLS.length + 1}
            style={{ ...tdStyle, paddingLeft: 32, color: '#64748b', fontSize: 11, fontStyle: 'italic' }}
          >
            Còn {row.n_camps - row.campaigns.length} campaign khác — đổi "Top campaigns" để xem.
          </td>
        </tr>
      )}
    </>
  )
}

function CopyBtn({
  kind,
  copied,
  onClick,
}: {
  kind: 'values' | 'table'
  copied: boolean
  onClick: () => void
}) {
  const labels = {
    values: copied ? 'Đã copy giá trị' : 'Copy giá trị',
    table: copied ? 'Đã copy bảng' : 'Copy cả bảng',
  }
  return (
    <button
      className="btn-s"
      onClick={onClick}
      style={{
        fontSize: 12,
        background: copied
          ? 'rgba(34,197,94,.15)'
          : kind === 'table'
            ? 'rgba(168,85,247,.12)'
            : 'rgba(59,130,246,.12)',
        borderColor: copied
          ? 'rgba(34,197,94,.4)'
          : kind === 'table'
            ? 'rgba(168,85,247,.35)'
            : 'rgba(59,130,246,.35)',
      }}
    >
      {labels[kind]}
    </button>
  )
}

/* ── Helpers ── */
function formatCell(row: object, key: string, fmt: (v: number) => string): string {
  const v = (row as Record<string, unknown>)[key]
  if (typeof v !== 'number') return '—'
  return fmt(v)
}

async function writeClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    try {
      document.execCommand('copy')
    } finally {
      document.body.removeChild(ta)
    }
  }
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
    whiteSpace: 'nowrap',
    width,
  }
}

const tdStyle: React.CSSProperties = {
  padding: '8px 12px',
  verticalAlign: 'middle',
}

const selectStyle: React.CSSProperties = {
  padding: '6px 8px',
  background: 'rgba(255,255,255,.05)',
  border: '1px solid rgba(255,255,255,.1)',
  borderRadius: 6,
  color: '#cbd5e1',
  fontSize: 12,
}
