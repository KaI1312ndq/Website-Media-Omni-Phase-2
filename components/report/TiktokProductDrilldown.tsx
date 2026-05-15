'use client'

/**
 * TikTok Product Drilldown (Section 1) — Brief V12 §5.
 *
 * Filter SP có trong Master → group theo Tên define → drilldown:
 *   - Thẻ sản phẩm (nếu có) — gộp tất cả PC trong nhóm
 *   - Top N Video — sort GMV desc, configurable
 */

import { useMemo, useState } from 'react'
import type {
  TiktokProductDrilldown,
  TiktokProductRow,
  TiktokProductCard,
  TiktokVideoRow,
} from '@/lib/report/parsers/tiktok-product-drilldown'

interface Props {
  drilldown: TiktokProductDrilldown
  brandName?: string
  topN: number
  onTopNChange: (n: number) => void
}

const fmtInt = (v: number) => (v === 0 ? '—' : Math.round(v).toLocaleString('vi-VN'))
const fmtDec = (v: number, d = 2) =>
  v === 0 ? '—' : v.toLocaleString('vi-VN', { minimumFractionDigits: d, maximumFractionDigits: d })
const fmtPct = (v: number) =>
  v === 0 ? '—' : v.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%'

type ColTint = 'gmv' | 'cost' | 'roas' | 'rate' | 'count' | undefined
interface Col {
  key: string
  label: string
  fmt: (v: number) => string
  tint?: ColTint
  width?: number
}
const COLS: Col[] = [
  { key: 'gmv', label: 'GMV', fmt: fmtInt, tint: 'gmv', width: 110 },
  { key: 'cost', label: 'Cost', fmt: fmtInt, tint: 'cost', width: 100 },
  { key: 'roas', label: 'ROAS', fmt: v => fmtDec(v, 2), tint: 'roas', width: 70 },
  { key: 'cpc', label: 'CPC', fmt: fmtInt, width: 80 },
  { key: 'ctr', label: 'CTR', fmt: fmtPct, tint: 'rate', width: 80 },
  { key: 'cr', label: 'CR', fmt: fmtPct, tint: 'rate', width: 80 },
  { key: 'cpm', label: 'CPM', fmt: fmtInt, width: 90 },
  { key: 'hien_thi', label: 'Hiển thị', fmt: fmtInt, width: 100 },
  { key: 'clicks', label: 'Click', fmt: fmtInt, width: 80 },
  { key: 'orders', label: 'Đơn', fmt: fmtInt, tint: 'count', width: 70 },
  { key: 'aov', label: 'AOV', fmt: fmtInt, width: 90 },
  { key: 'pct_gmv', label: '%GMV', fmt: fmtPct, tint: 'gmv', width: 70 },
  { key: 'pct_cost', label: '%Cost', fmt: fmtPct, tint: 'cost', width: 70 },
]

function pctVal(part: number, total: number): number {
  return total ? (part / total) * 100 : 0
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

export default function TiktokProductDrilldown({ drilldown, brandName, topN, onTopNChange }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [copied, setCopied] = useState<'values' | 'table' | null>(null)

  function toggle(k: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })
  }

  const enrich = (r: { gmv: number; cost: number }) => ({
    ...r,
    pct_gmv: pctVal(r.gmv, drilldown.total.gmv),
    pct_cost: pctVal(r.cost, drilldown.total.cost),
  })
  const totalForExport = { ...drilldown.total, pct_gmv: 100, pct_cost: 100 }

  const tableText = useMemo(() => {
    const header = ['#', 'Sản phẩm', ...COLS.map(c => c.label), 'Creatives'].join('\t')
    const lines = drilldown.rows.map((r, i) =>
      [i + 1, r.ten_define, ...COLS.map(c => formatCell(enrich(r), c.key, c.fmt)), r.n_creatives].join('\t'),
    )
    const total = [
      '',
      'TỔNG',
      ...COLS.map(c => formatCell(totalForExport, c.key, c.fmt)),
      drilldown.total.n_creatives,
    ].join('\t')
    return [header, ...lines, total].join('\n')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drilldown])

  const valuesText = useMemo(() => {
    const lines = drilldown.rows.map(r =>
      [r.ten_define, ...COLS.map(c => formatCell(enrich(r), c.key, c.fmt)), r.n_creatives].join('\t'),
    )
    const total = [
      'TỔNG',
      ...COLS.map(c => formatCell(totalForExport, c.key, c.fmt)),
      drilldown.total.n_creatives,
    ].join('\t')
    return [...lines, total].join('\n')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drilldown])

  async function copy(kind: 'values' | 'table') {
    await writeClipboard(kind === 'table' ? tableText : valuesText)
    setCopied(kind)
    setTimeout(() => setCopied(null), 1400)
  }

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: '#94a3b8' }}>
          {drilldown.rows.length} nhóm SP · {drilldown.total.n_creatives} creatives · Filter:{' '}
          {drilldown.total_rows_in_file - drilldown.filtered_out}/{drilldown.total_rows_in_file} row
        </div>
        <div style={{ flex: 1 }} />
        <label
          style={{ fontSize: 12, color: '#cbd5e1', display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          Top videos
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
        <CopyBtn kind="values" copied={copied === 'values'} onClick={() => copy('values')} />
        <CopyBtn kind="table" copied={copied === 'table'} onClick={() => copy('table')} />
      </div>

      {drilldown.master_empty && (
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
          Chưa có Product Master TikTok cho brand <strong>{brandName}</strong>. Toàn bộ rows trong file
          Creative sẽ bị filter — Section 1 trống. Vào{' '}
          <a href="/hub/brands" style={{ color: '#60a5fa', textDecoration: 'underline' }}>
            Hub Brands
          </a>{' '}
          → tab "Sản phẩm TikTok" để upload Master.
        </div>
      )}

      <div
        className="scroll-thin"
        style={{
          border: '1px solid rgba(255,255,255,.08)',
          borderRadius: 10,
          overflow: 'auto',
          maxHeight: 640,
        }}
      >
        <table
          style={{
            width: '100%',
            minWidth: 1320,
            borderCollapse: 'collapse',
            fontSize: 12.5,
            color: '#cbd5e1',
          }}
        >
          <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
            <tr style={{ background: '#11203a' }}>
              <th style={thStyle(36)}>#</th>
              <th style={thStyle(280)}>Sản phẩm</th>
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
              <th style={thStyle(110, 'right')}>Số creative</th>
            </tr>
          </thead>
          <tbody>
            {drilldown.rows.map((row, idx) => {
              const enriched = {
                ...row,
                pct_gmv: pctVal(row.gmv, drilldown.total.gmv),
                pct_cost: pctVal(row.cost, drilldown.total.cost),
                product_card: row.product_card
                  ? {
                      ...row.product_card,
                      pct_gmv: pctVal(row.product_card.gmv, drilldown.total.gmv),
                      pct_cost: pctVal(row.product_card.cost, drilldown.total.cost),
                    }
                  : null,
                top_videos: row.top_videos.map(v => ({
                  ...v,
                  pct_gmv: pctVal(v.gmv, drilldown.total.gmv),
                  pct_cost: pctVal(v.cost, drilldown.total.cost),
                })),
              } as unknown as TiktokProductRow
              return (
                <ProductRow
                  key={row.ten_define + idx}
                  row={enriched}
                  idx={idx + 1}
                  topN={topN}
                  expanded={expanded.has(row.ten_define)}
                  onToggle={() => toggle(row.ten_define)}
                />
              )
            })}
            {drilldown.rows.length === 0 && (
              <tr>
                <td colSpan={3 + COLS.length} style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>
                  Không có sản phẩm match Master — kiểm tra Master TikTok đã có Product ID khớp với file
                  Creative chưa.
                </td>
              </tr>
            )}
            {drilldown.rows.length > 0 && (
              <tr
                style={{
                  borderTop: '2px solid rgba(96,165,250,.35)',
                  background: '#162844',
                  fontWeight: 700,
                  position: 'sticky',
                  bottom: 0,
                }}
              >
                <td style={tdStyle}></td>
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
                  Tổng
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
                    {formatCell({ ...drilldown.total, pct_gmv: 100, pct_cost: 100 }, c.key, c.fmt)}
                  </td>
                ))}
                <td style={{ ...tdStyle, textAlign: 'right', color: '#cbd5e1' }}>
                  {drilldown.total.n_creatives}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ProductRow({
  row,
  idx,
  topN,
  expanded,
  onToggle,
}: {
  row: TiktokProductRow
  idx: number
  topN: number
  expanded: boolean
  onToggle: () => void
}) {
  const nameColor = row.is_undefined ? '#fbbf24' : '#e2e8f0'
  return (
    <>
      <tr
        onClick={onToggle}
        style={{
          borderTop: '1px solid rgba(255,255,255,.05)',
          cursor: 'pointer',
          background: expanded ? 'rgba(255,255,255,.03)' : undefined,
          transition: 'background .12s',
        }}
        onMouseEnter={e => {
          ;(e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,.045)'
        }}
        onMouseLeave={e => {
          ;(e.currentTarget as HTMLTableRowElement).style.background = expanded ? 'rgba(255,255,255,.03)' : ''
        }}
      >
        <td style={{ ...tdStyle, color: '#64748b', fontSize: 11.5, textAlign: 'center' }}>{idx}</td>
        <td
          style={{
            ...tdStyle,
            color: nameColor,
            fontWeight: row.is_undefined ? 500 : 600,
            lineHeight: 1.4,
            wordBreak: 'break-word',
            paddingRight: 16,
          }}
        >
          <span style={{ display: 'inline-block', width: 14, color: '#64748b', fontSize: 10 }}>
            {expanded ? '▼' : '▶'}
          </span>{' '}
          {row.ten_define}
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
            {formatCell(row, c.key, c.fmt)}
          </td>
        ))}
        <td style={{ ...tdStyle, textAlign: 'right', color: '#94a3b8' }}>{row.n_creatives}</td>
      </tr>

      {expanded && (
        <>
          {/* Product Card row */}
          {row.product_card && (
            <tr style={{ background: 'rgba(96,165,250,.05)', fontSize: 11.5 }}>
              <td style={tdStyle}></td>
              <td style={{ ...tdStyle, paddingLeft: 32, color: '#93c5fd' }}>
                <span style={{ color: '#475569' }}>└ </span>
                Thẻ sản phẩm ({row.product_card.n_cards})
              </td>
              {COLS.map(c => (
                <td
                  key={c.key}
                  style={{
                    ...tdStyle,
                    textAlign: 'right',
                    color: '#cbd5e1',
                    fontVariantNumeric: 'tabular-nums',
                    background: tintBg(c.tint),
                  }}
                >
                  {formatCell(row.product_card as unknown as Record<string, unknown>, c.key, c.fmt)}
                </td>
              ))}
              <td style={tdStyle}></td>
            </tr>
          )}

          {/* Top videos */}
          {row.top_videos.map((v, i) => (
            <tr
              key={`${row.ten_define}-v-${i}`}
              style={{ background: 'rgba(255,255,255,.015)', fontSize: 11.5 }}
            >
              <td style={tdStyle}></td>
              <td
                style={{
                  ...tdStyle,
                  paddingLeft: 32,
                  color: '#94a3b8',
                  lineHeight: 1.35,
                  wordBreak: 'break-word',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ color: '#475569' }}>└</span>
                  <span style={{ color: '#64748b' }}>{i + 1}.</span>
                  <span
                    style={{ color: '#cbd5e1', fontWeight: 600 }}
                    title={v.tiktok_account || '(không có account)'}
                  >
                    {v.tiktok_account ? `@${v.tiktok_account}` : '(không có account)'}
                  </span>
                </div>
                <div
                  style={{
                    color: '#64748b',
                    fontSize: 10.5,
                    marginTop: 2,
                    paddingLeft: 20,
                  }}
                  title={v.video_title}
                >
                  {shortVideoTitle(v.video_title)}
                </div>
              </td>
              {COLS.map(c => (
                <td
                  key={c.key}
                  style={{
                    ...tdStyle,
                    textAlign: 'right',
                    color: '#94a3b8',
                    fontVariantNumeric: 'tabular-nums',
                    background: tintBg(c.tint),
                  }}
                >
                  {formatCell(v as unknown as Record<string, unknown>, c.key, c.fmt)}
                </td>
              ))}
              <td style={tdStyle}></td>
            </tr>
          ))}

          {row.total_videos > row.top_videos.length && (
            <tr style={{ background: 'rgba(255,255,255,.015)' }}>
              <td></td>
              <td
                colSpan={1 + COLS.length + 1}
                style={{ ...tdStyle, paddingLeft: 32, color: '#64748b', fontSize: 11, fontStyle: 'italic' }}
              >
                Top {row.top_videos.length}/{row.total_videos} videos — đổi "Top videos" để xem thêm.
              </td>
            </tr>
          )}
        </>
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

/**
 * Rút gọn tên video: loại bỏ @mentions + #hashtags + emoji-ish, giữ N từ đầu.
 * Vd: "@Thanh Huyền · Nâng niu đôi bàn tay vì nó vất vả nhất rồiii 😊 @x #y"
 *   → "Nâng niu đôi bàn tay…"
 */
function shortVideoTitle(raw: string, maxWords = 5): string {
  if (!raw) return '(không tên)'
  let s = raw
  // TikTok title pattern: "@account · title". Drop part trước separator đầu tiên.
  const SEP = /[\u00B7\u2022|]/
  const sepIdx = s.search(SEP)
  if (sepIdx >= 0) s = s.slice(sepIdx + 1)
  // Strip remaining @mention / #hashtag tokens (whole token until next space).
  s = s.replace(/[@#]\S+/g, ' ')
  // Drop emoji + chars outside Latin/Vietnamese.
  let out = ''
  for (let i = 0; i < s.length; i++) {
    const cc = s.charCodeAt(i)
    if (cc >= 0xd800 && cc <= 0xdbff) {
      i++
      continue
    }
    if (cc > 0x1ef9) continue
    out += s[i]
  }
  out = out
    .replace(SEP, ' ')
    .replace(/[\u2013\u2014\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!out) return '(không tên)'
  const words = out.split(' ').filter(Boolean)
  if (words.length <= maxWords) return out
  return words.slice(0, maxWords).join(' ') + '…'
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
