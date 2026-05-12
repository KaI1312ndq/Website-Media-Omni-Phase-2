'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession, SessionUser } from '@/lib/auth'
import { HubPageSkeleton } from '@/components/Skeleton'
import { Icon } from '@/lib/icons'
import '@/app/(internal)/dashboard/dashboard.css'

interface Brand {
  id: string
  brand_name: string
  assigned_members: string
  active: boolean
  industry: string | null
  product_type: string | null
  target_audience: string | null
  price_range: string | null // 'Premium' | 'Mid' | 'Mass'
  brand_stage: string | null // 'New' | 'Growing' | 'Mature'
  monthly_budget: string | null
  roas_target: string | null
  seasonality: string | null
  live_schedule: string | null
  key_kpis: string | null
  notes: string | null
  updated_by: string | null
  updated_at: string | null
}

const PRICE_RANGE_OPTIONS = ['', 'Premium', 'Mid', 'Mass']
const BRAND_STAGE_OPTIONS = ['', 'New', 'Growing', 'Mature']
const INDUSTRY_SUGGESTIONS = [
  'Skincare',
  'Mom & Baby',
  'Health Supplement',
  'Fashion',
  'FMCG',
  'Beauty',
  'F&B',
  'Electronics',
  'Home & Living',
  'Other',
]

const FIELDS: {
  key: keyof Brand
  label: string
  hint?: string
  multiline?: boolean
  type?: 'enum' | 'industry'
}[] = [
  {
    key: 'industry',
    label: 'Ngành',
    hint: 'Vd: Skincare, Mom & Baby, Health Supplement...',
    type: 'industry',
  },
  {
    key: 'product_type',
    label: 'Loại sản phẩm',
    hint: 'Vd: TPCN viên uống, Sữa rửa mặt cao cấp, Tã bỉm sơ sinh',
  },
  {
    key: 'target_audience',
    label: 'Target audience',
    hint: 'Vd: Nữ 25-40, thu nhập trung-cao, quan tâm anti-aging',
    multiline: true,
  },
  {
    key: 'price_range',
    label: 'Phân khúc giá',
    hint: 'Premium / Mid / Mass — ảnh hưởng AOV expectation',
    type: 'enum',
  },
  {
    key: 'brand_stage',
    label: 'Stage',
    hint: 'New / Growing / Mature — ảnh hưởng learning phase tolerance',
    type: 'enum',
  },
  { key: 'monthly_budget', label: 'Budget/tháng', hint: 'Vd: 100M-300M/tháng, 500M+' },
  { key: 'roas_target', label: 'ROAS target', hint: 'Vd: Shopee ≥8 · TikTok ≥5' },
  { key: 'seasonality', label: 'Seasonality', hint: 'Vd: Peak Q4 (Tết, BFCM), off-peak T2-T3' },
  { key: 'live_schedule', label: 'Lịch livestream', hint: 'Vd: Thứ 4 + 7 20-23h, Daily 19-22h' },
  { key: 'key_kpis', label: 'KPI ưu tiên', hint: 'Vd: ROAS > volume, GMV scale + CPA control' },
  { key: 'notes', label: 'Ghi chú thêm', hint: 'Free text — context khác cho AI dùng', multiline: true },
]

function filledCount(b: Brand): number {
  return FIELDS.filter(f => {
    const v = b[f.key]
    return typeof v === 'string' && v.trim().length > 0
  }).length
}

export default function BrandsHubPage() {
  const router = useRouter()
  const [user, setUser] = useState<SessionUser | null>(null)
  const [brands, setBrands] = useState<Brand[]>([])
  const [search, setSearch] = useState('')
  const [filterIndustry, setFilterIndustry] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Partial<Brand>>({})
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type?: string } | null>(null)
  const [loading, setLoading] = useState(true)

  function showToast(msg: string, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    const u = getSession()
    if (!u) {
      router.push('/')
      return
    }
    setUser(u)
  }, [router])

  useEffect(() => {
    if (!user) return
    setLoading(true)
    fetch('/api/brands?all=1')
      .then(r => r.json())
      .then(j => setBrands(j.data || []))
      .catch(() => setBrands([]))
      .finally(() => setLoading(false))
  }, [user])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return brands.filter(b => {
      const okSearch =
        !q ||
        b.brand_name.toLowerCase().includes(q) ||
        (b.industry ?? '').toLowerCase().includes(q) ||
        (b.product_type ?? '').toLowerCase().includes(q)
      const okIndustry = !filterIndustry || (b.industry ?? '') === filterIndustry
      return okSearch && okIndustry
    })
  }, [brands, search, filterIndustry])

  const industries = useMemo(() => {
    const set = new Set<string>()
    brands.forEach(b => {
      if (b.industry) set.add(b.industry)
    })
    return Array.from(set).sort()
  }, [brands])

  const selected = brands.find(b => b.id === selectedId) ?? null

  function selectBrand(b: Brand) {
    setSelectedId(b.id)
    setDraft({
      industry: b.industry ?? '',
      product_type: b.product_type ?? '',
      target_audience: b.target_audience ?? '',
      price_range: b.price_range ?? '',
      brand_stage: b.brand_stage ?? '',
      monthly_budget: b.monthly_budget ?? '',
      roas_target: b.roas_target ?? '',
      seasonality: b.seasonality ?? '',
      live_schedule: b.live_schedule ?? '',
      key_kpis: b.key_kpis ?? '',
      notes: b.notes ?? '',
    })
  }

  async function save() {
    if (!selected) return
    setSaving(true)
    try {
      const r = await fetch('/api/brands', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selected.id, ...draft }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Lỗi lưu')
      // reload list
      const refreshed = await fetch('/api/brands?all=1').then(x => x.json())
      setBrands(refreshed.data || [])
      showToast('Đã lưu brand context')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Lỗi lưu', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (!user || loading) return <HubPageSkeleton title="Đang tải brands..." />

  return (
    <>
      {toast && (
        <div
          className={`toast show ${toast.type || 'success'}`}
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
          }}
        >
          <div className="toast-dot" />
          <span>{toast.msg}</span>
        </div>
      )}

      <div
        style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 360px) 1fr', gap: 20, paddingTop: 16 }}
      >
        {/* LEFT — list */}
        <div
          className="rc"
          style={{ padding: 14, maxHeight: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ marginBottom: 10 }}>
            <input
              type="search"
              placeholder="Tìm brand / ngành / SP..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'rgba(255,255,255,.05)',
                border: '1px solid rgba(255,255,255,.1)',
                borderRadius: 8,
                color: '#cbd5e1',
                fontSize: 13,
                marginBottom: 8,
              }}
            />
            <select
              value={filterIndustry}
              onChange={e => setFilterIndustry(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px',
                background: 'rgba(255,255,255,.05)',
                border: '1px solid rgba(255,255,255,.1)',
                borderRadius: 8,
                color: '#cbd5e1',
                fontSize: 12,
              }}
            >
              <option value="">Tất cả ngành ({brands.length})</option>
              {industries.map(i => (
                <option key={i} value={i}>
                  {i} ({brands.filter(b => b.industry === i).length})
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {filtered.map(b => {
              const fc = filledCount(b)
              const pct = Math.round((fc / FIELDS.length) * 100)
              const isSel = b.id === selectedId
              return (
                <button
                  key={b.id}
                  onClick={() => selectBrand(b)}
                  style={{
                    textAlign: 'left',
                    padding: '10px 12px',
                    background: isSel ? 'rgba(59,130,246,.15)' : 'transparent',
                    border: `1px solid ${isSel ? 'rgba(96,165,250,.4)' : 'transparent'}`,
                    borderRadius: 8,
                    cursor: 'pointer',
                    color: '#cbd5e1',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: 13.5,
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {b.brand_name}
                    </span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono), "Be Vietnam Pro", monospace',
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background:
                          pct >= 80
                            ? 'rgba(16,185,129,.15)'
                            : pct >= 40
                              ? 'rgba(251,191,36,.15)'
                              : 'rgba(239,68,68,.15)',
                        color: pct >= 80 ? '#34d399' : pct >= 40 ? '#fbbf24' : '#fca5a5',
                      }}
                    >
                      {fc}/{FIELDS.length}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {b.industry && <span>{b.industry}</span>}
                    {b.product_type && <span>· {b.product_type}</span>}
                  </div>
                </button>
              )
            })}
            {filtered.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                Không có brand phù hợp.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — detail */}
        <div className="rc">
          {!selected ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ display: 'inline-flex', color: '#475569', marginBottom: 12 }}>
                {Icon.bookOpen(36)}
              </div>
              <div style={{ fontWeight: 700, color: '#cbd5e1', marginBottom: 4 }}>Chọn brand bên trái</div>
              <div style={{ fontSize: 13 }}>
                Điền context để AI báo cáo tuần phân tích sắc hơn. Không cột nào bắt buộc.
              </div>
            </div>
          ) : (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  gap: 12,
                  marginBottom: 14,
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#94a3b8',
                      letterSpacing: '.08em',
                      textTransform: 'uppercase',
                      marginBottom: 4,
                    }}
                  >
                    Brand context
                  </div>
                  <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#f1f5f9' }}>{selected.brand_name}</h2>
                  {selected.updated_at && (
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                      Cập nhật lần cuối bởi <strong>{selected.updated_by || '—'}</strong> ·{' '}
                      {new Date(selected.updated_at).toLocaleString('vi-VN')}
                    </div>
                  )}
                </div>
                <button className="btn-p" onClick={save} disabled={saving}>
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: 12,
                }}
              >
                {FIELDS.map(f => (
                  <FieldEditor
                    key={f.key}
                    field={f}
                    value={(draft[f.key] as string) ?? ''}
                    onChange={v => setDraft(d => ({ ...d, [f.key]: v }))}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

function FieldEditor({
  field,
  value,
  onChange,
}: {
  field: (typeof FIELDS)[number]
  value: string
  onChange: (v: string) => void
}) {
  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    background: 'rgba(255,255,255,.04)',
    border: '1px solid rgba(255,255,255,.1)',
    borderRadius: 8,
    color: '#e2e8f0',
    fontSize: 13.5,
    fontFamily: 'inherit',
  } as const

  return (
    <div
      style={{
        gridColumn: field.multiline ? '1 / -1' : 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <label style={{ fontSize: 12, fontWeight: 700, color: '#cbd5e1' }}>{field.label}</label>
      {field.hint && <div style={{ fontSize: 10.5, color: '#64748b', marginBottom: 2 }}>{field.hint}</div>}
      {field.type === 'enum' && field.key === 'price_range' ? (
        <select value={value} onChange={e => onChange(e.target.value)} style={inputStyle}>
          {PRICE_RANGE_OPTIONS.map(opt => (
            <option key={opt} value={opt}>
              {opt || '— Chưa chọn —'}
            </option>
          ))}
        </select>
      ) : field.type === 'enum' && field.key === 'brand_stage' ? (
        <select value={value} onChange={e => onChange(e.target.value)} style={inputStyle}>
          {BRAND_STAGE_OPTIONS.map(opt => (
            <option key={opt} value={opt}>
              {opt || '— Chưa chọn —'}
            </option>
          ))}
        </select>
      ) : field.type === 'industry' ? (
        <>
          <input
            type="text"
            list="industry-suggestions"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="Skincare, Mom & Baby, ..."
            style={inputStyle}
          />
          <datalist id="industry-suggestions">
            {INDUSTRY_SUGGESTIONS.map(i => (
              <option key={i} value={i} />
            ))}
          </datalist>
        </>
      ) : field.multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={3}
          style={{ ...inputStyle, resize: 'vertical', minHeight: 70 }}
        />
      ) : (
        <input type="text" value={value} onChange={e => onChange(e.target.value)} style={inputStyle} />
      )}
    </div>
  )
}
