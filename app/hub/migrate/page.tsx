'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from '@/lib/auth'

type LogEntry = { msg: string; type: 'info' | 'ok' | 'err' | 'warn' }

export default function MigratePage() {
  const router = useRouter()
  const [brands, setBrands] = useState<string[]>([])
  const [gasBrands, setGasBrands] = useState<string[]>([])
  const [log, setLog] = useState<LogEntry[]>([])
  const [running, setRunning] = useState(false)
  const [fromMonth, setFromMonth] = useState(1)
  const [fromYear, setFromYear] = useState(2024)
  const [toMonth, setToMonth] = useState(new Date().getMonth() + 1)
  const [toYear, setToYear] = useState(new Date().getFullYear())
  const [step, setStep] = useState<1|2|3>(1)
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])

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

  /* Step 1: Fetch brands from GAS */
  async function fetchGASBrands() {
    setRunning(true)
    addLog('Đang tải danh sách brands từ Google Sheets...', 'info')
    try {
      const r = await fetch('/api/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fetchGASBrands' })
      }).then(res => res.json())
      if (!r.ok) throw new Error(r.error)
      setGasBrands(r.brands)
      setSelectedBrands(r.brands)
      addLog(`✅ Tìm thấy ${r.brands.length} brands: ${r.brands.join(', ')}`, 'ok')
      setStep(2)
    } catch (e) {
      addLog('❌ Lỗi: ' + String(e), 'err')
    } finally {
      setRunning(false)
    }
  }

  /* Step 2: Import brands */
  async function importBrands() {
    if (!selectedBrands.length) return
    setRunning(true)
    addLog(`Đang xoá brand cũ và import ${selectedBrands.length} brands mới...`, 'info')
    try {
      const r = await fetch('/api/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'importBrands', brands: selectedBrands })
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

  /* Step 3: Migrate weekly + plan data */
  async function migrateData() {
    setRunning(true)
    let weeklyTotal = 0, planTotal = 0, errors = 0

    const months: { month: number; year: number }[] = []
    let m = fromMonth, y = fromYear
    while (y < toYear || (y === toYear && m <= toMonth)) {
      months.push({ month: m, year: y })
      m++
      if (m > 12) { m = 1; y++ }
    }

    addLog(`Bắt đầu migrate ${selectedBrands.length} brands × ${months.length} tháng...`, 'info')

    for (const brand of selectedBrands) {
      for (const { month, year } of months) {
        // Weekly data
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
        } catch (e) {
          addLog(`  ❌ Weekly ${brand} ${month}/${year}: ${String(e)}`, 'err')
          errors++
        }

        // Plan data
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
        } catch (e) {
          addLog(`  ❌ Plan ${brand} ${month}/${year}: ${String(e)}`, 'err')
          errors++
        }
      }
    }

    addLog(`\n=== XONG ===\nWeekly: ${weeklyTotal} rows | Plan: ${planTotal} rows | Lỗi: ${errors}`, errors > 0 ? 'warn' : 'ok')
    setRunning(false)
  }

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 16px', fontFamily: 'var(--f-sans)' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--navy)', marginBottom: 6 }}>
          🔄 Migration Tool — Google Sheets → Supabase
        </h1>
        <p style={{ fontSize: '.84rem', color: 'var(--muted)' }}>
          Tool này pull toàn bộ data (Brands + WeeklyData + PlanData) từ Google Sheets về Supabase.
          Chỉ admin mới truy cập được.
        </p>
      </div>

      {/* Current Supabase state */}
      <div className="rc" style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, marginBottom: 8, fontSize: '.88rem' }}>Brands hiện tại trong Supabase</div>
        {brands.length === 0
          ? <span style={{ color: 'var(--muted)', fontSize: '.82rem' }}>Chưa có brand nào</span>
          : <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {brands.map(b => (
                <span key={b} style={{ background: 'var(--border2)', padding: '2px 10px', borderRadius: 20, fontSize: '.8rem', color: 'var(--ink)' }}>{b}</span>
              ))}
            </div>
        }
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { n: 1, label: 'Lấy Brands từ GAS' },
          { n: 2, label: 'Import Brands' },
          { n: 3, label: 'Migrate Data' },
        ].map(s => (
          <div key={s.n} style={{
            padding: '6px 14px', borderRadius: 20, fontSize: '.78rem', fontWeight: 700,
            background: step === s.n ? 'var(--blue)' : step > s.n ? '#10B981' : 'var(--border2)',
            color: step >= s.n ? '#fff' : 'var(--muted)'
          }}>
            {s.n}. {s.label}
          </div>
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className="rc">
          <p style={{ fontSize: '.84rem', color: 'var(--muted)', marginBottom: 14 }}>
            Bước 1: Pull danh sách brand từ Google Sheets. Sau đó bạn xác nhận brand nào cần import.
          </p>
          <button className="btn-p" onClick={fetchGASBrands} disabled={running}>
            {running ? 'Đang tải...' : '🔍 Lấy Brands từ Google Sheets'}
          </button>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="rc">
          <p style={{ fontWeight: 700, marginBottom: 10, fontSize: '.88rem' }}>
            Chọn brands cần import vào Supabase:
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            {gasBrands.map(b => (
              <label key={b} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '.84rem' }}>
                <input type="checkbox"
                  checked={selectedBrands.includes(b)}
                  onChange={e => setSelectedBrands(prev =>
                    e.target.checked ? [...prev, b] : prev.filter(x => x !== b)
                  )}
                />
                {b}
              </label>
            ))}
          </div>
          <p style={{ fontSize: '.78rem', color: '#DC2626', marginBottom: 14 }}>
            ⚠️ Thao tác này sẽ XOÁ toàn bộ brand hiện tại trong Supabase (kể cả seed) rồi import lại.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-s" onClick={() => setStep(1)} disabled={running}>← Quay lại</button>
            <button className="btn-p" onClick={importBrands} disabled={running || !selectedBrands.length}>
              {running ? 'Đang import...' : `✅ Import ${selectedBrands.length} Brands →`}
            </button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div className="rc">
          <p style={{ fontWeight: 700, marginBottom: 12, fontSize: '.88rem' }}>
            Cấu hình khoảng thời gian cần migrate:
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: '.75rem', color: 'var(--muted)', marginBottom: 4 }}>Từ tháng</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <select className="rs" value={fromMonth} onChange={e => setFromMonth(parseInt(e.target.value))}>
                  {Array.from({length:12},(_,i)=><option key={i+1} value={i+1}>Tháng {i+1}</option>)}
                </select>
                <select className="rs" value={fromYear} onChange={e => setFromYear(parseInt(e.target.value))}>
                  {[2023,2024,2025,2026].map(y=><option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '.75rem', color: 'var(--muted)', marginBottom: 4 }}>Đến tháng</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <select className="rs" value={toMonth} onChange={e => setToMonth(parseInt(e.target.value))}>
                  {Array.from({length:12},(_,i)=><option key={i+1} value={i+1}>Tháng {i+1}</option>)}
                </select>
                <select className="rs" value={toYear} onChange={e => setToYear(parseInt(e.target.value))}>
                  {[2023,2024,2025,2026].map(y=><option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          </div>

          <p style={{ fontSize: '.8rem', color: 'var(--muted)', marginBottom: 16 }}>
            Brands: <strong>{selectedBrands.join(', ')}</strong>
          </p>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-s" onClick={() => setStep(2)} disabled={running}>← Quay lại</button>
            <button className="btn-p" onClick={migrateData} disabled={running}>
              {running ? '⏳ Đang migrate...' : '🚀 Bắt đầu Migrate'}
            </button>
          </div>
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
            <button onClick={() => setLog([])} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '.75rem' }}>Xoá log</button>
          </div>
          {log.map((l, i) => (
            <div key={i} style={{
              color: l.type === 'ok' ? '#34d399' : l.type === 'err' ? '#f87171' : l.type === 'warn' ? '#fbbf24' : '#cbd5e1',
              marginBottom: 4, whiteSpace: 'pre-wrap'
            }}>
              {l.msg}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
