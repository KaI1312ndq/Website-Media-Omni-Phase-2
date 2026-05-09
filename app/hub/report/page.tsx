'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getSession, SessionUser } from '@/lib/auth'

/* ── Types ─────────────────────────────────────── */
interface MetricRow { key: string; name: string; unit: string; input?: boolean; formula?: string }
interface KpiData { [key: string]: string | number }

/* ── Metric definitions ─────────────────────────── */
const METRICS: MetricRow[] = [
  { key: 'doanh_so',   name: 'Doanh số Ads',          unit: '₫', input: true },
  { key: 'chi_phi',    name: 'Chi phí hiển thị',       unit: '₫', input: true },
  { key: 'roas',       name: 'ROAS',                   unit: 'x', formula: 'Doanh số / Chi phí' },
  { key: 'luot_xem',   name: 'Số lượt xem (Impression)', unit: '', input: true },
  { key: 'luot_click', name: 'Số lượt click',          unit: '', input: true },
  { key: 'don_hang',   name: 'Số đơn hàng',            unit: '', input: true },
  { key: 'cpc',        name: 'CPC',                    unit: '₫', formula: 'Chi phí / Lượt click' },
  { key: 'ctr',        name: 'CTR',                    unit: '%', formula: 'Lượt click / Lượt xem × 100' },
  { key: 'cr',         name: 'CR',                     unit: '%', formula: 'Đơn hàng / Lượt click × 100' },
  { key: 'cpm',        name: 'CPM',                    unit: '₫', formula: 'Chi phí / Lượt xem × 1000' },
  { key: 'aov',        name: 'AOV',                    unit: '₫', formula: 'Doanh số / Đơn hàng' },
]

const STORES = [
  { id: 'omni-main', name: 'Media Omni Main', platforms: ['shopee', 'tiktok'] },
  { id: 'omni-beauty', name: 'Omni Beauty', platforms: ['shopee', 'tiktok'] },
  { id: 'omni-kids', name: 'Omni Kids', platforms: ['shopee'] },
  { id: 'omni-food', name: 'Omni Food', platforms: ['tiktok'] },
]

/* ── Helpers ─────────────────────────────────────── */
function calcMetrics(raw: KpiData): KpiData {
  const d = { ...raw }
  const n = (k: string) => parseFloat(String(d[k] || 0)) || 0
  d.roas = n('chi_phi') ? +(n('doanh_so') / n('chi_phi')).toFixed(2) : 0
  d.cpc  = n('luot_click') ? +(n('chi_phi') / n('luot_click')).toFixed(0) : 0
  d.ctr  = n('luot_xem') ? +(n('luot_click') / n('luot_xem') * 100).toFixed(2) : 0
  d.cr   = n('luot_click') ? +(n('don_hang') / n('luot_click') * 100).toFixed(2) : 0
  d.cpm  = n('luot_xem') ? +(n('chi_phi') / n('luot_xem') * 1000).toFixed(0) : 0
  d.aov  = n('don_hang') ? +(n('doanh_so') / n('don_hang')).toFixed(0) : 0
  return d
}

function fmtNum(v: string | number, unit: string): string {
  const n = parseFloat(String(v))
  if (isNaN(n) || n === 0) return '—'
  if (unit === '₫') return n.toLocaleString('vi-VN') + '₫'
  if (unit === 'x') return n + 'x'
  if (unit === '%') return n + '%'
  return n.toLocaleString('vi-VN')
}

function getWeekInfo() {
  const today = new Date()
  const dow = today.getDay()
  const daysToFri = (5 - dow + 7) % 7
  const fri = new Date(today)
  fri.setDate(today.getDate() + (daysToFri === 0 ? 0 : daysToFri))
  const thu = new Date(fri)
  thu.setDate(fri.getDate() + 6)
  const lastDay = new Date(fri.getFullYear(), fri.getMonth() + 1, 0)
  const end = thu > lastDay ? lastDay : thu
  const days = Math.round((end.getTime() - fri.getTime()) / 86400000) + 1
  const fmt = (d: Date) => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
  const month = fri.getMonth() + 1
  const quarter = Math.ceil(month / 3)
  // week number within month
  let weekNum = 0
  const scan = new Date(fri.getFullYear(), fri.getMonth(), 1)
  while (scan <= fri) { if (scan.getDay() === 5) weekNum++; scan.setDate(scan.getDate() + 1) }
  return { label: `W${weekNum || 1} Tháng ${month} Q${quarter}.${fri.getFullYear()}`, start: fmt(fri), end: fmt(end), days }
}

/* ── Component ───────────────────────────────────── */
export default function ReportPage() {
  const router = useRouter()
  const [user, setUser] = useState<SessionUser | null>(null)
  const [step, setStep] = useState(1)
  const [store, setStore] = useState('')
  const [platform, setPlatform] = useState<'shopee' | 'tiktok' | 'both'>('both')
  const weekInfo = getWeekInfo()

  // KPI state
  const [shopeeRaw, setShopeeRaw] = useState<KpiData>({})
  const [tiktokRaw, setTiktokRaw] = useState<KpiData>({})

  // Step 3 — AI result + mail
  const [aiText, setAiText] = useState('')
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const mailRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const u = getSession()
    if (!u) { router.push('/'); return }
    fetch('/api/auth').then(r => r.json()).then(({ user: su }) => {
      if (su) setUser(su)
      else if (u) setUser(u)
      else router.push('/')
    })
  }, [router])

  const shopee = calcMetrics(shopeeRaw)
  const tiktok = calcMetrics(tiktokRaw)

  const hasBoth = platform === 'both'
  const hasShopee = platform === 'shopee' || hasBoth
  const hasTiktok = platform === 'tiktok' || hasBoth

  function setVal(plat: 'shopee' | 'tiktok', key: string, val: string) {
    if (plat === 'shopee') setShopeeRaw(p => ({ ...p, [key]: val }))
    else setTiktokRaw(p => ({ ...p, [key]: val }))
  }

  async function generate() {
    setGenerating(true)
    const lines: string[] = [
      `BÁO CÁO TUẦN — ${weekInfo.label}`,
      `Kỳ báo cáo: ${weekInfo.start} – ${weekInfo.end} (${weekInfo.days} ngày)`,
      store ? `Store: ${STORES.find(s => s.id === store)?.name || store}` : '',
      '',
    ]
    if (hasShopee) {
      lines.push('📦 SHOPEE ADS:')
      METRICS.forEach(m => {
        const v = shopee[m.key]
        if (v && v !== 0) lines.push(`  • ${m.name}: ${fmtNum(v, m.unit)}`)
      })
      lines.push('')
    }
    if (hasTiktok) {
      lines.push('🎵 TIKTOK ADS:')
      METRICS.forEach(m => {
        const v = tiktok[m.key]
        if (v && v !== 0) lines.push(`  • ${m.name}: ${fmtNum(v, m.unit)}`)
      })
      lines.push('')
    }

    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze', data: lines.join('\n'), weekInfo, store, platform, shopee, tiktok }),
      })
      const j = await res.json()
      setAiText(j.analysis || lines.join('\n'))
    } catch {
      setAiText(lines.join('\n'))
    }
    setGenerating(false)
    setStep(3)
  }

  async function saveReport() {
    if (!user) return
    setSaving(true)
    try {
      await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          username: user.username,
          store,
          platform,
          week_label: weekInfo.label,
          week_start: weekInfo.start,
          week_end: weekInfo.end,
          shopee_data: shopee,
          tiktok_data: tiktok,
          ai_analysis: aiText,
        }),
      })
      setSaved(true)
    } catch { /* silent */ }
    setSaving(false)
  }

  function copyMail() {
    const text = mailRef.current?.innerText || aiText
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (!user) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--f-mono)', color: 'var(--faint)' }}>Đang tải...</div>
  )

  return (
    <>
      <nav id="main-nav" className="scrolled" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100 }}>
        <div className="nav-inner">
          <a href="/" className="nav-logo"><span className="nav-logo-mark">MO</span>MediaOmni</a>
          <div className="nav-links">
            <a href="/dashboard" className="nav-link">← Dashboard</a>
            <span style={{ fontSize: '.84rem', color: 'rgba(255,255,255,.7)' }}>{user.name}</span>
          </div>
        </div>
      </nav>

      <div className="report-wrap">
        <div className="report-hdr">
          <h1>📊 Weekly Report Tool</h1>
          <p>Nhập KPI tuần → AI phân tích → Copy Lark mail</p>
        </div>

        {/* Step tabs */}
        <div className="step-tabs">
          {['Chọn store & tuần', 'Nhập KPI', 'Xem & Copy'].map((name, i) => (
            <div key={i} className={`step-tab ${step === i+1 ? 'active' : step > i+1 ? 'done' : 'disabled'}`}
              onClick={() => { if (step > i+1) setStep(i+1) }}>
              <span className="step-num">BƯỚC {i+1}</span>
              <span className="step-name">{name}</span>
            </div>
          ))}
        </div>

        {/* ── Step 1: Store & Week ── */}
        {step === 1 && (
          <div className="r-card">
            <h2>Chọn store và kỳ báo cáo</h2>
            <p>Chọn store và xác nhận kỳ tuần sẽ báo cáo.</p>

            <div className="r-section-title">STORE</div>
            <div className="store-select-grid">
              {STORES.map(s => (
                <div key={s.id} className={`store-card${store === s.id ? ' selected' : ''}`} onClick={() => setStore(s.id)}>
                  <div className="store-card-name">{s.name}</div>
                  <div className="store-card-meta">{s.platforms.join(' · ').toUpperCase()}</div>
                </div>
              ))}
            </div>

            <div className="r-section-title" style={{ marginTop: 24 }}>PLATFORM BÁO CÁO</div>
            <div className="plat-toggle">
              {(['shopee', 'tiktok', 'both'] as const).map(p => (
                <button key={p} className={`plat-btn-r ${platform === p ? `active-${p}` : ''}`}
                  onClick={() => setPlatform(p)}>
                  {p === 'both' ? '🔀 Cả hai' : p === 'shopee' ? '🛒 Shopee' : '🎵 TikTok'}
                </button>
              ))}
            </div>

            <div className="r-section-title" style={{ marginTop: 24 }}>KỲ TUẦN</div>
            <div className="week-info-bar">
              <div className="wib-label">{weekInfo.label}</div>
              <div className="wib-range">{weekInfo.start} – {weekInfo.end} ({weekInfo.days} ngày)</div>
            </div>

            <button className="gen-btn" style={{ marginTop: 24 }}
              onClick={() => { if (!store) { alert('Vui lòng chọn store!'); return }; setStep(2) }}>
              Tiếp theo →
            </button>
          </div>
        )}

        {/* ── Step 2: KPI Input ── */}
        {step === 2 && (
          <>
            {hasShopee && (
              <div className="r-card">
                <h2>🛒 Shopee Ads — {weekInfo.label}</h2>
                <p>Nhập số liệu thực tế từ Shopee Seller Center.</p>
                <MetricTable data={shopeeRaw} calc={shopee} platform="shopee" onChange={setVal} />
              </div>
            )}
            {hasTiktok && (
              <div className="r-card">
                <h2>🎵 TikTok Ads — {weekInfo.label}</h2>
                <p>Nhập số liệu từ TikTok Seller / Ads Manager.</p>
                <MetricTable data={tiktokRaw} calc={tiktok} platform="tiktok" onChange={setVal} />
              </div>
            )}
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button className="btn-s" onClick={() => setStep(1)}>← Quay lại</button>
              <button className="gen-btn" disabled={generating} onClick={generate} style={{ flex: 1 }}>
                {generating ? '⏳ Đang phân tích...' : '🤖 Tạo AI Report →'}
              </button>
            </div>
          </>
        )}

        {/* ── Step 3: Preview & Copy ── */}
        {step === 3 && (
          <>
            <div className="mail-preview-wrap">
              <div className="mp-toolbar">
                <span className="mp-label">📨 Preview Lark Mail</span>
                <div className="mp-actions">
                  <button className={`mp-btn${copied ? ' copied' : ''}`} onClick={copyMail}>
                    {copied ? '✅ Đã copy' : '📋 Copy nội dung'}
                  </button>
                  <button className="mp-btn primary" onClick={() => setStep(2)}>← Sửa KPI</button>
                </div>
              </div>
              <div className="mail-body" ref={mailRef} contentEditable suppressContentEditableWarning>
                {aiText}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 16, alignItems: 'center' }}>
              <button className="btn-s" onClick={copyMail}>{copied ? '✅ Copied!' : '📋 Copy Lark'}</button>
              <button className="btn-p" disabled={saving || saved} onClick={saveReport}>
                {saved ? '✅ Đã lưu' : saving ? '⏳ Đang lưu...' : '💾 Lưu báo cáo'}
              </button>
              <button className="btn-s" onClick={() => { setStep(1); setStore(''); setShopeeRaw({}); setTiktokRaw({}); setAiText(''); setSaved(false) }}>
                🔄 Báo cáo mới
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}

/* ── Metric Table sub-component ── */
function MetricTable({ data, calc, platform, onChange }: {
  data: KpiData
  calc: KpiData
  platform: 'shopee' | 'tiktok'
  onChange: (plat: 'shopee' | 'tiktok', key: string, val: string) => void
}) {
  return (
    <table className="metric-table">
      <thead>
        <tr>
          <th style={{ width: '40%' }}>Chỉ số</th>
          <th>Nhập / Tự tính</th>
          <th style={{ textAlign: 'right' }}>Kết quả</th>
        </tr>
      </thead>
      <tbody>
        {METRICS.map(m => (
          <tr key={m.key}>
            <td>
              <div className="metric-name">{m.name}</div>
              {m.formula && <div className="metric-sub">{m.formula}</div>}
            </td>
            <td>
              {m.input ? (
                <input className="metric-input" type="number" placeholder="0"
                  value={String(data[m.key] ?? '')}
                  onChange={e => onChange(platform, m.key, e.target.value)} />
              ) : (
                <div style={{ color: 'var(--faint)', fontSize: '.75rem', textAlign: 'right' }}>Tự tính</div>
              )}
            </td>
            <td className="metric-auto">{fmtNum(calc[m.key], m.unit)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
