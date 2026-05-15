'use client'

/**
 * TikTok Auth Section (Section 2) — Brief V12 §6.
 *
 * Phân loại theo Authorization type:
 *   - Thẻ sản phẩm (Creative = Product card)
 *   - Video Kênh (TikTok Shop official / Business Center)
 *   - Video KOC (Video code)
 *   - Video Aff (Affiliate mass + NaN auth + fallback)
 *
 * Hiển thị: PC row → 3 video rows → subtotal Video → grand total (Video+PC).
 */

import { useMemo, useState } from 'react'
import type {
  TiktokAuthSection as TAuthSection,
  TiktokAuthRow,
  TiktokAuthTotalRow,
} from '@/lib/report/parsers/tiktok-product-drilldown'

interface Props {
  section: TAuthSection
}

const fmtInt = (v: number) => (v === 0 ? '—' : Math.round(v).toLocaleString('vi-VN'))
const fmtDec = (v: number, d = 2) =>
  v === 0 ? '—' : v.toLocaleString('vi-VN', { minimumFractionDigits: d, maximumFractionDigits: d })
const fmtPct = (v: number) =>
  v === 0 ? '—' : v.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%'

type ColTint = 'gmv' | 'cost' | 'roas' | 'rate' | 'count' | undefined
const COLS: { key: string; label: string; fmt: (v: number) => string; tint?: ColTint; width?: number }[] = [
  { key: 'gmv', label: 'GMV', fmt: fmtInt, tint: 'gmv', width: 120 },
  { key: 'cost', label: 'Cost', fmt: fmtInt, tint: 'cost', width: 110 },
  { key: 'roas', label: 'ROAS', fmt: v => fmtDec(v, 2), tint: 'roas', width: 70 },
  { key: 'cpc', label: 'CPC', fmt: fmtInt, width: 80 },
  { key: 'ctr', label: 'CTR', fmt: fmtPct, tint: 'rate', width: 80 },
  { key: 'cr', label: 'CR', fmt: fmtPct, tint: 'rate', width: 80 },
  { key: 'cpm', label: 'CPM', fmt: fmtInt, width: 90 },
  { key: 'hien_thi', label: 'Hiển thị', fmt: fmtInt, width: 100 },
  { key: 'clicks', label: 'Click', fmt: fmtInt, width: 90 },
  { key: 'orders', label: 'Đơn', fmt: fmtInt, tint: 'count', width: 70 },
  { key: 'aov', label: 'AOV', fmt: fmtInt, width: 90 },
  { key: 'pct_gmv', label: '%GMV', fmt: fmtPct, tint: 'gmv', width: 70 },
  { key: 'pct_cost', label: '%Cost', fmt: fmtPct, tint: 'cost', width: 70 },
]

/** Tính %GMV / %Cost so với denom (section total). */
function withPct<T extends { gmv: number; cost: number }>(
  row: T,
  totalGmv: number,
  totalCost: number,
): T & { pct_gmv: number; pct_cost: number } {
  return {
    ...row,
    pct_gmv: totalGmv ? (row.gmv / totalGmv) * 100 : 0,
    pct_cost: totalCost ? (row.cost / totalCost) * 100 : 0,
  }
}

function tintBg(t: ColTint): string | undefined {
  if (!t) return undefined
  if (t === 'gmv') return 'rgba(34,197,94,.04)'
  if (t === 'cost') return 'rgba(248,113,113,.04)'
  if (t === 'roas') return 'rgba(96,165,250,.05)'
  if (t === 'rate') return 'rgba(168,85,247,.035)'
  if (t === 'count') return 'rgba(251,191,36,.035)'
  return undefined
}
function tintHeader(t: ColTint): string {
  if (t === 'gmv') return '#34d399'
  if (t === 'cost') return '#fca5a5'
  if (t === 'roas') return '#93c5fd'
  if (t === 'rate') return '#c4b5fd'
  if (t === 'count') return '#fcd34d'
  return '#94a3b8'
}

const LOAI_COLOR: Record<string, string> = {
  'Thẻ sản phẩm': '#93c5fd',
  'Video Kênh': '#34d399',
  'Video KOC': '#c4b5fd',
  'Video Aff': '#fcd34d',
}

export default function TiktokAuthSectionComponent({ section }: Props) {
  const [copied, setCopied] = useState<'values' | 'table' | null>(null)

  type CopyRow = {
    label: string
    gmv: number
    cost: number
    roas: number
    cpc: number
    ctr: number
    cr: number
    cpm: number
    hien_thi: number
    clicks: number
    orders: number
    aov: number
    pct_gmv: number
    pct_cost: number
    n: number
  }
  const allRowsForCopy: CopyRow[] = useMemo(() => {
    const denomG = section.grandTotal.gmv
    const denomC = section.grandTotal.cost
    const kenh = section.videoRows.find(r => r.loai === 'Video Kênh')
    const koc = section.videoRows.find(r => r.loai === 'Video KOC')
    const aff = section.videoRows.find(r => r.loai === 'Video Aff')
    const mk = (label: string, base: { gmv: number; cost: number; n: number } & ReturnType<typeof flatten>) =>
      ({ label, ...base, ...withPct({ gmv: base.gmv, cost: base.cost }, denomG, denomC) }) as CopyRow
    const rows: CopyRow[] = [mk(section.productCard.loai, flatten(section.productCard))]
    if (kenh) rows.push(mk(kenh.loai, flatten(kenh)))
    rows.push(mk(section.videoKocAff.label, flatten(section.videoKocAff)))
    if (koc) rows.push(mk('  ' + koc.loai, flatten(koc)))
    if (aff) rows.push(mk('  ' + aff.loai, flatten(aff)))
    rows.push(mk(section.videoSubtotal.label, flatten(section.videoSubtotal)))
    rows.push(mk(section.grandTotal.label, flatten(section.grandTotal)))
    return rows
  }, [section])

  const tableText = useMemo(() => {
    const header = ['Nguồn', ...COLS.map(c => c.label), 'Số lượng video'].join('\t')
    const lines = allRowsForCopy.map(r =>
      [r.label, ...COLS.map(c => formatCell(r, c.key, c.fmt)), r.n].join('\t'),
    )
    return [header, ...lines].join('\n')
  }, [allRowsForCopy])

  const valuesText = useMemo(() => {
    return allRowsForCopy
      .map(r => [r.label, ...COLS.map(c => formatCell(r, c.key, c.fmt)), r.n].join('\t'))
      .join('\n')
  }, [allRowsForCopy])

  async function copy(kind: 'values' | 'table') {
    await writeClipboard(kind === 'table' ? tableText : valuesText)
    setCopied(kind)
    setTimeout(() => setCopied(null), 1400)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: '#94a3b8' }}>
          Thẻ sản phẩm {section.productCard.n} · Video Kênh {section.videoRows[0]?.n ?? 0} · KOC{' '}
          {section.videoRows[1]?.n ?? 0} · Aff {section.videoRows[2]?.n ?? 0} · Tổng {section.grandTotal.n}{' '}
          creatives
        </div>
        <div style={{ flex: 1 }} />
        <CopyBtn kind="values" copied={copied === 'values'} onClick={() => copy('values')} />
        <CopyBtn kind="table" copied={copied === 'table'} onClick={() => copy('table')} />
      </div>

      <div
        className="scroll-thin"
        style={{
          border: '1px solid rgba(255,255,255,.08)',
          borderRadius: 10,
          overflow: 'auto',
        }}
      >
        <table
          style={{
            width: '100%',
            minWidth: 1080,
            borderCollapse: 'collapse',
            fontSize: 12.5,
            color: '#cbd5e1',
          }}
        >
          <thead>
            <tr style={{ background: '#11203a' }}>
              <th style={thStyle(180)}>Loại</th>
              {COLS.map(c => (
                <th
                  key={c.key}
                  style={{
                    ...thStyle(c.width, 'right'),
                    color: tintHeader(c.tint),
                    background: tintBg(c.tint) ?? '#11203a',
                  }}
                >
                  {c.label}
                </th>
              ))}
              <th style={thStyle(120, 'right')}>Số lượng video</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const denomG = section.grandTotal.gmv
              const denomC = section.grandTotal.cost
              const kenh = section.videoRows.find(r => r.loai === 'Video Kênh')
              const koc = section.videoRows.find(r => r.loai === 'Video KOC')
              const aff = section.videoRows.find(r => r.loai === 'Video Aff')
              return (
                <>
                  <AuthRowComp row={withPct(section.productCard, denomG, denomC)} />
                  {kenh && <AuthRowComp row={withPct(kenh, denomG, denomC)} />}
                  <AuthMainTotalRow row={withPct(section.videoKocAff, denomG, denomC)} />
                  {koc && <SubCatRow row={withPct({ label: koc.loai, ...flatten(koc) }, denomG, denomC)} />}
                  {aff && <SubCatRow row={withPct({ label: aff.loai, ...flatten(aff) }, denomG, denomC)} />}
                  <SubtotalRow row={withPct(section.videoSubtotal, denomG, denomC)} />
                  <GrandTotalRow row={withPct(section.grandTotal, denomG, denomC)} />
                </>
              )
            })()}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AuthRowComp({ row }: { row: TiktokAuthRow }) {
  return (
    <tr style={{ borderTop: '1px solid rgba(255,255,255,.05)' }}>
      <td
        style={{
          ...tdStyle,
          fontWeight: 600,
          color: LOAI_COLOR[row.loai] ?? '#e2e8f0',
        }}
      >
        {row.loai}
      </td>
      {COLS.map(c => (
        <td
          key={c.key}
          style={{
            ...tdStyle,
            textAlign: 'right',
            fontVariantNumeric: 'tabular-nums',
            background: tintBg(c.tint),
          }}
        >
          {formatCell(row as unknown as Record<string, unknown>, c.key, c.fmt)}
        </td>
      ))}
      <td style={{ ...tdStyle, textAlign: 'right', color: '#94a3b8' }}>{row.n}</td>
    </tr>
  )
}

function AuthMainTotalRow({ row }: { row: TiktokAuthTotalRow }) {
  return (
    <tr style={{ borderTop: '1px solid rgba(255,255,255,.05)' }}>
      <td
        style={{
          ...tdStyle,
          fontWeight: 600,
          color: '#a78bfa',
        }}
      >
        {row.label}
      </td>
      {COLS.map(c => (
        <td
          key={c.key}
          style={{
            ...tdStyle,
            textAlign: 'right',
            fontVariantNumeric: 'tabular-nums',
            background: tintBg(c.tint),
          }}
        >
          {formatCell(row as unknown as Record<string, unknown>, c.key, c.fmt)}
        </td>
      ))}
      <td style={{ ...tdStyle, textAlign: 'right', color: '#94a3b8' }}>{row.n}</td>
    </tr>
  )
}

function SubCatRow({ row }: { row: TiktokAuthTotalRow }) {
  return (
    <tr
      style={{
        borderTop: '1px dashed rgba(255,255,255,.07)',
        background: 'rgba(168,85,247,.04)',
        fontSize: 11.5,
      }}
    >
      <td
        style={{
          ...tdStyle,
          paddingLeft: 36,
          color: '#a78bfa',
          fontWeight: 500,
          fontSize: 11.5,
          fontStyle: 'italic',
        }}
      >
        <span style={{ color: '#475569', marginRight: 6 }}>└</span>
        {row.label}
      </td>
      {COLS.map(c => (
        <td
          key={c.key}
          style={{
            ...tdStyle,
            textAlign: 'right',
            fontVariantNumeric: 'tabular-nums',
            background: tintBg(c.tint),
            color: '#cbd5e1',
            fontSize: 11.5,
            padding: '6px 12px',
          }}
        >
          {formatCell(row as unknown as Record<string, unknown>, c.key, c.fmt)}
        </td>
      ))}
      <td
        style={{
          ...tdStyle,
          textAlign: 'right',
          color: '#94a3b8',
          fontSize: 11.5,
          padding: '6px 12px',
        }}
      >
        {row.n}
      </td>
    </tr>
  )
}

function SubtotalRow({ row }: { row: TiktokAuthTotalRow }) {
  return (
    <tr
      style={{
        borderTop: '1px solid rgba(255,255,255,.1)',
        background: 'rgba(148,163,184,.06)',
        fontWeight: 600,
      }}
    >
      <td style={{ ...tdStyle, paddingLeft: 24, color: '#cbd5e1', fontStyle: 'italic' }}>{row.label}</td>
      {COLS.map(c => (
        <td
          key={c.key}
          style={{
            ...tdStyle,
            textAlign: 'right',
            fontVariantNumeric: 'tabular-nums',
            background: tintBg(c.tint),
            color: '#cbd5e1',
          }}
        >
          {formatCell(row as unknown as Record<string, unknown>, c.key, c.fmt)}
        </td>
      ))}
      <td style={{ ...tdStyle, textAlign: 'right', color: '#94a3b8' }}>{row.n}</td>
    </tr>
  )
}

function GrandTotalRow({ row }: { row: TiktokAuthTotalRow }) {
  return (
    <tr
      style={{
        borderTop: '2px solid rgba(96,165,250,.35)',
        background: '#162844',
        fontWeight: 700,
      }}
    >
      <td
        style={{
          ...tdStyle,
          fontWeight: 800,
          color: '#f1f5f9',
          letterSpacing: '.04em',
          textTransform: 'uppercase',
          fontSize: 12,
        }}
      >
        {row.label}
      </td>
      {COLS.map(c => (
        <td
          key={c.key}
          style={{
            ...tdStyle,
            textAlign: 'right',
            fontVariantNumeric: 'tabular-nums',
            background: tintBg(c.tint),
            color: '#f1f5f9',
            fontWeight: 700,
          }}
        >
          {formatCell(row as unknown as Record<string, unknown>, c.key, c.fmt)}
        </td>
      ))}
      <td style={{ ...tdStyle, textAlign: 'right', color: '#cbd5e1' }}>{row.n}</td>
    </tr>
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

function flatten(r: TiktokAuthRow | TiktokAuthTotalRow): {
  gmv: number
  cost: number
  roas: number
  cpc: number
  ctr: number
  cr: number
  cpm: number
  hien_thi: number
  clicks: number
  orders: number
  aov: number
  n: number
} {
  return {
    gmv: r.gmv,
    cost: r.cost,
    roas: r.roas,
    cpc: r.cpc,
    ctr: r.ctr,
    cr: r.cr,
    cpm: r.cpm,
    hien_thi: r.hien_thi,
    clicks: r.clicks,
    orders: r.orders,
    aov: r.aov,
    n: r.n,
  }
}

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
  padding: '10px 12px',
  verticalAlign: 'middle',
}
