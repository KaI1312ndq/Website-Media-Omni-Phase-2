'use client'

/**
 * Section "Top Videos" — toàn bộ video TikTok sort GMV desc.
 *
 * Configurable Top N: 10 / 20 / 50 / Custom / All.
 * Hiển thị giữa Section 1 (theo sản phẩm) và Section 2 (nguồn GMV / loại video).
 */

import { useMemo, useState } from 'react'
import type { TiktokTopVideos, TiktokVideoRow } from '@/lib/report/parsers/tiktok-product-drilldown'

interface Props {
  data: TiktokTopVideos
  topN: number
  onTopNChange: (n: number) => void
}

const fmtInt = (v: number) => (v === 0 ? '—' : Math.round(v).toLocaleString('vi-VN'))
const fmtDec = (v: number, d = 2) =>
  v === 0 ? '—' : v.toLocaleString('vi-VN', { minimumFractionDigits: d, maximumFractionDigits: d })
const fmtPct = (v: number) =>
  v === 0 ? '—' : v.toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%'

type ColTint = 'gmv' | 'cost' | 'roas' | 'rate' | 'count' | undefined
const COLS: { key: string; label: string; fmt: (v: number) => string; tint?: ColTint; width?: number }[] = [
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
]

function tintBg(t: ColTint): string | undefined {
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

const PRESETS = [10, 20, 50] as const

export default function TiktokTopVideosSection({ data, topN, onTopNChange }: Props) {
  const [custom, setCustom] = useState('')
  const [copied, setCopied] = useState<'values' | 'table' | null>(null)

  const isCustom = topN !== Infinity && !PRESETS.includes(topN as (typeof PRESETS)[number])
  const isAll = topN === Infinity

  function applyCustom() {
    const n = parseInt(custom, 10)
    if (Number.isFinite(n) && n > 0) onTopNChange(n)
  }

  const tableText = useMemo(() => {
    const header = ['#', 'Video', 'Account', 'Sản phẩm', ...COLS.map(c => c.label)].join('\t')
    const lines = data.videos.map((v, i) =>
      [
        i + 1,
        v.video_title,
        v.tiktok_account,
        defineFor(v, data.ten_define_map),
        ...COLS.map(c => formatCell(v, c.key, c.fmt)),
      ].join('\t'),
    )
    const subtotal = [
      '',
      `Subtotal Top ${isAll ? data.total_videos : data.videos.length}`,
      '',
      '',
      ...COLS.map(c => formatCell(data.subtotal, c.key, c.fmt)),
    ].join('\t')
    return [header, ...lines, subtotal].join('\n')
  }, [data, isAll])

  const valuesText = useMemo(() => {
    const lines = data.videos.map(v =>
      [v.video_title, ...COLS.map(c => formatCell(v, c.key, c.fmt))].join('\t'),
    )
    const subtotal = [`Subtotal`, ...COLS.map(c => formatCell(data.subtotal, c.key, c.fmt))].join('\t')
    return [...lines, subtotal].join('\n')
  }, [data])

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
          Hiển thị {data.videos.length}/{data.total_videos} video · sort GMV desc
        </div>
        <div style={{ flex: 1 }} />

        {/* Top N pills */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 12, color: '#cbd5e1', marginRight: 4 }}>Top:</span>
          {PRESETS.map(n => (
            <button
              key={n}
              className="btn-s"
              onClick={() => onTopNChange(n)}
              style={{
                fontSize: 12,
                padding: '4px 10px',
                background: topN === n ? 'rgba(96,165,250,.18)' : 'rgba(255,255,255,.04)',
                borderColor: topN === n ? 'rgba(96,165,250,.5)' : 'rgba(255,255,255,.1)',
                color: topN === n ? '#93c5fd' : '#cbd5e1',
                fontWeight: topN === n ? 700 : 500,
              }}
            >
              {n}
            </button>
          ))}
          <button
            className="btn-s"
            onClick={() => onTopNChange(Infinity)}
            style={{
              fontSize: 12,
              padding: '4px 10px',
              background: isAll ? 'rgba(96,165,250,.18)' : 'rgba(255,255,255,.04)',
              borderColor: isAll ? 'rgba(96,165,250,.5)' : 'rgba(255,255,255,.1)',
              color: isAll ? '#93c5fd' : '#cbd5e1',
              fontWeight: isAll ? 700 : 500,
            }}
          >
            All
          </button>
          <input
            type="number"
            min={1}
            placeholder="Tuỳ"
            value={isCustom ? topN : custom}
            onChange={e => setCustom(e.target.value)}
            onBlur={applyCustom}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                applyCustom()
              }
            }}
            style={{
              width: 64,
              padding: '4px 8px',
              background: isCustom ? 'rgba(96,165,250,.12)' : 'rgba(255,255,255,.04)',
              border: `1px solid ${isCustom ? 'rgba(96,165,250,.4)' : 'rgba(255,255,255,.1)'}`,
              borderRadius: 6,
              color: '#cbd5e1',
              fontSize: 12,
              fontVariantNumeric: 'tabular-nums',
              outline: 'none',
            }}
            title="Nhập số tuỳ ý rồi Enter / blur"
          />
        </div>

        <CopyBtn kind="values" copied={copied === 'values'} onClick={() => copy('values')} />
        <CopyBtn kind="table" copied={copied === 'table'} onClick={() => copy('table')} />
      </div>

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
            minWidth: 1200,
            borderCollapse: 'collapse',
            fontSize: 12.5,
            color: '#cbd5e1',
          }}
        >
          <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
            <tr style={{ background: '#11203a' }}>
              <th style={thStyle(36)}>#</th>
              <th style={thStyle(280)}>Video</th>
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
            </tr>
          </thead>
          <tbody>
            {data.videos.map((v, idx) => {
              const define = defineFor(v, data.ten_define_map)
              return (
                <tr
                  key={`${v.video_id}-${idx}`}
                  style={{ borderTop: '1px solid rgba(255,255,255,.05)' }}
                  onMouseEnter={e => {
                    ;(e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,.04)'
                  }}
                  onMouseLeave={e => {
                    ;(e.currentTarget as HTMLTableRowElement).style.background = ''
                  }}
                >
                  <td style={{ ...tdStyle, color: '#64748b', fontSize: 11.5, textAlign: 'center' }}>
                    {idx + 1}
                  </td>
                  <td
                    style={{
                      ...tdStyle,
                      lineHeight: 1.35,
                      wordBreak: 'break-word',
                      paddingRight: 16,
                    }}
                  >
                    <div
                      style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 12.5 }}
                      title={v.tiktok_account || '(không có account)'}
                    >
                      {v.tiktok_account ? `@${v.tiktok_account}` : '(không có account)'}
                    </div>
                    <div
                      style={{
                        color: '#64748b',
                        fontSize: 10.5,
                        marginTop: 2,
                        display: 'flex',
                        gap: 8,
                        flexWrap: 'wrap',
                        alignItems: 'baseline',
                      }}
                    >
                      {v.video_id && (
                        <span
                          style={{
                            fontFamily: 'var(--font-mono), monospace',
                            color: '#64748b',
                          }}
                        >
                          {v.video_id}
                        </span>
                      )}
                      <span style={{ color: '#94a3b8' }} title={v.video_title}>
                        {shortVideoTitle(v.video_title)}
                      </span>
                      {define && (
                        <span style={{ color: '#93c5fd' }} title={define}>
                          → {define}
                        </span>
                      )}
                    </div>
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
                      {formatCell(v, c.key, c.fmt)}
                    </td>
                  ))}
                </tr>
              )
            })}

            {data.videos.length === 0 && (
              <tr>
                <td colSpan={2 + COLS.length} style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>
                  Không có video nào trong file.
                </td>
              </tr>
            )}

            {/* Subtotal row */}
            {data.videos.length > 0 && (
              <tr
                style={{
                  borderTop: '2px solid rgba(96,165,250,.35)',
                  background: 'rgba(96,165,250,.10)',
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
                  Subtotal Top {isAll ? data.total_videos : data.videos.length}
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
                    {formatCell(data.subtotal, c.key, c.fmt)}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function defineFor(v: TiktokVideoRow, map: Record<string, string | null>): string {
  if (!v.product_id) return ''
  return map[v.product_id] ?? ''
}

/* ── Helpers (mirror TiktokProductDrilldown helpers) ── */

function shortVideoTitle(raw: string, maxWords = 5): string {
  if (!raw) return '(không tên)'
  let s = raw
  const SEP = /[·•|]/
  const sepIdx = s.search(SEP)
  if (sepIdx >= 0) s = s.slice(sepIdx + 1)
  s = s.replace(/[@#]\S+/g, ' ')
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
    .replace(/[–—\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!out) return '(không tên)'
  const words = out.split(' ').filter(Boolean)
  if (words.length <= maxWords) return out
  return words.slice(0, maxWords).join(' ') + '…'
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
