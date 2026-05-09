'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from '@/lib/auth'

type LogEntry = { msg: string; type: 'info' | 'ok' | 'err' | 'warn' }

export default function MigratePage() {
  const router = useRouter()
  const [brands, setBrands] = useState<string[]>([])
  const [log, setLog] = useState<LogEntry[]>([])
  const [running, setRunning] = useState(false)
  const [fromMonth, setFromMonth] = useState(1)
  const [fromYear, setFromYear] = useState(2024)
  const [toMonth, setToMonth] = useState(new Date().getMonth() + 1)
  const [toYear, setToYear] = useState(new Date().getFullYear())
  const [step, setStep] = useState<1|2|3>(1)

  // Brand input (manual)
  const [brandInput, setBrandInput] = useState('')
  const [pendingBrands, setPendingBrands] = useState<string[]>([])

  // Single brand add
  const [singleBrand, setSingleBrand] = useState('')

  useEffect(() => {
    const u = getSession()
    if (!u || u.role !== 'admin') { router.push('/hub'); return }
    fetchCurrentBrands()
  }, [router])

  function addLog(msg: string, type: LogEntry['type'] = 'info') {
    setLog(prev => [...prev, { msg, type }])
  }

  async function fetchCurrentBrands() {
    const r = await fetch('/api/brands').then(res => res.json())
    setBrands((r.data || r.brands || []).map((b: { brand_name: string }) => b.brand_name))
  }

  /* Try fetch from GAS (best-effort, may fail) */
  async function tryFetchGASBrands() {
    setRunning(true)
    addLog('Đang thử lấy brands từ GAS API...', 'info')
    try {
      const r = await fetch('/api/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fetchGASBrands' })
      }).then(res => res.json())

      if (!r.ok) throw new Error(r.error)
      if (!r.brands?.length) {
        addLog('⚠️ GAS API trả về 0 brands — script hiện tại đã thay đổi. Nhập brands thủ công bên dưới.', 'warn')
      } else {
        addLog(`✅ GAS trả về ${r.brands.length} brands: ${r.brands.join(', ')}`, 'ok')
        setBrandInput(r.brands.join('\n'))
        setPendingBrands(r.brands)
      }
    } catch (e) {
      addLog('❌ GAS API lỗi: ' + String(e) + ' — nhập brands thủ công.', 'err')
    } finally {
      setRunning(false)
    }
  }

  function parseBrands() {
    const list = brandInput.split('\n').map(s => s.trim()).filter(Boolean)
    const deduped = list.filter((v, i, a) => a.indexOf(v) === i)
    setPendingBrands(deduped)
    addLog(`✅ Parse xong: ${deduped.length} brands — ${deduped.join(', ')}`, 'ok')
  }

  /* Import brands to Supabase */
  async function importBrands() {
    if (!pendingBrands.length) { addLog('⚠️ Chưa có brand nào để import', 'warn'); return }
    setRunning(true)
    addLog(`Đang import ${pendingBrands.length} brands vào Supabase...`, 'info')
    try {
      const r = await fetch('/api/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'importBrands', brands: pendingBrands })
      }).then(res => res.json())
      if (!r.ok) throw new Error(r.error)
      addLog(`✅ Đã import ${r.count} brands vào Supabase`, 'ok')
      await fetchCurrentBrands()
      setStep(3)
    } catch (e) {
      addLog('❌ Lỗi: ' + String(e), 'err')
    } finally {
      setRunning(false)
    }
  }

  /* Add single brand directly to Supabase (without deleting others) */
  async function addSingleBrand() {
    if (!singleBrand.trim()) return
    setRunning(true)
    try {
      const r = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'addBrand', brand_name: singleBrand.trim() })
      }).then(res => res.json())
      if (!r.ok) throw new Error(r.error || 'Lỗi')
      addLog(`✅ Đã thêm brand: ${singleBrand.trim()}`, 'ok')
      setSingleBrand('')
      await fetchCurrentBrands()
    } catch (e) {
      addLog('❌ ' + String(e), 'err')
    } finally {
      setRunning(false)
    }
  }

  /* Migrate weekly + plan data */
  async function migrateData() {
    const brandsToMigrate = brands.length ? brands : pendingBrands
    if (!brandsToMigrate.length) { addLog('⚠️ Chưa có brands trong Supabase', 'warn'); return }
    setRunning(true)
    let weeklyTotal = 0, planTotal = 0, errors = 0

    const months: { month: number; year: number }[] = []
    let m = fromMonth, y = fromYear
    while (y < toYear || (y === toYear && m <= toMonth)) {
      months.push({ month: m, year: y })
      m++; if (m > 12) { m = 1; y++ }
    }

    addLog(`Bắt đầu migrate ${brandsToMigrate.length} brands × ${months.length} tháng...`, 'info')

    for (const brand of brandsToMigrate) {
      for (const { month, year } of months) {
        try {
          const rw = await fetch('/api/migrate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'migrateWeekly', brand, month, year })
          }).then(res => res.json())
          if (rw.ok && rw.count > 0) {
            weeklyTotal += rw.count
            addLog(`  ✅ Weekly ${brand} ${month}/${year}: ${rw.count} tuần`, 'ok')
          }
        } catch (e) { addLog(`  ❌ Weekly ${brand} ${month}/${year}: ${String(e)}`, 'err'); errors++ }

        try {
          const rp = await fetch('/api/migrate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'migratePlan', brand, month, year })
          }).then(res => res.json())
          if (rp.ok && rp.count > 0) {
            planTotal += rp.count
            addLog(`  ✅ Plan ${brand} ${month}/${year}: ${rp.count} platform`, 'ok')
          }
        } catch (e) { addLog(`  ❌ Plan ${brand} ${month}/${year}: ${String(e)}`, 'err'); errors++ }
      }
    }

    addLog(`\n=== XONG ===\nWeekly: ${weeklyTotal} | Plan: ${planTotal} | Lỗi: ${errors}`, errors > 0 ? 'warn' : 'ok')
    setRunning(false)
  }

  const STEPS = [
    { n: 1, label: '1. Quản lý Brands' },
    { n: 2, label: '2. Import Brands mới' },
    { n: 3, label: '3. Migrate Data' },
  ]

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px', fontFamily: 'var(--f-sans)' }}>

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--navy)', marginBottom: 6 }}>
          🔄 Migration Tool — Google Sheets → Supabase
        </h1>
        <p style={{ fontSize: '.84rem', color: 'var(--muted)' }}>
          Đồng bộ Brands + WeeklyData + PlanData từ Google Sheets về Supabase. Chỉ admin.
        </p>
      </div>

      {/* Status bar */}
      <div className="rc" style={{ marginBottom: 16, display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <span style={{ fontSize: '.75rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>Brands trong Supabase</span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
            {brands.length === 0
              ? <span style={{ color: '#DC2626', fontSize: '.82rem', fontWeight: 600 }}>⚠️ Chưa có brand nào</span>
              : brands.map(b => (
                  <span key={b} style={{ background: 'var(--border2)', padding: '2px 10px', borderRadius: 20, fontSize: '.8rem' }}>{b}</span>
                ))
            }
          </div>
        </div>
        <button className="btn-s" style={{ fontSize: '.78rem' }} onClick={fetchCurrentBrands}>↻ Refresh</button>
      </div>

      {/* Step tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {STEPS.map(s => (
          <button key={s.n} onClick={() => setStep(s.n as 1|2|3)} style={{
            padding: '7px 16px', borderRadius: 20, fontSize: '.78rem', fontWeight: 700, border: 'none', cursor: 'pointer',
            background: step === s.n ? 'var(--blue)' : 'var(--border2)',
            color: step === s.n ? '#fff' : 'var(--muted)'
          }}>{s.label}</button>
        ))}
      </div>

      {/* ── STEP 1: Quản lý brands hiện tại ── */}
      {step === 1 && (
        <div>
          {/* Add single brand */}
          <div className="rc" style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 10, fontSize: '.88rem' }}>Thêm Brand nhanh</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="ri" style={{ flex: 1 }} placeholder="Tên brand..." value={singleBrand}
                onChange={e => setSingleBrand(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addSingleBrand()} />
              <button className="btn-p" onClick={addSingleBrand} disabled={running || !singleBrand.trim()}>+ Thêm</button>
            </div>
            <p style={{ fontSize: '.78rem', color: 'var(--muted)', marginTop: 6 }}>Thêm từng brand mà không xóa brands khác.</p>
          </div>

          {/* Schema comparison info */}
          <div className="rc" style={{ background: 'var(--border2)', border: 'none' }}>
            <div style={{ fontWeight: 700, marginBottom: 10, fontSize: '.88rem' }}>📊 So sánh Schema: Supabase vs Google Sheets</div>
            <table style={{ width: '100%', fontSize: '.78rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--navy)', color: '#fff' }}>
                  <th style={{ padding: '6px 10px', textAlign: 'left' }}>Table</th>
                  <th style={{ padding: '6px 10px', textAlign: 'left' }}>Supabase</th>
                  <th style={{ padding: '6px 10px', textAlign: 'left' }}>Google Sheets (GAS)</th>
                  <th style={{ padding: '6px 10px', textAlign: 'center' }}>Match?</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { t: 'brands', sb: 'id, brand_name, assigned_members text[], active', gas: 'id, brand_name, assigned_members (string)', ok: true },
                  { t: 'weekly_reports', sb: 's_cpc_*, s_nd_*, s_live_*, t_pgm_*, t_lgm_*, t_con_*, t_brd_*, highlight, lowlight, nhan_xet_*', gas: 'WEEKLY_COLS — cùng tên cột', ok: true },
                  { t: 'monthly_plans', sb: 'plan_data JSONB {metric:{w1,w2,w3,w4,w5,month}}', gas: 'flat: {metric}__plan_w1, {metric}__plan_month', ok: true },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 700 }}>{row.t}</td>
                    <td style={{ padding: '8px 10px', color: 'var(--muted)' }}>{row.sb}</td>
                    <td style={{ padding: '8px 10px', color: 'var(--muted)' }}>{row.gas}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      {row.ok ? '✅' : '❌'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: 10, padding: '8px 12px', background: '#FEF9C3', borderRadius: 6, fontSize: '.78rem', color: '#92400E' }}>
              ⚠️ <strong>Lưu ý:</strong> GAS API hiện tại trả về <code>{`{"status":"ok","message":"Weekly Report API ready"}`}</code> thay vì data — script deployed đã thay đổi. Migration sẽ dùng GAS API để lấy WeeklyData & PlanData theo từng brand (nếu GAS có handlers). Brands cần nhập thủ công ở Bước 2.
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 2: Import Brands ── */}
      {step === 2 && (
        <div className="rc">
          <div style={{ fontWeight: 700, marginBottom: 12, fontSize: '.9rem' }}>Import danh sách Brands vào Supabase</div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button className="btn-s" style={{ fontSize: '.78rem' }} onClick={tryFetchGASBrands} disabled={running}>
              🔍 Thử lấy từ GAS
            </button>
            <span style={{ color: 'var(--muted)', fontSize: '.78rem', alignSelf: 'center' }}>hoặc nhập thủ công:</span>
          </div>

          <textarea
            style={{ width: '100%', minHeight: 120, padding: 10, border: '1.5px solid var(--border)', borderRadius: 8, fontSize: '.84rem', marginBottom: 10, resize: 'vertical', boxSizing: 'border-box' }}
            placeholder={`Nhập tên brand, mỗi brand một dòng:\nMeracine\nBye Bye Blemish\nYumvita`}
            value={brandInput}
            onChange={e => setBrandInput(e.target.value)}
          />

          <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <button className="btn-s" onClick={parseBrands}>Parse ({brandInput.split('\n').filter(s=>s.trim()).length} dòng)</button>
            {pendingBrands.length > 0 && (
              <span style={{ fontSize: '.8rem', color: '#059669', alignSelf: 'center', fontWeight: 600 }}>
                ✅ Ready: {pendingBrands.join(', ')}
              </span>
            )}
          </div>

          <p style={{ fontSize: '.78rem', color: '#DC2626', marginBottom: 14 }}>
            ⚠️ Thao tác này sẽ XOÁ toàn bộ brand cũ trong Supabase và import lại danh sách mới.
          </p>

          <button className="btn-p" onClick={importBrands} disabled={running || !pendingBrands.length}>
            {running ? 'Đang import...' : `✅ Import ${pendingBrands.length} Brands vào Supabase →`}
          </button>
        </div>
      )}

      {/* ── STEP 3: Migrate Data ── */}
      {step === 3 && (
        <div className="rc">
          <div style={{ fontWeight: 700, marginBottom: 12, fontSize: '.9rem' }}>Migrate WeeklyData + PlanData từ GAS</div>

          <div style={{ background: '#FEF9C3', borderRadius: 6, padding: '8px 12px', fontSize: '.78rem', color: '#92400E', marginBottom: 16 }}>
            ⚠️ GAS API hiện không trả về data đúng format. Bước này sẽ thử gọi GAS với từng brand + tháng — nếu script GAS chưa có handlers thì kết quả sẽ 0 rows. Bạn cần deploy lại <code>appscript_v8.gs</code> với URL mới và cập nhật trong <code>app/api/migrate/route.ts</code>.
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: '.75rem', color: 'var(--muted)', marginBottom: 4, fontWeight: 700 }}>Từ tháng</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <select className="rs" value={fromMonth} onChange={e => setFromMonth(parseInt(e.target.value))}>
                  {Array.from({length:12},(_,i)=><option key={i+1} value={i+1}>T{i+1}</option>)}
                </select>
                <select className="rs" value={fromYear} onChange={e => setFromYear(parseInt(e.target.value))}>
                  {[2023,2024,2025,2026].map(y=><option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '.75rem', color: 'var(--muted)', marginBottom: 4, fontWeight: 700 }}>Đến tháng</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <select className="rs" value={toMonth} onChange={e => setToMonth(parseInt(e.target.value))}>
                  {Array.from({length:12},(_,i)=><option key={i+1} value={i+1}>T{i+1}</option>)}
                </select>
                <select className="rs" value={toYear} onChange={e => setToYear(parseInt(e.target.value))}>
                  {[2023,2024,2025,2026].map(y=><option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          </div>

          <p style={{ fontSize: '.8rem', color: 'var(--muted)', marginBottom: 16 }}>
            Brands: <strong>{brands.join(', ') || 'Chưa có — thêm ở Bước 2'}</strong>
          </p>

          <button className="btn-p" onClick={migrateData} disabled={running || !brands.length}>
            {running ? '⏳ Đang migrate...' : '🚀 Bắt đầu Migrate'}
          </button>
        </div>
      )}

      {/* Log */}
      {log.length > 0 && (
        <div style={{
          marginTop: 20, background: '#0f172a', borderRadius: 10, padding: '14px 18px',
          maxHeight: 400, overflowY: 'auto', fontFamily: 'monospace', fontSize: '.8rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ color: '#94a3b8', fontWeight: 700 }}>LOG</span>
            <button onClick={() => setLog([])} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '.75rem' }}>Xoá</button>
          </div>
          {log.map((l, i) => (
            <div key={i} style={{
              color: l.type === 'ok' ? '#34d399' : l.type === 'err' ? '#f87171' : l.type === 'warn' ? '#fbbf24' : '#cbd5e1',
              marginBottom: 4, whiteSpace: 'pre-wrap'
            }}>{l.msg}</div>
          ))}
        </div>
      )}
    </div>
  )
}
