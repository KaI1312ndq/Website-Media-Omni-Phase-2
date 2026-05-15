'use client'

/**
 * Shopee Product Drilldown — Brief V11 §7.
 *
 * Hiển thị bên dưới ShopeePivotPreview ở Step 1.5.
 * Filter "Dịch vụ Hiển thị Sản phẩm" + group theo Tên define.
 */

import { useMemo, useRef, useState } from 'react'
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
  /** Upload file chi tiết nhóm — caller parse & store, sau đó rebuild drilldown. */
  onUploadGroupFile?: (campaignName: string, file: File) => void
  /** Xoá file nhóm đã upload (nếu user chọn nhầm). */
  onRemoveGroupFile?: (campaignName: string) => void
}

type TopNOption = 5 | 10 | 20 | 'All'

const fmtInt = (v: number) => (v === 0 ? '—' : Math.round(v).toLocaleString('vi-VN'))
const fmtDec = (v: number, digits = 2) =>
  v === 0 ? '—' : v.toLocaleString('vi-VN', { minimumFractionDigits: digits, maximumFractionDigits: digits })
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
  { key: 'hien_thi', label: 'Hiển thị', fmt: fmtInt, width: 90 },
  { key: 'clicks', label: 'Click', fmt: fmtInt, width: 80 },
  { key: 'orders', label: 'Đơn', fmt: fmtInt, tint: 'count', width: 70 },
  { key: 'aov', label: 'AOV', fmt: fmtInt, width: 90 },
  { key: 'pct_gmv', label: '%GMV', fmt: fmtPct, tint: 'gmv', width: 70 },
  { key: 'pct_cost', label: '%Cost', fmt: fmtPct, tint: 'cost', width: 70 },
]

function pctVal(part: number, total: number): number {
  return total ? (part / total) * 100 : 0
}

/** Subtle per-column tinting (returned as inline-style background for cells). */
function tintBg(tint: ColTint): string | undefined {
  if (!tint) return undefined
  switch (tint) {
    case 'gmv':
      return 'rgba(34,197,94,.04)' // green
    case 'cost':
      return 'rgba(248,113,113,.04)' // red
    case 'roas':
      return 'rgba(96,165,250,.05)' // blue
    case 'rate':
      return 'rgba(168,85,247,.035)' // purple
    case 'count':
      return 'rgba(251,191,36,.035)' // amber
  }
}
function tintHeaderColor(tint: ColTint): string {
  switch (tint) {
    case 'gmv':
      return '#34d399'
    case 'cost':
      return '#fca5a5'
    case 'roas':
      return '#93c5fd'
    case 'rate':
      return '#c4b5fd'
    case 'count':
      return '#fcd34d'
    default:
      return '#94a3b8'
  }
}

export default function ShopeeProductDrilldown({
  drilldown,
  masterEmpty,
  brandName,
  topN,
  onTopNChange,
  onUploadGroupFile,
  onRemoveGroupFile,
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
  const enrich = (r: { gmv: number; cost: number }) => ({
    ...r,
    pct_gmv: pctVal(r.gmv, drilldown.total.gmv),
    pct_cost: pctVal(r.cost, drilldown.total.cost),
  })
  const totalForExport = { ...drilldown.total, pct_gmv: 100, pct_cost: 100 }

  const tableText = useMemo(() => {
    const header = ['#', 'Sản phẩm', ...COLS.map(c => c.label), 'Camps'].join('\t')
    const lines = drilldown.rows.map((r, i) =>
      [i + 1, r.ten_define, ...COLS.map(c => formatCell(enrich(r), c.key, c.fmt)), r.n_camps].join('\t'),
    )
    const total = [
      '',
      'TỔNG',
      ...COLS.map(c => formatCell(totalForExport, c.key, c.fmt)),
      drilldown.total.n_camps,
    ].join('\t')
    return [header, ...lines, total].join('\n')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drilldown])

  const valuesText = useMemo(() => {
    const lines = drilldown.rows.map(r =>
      [r.ten_define, ...COLS.map(c => formatCell(enrich(r), c.key, c.fmt)), r.n_camps].join('\t'),
    )
    const total = [
      'TỔNG',
      ...COLS.map(c => formatCell(totalForExport, c.key, c.fmt)),
      drilldown.total.n_camps,
    ].join('\t')
    return [...lines, total].join('\n')
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      {drilldown.detectedGroups.length > 0 && (
        <GroupUploadPanel
          groups={drilldown.detectedGroups}
          onUpload={onUploadGroupFile}
          onRemove={onRemoveGroupFile}
        />
      )}

      {/* Table */}
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
                    color: tintHeaderColor(c.tint),
                    background: tintBg(c.tint) ?? '#11203a',
                  }}
                >
                  {c.label}
                </th>
              ))}
              <th style={thStyle(100, 'right')}>Số campaign</th>
            </tr>
          </thead>
          <tbody>
            {drilldown.rows.map((row, idx) => {
              const enriched = {
                ...row,
                pct_gmv: pctVal(row.gmv, drilldown.total.gmv),
                pct_cost: pctVal(row.cost, drilldown.total.cost),
                campaigns: row.campaigns.map(c => ({
                  ...c,
                  pct_gmv: pctVal(c.gmv, drilldown.total.gmv),
                  pct_cost: pctVal(c.cost, drilldown.total.cost),
                })),
              } as unknown as ProductDrilldownRow
              return (
                <ProductRow
                  key={row.ten_define + idx}
                  row={enriched}
                  index={idx + 1}
                  expanded={expanded.has(row.ten_define)}
                  onToggle={() => toggle(row.ten_define)}
                />
              )
            })}
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
                <td
                  style={{
                    ...tdStyle,
                    textAlign: 'right',
                    fontVariantNumeric: 'tabular-nums',
                    color: '#cbd5e1',
                  }}
                >
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
          transition: 'background .12s',
        }}
        onMouseEnter={e => {
          ;(e.currentTarget as HTMLTableRowElement).style.background = 'rgba(255,255,255,.045)'
        }}
        onMouseLeave={e => {
          ;(e.currentTarget as HTMLTableRowElement).style.background = expanded ? 'rgba(255,255,255,.03)' : ''
        }}
      >
        <td style={{ ...tdStyle, color: '#64748b', fontSize: 11.5, textAlign: 'center' }}>{index}</td>
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
          {row.is_campaign_tong && (
            <span
              style={{
                marginLeft: 8,
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 4,
                background: 'rgba(96,165,250,.15)',
                color: '#93c5fd',
                letterSpacing: '.04em',
                textTransform: 'uppercase',
                verticalAlign: 'middle',
              }}
              title="Chưa upload file chi tiết nhóm — số liệu còn ở dạng tổng. Sau khi upload, dòng này sẽ tự thay bằng các SP con."
            >
              chưa kèm file
            </span>
          )}
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
            <td
              style={{
                ...tdStyle,
                paddingLeft: 32,
                color: '#94a3b8',
                lineHeight: 1.4,
                wordBreak: 'break-word',
              }}
            >
              <span style={{ color: '#475569' }}>└ </span>
              {camp.name}
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

/* ── Group upload panel — single drop-pool + status chips ── */
function GroupUploadPanel({
  groups,
  onUpload,
  onRemove,
}: {
  groups: import('@/lib/report/parsers/shopee-product-drilldown').DetectedGroup[]
  onUpload?: (name: string, file: File) => void
  onRemove?: (name: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [batchInfo, setBatchInfo] = useState<{ matched: number; unmatched: string[] } | null>(null)

  const resolvedCount = groups.filter(g => g.resolved).length
  const pending = groups.length - resolvedCount
  const allResolved = pending === 0

  /** Parse file → match group_name với detectedGroups (loose match: trim+casefold+substring) */
  async function ingestFiles(filesRaw: FileList | File[] | null) {
    if (!filesRaw || !onUpload) return
    const files = Array.from(filesRaw)
    if (files.length === 0) return

    const { parseShopeeGroupFile } = await import('@/lib/report/parsers/shopee-group')

    // Index campaign_name lowercase → original
    const nameMap = new Map<string, string>()
    for (const g of groups) nameMap.set(g.campaign_name.toLowerCase().trim(), g.campaign_name)

    let matched = 0
    const unmatched: string[] = []

    for (const file of files) {
      try {
        const detail = await parseShopeeGroupFile(file)
        const key = detail.group_name.toLowerCase().trim()
        let target = nameMap.get(key)

        // Fallback: try substring match (file name có thể bị cắt)
        if (!target) {
          const entries = Array.from(nameMap.entries())
          for (const [k, orig] of entries) {
            if (k.includes(key) || key.includes(k)) {
              target = orig
              break
            }
          }
        }

        if (target) {
          onUpload(target, file)
          matched++
        } else {
          unmatched.push(`"${detail.group_name}" (${file.name})`)
        }
      } catch (e) {
        unmatched.push(`${file.name}: ${e instanceof Error ? e.message : 'lỗi parse'}`)
      }
    }

    setBatchInfo({ matched, unmatched })
    setTimeout(() => setBatchInfo(null), 6000)
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    void ingestFiles(e.dataTransfer.files)
  }

  return (
    <div
      style={{
        border: `1px solid ${allResolved ? 'rgba(34,197,94,.3)' : 'rgba(96,165,250,.3)'}`,
        background: allResolved ? 'rgba(34,197,94,.05)' : 'rgba(96,165,250,.05)',
        borderRadius: 10,
        padding: '12px 14px',
        marginBottom: 12,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 10,
          marginBottom: 10,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, color: allResolved ? '#34d399' : '#93c5fd' }}>
          {allResolved
            ? `Đã đính kèm ${groups.length}/${groups.length} file chi tiết nhóm`
            : `Phát hiện ${groups.length} campaign nhóm — cần ${pending} file chi tiết`}
        </div>
        <div style={{ fontSize: 11.5, color: '#94a3b8' }}>
          Kéo thả tất cả file "Chiến Dịch Nhóm" vào ô bên dưới — auto-match theo tên nhóm.
        </div>
      </div>

      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
        style={{
          border: `2px dashed ${dragOver ? '#60a5fa' : 'rgba(148,163,184,.3)'}`,
          background: dragOver ? 'rgba(96,165,250,.08)' : 'rgba(255,255,255,.02)',
          borderRadius: 10,
          padding: '18px 16px',
          cursor: 'pointer',
          textAlign: 'center',
          transition: 'border-color .12s, background .12s',
          marginBottom: 10,
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          multiple
          style={{ display: 'none' }}
          onChange={e => {
            void ingestFiles(e.target.files)
            if (inputRef.current) inputRef.current.value = ''
          }}
        />
        <div style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1', marginBottom: 4 }}>
          {dragOver ? 'Thả file vào đây' : 'Kéo thả hoặc click để chọn nhiều file nhóm cùng lúc'}
        </div>
        <div style={{ fontSize: 11, color: '#64748b' }}>
          Hỗ trợ .csv / .xlsx · auto-match qua tên nhóm trong file
        </div>
      </div>

      {/* Batch result toast inline */}
      {batchInfo && (
        <div
          style={{
            fontSize: 11.5,
            padding: '8px 10px',
            borderRadius: 6,
            background: batchInfo.unmatched.length > 0 ? 'rgba(251,191,36,.08)' : 'rgba(34,197,94,.08)',
            border: `1px solid ${batchInfo.unmatched.length > 0 ? 'rgba(251,191,36,.25)' : 'rgba(34,197,94,.25)'}`,
            color: batchInfo.unmatched.length > 0 ? '#fbbf24' : '#34d399',
            marginBottom: 10,
          }}
        >
          <strong>Đã match {batchInfo.matched} file.</strong>
          {batchInfo.unmatched.length > 0 && (
            <>
              {' '}
              Không khớp {batchInfo.unmatched.length}: {batchInfo.unmatched.slice(0, 3).join('; ')}
              {batchInfo.unmatched.length > 3 ? '...' : ''}
            </>
          )}
        </div>
      )}

      {/* Status chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {groups.map(g => (
          <span
            key={g.campaign_name}
            title={`${g.campaign_name}\nGMV ${Math.round(g.gmv).toLocaleString('vi-VN')} · Cost ${Math.round(g.cost).toLocaleString('vi-VN')}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 999,
              fontSize: 11.5,
              fontWeight: 600,
              border: `1px solid ${g.resolved ? 'rgba(34,197,94,.4)' : 'rgba(148,163,184,.25)'}`,
              background: g.resolved ? 'rgba(34,197,94,.08)' : 'rgba(255,255,255,.03)',
              color: g.resolved ? '#34d399' : '#cbd5e1',
              maxWidth: 280,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontSize: 10 }}>{g.resolved ? '✓' : '○'}</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.campaign_name}</span>
            {g.resolved && onRemove && (
              <button
                onClick={e => {
                  e.stopPropagation()
                  onRemove(g.campaign_name)
                }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#fca5a5',
                  cursor: 'pointer',
                  padding: 0,
                  marginLeft: 2,
                  fontSize: 12,
                  lineHeight: 1,
                }}
                title="Xoá file đã match cho nhóm này"
              >
                ✕
              </button>
            )}
          </span>
        ))}
      </div>
    </div>
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
