'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getSession, SessionUser } from '@/lib/auth'
import * as XLSX from 'xlsx'
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)

/* ── Default AI System Prompt ── */
const DEFAULT_SYS_PROMPT = `Bạn là Senior Performance Marketing Manager với 7 năm thực chiến trên Shopee Ads và TikTok Shop Ads tại thị trường Việt Nam. Bạn phân tích thuần technical ads — không đề cập creative, content, hay KOC.

Nhiệm vụ: Phân tích data báo cáo tuần và trả về JSON (không thêm bất kỳ text nào ngoài JSON):

{
  "highlight": "2–3 điểm sáng tuần này (tổng hợp cả 2 sàn nếu có). Mỗi bullet bắt đầu bằng •, nêu metric cụ thể và mức vượt plan hoặc cải thiện so tuần trước",
  "lowlight": "2–3 điểm cần xử lý (tổng hợp). Mỗi bullet bắt đầu bằng •, chỉ rõ mức lệch plan, xu hướng xấu hoặc rủi ro cụ thể",
  "shopee_thuc_trang": "2–3 câu đánh giá thực trạng Shopee tuần này. Bắt buộc có số liệu. Để trống nếu không có data",
  "shopee_van_de": "2–3 vấn đề cốt lõi Shopee. Mỗi bullet bắt đầu bằng •, chẩn đoán theo đúng cơ chế kỹ thuật từng loại Shopee Ads. Để trống nếu không có data",
  "shopee_giai_phap": "2–3 action kỹ thuật cụ thể cho Shopee tuần tới. Mỗi bullet bắt đầu bằng •. Để trống nếu không có data",
  "tiktok_thuc_trang": "2–3 câu đánh giá thực trạng TikTok tuần này. Bắt buộc có số liệu. Để trống nếu không có data",
  "tiktok_van_de": "2–3 vấn đề cốt lõi TikTok. Mỗi bullet bắt đầu bằng •, chẩn đoán theo đúng cơ chế thuật toán AI-driven từng loại TikTok Ads. Để trống nếu không có data",
  "tiktok_giai_phap": "2–3 action kỹ thuật cụ thể cho TikTok tuần tới. Mỗi bullet bắt đầu bằng •. Để trống nếu không có data"
}

Nguyên tắc: Tiếng Việt, mix English term đúng chỗ. Chỉ phân tích technical ads. Không đề cập creative, content, video, banner, KOC. Không thêm markdown ngoài JSON.`

/* ── Types ── */
type Brand = { id: string; brand_name: string }

type PlanData = Record<string, { w1: number; w2: number; w3: number; w4: number; w5: number; month: number }>

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
  if (unit === 'x') return n.toFixed(2)
  if (unit === '%') return n.toFixed(2) + '%'
  if (unit === '‰') return n.toFixed(0) + '‰'
  return n.toLocaleString('vi-VN')
}
/* Format integer with Vietnamese thousand separator (dot) */
function fmtVN(v: number | string): string {
  const raw = String(v ?? '').replace(/[^\d-]/g, '')
  if (!raw || raw === '-') return ''
  const num = parseInt(raw, 10)
  if (isNaN(num)) return ''
  return num.toLocaleString('vi-VN')
}
/* Parse VN-formatted input (handles dots, commas, math expressions safely) */
function parseVN(s: string): number {
  if (!s) return 0
  return parseFloat(String(s).replace(/[.,\s]/g, '').replace(/[^\d.-]/g, '')) || 0
}
/* Evaluate math expression like "100+200" → 300; returns NaN if invalid */
function evalExpr(s: string): number {
  const stripped = s.replace(/[.,\s]/g, '')
  if (!/[+\-*/]/.test(stripped)) return NaN
  if (!/^[\d+\-*/().]+$/.test(stripped)) return NaN
  try {
    const r = Function('"use strict";return(' + stripped + ')')()
    if (!isFinite(r) || isNaN(r)) return NaN
    return Math.round(Number(r))
  } catch { return NaN }
}
function pct(actual: number, plan: number | undefined): number | null {
  if (!plan) return null
  return parseFloat(((actual / plan) * 100).toFixed(1))
}
function pctClass(p: number | null): string {
  if (p === null) return ''
  if (p >= 100) return 'g'
  if (p >= 80) return 'y'
  return 'r'
}
function n(v: string | number | null | undefined): number {
  return parseFloat(String(v ?? 0)) || 0
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

/* Ordered list of all actual metric keys — used for paste fill direction */
const ACTUAL_KEYS_ORDER = [
  's_cpc_doanh_so','s_cpc_chi_phi','s_cpc_luot_xem','s_cpc_luot_click','s_cpc_don_hang',
  's_nd_gmv','s_nd_chi_phi','s_nd_luot_xem','s_nd_luot_click',
  's_live_gmv','s_live_chi_phi','s_live_luot_xem',
  't_pgm_doanh_so','t_pgm_chi_phi','t_pgm_luot_xem','t_pgm_luot_click','t_pgm_don_hang',
  't_lgm_doanhthu','t_lgm_chi_phi',
  't_con_nguoi','t_con_chi_phi',
  't_brd_view','t_brd_follow','t_brd_chi_phi',
]
const PLAN_PERIODS_ORDER = ['month','w1','w2','w3','w4','w5'] as const

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
  /* rawInputs: per-key formatted display string for actual inputs (e.g. "100.000.000") */
  const [rawInputs, setRawInputs] = useState<Record<string, string>>({})
  /* planRawInputs: per-key formatted display string for plan modal cells */
  const [planRawInputs, setPlanRawInputs] = useState<Record<string, string>>({})

  // Step 3 state
  const [mailSubject, setMailSubject] = useState('')
  const [mailHTML, setMailHTML] = useState('')
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)

  // Plan modal
  const [planModal, setPlanModal] = useState(false)
  const [planInputs, setPlanInputs] = useState<Record<string, string>>({})

  // Key / Prompt modals
  const [keyModal, setKeyModal] = useState(false)
  const [promptModal, setPromptModal] = useState(false)
  const [keyInput, setKeyInput] = useState('')
  const [promptInput, setPromptInput] = useState('')

  // Add brand
  const [addBrandInput, setAddBrandInput] = useState('')
  const brandRef = useRef<HTMLDivElement>(null)

  // Chart
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstRef = useRef<Chart | null>(null)

  // History for chart
  const [weekHistory, setWeekHistory] = useState<Record<string, number|string|null>[]>([])

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
      const [sp, tp, hist] = await Promise.all([
        shopeeChecked
          ? fetch(`/api/report?action=plan&brand=${encodeURIComponent(selectedBrand)}&platform=shopee&month=${weekInfo.month}&year=${weekInfo.year}`).then(r=>r.json())
          : Promise.resolve({ data: null }),
        tiktokChecked
          ? fetch(`/api/report?action=plan&brand=${encodeURIComponent(selectedBrand)}&platform=tiktok&month=${weekInfo.month}&year=${weekInfo.year}`).then(r=>r.json())
          : Promise.resolve({ data: null }),
        fetch(`/api/report?action=history&brand=${encodeURIComponent(selectedBrand)}&month=${weekInfo.month}&year=${weekInfo.year}`).then(r=>r.json()),
      ])
      setShopeePlan(sp.data || null)
      setTiktokPlan(tp.data || null)
      const histRows: Record<string, number|string|null>[] = hist.data || []
      setWeekHistory(histRows)
      const hp = (shopeeChecked ? !!sp.data : true) && (tiktokChecked ? !!tp.data : true)
      setHasPlan(hp)

      /* Auto-load existing data for current week (if any) */
      const existing = histRows.find(r => parseInt(String(r.week_num)) === weekInfo.weekNum)
      const newShopee: ShopeeData = { ...EMPTY_SHOPEE }
      const newTiktok: TiktokData = { ...EMPTY_TIKTOK }
      const newRaw: Record<string,string> = {}
      if (existing) {
        ;(Object.keys(EMPTY_SHOPEE) as (keyof ShopeeData)[]).forEach(k => {
          const v = parseFloat(String(existing[k] ?? 0)) || 0
          newShopee[k] = v
          newRaw[k as string] = v ? v.toLocaleString('vi-VN') : ''
        })
        ;(Object.keys(EMPTY_TIKTOK) as (keyof TiktokData)[]).forEach(k => {
          const v = parseFloat(String(existing[k] ?? 0)) || 0
          newTiktok[k] = v
          newRaw[k as string] = v ? v.toLocaleString('vi-VN') : ''
        })
      }
      setShopeeData(newShopee)
      setTiktokData(newTiktok)
      setRawInputs(newRaw)

      // Pre-fill AI text from existing row (legacy stored shopee+tiktok joined w/ \n)
      if (existing) {
        const splitNote = (s: string) => {
          const parts = String(s || '').split('\n')
          return { shopee: parts[0] || '', tiktok: parts.slice(1).join('\n') || '' }
        }
        const tt = splitNote(String(existing.nhan_xet_thuc_trang || ''))
        const vd = splitNote(String(existing.nhan_xet_van_de || ''))
        const gp = splitNote(String(existing.nhan_xet_giai_phap || ''))
        setAiResult({
          highlight:        String(existing.highlight || ''),
          lowlight:         String(existing.lowlight  || ''),
          shopee_thuc_trang: tt.shopee, tiktok_thuc_trang: tt.tiktok,
          shopee_van_de:     vd.shopee, tiktok_van_de:     vd.tiktok,
          shopee_giai_phap:  gp.shopee, tiktok_giai_phap:  gp.tiktok,
        })
      } else {
        setAiResult({ highlight:'',lowlight:'',shopee_thuc_trang:'',shopee_van_de:'',shopee_giai_phap:'',tiktok_thuc_trang:'',tiktok_van_de:'',tiktok_giai_phap:'' })
      }
      setStep(2)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      showToast('Lỗi tải dữ liệu', 'error')
    }
  }

  /* ── Generate AI (client-side, OpenAI key from localStorage) ── */
  async function generateAI() {
    if (!weekInfo) return
    const openAiKey = typeof window !== 'undefined' ? (localStorage.getItem('mo_openai_key') || '') : ''
    if (!openAiKey) {
      showToast('Cần nhập OpenAI API Key — bấm 🔑 API Key trên nav', 'error')
      setKeyModal(true)
      return
    }
    setAiLoading(true)
    const wKey = `plan_w${weekInfo.weekNum}`
    const pv = (plan: PlanData | null, key: string) => plan?.[key]?.[`w${weekInfo.weekNum}` as 'w1'] || 0
    const fmtBig = (v: number) => v ? v.toLocaleString('vi-VN') : '0'

    const c = calcCPC(shopeeData), cn = calcND(shopeeData), cl = calcLive(shopeeData)
    const cp = calcPGM(tiktokData), cl2 = calcLGM(tiktokData), cc = calcCon(tiktokData), cb = calcBrd(tiktokData)
    const sGmv = shopeeData.s_cpc_doanh_so + shopeeData.s_nd_gmv + shopeeData.s_live_gmv
    const sCp  = shopeeData.s_cpc_chi_phi + shopeeData.s_nd_chi_phi + shopeeData.s_live_chi_phi
    const tGmv = tiktokData.t_pgm_doanh_so + tiktokData.t_lgm_doanhthu
    const tCp  = tiktokData.t_pgm_chi_phi + tiktokData.t_lgm_chi_phi + tiktokData.t_con_chi_phi + tiktokData.t_brd_chi_phi
    const sPlanGmv = shopeePlan ? pv(shopeePlan,'s_cpc_doanh_so')+pv(shopeePlan,'s_nd_gmv')+pv(shopeePlan,'s_live_gmv') : 0
    const tPlanGmv = tiktokPlan ? pv(tiktokPlan,'t_pgm_doanh_so')+pv(tiktokPlan,'t_lgm_doanhthu') : 0

    let userMsg = `=== DATA BÁO CÁO TUẦN ===\nBrand: ${selectedBrand} | ${weekInfo.label} | Platform: ${[shopeeChecked?'Shopee':'',tiktokChecked?'TikTok':''].filter(Boolean).join(', ')}\n\n`

    if (shopeeChecked) {
      const planCpcDs=pv(shopeePlan,'s_cpc_doanh_so'), planCpcCp=pv(shopeePlan,'s_cpc_chi_phi')
      const planNdGmv=pv(shopeePlan,'s_nd_gmv'), planLvGmv=pv(shopeePlan,'s_live_gmv')
      userMsg += `--- SHOPEE ADS ---\n`
      userMsg += `Tổng GMV: ${fmtBig(sGmv)} | Plan: ${fmtBig(sPlanGmv)} | %TH: ${getPctStr(sGmv,sPlanGmv)}\n`
      userMsg += `Tổng Chi phí: ${fmtBig(sCp)} | ROAS: ${sCp?(sGmv/sCp).toFixed(2):'—'}\n\n`
      userMsg += `[CPC] Doanh số: ${fmtBig(shopeeData.s_cpc_doanh_so)} (Plan: ${fmtBig(planCpcDs)}, %TH: ${getPctStr(shopeeData.s_cpc_doanh_so,planCpcDs)})\n`
      userMsg += `[CPC] Chi phí: ${fmtBig(shopeeData.s_cpc_chi_phi)} | ROAS: ${c.roas} | CPC: ${c.cpc} | CTR: ${c.ctr}% | CR: ${c.cr}% | AOV: ${c.aov}\n`
      userMsg += `[CPC] Lượt xem: ${shopeeData.s_cpc_luot_xem.toLocaleString('vi-VN')} | Lượt click: ${shopeeData.s_cpc_luot_click.toLocaleString('vi-VN')} | Đơn hàng: ${shopeeData.s_cpc_don_hang}\n\n`
      userMsg += `[ND] GMV: ${fmtBig(shopeeData.s_nd_gmv)} (Plan: ${fmtBig(planNdGmv)}) | Chi phí: ${fmtBig(shopeeData.s_nd_chi_phi)} | ROAS: ${cn.roas} | CTR: ${cn.ctr}%\n\n`
      userMsg += `[Live] GMV: ${fmtBig(shopeeData.s_live_gmv)} (Plan: ${fmtBig(planLvGmv)}) | Chi phí: ${fmtBig(shopeeData.s_live_chi_phi)} | ROAS: ${cl.roas}\n\n`
    }
    if (tiktokChecked) {
      const planPgmDs=pv(tiktokPlan,'t_pgm_doanh_so'), planLgmDt=pv(tiktokPlan,'t_lgm_doanhthu')
      userMsg += `--- TIKTOK SHOP ---\n`
      userMsg += `Tổng GMV: ${fmtBig(tGmv)} | Plan: ${fmtBig(tPlanGmv)} | %TH: ${getPctStr(tGmv,tPlanGmv)}\n`
      userMsg += `Tổng Chi phí: ${fmtBig(tCp)} | ROI: ${tCp?(tGmv/tCp).toFixed(2):'—'}\n\n`
      userMsg += `[PGM] Doanh số: ${fmtBig(tiktokData.t_pgm_doanh_so)} (Plan: ${fmtBig(planPgmDs)}) | Chi phí: ${fmtBig(tiktokData.t_pgm_chi_phi)} | ROAS: ${cp.roas}\n`
      userMsg += `[PGM] CTR: ${cp.ctr}% | CR: ${cp.cr}% | AOV: ${cp.aov} | CPC: ${cp.cpc} | CPM: ${cp.cpm}\n\n`
      userMsg += `[LGM] Doanh thu: ${fmtBig(tiktokData.t_lgm_doanhthu)} (Plan: ${fmtBig(planLgmDt)}) | Chi phí: ${fmtBig(tiktokData.t_lgm_chi_phi)} | ROI: ${cl2.roi}\n\n`
      userMsg += `[Con] Người tiếp cận: ${tiktokData.t_con_nguoi.toLocaleString('vi-VN')} | Chi phí: ${fmtBig(tiktokData.t_con_chi_phi)} | CPP: ${cc.cpa}\n`
      userMsg += `[Branding] Lượt xem: ${tiktokData.t_brd_view.toLocaleString('vi-VN')} | Follow: ${tiktokData.t_brd_follow} | Chi phí: ${fmtBig(tiktokData.t_brd_chi_phi)} | CPA/follow: ${cb.cpa}\n\n`
    }
    // WoW comparison
    const prevW = weekHistory.filter(h => parseInt(String(h.week_num)) < weekInfo.weekNum).sort((a,b) => parseInt(String(b.week_num)) - parseInt(String(a.week_num)))[0]
    if (prevW) {
      userMsg += `--- SO SÁNH TUẦN TRƯỚC (W${prevW.week_num}) ---\n`
      if (shopeeChecked) {
        const prevSGmv = (n(prevW.s_cpc_doanh_so)||0)+(n(prevW.s_nd_gmv)||0)+(n(prevW.s_live_gmv)||0)
        userMsg += `Shopee GMV: ${fmtBig(sGmv)} vs ${fmtBig(prevSGmv)} → ${getPctStr(sGmv,prevSGmv)} WoW\n`
      }
      if (tiktokChecked) {
        const prevTGmv = (n(prevW.t_pgm_doanh_so)||0)+(n(prevW.t_lgm_doanhthu)||0)
        userMsg += `TikTok GMV: ${fmtBig(tGmv)} vs ${fmtBig(prevTGmv)} → ${getPctStr(tGmv,prevTGmv)} WoW\n`
      }
    }
    void wKey // suppress unused var warning

    const sysPrompt = (typeof window !== 'undefined' ? localStorage.getItem('mo_ai_prompt') : null) || DEFAULT_SYS_PROMPT

    try {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openAiKey}` },
        body: JSON.stringify({
          model: 'gpt-4.1',
          response_format: { type: 'json_object' },
          max_tokens: 4096,
          messages: [
            { role: 'system', content: sysPrompt },
            { role: 'user', content: userMsg }
          ]
        })
      })
      if (!resp.ok) {
        const err = await resp.json()
        throw new Error(err.error?.message || `OpenAI ${resp.status}`)
      }
      const j = await resp.json()
      const ai = JSON.parse(j.choices[0].message.content)
      setAiResult({
        highlight:          ai.highlight          || '',
        lowlight:           ai.lowlight           || '',
        shopee_thuc_trang:  ai.shopee_thuc_trang  || '',
        shopee_van_de:      ai.shopee_van_de       || '',
        shopee_giai_phap:   ai.shopee_giai_phap    || '',
        tiktok_thuc_trang:  ai.tiktok_thuc_trang  || '',
        tiktok_van_de:      ai.tiktok_van_de       || '',
        tiktok_giai_phap:   ai.tiktok_giai_phap    || '',
      })
      showToast('✅ AI generate xong!')
    } catch(e) {
      showToast('❌ Lỗi AI: ' + String(e), 'error')
    } finally {
      setAiLoading(false)
    }
  }

  function getPctStr(actual: number, plan: number): string {
    if (!plan) return '—'
    return ((actual / plan) * 100).toFixed(1) + '%'
  }

  /* ── Step 2 → Step 3 ── */
  function goStep3() {
    if (!weekInfo) return
    const subject = `MEDIA x ${selectedBrand} | Báo cáo tuần & Kế hoạch hành động | ${weekInfo.label}`
    setMailSubject(subject)
    setMailHTML(buildMailHTML())
    setStep(3)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function buildMailHTML(): string {
    if (!weekInfo) return ''

    const totalWeeks = getWeeksInMonth(weekInfo.month, weekInfo.year)
    const weeksList = Array.from({ length: totalWeeks }, (_, i) => i + 1)
    const plan = (k: string): Record<string, number> | undefined => (shopeePlan?.[k] || tiktokPlan?.[k]) as Record<string,number> | undefined
    const pW = (f: string, w: number): number => Number(plan(f)?.[`w${w}`]) || 0
    const pM = (f: string): number => Number(plan(f)?.month) || 0

    /* hRow returns actual value for week w from history (or current input if w === current week) */
    const curData: Record<string, number> = { ...shopeeData, ...tiktokData }
    const hRow = (f: string, w: number): number | null => {
      if (w === weekInfo.weekNum) return Number(curData[f] || 0)
      const r = weekHistory.find(h => parseInt(String(h.week_num)) === w)
      if (!r) return null
      const v = parseFloat(String(r[f] || 0))
      return isNaN(v) ? 0 : v
    }
    const getMTD = (getter: (w: number) => number | null): number =>
      weeksList.filter(w => w <= weekInfo.weekNum).reduce((a, w) => { const v = getter(w); return a + (v !== null ? v : 0) }, 0)
    const ratioW = (nF: string, dF: string, w: number): number | null => {
      const n = hRow(nF, w), d = hRow(dF, w); if (d === null || !d) return null; return n! / d
    }
    const ratioPW = (nF: string, dF: string, w: number): number | null => {
      const d = pW(dF, w); return d ? pW(nF, w) / d : null
    }
    const ratioPM = (nF: string, dF: string): number | null => {
      const d = pM(dF); return d ? pM(nF) / d : null
    }
    const ratioMTD = (nF: string, dF: string): number | null => {
      const n = getMTD(w => hRow(nF, w) || 0)
      const d = getMTD(w => hRow(dF, w) || 0)
      return d ? n / d : null
    }

    const fmtMail = (v: number | null | undefined): string => {
      if (v === null || v === undefined || isNaN(v)) return '—'
      return Math.round(parseFloat(String(v))).toLocaleString('vi-VN')
    }
    const fmtX = (v: number | null | undefined): string =>
      v !== null && v !== undefined && !isNaN(v) ? parseFloat(String(v)).toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'
    const fmtPct = (v: number | null | undefined): string =>
      v !== null && v !== undefined && !isNaN(v) ? parseFloat(String(v)).toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%' : '—'
    const fmtN = (v: number | null | undefined): string => fmtMail(v)
    const fmtMoney = (v: number | null | undefined): string => fmtMail(v)
    const fmtCPC = (v: number | null | undefined): string => fmtMail(v)
    const getPctS = (act: number | null, planV: number | null): string | null => {
      if (act === null || act === undefined) return null
      const a = parseFloat(String(act)), p = parseFloat(String(planV))
      if (!p || isNaN(a) || isNaN(p)) return null
      return ((a / p) * 100).toFixed(1)
    }

    const ts = `padding:3px 5px;border:1px solid #ccc;text-align:right;font-family:'Times New Roman',serif;font-size:11px;white-space:nowrap`
    const tsL = `padding:3px 5px;border:1px solid #ccc;text-align:left;font-family:'Times New Roman',serif;font-size:11px;white-space:nowrap;min-width:100px`
    const thS = `padding:4px 5px;border:1px solid #999;background:#1a2e5c;color:#fff;font-family:'Times New Roman',serif;font-size:11px;text-align:center;white-space:nowrap`
    const tblStyle = `border-collapse:collapse;width:100%;font-family:'Times New Roman',serif;font-size:11px;margin:4px 0 14px`

    const hdr = `<tr><th style="${thS};text-align:center;min-width:130px">Metric</th><th style="${thS}">Tháng (Plan)</th><th style="${thS}">Luỹ tiến</th><th style="${thS}">% thực hiện</th>${weeksList.map(w => `<th style="${thS}">W${w}</th><th style="${thS}">Thực hiện</th><th style="${thS}">% thực hiện</th>`).join('')}</tr>`

    type Fmt = (v: number | null | undefined) => string
    const wRow = (label: string, planMth: number | null, mtdAct: number | null,
                  getAct: (w: number) => number | null, getPlan: (w: number) => number | null,
                  fmtFn: Fmt = fmtMail): string => {
      const pctMtd = getPctS(mtdAct, planMth)
      const wCells = weeksList.map(w => {
        const pw = getPlan(w), act = getAct(w)
        const p = getPctS(act, pw)
        return `<td style="${ts}">${pw !== null && pw !== undefined && pw !== 0 ? fmtFn(pw) : '—'}</td><td style="${ts}">${act !== null ? fmtFn(act) : '—'}</td><td style="${ts}">${p ? p + '%' : '—'}</td>`
      }).join('')
      return `<tr><td style="${tsL}">${label}</td><td style="${ts}">${planMth ? fmtFn(planMth) : '—'}</td><td style="${ts}">${mtdAct !== null && !isNaN(mtdAct) ? fmtFn(mtdAct) : '—'}</td><td style="${ts}">${pctMtd ? pctMtd + '%' : '—'}</td>${wCells}</tr>`
    }
    const dRow = (label: string, planMth: number | null, mtdAct: number | null,
                  getAct: (w: number) => number | null, getPlan: (w: number) => number | null,
                  fmtFn: Fmt = fmtX): string => {
      const pctMtd = getPctS(mtdAct, planMth)
      const wCells = weeksList.map(w => {
        const pw = getPlan(w), act = getAct(w)
        const p = getPctS(act, pw)
        return `<td style="${ts}">${pw !== null ? fmtFn(pw) : '—'}</td><td style="${ts}">${act !== null ? fmtFn(act) : '—'}</td><td style="${ts}">${p ? p + '%' : '—'}</td>`
      }).join('')
      return `<tr style="background:#fafafa"><td style="${tsL};color:#555;font-style:italic">${label}</td><td style="${ts}">${planMth !== null ? fmtFn(planMth) : '—'}</td><td style="${ts}">${mtdAct !== null ? fmtFn(mtdAct) : '—'}</td><td style="${ts}">${pctMtd ? pctMtd + '%' : '—'}</td>${wCells}</tr>`
    }

    const hasSectionData = (keys: string[]): boolean => {
      if (keys.some(k => { const p = plan(k); return p && Object.values(p).some(v => parseFloat(String(v)) > 0) })) return true
      if (keys.some(k => parseFloat(String(curData[k] || 0)) > 0)) return true
      if (weekHistory.length && keys.some(k => weekHistory.some(h => parseFloat(String(h[k] || 0)) > 0))) return true
      return false
    }

    /* GMV/Cost helpers per platform */
    const sPlanGmvM = pM('s_cpc_doanh_so') + pM('s_nd_gmv') + pM('s_live_gmv')
    const tPlanGmvM = pM('t_pgm_doanh_so') + pM('t_lgm_doanhthu')
    const totPlanGmvM = sPlanGmvM + tPlanGmvM

    const getHistGmv = (w: number): number | null => {
      const r = weekHistory.find(h => parseInt(String(h.week_num)) === w)
      if (w === weekInfo.weekNum) {
        let g = 0
        if (shopeeChecked) g += shopeeData.s_cpc_doanh_so + shopeeData.s_nd_gmv + shopeeData.s_live_gmv
        if (tiktokChecked) g += tiktokData.t_pgm_doanh_so + tiktokData.t_lgm_doanhthu
        return g
      }
      if (!r) return null
      let g = 0
      if (shopeeChecked) g += parseFloat(String(r.s_cpc_doanh_so || 0)) + parseFloat(String(r.s_nd_gmv || 0)) + parseFloat(String(r.s_live_gmv || 0))
      if (tiktokChecked) g += parseFloat(String(r.t_pgm_doanh_so || 0)) + parseFloat(String(r.t_lgm_doanhthu || 0))
      return g
    }
    const getHistCp = (w: number): number | null => {
      const r = weekHistory.find(h => parseInt(String(h.week_num)) === w)
      if (w === weekInfo.weekNum) {
        let c = 0
        if (shopeeChecked) c += shopeeData.s_cpc_chi_phi + shopeeData.s_nd_chi_phi + shopeeData.s_live_chi_phi
        if (tiktokChecked) c += tiktokData.t_pgm_chi_phi + tiktokData.t_lgm_chi_phi + tiktokData.t_con_chi_phi + tiktokData.t_brd_chi_phi
        return c
      }
      if (!r) return null
      let c = 0
      if (shopeeChecked) c += parseFloat(String(r.s_cpc_chi_phi || 0)) + parseFloat(String(r.s_nd_chi_phi || 0)) + parseFloat(String(r.s_live_chi_phi || 0))
      if (tiktokChecked) c += parseFloat(String(r.t_pgm_chi_phi || 0)) + parseFloat(String(r.t_lgm_chi_phi || 0)) + parseFloat(String(r.t_con_chi_phi || 0)) + parseFloat(String(r.t_brd_chi_phi || 0))
      return c
    }
    const getPlanGmvW = (w: number): number => {
      let g = 0
      if (shopeeChecked) g += pW('s_cpc_doanh_so', w) + pW('s_nd_gmv', w) + pW('s_live_gmv', w)
      if (tiktokChecked) g += pW('t_pgm_doanh_so', w) + pW('t_lgm_doanhthu', w)
      return g
    }
    const mtdTotGmv = getMTD(w => getHistGmv(w))

    let body = `<div style="font-family:'Times New Roman',Times,serif;font-size:13px;color:#000;line-height:1.6">`
    body += `<p style="margin:0 0 4px">Dear: <strong>Growth Phụ trách dự án</strong><br>và Leader Team Media Omni, PIC Marketing B2C</p>`
    body += `<p style="margin:0 0 6px">Tôi xin phép gửi Report của <strong>${weekInfo.label}</strong> dự án <strong>${selectedBrand}</strong></p>`
    body += `<hr style="border:1px solid #ccc;margin:8px 0">`
    body += `<p style="margin:0 0 4px"><strong style="font-size:13px">BÁO CÁO HIỆU SUẤT — ${selectedBrand.toUpperCase()}</strong><br>${weekInfo.label} | ${weekInfo.start} – ${weekInfo.end}${!weekInfo.isFull ? ` (${weekInfo.days} ngày)` : ''}</p>`
    body += `<hr style="border:1px solid #ccc;margin:8px 0">`

    /* ── TỔNG 2 SÀN ── */
    if (shopeeChecked && tiktokChecked) {
      body += `<p style="margin:6px 0 2px"><strong>━━━ TỔNG 2 SÀN ━━━</strong></p>`
      body += `<table style="${tblStyle}"><thead>${hdr}</thead><tbody>`
      const totPlanCpM = pM('s_cpc_chi_phi') + pM('s_nd_chi_phi') + pM('s_live_chi_phi') + pM('t_pgm_chi_phi') + pM('t_lgm_chi_phi') + pM('t_con_chi_phi') + pM('t_brd_chi_phi')
      const cpKeys = ['s_cpc_chi_phi','s_nd_chi_phi','s_live_chi_phi','t_pgm_chi_phi','t_lgm_chi_phi','t_con_chi_phi','t_brd_chi_phi']
      const mtdTotCp = getMTD(w => getHistCp(w))
      body += wRow('GMV Ads tổng', totPlanGmvM || null, mtdTotGmv, w => getHistGmv(w), w => getPlanGmvW(w) || null)
      body += wRow('Chi phí tổng', totPlanCpM || null, mtdTotCp, w => getHistCp(w), w => cpKeys.reduce((a, k) => a + pW(k, w), 0) || null)
      body += dRow('ROAS tổng', totPlanCpM ? totPlanGmvM / totPlanCpM : null, (mtdTotCp ? mtdTotGmv / mtdTotCp : null),
        w => { const g = getHistGmv(w), c = getHistCp(w); return g !== null && c ? g / c : null },
        w => { const g = getPlanGmvW(w); const c = cpKeys.reduce((a, k) => a + pW(k, w), 0); return c ? g / c : null }, fmtX)
      body += `</tbody></table>`
    }

    /* ── SHOPEE ADS ── */
    if (shopeeChecked) {
      body += `<p style="margin:10px 0 2px"><strong>━━━ SHOPEE ADS ━━━</strong></p>`
      body += `<table style="${tblStyle}"><thead>${hdr}</thead><tbody>`
      body += wRow('Doanh thu Ads (GMV)', sPlanGmvM || null,
        getMTD(w => (hRow('s_cpc_doanh_so', w) || 0) + (hRow('s_nd_gmv', w) || 0) + (hRow('s_live_gmv', w) || 0)),
        w => (hRow('s_cpc_doanh_so', w) || 0) + (hRow('s_nd_gmv', w) || 0) + (hRow('s_live_gmv', w) || 0),
        w => (pW('s_cpc_doanh_so', w) + pW('s_nd_gmv', w) + pW('s_live_gmv', w)) || null)
      body += wRow('Chi phí Ads tổng', (pM('s_cpc_chi_phi') + pM('s_nd_chi_phi') + pM('s_live_chi_phi')) || null,
        getMTD(w => (hRow('s_cpc_chi_phi', w) || 0) + (hRow('s_nd_chi_phi', w) || 0) + (hRow('s_live_chi_phi', w) || 0)),
        w => (hRow('s_cpc_chi_phi', w) || 0) + (hRow('s_nd_chi_phi', w) || 0) + (hRow('s_live_chi_phi', w) || 0),
        w => (pW('s_cpc_chi_phi', w) + pW('s_nd_chi_phi', w) + pW('s_live_chi_phi', w)) || null)
      body += dRow('ROAS Ads tổng', ratioPM('s_cpc_doanh_so','s_cpc_chi_phi'), ratioMTD('s_cpc_doanh_so','s_cpc_chi_phi'),
        w => ratioW('s_cpc_doanh_so','s_cpc_chi_phi',w), w => ratioPW('s_cpc_doanh_so','s_cpc_chi_phi',w), fmtX)
      body += `</tbody></table>`

      // Ads CPC
      body += `<p style="font-size:13px;font-weight:700;color:#1a2e5c;margin:6px 0 2px">Ads CPC</p>`
      body += `<table style="${tblStyle}"><thead>${hdr}</thead><tbody>`
      body += wRow('Doanh số Ads', pM('s_cpc_doanh_so') || null, getMTD(w => hRow('s_cpc_doanh_so', w) || 0), w => hRow('s_cpc_doanh_so', w), w => pW('s_cpc_doanh_so', w) || null)
      body += wRow('Chi Phí Dịch vụ hiển thị', pM('s_cpc_chi_phi') || null, getMTD(w => hRow('s_cpc_chi_phi', w) || 0), w => hRow('s_cpc_chi_phi', w), w => pW('s_cpc_chi_phi', w) || null)
      body += dRow('ROAS', ratioPM('s_cpc_doanh_so','s_cpc_chi_phi'), ratioMTD('s_cpc_doanh_so','s_cpc_chi_phi'), w => ratioW('s_cpc_doanh_so','s_cpc_chi_phi',w), w => ratioPW('s_cpc_doanh_so','s_cpc_chi_phi',w), fmtX)
      body += dRow('CPC = Chi phí / Lượt click', ratioPM('s_cpc_chi_phi','s_cpc_luot_click'), ratioMTD('s_cpc_chi_phi','s_cpc_luot_click'), w => ratioW('s_cpc_chi_phi','s_cpc_luot_click',w), w => ratioPW('s_cpc_chi_phi','s_cpc_luot_click',w), fmtCPC)
      body += dRow('CTR (%)', ratioPM('s_cpc_luot_click','s_cpc_luot_xem') !== null ? (ratioPM('s_cpc_luot_click','s_cpc_luot_xem') as number) * 100 : null, ratioMTD('s_cpc_luot_click','s_cpc_luot_xem') !== null ? (ratioMTD('s_cpc_luot_click','s_cpc_luot_xem') as number) * 100 : null, w => { const v = ratioW('s_cpc_luot_click','s_cpc_luot_xem',w); return v !== null ? v * 100 : null }, w => { const v = ratioPW('s_cpc_luot_click','s_cpc_luot_xem',w); return v !== null ? v * 100 : null }, fmtPct)
      body += dRow('CR = Đơn hàng / Lượt click*100 (%)', ratioPM('s_cpc_don_hang','s_cpc_luot_click') !== null ? (ratioPM('s_cpc_don_hang','s_cpc_luot_click') as number) * 100 : null, ratioMTD('s_cpc_don_hang','s_cpc_luot_click') !== null ? (ratioMTD('s_cpc_don_hang','s_cpc_luot_click') as number) * 100 : null, w => { const v = ratioW('s_cpc_don_hang','s_cpc_luot_click',w); return v !== null ? v * 100 : null }, w => { const v = ratioPW('s_cpc_don_hang','s_cpc_luot_click',w); return v !== null ? v * 100 : null }, fmtPct)
      body += wRow('Số lượt xem', pM('s_cpc_luot_xem') || null, getMTD(w => hRow('s_cpc_luot_xem', w) || 0), w => hRow('s_cpc_luot_xem', w), w => pW('s_cpc_luot_xem', w) || null, fmtN)
      body += wRow('Số lượt click', pM('s_cpc_luot_click') || null, getMTD(w => hRow('s_cpc_luot_click', w) || 0), w => hRow('s_cpc_luot_click', w), w => pW('s_cpc_luot_click', w) || null, fmtN)
      body += wRow('Số đơn hàng', pM('s_cpc_don_hang') || null, getMTD(w => hRow('s_cpc_don_hang', w) || 0), w => hRow('s_cpc_don_hang', w), w => pW('s_cpc_don_hang', w) || null, fmtN)
      body += dRow('AOV = Doanh thu / Số đơn hàng', ratioPM('s_cpc_doanh_so','s_cpc_don_hang'), ratioMTD('s_cpc_doanh_so','s_cpc_don_hang'), w => ratioW('s_cpc_doanh_so','s_cpc_don_hang',w), w => ratioPW('s_cpc_doanh_so','s_cpc_don_hang',w), fmtMoney)
      body += `</tbody></table>`

      if (hasSectionData(['s_nd_gmv','s_nd_chi_phi','s_nd_luot_xem','s_nd_luot_click'])) {
        body += `<p style="font-size:13px;font-weight:700;color:#1a2e5c;margin:6px 0 2px">Ads nhận diện thương hiệu</p>`
        body += `<table style="${tblStyle}"><thead>${hdr}</thead><tbody>`
        body += wRow('Doanh thu Ads (GMV)', pM('s_nd_gmv') || null, getMTD(w => hRow('s_nd_gmv', w) || 0), w => hRow('s_nd_gmv', w), w => pW('s_nd_gmv', w) || null)
        body += wRow('Chi phí ads', pM('s_nd_chi_phi') || null, getMTD(w => hRow('s_nd_chi_phi', w) || 0), w => hRow('s_nd_chi_phi', w), w => pW('s_nd_chi_phi', w) || null)
        body += dRow('ROAS ads', ratioPM('s_nd_gmv','s_nd_chi_phi'), ratioMTD('s_nd_gmv','s_nd_chi_phi'), w => ratioW('s_nd_gmv','s_nd_chi_phi',w), w => ratioPW('s_nd_gmv','s_nd_chi_phi',w), fmtX)
        body += dRow('CTR (%)', ratioPM('s_nd_luot_click','s_nd_luot_xem') !== null ? (ratioPM('s_nd_luot_click','s_nd_luot_xem') as number) * 100 : null, ratioMTD('s_nd_luot_click','s_nd_luot_xem') !== null ? (ratioMTD('s_nd_luot_click','s_nd_luot_xem') as number) * 100 : null, w => { const v = ratioW('s_nd_luot_click','s_nd_luot_xem',w); return v !== null ? v * 100 : null }, w => { const v = ratioPW('s_nd_luot_click','s_nd_luot_xem',w); return v !== null ? v * 100 : null }, fmtPct)
        body += wRow('Số lượt xem', pM('s_nd_luot_xem') || null, getMTD(w => hRow('s_nd_luot_xem', w) || 0), w => hRow('s_nd_luot_xem', w), w => pW('s_nd_luot_xem', w) || null, fmtN)
        body += wRow('Số lượt click', pM('s_nd_luot_click') || null, getMTD(w => hRow('s_nd_luot_click', w) || 0), w => hRow('s_nd_luot_click', w), w => pW('s_nd_luot_click', w) || null, fmtN)
        body += `</tbody></table>`
      }
      if (hasSectionData(['s_live_gmv','s_live_chi_phi','s_live_luot_xem'])) {
        body += `<p style="font-size:13px;font-weight:700;color:#1a2e5c;margin:6px 0 2px">Ads livestream</p>`
        body += `<table style="${tblStyle}"><thead>${hdr}</thead><tbody>`
        body += wRow('Doanh thu Ads (GMV)', pM('s_live_gmv') || null, getMTD(w => hRow('s_live_gmv', w) || 0), w => hRow('s_live_gmv', w), w => pW('s_live_gmv', w) || null)
        body += wRow('Chi phí ads', pM('s_live_chi_phi') || null, getMTD(w => hRow('s_live_chi_phi', w) || 0), w => hRow('s_live_chi_phi', w), w => pW('s_live_chi_phi', w) || null)
        body += dRow('ROAS ads', ratioPM('s_live_gmv','s_live_chi_phi'), ratioMTD('s_live_gmv','s_live_chi_phi'), w => ratioW('s_live_gmv','s_live_chi_phi',w), w => ratioPW('s_live_gmv','s_live_chi_phi',w), fmtX)
        body += wRow('Lượt xem', pM('s_live_luot_xem') || null, getMTD(w => hRow('s_live_luot_xem', w) || 0), w => hRow('s_live_luot_xem', w), w => pW('s_live_luot_xem', w) || null, fmtN)
        body += `</tbody></table>`
      }
    }

    /* ── TIKTOK SHOP ── */
    if (tiktokChecked) {
      body += `<p style="margin:10px 0 2px"><strong>━━━ TIKTOK SHOP ━━━</strong></p>`
      body += `<table style="${tblStyle}"><thead>${hdr}</thead><tbody>`
      const tCpKeys = ['t_pgm_chi_phi','t_lgm_chi_phi','t_con_chi_phi','t_brd_chi_phi']
      const tPlanCpM = tCpKeys.reduce((a, k) => a + pM(k), 0)
      body += wRow('Doanh thu Ads (GMV)', tPlanGmvM || null,
        getMTD(w => (hRow('t_pgm_doanh_so', w) || 0) + (hRow('t_lgm_doanhthu', w) || 0)),
        w => (hRow('t_pgm_doanh_so', w) || 0) + (hRow('t_lgm_doanhthu', w) || 0),
        w => (pW('t_pgm_doanh_so', w) + pW('t_lgm_doanhthu', w)) || null)
      body += wRow('Chi phí Ads', tPlanCpM || null,
        getMTD(w => tCpKeys.reduce((a, k) => a + (hRow(k, w) || 0), 0)),
        w => tCpKeys.reduce((a, k) => a + (hRow(k, w) || 0), 0),
        w => tCpKeys.reduce((a, k) => a + pW(k, w), 0) || null)
      body += dRow('ROI', tPlanCpM ? tPlanGmvM / tPlanCpM : null,
        (() => { const g = getMTD(w => (hRow('t_pgm_doanh_so', w) || 0) + (hRow('t_lgm_doanhthu', w) || 0)); const c = getMTD(w => tCpKeys.reduce((a,k) => a + (hRow(k, w) || 0), 0)); return c ? g / c : null })(),
        w => { const g = (hRow('t_pgm_doanh_so', w) || 0) + (hRow('t_lgm_doanhthu', w) || 0); const c = tCpKeys.reduce((a, k) => a + (hRow(k, w) || 0), 0); return c ? g / c : null },
        w => { const g = pW('t_pgm_doanh_so', w) + pW('t_lgm_doanhthu', w); const c = tCpKeys.reduce((a, k) => a + pW(k, w), 0); return c ? g / c : null }, fmtX)
      body += `</tbody></table>`

      // PGM
      body += `<p style="font-size:13px;font-weight:700;color:#1a2e5c;margin:6px 0 2px">Ads_PGM</p>`
      body += `<table style="${tblStyle}"><thead>${hdr}</thead><tbody>`
      body += wRow('Doanh số Ads', pM('t_pgm_doanh_so') || null, getMTD(w => hRow('t_pgm_doanh_so', w) || 0), w => hRow('t_pgm_doanh_so', w), w => pW('t_pgm_doanh_so', w) || null)
      body += wRow('Chi Phí Dịch vụ hiển thị', pM('t_pgm_chi_phi') || null, getMTD(w => hRow('t_pgm_chi_phi', w) || 0), w => hRow('t_pgm_chi_phi', w), w => pW('t_pgm_chi_phi', w) || null)
      body += dRow('ROAS', ratioPM('t_pgm_doanh_so','t_pgm_chi_phi'), ratioMTD('t_pgm_doanh_so','t_pgm_chi_phi'), w => ratioW('t_pgm_doanh_so','t_pgm_chi_phi',w), w => ratioPW('t_pgm_doanh_so','t_pgm_chi_phi',w), fmtX)
      body += dRow('CPC = Chi phí / Lượt click', ratioPM('t_pgm_chi_phi','t_pgm_luot_click'), ratioMTD('t_pgm_chi_phi','t_pgm_luot_click'), w => ratioW('t_pgm_chi_phi','t_pgm_luot_click',w), w => ratioPW('t_pgm_chi_phi','t_pgm_luot_click',w), fmtCPC)
      body += dRow('CTR (%)', ratioPM('t_pgm_luot_click','t_pgm_luot_xem') !== null ? (ratioPM('t_pgm_luot_click','t_pgm_luot_xem') as number) * 100 : null, ratioMTD('t_pgm_luot_click','t_pgm_luot_xem') !== null ? (ratioMTD('t_pgm_luot_click','t_pgm_luot_xem') as number) * 100 : null, w => { const v = ratioW('t_pgm_luot_click','t_pgm_luot_xem',w); return v !== null ? v * 100 : null }, w => { const v = ratioPW('t_pgm_luot_click','t_pgm_luot_xem',w); return v !== null ? v * 100 : null }, fmtPct)
      body += dRow('CR = Đơn hàng / Lượt click*100 (%)', ratioPM('t_pgm_don_hang','t_pgm_luot_click') !== null ? (ratioPM('t_pgm_don_hang','t_pgm_luot_click') as number) * 100 : null, ratioMTD('t_pgm_don_hang','t_pgm_luot_click') !== null ? (ratioMTD('t_pgm_don_hang','t_pgm_luot_click') as number) * 100 : null, w => { const v = ratioW('t_pgm_don_hang','t_pgm_luot_click',w); return v !== null ? v * 100 : null }, w => { const v = ratioPW('t_pgm_don_hang','t_pgm_luot_click',w); return v !== null ? v * 100 : null }, fmtPct)
      body += dRow('CPM', ratioPM('t_pgm_chi_phi','t_pgm_luot_xem') !== null ? (ratioPM('t_pgm_chi_phi','t_pgm_luot_xem') as number) * 1000 : null, ratioMTD('t_pgm_chi_phi','t_pgm_luot_xem') !== null ? (ratioMTD('t_pgm_chi_phi','t_pgm_luot_xem') as number) * 1000 : null, w => { const v = ratioW('t_pgm_chi_phi','t_pgm_luot_xem',w); return v !== null ? v * 1000 : null }, w => { const v = ratioPW('t_pgm_chi_phi','t_pgm_luot_xem',w); return v !== null ? v * 1000 : null }, fmtMoney)
      body += wRow('Số lượt xem', pM('t_pgm_luot_xem') || null, getMTD(w => hRow('t_pgm_luot_xem', w) || 0), w => hRow('t_pgm_luot_xem', w), w => pW('t_pgm_luot_xem', w) || null, fmtN)
      body += wRow('Số lượt click', pM('t_pgm_luot_click') || null, getMTD(w => hRow('t_pgm_luot_click', w) || 0), w => hRow('t_pgm_luot_click', w), w => pW('t_pgm_luot_click', w) || null, fmtN)
      body += wRow('Số đơn hàng', pM('t_pgm_don_hang') || null, getMTD(w => hRow('t_pgm_don_hang', w) || 0), w => hRow('t_pgm_don_hang', w), w => pW('t_pgm_don_hang', w) || null, fmtN)
      body += dRow('AOV = Doanh thu / Số đơn hàng', ratioPM('t_pgm_doanh_so','t_pgm_don_hang'), ratioMTD('t_pgm_doanh_so','t_pgm_don_hang'), w => ratioW('t_pgm_doanh_so','t_pgm_don_hang',w), w => ratioPW('t_pgm_doanh_so','t_pgm_don_hang',w), fmtMoney)
      body += `</tbody></table>`

      // LGM
      body += `<p style="font-size:13px;font-weight:700;color:#1a2e5c;margin:6px 0 2px">Ads_LGM</p>`
      body += `<table style="${tblStyle}"><thead>${hdr}</thead><tbody>`
      body += wRow('Doanh thu LGM', pM('t_lgm_doanhthu') || null, getMTD(w => hRow('t_lgm_doanhthu', w) || 0), w => hRow('t_lgm_doanhthu', w), w => pW('t_lgm_doanhthu', w) || null)
      body += wRow('Chi phí', pM('t_lgm_chi_phi') || null, getMTD(w => hRow('t_lgm_chi_phi', w) || 0), w => hRow('t_lgm_chi_phi', w), w => pW('t_lgm_chi_phi', w) || null)
      body += dRow('ROI', ratioPM('t_lgm_doanhthu','t_lgm_chi_phi'), ratioMTD('t_lgm_doanhthu','t_lgm_chi_phi'), w => ratioW('t_lgm_doanhthu','t_lgm_chi_phi',w), w => ratioPW('t_lgm_doanhthu','t_lgm_chi_phi',w), fmtX)
      body += `</tbody></table>`

      if (hasSectionData(['t_con_nguoi','t_con_chi_phi'])) {
        body += `<p style="font-size:13px;font-weight:700;color:#1a2e5c;margin:6px 0 2px">Consideration_Ads</p>`
        body += `<table style="${tblStyle}"><thead>${hdr}</thead><tbody>`
        body += wRow('Consider (Số người nhận biết thương hiệu)', pM('t_con_nguoi') || null, getMTD(w => hRow('t_con_nguoi', w) || 0), w => hRow('t_con_nguoi', w), w => pW('t_con_nguoi', w) || null, fmtN)
        body += wRow('Chi phí', pM('t_con_chi_phi') || null, getMTD(w => hRow('t_con_chi_phi', w) || 0), w => hRow('t_con_chi_phi', w), w => pW('t_con_chi_phi', w) || null)
        body += dRow('CPA', ratioPM('t_con_chi_phi','t_con_nguoi'), ratioMTD('t_con_chi_phi','t_con_nguoi'), w => ratioW('t_con_chi_phi','t_con_nguoi',w), w => ratioPW('t_con_chi_phi','t_con_nguoi',w), fmtMoney)
        body += `</tbody></table>`
      }
      if (hasSectionData(['t_brd_view','t_brd_follow','t_brd_chi_phi'])) {
        body += `<p style="font-size:13px;font-weight:700;color:#1a2e5c;margin:6px 0 2px">Branding_Ads</p>`
        body += `<table style="${tblStyle}"><thead>${hdr}</thead><tbody>`
        body += wRow('View', pM('t_brd_view') || null, getMTD(w => hRow('t_brd_view', w) || 0), w => hRow('t_brd_view', w), w => pW('t_brd_view', w) || null, fmtN)
        body += wRow('Follow', pM('t_brd_follow') || null, getMTD(w => hRow('t_brd_follow', w) || 0), w => hRow('t_brd_follow', w), w => pW('t_brd_follow', w) || null, fmtN)
        body += wRow('Chi phí', pM('t_brd_chi_phi') || null, getMTD(w => hRow('t_brd_chi_phi', w) || 0), w => hRow('t_brd_chi_phi', w), w => pW('t_brd_chi_phi', w) || null)
        body += dRow('CPA', ratioPM('t_brd_chi_phi','t_brd_follow'), ratioMTD('t_brd_chi_phi','t_brd_follow'), w => ratioW('t_brd_chi_phi','t_brd_follow',w), w => ratioPW('t_brd_chi_phi','t_brd_follow',w), fmtMoney)
        body += `</tbody></table>`
      }
    }

    /* ── HIGHLIGHT / LOWLIGHT ── */
    const F = `font-family:'Times New Roman',serif`
    const cmpct = `border-collapse:collapse;width:100%;max-width:860px;${F};font-size:11px;margin:4px 0 10px;table-layout:fixed`
    const thHL = (c: string) => `padding:5px 10px;border:1px solid #999;background:${c};color:#fff;text-align:center;width:50%;${F};font-size:11px;font-weight:700`
    const tdHL = `padding:8px 10px;border:1px solid #ccc;vertical-align:top;${F};font-size:11px;line-height:1.5;word-wrap:break-word`
    body += `<hr style="border:none;border-top:1.5px solid #1a2e5c;margin:12px 0 8px">`
    body += `<table style="${cmpct}"><thead><tr><th style="${thHL('#1a5c2e')}">Highlight</th><th style="${thHL('#5c1a1a')}">Lowlight</th></tr></thead><tbody><tr><td style="${tdHL}">${(aiResult.highlight || '—').replace(/\n/g, '<br>')}</td><td style="${tdHL}">${(aiResult.lowlight || '—').replace(/\n/g, '<br>')}</td></tr></tbody></table>`

    /* ── Brand / Sàn DARA ── */
    const nl = (v: string) => (v || '').replace(/\n/g, '<br>')
    const thSummary = (w: string) => `padding:5px 8px;border:1px solid #999;background:#1a2e5c;color:#fff;${F};font-size:11px;text-align:center;width:${w}`
    const tdSm = (extra = '') => `padding:6px 8px;border:1px solid #ccc;${F};font-size:11px;vertical-align:top;line-height:1.55;word-wrap:break-word;${extra}`
    const platformRows = [shopeeChecked && 'shopee', tiktokChecked && 'tiktok'].filter(Boolean) as Array<'shopee'|'tiktok'>
    const rc = platformRows.length
    body += `<hr style="border:none;border-top:1px solid #ccc;margin:10px 0 8px">`
    body += `<table style="${cmpct}"><thead><tr><th style="${thSummary('7%')}">Brand</th><th style="${thSummary('6%')}">Sàn</th><th style="${thSummary('6%')}">Hạng mục</th><th style="${thSummary('27%')}">Thực tế</th><th style="${thSummary('27%')}">Vấn đề</th><th style="${thSummary('27%')}">Giải pháp/Kế hoạch tới</th></tr></thead><tbody>`
    platformRows.forEach((p, i) => {
      const sanLabel = p === 'shopee' ? 'Shopee' : 'TikTok'
      body += `<tr>`
      if (i === 0) body += `<td rowspan="${rc}" style="${tdSm('text-align:center;font-weight:700;vertical-align:middle')}">${selectedBrand}</td>`
      body += `<td style="${tdSm('text-align:center;font-weight:600')}">${sanLabel}</td>`
      body += `<td style="${tdSm('text-align:center')}">Ads</td>`
      body += `<td style="${tdSm()}">${nl(aiResult[`${p}_thuc_trang` as keyof AIResult] as string)}</td>`
      body += `<td style="${tdSm()}">${nl(aiResult[`${p}_van_de` as keyof AIResult] as string)}</td>`
      body += `<td style="${tdSm()}">${nl(aiResult[`${p}_giai_phap` as keyof AIResult] as string)}</td>`
      body += `</tr>`
    })
    body += `</tbody></table>`
    body += `<hr style="border:1px solid #ccc;margin:10px 0">`
    body += `<p style="color:#555;font-size:14px">Reported by: ${user?.name || ''} | ${fmtDate(new Date())}</p>`
    body += `</div>`
    return body
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
    // Pre-fill existing plan values (raw + numeric)
    const inputs: Record<string, string> = {}
    const raws: Record<string, string> = {}
    const fillPlan = (plat: string, plan: PlanData | null) => {
      planMetricKeys.forEach(mk => {
        ;['w1','w2','w3','w4','w5','month'].forEach(w => {
          const v = plan?.[mk]?.[w as 'w1'] || 0
          inputs[`${plat}_${mk}_${w}`] = String(v || '')
          raws[`${plat}_${mk}_${w}`] = v ? Math.round(v).toLocaleString('vi-VN') : ''
        })
      })
    }
    if (shopeeChecked) fillPlan('shopee', shopeePlan)
    if (tiktokChecked) fillPlan('tiktok', tiktokPlan)
    setPlanInputs(inputs)
    setPlanRawInputs(raws)
    setPlanModal(true)
  }

  async function savePlan() {
    if (!weekInfo) return
    try {
      const saveOne = async (plat: string) => {
        const plan_data: PlanData = {}
        planMetricKeys.forEach(mk => {
          plan_data[mk] = {} as PlanData[string]
          ;(['w1','w2','w3','w4','w5','month'] as const).forEach(w => {
            const raw = planRawInputs[`${plat}_${mk}_${w}`] ?? planInputs[`${plat}_${mk}_${w}`] ?? ''
            plan_data[mk][w] = parseVN(raw)
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

  // Plan metric keys — 12 financial keys (match CSV format)
  const planMetricKeys = [
    's_cpc_doanh_so','s_cpc_chi_phi',
    's_nd_gmv','s_nd_chi_phi',
    's_live_gmv','s_live_chi_phi',
    't_pgm_doanh_so','t_pgm_chi_phi',
    't_lgm_doanhthu','t_lgm_chi_phi',
    't_con_chi_phi','t_brd_chi_phi',
  ]

  const planMetricLabels: Record<string, string> = {
    's_cpc_doanh_so':'[S-CPC] Doanh số','s_cpc_chi_phi':'[S-CPC] Chi phí',
    's_nd_gmv':'[S-ND] GMV','s_nd_chi_phi':'[S-ND] Chi phí',
    's_live_gmv':'[S-Live] GMV','s_live_chi_phi':'[S-Live] Chi phí',
    't_pgm_doanh_so':'[T-PGM] Doanh số','t_pgm_chi_phi':'[T-PGM] Chi phí',
    't_lgm_doanhthu':'[T-LGM] Doanh thu','t_lgm_chi_phi':'[T-LGM] Chi phí',
    't_con_chi_phi':'[T-Con] Chi phí','t_brd_chi_phi':'[T-Brand] Chi phí',
  }

  // Filter plan keys based on selected platforms
  const activePlanKeys = planMetricKeys.filter(k => {
    if (k.startsWith('s_') && !shopeeChecked) return false
    if (k.startsWith('t_') && !tiktokChecked) return false
    return true
  })

  /* ── Build Chart ── */
  const buildChart = useCallback(() => {
    if (!chartRef.current || !weekInfo) return
    if (chartInstRef.current) { chartInstRef.current.destroy(); chartInstRef.current = null }
    const totalWeeks = getWeeksInMonth(weekInfo.month, weekInfo.year)
    const labels: string[] = []
    const gmvData: (number|null)[] = []
    const cpData: (number|null)[] = []
    const cpDtData: (number|null)[] = []

    const curSGmv = shopeeData.s_cpc_doanh_so + shopeeData.s_nd_gmv + shopeeData.s_live_gmv
    const curSCp  = shopeeData.s_cpc_chi_phi + shopeeData.s_nd_chi_phi + shopeeData.s_live_chi_phi
    const curTGmv = tiktokData.t_pgm_doanh_so + tiktokData.t_lgm_doanhthu
    const curTCp  = tiktokData.t_pgm_chi_phi + tiktokData.t_lgm_chi_phi + tiktokData.t_con_chi_phi + tiktokData.t_brd_chi_phi

    for (let w = 1; w <= totalWeeks; w++) {
      const wi = getWeekInfo(weekInfo.month, weekInfo.year, w)
      labels.push(`W${w} ${wi.start.substring(0,5)}–${wi.end.substring(0,5)}`)
      if (w === weekInfo.weekNum) {
        const g = (shopeeChecked ? curSGmv : 0) + (tiktokChecked ? curTGmv : 0)
        const c = (shopeeChecked ? curSCp : 0) + (tiktokChecked ? curTCp : 0)
        gmvData.push(g)
        cpData.push(c)
        cpDtData.push(g ? parseFloat(((c/g)*100).toFixed(1)) : null)
      } else {
        const row = weekHistory.find(h => parseInt(String(h.week_num)) === w)
        if (row) {
          const g = (shopeeChecked?(n(row.s_cpc_doanh_so)+n(row.s_nd_gmv)+n(row.s_live_gmv)):0)
                  + (tiktokChecked?(n(row.t_pgm_doanh_so)+n(row.t_lgm_doanhthu)):0)
          const c = (shopeeChecked?(n(row.s_cpc_chi_phi)+n(row.s_nd_chi_phi)+n(row.s_live_chi_phi)):0)
                  + (tiktokChecked?(n(row.t_pgm_chi_phi)+n(row.t_lgm_chi_phi)+n(row.t_con_chi_phi)+n(row.t_brd_chi_phi)):0)
          gmvData.push(g || null)
          cpData.push(c || null)
          cpDtData.push(g ? parseFloat(((c/g)*100).toFixed(1)) : null)
        } else {
          gmvData.push(null); cpData.push(null); cpDtData.push(null)
        }
      }
    }

    chartInstRef.current = new Chart(chartRef.current, {
      data: {
        labels,
        datasets: [
          { type: 'bar', label: 'GMV', data: gmvData, backgroundColor: 'rgba(37,99,235,0.7)', yAxisID: 'y' },
          { type: 'bar', label: 'Chi phí', data: cpData, backgroundColor: 'rgba(220,38,38,0.6)', yAxisID: 'y' },
          { type: 'line', label: '%CP/DT', data: cpDtData, borderColor: '#F59E0B', backgroundColor: 'transparent', yAxisID: 'y2', tension: 0.3, pointRadius: 4 },
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: {
          y: { ticks: { callback: (v: unknown) => (Number(v)/1e6).toFixed(0)+'M', font: { size: 11 } } },
          y2: { position: 'right', grid: { drawOnChartArea: false }, ticks: { callback: (v: unknown) => v+'%', font: { size: 11 } }, suggestedMax: 100 }
        }
      }
    })
  }, [weekInfo, weekHistory, shopeeChecked, tiktokChecked, shopeeData, tiktokData])

  /* ── Build chart when step 3 mounts ── */
  useEffect(() => {
    if (step === 3) {
      setTimeout(buildChart, 50)
    }
    return () => {
      if (chartInstRef.current) { chartInstRef.current.destroy(); chartInstRef.current = null }
    }
  }, [step, buildChart])

  /* ── XLSX helpers ── */
  function downloadPlanTemplate() {
    if (!weekInfo) return
    const periods = ['plan_month','plan_w1','plan_w2','plan_w3','plan_w4','plan_w5']
    const headers = ['Metric', 'Tháng', 'W1', 'W2', 'W3', 'W4', 'W5']
    const rows: (string|number)[][] = [headers]
    activePlanKeys.forEach(mk => {
      const label = planMetricLabels[mk] || mk
      const existing = mk.startsWith('s_') ? shopeePlan : tiktokPlan
      rows.push([label, ...periods.map(p => {
        const w = p.replace('plan_','') as 'w1'
        return existing?.[mk]?.[w] || 0
      }), mk])
    })
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(rows)
    XLSX.utils.book_append_sheet(wb, ws, 'Plan')
    XLSX.writeFile(wb, `Plan_${selectedBrand}_T${weekInfo.month}_${weekInfo.year}.xlsx`)
    showToast('Đã export Plan XLSX!')
  }

  function downloadActualTemplate() {
    if (!weekInfo) return
    const headers = ['Metric', 'Actual W', 'Key']
    const rows: (string|number)[][] = [headers]
    const allKeys = [...planMetricKeys]
    allKeys.forEach(mk => {
      const label = planMetricLabels[mk] || mk
      const dataObj = mk.startsWith('s_') ? shopeeData : tiktokData
      const val = dataObj[mk as keyof ShopeeData & keyof TiktokData] as number || 0
      rows.push([label, val, mk])
    })
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(rows)
    XLSX.utils.book_append_sheet(wb, ws, 'Actual')
    XLSX.writeFile(wb, `Actual_${selectedBrand}_T${weekInfo.month}_W${weekInfo.weekNum}_${weekInfo.year}.xlsx`)
    showToast('Đã export Actual XLSX!')
  }

  function handleActualUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: 'binary' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json<(string|number)[]>(ws, { header: 1, defval: '' }) as (string|number)[][]
        const newShopee = { ...shopeeData }
        const newTiktok = { ...tiktokData }
        data.slice(1).forEach(row => {
          const key = String(row[2] || '').trim()
          const val = parseFloat(String(row[1]).replace(/[^\d.]/g,'')) || 0
          if (key.startsWith('s_') && key in newShopee) (newShopee as Record<string,number>)[key] = val
          if (key.startsWith('t_') && key in newTiktok) (newTiktok as Record<string,number>)[key] = val
        })
        setShopeeData(newShopee)
        setTiktokData(newTiktok)
        showToast('Đã import Actual XLSX!')
      } catch(err) { showToast('Lỗi đọc file: ' + String(err), 'error') }
    }
    reader.readAsBinaryString(file)
    e.target.value = ''
  }

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

  const wk = weekInfo ? `w${weekInfo.weekNum}` as 'w1'|'w2'|'w3'|'w4'|'w5'|'month' : 'w1'

  /* ── Actual input change handler (formats VN, supports math expr on blur) ── */
  function setActual(key: string, raw: string) {
    setRawInputs(prev => ({ ...prev, [key]: raw }))
    // Live formatting: strip non-digits and re-format
    if (/[+\-*/]/.test(raw)) return // expression mode → don't reformat while typing
    const num = parseInt(raw.replace(/[^\d]/g, ''), 10)
    const formatted = isNaN(num) ? '' : num.toLocaleString('vi-VN')
    setRawInputs(prev => ({ ...prev, [key]: formatted }))
    const v = isNaN(num) ? 0 : num
    if (key.startsWith('s_')) setShopeeData(prev => ({ ...prev, [key]: v }))
    else if (key.startsWith('t_')) setTiktokData(prev => ({ ...prev, [key]: v }))
  }
  function blurActual(key: string) {
    const cur = rawInputs[key] || ''
    if (!cur) return
    const evald = evalExpr(cur)
    if (!isNaN(evald)) {
      const formatted = evald ? evald.toLocaleString('vi-VN') : ''
      setRawInputs(prev => ({ ...prev, [key]: formatted }))
      if (key.startsWith('s_')) setShopeeData(prev => ({ ...prev, [key]: evald }))
      else if (key.startsWith('t_')) setTiktokData(prev => ({ ...prev, [key]: evald }))
    }
  }

  /* ── Handle paste from sheet: \t for horizontal, \n for vertical ── */
  function handleActualPaste(e: React.ClipboardEvent<HTMLInputElement>, fieldKey: string) {
    const text = e.clipboardData.getData('text')
    const lines = text.split(/\r?\n/).filter(l => l !== '')
    const grid = lines.map(l => l.split('\t'))
    if (grid.length === 1 && grid[0].length === 1) return // single cell — let browser handle
    e.preventDefault()
    const startIdx = ACTUAL_KEYS_ORDER.indexOf(fieldKey)
    if (startIdx === -1) return
    const newRaw: Record<string,string> = { ...rawInputs }
    const newShopee: Record<string, number> = { ...shopeeData }
    const newTiktok: Record<string, number> = { ...tiktokData }
    grid.forEach((cols, dr) => {
      const key = ACTUAL_KEYS_ORDER[startIdx + dr]
      if (!key) return
      const raw = (cols[0] || '').trim().replace(/[^\d]/g, '')
      const v = parseInt(raw, 10) || 0
      newRaw[key] = v ? v.toLocaleString('vi-VN') : ''
      if (key.startsWith('s_') && key in newShopee) newShopee[key] = v
      else if (key.startsWith('t_') && key in newTiktok) newTiktok[key] = v
    })
    setRawInputs(newRaw)
    setShopeeData(newShopee as ShopeeData)
    setTiktokData(newTiktok as TiktokData)
  }

  /* ── Plan modal helpers ── */
  function planKeyCell(plat: string, mk: string, w: string) { return `${plat}_${mk}_${w}` }
  function setPlanRaw(plat: string, mk: string, w: string, raw: string) {
    const key = planKeyCell(plat, mk, w)
    if (/[+\-*/]/.test(raw)) {
      setPlanRawInputs(prev => ({ ...prev, [key]: raw }))
      setPlanInputs(prev => ({ ...prev, [key]: raw }))
      return
    }
    const num = parseInt(raw.replace(/[^\d]/g, ''), 10)
    const formatted = isNaN(num) ? '' : num.toLocaleString('vi-VN')
    setPlanRawInputs(prev => ({ ...prev, [key]: formatted }))
    setPlanInputs(prev => ({ ...prev, [key]: String(isNaN(num) ? 0 : num) }))
  }
  function blurPlanRaw(plat: string, mk: string, w: string) {
    const key = planKeyCell(plat, mk, w)
    const cur = planRawInputs[key] || ''
    if (!cur) return
    const evald = evalExpr(cur)
    if (!isNaN(evald)) {
      setPlanRawInputs(prev => ({ ...prev, [key]: evald ? evald.toLocaleString('vi-VN') : '' }))
      setPlanInputs(prev => ({ ...prev, [key]: String(evald) }))
    }
  }
  /* Sum W1..W5 for a metric to show alongside Month */
  function sumWeeksForMetric(plat: string, mk: string): number {
    let s = 0
    ;(['w1','w2','w3','w4','w5'] as const).forEach(w => {
      const key = planKeyCell(plat, mk, w)
      s += parseVN(planRawInputs[key] ?? planInputs[key] ?? '')
    })
    return s
  }
  /* Distribute month value evenly across actual weeks of the month */
  function distributeMonthEven(plat: string, mk: string) {
    if (!weekInfo) return
    const monthKey = planKeyCell(plat, mk, 'month')
    const monthV = parseVN(planRawInputs[monthKey] ?? planInputs[monthKey] ?? '')
    if (!monthV) { showToast('Nhập tháng trước', 'error'); return }
    const totalWeeks = getWeeksInMonth(weekInfo.month, weekInfo.year)
    const per = Math.round(monthV / totalWeeks)
    const newRaw = { ...planRawInputs }
    const newInp = { ...planInputs }
    for (let i = 1; i <= 5; i++) {
      const key = planKeyCell(plat, mk, `w${i}`)
      if (i <= totalWeeks) {
        newRaw[key] = per ? per.toLocaleString('vi-VN') : ''
        newInp[key] = String(per)
      } else {
        newRaw[key] = ''
        newInp[key] = '0'
      }
    }
    setPlanRawInputs(newRaw)
    setPlanInputs(newInp)
  }

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
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
          <h1 style={{ display:'flex', alignItems:'center', gap:10, margin:0 }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            Weekly Report Tool
          </h1>
          <div style={{ display:'flex', gap:8 }}>
            <button className="btn-s" style={{ fontSize:'.8rem' }} onClick={() => { setPromptInput((typeof window !== 'undefined' ? localStorage.getItem('mo_ai_prompt') : null) || DEFAULT_SYS_PROMPT); setPromptModal(true) }}>
              ✏️ AI Prompt
            </button>
            <button className="btn-s" style={{ fontSize:'.8rem' }} onClick={() => { setKeyInput(typeof window !== 'undefined' ? (localStorage.getItem('mo_openai_key') || '') : ''); setKeyModal(true) }}>
              🔑 API Key
            </button>
          </div>
        </div>
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
          {/* Plan warning / edit */}
          {!hasPlan ? (
            <div className="plan-warn">
              <span style={{ fontSize:'1.2rem' }}>⚠️</span>
              <div style={{ flex:1 }}>
                <strong>Chưa có Plan tháng {weekInfo.month}/{weekInfo.year} cho brand này</strong>
                <span style={{ display:'block' }}>Nhập plan để xem % Plan theo tuần.</span>
              </div>
              <button className="btn-set-plan" onClick={openPlanModal}>Set Plan</button>
            </div>
          ) : (
            <div className="plan-warn" style={{ background:'#ECFDF5', borderColor:'#A7F3D0' }}>
              <span style={{ fontSize:'1.2rem' }}>✓</span>
              <div style={{ flex:1 }}>
                <strong>Đã có Plan tháng {weekInfo.month}/{weekInfo.year}</strong>
                <span style={{ display:'block', fontSize:'.82rem', color:'var(--muted)' }}>Click &quot;Sửa Plan&quot; nếu cần điều chỉnh.</span>
              </div>
              <button className="btn-s" onClick={openPlanModal}>Sửa Plan</button>
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
                          <td><input className="m-inp" type="text" inputMode="numeric" value={rawInputs[key] ?? (actual ? actual.toLocaleString('vi-VN') : '')} placeholder="0"
                            onChange={e => setActual(key, e.target.value)}
                            onBlur={() => blurActual(key)}
                            onPaste={e => handleActualPaste(e, key)} /></td>
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
                          <td><input className="m-inp" type="text" inputMode="numeric" value={rawInputs[key] ?? (actual ? actual.toLocaleString('vi-VN') : '')} placeholder="0"
                            onChange={e => setActual(key, e.target.value)}
                            onBlur={() => blurActual(key)}
                            onPaste={e => handleActualPaste(e, key)} /></td>
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
                          <td><input className="m-inp" type="text" inputMode="numeric" value={rawInputs[key] ?? (actual ? actual.toLocaleString('vi-VN') : '')} placeholder="0"
                            onChange={e => setActual(key, e.target.value)}
                            onBlur={() => blurActual(key)}
                            onPaste={e => handleActualPaste(e, key)} /></td>
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
                          <td><input className="m-inp" type="text" inputMode="numeric" value={rawInputs[key] ?? (actual ? actual.toLocaleString('vi-VN') : '')} placeholder="0"
                            onChange={e => setActual(key, e.target.value)}
                            onBlur={() => blurActual(key)}
                            onPaste={e => handleActualPaste(e, key)} /></td>
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
                          <td><input className="m-inp" type="text" inputMode="numeric" value={rawInputs[key] ?? (actual ? actual.toLocaleString('vi-VN') : '')} placeholder="0"
                            onChange={e => setActual(key, e.target.value)}
                            onBlur={() => blurActual(key)}
                            onPaste={e => handleActualPaste(e, key)} /></td>
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
                          <td><input className="m-inp" type="text" inputMode="numeric" value={rawInputs[key] ?? (actual ? actual.toLocaleString('vi-VN') : '')} placeholder="0"
                            onChange={e => setActual(key, e.target.value)}
                            onBlur={() => blurActual(key)}
                            onPaste={e => handleActualPaste(e, key)} /></td>
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
                          <td><input className="m-inp" type="text" inputMode="numeric" value={rawInputs[key] ?? (actual ? actual.toLocaleString('vi-VN') : '')} placeholder="0"
                            onChange={e => setActual(key, e.target.value)}
                            onBlur={() => blurActual(key)}
                            onPaste={e => handleActualPaste(e, key)} /></td>
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

          {/* ── XLSX Tools ── */}
          <div className="rc">
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
              <span style={{ fontSize:'.82rem', color:'var(--muted)', fontWeight:600 }}>XLSX:</span>
              <button className="btn-s" style={{ fontSize:'.78rem' }} onClick={downloadActualTemplate}>⬇ Tải template Actual</button>
              <label className="btn-s" style={{ fontSize:'.78rem', cursor:'pointer' }}>
                ⬆ Import Actual
                <input type="file" accept=".xlsx,.xls" style={{ display:'none' }} onChange={handleActualUpload} />
              </label>
              <button className="btn-s" style={{ fontSize:'.78rem' }} onClick={downloadPlanTemplate}>⬇ Tải template Plan</button>
            </div>
          </div>

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
          {/* Chart */}
          <div className="rc" style={{ marginBottom:16 }}>
            <div style={{ fontWeight:700, fontSize:'.9rem', marginBottom:8 }}>Biểu đồ GMV & Chi phí theo tuần</div>
            <div style={{ height:280, position:'relative' }}>
              <canvas ref={chartRef} />
            </div>
          </div>

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

      {/* ══════════════ KEY MODAL ══════════════ */}
      {keyModal && (
        <div className="mo open">
          <div className="mo-box" style={{ maxWidth:480 }}>
            <div className="mo-hdr">
              <h3>🔑 OpenAI API Key</h3>
              <button className="mo-close" onClick={() => setKeyModal(false)}>×</button>
            </div>
            <div className="mo-body">
              <p style={{ fontSize:'.84rem', color:'var(--muted)', marginBottom:12 }}>
                Key được lưu trong trình duyệt (localStorage). Không gửi lên server.
              </p>
              <input
                className="ri" type="password" placeholder="sk-..." value={keyInput}
                onChange={e => setKeyInput(e.target.value)}
                style={{ width:'100%', marginBottom:8 }}
              />
            </div>
            <div className="mo-foot">
              <button className="btn-s" onClick={() => setKeyModal(false)}>Hủy</button>
              <button className="btn-p" onClick={() => {
                if (!keyInput.trim()) { showToast('Key không được để trống', 'error'); return }
                if (typeof window !== 'undefined') localStorage.setItem('mo_openai_key', keyInput.trim())
                setKeyModal(false)
                showToast('✅ Đã lưu OpenAI Key!')
              }}>Lưu Key</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ PROMPT MODAL ══════════════ */}
      {promptModal && (
        <div className="mo open">
          <div className="mo-box" style={{ maxWidth:700 }}>
            <div className="mo-hdr">
              <h3>✏️ AI System Prompt</h3>
              <button className="mo-close" onClick={() => setPromptModal(false)}>×</button>
            </div>
            <div className="mo-body">
              <p style={{ fontSize:'.84rem', color:'var(--muted)', marginBottom:8 }}>Tuỳ chỉnh prompt hệ thống cho AI. Lưu trong trình duyệt.</p>
              <textarea
                style={{ width:'100%', minHeight:300, fontFamily:'monospace', fontSize:'.8rem', padding:10, border:'1px solid var(--border)', borderRadius:6, resize:'vertical' }}
                value={promptInput}
                onChange={e => setPromptInput(e.target.value)}
              />
            </div>
            <div className="mo-foot">
              <button className="btn-s" onClick={() => { setPromptInput(DEFAULT_SYS_PROMPT); showToast('Đã reset về default') }}>Reset Default</button>
              <button className="btn-s" onClick={() => setPromptModal(false)}>Hủy</button>
              <button className="btn-p" onClick={() => {
                if (typeof window !== 'undefined') localStorage.setItem('mo_ai_prompt', promptInput)
                setPromptModal(false)
                showToast('✅ Đã lưu AI Prompt!')
              }}>Lưu Prompt</button>
            </div>
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
            <div className="pg6" style={{ marginBottom:8 }}>
              <div className="pg-head" style={{ textAlign:'left' }}>Metric</div>
              {['W1','W2','W3','W4','W5','Tháng'].map(h => (
                <div key={h} className="pg-head">{h}</div>
              ))}
            </div>
            {(['shopee','tiktok'] as const).map(plat => {
              if (plat === 'shopee' && !shopeeChecked) return null
              if (plat === 'tiktok' && !tiktokChecked) return null
              return (
                <div key={plat}>
                  <div className="pg-section" style={{ gridColumn:'1/-1', marginBottom:8, marginTop: plat === 'tiktok' ? 16 : 0 }}>{plat === 'shopee' ? 'Shopee' : 'TikTok Shop'}</div>
                  {activePlanKeys.filter(k => k.startsWith(plat === 'shopee' ? 's_' : 't_')).map(mk => {
                    const monthV = parseVN(planRawInputs[`${plat}_${mk}_month`] ?? planInputs[`${plat}_${mk}_month`] ?? '')
                    const sumW = sumWeeksForMetric(plat, mk)
                    const diff = monthV - sumW
                    return (
                      <div key={mk} style={{ marginBottom:6 }}>
                        <div className="pg6">
                          <div className="pg-lbl" style={{ fontSize:'.78rem' }}>{planMetricLabels[mk] || mk}</div>
                          {(['w1','w2','w3','w4','w5','month'] as const).map(w => (
                            <input key={w} className="pg-inp" type="text" inputMode="numeric" placeholder="0"
                              value={planRawInputs[`${plat}_${mk}_${w}`] ?? ''}
                              onChange={e => setPlanRaw(plat, mk, w, e.target.value)}
                              onBlur={() => blurPlanRaw(plat, mk, w)} />
                          ))}
                        </div>
                        {(monthV > 0 || sumW > 0) && (
                          <div style={{ display:'flex', gap:8, alignItems:'center', fontSize:'.72rem', color: Math.abs(diff) < monthV * 0.02 ? '#059669' : '#D97706', paddingLeft: 4, marginTop: 2 }}>
                            <span>Tổng W: <strong>{sumW.toLocaleString('vi-VN')}</strong> / Tháng: <strong>{monthV.toLocaleString('vi-VN')}</strong></span>
                            {diff !== 0 && monthV > 0 && <span style={{ color:'#9CA3AF' }}>(lệch {diff.toLocaleString('vi-VN')})</span>}
                            <button type="button" className="btn-s" style={{ padding:'2px 8px', fontSize:'.7rem' }} onClick={() => distributeMonthEven(plat, mk)}>Chia đều theo W</button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
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
