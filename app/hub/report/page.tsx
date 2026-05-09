'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getSession, SessionUser } from '@/lib/auth'

/* ── Types ── */
type Brand = { id: string; brand_name: string }

type PlanData = Record<string, { w1: number; w2: number; w3: number; w4: number; mtd: number; month: number }>

type WeekInfo = {
  weekNum: number
  month: number
  year: number
  quarter: number
  label: string
  start: string   // dd/MM/yyyy
  end: string
  startISO: string // yyyy-MM-dd
  endISO: string
  days: number
  isFull: boolean
}

type ShopeeData = {
  s_cpc_doanh_so: number; s_cpc_chi_phi: number; s_cpc_luot_xem: number; s_cpc_luot_click: number; s_cpc_don_hang: number
  s_nd_gmv: number; s_nd_chi_phi: number; s_nd_luot_xem: number; s_nd_luot_click: number
  s_live_gmv: number; s_live_chi_phi: number; s_live_luot_xem: number
}

type TiktokData = {
  t_pgm_doanh_so: number; t_pgm_chi_phi: number; t_pgm_luot_xem: number; t_pgm_luot_click: number; t_pgm_don_hang: number
  t_lgm_doanhthu: number; t_lgm_chi_phi: number
  t_con_nguoi: number; t_con_chi_phi: number
  t_brd_view: number; t_brd_follow: number; t_brd_chi_phi: number
}

type AIResult = {
  highlight: string; lowlight: string
  shopee_thuc_trang: string; shopee_van_de: string; shopee_giai_phap: string
  tiktok_thuc_trang: string; tiktok_van_de: string; tiktok_giai_phap: string
}

/* ── Helpers ── */
function fmtDate(d: Date): string {
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}
function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function fmtNum(n: number, unit: string): string {
  if (!n && n !== 0) return '—'
  if (unit === '₫') return n.toLocaleString('vi-VN') + '₫'
  if (unit === 'x') return n.toFixed(2) + 'x'
  if (unit === '%') return n.toFixed(2) + '%'
  if (unit === '‰') return n.toFixed(0) + '‰'
  return n.toLocaleString('vi-VN')
}
function pct(actual: number, plan: number | undefined): number | null {
  if (!plan) return null
  return parseFloat(((actual / plan) * 100).toFixed(1))
}
function pctClass(p: number | null): string {
  if (p === null) return ''
  if (p >= 90) return 'g'
  if (p >= 70) return 'y'
  return 'r'
}
function n(v: string | number | undefined): number {
  return parseFloat(String(v || 0)) || 0
}

/* ── Week calculation (UpBase calendar: week starts Friday, ends Thursday) ── */
function getWeekInfo(month: number, year: number, weekNum: number): WeekInfo {
  // Find the Nth Friday of the month
  const firstDay = new Date(year, month - 1, 1)
  let fridays: Date[] = []
  const d = new Date(firstDay)
  while (d.getMonth() === month - 1) {
    if (d.getDay() === 5) fridays.push(new Date(d))
    d.setDate(d.getDate() + 1)
  }
  const friday = fridays[weekNum - 1] || fridays[0]
  const thursday = new Date(friday)
  thursday.setDate(friday.getDate() + 6)
  const lastDay = new Date(year, month - 1, new Date(year, month, 0).getDate())
  const weekEnd = thursday > lastDay ? lastDay : thursday
  const days = Math.round((weekEnd.getTime() - friday.getTime()) / (1000 * 60 * 60 * 24)) + 1
  const quarter = Math.ceil(month / 3)
  return {
    weekNum, month, year, quarter,
    label: `W${weekNum} Tháng ${month} Q${quarter}.${year}`,
    start: fmtDate(friday),
    end: fmtDate(weekEnd),
    startISO: toISO(friday),
    endISO: toISO(weekEnd),
    days,
    isFull: days === 7,
  }
}

function getWeeksInMonth(month: number, year: number): number {
  const d = new Date(year, month - 1, 1)
  let count = 0
  while (d.getMonth() === month - 1) {
    if (d.getDay() === 5) count++
    d.setDate(d.getDate() + 1)
  }
  return count || 4
}

function getCurrentWeekDefault(month: number, year: number): number {
  const today = new Date()
  const d = new Date(year, month - 1, 1)
  let weekNum = 0
  while (d <= today && d.getMonth() === month - 1) {
    if (d.getDay() === 5) weekNum++
    d.setDate(d.getDate() + 1)
  }
  return weekNum || 1
}

const EMPTY_SHOPEE: ShopeeData = {
  s_cpc_doanh_so:0,s_cpc_chi_phi:0,s_cpc_luot_xem:0,s_cpc_luot_click:0,s_cpc_don_hang:0,
  s_nd_gmv:0,s_nd_chi_phi:0,s_nd_luot_xem:0,s_nd_luot_click:0,
  s_live_gmv:0,s_live_chi_phi:0,s_live_luot_xem:0,
}
const EMPTY_TIKTOK: TiktokData = {
  t_pgm_doanh_so:0,t_pgm_chi_phi:0,t_pgm_luot_xem:0,t_pgm_luot_click:0,t_pgm_don_hang:0,
  t_lgm_doanhthu:0,t_lgm_chi_phi:0,
  t_con_nguoi:0,t_con_chi_phi:0,
  t_brd_view:0,t_brd_follow:0,t_brd_chi_phi:0,
}

/* ── Calc helpers per sub-section ── */
function calcCPC(d: ShopeeData) {
  const roas = d.s_cpc_chi_phi ? +(d.s_cpc_doanh_so / d.s_cpc_chi_phi).toFixed(2) : 0
  const cpc  = d.s_cpc_luot_click ? +(d.s_cpc_chi_phi / d.s_cpc_luot_click).toFixed(0) : 0
  const ctr  = d.s_cpc_luot_xem ? +(d.s_cpc_luot_click / d.s_cpc_luot_xem * 100).toFixed(2) : 0
  const cr   = d.s_cpc_luot_click ? +(d.s_cpc_don_hang / d.s_cpc_luot_click * 100).toFixed(2) : 0
  const aov  = d.s_cpc_don_hang ? +(d.s_cpc_doanh_so / d.s_cpc_don_hang).toFixed(0) : 0
  return { roas, cpc, ctr, cr, aov }
}
function calcND(d: ShopeeData) {
  const roas = d.s_nd_chi_phi ? +(d.s_nd_gmv / d.s_nd_chi_phi).toFixed(2) : 0
  const cpc  = d.s_nd_luot_click ? +(d.s_nd_chi_phi / d.s_nd_luot_click).toFixed(0) : 0
  const ctr  = d.s_nd_luot_xem ? +(d.s_nd_luot_click / d.s_nd_luot_xem * 100).toFixed(2) : 0
  return { roas, cpc, ctr }
}
function calcLive(d: ShopeeData) {
  const roas = d.s_live_chi_phi ? +(d.s_live_gmv / d.s_live_chi_phi).toFixed(2) : 0
  return { roas }
}
function calcPGM(d: TiktokData) {
  const roas = d.t_pgm_chi_phi ? +(d.t_pgm_doanh_so / d.t_pgm_chi_phi).toFixed(2) : 0
  const cpc  = d.t_pgm_luot_click ? +(d.t_pgm_chi_phi / d.t_pgm_luot_click).toFixed(0) : 0
  const ctr  = d.t_pgm_luot_xem ? +(d.t_pgm_luot_click / d.t_pgm_luot_xem * 100).toFixed(2) : 0
  const cr   = d.t_pgm_luot_click ? +(d.t_pgm_don_hang / d.t_pgm_luot_click * 100).toFixed(2) : 0
  const cpm  = d.t_pgm_luot_xem ? +(d.t_pgm_chi_phi / d.t_pgm_luot_xem * 1000).toFixed(0) : 0
  const aov  = d.t_pgm_don_hang ? +(d.t_pgm_doanh_so / d.t_pgm_don_hang).toFixed(0) : 0
  return { roas, cpc, ctr, cr, cpm, aov }
}
function calcLGM(d: TiktokData) {
  const roi = d.t_lgm_chi_phi ? +(d.t_lgm_doanhthu / d.t_lgm_chi_phi).toFixed(2) : 0
  return { roi }
}
function calcCon(d: TiktokData) {
  const cpa = d.t_con_nguoi ? +(d.t_con_chi_phi / d.t_con_nguoi).toFixed(0) : 0
  return { cpa }
}
function calcBrd(d: TiktokData) {
  const cpa = d.t_brd_follow ? +(d.t_brd_chi_phi / d.t_brd_follow).toFixed(0) : 0
  return { cpa }
}

/* ════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════ */
export default function ReportPage() {
  const router = useRouter()
  const [user, setUser] = useState<SessionUser | null>(null)
  const [step, setStep] = useState(1)
  const [toast, setToast] = useState<{msg:string;type?:string}|null>(null)

  // Step 1 state
  const [brands, setBrands] = useState<Brand[]>([])
  const [brandSearch, setBrandSearch] = useState('')
  const [showBrandDrop, setShowBrandDrop] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState('')
  const [shopeeChecked, setShopeeChecked] = useState(true)
  const [tiktokChecked, setTiktokChecked] = useState(true)
  const today = new Date()
  const [selMonth, setSelMonth] = useState(today.getMonth() + 1)
  const [selYear]  = useState(today.getFullYear())
  const [selWeek, setSelWeek]   = useState(1)
  const [weekInfo, setWeekInfo] = useState<WeekInfo | null>(null)

  // Step 2 state
  const [shopeePlan, setShopeePlan] = useState<PlanData | null>(null)
  const [tiktokPlan, setTiktokPlan] = useState<PlanData | null>(null)
  const [hasPlan, setHasPlan] = useState(false)
  const [shopeeData, setShopeeData] = useState<ShopeeData>({ ...EMPTY_SHOPEE })
  const [tiktokData, setTiktokData] = useState<TiktokData>({ ...EMPTY_TIKTOK })
  const [aiResult, setAiResult] = useState<AIResult>({
    highlight: '', lowlight: '',
    shopee_thuc_trang: '', shopee_van_de: '', shopee_giai_phap: '',
    tiktok_thuc_trang: '', tiktok_van_de: '', tiktok_giai_phap: '',
  })
  const [aiLoading, setAiLoading] = useState(false)

  // Step 3 state
  const [mailSubject, setMailSubject] = useState('')
  const [mailHTML, setMailHTML] = useState('')
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)

  // Plan modal
  const [planModal, setPlanModal] = useState(false)
  const [planInputs, setPlanInputs] = useState<Record<string, string>>({})

  // Add brand
  const [addBrandInput, setAddBrandInput] = useState('')
  const brandRef = useRef<HTMLDivElement>(null)

  function showToast(msg: string, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  /* ── Auth ── */
  useEffect(() => {
    const u = getSession()
    if (!u) { router.push('/'); return }
    setUser(u)
  }, [router])

  /* ── Load brands ── */
  useEffect(() => {
    fetch('/api/brands').then(r => r.json()).then(j => setBrands(j.data || j.brands || []))
  }, [])

  /* ── Update week options when month changes ── */
  useEffect(() => {
    const totalWeeks = getWeeksInMonth(selMonth, selYear)
    const defaultWeek = getCurrentWeekDefault(selMonth, selYear)
    const clamped = Math.min(Math.max(defaultWeek, 1), totalWeeks)
    setSelWeek(clamped)
  }, [selMonth, selYear])

  /* ── Update weekInfo when selWeek/selMonth changes ── */
  useEffect(() => {
    setWeekInfo(getWeekInfo(selMonth, selYear, selWeek))
  }, [selMonth, selYear, selWeek])

  /* ── Close brand dropdown on outside click ── */
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (brandRef.current && !brandRef.current.contains(e.target as Node)) setShowBrandDrop(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filteredBrands = brands.filter(b =>
    b.brand_name.toLowerCase().includes(brandSearch.toLowerCase())
  )

  async function addBrand() {
    const name = addBrandInput.trim()
    if (!name) return
    const r = await fetch('/api/report', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ action: 'addBrand', brand_name: name }) })
    if (r.ok) {
      showToast('Đã thêm brand!')
      setBrands(prev => [...prev, { id: Date.now().toString(), brand_name: name }])
      setAddBrandInput('')
      setSelectedBrand(name)
      setBrandSearch(name)
    } else {
      showToast('Lỗi thêm brand', 'error')
    }
  }

  /* ── Step 1 → Step 2 ── */
  async function goStep2() {
    if (!selectedBrand) { showToast('Chọn brand trước', 'error'); return }
    if (!shopeeChecked && !tiktokChecked) { showToast('Chọn ít nhất 1 platform', 'error'); return }
    if (!weekInfo) return
    showToast('Đang tải dữ liệu...')
    try {
      const [sp, tp] = await Promise.all([
        shopeeChecked
          ? fetch(`/api/report?action=plan&brand=${encodeURIComponent(selectedBrand)}&platform=shopee&month=${weekInfo.month}&year=${weekInfo.year}`).then(r=>r.json())
          : Promise.resolve({ data: null }),
        tiktokChecked
          ? fetch(`/api/report?action=plan&brand=${encodeURIComponent(selectedBrand)}&platform=tiktok&month=${weekInfo.month}&year=${weekInfo.year}`).then(r=>r.json())
          : Promise.resolve({ data: null }),
      ])
      setShopeePlan(sp.data || null)
      setTiktokPlan(tp.data || null)
      const hp = (shopeeChecked ? !!sp.data : true) && (tiktokChecked ? !!tp.data : true)
      setHasPlan(hp)
      setShopeeData({ ...EMPTY_SHOPEE })
      setTiktokData({ ...EMPTY_TIKTOK })
      setAiResult({ highlight:'',lowlight:'',shopee_thuc_trang:'',shopee_van_de:'',shopee_giai_phap:'',tiktok_thuc_trang:'',tiktok_van_de:'',tiktok_giai_phap:'' })
      setStep(2)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      showToast('Lỗi tải dữ liệu', 'error')
    }
  }

  /* ── Generate AI ── */
  async function generateAI() {
    if (!weekInfo) return
    setAiLoading(true)
    const lines: string[] = [`Brand: ${selectedBrand} | ${weekInfo.label}`]
    const wk = `w${weekInfo.weekNum}` as keyof PlanData[string] extends string ? never : string

    if (shopeeChecked) {
      lines.push('\n== SHOPEE ==')
      const c = calcCPC(shopeeData)
      lines.push(`CPC: DS=${shopeeData.s_cpc_doanh_so.toLocaleString('vi-VN')}₫, CP=${shopeeData.s_cpc_chi_phi.toLocaleString('vi-VN')}₫, ROAS=${c.roas}x, CPC=${c.cpc}₫, CTR=${c.ctr}%, CR=${c.cr}%, AOV=${c.aov}₫`)
      const cn = calcND(shopeeData)
      lines.push(`ND: GMV=${shopeeData.s_nd_gmv.toLocaleString('vi-VN')}₫, CP=${shopeeData.s_nd_chi_phi.toLocaleString('vi-VN')}₫, ROAS=${cn.roas}x, CTR=${cn.ctr}%`)
      const cl = calcLive(shopeeData)
      lines.push(`Live: GMV=${shopeeData.s_live_gmv.toLocaleString('vi-VN')}₫, CP=${shopeeData.s_live_chi_phi.toLocaleString('vi-VN')}₫, ROAS=${cl.roas}x`)
      const totalGMV = shopeeData.s_cpc_doanh_so + shopeeData.s_nd_gmv + shopeeData.s_live_gmv
      const totalCP  = shopeeData.s_cpc_chi_phi + shopeeData.s_nd_chi_phi + shopeeData.s_live_chi_phi
      if (shopeePlan) {
        const planW = (shopeePlan['doanh_so']?.[(wk as 'w1'|'w2'|'w3'|'w4'|'mtd'|'month')] || 0)
        const pVal = pct(totalGMV, planW)
        lines.push(`Shopee Total GMV vs Plan W: ${pVal !== null ? pVal + '%' : 'N/A'}`)
      }
      lines.push(`Shopee Total: GMV=${totalGMV.toLocaleString('vi-VN')}₫, CP=${totalCP.toLocaleString('vi-VN')}₫`)
    }
    if (tiktokChecked) {
      lines.push('\n== TIKTOK ==')
      const cp = calcPGM(tiktokData)
      lines.push(`PGM: DS=${tiktokData.t_pgm_doanh_so.toLocaleString('vi-VN')}₫, CP=${tiktokData.t_pgm_chi_phi.toLocaleString('vi-VN')}₫, ROAS=${cp.roas}x, CPC=${cp.cpc}₫, CTR=${cp.ctr}%, CR=${cp.cr}%, CPM=${cp.cpm}₫, AOV=${cp.aov}₫`)
      const cl2 = calcLGM(tiktokData)
      lines.push(`LGM: DT=${tiktokData.t_lgm_doanhthu.toLocaleString('vi-VN')}₫, CP=${tiktokData.t_lgm_chi_phi.toLocaleString('vi-VN')}₫, ROI=${cl2.roi}x`)
      const cc = calcCon(tiktokData)
      lines.push(`Con: Người=${tiktokData.t_con_nguoi}, CP=${tiktokData.t_con_chi_phi.toLocaleString('vi-VN')}₫, CPA=${cc.cpa}₫`)
      const cb = calcBrd(tiktokData)
      lines.push(`Brand: View=${tiktokData.t_brd_view.toLocaleString('vi-VN')}, Follow=${tiktokData.t_brd_follow}, CP=${tiktokData.t_brd_chi_phi.toLocaleString('vi-VN')}₫, CPA/follow=${cb.cpa}₫`)
    }

    try {
      const res = await fetch('/api/report', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze', dataForAI: lines.join('\n') })
      })
      const j = await res.json()
      setAiResult({
        highlight:          j.highlight          || '',
        lowlight:           j.lowlight           || '',
        shopee_thuc_trang:  j.shopee_thuc_trang  || '',
        shopee_van_de:      j.shopee_van_de       || '',
        shopee_giai_phap:   j.shopee_giai_phap    || '',
        tiktok_thuc_trang:  j.tiktok_thuc_trang  || '',
        tiktok_van_de:      j.tiktok_van_de       || '',
        tiktok_giai_phap:   j.tiktok_giai_phap    || '',
      })
      showToast('AI đã phân tích xong!')
    } catch {
      showToast('Lỗi gọi AI', 'error')
    } finally {
      setAiLoading(false)
    }
  }

  /* ── Step 2 → Step 3 ── */
  function goStep3() {
    if (!weekInfo) return
    const subject = `MEDIA x Group | Báo cáo tuần & Kế hoạch hành động | ${selectedBrand} | ${weekInfo.label}`
    setMailSubject(subject)
    setMailHTML(buildMailHTML())
    setStep(3)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function buildMailHTML(): string {
    if (!weekInfo) return ''
    const wk = `w${weekInfo.weekNum}` as 'w1'|'w2'|'w3'|'w4'|'mtd'|'month'

    const tdS = (v: string, extra = '') => `<td style="padding:5px 10px;border:1px solid #ccc;text-align:right;${extra}">${v}</td>`
    const tdL = (v: string) => `<td style="padding:5px 10px;border:1px solid #ccc;text-align:left">${v}</td>`
    const th = (v: string) => `<th style="padding:6px 10px;border:1px solid #999;background:#1a2e5c;color:#fff;text-align:right">${v}</th>`
    const thL = (v: string) => `<th style="padding:6px 10px;border:1px solid #999;background:#1a2e5c;color:#fff;text-align:left">${v}</th>`
    const pctStyle = (p: number | null) => {
      if (p === null) return ''
      const c = p >= 90 ? '#059669' : p >= 70 ? '#D97706' : '#DC2626'
      return `color:${c};font-weight:bold`
    }

    let html = `<div style="font-family:'Times New Roman',Times,serif;font-size:13px;color:#000;line-height:1.6">`
    html += `<p><strong>BÁO CÁO HIỆU SUẤT QUẢNG CÁO — ${selectedBrand.toUpperCase()}</strong><br>${weekInfo.label} | ${weekInfo.start} – ${weekInfo.end}${!weekInfo.isFull ? ` (${weekInfo.days} ngày)` : ''}</p>`
    html += `<hr style="border:1px solid #ccc;margin:12px 0">`

    /* ── Shopee table ── */
    if (shopeeChecked) {
      const c = calcCPC(shopeeData)
      const cn = calcND(shopeeData)
      const cl = calcLive(shopeeData)
      const sPlan = shopeePlan

      const rows: Array<{ name: string; val: string; planKey: string }> = [
        // CPC
        { name: '[ CPC ] Doanh số Ads', val: fmtNum(shopeeData.s_cpc_doanh_so,'₫'), planKey: 's_cpc_doanh_so' },
        { name: '[ CPC ] Chi phí', val: fmtNum(shopeeData.s_cpc_chi_phi,'₫'), planKey: 's_cpc_chi_phi' },
        { name: '[ CPC ] ROAS', val: fmtNum(c.roas,'x'), planKey: '' },
        { name: '[ CPC ] Lượt xem', val: fmtNum(shopeeData.s_cpc_luot_xem,''), planKey: 's_cpc_luot_xem' },
        { name: '[ CPC ] Lượt click', val: fmtNum(shopeeData.s_cpc_luot_click,''), planKey: 's_cpc_luot_click' },
        { name: '[ CPC ] CPC', val: fmtNum(c.cpc,'₫'), planKey: '' },
        { name: '[ CPC ] CTR', val: fmtNum(c.ctr,'%'), planKey: '' },
        { name: '[ CPC ] CR', val: fmtNum(c.cr,'%'), planKey: '' },
        { name: '[ CPC ] Đơn hàng', val: fmtNum(shopeeData.s_cpc_don_hang,''), planKey: 's_cpc_don_hang' },
        { name: '[ CPC ] AOV', val: fmtNum(c.aov,'₫'), planKey: '' },
        // ND
        { name: '[ ND ] GMV', val: fmtNum(shopeeData.s_nd_gmv,'₫'), planKey: 's_nd_gmv' },
        { name: '[ ND ] Chi phí', val: fmtNum(shopeeData.s_nd_chi_phi,'₫'), planKey: 's_nd_chi_phi' },
        { name: '[ ND ] ROAS', val: fmtNum(cn.roas,'x'), planKey: '' },
        { name: '[ ND ] Lượt xem', val: fmtNum(shopeeData.s_nd_luot_xem,''), planKey: '' },
        { name: '[ ND ] CPC', val: fmtNum(cn.cpc,'₫'), planKey: '' },
        { name: '[ ND ] CTR', val: fmtNum(cn.ctr,'%'), planKey: '' },
        // Live
        { name: '[ Live ] GMV', val: fmtNum(shopeeData.s_live_gmv,'₫'), planKey: 's_live_gmv' },
        { name: '[ Live ] Chi phí', val: fmtNum(shopeeData.s_live_chi_phi,'₫'), planKey: 's_live_chi_phi' },
        { name: '[ Live ] ROAS', val: fmtNum(cl.roas,'x'), planKey: '' },
      ]

      html += `<p><strong>— SHOPEE ADS —</strong></p>`
      html += `<table style="border-collapse:collapse;width:100%;font-size:12px;margin:6px 0 16px">`
      html += `<tr>${thL('Metric')}${th('Actual W')}${th('Plan W')}${th('% Plan')}</tr>`
      rows.forEach(row => {
        const planV = sPlan && row.planKey ? (sPlan[row.planKey]?.[wk] || 0) : 0
        const pVal = planV ? pct(parseFloat(row.val.replace(/[^\d.-]/g,'')), planV) : null
        html += `<tr>${tdL(row.name)}${tdS(row.val)}${tdS(planV ? planV.toLocaleString('vi-VN') : '—')}${tdS(pVal !== null ? pVal+'%' : '—', pctStyle(pVal))}</tr>`
      })
      html += `</table>`
    }

    /* ── TikTok table ── */
    if (tiktokChecked) {
      const cp = calcPGM(tiktokData)
      const cl2 = calcLGM(tiktokData)
      const cc = calcCon(tiktokData)
      const cb = calcBrd(tiktokData)
      const tPlan = tiktokPlan

      const rows: Array<{ name: string; val: string; planKey: string }> = [
        // PGM
        { name: '[ PGM ] Doanh số', val: fmtNum(tiktokData.t_pgm_doanh_so,'₫'), planKey: 't_pgm_doanh_so' },
        { name: '[ PGM ] Chi phí', val: fmtNum(tiktokData.t_pgm_chi_phi,'₫'), planKey: 't_pgm_chi_phi' },
        { name: '[ PGM ] ROAS', val: fmtNum(cp.roas,'x'), planKey: '' },
        { name: '[ PGM ] Lượt xem', val: fmtNum(tiktokData.t_pgm_luot_xem,''), planKey: '' },
        { name: '[ PGM ] Lượt click', val: fmtNum(tiktokData.t_pgm_luot_click,''), planKey: '' },
        { name: '[ PGM ] CPC', val: fmtNum(cp.cpc,'₫'), planKey: '' },
        { name: '[ PGM ] CTR', val: fmtNum(cp.ctr,'%'), planKey: '' },
        { name: '[ PGM ] CR', val: fmtNum(cp.cr,'%'), planKey: '' },
        { name: '[ PGM ] CPM', val: fmtNum(cp.cpm,'₫'), planKey: '' },
        { name: '[ PGM ] Đơn hàng', val: fmtNum(tiktokData.t_pgm_don_hang,''), planKey: '' },
        { name: '[ PGM ] AOV', val: fmtNum(cp.aov,'₫'), planKey: '' },
        // LGM
        { name: '[ LGM ] Doanh thu Live', val: fmtNum(tiktokData.t_lgm_doanhthu,'₫'), planKey: 't_lgm_doanhthu' },
        { name: '[ LGM ] Chi phí', val: fmtNum(tiktokData.t_lgm_chi_phi,'₫'), planKey: '' },
        { name: '[ LGM ] ROI', val: fmtNum(cl2.roi,'x'), planKey: '' },
        // Con
        { name: '[ Con ] Người tiếp cận', val: fmtNum(tiktokData.t_con_nguoi,''), planKey: '' },
        { name: '[ Con ] Chi phí', val: fmtNum(tiktokData.t_con_chi_phi,'₫'), planKey: '' },
        { name: '[ Con ] CPA', val: fmtNum(cc.cpa,'₫'), planKey: '' },
        // Brand
        { name: '[ Brand ] View', val: fmtNum(tiktokData.t_brd_view,''), planKey: '' },
        { name: '[ Brand ] Follow', val: fmtNum(tiktokData.t_brd_follow,''), planKey: '' },
        { name: '[ Brand ] Chi phí', val: fmtNum(tiktokData.t_brd_chi_phi,'₫'), planKey: '' },
        { name: '[ Brand ] CPA/Follow', val: fmtNum(cb.cpa,'₫'), planKey: '' },
      ]

      html += `<p><strong>— TIKTOK SHOP ADS —</strong></p>`
      html += `<table style="border-collapse:collapse;width:100%;font-size:12px;margin:6px 0 16px">`
      html += `<tr>${thL('Metric')}${th('Actual W')}${th('Plan W')}${th('% Plan')}</tr>`
      rows.forEach(row => {
        const planV = tPlan && row.planKey ? (tPlan[row.planKey]?.[wk] || 0) : 0
        const pVal = planV ? pct(parseFloat(row.val.replace(/[^\d.-]/g,'')), planV) : null
        html += `<tr>${tdL(row.name)}${tdS(row.val)}${tdS(planV ? planV.toLocaleString('vi-VN') : '—')}${tdS(pVal !== null ? pVal+'%' : '—', pctStyle(pVal))}</tr>`
      })
      html += `</table>`
    }

    /* ── Highlight / Lowlight ── */
    html += `<hr style="border:1px solid #ccc;margin:12px 0">`
    html += `<p><strong>HIGHLIGHT &amp; LOWLIGHT</strong></p>`
    html += `<table style="border-collapse:collapse;width:100%;font-size:12px">`
    html += `<tr>`
    html += `<th style="background:#1a5c2e;color:#fff;padding:6px 14px;border:1px solid #999;text-align:left;width:50%">Highlight</th>`
    html += `<th style="background:#5c1a1a;color:#fff;padding:6px 14px;border:1px solid #999;text-align:left;width:50%">Lowlight</th>`
    html += `</tr><tr>`
    html += `<td style="padding:10px 14px;border:1px solid #ccc;vertical-align:top;white-space:pre-wrap">${aiResult.highlight || '1. \n2. '}</td>`
    html += `<td style="padding:10px 14px;border:1px solid #ccc;vertical-align:top;white-space:pre-wrap">${aiResult.lowlight || '1. \n2. '}</td>`
    html += `</tr></table>`

    /* ── DARA Analysis ── */
    html += `<hr style="border:1px solid #ccc;margin:12px 0">`
    html += `<p><strong>NHẬN XÉT &amp; KẾ HOẠCH — FRAMEWORK DARA</strong></p>`

    if (shopeeChecked) {
      html += `<p><strong>SHOPEE</strong></p>`
      html += `<p><strong>Thực trạng:</strong><br>${(aiResult.shopee_thuc_trang||'').replace(/\n/g,'<br>')}</p>`
      html += `<p><strong>Vấn đề &amp; Root Cause:</strong><br>${(aiResult.shopee_van_de||'').replace(/\n/g,'<br>')}</p>`
      html += `<p><strong>Giải pháp &amp; Plan tuần tới:</strong><br>${(aiResult.shopee_giai_phap||'').replace(/\n/g,'<br>')}</p>`
    }
    if (tiktokChecked) {
      html += `<p><strong>TIKTOK SHOP</strong></p>`
      html += `<p><strong>Thực trạng:</strong><br>${(aiResult.tiktok_thuc_trang||'').replace(/\n/g,'<br>')}</p>`
      html += `<p><strong>Vấn đề &amp; Root Cause:</strong><br>${(aiResult.tiktok_van_de||'').replace(/\n/g,'<br>')}</p>`
      html += `<p><strong>Giải pháp &amp; Plan tuần tới:</strong><br>${(aiResult.tiktok_giai_phap||'').replace(/\n/g,'<br>')}</p>`
    }

    html += `<hr style="border:1px solid #ccc;margin:12px 0">`
    html += `<p style="color:#555;font-size:12px">Reported by: ${user?.name || ''} | ${fmtDate(new Date())}</p>`
    html += `</div>`
    return html
  }

  /* ── Copy HTML ── */
  async function copyMail() {
    const subjectBar = `<b>Subject: ${mailSubject}</b><br><br>`
    const blob = new Blob([subjectBar + mailHTML], { type: 'text/html' })
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })])
      setCopied(true)
      showToast('Đã copy — paste vào Lark Mail!')
      setTimeout(() => setCopied(false), 3000)
    } catch {
      const temp = document.createElement('div')
      temp.innerHTML = mailHTML
      navigator.clipboard.writeText(`Subject: ${mailSubject}\n\n${temp.innerText}`)
      showToast('Đã copy (text only)')
    }
  }

  /* ── Save weekly report ── */
  async function saveReport() {
    if (!weekInfo || !user) return
    setSaving(true)
    const payload = {
      action: 'saveWeekly',
      username: user.username,
      brand_name: selectedBrand,
      month: weekInfo.month,
      year: weekInfo.year,
      week_num: weekInfo.weekNum,
      week_start: weekInfo.startISO,
      week_end: weekInfo.endISO,
      ...shopeeData,
      ...tiktokData,
      highlight: aiResult.highlight,
      lowlight: aiResult.lowlight,
      nhan_xet_thuc_trang: (shopeeChecked ? aiResult.shopee_thuc_trang : '') + (tiktokChecked ? '\n' + aiResult.tiktok_thuc_trang : ''),
      nhan_xet_van_de: (shopeeChecked ? aiResult.shopee_van_de : '') + (tiktokChecked ? '\n' + aiResult.tiktok_van_de : ''),
      nhan_xet_giai_phap: (shopeeChecked ? aiResult.shopee_giai_phap : '') + (tiktokChecked ? '\n' + aiResult.tiktok_giai_phap : ''),
    }
    const r = await fetch('/api/report', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) })
    if (r.ok) showToast('Đã lưu báo cáo!')
    else showToast('Lỗi lưu báo cáo', 'error')
    setSaving(false)
  }

  /* ── Plan modal ── */
  function openPlanModal() {
    // Pre-fill existing plan values
    const inputs: Record<string, string> = {}
    const fillPlan = (plat: string, plan: PlanData | null) => {
      planMetricKeys.forEach(mk => {
        ['w1','w2','w3','w4','mtd','month'].forEach(w => {
          inputs[`${plat}_${mk}_${w}`] = plan ? String(plan[mk]?.[w as 'w1'] || '') : ''
        })
      })
    }
    if (shopeeChecked) fillPlan('shopee', shopeePlan)
    if (tiktokChecked) fillPlan('tiktok', tiktokPlan)
    setPlanInputs(inputs)
    setPlanModal(true)
  }

  async function savePlan() {
    if (!weekInfo) return
    try {
      const saveOne = async (plat: string) => {
        const plan_data: PlanData = {}
        planMetricKeys.forEach(mk => {
          plan_data[mk] = {} as PlanData[string]
          ;(['w1','w2','w3','w4','mtd','month'] as const).forEach(w => {
            plan_data[mk][w] = parseFloat(planInputs[`${plat}_${mk}_${w}`] || '0') || 0
          })
        })
        await fetch('/api/report', {
          method: 'POST', headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ action: 'savePlan', brand_name: selectedBrand, platform: plat, month: weekInfo.month, year: weekInfo.year, plan_data, created_by: user?.username })
        })
        return plan_data
      }
      if (shopeeChecked) { const pd = await saveOne('shopee'); setShopeePlan(pd) }
      if (tiktokChecked) { const pd = await saveOne('tiktok'); setTiktokPlan(pd) }
      setHasPlan(true)
      setPlanModal(false)
      showToast('Đã lưu Plan!')
    } catch {
      showToast('Lỗi lưu Plan', 'error')
    }
  }

  const planMetricKeys = [
    's_cpc_doanh_so','s_cpc_chi_phi','s_cpc_luot_xem','s_cpc_luot_click','s_cpc_don_hang',
    's_nd_gmv','s_nd_chi_phi','s_nd_luot_xem','s_nd_luot_click',
    's_live_gmv','s_live_chi_phi','s_live_luot_xem',
    't_pgm_doanh_so','t_pgm_chi_phi','t_pgm_luot_xem','t_pgm_luot_click','t_pgm_don_hang',
    't_lgm_doanhthu','t_lgm_chi_phi',
    't_con_nguoi','t_con_chi_phi',
    't_brd_view','t_brd_follow','t_brd_chi_phi',
  ]

  const planMetricLabels: Record<string, string> = {
    's_cpc_doanh_so':'[S-CPC] Doanh số','s_cpc_chi_phi':'[S-CPC] Chi phí','s_cpc_luot_xem':'[S-CPC] Lượt xem','s_cpc_luot_click':'[S-CPC] Lượt click','s_cpc_don_hang':'[S-CPC] Đơn hàng',
    's_nd_gmv':'[S-ND] GMV','s_nd_chi_phi':'[S-ND] Chi phí','s_nd_luot_xem':'[S-ND] Lượt xem','s_nd_luot_click':'[S-ND] Lượt click',
    's_live_gmv':'[S-Live] GMV','s_live_chi_phi':'[S-Live] Chi phí','s_live_luot_xem':'[S-Live] Lượt xem',
    't_pgm_doanh_so':'[T-PGM] Doanh số','t_pgm_chi_phi':'[T-PGM] Chi phí','t_pgm_luot_xem':'[T-PGM] Lượt xem','t_pgm_luot_click':'[T-PGM] Lượt click','t_pgm_don_hang':'[T-PGM] Đơn hàng',
    't_lgm_doanhthu':'[T-LGM] Doanh thu','t_lgm_chi_phi':'[T-LGM] Chi phí',
    't_con_nguoi':'[T-Con] Người','t_con_chi_phi':'[T-Con] Chi phí',
    't_brd_view':'[T-Brand] View','t_brd_follow':'[T-Brand] Follow','t_brd_chi_phi':'[T-Brand] Chi phí',
  }

  // Filter plan keys based on selected platforms
  const activePlanKeys = planMetricKeys.filter(k => {
    if (k.startsWith('s_') && !shopeeChecked) return false
    if (k.startsWith('t_') && !tiktokChecked) return false
    return true
  })

  /* ── Shopee calcs for display ── */
  const cpcC = calcCPC(shopeeData)
  const ndC  = calcND(shopeeData)
  const liveC = calcLive(shopeeData)
  const sTotalGMV = shopeeData.s_cpc_doanh_so + shopeeData.s_nd_gmv + shopeeData.s_live_gmv
  const sTotalCP  = shopeeData.s_cpc_chi_phi + shopeeData.s_nd_chi_phi + shopeeData.s_live_chi_phi
  const sTotalROAS = sTotalCP ? +(sTotalGMV / sTotalCP).toFixed(2) : 0

  /* ── TikTok calcs for display ── */
  const pgmC  = calcPGM(tiktokData)
  const lgmC  = calcLGM(tiktokData)
  const conC  = calcCon(tiktokData)
  const brdC  = calcBrd(tiktokData)
  const tTotalGMV = tiktokData.t_pgm_doanh_so + tiktokData.t_lgm_doanhthu
  const tTotalCP  = tiktokData.t_pgm_chi_phi + tiktokData.t_lgm_chi_phi + tiktokData.t_con_chi_phi + tiktokData.t_brd_chi_phi
  const tTotalROI = tTotalCP ? +(tTotalGMV / tTotalCP).toFixed(2) : 0

  const wk = weekInfo ? `w${weekInfo.weekNum}` as 'w1'|'w2'|'w3'|'w4'|'mtd'|'month' : 'w1'

  if (!user) return null

  /* ════════════════════════
     RENDER
  ════════════════════════ */
  return (
    <div className="rw">
      {/* Toast */}
      <div id="toast" className={toast ? 'show' : ''}>
        <span className="toast-dot" style={{ background: toast?.type === 'error' ? '#EF4444' : '#10B981' }} />
        {toast?.msg}
      </div>

      {/* Header */}
      <div className="rw-hdr">
        <h1 style={{ display:'flex', alignItems:'center', gap:10 }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          Weekly Report Tool
        </h1>
        <p>Nhập data Actual → AI generate nhận xét → Copy mail gửi Lark. Framework DARA · TikTok Shop + Shopee.</p>
      </div>

      {/* Step tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:24, overflowX:'auto' }}>
        {[{n:1,label:'Context'},{n:2,label:'Nhập Data'},{n:3,label:'Preview & Copy'}].map(s => (
          <div key={s.n} className={`step-tab2 ${step===s.n?'active':step>s.n?'done':'disabled'}`}
            onClick={() => { if (step > s.n) setStep(s.n) }}>
            <span className="step-num">BƯỚC {s.n}</span>
            <span className="step-name">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ══════════════ STEP 1 ══════════════ */}
      {step === 1 && (
        <div className="rc">
          <h2>Chọn Context</h2>
          <p>Chọn brand, platform, tháng và tuần cần báo cáo.</p>

          {/* Brand selector */}
          <div style={{ marginBottom:14 }}>
            <label className="rl">Brand</label>
            <div className="brand-search-wrap" ref={brandRef}>
              <input
                className="ri"
                placeholder="Tìm brand..."
                value={brandSearch}
                onChange={e => { setBrandSearch(e.target.value); setShowBrandDrop(true) }}
                onFocus={() => setShowBrandDrop(true)}
              />
              {showBrandDrop && filteredBrands.length > 0 && (
                <div className="brand-dropdown">
                  {filteredBrands.map(b => (
                    <div key={b.id} className="brand-opt"
                      onClick={() => { setSelectedBrand(b.brand_name); setBrandSearch(b.brand_name); setShowBrandDrop(false) }}>
                      {b.brand_name}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display:'flex', gap:8, marginTop:8 }}>
              <input className="ri" style={{ flex:1 }} placeholder="Thêm brand mới..." value={addBrandInput}
                onChange={e => setAddBrandInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addBrand()} />
              <button className="btn-s" onClick={addBrand}>Thêm</button>
            </div>
            {selectedBrand && <p style={{ marginTop:6, fontSize:'.82rem', color:'var(--blue)', fontWeight:700 }}>Đã chọn: {selectedBrand}</p>}
          </div>

          {/* Platform checkboxes */}
          <div style={{ marginBottom:14 }}>
            <label className="rl">Platform</label>
            <div className="plat-row">
              <label className={`plat-chk ${shopeeChecked ? 'on' : ''}`}>
                <input type="checkbox" checked={shopeeChecked} onChange={e => setShopeeChecked(e.target.checked)} />
                Shopee Ads
              </label>
              <label className={`plat-chk ${tiktokChecked ? 'on' : ''}`}>
                <input type="checkbox" checked={tiktokChecked} onChange={e => setTiktokChecked(e.target.checked)} />
                TikTok Shop
              </label>
            </div>
          </div>

          {/* Month & Week */}
          <div className="rg" style={{ marginBottom:14 }}>
            <div>
              <label className="rl">Tháng</label>
              <select className="rs" value={selMonth} onChange={e => setSelMonth(parseInt(e.target.value))}>
                {Array.from({length:12}, (_,i) => <option key={i+1} value={i+1}>Tháng {i+1}</option>)}
              </select>
            </div>
            <div>
              <label className="rl">Tuần</label>
              <select className="rs" value={selWeek} onChange={e => setSelWeek(parseInt(e.target.value))}>
                {Array.from({ length: getWeeksInMonth(selMonth, selYear) }, (_,i) => (
                  <option key={i+1} value={i+1}>W{i+1}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Week display */}
          {weekInfo && (
            <div className="wd">
              <div>
                <div className="wd-lbl">{weekInfo.label}</div>
                <div className="wd-rng">{weekInfo.start} – {weekInfo.end}</div>
              </div>
              <span className={`wd-badge ${weekInfo.isFull ? 'full' : 'short'}`}>
                {weekInfo.isFull ? '7 ngày' : `${weekInfo.days} ngày (tuần lẻ)`}
              </span>
            </div>
          )}

          <button className="btn-p" onClick={goStep2} style={{ marginTop:8 }}>
            Tiếp theo →
          </button>
        </div>
      )}

      {/* ══════════════ STEP 2 ══════════════ */}
      {step === 2 && weekInfo && (
        <div>
          {/* Plan warning */}
          {!hasPlan && (
            <div className="plan-warn">
              <span style={{ fontSize:'1.2rem' }}>⚠️</span>
              <div style={{ flex:1 }}>
                <strong>Chưa có Plan tháng {weekInfo.month}/{weekInfo.year} cho brand này</strong>
                <span style={{ display:'block' }}>Nhập plan để xem % Plan theo tuần.</span>
              </div>
              <button className="btn-set-plan" onClick={openPlanModal}>Set Plan</button>
            </div>
          )}

          {/* ── SHOPEE SECTION ── */}
          {shopeeChecked && (
            <div className="plat-sec">
              <div className="plat-sec-hdr shopee">Shopee Ads</div>

              {/* CPC */}
              <div className="rc">
                <div className="sub-h">CPC — Quảng cáo tìm kiếm</div>
                <table className="mt">
                  <thead>
                    <tr>
                      <th style={{ textAlign:'left' }}>Metric</th>
                      <th>Actual W</th>
                      <th>Plan W</th>
                      <th>% Plan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { key:'s_cpc_doanh_so', label:'Doanh số Ads (₫)' },
                      { key:'s_cpc_chi_phi',  label:'Chi phí (₫)' },
                      { key:'s_cpc_luot_xem', label:'Lượt xem' },
                      { key:'s_cpc_luot_click',label:'Lượt click' },
                      { key:'s_cpc_don_hang', label:'Đơn hàng' },
                    ].map(({ key, label }) => {
                      const planV = shopeePlan?.[key]?.[wk] || 0
                      const actual = shopeeData[key as keyof ShopeeData] as number
                      const pVal = planV ? pct(actual, planV) : null
                      return (
                        <tr key={key}>
                          <td className="mn">{label}</td>
                          <td><input className="m-inp" type="number" value={actual || ''} placeholder="0"
                            onChange={e => setShopeeData(prev => ({ ...prev, [key]: parseFloat(e.target.value)||0 }))} /></td>
                          <td className="plan-v">{planV ? planV.toLocaleString('vi-VN') : '—'}</td>
                          <td><span className={`pct ${pctClass(pVal)}`}>{pVal !== null ? pVal+'%' : '—'}</span></td>
                        </tr>
                      )
                    })}
                    <tr>
                      <td className="mn" style={{ color:'var(--faint)' }}>ROAS (tự tính)</td>
                      <td className="calc">{fmtNum(cpcC.roas,'x')}</td><td></td><td></td>
                    </tr>
                    <tr>
                      <td className="mn" style={{ color:'var(--faint)' }}>CPC (tự tính)</td>
                      <td className="calc">{fmtNum(cpcC.cpc,'₫')}</td><td></td><td></td>
                    </tr>
                    <tr>
                      <td className="mn" style={{ color:'var(--faint)' }}>CTR (tự tính)</td>
                      <td className="calc">{fmtNum(cpcC.ctr,'%')}</td><td></td><td></td>
                    </tr>
                    <tr>
                      <td className="mn" style={{ color:'var(--faint)' }}>CR (tự tính)</td>
                      <td className="calc">{fmtNum(cpcC.cr,'%')}</td><td></td><td></td>
                    </tr>
                    <tr>
                      <td className="mn" style={{ color:'var(--faint)' }}>AOV (tự tính)</td>
                      <td className="calc">{fmtNum(cpcC.aov,'₫')}</td><td></td><td></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* ND */}
              <div className="rc">
                <div className="sub-h">Nhận Diện — Display Ads</div>
                <table className="mt">
                  <thead>
                    <tr><th style={{ textAlign:'left' }}>Metric</th><th>Actual W</th><th>Plan W</th><th>% Plan</th></tr>
                  </thead>
                  <tbody>
                    {[
                      { key:'s_nd_gmv',        label:'GMV (₫)' },
                      { key:'s_nd_chi_phi',     label:'Chi phí (₫)' },
                      { key:'s_nd_luot_xem',    label:'Lượt xem' },
                      { key:'s_nd_luot_click',  label:'Lượt click' },
                    ].map(({ key, label }) => {
                      const planV = shopeePlan?.[key]?.[wk] || 0
                      const actual = shopeeData[key as keyof ShopeeData] as number
                      const pVal = planV ? pct(actual, planV) : null
                      return (
                        <tr key={key}>
                          <td className="mn">{label}</td>
                          <td><input className="m-inp" type="number" value={actual || ''} placeholder="0"
                            onChange={e => setShopeeData(prev => ({ ...prev, [key]: parseFloat(e.target.value)||0 }))} /></td>
                          <td className="plan-v">{planV ? planV.toLocaleString('vi-VN') : '—'}</td>
                          <td><span className={`pct ${pctClass(pVal)}`}>{pVal !== null ? pVal+'%' : '—'}</span></td>
                        </tr>
                      )
                    })}
                    <tr><td className="mn" style={{ color:'var(--faint)' }}>ROAS (tự tính)</td><td className="calc">{fmtNum(ndC.roas,'x')}</td><td></td><td></td></tr>
                    <tr><td className="mn" style={{ color:'var(--faint)' }}>CPC (tự tính)</td><td className="calc">{fmtNum(ndC.cpc,'₫')}</td><td></td><td></td></tr>
                    <tr><td className="mn" style={{ color:'var(--faint)' }}>CTR (tự tính)</td><td className="calc">{fmtNum(ndC.ctr,'%')}</td><td></td><td></td></tr>
                  </tbody>
                </table>
              </div>

              {/* Live */}
              <div className="rc">
                <div className="sub-h">Livestream Ads</div>
                <table className="mt">
                  <thead>
                    <tr><th style={{ textAlign:'left' }}>Metric</th><th>Actual W</th><th>Plan W</th><th>% Plan</th></tr>
                  </thead>
                  <tbody>
                    {[
                      { key:'s_live_gmv',      label:'GMV (₫)' },
                      { key:'s_live_chi_phi',  label:'Chi phí (₫)' },
                      { key:'s_live_luot_xem', label:'Lượt xem' },
                    ].map(({ key, label }) => {
                      const planV = shopeePlan?.[key]?.[wk] || 0
                      const actual = shopeeData[key as keyof ShopeeData] as number
                      const pVal = planV ? pct(actual, planV) : null
                      return (
                        <tr key={key}>
                          <td className="mn">{label}</td>
                          <td><input className="m-inp" type="number" value={actual || ''} placeholder="0"
                            onChange={e => setShopeeData(prev => ({ ...prev, [key]: parseFloat(e.target.value)||0 }))} /></td>
                          <td className="plan-v">{planV ? planV.toLocaleString('vi-VN') : '—'}</td>
                          <td><span className={`pct ${pctClass(pVal)}`}>{pVal !== null ? pVal+'%' : '—'}</span></td>
                        </tr>
                      )
                    })}
                    <tr><td className="mn" style={{ color:'var(--faint)' }}>ROAS (tự tính)</td><td className="calc">{fmtNum(liveC.roas,'x')}</td><td></td><td></td></tr>
                  </tbody>
                </table>
              </div>

              {/* Shopee total box */}
              <div className="total-box">
                <div style={{ fontWeight:700, marginBottom:10, fontSize:'.88rem' }}>Shopee — Tổng</div>
                <table className="mt">
                  <tbody>
                    <tr className="total-row">
                      <td className="mn">GMV Ads (Tổng)</td>
                      <td className="calc">{fmtNum(sTotalGMV,'₫')}</td>
                      <td className="plan-v">{shopeePlan?.['s_cpc_doanh_so']?.month ? fmtNum((shopeePlan['s_cpc_doanh_so'].month||0)+(shopeePlan['s_nd_gmv']?.month||0)+(shopeePlan['s_live_gmv']?.month||0),'₫') : '—'}</td>
                      <td></td>
                    </tr>
                    <tr className="total-row">
                      <td className="mn">Chi phí (Tổng)</td>
                      <td className="calc">{fmtNum(sTotalCP,'₫')}</td><td></td><td></td>
                    </tr>
                    <tr className="total-row">
                      <td className="mn">ROAS (Tổng)</td>
                      <td className="calc">{fmtNum(sTotalROAS,'x')}</td><td></td><td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── TIKTOK SECTION ── */}
          {tiktokChecked && (
            <div className="plat-sec">
              <div className="plat-sec-hdr tiktok">TikTok Shop Ads</div>

              {/* PGM */}
              <div className="rc">
                <div className="sub-h">PGM — Product GMV Ads</div>
                <table className="mt">
                  <thead>
                    <tr><th style={{ textAlign:'left' }}>Metric</th><th>Actual W</th><th>Plan W</th><th>% Plan</th></tr>
                  </thead>
                  <tbody>
                    {[
                      { key:'t_pgm_doanh_so',   label:'Doanh số (₫)' },
                      { key:'t_pgm_chi_phi',     label:'Chi phí (₫)' },
                      { key:'t_pgm_luot_xem',    label:'Lượt xem' },
                      { key:'t_pgm_luot_click',  label:'Lượt click' },
                      { key:'t_pgm_don_hang',    label:'Đơn hàng' },
                    ].map(({ key, label }) => {
                      const planV = tiktokPlan?.[key]?.[wk] || 0
                      const actual = tiktokData[key as keyof TiktokData] as number
                      const pVal = planV ? pct(actual, planV) : null
                      return (
                        <tr key={key}>
                          <td className="mn">{label}</td>
                          <td><input className="m-inp" type="number" value={actual || ''} placeholder="0"
                            onChange={e => setTiktokData(prev => ({ ...prev, [key]: parseFloat(e.target.value)||0 }))} /></td>
                          <td className="plan-v">{planV ? planV.toLocaleString('vi-VN') : '—'}</td>
                          <td><span className={`pct ${pctClass(pVal)}`}>{pVal !== null ? pVal+'%' : '—'}</span></td>
                        </tr>
                      )
                    })}
                    <tr><td className="mn" style={{ color:'var(--faint)' }}>ROAS (tự tính)</td><td className="calc">{fmtNum(pgmC.roas,'x')}</td><td></td><td></td></tr>
                    <tr><td className="mn" style={{ color:'var(--faint)' }}>CPC (tự tính)</td><td className="calc">{fmtNum(pgmC.cpc,'₫')}</td><td></td><td></td></tr>
                    <tr><td className="mn" style={{ color:'var(--faint)' }}>CTR (tự tính)</td><td className="calc">{fmtNum(pgmC.ctr,'%')}</td><td></td><td></td></tr>
                    <tr><td className="mn" style={{ color:'var(--faint)' }}>CR (tự tính)</td><td className="calc">{fmtNum(pgmC.cr,'%')}</td><td></td><td></td></tr>
                    <tr><td className="mn" style={{ color:'var(--faint)' }}>CPM (tự tính)</td><td className="calc">{fmtNum(pgmC.cpm,'₫')}</td><td></td><td></td></tr>
                    <tr><td className="mn" style={{ color:'var(--faint)' }}>AOV (tự tính)</td><td className="calc">{fmtNum(pgmC.aov,'₫')}</td><td></td><td></td></tr>
                  </tbody>
                </table>
              </div>

              {/* LGM */}
              <div className="rc">
                <div className="sub-h">LGM — Livestream GMV</div>
                <table className="mt">
                  <thead>
                    <tr><th style={{ textAlign:'left' }}>Metric</th><th>Actual W</th><th>Plan W</th><th>% Plan</th></tr>
                  </thead>
                  <tbody>
                    {[
                      { key:'t_lgm_doanhthu', label:'Doanh thu Live (₫)' },
                      { key:'t_lgm_chi_phi',  label:'Chi phí (₫)' },
                    ].map(({ key, label }) => {
                      const planV = tiktokPlan?.[key]?.[wk] || 0
                      const actual = tiktokData[key as keyof TiktokData] as number
                      const pVal = planV ? pct(actual, planV) : null
                      return (
                        <tr key={key}>
                          <td className="mn">{label}</td>
                          <td><input className="m-inp" type="number" value={actual || ''} placeholder="0"
                            onChange={e => setTiktokData(prev => ({ ...prev, [key]: parseFloat(e.target.value)||0 }))} /></td>
                          <td className="plan-v">{planV ? planV.toLocaleString('vi-VN') : '—'}</td>
                          <td><span className={`pct ${pctClass(pVal)}`}>{pVal !== null ? pVal+'%' : '—'}</span></td>
                        </tr>
                      )
                    })}
                    <tr><td className="mn" style={{ color:'var(--faint)' }}>ROI (tự tính)</td><td className="calc">{fmtNum(lgmC.roi,'x')}</td><td></td><td></td></tr>
                  </tbody>
                </table>
              </div>

              {/* Consideration */}
              <div className="rc">
                <div className="sub-h">Consideration</div>
                <table className="mt">
                  <thead>
                    <tr><th style={{ textAlign:'left' }}>Metric</th><th>Actual W</th><th>Plan W</th><th>% Plan</th></tr>
                  </thead>
                  <tbody>
                    {[
                      { key:'t_con_nguoi',   label:'Người tiếp cận' },
                      { key:'t_con_chi_phi', label:'Chi phí (₫)' },
                    ].map(({ key, label }) => {
                      const planV = tiktokPlan?.[key]?.[wk] || 0
                      const actual = tiktokData[key as keyof TiktokData] as number
                      const pVal = planV ? pct(actual, planV) : null
                      return (
                        <tr key={key}>
                          <td className="mn">{label}</td>
                          <td><input className="m-inp" type="number" value={actual || ''} placeholder="0"
                            onChange={e => setTiktokData(prev => ({ ...prev, [key]: parseFloat(e.target.value)||0 }))} /></td>
                          <td className="plan-v">{planV ? planV.toLocaleString('vi-VN') : '—'}</td>
                          <td><span className={`pct ${pctClass(pVal)}`}>{pVal !== null ? pVal+'%' : '—'}</span></td>
                        </tr>
                      )
                    })}
                    <tr><td className="mn" style={{ color:'var(--faint)' }}>CPA (tự tính)</td><td className="calc">{fmtNum(conC.cpa,'₫')}</td><td></td><td></td></tr>
                  </tbody>
                </table>
              </div>

              {/* Branding */}
              <div className="rc">
                <div className="sub-h">Branding — Follow & View</div>
                <table className="mt">
                  <thead>
                    <tr><th style={{ textAlign:'left' }}>Metric</th><th>Actual W</th><th>Plan W</th><th>% Plan</th></tr>
                  </thead>
                  <tbody>
                    {[
                      { key:'t_brd_view',     label:'View' },
                      { key:'t_brd_follow',   label:'Follow' },
                      { key:'t_brd_chi_phi',  label:'Chi phí (₫)' },
                    ].map(({ key, label }) => {
                      const planV = tiktokPlan?.[key]?.[wk] || 0
                      const actual = tiktokData[key as keyof TiktokData] as number
                      const pVal = planV ? pct(actual, planV) : null
                      return (
                        <tr key={key}>
                          <td className="mn">{label}</td>
                          <td><input className="m-inp" type="number" value={actual || ''} placeholder="0"
                            onChange={e => setTiktokData(prev => ({ ...prev, [key]: parseFloat(e.target.value)||0 }))} /></td>
                          <td className="plan-v">{planV ? planV.toLocaleString('vi-VN') : '—'}</td>
                          <td><span className={`pct ${pctClass(pVal)}`}>{pVal !== null ? pVal+'%' : '—'}</span></td>
                        </tr>
                      )
                    })}
                    <tr><td className="mn" style={{ color:'var(--faint)' }}>CPA/Follow (tự tính)</td><td className="calc">{fmtNum(brdC.cpa,'₫')}</td><td></td><td></td></tr>
                  </tbody>
                </table>
              </div>

              {/* TikTok total box */}
              <div className="total-box">
                <div style={{ fontWeight:700, marginBottom:10, fontSize:'.88rem' }}>TikTok — Tổng</div>
                <table className="mt">
                  <tbody>
                    <tr className="total-row">
                      <td className="mn">GMV (PGM + LGM)</td>
                      <td className="calc">{fmtNum(tTotalGMV,'₫')}</td>
                      <td className="plan-v">{tiktokPlan?.['t_pgm_doanh_so']?.month ? fmtNum((tiktokPlan['t_pgm_doanh_so'].month||0)+(tiktokPlan['t_lgm_doanhthu']?.month||0),'₫') : '—'}</td>
                      <td></td>
                    </tr>
                    <tr className="total-row">
                      <td className="mn">Chi phí (Tổng)</td>
                      <td className="calc">{fmtNum(tTotalCP,'₫')}</td><td></td><td></td>
                    </tr>
                    <tr className="total-row">
                      <td className="mn">ROI (Tổng)</td>
                      <td className="calc">{fmtNum(tTotalROI,'x')}</td><td></td><td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── AI Section ── */}
          <div className="rc">
            <h2>AI Nhận xét (DARA)</h2>
            <button className="btn-ai" onClick={generateAI} disabled={aiLoading}>
              {aiLoading
                ? <><span className="spin" /><span>Đang phân tích...</span></>
                : <><span>✦</span><span>Generate AI nhận xét</span></>
              }
            </button>

            <div className="ai-f" style={{ marginTop:16 }}>
              <div>
                <div className="ai-lbl">Highlight</div>
                <div className="ai-body" contentEditable suppressContentEditableWarning
                  data-ph="Những điểm tốt tuần này..."
                  onBlur={e => setAiResult(prev => ({ ...prev, highlight: e.currentTarget.textContent || '' }))}>
                  {aiResult.highlight}
                </div>
              </div>
              <div>
                <div className="ai-lbl">Lowlight</div>
                <div className="ai-body" contentEditable suppressContentEditableWarning
                  data-ph="Những điểm cần cải thiện..."
                  onBlur={e => setAiResult(prev => ({ ...prev, lowlight: e.currentTarget.textContent || '' }))}>
                  {aiResult.lowlight}
                </div>
              </div>

              {shopeeChecked && (
                <>
                  <div>
                    <div className="ai-lbl">Shopee — Thực trạng</div>
                    <div className="ai-body" contentEditable suppressContentEditableWarning
                      data-ph="Thực trạng Shopee..."
                      onBlur={e => setAiResult(prev => ({ ...prev, shopee_thuc_trang: e.currentTarget.textContent || '' }))}>
                      {aiResult.shopee_thuc_trang}
                    </div>
                  </div>
                  <div>
                    <div className="ai-lbl">Shopee — Vấn đề & Root Cause</div>
                    <div className="ai-body" contentEditable suppressContentEditableWarning
                      data-ph="Vấn đề Shopee..."
                      onBlur={e => setAiResult(prev => ({ ...prev, shopee_van_de: e.currentTarget.textContent || '' }))}>
                      {aiResult.shopee_van_de}
                    </div>
                  </div>
                  <div>
                    <div className="ai-lbl">Shopee — Giải pháp & Plan tuần tới</div>
                    <div className="ai-body" contentEditable suppressContentEditableWarning
                      data-ph="Giải pháp Shopee..."
                      onBlur={e => setAiResult(prev => ({ ...prev, shopee_giai_phap: e.currentTarget.textContent || '' }))}>
                      {aiResult.shopee_giai_phap}
                    </div>
                  </div>
                </>
              )}

              {tiktokChecked && (
                <>
                  <div>
                    <div className="ai-lbl">TikTok — Thực trạng</div>
                    <div className="ai-body" contentEditable suppressContentEditableWarning
                      data-ph="Thực trạng TikTok..."
                      onBlur={e => setAiResult(prev => ({ ...prev, tiktok_thuc_trang: e.currentTarget.textContent || '' }))}>
                      {aiResult.tiktok_thuc_trang}
                    </div>
                  </div>
                  <div>
                    <div className="ai-lbl">TikTok — Vấn đề & Root Cause</div>
                    <div className="ai-body" contentEditable suppressContentEditableWarning
                      data-ph="Vấn đề TikTok..."
                      onBlur={e => setAiResult(prev => ({ ...prev, tiktok_van_de: e.currentTarget.textContent || '' }))}>
                      {aiResult.tiktok_van_de}
                    </div>
                  </div>
                  <div>
                    <div className="ai-lbl">TikTok — Giải pháp & Plan tuần tới</div>
                    <div className="ai-body" contentEditable suppressContentEditableWarning
                      data-ph="Giải pháp TikTok..."
                      onBlur={e => setAiResult(prev => ({ ...prev, tiktok_giai_phap: e.currentTarget.textContent || '' }))}>
                      {aiResult.tiktok_giai_phap}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="btn-row">
            <button className="btn-s" onClick={() => setStep(1)}>← Quay lại</button>
            <button className="btn-p" onClick={goStep3}>Xem Preview →</button>
          </div>
        </div>
      )}

      {/* ══════════════ STEP 3 ══════════════ */}
      {step === 3 && weekInfo && (
        <div>
          <div className="pv-wrap">
            <div className="pv-bar">
              <span className="pv-bar-lbl">Mail Preview</span>
              <div className="pv-acts">
                <button className={`btn-copy ${copied ? 'copied' : ''}`} onClick={copyMail}>
                  {copied ? '✓ Đã copy!' : 'Copy → Lark'}
                </button>
              </div>
            </div>
            <div className="pv-subj">
              <span className="pv-subj-lbl">Subject</span>
              <span className="pv-subj-val">{mailSubject}</span>
            </div>
            <div className="pv-body" dangerouslySetInnerHTML={{ __html: mailHTML }} />
            <div className="save-bar2">
              <span className="save-info">{user?.name} · {fmtDate(new Date())}</span>
              <button className="btn-p" onClick={saveReport} disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu báo cáo'}
              </button>
            </div>
          </div>

          <div className="btn-row" style={{ marginTop:16 }}>
            <button className="btn-s" onClick={() => setStep(2)}>← Quay lại</button>
          </div>
        </div>
      )}

      {/* ══════════════ PLAN MODAL ══════════════ */}
      <div className={`mo ${planModal ? 'open' : ''}`}>
        <div className="mo-box">
          <div className="mo-hdr">
            <h3>Set Plan — {selectedBrand} — Tháng {weekInfo?.month}/{weekInfo?.year}</h3>
            <button className="mo-close" onClick={() => setPlanModal(false)}>×</button>
          </div>
          <div className="mo-body">
            {/* Plan grid header */}
            <div className="pg" style={{ marginBottom:8 }}>
              <div className="pg-head" style={{ textAlign:'left' }}>Metric</div>
              {['W1','W2','W3','W4','MTD','Tháng'].map(h => (
                <div key={h} className="pg-head">{h}</div>
              ))}
            </div>
            {/* Shopee section */}
            {shopeeChecked && (
              <>
                <div className="pg-section" style={{ gridColumn:'1/-1', marginBottom:8 }}>Shopee</div>
                {activePlanKeys.filter(k => k.startsWith('s_')).map(mk => (
                  <div key={mk} className="pg" style={{ marginBottom:4 }}>
                    <div className="pg-lbl" style={{ fontSize:'.78rem' }}>{planMetricLabels[mk] || mk}</div>
                    {(['w1','w2','w3','w4','mtd','month'] as const).map(w => (
                      <input key={w} className="pg-inp" type="number" placeholder="0"
                        value={planInputs[`shopee_${mk}_${w}`] || ''}
                        onChange={e => setPlanInputs(prev => ({ ...prev, [`shopee_${mk}_${w}`]: e.target.value }))} />
                    ))}
                  </div>
                ))}
              </>
            )}
            {/* TikTok section */}
            {tiktokChecked && (
              <>
                <div className="pg-section" style={{ gridColumn:'1/-1', marginBottom:8, marginTop:16 }}>TikTok Shop</div>
                {activePlanKeys.filter(k => k.startsWith('t_')).map(mk => (
                  <div key={mk} className="pg" style={{ marginBottom:4 }}>
                    <div className="pg-lbl" style={{ fontSize:'.78rem' }}>{planMetricLabels[mk] || mk}</div>
                    {(['w1','w2','w3','w4','mtd','month'] as const).map(w => (
                      <input key={w} className="pg-inp" type="number" placeholder="0"
                        value={planInputs[`tiktok_${mk}_${w}`] || ''}
                        onChange={e => setPlanInputs(prev => ({ ...prev, [`tiktok_${mk}_${w}`]: e.target.value }))} />
                    ))}
                  </div>
                ))}
              </>
            )}
          </div>
          <div className="mo-foot">
            <button className="btn-s" onClick={() => setPlanModal(false)}>Hủy</button>
            <button className="btn-p" onClick={savePlan}>Lưu Plan →</button>
          </div>
        </div>
      </div>
    </div>
  )
}
