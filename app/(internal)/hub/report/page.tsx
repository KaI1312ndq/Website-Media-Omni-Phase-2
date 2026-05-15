'use client'
import { useEffect, useState, useRef, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSession, SessionUser } from '@/lib/auth'
import { Icon } from '@/lib/icons'
import '@/app/(internal)/dashboard/dashboard.css'
import * as XLSX from 'xlsx'
import { Chart, registerables } from 'chart.js'
Chart.register(...registerables)
import { DEFAULT_SYS_PROMPT } from '@/lib/report/ai-prompt'
import type {
  Brand,
  PlanData,
  WeekInfo,
  ShopeeData,
  TiktokData,
  AIResult,
  PreviousSolutions,
} from '@/lib/report/types'
import { emptyAIResult, parseAIResult, AI_MATRIX_KEYS, AI_MATRIX_LABEL } from '@/lib/report/types'
import { buildAIInput } from '@/lib/report/ai-input-builder'
import {
  fmtDate,
  toISO,
  fmtNum,
  fmtVN,
  parseVN,
  evalExpr,
  pct,
  pctClass,
  n,
  getWeekInfo,
  getWeeksInMonth,
  getCurrentWeekDefault,
  calcCPC,
  calcND,
  calcLive,
  calcPGM,
  calcLGM,
  calcCon,
  calcBrd,
} from '@/lib/report/utils'
import { ACTUAL_KEYS_ORDER, PLAN_PERIODS_ORDER, EMPTY_SHOPEE, EMPTY_TIKTOK } from '@/lib/report/constants'
import {
  parseShopeeFile,
  buildShopeePivot,
  pivotToAutoFill,
  parseTiktokPGM,
  parseTiktokLGM,
  buildTiktokPivot,
  tiktokToAutoFill,
  type ShopeeFileType,
  type ShopeePivot,
  type PivotRow,
  type TiktokPGMData,
  type TiktokLGMData,
  type TiktokPivot,
} from '@/lib/report/parsers'
import { type UploadedFiles } from '@/components/report/FileUploadZone'
import ShopeePivotPreview from '@/components/report/ShopeePivotPreview'
import { type TiktokUploadedFiles } from '@/components/report/TiktokFileUploadZone'
import TiktokPivotPreview from '@/components/report/TiktokPivotPreview'
import UnifiedFileUploadZone from '@/components/report/UnifiedFileUploadZone'
import AIMatrixEditor from '@/components/report/AIMatrixEditor'

/* ════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════ */
export default function ReportPage() {
  return (
    <Suspense fallback={null}>
      <ReportPageInner />
    </Suspense>
  )
}

function ReportPageInner() {
  const router = useRouter()
  const [user, setUser] = useState<SessionUser | null>(null)
  const [step, setStep] = useState(1)
  const [toast, setToast] = useState<{ msg: string; type?: string } | null>(null)
  const [sanityPrompt, setSanityPrompt] = useState<string>('')

  // Fetch admin-tunable prompt from Sanity siteSettings (cached on mount)
  useEffect(() => {
    fetch('/api/report/prompt', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(j => {
        if (j?.prompt && typeof j.prompt === 'string') setSanityPrompt(j.prompt)
      })
      .catch(() => {})
  }, [])

  // Resolve effective system prompt: localStorage user override → Sanity admin → default
  const effectivePrompt =
    (typeof window !== 'undefined' ? localStorage.getItem('mo_ai_prompt') : null) ||
    sanityPrompt ||
    DEFAULT_SYS_PROMPT

  // Step 1 state
  const [brands, setBrands] = useState<Brand[]>([])
  const [brandSearch, setBrandSearch] = useState('')
  const [showBrandDrop, setShowBrandDrop] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState('')
  const [shopeeChecked, setShopeeChecked] = useState(true)
  const [tiktokChecked, setTiktokChecked] = useState(true)
  const today = new Date()
  const [selMonth, setSelMonth] = useState(today.getMonth() + 1)
  const [selYear, setSelYear] = useState(today.getFullYear())
  const [selWeek, setSelWeek] = useState(1)
  const [weekInfo, setWeekInfo] = useState<WeekInfo | null>(null)

  // Step 1.5 state (Shopee CSV upload + parse)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFiles>({
    shopee_cpc: null,
    shopee_branding: null,
    shopee_live: null,
  })
  const [shopeePivot, setShopeePivot] = useState<ShopeePivot | null>(null)
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState<string>('')
  // Context khi upload — dùng để auto-clear khi user đổi brand/tuần ở Step 1.
  const [uploadContext, setUploadContext] = useState<string>('')

  // Step 1.5 — TikTok xlsx upload + parse (Phase 2B)
  const [tiktokFiles, setTiktokFiles] = useState<TiktokUploadedFiles>({
    tiktok_pgm: null,
    tiktok_lgm: null,
  })
  const [tiktokPGMData, setTiktokPGMData] = useState<TiktokPGMData | null>(null)
  const [tiktokLGMData, setTiktokLGMData] = useState<TiktokLGMData | null>(null)
  const [tiktokPivot, setTiktokPivot] = useState<TiktokPivot | null>(null)
  const [parsingTiktok, setParsingTiktok] = useState(false)
  const [tiktokParseError, setTiktokParseError] = useState<string>('')

  // Step 2 state
  const [shopeePlan, setShopeePlan] = useState<PlanData | null>(null)
  const [tiktokPlan, setTiktokPlan] = useState<PlanData | null>(null)
  const [hasPlan, setHasPlan] = useState(false)
  const [shopeeData, setShopeeData] = useState<ShopeeData>({ ...EMPTY_SHOPEE })
  const [tiktokData, setTiktokData] = useState<TiktokData>({ ...EMPTY_TIKTOK })
  const [aiResult, setAiResult] = useState<AIResult>(emptyAIResult())
  const [previousSolutions, setPreviousSolutions] = useState<PreviousSolutions | null>(null)
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
  const [weekHistory, setWeekHistory] = useState<Record<string, number | string | null>[]>([])
  // Broader history (last 10 weeks across months) for chart
  const [chartHistory, setChartHistory] = useState<Record<string, number | string | null>[]>([])
  // Chart image dataURL (PNG) — embedded into mail HTML
  const [chartDataUrl, setChartDataUrl] = useState<string>('')

  function showToast(msg: string, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const searchParams = useSearchParams()
  const [autoOpened, setAutoOpened] = useState(false)

  /* ── Auth ── */
  useEffect(() => {
    const u = getSession()
    if (u) setUser(u)
  }, [])

  /* ── Load brands ── */
  useEffect(() => {
    if (!user) return
    const qs = user.username ? `?username=${encodeURIComponent(user.username)}` : ''
    fetch(`/api/brands${qs}`, { credentials: 'include' })
      .then(r => r.json())
      .then(j => setBrands(j.data || j.brands || []))
  }, [user])

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

  /* ── Auto prefill from query params (?brand=&month=&year=&openPlan=1) ── */
  /* deepLinkOpenPlan: when set, the effect that watches shopeePlan/tiktokPlan opens modal */
  const [deepLinkOpenPlan, setDeepLinkOpenPlan] = useState(false)

  useEffect(() => {
    if (autoOpened) return
    if (!searchParams) return
    if (brands.length === 0) return
    const qBrand = searchParams.get('brand')
    const qMonth = searchParams.get('month')
    const qYear = searchParams.get('year')
    const qOpen = searchParams.get('openPlan')
    if (!qBrand || !qMonth || !qYear) return
    const m = parseInt(qMonth)
    const y = parseInt(qYear)
    if (!m || !y) return
    setSelectedBrand(qBrand)
    setBrandSearch(qBrand)
    setSelMonth(m)
    setSelYear(y)
    setSelWeek(1)
    setAutoOpened(true)
    if (qOpen === '1')
      setDeepLinkOpenPlan(true)

      /* Fetch plans + history directly using URL params so we don't depend on stale state.
       After fetch, set state — the secondary effect then opens the plan modal. */
    ;(async () => {
      try {
        const wInfo = getWeekInfo(m, y, 1)
        const [sp, tp, hist, chartHist] = await Promise.all([
          fetch(
            `/api/report?action=plan&brand=${encodeURIComponent(qBrand)}&platform=shopee&month=${m}&year=${y}`,
          ).then(r => r.json()),
          fetch(
            `/api/report?action=plan&brand=${encodeURIComponent(qBrand)}&platform=tiktok&month=${m}&year=${y}`,
          ).then(r => r.json()),
          fetch(`/api/report?action=history&brand=${encodeURIComponent(qBrand)}&month=${m}&year=${y}`).then(
            r => r.json(),
          ),
          fetch(`/api/report?action=history&brand=${encodeURIComponent(qBrand)}`).then(r => r.json()),
        ])
        setShopeePlan(sp.data || null)
        setTiktokPlan(tp.data || null)
        const histRows: Record<string, number | string | null>[] = hist.data || []
        setWeekHistory(histRows)
        setChartHistory(chartHist.data || [])
        setHasPlan(!!sp.data || !!tp.data)
        setWeekInfo(wInfo)
        setStep(2)
      } catch {
        showToast('Lỗi tải plan từ deep-link', 'error')
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brands, searchParams, autoOpened])

  /* When deep-link requested openPlan, wait for plans to be loaded into state then open modal */
  useEffect(() => {
    if (!deepLinkOpenPlan) return
    if (step < 2) return
    // Wait until at least the plan-fetch has settled (shopeePlan or tiktokPlan no longer null
    // implies data was fetched; both null but step===2 also means fetch completed with no data).
    const t = setTimeout(() => {
      openPlanModal()
      setDeepLinkOpenPlan(false)
    }, 80)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLinkOpenPlan, step, shopeePlan, tiktokPlan])

  /* ── Close brand dropdown on outside click ── */
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (brandRef.current && !brandRef.current.contains(e.target as Node)) setShowBrandDrop(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filteredBrands = brands.filter(b => b.brand_name.toLowerCase().includes(brandSearch.toLowerCase()))

  async function addBrand() {
    const name = addBrandInput.trim()
    if (!name) return
    const r = await fetch('/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'addBrand', brand_name: name }),
    })
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
    if (!shopeeChecked && !tiktokChecked) {
      showToast('Chọn ít nhất 1 platform', 'error')
      return
    }
    if (!weekInfo) return

    // No-brand quick path: skip data fetch, jump straight to Upload step.
    // User can upload + parse + copy values without saving — useful for
    // ad-hoc weeks or when just exporting numbers to a template.
    if (!selectedBrand) {
      setShopeePlan(null)
      setTiktokPlan(null)
      setWeekHistory([])
      setChartHistory([])
      setHasPlan(false)
      setShopeeData({ ...EMPTY_SHOPEE })
      setTiktokData({ ...EMPTY_TIKTOK })
      setRawInputs({})
      setPreviousSolutions(null)
      setAiResult(emptyAIResult())
      // Clear stale upload data only if context changed (no brand → ctx 'none')
      const currentCtx = `__nobrand__|${selMonth}|${selYear}|${selWeek}`
      if (uploadContext && uploadContext !== currentCtx) {
        setUploadedFiles({ shopee_cpc: null, shopee_branding: null, shopee_live: null })
        setShopeePivot(null)
        setUploadContext('')
        setTiktokFiles({ tiktok_pgm: null, tiktok_lgm: null })
        setTiktokPGMData(null)
        setTiktokLGMData(null)
        setTiktokPivot(null)
      }
      setStep(1.5)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    showToast('Đang tải dữ liệu...')
    try {
      const [sp, tp, hist, chartHist, prevSol] = await Promise.all([
        shopeeChecked
          ? fetch(
              `/api/report?action=plan&brand=${encodeURIComponent(selectedBrand)}&platform=shopee&month=${weekInfo.month}&year=${weekInfo.year}`,
            ).then(r => r.json())
          : Promise.resolve({ data: null }),
        tiktokChecked
          ? fetch(
              `/api/report?action=plan&brand=${encodeURIComponent(selectedBrand)}&platform=tiktok&month=${weekInfo.month}&year=${weekInfo.year}`,
            ).then(r => r.json())
          : Promise.resolve({ data: null }),
        fetch(
          `/api/report?action=history&brand=${encodeURIComponent(selectedBrand)}&month=${weekInfo.month}&year=${weekInfo.year}`,
        ).then(r => r.json()),
        fetch(`/api/report?action=history&brand=${encodeURIComponent(selectedBrand)}`).then(r => r.json()),
        fetch(
          `/api/report?action=previousSolutions&brand=${encodeURIComponent(selectedBrand)}&year=${weekInfo.year}&month=${weekInfo.month}&week=${weekInfo.weekNum}`,
        )
          .then(r => r.json())
          .catch(() => ({ data: null })),
      ])
      setShopeePlan(sp.data || null)
      setTiktokPlan(tp.data || null)
      const histRows: Record<string, number | string | null>[] = hist.data || []
      setWeekHistory(histRows)
      setChartHistory(chartHist.data || [])
      setPreviousSolutions(prevSol?.data || null)
      const hp = (shopeeChecked ? !!sp.data : true) && (tiktokChecked ? !!tp.data : true)
      setHasPlan(hp)

      /* Auto-load existing data for current week (if any) */
      const existing = histRows.find(r => parseInt(String(r.week_num)) === weekInfo.weekNum)
      const newShopee: ShopeeData = { ...EMPTY_SHOPEE }
      const newTiktok: TiktokData = { ...EMPTY_TIKTOK }
      const newRaw: Record<string, string> = {}
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

      // Pre-fill AI from existing row.
      // Schema version 2 (matrix) → reconstruct cells from per-hạng-mục columns.
      // Schema version 1 (legacy) → fill aggregate fields from nhan_xet_*.
      if (existing) {
        const v2Cell = (prefix: string) => ({
          plan: String(existing[`${prefix}_plan`] ?? ''),
          actual: String(existing[`${prefix}_actual`] ?? ''),
          danh_gia: String(existing[`${prefix}_danh_gia`] ?? ''),
          giai_phap: String(existing[`${prefix}_giai_phap`] ?? ''),
        })
        const hasV2 =
          Number(existing.ai_schema_version) === 2 ||
          AI_MATRIX_KEYS.some(k => {
            const prefix =
              k === 'shopee_ads_cpc'
                ? 's_cpc'
                : k === 'shopee_ads_nd'
                  ? 's_nd'
                  : k === 'shopee_ads_live'
                    ? 's_live'
                    : k === 'tiktok_pgm'
                      ? 't_pgm'
                      : k === 'tiktok_lgm'
                        ? 't_lgm'
                        : k === 'tiktok_consideration'
                          ? 't_con'
                          : 't_brd'
            return (
              existing[`${prefix}_actual`] ||
              existing[`${prefix}_danh_gia`] ||
              existing[`${prefix}_giai_phap`]
            )
          })

        if (hasV2) {
          setAiResult(
            parseAIResult({
              highlight: String(existing.highlight ?? ''),
              lowlight: String(existing.lowlight ?? ''),
              shopee_ads_cpc: v2Cell('s_cpc'),
              shopee_ads_nd: v2Cell('s_nd'),
              shopee_ads_live: v2Cell('s_live'),
              tiktok_pgm: v2Cell('t_pgm'),
              tiktok_lgm: v2Cell('t_lgm'),
              tiktok_consideration: v2Cell('t_con'),
              tiktok_branding: v2Cell('t_brd'),
            }),
          )
        } else {
          // Legacy V1 → keep aggregate fields, matrix empty
          const splitNote = (s: string) => {
            const parts = String(s || '').split('\n')
            return { shopee: parts[0] || '', tiktok: parts.slice(1).join('\n') || '' }
          }
          const tt = splitNote(String(existing.nhan_xet_thuc_trang || ''))
          const vd = splitNote(String(existing.nhan_xet_van_de || ''))
          const gp = splitNote(String(existing.nhan_xet_giai_phap || ''))
          setAiResult({
            ...emptyAIResult(),
            highlight: String(existing.highlight || ''),
            lowlight: String(existing.lowlight || ''),
            shopee_thuc_trang: tt.shopee,
            tiktok_thuc_trang: tt.tiktok,
            shopee_van_de: vd.shopee,
            tiktok_van_de: vd.tiktok,
            shopee_giai_phap: gp.shopee,
            tiktok_giai_phap: gp.tiktok,
          })
        }
      } else {
        setAiResult(emptyAIResult())
      }
      // Auto-clear stale upload data if brand/week changed since last upload.
      const currentCtx = `${selectedBrand}|${selMonth}|${selYear}|${selWeek}`
      if (uploadContext && uploadContext !== currentCtx) {
        setUploadedFiles({ shopee_cpc: null, shopee_branding: null, shopee_live: null })
        setShopeePivot(null)
        setUploadContext('')
        // Also clear TikTok stale data
        setTiktokFiles({ tiktok_pgm: null, tiktok_lgm: null })
        setTiktokPGMData(null)
        setTiktokLGMData(null)
        setTiktokPivot(null)
      }
      // Step 1.5 (Upload) shown when EITHER platform is enabled (user can upload partially).
      setStep(shopeeChecked || tiktokChecked ? 1.5 : 2)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      showToast('Lỗi tải dữ liệu', 'error')
    }
  }

  function clearUploadedData() {
    setUploadedFiles({ shopee_cpc: null, shopee_branding: null, shopee_live: null })
    setShopeePivot(null)
    setUploadContext('')
    setParseError('')
    showToast('Đã xoá data CSV')
  }

  function clearTiktokData() {
    setTiktokFiles({ tiktok_pgm: null, tiktok_lgm: null })
    setTiktokPGMData(null)
    setTiktokLGMData(null)
    setTiktokPivot(null)
    setTiktokParseError('')
    showToast('Đã xoá data TikTok')
  }

  /* ── Step 1.5 → parse TikTok files ── */
  const parseTiktokFiles = useCallback(
    async (filesArg?: TiktokUploadedFiles) => {
      const files = filesArg ?? tiktokFiles
      setParsingTiktok(true)
      setTiktokParseError('')
      try {
        const pgm = files.tiktok_pgm ? await parseTiktokPGM(files.tiktok_pgm) : null
        const lgm = files.tiktok_lgm ? await parseTiktokLGM(files.tiktok_lgm) : null
        setTiktokPGMData(pgm)
        setTiktokLGMData(lgm)
        const pivot = buildTiktokPivot(pgm, lgm)
        setTiktokPivot(pivot)
        setUploadContext(`${selectedBrand}|${selMonth}|${selYear}|${selWeek}`)
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Lỗi parse file TikTok'
        setTiktokParseError(msg)
        setTiktokPivot(null)
      } finally {
        setParsingTiktok(false)
      }
    },
    [tiktokFiles, selectedBrand, selMonth, selYear, selWeek],
  )

  // Auto-parse khi user upload TikTok file
  useEffect(() => {
    if (step !== 1.5) return
    const hasAny = tiktokFiles.tiktok_pgm || tiktokFiles.tiktok_lgm
    if (!hasAny) return
    const t = setTimeout(() => parseTiktokFiles(tiktokFiles), 250)
    return () => clearTimeout(t)
  }, [tiktokFiles, step, parseTiktokFiles])

  /* ── Step 1.5 → parse uploaded files into pivot ── */
  const parseUploadedFiles = useCallback(
    async (filesArg?: UploadedFiles) => {
      const files = filesArg ?? uploadedFiles
      const types: ShopeeFileType[] = ['shopee_cpc', 'shopee_branding', 'shopee_live']
      setParsing(true)
      setParseError('')
      try {
        const results: Record<ShopeeFileType, PivotRow[]> = {
          shopee_cpc: [],
          shopee_branding: [],
          shopee_live: [],
        }
        for (const t of types) {
          const f = files[t]
          if (!f) continue
          results[t] = await parseShopeeFile(f, t)
        }
        const pivot = buildShopeePivot(results.shopee_cpc, results.shopee_branding, results.shopee_live)
        setShopeePivot(pivot)
        setUploadContext(`${selectedBrand}|${selMonth}|${selYear}|${selWeek}`)
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Lỗi parse file'
        setParseError(msg)
        setShopeePivot(null)
      } finally {
        setParsing(false)
      }
    },
    [uploadedFiles, selectedBrand, selMonth, selYear, selWeek],
  )

  // Auto-parse khi user upload file (nếu có ít nhất 1 file mới)
  useEffect(() => {
    if (step !== 1.5) return
    const hasAny = uploadedFiles.shopee_cpc || uploadedFiles.shopee_branding || uploadedFiles.shopee_live
    if (!hasAny) return
    // debounce nhẹ: chờ user upload xong nhiều file
    const t = setTimeout(() => parseUploadedFiles(uploadedFiles), 250)
    return () => clearTimeout(t)
  }, [uploadedFiles, step, parseUploadedFiles])

  /* ── Apply pivot → Step 2 fields (Shopee 12 + TikTok 7) ── */
  function applyAutoFillAndContinue() {
    let filledShopee = 0
    let filledTiktok = 0

    if (shopeePivot) {
      const fill = pivotToAutoFill(shopeePivot)
      setShopeeData(prev => ({ ...prev, ...fill }))
      setRawInputs(prev => {
        const next = { ...prev }
        ;(Object.keys(fill) as (keyof typeof fill)[]).forEach(k => {
          const v = fill[k]
          next[k as string] = v ? v.toLocaleString('vi-VN') : ''
        })
        return next
      })
      filledShopee = 12
    }

    if (tiktokPGMData || tiktokLGMData) {
      const tFill = tiktokToAutoFill(tiktokPGMData, tiktokLGMData)
      setTiktokData(prev => ({ ...prev, ...tFill }))
      setRawInputs(prev => {
        const next = { ...prev }
        ;(Object.keys(tFill) as (keyof typeof tFill)[]).forEach(k => {
          const v = tFill[k]
          next[k as string] = v ? v.toLocaleString('vi-VN') : ''
        })
        return next
      })
      filledTiktok = 7
    }

    if (filledShopee || filledTiktok) {
      const parts: string[] = []
      if (filledShopee) parts.push(`${filledShopee} field Shopee`)
      if (filledTiktok) parts.push(`${filledTiktok} field TikTok`)
      showToast(`Đã auto-fill ${parts.join(' + ')}`)
    }

    setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function skipUploadStep() {
    setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  /* ── Save report directly from Step 2 (Upload) — without going to Step 3 ── */
  async function saveFromUploadStep() {
    if (!weekInfo || !user) return
    // Compute fill values directly (state updates are async, so we use the
    // pivot values directly in the payload).
    const shopeeFill = shopeePivot ? pivotToAutoFill(shopeePivot) : (shopeeData as unknown as ShopeeData)
    const tiktokFill = tiktokPGMData || tiktokLGMData ? tiktokToAutoFill(tiktokPGMData, tiktokLGMData) : null

    // Also update local state so UI stays in sync if user navigates on.
    if (shopeePivot) {
      setShopeeData(prev => ({ ...prev, ...shopeeFill }))
      setRawInputs(prev => {
        const next = { ...prev }
        ;(Object.keys(shopeeFill) as (keyof typeof shopeeFill)[]).forEach(k => {
          const v = shopeeFill[k]
          next[k as string] = v ? v.toLocaleString('vi-VN') : ''
        })
        return next
      })
    }
    if (tiktokFill) {
      setTiktokData(prev => ({ ...prev, ...tiktokFill }))
      setRawInputs(prev => {
        const next = { ...prev }
        ;(Object.keys(tiktokFill) as (keyof typeof tiktokFill)[]).forEach(k => {
          const v = tiktokFill[k]
          next[k as string] = v ? v.toLocaleString('vi-VN') : ''
        })
        return next
      })
    }

    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
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
        ...shopeeFill,
        ...(tiktokFill ?? {}),
        // AI sections empty — user hasn't run analysis yet
        highlight: '',
        lowlight: '',
        nhan_xet_thuc_trang: '',
        nhan_xet_van_de: '',
        nhan_xet_giai_phap: '',
      }
      const r = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (r.ok) showToast('Đã lưu data tuần! Bạn có thể quay lại sau để chạy AI + xuất báo cáo.')
      else showToast('Lỗi lưu báo cáo', 'error')
    } catch {
      showToast('Lỗi mạng khi lưu', 'error')
    } finally {
      setSaving(false)
    }
  }

  /* ── Generate AI (client-side, OpenAI key from localStorage) ── */
  async function generateAI() {
    if (!weekInfo) return
    const openAiKey = typeof window !== 'undefined' ? localStorage.getItem('mo_openai_key') || '' : ''
    if (!openAiKey) {
      showToast('Cần nhập OpenAI API Key — bấm API Key trên nav', 'error')
      setKeyModal(true)
      return
    }
    setAiLoading(true)

    // Look up full brand row for context injection (filled at /hub/brands).
    const brandRow = brands.find(b => b.brand_name === selectedBrand) ?? null

    // Build the user message per Brief V10 §4.2 — brand context + per-hạng-mục
    // blocks with plan/actual/derived + previous-week giải pháp + WoW table.
    const userMsg = buildAIInput({
      brand: brandRow,
      weekInfo,
      shopeeChecked,
      tiktokChecked,
      shopeeData,
      tiktokData,
      shopeePlan,
      tiktokPlan,
      previousSolutions,
      weekHistory,
    })

    const sysPrompt = effectivePrompt

    try {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openAiKey}` },
        body: JSON.stringify({
          model: 'gpt-4.1',
          response_format: { type: 'json_object' },
          max_tokens: 4096,
          messages: [
            { role: 'system', content: sysPrompt },
            { role: 'user', content: userMsg },
          ],
        }),
      })
      if (!resp.ok) {
        const err = await resp.json()
        throw new Error(err.error?.message || `OpenAI ${resp.status}`)
      }
      const j = await resp.json()
      const ai = JSON.parse(j.choices[0].message.content)
      // parseAIResult sanitises cells + derives V1 aggregate fields for legacy UI
      setAiResult(parseAIResult(ai))
      showToast('AI generate xong!')
    } catch (e) {
      showToast('Lỗi AI: ' + String(e), 'error')
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
    const plan = (k: string): Record<string, number> | undefined =>
      (shopeePlan?.[k] || tiktokPlan?.[k]) as Record<string, number> | undefined
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
      weeksList
        .filter(w => w <= weekInfo.weekNum)
        .reduce((a, w) => {
          const v = getter(w)
          return a + (v !== null ? v : 0)
        }, 0)
    const ratioW = (nF: string, dF: string, w: number): number | null => {
      const n = hRow(nF, w),
        d = hRow(dF, w)
      if (d === null || !d) return null
      return n! / d
    }
    const ratioPW = (nF: string, dF: string, w: number): number | null => {
      const d = pW(dF, w)
      return d ? pW(nF, w) / d : null
    }
    const ratioPM = (nF: string, dF: string): number | null => {
      const d = pM(dF)
      return d ? pM(nF) / d : null
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
      v !== null && v !== undefined && !isNaN(v)
        ? parseFloat(String(v)).toLocaleString('vi-VN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        : '—'
    const fmtPct = (v: number | null | undefined): string =>
      v !== null && v !== undefined && !isNaN(v)
        ? parseFloat(String(v)).toLocaleString('vi-VN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }) + '%'
        : '—'
    const fmtN = (v: number | null | undefined): string => fmtMail(v)
    const fmtMoney = (v: number | null | undefined): string => fmtMail(v)
    const fmtCPC = (v: number | null | undefined): string => fmtMail(v)
    const getPctS = (act: number | null, planV: number | null): string | null => {
      if (act === null || act === undefined) return null
      const a = parseFloat(String(act)),
        p = parseFloat(String(planV))
      if (!p || isNaN(a) || isNaN(p)) return null
      return ((a / p) * 100).toFixed(1)
    }

    const ts = `padding:3px 5px;border:1px solid #ccc;text-align:right;font-family:'Times New Roman',serif;font-size:11px;white-space:nowrap`
    const tsL = `padding:3px 5px;border:1px solid #ccc;text-align:left;font-family:'Times New Roman',serif;font-size:11px;white-space:nowrap;min-width:100px`
    const thS = `padding:4px 5px;border:1px solid #999;background:#1a2e5c;color:#fff;font-family:'Times New Roman',serif;font-size:11px;text-align:center;white-space:nowrap`
    const tblStyle = `border-collapse:collapse;width:100%;font-family:'Times New Roman',serif;font-size:11px;margin:4px 0 14px`

    const hdr = `<tr><th style="${thS};text-align:center;min-width:130px">Metric</th><th style="${thS}">Tháng (Plan)</th><th style="${thS}">Luỹ tiến</th><th style="${thS}">% thực hiện</th>${weeksList.map(w => `<th style="${thS}">W${w}</th><th style="${thS}">Thực hiện</th><th style="${thS}">% thực hiện</th>`).join('')}</tr>`

    type Fmt = (v: number | null | undefined) => string
    const wRow = (
      label: string,
      planMth: number | null,
      mtdAct: number | null,
      getAct: (w: number) => number | null,
      getPlan: (w: number) => number | null,
      fmtFn: Fmt = fmtMail,
    ): string => {
      const pctMtd = getPctS(mtdAct, planMth)
      const wCells = weeksList
        .map(w => {
          const pw = getPlan(w),
            act = getAct(w)
          const p = getPctS(act, pw)
          return `<td style="${ts}">${pw !== null && pw !== undefined && pw !== 0 ? fmtFn(pw) : '—'}</td><td style="${ts}">${act !== null ? fmtFn(act) : '—'}</td><td style="${ts}">${p ? p + '%' : '—'}</td>`
        })
        .join('')
      return `<tr><td style="${tsL}">${label}</td><td style="${ts}">${planMth ? fmtFn(planMth) : '—'}</td><td style="${ts}">${mtdAct !== null && !isNaN(mtdAct) ? fmtFn(mtdAct) : '—'}</td><td style="${ts}">${pctMtd ? pctMtd + '%' : '—'}</td>${wCells}</tr>`
    }
    const dRow = (
      label: string,
      planMth: number | null,
      mtdAct: number | null,
      getAct: (w: number) => number | null,
      getPlan: (w: number) => number | null,
      fmtFn: Fmt = fmtX,
    ): string => {
      const pctMtd = getPctS(mtdAct, planMth)
      const wCells = weeksList
        .map(w => {
          const pw = getPlan(w),
            act = getAct(w)
          const p = getPctS(act, pw)
          return `<td style="${ts}">${pw !== null ? fmtFn(pw) : '—'}</td><td style="${ts}">${act !== null ? fmtFn(act) : '—'}</td><td style="${ts}">${p ? p + '%' : '—'}</td>`
        })
        .join('')
      return `<tr style="background:#fafafa"><td style="${tsL};color:#555;font-style:italic">${label}</td><td style="${ts}">${planMth !== null ? fmtFn(planMth) : '—'}</td><td style="${ts}">${mtdAct !== null ? fmtFn(mtdAct) : '—'}</td><td style="${ts}">${pctMtd ? pctMtd + '%' : '—'}</td>${wCells}</tr>`
    }

    const hasSectionData = (keys: string[]): boolean => {
      if (
        keys.some(k => {
          const p = plan(k)
          return p && Object.values(p).some(v => parseFloat(String(v)) > 0)
        })
      )
        return true
      if (keys.some(k => parseFloat(String(curData[k] || 0)) > 0)) return true
      if (weekHistory.length && keys.some(k => weekHistory.some(h => parseFloat(String(h[k] || 0)) > 0)))
        return true
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
      if (shopeeChecked)
        g +=
          parseFloat(String(r.s_cpc_doanh_so || 0)) +
          parseFloat(String(r.s_nd_gmv || 0)) +
          parseFloat(String(r.s_live_gmv || 0))
      if (tiktokChecked)
        g += parseFloat(String(r.t_pgm_doanh_so || 0)) + parseFloat(String(r.t_lgm_doanhthu || 0))
      return g
    }
    const getHistCp = (w: number): number | null => {
      const r = weekHistory.find(h => parseInt(String(h.week_num)) === w)
      if (w === weekInfo.weekNum) {
        let c = 0
        if (shopeeChecked) c += shopeeData.s_cpc_chi_phi + shopeeData.s_nd_chi_phi + shopeeData.s_live_chi_phi
        if (tiktokChecked)
          c +=
            tiktokData.t_pgm_chi_phi +
            tiktokData.t_lgm_chi_phi +
            tiktokData.t_con_chi_phi +
            tiktokData.t_brd_chi_phi
        return c
      }
      if (!r) return null
      let c = 0
      if (shopeeChecked)
        c +=
          parseFloat(String(r.s_cpc_chi_phi || 0)) +
          parseFloat(String(r.s_nd_chi_phi || 0)) +
          parseFloat(String(r.s_live_chi_phi || 0))
      if (tiktokChecked)
        c +=
          parseFloat(String(r.t_pgm_chi_phi || 0)) +
          parseFloat(String(r.t_lgm_chi_phi || 0)) +
          parseFloat(String(r.t_con_chi_phi || 0)) +
          parseFloat(String(r.t_brd_chi_phi || 0))
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
    if (chartDataUrl)
      body += `<img src="${chartDataUrl}" alt="GMV Chart" style="max-width:100%;margin:12px 0;display:block">`
    body += `<hr style="border:1px solid #ccc;margin:8px 0">`
    body += `<p style="margin:0 0 4px"><strong style="font-size:13px">BÁO CÁO HIỆU SUẤT — ${selectedBrand.toUpperCase()}</strong><br>${weekInfo.label} | ${weekInfo.start} – ${weekInfo.end}${!weekInfo.isFull ? ` (${weekInfo.days} ngày)` : ''}</p>`
    body += `<hr style="border:1px solid #ccc;margin:8px 0">`

    /* ── TỔNG 2 SÀN ── */
    if (shopeeChecked && tiktokChecked) {
      body += `<p style="margin:6px 0 2px"><strong>━━━ TỔNG 2 SÀN ━━━</strong></p>`
      body += `<table style="${tblStyle}"><thead>${hdr}</thead><tbody>`
      const totPlanCpM =
        pM('s_cpc_chi_phi') +
        pM('s_nd_chi_phi') +
        pM('s_live_chi_phi') +
        pM('t_pgm_chi_phi') +
        pM('t_lgm_chi_phi') +
        pM('t_con_chi_phi') +
        pM('t_brd_chi_phi')
      const cpKeys = [
        's_cpc_chi_phi',
        's_nd_chi_phi',
        's_live_chi_phi',
        't_pgm_chi_phi',
        't_lgm_chi_phi',
        't_con_chi_phi',
        't_brd_chi_phi',
      ]
      const mtdTotCp = getMTD(w => getHistCp(w))
      body += wRow(
        'GMV Ads tổng',
        totPlanGmvM || null,
        mtdTotGmv,
        w => getHistGmv(w),
        w => getPlanGmvW(w) || null,
      )
      body += wRow(
        'Chi phí tổng',
        totPlanCpM || null,
        mtdTotCp,
        w => getHistCp(w),
        w => cpKeys.reduce((a, k) => a + pW(k, w), 0) || null,
      )
      body += dRow(
        'ROAS tổng',
        totPlanCpM ? totPlanGmvM / totPlanCpM : null,
        mtdTotCp ? mtdTotGmv / mtdTotCp : null,
        w => {
          const g = getHistGmv(w),
            c = getHistCp(w)
          return g !== null && c ? g / c : null
        },
        w => {
          const g = getPlanGmvW(w)
          const c = cpKeys.reduce((a, k) => a + pW(k, w), 0)
          return c ? g / c : null
        },
        fmtX,
      )
      body += `</tbody></table>`
    }

    /* ── SHOPEE ADS ── */
    if (shopeeChecked) {
      body += `<p style="margin:10px 0 2px"><strong>━━━ SHOPEE ADS ━━━</strong></p>`
      body += `<table style="${tblStyle}"><thead>${hdr}</thead><tbody>`
      body += wRow(
        'Doanh thu Ads (GMV)',
        sPlanGmvM || null,
        getMTD(
          w => (hRow('s_cpc_doanh_so', w) || 0) + (hRow('s_nd_gmv', w) || 0) + (hRow('s_live_gmv', w) || 0),
        ),
        w => (hRow('s_cpc_doanh_so', w) || 0) + (hRow('s_nd_gmv', w) || 0) + (hRow('s_live_gmv', w) || 0),
        w => pW('s_cpc_doanh_so', w) + pW('s_nd_gmv', w) + pW('s_live_gmv', w) || null,
      )
      body += wRow(
        'Chi phí Ads tổng',
        pM('s_cpc_chi_phi') + pM('s_nd_chi_phi') + pM('s_live_chi_phi') || null,
        getMTD(
          w =>
            (hRow('s_cpc_chi_phi', w) || 0) +
            (hRow('s_nd_chi_phi', w) || 0) +
            (hRow('s_live_chi_phi', w) || 0),
        ),
        w =>
          (hRow('s_cpc_chi_phi', w) || 0) + (hRow('s_nd_chi_phi', w) || 0) + (hRow('s_live_chi_phi', w) || 0),
        w => pW('s_cpc_chi_phi', w) + pW('s_nd_chi_phi', w) + pW('s_live_chi_phi', w) || null,
      )
      body += dRow(
        'ROAS Ads tổng',
        ratioPM('s_cpc_doanh_so', 's_cpc_chi_phi'),
        ratioMTD('s_cpc_doanh_so', 's_cpc_chi_phi'),
        w => ratioW('s_cpc_doanh_so', 's_cpc_chi_phi', w),
        w => ratioPW('s_cpc_doanh_so', 's_cpc_chi_phi', w),
        fmtX,
      )
      body += `</tbody></table>`

      // Ads CPC
      body += `<p style="font-size:13px;font-weight:700;color:#1a2e5c;margin:6px 0 2px">Ads CPC</p>`
      body += `<table style="${tblStyle}"><thead>${hdr}</thead><tbody>`
      body += wRow(
        'Doanh số Ads',
        pM('s_cpc_doanh_so') || null,
        getMTD(w => hRow('s_cpc_doanh_so', w) || 0),
        w => hRow('s_cpc_doanh_so', w),
        w => pW('s_cpc_doanh_so', w) || null,
      )
      body += wRow(
        'Chi Phí Dịch vụ hiển thị',
        pM('s_cpc_chi_phi') || null,
        getMTD(w => hRow('s_cpc_chi_phi', w) || 0),
        w => hRow('s_cpc_chi_phi', w),
        w => pW('s_cpc_chi_phi', w) || null,
      )
      body += dRow(
        'ROAS',
        ratioPM('s_cpc_doanh_so', 's_cpc_chi_phi'),
        ratioMTD('s_cpc_doanh_so', 's_cpc_chi_phi'),
        w => ratioW('s_cpc_doanh_so', 's_cpc_chi_phi', w),
        w => ratioPW('s_cpc_doanh_so', 's_cpc_chi_phi', w),
        fmtX,
      )
      body += dRow(
        'CPC = Chi phí / Lượt click',
        ratioPM('s_cpc_chi_phi', 's_cpc_luot_click'),
        ratioMTD('s_cpc_chi_phi', 's_cpc_luot_click'),
        w => ratioW('s_cpc_chi_phi', 's_cpc_luot_click', w),
        w => ratioPW('s_cpc_chi_phi', 's_cpc_luot_click', w),
        fmtCPC,
      )
      body += dRow(
        'CTR (%)',
        ratioPM('s_cpc_luot_click', 's_cpc_luot_xem') !== null
          ? (ratioPM('s_cpc_luot_click', 's_cpc_luot_xem') as number) * 100
          : null,
        ratioMTD('s_cpc_luot_click', 's_cpc_luot_xem') !== null
          ? (ratioMTD('s_cpc_luot_click', 's_cpc_luot_xem') as number) * 100
          : null,
        w => {
          const v = ratioW('s_cpc_luot_click', 's_cpc_luot_xem', w)
          return v !== null ? v * 100 : null
        },
        w => {
          const v = ratioPW('s_cpc_luot_click', 's_cpc_luot_xem', w)
          return v !== null ? v * 100 : null
        },
        fmtPct,
      )
      body += dRow(
        'CR = Đơn hàng / Lượt click*100 (%)',
        ratioPM('s_cpc_don_hang', 's_cpc_luot_click') !== null
          ? (ratioPM('s_cpc_don_hang', 's_cpc_luot_click') as number) * 100
          : null,
        ratioMTD('s_cpc_don_hang', 's_cpc_luot_click') !== null
          ? (ratioMTD('s_cpc_don_hang', 's_cpc_luot_click') as number) * 100
          : null,
        w => {
          const v = ratioW('s_cpc_don_hang', 's_cpc_luot_click', w)
          return v !== null ? v * 100 : null
        },
        w => {
          const v = ratioPW('s_cpc_don_hang', 's_cpc_luot_click', w)
          return v !== null ? v * 100 : null
        },
        fmtPct,
      )
      body += wRow(
        'Số lượt xem',
        pM('s_cpc_luot_xem') || null,
        getMTD(w => hRow('s_cpc_luot_xem', w) || 0),
        w => hRow('s_cpc_luot_xem', w),
        w => pW('s_cpc_luot_xem', w) || null,
        fmtN,
      )
      body += wRow(
        'Số lượt click',
        pM('s_cpc_luot_click') || null,
        getMTD(w => hRow('s_cpc_luot_click', w) || 0),
        w => hRow('s_cpc_luot_click', w),
        w => pW('s_cpc_luot_click', w) || null,
        fmtN,
      )
      body += wRow(
        'Số đơn hàng',
        pM('s_cpc_don_hang') || null,
        getMTD(w => hRow('s_cpc_don_hang', w) || 0),
        w => hRow('s_cpc_don_hang', w),
        w => pW('s_cpc_don_hang', w) || null,
        fmtN,
      )
      body += dRow(
        'AOV = Doanh thu / Số đơn hàng',
        ratioPM('s_cpc_doanh_so', 's_cpc_don_hang'),
        ratioMTD('s_cpc_doanh_so', 's_cpc_don_hang'),
        w => ratioW('s_cpc_doanh_so', 's_cpc_don_hang', w),
        w => ratioPW('s_cpc_doanh_so', 's_cpc_don_hang', w),
        fmtMoney,
      )
      body += `</tbody></table>`

      if (hasSectionData(['s_nd_gmv', 's_nd_chi_phi', 's_nd_luot_xem', 's_nd_luot_click'])) {
        body += `<p style="font-size:13px;font-weight:700;color:#1a2e5c;margin:6px 0 2px">Ads nhận diện thương hiệu</p>`
        body += `<table style="${tblStyle}"><thead>${hdr}</thead><tbody>`
        body += wRow(
          'Doanh thu Ads (GMV)',
          pM('s_nd_gmv') || null,
          getMTD(w => hRow('s_nd_gmv', w) || 0),
          w => hRow('s_nd_gmv', w),
          w => pW('s_nd_gmv', w) || null,
        )
        body += wRow(
          'Chi phí ads',
          pM('s_nd_chi_phi') || null,
          getMTD(w => hRow('s_nd_chi_phi', w) || 0),
          w => hRow('s_nd_chi_phi', w),
          w => pW('s_nd_chi_phi', w) || null,
        )
        body += dRow(
          'ROAS ads',
          ratioPM('s_nd_gmv', 's_nd_chi_phi'),
          ratioMTD('s_nd_gmv', 's_nd_chi_phi'),
          w => ratioW('s_nd_gmv', 's_nd_chi_phi', w),
          w => ratioPW('s_nd_gmv', 's_nd_chi_phi', w),
          fmtX,
        )
        body += dRow(
          'CTR (%)',
          ratioPM('s_nd_luot_click', 's_nd_luot_xem') !== null
            ? (ratioPM('s_nd_luot_click', 's_nd_luot_xem') as number) * 100
            : null,
          ratioMTD('s_nd_luot_click', 's_nd_luot_xem') !== null
            ? (ratioMTD('s_nd_luot_click', 's_nd_luot_xem') as number) * 100
            : null,
          w => {
            const v = ratioW('s_nd_luot_click', 's_nd_luot_xem', w)
            return v !== null ? v * 100 : null
          },
          w => {
            const v = ratioPW('s_nd_luot_click', 's_nd_luot_xem', w)
            return v !== null ? v * 100 : null
          },
          fmtPct,
        )
        body += wRow(
          'Số lượt xem',
          pM('s_nd_luot_xem') || null,
          getMTD(w => hRow('s_nd_luot_xem', w) || 0),
          w => hRow('s_nd_luot_xem', w),
          w => pW('s_nd_luot_xem', w) || null,
          fmtN,
        )
        body += wRow(
          'Số lượt click',
          pM('s_nd_luot_click') || null,
          getMTD(w => hRow('s_nd_luot_click', w) || 0),
          w => hRow('s_nd_luot_click', w),
          w => pW('s_nd_luot_click', w) || null,
          fmtN,
        )
        body += `</tbody></table>`
      }
      if (hasSectionData(['s_live_gmv', 's_live_chi_phi', 's_live_luot_xem'])) {
        body += `<p style="font-size:13px;font-weight:700;color:#1a2e5c;margin:6px 0 2px">Ads livestream</p>`
        body += `<table style="${tblStyle}"><thead>${hdr}</thead><tbody>`
        body += wRow(
          'Doanh thu Ads (GMV)',
          pM('s_live_gmv') || null,
          getMTD(w => hRow('s_live_gmv', w) || 0),
          w => hRow('s_live_gmv', w),
          w => pW('s_live_gmv', w) || null,
        )
        body += wRow(
          'Chi phí ads',
          pM('s_live_chi_phi') || null,
          getMTD(w => hRow('s_live_chi_phi', w) || 0),
          w => hRow('s_live_chi_phi', w),
          w => pW('s_live_chi_phi', w) || null,
        )
        body += dRow(
          'ROAS ads',
          ratioPM('s_live_gmv', 's_live_chi_phi'),
          ratioMTD('s_live_gmv', 's_live_chi_phi'),
          w => ratioW('s_live_gmv', 's_live_chi_phi', w),
          w => ratioPW('s_live_gmv', 's_live_chi_phi', w),
          fmtX,
        )
        body += wRow(
          'Lượt xem',
          pM('s_live_luot_xem') || null,
          getMTD(w => hRow('s_live_luot_xem', w) || 0),
          w => hRow('s_live_luot_xem', w),
          w => pW('s_live_luot_xem', w) || null,
          fmtN,
        )
        body += `</tbody></table>`
      }
    }

    /* ── TIKTOK SHOP ── */
    if (tiktokChecked) {
      body += `<p style="margin:10px 0 2px"><strong>━━━ TIKTOK SHOP ━━━</strong></p>`
      body += `<table style="${tblStyle}"><thead>${hdr}</thead><tbody>`
      const tCpKeys = ['t_pgm_chi_phi', 't_lgm_chi_phi', 't_con_chi_phi', 't_brd_chi_phi']
      const tPlanCpM = tCpKeys.reduce((a, k) => a + pM(k), 0)
      body += wRow(
        'Doanh thu Ads (GMV)',
        tPlanGmvM || null,
        getMTD(w => (hRow('t_pgm_doanh_so', w) || 0) + (hRow('t_lgm_doanhthu', w) || 0)),
        w => (hRow('t_pgm_doanh_so', w) || 0) + (hRow('t_lgm_doanhthu', w) || 0),
        w => pW('t_pgm_doanh_so', w) + pW('t_lgm_doanhthu', w) || null,
      )
      body += wRow(
        'Chi phí Ads',
        tPlanCpM || null,
        getMTD(w => tCpKeys.reduce((a, k) => a + (hRow(k, w) || 0), 0)),
        w => tCpKeys.reduce((a, k) => a + (hRow(k, w) || 0), 0),
        w => tCpKeys.reduce((a, k) => a + pW(k, w), 0) || null,
      )
      body += dRow(
        'ROI',
        tPlanCpM ? tPlanGmvM / tPlanCpM : null,
        (() => {
          const g = getMTD(w => (hRow('t_pgm_doanh_so', w) || 0) + (hRow('t_lgm_doanhthu', w) || 0))
          const c = getMTD(w => tCpKeys.reduce((a, k) => a + (hRow(k, w) || 0), 0))
          return c ? g / c : null
        })(),
        w => {
          const g = (hRow('t_pgm_doanh_so', w) || 0) + (hRow('t_lgm_doanhthu', w) || 0)
          const c = tCpKeys.reduce((a, k) => a + (hRow(k, w) || 0), 0)
          return c ? g / c : null
        },
        w => {
          const g = pW('t_pgm_doanh_so', w) + pW('t_lgm_doanhthu', w)
          const c = tCpKeys.reduce((a, k) => a + pW(k, w), 0)
          return c ? g / c : null
        },
        fmtX,
      )
      body += `</tbody></table>`

      // PGM
      body += `<p style="font-size:13px;font-weight:700;color:#1a2e5c;margin:6px 0 2px">Ads_PGM</p>`
      body += `<table style="${tblStyle}"><thead>${hdr}</thead><tbody>`
      body += wRow(
        'Doanh số Ads',
        pM('t_pgm_doanh_so') || null,
        getMTD(w => hRow('t_pgm_doanh_so', w) || 0),
        w => hRow('t_pgm_doanh_so', w),
        w => pW('t_pgm_doanh_so', w) || null,
      )
      body += wRow(
        'Chi Phí Dịch vụ hiển thị',
        pM('t_pgm_chi_phi') || null,
        getMTD(w => hRow('t_pgm_chi_phi', w) || 0),
        w => hRow('t_pgm_chi_phi', w),
        w => pW('t_pgm_chi_phi', w) || null,
      )
      body += dRow(
        'ROAS',
        ratioPM('t_pgm_doanh_so', 't_pgm_chi_phi'),
        ratioMTD('t_pgm_doanh_so', 't_pgm_chi_phi'),
        w => ratioW('t_pgm_doanh_so', 't_pgm_chi_phi', w),
        w => ratioPW('t_pgm_doanh_so', 't_pgm_chi_phi', w),
        fmtX,
      )
      body += dRow(
        'CPC = Chi phí / Lượt click',
        ratioPM('t_pgm_chi_phi', 't_pgm_luot_click'),
        ratioMTD('t_pgm_chi_phi', 't_pgm_luot_click'),
        w => ratioW('t_pgm_chi_phi', 't_pgm_luot_click', w),
        w => ratioPW('t_pgm_chi_phi', 't_pgm_luot_click', w),
        fmtCPC,
      )
      body += dRow(
        'CTR (%)',
        ratioPM('t_pgm_luot_click', 't_pgm_luot_xem') !== null
          ? (ratioPM('t_pgm_luot_click', 't_pgm_luot_xem') as number) * 100
          : null,
        ratioMTD('t_pgm_luot_click', 't_pgm_luot_xem') !== null
          ? (ratioMTD('t_pgm_luot_click', 't_pgm_luot_xem') as number) * 100
          : null,
        w => {
          const v = ratioW('t_pgm_luot_click', 't_pgm_luot_xem', w)
          return v !== null ? v * 100 : null
        },
        w => {
          const v = ratioPW('t_pgm_luot_click', 't_pgm_luot_xem', w)
          return v !== null ? v * 100 : null
        },
        fmtPct,
      )
      body += dRow(
        'CR = Đơn hàng / Lượt click*100 (%)',
        ratioPM('t_pgm_don_hang', 't_pgm_luot_click') !== null
          ? (ratioPM('t_pgm_don_hang', 't_pgm_luot_click') as number) * 100
          : null,
        ratioMTD('t_pgm_don_hang', 't_pgm_luot_click') !== null
          ? (ratioMTD('t_pgm_don_hang', 't_pgm_luot_click') as number) * 100
          : null,
        w => {
          const v = ratioW('t_pgm_don_hang', 't_pgm_luot_click', w)
          return v !== null ? v * 100 : null
        },
        w => {
          const v = ratioPW('t_pgm_don_hang', 't_pgm_luot_click', w)
          return v !== null ? v * 100 : null
        },
        fmtPct,
      )
      body += dRow(
        'CPM',
        ratioPM('t_pgm_chi_phi', 't_pgm_luot_xem') !== null
          ? (ratioPM('t_pgm_chi_phi', 't_pgm_luot_xem') as number) * 1000
          : null,
        ratioMTD('t_pgm_chi_phi', 't_pgm_luot_xem') !== null
          ? (ratioMTD('t_pgm_chi_phi', 't_pgm_luot_xem') as number) * 1000
          : null,
        w => {
          const v = ratioW('t_pgm_chi_phi', 't_pgm_luot_xem', w)
          return v !== null ? v * 1000 : null
        },
        w => {
          const v = ratioPW('t_pgm_chi_phi', 't_pgm_luot_xem', w)
          return v !== null ? v * 1000 : null
        },
        fmtMoney,
      )
      body += wRow(
        'Số lượt xem',
        pM('t_pgm_luot_xem') || null,
        getMTD(w => hRow('t_pgm_luot_xem', w) || 0),
        w => hRow('t_pgm_luot_xem', w),
        w => pW('t_pgm_luot_xem', w) || null,
        fmtN,
      )
      body += wRow(
        'Số lượt click',
        pM('t_pgm_luot_click') || null,
        getMTD(w => hRow('t_pgm_luot_click', w) || 0),
        w => hRow('t_pgm_luot_click', w),
        w => pW('t_pgm_luot_click', w) || null,
        fmtN,
      )
      body += wRow(
        'Số đơn hàng',
        pM('t_pgm_don_hang') || null,
        getMTD(w => hRow('t_pgm_don_hang', w) || 0),
        w => hRow('t_pgm_don_hang', w),
        w => pW('t_pgm_don_hang', w) || null,
        fmtN,
      )
      body += dRow(
        'AOV = Doanh thu / Số đơn hàng',
        ratioPM('t_pgm_doanh_so', 't_pgm_don_hang'),
        ratioMTD('t_pgm_doanh_so', 't_pgm_don_hang'),
        w => ratioW('t_pgm_doanh_so', 't_pgm_don_hang', w),
        w => ratioPW('t_pgm_doanh_so', 't_pgm_don_hang', w),
        fmtMoney,
      )
      body += `</tbody></table>`

      // LGM
      body += `<p style="font-size:13px;font-weight:700;color:#1a2e5c;margin:6px 0 2px">Ads_LGM</p>`
      body += `<table style="${tblStyle}"><thead>${hdr}</thead><tbody>`
      body += wRow(
        'Doanh thu LGM',
        pM('t_lgm_doanhthu') || null,
        getMTD(w => hRow('t_lgm_doanhthu', w) || 0),
        w => hRow('t_lgm_doanhthu', w),
        w => pW('t_lgm_doanhthu', w) || null,
      )
      body += wRow(
        'Chi phí',
        pM('t_lgm_chi_phi') || null,
        getMTD(w => hRow('t_lgm_chi_phi', w) || 0),
        w => hRow('t_lgm_chi_phi', w),
        w => pW('t_lgm_chi_phi', w) || null,
      )
      body += dRow(
        'ROI',
        ratioPM('t_lgm_doanhthu', 't_lgm_chi_phi'),
        ratioMTD('t_lgm_doanhthu', 't_lgm_chi_phi'),
        w => ratioW('t_lgm_doanhthu', 't_lgm_chi_phi', w),
        w => ratioPW('t_lgm_doanhthu', 't_lgm_chi_phi', w),
        fmtX,
      )
      body += `</tbody></table>`

      if (hasSectionData(['t_con_nguoi', 't_con_chi_phi'])) {
        body += `<p style="font-size:13px;font-weight:700;color:#1a2e5c;margin:6px 0 2px">Consideration_Ads</p>`
        body += `<table style="${tblStyle}"><thead>${hdr}</thead><tbody>`
        body += wRow(
          'Consider (Số người nhận biết thương hiệu)',
          pM('t_con_nguoi') || null,
          getMTD(w => hRow('t_con_nguoi', w) || 0),
          w => hRow('t_con_nguoi', w),
          w => pW('t_con_nguoi', w) || null,
          fmtN,
        )
        body += wRow(
          'Chi phí',
          pM('t_con_chi_phi') || null,
          getMTD(w => hRow('t_con_chi_phi', w) || 0),
          w => hRow('t_con_chi_phi', w),
          w => pW('t_con_chi_phi', w) || null,
        )
        body += dRow(
          'CPA',
          ratioPM('t_con_chi_phi', 't_con_nguoi'),
          ratioMTD('t_con_chi_phi', 't_con_nguoi'),
          w => ratioW('t_con_chi_phi', 't_con_nguoi', w),
          w => ratioPW('t_con_chi_phi', 't_con_nguoi', w),
          fmtMoney,
        )
        body += `</tbody></table>`
      }
      if (hasSectionData(['t_brd_view', 't_brd_follow', 't_brd_chi_phi'])) {
        body += `<p style="font-size:13px;font-weight:700;color:#1a2e5c;margin:6px 0 2px">Branding_Ads</p>`
        body += `<table style="${tblStyle}"><thead>${hdr}</thead><tbody>`
        body += wRow(
          'View',
          pM('t_brd_view') || null,
          getMTD(w => hRow('t_brd_view', w) || 0),
          w => hRow('t_brd_view', w),
          w => pW('t_brd_view', w) || null,
          fmtN,
        )
        body += wRow(
          'Follow',
          pM('t_brd_follow') || null,
          getMTD(w => hRow('t_brd_follow', w) || 0),
          w => hRow('t_brd_follow', w),
          w => pW('t_brd_follow', w) || null,
          fmtN,
        )
        body += wRow(
          'Chi phí',
          pM('t_brd_chi_phi') || null,
          getMTD(w => hRow('t_brd_chi_phi', w) || 0),
          w => hRow('t_brd_chi_phi', w),
          w => pW('t_brd_chi_phi', w) || null,
        )
        body += dRow(
          'CPA',
          ratioPM('t_brd_chi_phi', 't_brd_follow'),
          ratioMTD('t_brd_chi_phi', 't_brd_follow'),
          w => ratioW('t_brd_chi_phi', 't_brd_follow', w),
          w => ratioPW('t_brd_chi_phi', 't_brd_follow', w),
          fmtMoney,
        )
        body += `</tbody></table>`
      }
    }

    /* ── HIGHLIGHT / LOWLIGHT ── */
    const F = `font-family:'Times New Roman',serif`
    const cmpct = `border-collapse:collapse;width:100%;max-width:860px;${F};font-size:11px;margin:4px 0 10px;table-layout:fixed`
    const thHL = (c: string) =>
      `padding:5px 10px;border:1px solid #999;background:${c};color:#fff;text-align:center;width:50%;${F};font-size:11px;font-weight:700`
    const tdHL = `padding:8px 10px;border:1px solid #ccc;vertical-align:top;${F};font-size:11px;line-height:1.5;word-wrap:break-word`
    body += `<hr style="border:none;border-top:1.5px solid #1a2e5c;margin:12px 0 8px">`
    body += `<table style="${cmpct}"><thead><tr><th style="${thHL('#1a5c2e')}">Highlight</th><th style="${thHL('#5c1a1a')}">Lowlight</th></tr></thead><tbody><tr><td style="${tdHL}">${(aiResult.highlight || '—').replace(/\n/g, '<br>')}</td><td style="${tdHL}">${(aiResult.lowlight || '—').replace(/\n/g, '<br>')}</td></tr></tbody></table>`

    /* ── V2 Matrix: Sàn × Hạng mục × {Plan, Actual, Đánh giá, Giải pháp} ── */
    const nl = (v: string) => (v || '—').replace(/\n/g, '<br>')
    const thSummary = (w: string) =>
      `padding:6px 8px;border:1px solid #999;background:#1a2e5c;color:#fff;${F};font-size:11px;text-align:center;width:${w};font-weight:700`
    const tdSm = (extra = '') =>
      `padding:6px 8px;border:1px solid #ccc;${F};font-size:11px;vertical-align:top;line-height:1.55;word-wrap:break-word;${extra}`

    // Visible rows in matrix order, filtered by platform check
    const matrixRows = AI_MATRIX_KEYS.filter(k => {
      const platform = AI_MATRIX_LABEL[k].platform
      if (platform === 'Shopee') return shopeeChecked
      if (platform === 'TikTok') return tiktokChecked
      return true
    })

    body += `<hr style="border:none;border-top:1px solid #ccc;margin:10px 0 8px">`
    body += `<table style="${cmpct}"><thead><tr>`
    body += `<th style="${thSummary('7%')}">Sàn</th>`
    body += `<th style="${thSummary('12%')}">Hạng mục</th>`
    body += `<th style="${thSummary('20%')}">Plan / Đề xuất tuần trước</th>`
    body += `<th style="${thSummary('19%')}">Actual</th>`
    body += `<th style="${thSummary('20%')}">Đánh giá</th>`
    body += `<th style="${thSummary('22%')}">Giải pháp / Đề xuất</th>`
    body += `</tr></thead><tbody>`

    // Group consecutive rows by platform for rowspan
    let i = 0
    while (i < matrixRows.length) {
      const platform = AI_MATRIX_LABEL[matrixRows[i]].platform
      let j = i
      while (j < matrixRows.length && AI_MATRIX_LABEL[matrixRows[j]].platform === platform) j++
      const groupLen = j - i
      const platformColor =
        platform === 'Shopee' ? 'background:#fef3c7;color:#92400e' : 'background:#ede9fe;color:#5b21b6'
      for (let k = i; k < j; k++) {
        const rowKey = matrixRows[k]
        const cell = aiResult[rowKey]
        const labelInfo = AI_MATRIX_LABEL[rowKey]
        body += `<tr>`
        if (k === i) {
          body += `<td rowspan="${groupLen}" style="${tdSm(`text-align:center;font-weight:700;vertical-align:middle;${platformColor}`)}">${platform}</td>`
        }
        body += `<td style="${tdSm('font-weight:600')}">${labelInfo.label}</td>`
        body += `<td style="${tdSm()}">${nl(cell.plan)}</td>`
        body += `<td style="${tdSm()}">${nl(cell.actual)}</td>`
        body += `<td style="${tdSm()}">${nl(cell.danh_gia)}</td>`
        body += `<td style="${tdSm()}">${nl(cell.giai_phap)}</td>`
        body += `</tr>`
      }
      i = j
    }
    body += `</tbody></table>`
    body += `<hr style="border:1px solid #ccc;margin:10px 0">`
    body += `<p style="color:#555;font-size:14px">Reported by: ${user?.name || ''} | ${fmtDate(new Date())}</p>`
    body += `</div>`
    return body
  }

  /* ── Export Preview XLSX (matching mail preview format) ── */
  function exportPreviewXlsx() {
    if (!weekInfo) return
    const totalWeeks = getWeeksInMonth(weekInfo.month, weekInfo.year)
    const weeksList = Array.from({ length: totalWeeks }, (_, i) => i + 1)
    const plan = (k: string) => (shopeePlan?.[k] || tiktokPlan?.[k]) as Record<string, number> | undefined
    const pW = (f: string, w: number) => Number(plan(f)?.[`w${w}`]) || 0
    const pM = (f: string) => Number(plan(f)?.month) || 0
    const curData: Record<string, number> = { ...shopeeData, ...tiktokData }
    const hRow = (f: string, w: number): number | null => {
      if (w === weekInfo.weekNum) return Number(curData[f] || 0)
      const r = weekHistory.find(h => parseInt(String(h.week_num)) === w)
      if (!r) return null
      const v = parseFloat(String(r[f] || 0))
      return isNaN(v) ? 0 : v
    }
    const getMTD = (getter: (w: number) => number | null) =>
      weeksList
        .filter(w => w <= weekInfo.weekNum)
        .reduce((a, w) => {
          const v = getter(w)
          return a + (v !== null ? v : 0)
        }, 0)
    const ratioW = (nF: string, dF: string, w: number) => {
      const n = hRow(nF, w),
        d = hRow(dF, w)
      if (d === null || !d) return null
      return n! / d
    }
    const ratioPW = (nF: string, dF: string, w: number) => {
      const d = pW(dF, w)
      return d ? pW(nF, w) / d : null
    }
    const ratioPM = (nF: string, dF: string) => {
      const d = pM(dF)
      return d ? pM(nF) / d : null
    }
    const ratioMTD = (nF: string, dF: string) => {
      const num = getMTD(w => hRow(nF, w) || 0)
      const den = getMTD(w => hRow(dF, w) || 0)
      return den ? num / den : null
    }
    const hasSectionData = (keys: string[]) => {
      if (
        keys.some(k => {
          const p = plan(k)
          return p && Object.values(p).some(v => parseFloat(String(v)) > 0)
        })
      )
        return true
      if (keys.some(k => parseFloat(String(curData[k] || 0)) > 0)) return true
      if (weekHistory.length && keys.some(k => weekHistory.some(h => parseFloat(String(h[k] || 0)) > 0)))
        return true
      return false
    }
    const fmtV = (v: number | null) =>
      v !== null && v !== undefined && !isNaN(v) ? parseFloat(String(v)).toFixed(2) : null
    const pctStr = (act: number | null, pl: number | null): string | null => {
      if (!pl || act === null || act === undefined) return null
      return Math.round((act / pl) * 100) + '%'
    }
    const wHeaders = weeksList.flatMap(w => [`W${w} Plan`, `W${w} Thực hiện`, `W${w} %TH`])
    const vRow = (
      label: string,
      planMth: number | null,
      mtdAct: number | null,
      getAct: ((w: number) => number | null) | null,
      getPlanFn: ((w: number) => number | null) | null,
    ): (string | number | null)[] => {
      const wCells = weeksList.flatMap(w => {
        const pw = getPlanFn ? getPlanFn(w) : null
        const act = getAct ? getAct(w) : null
        return [pw ? Math.round(pw) : null, act !== null ? Math.round(act) : null, pctStr(act, pw)]
      })
      return [
        label,
        planMth ? Math.round(planMth) : null,
        mtdAct !== null && !isNaN(mtdAct) ? Math.round(mtdAct) : null,
        pctStr(mtdAct, planMth),
        ...wCells,
      ]
    }
    const dRow = (
      label: string,
      planMth: number | null,
      mtdAct: number | null,
      getAct: ((w: number) => number | null) | null,
      getPlanFn: ((w: number) => number | null) | null,
    ): (string | number | null)[] => {
      const wCells = weeksList.flatMap(w => {
        const pw = getPlanFn ? getPlanFn(w) : null
        const act = getAct ? getAct(w) : null
        return [pw ? fmtV(pw) : null, act !== null ? fmtV(act) : null, pctStr(act, pw)]
      })
      return [
        label,
        planMth ? fmtV(planMth) : null,
        mtdAct !== null && !isNaN(mtdAct) ? fmtV(mtdAct) : null,
        pctStr(mtdAct, planMth),
        ...wCells,
      ]
    }

    const rows: (string | number | null)[][] = []
    rows.push([`BÁO CÁO HIỆU SUẤT — ${selectedBrand.toUpperCase()}`])
    rows.push([`${weekInfo.label} | ${weekInfo.start} – ${weekInfo.end}`])
    rows.push([`Reported by: ${user?.name || ''} | ${fmtDate(new Date())}`])
    rows.push([])
    rows.push(['Metric', 'Tháng (Plan)', 'Luỹ tiến', '% TH', ...wHeaders])

    /* Helpers for combined platform totals */
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
      if (shopeeChecked)
        g +=
          parseFloat(String(r.s_cpc_doanh_so || 0)) +
          parseFloat(String(r.s_nd_gmv || 0)) +
          parseFloat(String(r.s_live_gmv || 0))
      if (tiktokChecked)
        g += parseFloat(String(r.t_pgm_doanh_so || 0)) + parseFloat(String(r.t_lgm_doanhthu || 0))
      return g
    }
    const getHistCp = (w: number): number | null => {
      const r = weekHistory.find(h => parseInt(String(h.week_num)) === w)
      if (w === weekInfo.weekNum) {
        let c = 0
        if (shopeeChecked) c += shopeeData.s_cpc_chi_phi + shopeeData.s_nd_chi_phi + shopeeData.s_live_chi_phi
        if (tiktokChecked)
          c +=
            tiktokData.t_pgm_chi_phi +
            tiktokData.t_lgm_chi_phi +
            tiktokData.t_con_chi_phi +
            tiktokData.t_brd_chi_phi
        return c
      }
      if (!r) return null
      let c = 0
      if (shopeeChecked)
        c +=
          parseFloat(String(r.s_cpc_chi_phi || 0)) +
          parseFloat(String(r.s_nd_chi_phi || 0)) +
          parseFloat(String(r.s_live_chi_phi || 0))
      if (tiktokChecked)
        c +=
          parseFloat(String(r.t_pgm_chi_phi || 0)) +
          parseFloat(String(r.t_lgm_chi_phi || 0)) +
          parseFloat(String(r.t_con_chi_phi || 0)) +
          parseFloat(String(r.t_brd_chi_phi || 0))
      return c
    }
    const getPlanGmvW = (w: number): number => {
      let g = 0
      if (shopeeChecked) g += pW('s_cpc_doanh_so', w) + pW('s_nd_gmv', w) + pW('s_live_gmv', w)
      if (tiktokChecked) g += pW('t_pgm_doanh_so', w) + pW('t_lgm_doanhthu', w)
      return g
    }

    /* TỔNG 2 SÀN */
    if (shopeeChecked && tiktokChecked) {
      const sPlanGmvM = pM('s_cpc_doanh_so') + pM('s_nd_gmv') + pM('s_live_gmv')
      const tPlanGmvM = pM('t_pgm_doanh_so') + pM('t_lgm_doanhthu')
      const totPlanGmvM = sPlanGmvM + tPlanGmvM
      const cpKeys = [
        's_cpc_chi_phi',
        's_nd_chi_phi',
        's_live_chi_phi',
        't_pgm_chi_phi',
        't_lgm_chi_phi',
        't_con_chi_phi',
        't_brd_chi_phi',
      ]
      const totPlanCpM = cpKeys.reduce((a, k) => a + pM(k), 0)
      const mtdTotCp = getMTD(w => getHistCp(w))
      const mtdTotGmv = getMTD(w => getHistGmv(w))
      rows.push([])
      rows.push(['━━━ TỔNG 2 SÀN ━━━'])
      rows.push(
        vRow(
          'GMV Ads tổng',
          totPlanGmvM || null,
          mtdTotGmv,
          w => getHistGmv(w),
          w => getPlanGmvW(w) || null,
        ),
      )
      rows.push(
        vRow(
          'Chi phí tổng',
          totPlanCpM || null,
          mtdTotCp,
          w => getHistCp(w),
          w => cpKeys.reduce((a, k) => a + pW(k, w), 0) || null,
        ),
      )
      rows.push(
        dRow(
          'ROAS tổng',
          totPlanCpM ? totPlanGmvM / totPlanCpM : null,
          mtdTotCp ? mtdTotGmv / mtdTotCp : null,
          w => {
            const g = getHistGmv(w),
              c = getHistCp(w)
            return g !== null && c ? g / c : null
          },
          w => {
            const g = getPlanGmvW(w)
            const c = cpKeys.reduce((a, k) => a + pW(k, w), 0)
            return c ? g / c : null
          },
        ),
      )
    }

    /* SHOPEE */
    if (shopeeChecked) {
      const sPlanGmvM = pM('s_cpc_doanh_so') + pM('s_nd_gmv') + pM('s_live_gmv')
      rows.push([])
      rows.push(['━━━ SHOPEE ADS ━━━'])
      rows.push(
        vRow(
          'Doanh thu Ads (GMV)',
          sPlanGmvM || null,
          getMTD(
            w => (hRow('s_cpc_doanh_so', w) || 0) + (hRow('s_nd_gmv', w) || 0) + (hRow('s_live_gmv', w) || 0),
          ),
          w => (hRow('s_cpc_doanh_so', w) || 0) + (hRow('s_nd_gmv', w) || 0) + (hRow('s_live_gmv', w) || 0),
          w => pW('s_cpc_doanh_so', w) + pW('s_nd_gmv', w) + pW('s_live_gmv', w) || null,
        ),
      )
      rows.push(
        vRow(
          'Chi phí Ads tổng',
          pM('s_cpc_chi_phi') + pM('s_nd_chi_phi') + pM('s_live_chi_phi') || null,
          getMTD(
            w =>
              (hRow('s_cpc_chi_phi', w) || 0) +
              (hRow('s_nd_chi_phi', w) || 0) +
              (hRow('s_live_chi_phi', w) || 0),
          ),
          w =>
            (hRow('s_cpc_chi_phi', w) || 0) +
            (hRow('s_nd_chi_phi', w) || 0) +
            (hRow('s_live_chi_phi', w) || 0),
          w => pW('s_cpc_chi_phi', w) + pW('s_nd_chi_phi', w) + pW('s_live_chi_phi', w) || null,
        ),
      )
      rows.push(
        dRow(
          'ROAS Ads tổng',
          ratioPM('s_cpc_doanh_so', 's_cpc_chi_phi'),
          ratioMTD('s_cpc_doanh_so', 's_cpc_chi_phi'),
          w => ratioW('s_cpc_doanh_so', 's_cpc_chi_phi', w),
          w => ratioPW('s_cpc_doanh_so', 's_cpc_chi_phi', w),
        ),
      )
      rows.push([])
      rows.push(['Ads CPC'])
      rows.push(
        vRow(
          'Doanh số Ads',
          pM('s_cpc_doanh_so') || null,
          getMTD(w => hRow('s_cpc_doanh_so', w) || 0),
          w => hRow('s_cpc_doanh_so', w),
          w => pW('s_cpc_doanh_so', w) || null,
        ),
      )
      rows.push(
        vRow(
          'Chi Phí Dịch vụ hiển thị',
          pM('s_cpc_chi_phi') || null,
          getMTD(w => hRow('s_cpc_chi_phi', w) || 0),
          w => hRow('s_cpc_chi_phi', w),
          w => pW('s_cpc_chi_phi', w) || null,
        ),
      )
      rows.push(
        dRow(
          'ROAS',
          ratioPM('s_cpc_doanh_so', 's_cpc_chi_phi'),
          ratioMTD('s_cpc_doanh_so', 's_cpc_chi_phi'),
          w => ratioW('s_cpc_doanh_so', 's_cpc_chi_phi', w),
          w => ratioPW('s_cpc_doanh_so', 's_cpc_chi_phi', w),
        ),
      )
      rows.push(
        dRow(
          'CPC = Chi phí / Lượt click',
          ratioPM('s_cpc_chi_phi', 's_cpc_luot_click'),
          ratioMTD('s_cpc_chi_phi', 's_cpc_luot_click'),
          w => ratioW('s_cpc_chi_phi', 's_cpc_luot_click', w),
          w => ratioPW('s_cpc_chi_phi', 's_cpc_luot_click', w),
        ),
      )
      rows.push(
        dRow(
          'CTR (%)',
          ratioPM('s_cpc_luot_click', 's_cpc_luot_xem') !== null
            ? (ratioPM('s_cpc_luot_click', 's_cpc_luot_xem') as number) * 100
            : null,
          ratioMTD('s_cpc_luot_click', 's_cpc_luot_xem') !== null
            ? (ratioMTD('s_cpc_luot_click', 's_cpc_luot_xem') as number) * 100
            : null,
          w => {
            const v = ratioW('s_cpc_luot_click', 's_cpc_luot_xem', w)
            return v !== null ? v * 100 : null
          },
          w => {
            const v = ratioPW('s_cpc_luot_click', 's_cpc_luot_xem', w)
            return v !== null ? v * 100 : null
          },
        ),
      )
      rows.push(
        dRow(
          'CR (%)',
          ratioPM('s_cpc_don_hang', 's_cpc_luot_click') !== null
            ? (ratioPM('s_cpc_don_hang', 's_cpc_luot_click') as number) * 100
            : null,
          ratioMTD('s_cpc_don_hang', 's_cpc_luot_click') !== null
            ? (ratioMTD('s_cpc_don_hang', 's_cpc_luot_click') as number) * 100
            : null,
          w => {
            const v = ratioW('s_cpc_don_hang', 's_cpc_luot_click', w)
            return v !== null ? v * 100 : null
          },
          w => {
            const v = ratioPW('s_cpc_don_hang', 's_cpc_luot_click', w)
            return v !== null ? v * 100 : null
          },
        ),
      )
      rows.push(
        vRow(
          'Số lượt xem',
          pM('s_cpc_luot_xem') || null,
          getMTD(w => hRow('s_cpc_luot_xem', w) || 0),
          w => hRow('s_cpc_luot_xem', w),
          w => pW('s_cpc_luot_xem', w) || null,
        ),
      )
      rows.push(
        vRow(
          'Số lượt click',
          pM('s_cpc_luot_click') || null,
          getMTD(w => hRow('s_cpc_luot_click', w) || 0),
          w => hRow('s_cpc_luot_click', w),
          w => pW('s_cpc_luot_click', w) || null,
        ),
      )
      rows.push(
        vRow(
          'Số đơn hàng',
          pM('s_cpc_don_hang') || null,
          getMTD(w => hRow('s_cpc_don_hang', w) || 0),
          w => hRow('s_cpc_don_hang', w),
          w => pW('s_cpc_don_hang', w) || null,
        ),
      )
      rows.push(
        dRow(
          'AOV',
          ratioPM('s_cpc_doanh_so', 's_cpc_don_hang'),
          ratioMTD('s_cpc_doanh_so', 's_cpc_don_hang'),
          w => ratioW('s_cpc_doanh_so', 's_cpc_don_hang', w),
          w => ratioPW('s_cpc_doanh_so', 's_cpc_don_hang', w),
        ),
      )
      if (hasSectionData(['s_nd_gmv', 's_nd_chi_phi', 's_nd_luot_xem', 's_nd_luot_click'])) {
        rows.push([])
        rows.push(['Ads nhận diện thương hiệu'])
        rows.push(
          vRow(
            'GMV',
            pM('s_nd_gmv') || null,
            getMTD(w => hRow('s_nd_gmv', w) || 0),
            w => hRow('s_nd_gmv', w),
            w => pW('s_nd_gmv', w) || null,
          ),
        )
        rows.push(
          vRow(
            'Chi phí',
            pM('s_nd_chi_phi') || null,
            getMTD(w => hRow('s_nd_chi_phi', w) || 0),
            w => hRow('s_nd_chi_phi', w),
            w => pW('s_nd_chi_phi', w) || null,
          ),
        )
        rows.push(
          dRow(
            'ROAS',
            ratioPM('s_nd_gmv', 's_nd_chi_phi'),
            ratioMTD('s_nd_gmv', 's_nd_chi_phi'),
            w => ratioW('s_nd_gmv', 's_nd_chi_phi', w),
            w => ratioPW('s_nd_gmv', 's_nd_chi_phi', w),
          ),
        )
        rows.push(
          vRow(
            'Lượt xem',
            pM('s_nd_luot_xem') || null,
            getMTD(w => hRow('s_nd_luot_xem', w) || 0),
            w => hRow('s_nd_luot_xem', w),
            w => pW('s_nd_luot_xem', w) || null,
          ),
        )
        rows.push(
          vRow(
            'Lượt click',
            pM('s_nd_luot_click') || null,
            getMTD(w => hRow('s_nd_luot_click', w) || 0),
            w => hRow('s_nd_luot_click', w),
            w => pW('s_nd_luot_click', w) || null,
          ),
        )
      }
      if (hasSectionData(['s_live_gmv', 's_live_chi_phi', 's_live_luot_xem'])) {
        rows.push([])
        rows.push(['Ads livestream'])
        rows.push(
          vRow(
            'GMV',
            pM('s_live_gmv') || null,
            getMTD(w => hRow('s_live_gmv', w) || 0),
            w => hRow('s_live_gmv', w),
            w => pW('s_live_gmv', w) || null,
          ),
        )
        rows.push(
          vRow(
            'Chi phí',
            pM('s_live_chi_phi') || null,
            getMTD(w => hRow('s_live_chi_phi', w) || 0),
            w => hRow('s_live_chi_phi', w),
            w => pW('s_live_chi_phi', w) || null,
          ),
        )
        rows.push(
          dRow(
            'ROAS',
            ratioPM('s_live_gmv', 's_live_chi_phi'),
            ratioMTD('s_live_gmv', 's_live_chi_phi'),
            w => ratioW('s_live_gmv', 's_live_chi_phi', w),
            w => ratioPW('s_live_gmv', 's_live_chi_phi', w),
          ),
        )
        rows.push(
          vRow(
            'Lượt xem',
            pM('s_live_luot_xem') || null,
            getMTD(w => hRow('s_live_luot_xem', w) || 0),
            w => hRow('s_live_luot_xem', w),
            w => pW('s_live_luot_xem', w) || null,
          ),
        )
      }
    }

    /* TIKTOK */
    if (tiktokChecked) {
      const tPlanGmvM = pM('t_pgm_doanh_so') + pM('t_lgm_doanhthu')
      const tCpKeys = ['t_pgm_chi_phi', 't_lgm_chi_phi', 't_con_chi_phi', 't_brd_chi_phi']
      const tPlanCpM = tCpKeys.reduce((a, k) => a + pM(k), 0)
      rows.push([])
      rows.push(['━━━ TIKTOK SHOP ━━━'])
      rows.push(
        vRow(
          'Doanh thu Ads (GMV)',
          tPlanGmvM || null,
          getMTD(w => (hRow('t_pgm_doanh_so', w) || 0) + (hRow('t_lgm_doanhthu', w) || 0)),
          w => (hRow('t_pgm_doanh_so', w) || 0) + (hRow('t_lgm_doanhthu', w) || 0),
          w => pW('t_pgm_doanh_so', w) + pW('t_lgm_doanhthu', w) || null,
        ),
      )
      rows.push(
        vRow(
          'Chi phí Ads',
          tPlanCpM || null,
          getMTD(w => tCpKeys.reduce((a, k) => a + (hRow(k, w) || 0), 0)),
          w => tCpKeys.reduce((a, k) => a + (hRow(k, w) || 0), 0),
          w => tCpKeys.reduce((a, k) => a + pW(k, w), 0) || null,
        ),
      )
      rows.push(
        dRow(
          'ROI',
          tPlanCpM ? tPlanGmvM / tPlanCpM : null,
          (() => {
            const g = getMTD(w => (hRow('t_pgm_doanh_so', w) || 0) + (hRow('t_lgm_doanhthu', w) || 0))
            const c = getMTD(w => tCpKeys.reduce((a, k) => a + (hRow(k, w) || 0), 0))
            return c ? g / c : null
          })(),
          w => {
            const g = (hRow('t_pgm_doanh_so', w) || 0) + (hRow('t_lgm_doanhthu', w) || 0)
            const c = tCpKeys.reduce((a, k) => a + (hRow(k, w) || 0), 0)
            return c ? g / c : null
          },
          w => {
            const g = pW('t_pgm_doanh_so', w) + pW('t_lgm_doanhthu', w)
            const c = tCpKeys.reduce((a, k) => a + pW(k, w), 0)
            return c ? g / c : null
          },
        ),
      )
      rows.push([])
      rows.push(['Ads_PGM'])
      rows.push(
        vRow(
          'Doanh số Ads',
          pM('t_pgm_doanh_so') || null,
          getMTD(w => hRow('t_pgm_doanh_so', w) || 0),
          w => hRow('t_pgm_doanh_so', w),
          w => pW('t_pgm_doanh_so', w) || null,
        ),
      )
      rows.push(
        vRow(
          'Chi phí',
          pM('t_pgm_chi_phi') || null,
          getMTD(w => hRow('t_pgm_chi_phi', w) || 0),
          w => hRow('t_pgm_chi_phi', w),
          w => pW('t_pgm_chi_phi', w) || null,
        ),
      )
      rows.push(
        dRow(
          'ROAS',
          ratioPM('t_pgm_doanh_so', 't_pgm_chi_phi'),
          ratioMTD('t_pgm_doanh_so', 't_pgm_chi_phi'),
          w => ratioW('t_pgm_doanh_so', 't_pgm_chi_phi', w),
          w => ratioPW('t_pgm_doanh_so', 't_pgm_chi_phi', w),
        ),
      )
      rows.push(
        dRow(
          'CPC',
          ratioPM('t_pgm_chi_phi', 't_pgm_luot_click'),
          ratioMTD('t_pgm_chi_phi', 't_pgm_luot_click'),
          w => ratioW('t_pgm_chi_phi', 't_pgm_luot_click', w),
          w => ratioPW('t_pgm_chi_phi', 't_pgm_luot_click', w),
        ),
      )
      rows.push(
        dRow(
          'CTR (%)',
          ratioPM('t_pgm_luot_click', 't_pgm_luot_xem') !== null
            ? (ratioPM('t_pgm_luot_click', 't_pgm_luot_xem') as number) * 100
            : null,
          ratioMTD('t_pgm_luot_click', 't_pgm_luot_xem') !== null
            ? (ratioMTD('t_pgm_luot_click', 't_pgm_luot_xem') as number) * 100
            : null,
          w => {
            const v = ratioW('t_pgm_luot_click', 't_pgm_luot_xem', w)
            return v !== null ? v * 100 : null
          },
          w => {
            const v = ratioPW('t_pgm_luot_click', 't_pgm_luot_xem', w)
            return v !== null ? v * 100 : null
          },
        ),
      )
      rows.push(
        dRow(
          'CR (%)',
          ratioPM('t_pgm_don_hang', 't_pgm_luot_click') !== null
            ? (ratioPM('t_pgm_don_hang', 't_pgm_luot_click') as number) * 100
            : null,
          ratioMTD('t_pgm_don_hang', 't_pgm_luot_click') !== null
            ? (ratioMTD('t_pgm_don_hang', 't_pgm_luot_click') as number) * 100
            : null,
          w => {
            const v = ratioW('t_pgm_don_hang', 't_pgm_luot_click', w)
            return v !== null ? v * 100 : null
          },
          w => {
            const v = ratioPW('t_pgm_don_hang', 't_pgm_luot_click', w)
            return v !== null ? v * 100 : null
          },
        ),
      )
      rows.push(
        dRow(
          'CPM',
          ratioPM('t_pgm_chi_phi', 't_pgm_luot_xem') !== null
            ? (ratioPM('t_pgm_chi_phi', 't_pgm_luot_xem') as number) * 1000
            : null,
          ratioMTD('t_pgm_chi_phi', 't_pgm_luot_xem') !== null
            ? (ratioMTD('t_pgm_chi_phi', 't_pgm_luot_xem') as number) * 1000
            : null,
          w => {
            const v = ratioW('t_pgm_chi_phi', 't_pgm_luot_xem', w)
            return v !== null ? v * 1000 : null
          },
          w => {
            const v = ratioPW('t_pgm_chi_phi', 't_pgm_luot_xem', w)
            return v !== null ? v * 1000 : null
          },
        ),
      )
      rows.push(
        vRow(
          'Lượt xem',
          pM('t_pgm_luot_xem') || null,
          getMTD(w => hRow('t_pgm_luot_xem', w) || 0),
          w => hRow('t_pgm_luot_xem', w),
          w => pW('t_pgm_luot_xem', w) || null,
        ),
      )
      rows.push(
        vRow(
          'Lượt click',
          pM('t_pgm_luot_click') || null,
          getMTD(w => hRow('t_pgm_luot_click', w) || 0),
          w => hRow('t_pgm_luot_click', w),
          w => pW('t_pgm_luot_click', w) || null,
        ),
      )
      rows.push(
        vRow(
          'Đơn hàng',
          pM('t_pgm_don_hang') || null,
          getMTD(w => hRow('t_pgm_don_hang', w) || 0),
          w => hRow('t_pgm_don_hang', w),
          w => pW('t_pgm_don_hang', w) || null,
        ),
      )
      rows.push(
        dRow(
          'AOV',
          ratioPM('t_pgm_doanh_so', 't_pgm_don_hang'),
          ratioMTD('t_pgm_doanh_so', 't_pgm_don_hang'),
          w => ratioW('t_pgm_doanh_so', 't_pgm_don_hang', w),
          w => ratioPW('t_pgm_doanh_so', 't_pgm_don_hang', w),
        ),
      )
      rows.push([])
      rows.push(['Ads_LGM'])
      rows.push(
        vRow(
          'Doanh thu LGM',
          pM('t_lgm_doanhthu') || null,
          getMTD(w => hRow('t_lgm_doanhthu', w) || 0),
          w => hRow('t_lgm_doanhthu', w),
          w => pW('t_lgm_doanhthu', w) || null,
        ),
      )
      rows.push(
        vRow(
          'Chi phí',
          pM('t_lgm_chi_phi') || null,
          getMTD(w => hRow('t_lgm_chi_phi', w) || 0),
          w => hRow('t_lgm_chi_phi', w),
          w => pW('t_lgm_chi_phi', w) || null,
        ),
      )
      rows.push(
        dRow(
          'ROI',
          ratioPM('t_lgm_doanhthu', 't_lgm_chi_phi'),
          ratioMTD('t_lgm_doanhthu', 't_lgm_chi_phi'),
          w => ratioW('t_lgm_doanhthu', 't_lgm_chi_phi', w),
          w => ratioPW('t_lgm_doanhthu', 't_lgm_chi_phi', w),
        ),
      )
      if (hasSectionData(['t_con_nguoi', 't_con_chi_phi'])) {
        rows.push([])
        rows.push(['Consideration_Ads'])
        rows.push(
          vRow(
            'Người tiếp cận',
            pM('t_con_nguoi') || null,
            getMTD(w => hRow('t_con_nguoi', w) || 0),
            w => hRow('t_con_nguoi', w),
            w => pW('t_con_nguoi', w) || null,
          ),
        )
        rows.push(
          vRow(
            'Chi phí',
            pM('t_con_chi_phi') || null,
            getMTD(w => hRow('t_con_chi_phi', w) || 0),
            w => hRow('t_con_chi_phi', w),
            w => pW('t_con_chi_phi', w) || null,
          ),
        )
        rows.push(
          dRow(
            'CPA',
            ratioPM('t_con_chi_phi', 't_con_nguoi'),
            ratioMTD('t_con_chi_phi', 't_con_nguoi'),
            w => ratioW('t_con_chi_phi', 't_con_nguoi', w),
            w => ratioPW('t_con_chi_phi', 't_con_nguoi', w),
          ),
        )
      }
      if (hasSectionData(['t_brd_view', 't_brd_follow', 't_brd_chi_phi'])) {
        rows.push([])
        rows.push(['Branding_Ads'])
        rows.push(
          vRow(
            'View',
            pM('t_brd_view') || null,
            getMTD(w => hRow('t_brd_view', w) || 0),
            w => hRow('t_brd_view', w),
            w => pW('t_brd_view', w) || null,
          ),
        )
        rows.push(
          vRow(
            'Follow',
            pM('t_brd_follow') || null,
            getMTD(w => hRow('t_brd_follow', w) || 0),
            w => hRow('t_brd_follow', w),
            w => pW('t_brd_follow', w) || null,
          ),
        )
        rows.push(
          vRow(
            'Chi phí',
            pM('t_brd_chi_phi') || null,
            getMTD(w => hRow('t_brd_chi_phi', w) || 0),
            w => hRow('t_brd_chi_phi', w),
            w => pW('t_brd_chi_phi', w) || null,
          ),
        )
        rows.push(
          dRow(
            'CPA',
            ratioPM('t_brd_chi_phi', 't_brd_follow'),
            ratioMTD('t_brd_chi_phi', 't_brd_follow'),
            w => ratioW('t_brd_chi_phi', 't_brd_follow', w),
            w => ratioPW('t_brd_chi_phi', 't_brd_follow', w),
          ),
        )
      }
    }

    /* HIGHLIGHT / LOWLIGHT */
    rows.push([])
    rows.push(['HIGHLIGHT', 'LOWLIGHT'])
    rows.push([aiResult.highlight || '—', aiResult.lowlight || '—'])

    /* AI MATRIX V2: 7 hạng mục × {Plan, Actual, Đánh giá, Giải pháp} */
    rows.push([])
    rows.push(['Sàn', 'Hạng mục', 'Plan / Đề xuất tuần trước', 'Actual', 'Đánh giá', 'Giải pháp / Đề xuất'])
    AI_MATRIX_KEYS.forEach(rowKey => {
      const info = AI_MATRIX_LABEL[rowKey]
      if (info.platform === 'Shopee' && !shopeeChecked) return
      if (info.platform === 'TikTok' && !tiktokChecked) return
      const cell = aiResult[rowKey]
      rows.push([
        info.platform,
        info.label,
        cell.plan || '',
        cell.actual || '',
        cell.danh_gia || '',
        cell.giai_phap || '',
      ])
    })

    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [
      { wch: 38 },
      { wch: 14 },
      { wch: 14 },
      { wch: 10 },
      ...Array(weeksList.length * 3)
        .fill(null)
        .map(() => ({ wch: 13 })),
    ]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Report')
    XLSX.writeFile(
      wb,
      `Preview_${selectedBrand || 'Brand'}_T${weekInfo.month}_W${weekInfo.weekNum}_${weekInfo.year}.xlsx`,
    )
    showToast('Đã export Preview XLSX!')
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
    const ai_matrix = AI_MATRIX_KEYS.reduce<Record<string, unknown>>((acc, k) => {
      acc[k] = aiResult[k]
      return acc
    }, {})
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
      // Legacy V1 aggregate columns — derived from V2 matrix in parseAIResult,
      // kept for backward compat with old UI / queries.
      nhan_xet_thuc_trang:
        (shopeeChecked ? aiResult.shopee_thuc_trang : '') +
        (tiktokChecked ? '\n' + aiResult.tiktok_thuc_trang : ''),
      nhan_xet_van_de:
        (shopeeChecked ? aiResult.shopee_van_de : '') + (tiktokChecked ? '\n' + aiResult.tiktok_van_de : ''),
      nhan_xet_giai_phap:
        (shopeeChecked ? aiResult.shopee_giai_phap : '') +
        (tiktokChecked ? '\n' + aiResult.tiktok_giai_phap : ''),
      // V2 matrix — writes 28 cells (server only writes if migration 05 applied)
      ai_matrix,
    }
    const r = await fetch('/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
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
        ;['w1', 'w2', 'w3', 'w4', 'w5', 'month'].forEach(w => {
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
          ;(['w1', 'w2', 'w3', 'w4', 'w5', 'month'] as const).forEach(w => {
            const raw = planRawInputs[`${plat}_${mk}_${w}`] ?? planInputs[`${plat}_${mk}_${w}`] ?? ''
            plan_data[mk][w] = parseVN(raw)
          })
        })
        await fetch('/api/report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'savePlan',
            brand_name: selectedBrand,
            platform: plat,
            month: weekInfo.month,
            year: weekInfo.year,
            plan_data,
            created_by: user?.username,
          }),
        })
        return plan_data
      }
      if (shopeeChecked) {
        const pd = await saveOne('shopee')
        setShopeePlan(pd)
      }
      if (tiktokChecked) {
        const pd = await saveOne('tiktok')
        setTiktokPlan(pd)
      }
      setHasPlan(true)
      setPlanModal(false)
      showToast('Đã lưu Plan!')
    } catch {
      showToast('Lỗi lưu Plan', 'error')
    }
  }

  // Plan metric keys — full 25 keys (same as Actual)
  const planMetricKeys = [
    's_cpc_doanh_so',
    's_cpc_chi_phi',
    's_cpc_luot_xem',
    's_cpc_luot_click',
    's_cpc_don_hang',
    's_nd_gmv',
    's_nd_chi_phi',
    's_nd_luot_xem',
    's_nd_luot_click',
    's_live_gmv',
    's_live_chi_phi',
    's_live_luot_xem',
    't_pgm_doanh_so',
    't_pgm_chi_phi',
    't_pgm_luot_xem',
    't_pgm_luot_click',
    't_pgm_don_hang',
    't_lgm_doanhthu',
    't_lgm_chi_phi',
    't_con_nguoi',
    't_con_chi_phi',
    't_brd_view',
    't_brd_follow',
    't_brd_chi_phi',
  ]

  const planMetricLabels: Record<string, string> = {
    s_cpc_doanh_so: 'Doanh số',
    s_cpc_chi_phi: 'Chi phí',
    s_cpc_luot_xem: 'Lượt xem',
    s_cpc_luot_click: 'Lượt click',
    s_cpc_don_hang: 'Đơn hàng',
    s_nd_gmv: 'GMV',
    s_nd_chi_phi: 'Chi phí',
    s_nd_luot_xem: 'Lượt xem',
    s_nd_luot_click: 'Lượt click',
    s_live_gmv: 'GMV',
    s_live_chi_phi: 'Chi phí',
    s_live_luot_xem: 'Lượt xem',
    t_pgm_doanh_so: 'Doanh số',
    t_pgm_chi_phi: 'Chi phí',
    t_pgm_luot_xem: 'Lượt xem',
    t_pgm_luot_click: 'Lượt click',
    t_pgm_don_hang: 'Đơn hàng',
    t_lgm_doanhthu: 'Doanh thu Live',
    t_lgm_chi_phi: 'Chi phí',
    t_con_nguoi: 'Người tiếp cận',
    t_con_chi_phi: 'Chi phí',
    t_brd_view: 'View',
    t_brd_follow: 'Follow',
    t_brd_chi_phi: 'Chi phí',
  }

  // Section grouping for plan modal & xlsx templates
  const PLAN_SECTIONS: { id: string; label: string; plat: 'shopee' | 'tiktok'; keys: string[] }[] = [
    {
      id: 'cpc',
      label: 'SHOPEE — Quảng cáo CPC',
      plat: 'shopee',
      keys: ['s_cpc_doanh_so', 's_cpc_chi_phi', 's_cpc_luot_xem', 's_cpc_luot_click', 's_cpc_don_hang'],
    },
    {
      id: 'nd',
      label: 'SHOPEE — Nhận Diện thương hiệu',
      plat: 'shopee',
      keys: ['s_nd_gmv', 's_nd_chi_phi', 's_nd_luot_xem', 's_nd_luot_click'],
    },
    {
      id: 'live',
      label: 'SHOPEE — Livestream',
      plat: 'shopee',
      keys: ['s_live_gmv', 's_live_chi_phi', 's_live_luot_xem'],
    },
    {
      id: 'pgm',
      label: 'TIKTOK — PGM (Product GMV)',
      plat: 'tiktok',
      keys: ['t_pgm_doanh_so', 't_pgm_chi_phi', 't_pgm_luot_xem', 't_pgm_luot_click', 't_pgm_don_hang'],
    },
    {
      id: 'lgm',
      label: 'TIKTOK — LGM (Live GMV)',
      plat: 'tiktok',
      keys: ['t_lgm_doanhthu', 't_lgm_chi_phi'],
    },
    { id: 'con', label: 'TIKTOK — Consideration', plat: 'tiktok', keys: ['t_con_nguoi', 't_con_chi_phi'] },
    {
      id: 'brd',
      label: 'TIKTOK — Branding',
      plat: 'tiktok',
      keys: ['t_brd_view', 't_brd_follow', 't_brd_chi_phi'],
    },
  ]

  // Filter plan keys based on selected platforms
  const activePlanKeys = planMetricKeys.filter(k => {
    if (k.startsWith('s_') && !shopeeChecked) return false
    if (k.startsWith('t_') && !tiktokChecked) return false
    return true
  })

  /* ── Build Chart (always 10 fixed weeks ending at current week) ── */
  const buildChart = useCallback(() => {
    if (!chartRef.current || !weekInfo) return
    if (chartInstRef.current) {
      chartInstRef.current.destroy()
      chartInstRef.current = null
    }

    const curSGmv = shopeeData.s_cpc_doanh_so + shopeeData.s_nd_gmv + shopeeData.s_live_gmv
    const curSCp = shopeeData.s_cpc_chi_phi + shopeeData.s_nd_chi_phi + shopeeData.s_live_chi_phi
    const curTGmv = tiktokData.t_pgm_doanh_so + tiktokData.t_lgm_doanhthu
    const curTCp =
      tiktokData.t_pgm_chi_phi +
      tiktokData.t_lgm_chi_phi +
      tiktokData.t_con_chi_phi +
      tiktokData.t_brd_chi_phi

    /* Build 10 fixed week slots: walk back month-by-month from current month
       (collect all weeks of each month), dedup, sort ascending, take last 10
       ending at the current selected week. */
    type Slot = { year: number; month: number; week: number; startISO: string; label: string }
    const slots: Slot[] = []
    let cy = weekInfo.year,
      cm = weekInfo.month
    let safety = 0
    while (slots.length < 30 && safety < 24) {
      const wcount = getWeeksInMonth(cm, cy)
      for (let w = 1; w <= wcount; w++) {
        try {
          const wi = getWeekInfo(cm, cy, w)
          slots.push({
            year: cy,
            month: cm,
            week: w,
            startISO: wi.startISO,
            label: `W${w} ${wi.start.substring(0, 5)}–${wi.end.substring(0, 5)}`,
          })
        } catch {}
      }
      cm -= 1
      if (cm < 1) {
        cm = 12
        cy -= 1
      }
      safety++
    }
    const seen = new Set<string>()
    const uniq = slots.filter(s => {
      const k = `${s.year}-${s.month}-${s.week}`
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
    uniq.sort((a, b) => a.startISO.localeCompare(b.startISO))
    const curIdxInUniq = uniq.findIndex(
      s => s.year === weekInfo.year && s.month === weekInfo.month && s.week === weekInfo.weekNum,
    )
    let chosen: Slot[]
    if (curIdxInUniq >= 0) {
      const end = curIdxInUniq + 1
      const start = Math.max(0, end - 10)
      chosen = uniq.slice(start, end)
    } else {
      chosen = uniq.slice(Math.max(0, uniq.length - 10))
    }

    type R = Record<string, number | string | null>
    const histIdx: Record<string, R> = {}
    ;(chartHistory as R[]).forEach(r => {
      const k = `${parseInt(String(r.year))}-${parseInt(String(r.month))}-${parseInt(String(r.week_num))}`
      histIdx[k] = r
    })

    const labels: string[] = []
    const gmvData: (number | null)[] = []
    const cpData: (number | null)[] = []
    const cpDtData: (number | null)[] = []
    chosen.forEach(s => {
      labels.push(s.label)
      const isCur = s.year === weekInfo.year && s.month === weekInfo.month && s.week === weekInfo.weekNum
      let g = 0,
        c = 0,
        hasData = false
      if (isCur) {
        g = (shopeeChecked ? curSGmv : 0) + (tiktokChecked ? curTGmv : 0)
        c = (shopeeChecked ? curSCp : 0) + (tiktokChecked ? curTCp : 0)
        hasData = g > 0 || c > 0
      } else {
        const r = histIdx[`${s.year}-${s.month}-${s.week}`]
        if (r) {
          g =
            (shopeeChecked ? n(r.s_cpc_doanh_so) + n(r.s_nd_gmv) + n(r.s_live_gmv) : 0) +
            (tiktokChecked ? n(r.t_pgm_doanh_so) + n(r.t_lgm_doanhthu) : 0)
          c =
            (shopeeChecked ? n(r.s_cpc_chi_phi) + n(r.s_nd_chi_phi) + n(r.s_live_chi_phi) : 0) +
            (tiktokChecked
              ? n(r.t_pgm_chi_phi) + n(r.t_lgm_chi_phi) + n(r.t_con_chi_phi) + n(r.t_brd_chi_phi)
              : 0)
          hasData = g > 0 || c > 0
        }
      }
      gmvData.push(hasData ? g : null)
      cpData.push(hasData ? c : null)
      cpDtData.push(hasData && g ? parseFloat(((c / g) * 100).toFixed(1)) : null)
    })

    chartInstRef.current = new Chart(chartRef.current, {
      data: {
        labels,
        datasets: [
          { type: 'bar', label: 'GMV', data: gmvData, backgroundColor: 'rgba(37,99,235,0.7)', yAxisID: 'y' },
          {
            type: 'bar',
            label: 'Chi phí',
            data: cpData,
            backgroundColor: 'rgba(220,38,38,0.6)',
            yAxisID: 'y',
          },
          {
            type: 'line',
            label: '%CP/DT',
            data: cpDtData,
            borderColor: '#F59E0B',
            backgroundColor: 'transparent',
            yAxisID: 'y2',
            tension: 0.3,
            pointRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: {
          y: { ticks: { callback: (v: unknown) => (Number(v) / 1e6).toFixed(0) + 'M', font: { size: 11 } } },
          y2: {
            position: 'right',
            grid: { drawOnChartArea: false },
            ticks: { callback: (v: unknown) => v + '%', font: { size: 11 } },
            suggestedMax: 100,
          },
        },
      },
      plugins: [
        {
          id: 'capture-dataurl',
          afterRender: (c: Chart) => {
            try {
              setChartDataUrl(c.canvas.toDataURL('image/png'))
            } catch {}
          },
        },
      ],
    })
  }, [weekInfo, chartHistory, shopeeChecked, tiktokChecked, shopeeData, tiktokData])

  /* ── Build chart when step 3 mounts ── */
  useEffect(() => {
    if (step === 3) {
      setTimeout(buildChart, 50)
    }
    return () => {
      if (chartInstRef.current) {
        chartInstRef.current.destroy()
        chartInstRef.current = null
      }
    }
  }, [step, buildChart])

  /* ── Re-render mail HTML when chart dataURL becomes available ── */
  useEffect(() => {
    if (step === 3 && chartDataUrl) {
      setMailHTML(buildMailHTML())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartDataUrl, step])

  /* ── XLSX helpers ── */
  /* Plan template: grouped by section, header [Section, Metric, Tháng, W1..W5, key] */
  function downloadPlanTemplateXlsx() {
    if (!weekInfo) return
    const headers = ['Section', 'Metric', 'Tháng', 'W1', 'W2', 'W3', 'W4', 'W5', 'key']
    const rows: (string | number)[][] = [headers]
    const sectionRowIdx: number[] = []
    PLAN_SECTIONS.forEach(sec => {
      const keys = sec.keys.filter(k => activePlanKeys.includes(k))
      if (keys.length === 0) return
      // Section divider row
      sectionRowIdx.push(rows.length)
      rows.push([sec.label, '', '', '', '', '', '', '', ''])
      keys.forEach(mk => {
        const label = planMetricLabels[mk] || mk
        const plat = sec.plat
        const get = (w: string) =>
          parseVN(planRawInputs[`${plat}_${mk}_${w}`] ?? planInputs[`${plat}_${mk}_${w}`] ?? '')
        const existing = plat === 'shopee' ? shopeePlan : tiktokPlan
        const v = (w: string) => {
          const inp = get(w)
          if (inp) return inp
          return existing?.[mk]?.[w as 'w1'] || 0
        }
        rows.push([sec.label, label, v('month'), v('w1'), v('w2'), v('w3'), v('w4'), v('w5'), mk])
      })
    })
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [
      { wch: 24 },
      { wch: 22 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 28 },
    ]
    // Apply basic styles (header + section dividers) — best-effort, supported by xlsx-js-style fork; community xlsx ignores silently.
    const headerStyle = {
      fill: { fgColor: { rgb: '1A2E5C' } },
      font: { color: { rgb: 'FFFFFF' }, bold: true },
      alignment: { horizontal: 'center', vertical: 'center' },
    }
    const sectionStyle = { fill: { fgColor: { rgb: 'E5E7EB' } }, font: { bold: true, italic: true } }
    for (let c = 0; c < headers.length; c++) {
      const ref = XLSX.utils.encode_cell({ r: 0, c })
      if (ws[ref]) (ws[ref] as { s?: unknown }).s = headerStyle
    }
    sectionRowIdx.forEach(r => {
      for (let c = 0; c < headers.length; c++) {
        const ref = XLSX.utils.encode_cell({ r, c })
        if (ws[ref]) (ws[ref] as { s?: unknown }).s = sectionStyle
      }
    })
    XLSX.utils.book_append_sheet(wb, ws, 'Plan')
    XLSX.writeFile(wb, `Plan_${selectedBrand}_T${weekInfo.month}_${weekInfo.year}.xlsx`)
    showToast('Đã export Plan XLSX!')
  }

  /* Plan upload: parse XLSX → fill planInputs / planRawInputs.
     New format: [Section, Metric, Tháng, W1..W5, key] — key in last column. */
  function uploadPlanXlsx(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: 'binary' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json<(string | number)[]>(ws, { header: 1, defval: '' }) as (
          | string
          | number
        )[][]
        const newInp = { ...planInputs }
        const newRaw = { ...planRawInputs }
        data.slice(1).forEach(row => {
          // key is in the last column (legacy: idx 7, new: idx 8). Try last non-empty cell that matches a known key.
          let key = ''
          for (let i = row.length - 1; i >= 0; i--) {
            const v = String(row[i] || '').trim()
            if (planMetricKeys.includes(v)) {
              key = v
              break
            }
          }
          if (!key) return
          const plat = key.startsWith('s_') ? 'shopee' : 'tiktok'
          const periods = ['month', 'w1', 'w2', 'w3', 'w4', 'w5']
          // Detect column offset: if row has 9 cols, Metric=1, Tháng=2; else legacy Metric=0, Tháng=1
          const hasSection = row.length >= 9
          const monthCol = hasSection ? 2 : 1
          periods.forEach((p, i) => {
            const cellVal = row[monthCol + i]
            const num = parseInt(String(cellVal).replace(/[^\d-]/g, ''), 10) || 0
            newInp[`${plat}_${key}_${p}`] = String(num)
            newRaw[`${plat}_${key}_${p}`] = num ? num.toLocaleString('vi-VN') : ''
          })
        })
        setPlanInputs(newInp)
        setPlanRawInputs(newRaw)
        showToast('Đã import Plan XLSX!')
      } catch (err) {
        showToast('Lỗi đọc file: ' + String(err), 'error')
      }
    }
    reader.readAsBinaryString(file)
    e.target.value = ''
  }

  function downloadActualTemplate() {
    if (!weekInfo) return
    const headers = ['Section', 'Metric', 'Actual W', 'key']
    const rows: (string | number)[][] = [headers]
    const sectionRowIdx: number[] = []
    PLAN_SECTIONS.forEach(sec => {
      sectionRowIdx.push(rows.length)
      rows.push([sec.label, '', '', ''])
      sec.keys.forEach(mk => {
        const label = planMetricLabels[mk] || mk
        const dataObj = mk.startsWith('s_') ? shopeeData : tiktokData
        const val = (dataObj[mk as keyof ShopeeData & keyof TiktokData] as number) || 0
        rows.push([sec.label, label, val, mk])
      })
    })
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{ wch: 24 }, { wch: 22 }, { wch: 16 }, { wch: 28 }]
    const headerStyle = {
      fill: { fgColor: { rgb: '1A2E5C' } },
      font: { color: { rgb: 'FFFFFF' }, bold: true },
      alignment: { horizontal: 'center', vertical: 'center' },
    }
    const sectionStyle = { fill: { fgColor: { rgb: 'E5E7EB' } }, font: { bold: true, italic: true } }
    for (let c = 0; c < headers.length; c++) {
      const ref = XLSX.utils.encode_cell({ r: 0, c })
      if (ws[ref]) (ws[ref] as { s?: unknown }).s = headerStyle
    }
    sectionRowIdx.forEach(r => {
      for (let c = 0; c < headers.length; c++) {
        const ref = XLSX.utils.encode_cell({ r, c })
        if (ws[ref]) (ws[ref] as { s?: unknown }).s = sectionStyle
      }
    })
    XLSX.utils.book_append_sheet(wb, ws, 'Actual')
    XLSX.writeFile(
      wb,
      `Actual_${selectedBrand}_T${weekInfo.month}_W${weekInfo.weekNum}_${weekInfo.year}.xlsx`,
    )
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
        const data = XLSX.utils.sheet_to_json<(string | number)[]>(ws, { header: 1, defval: '' }) as (
          | string
          | number
        )[][]
        const newShopee = { ...shopeeData }
        const newTiktok = { ...tiktokData }
        data.slice(1).forEach(row => {
          // Find key in last column matching known metric keys
          let key = ''
          let keyIdx = -1
          for (let i = row.length - 1; i >= 0; i--) {
            const v = String(row[i] || '').trim()
            if (planMetricKeys.includes(v)) {
              key = v
              keyIdx = i
              break
            }
          }
          if (!key) return
          // Actual W is the column immediately before key
          const valCol = keyIdx - 1
          const val = parseFloat(String(row[valCol]).replace(/[^\d.]/g, '')) || 0
          if (key.startsWith('s_') && key in newShopee) (newShopee as Record<string, number>)[key] = val
          if (key.startsWith('t_') && key in newTiktok) (newTiktok as Record<string, number>)[key] = val
        })
        setShopeeData(newShopee)
        setTiktokData(newTiktok)
        showToast('Đã import Actual XLSX!')
      } catch (err) {
        showToast('Lỗi đọc file: ' + String(err), 'error')
      }
    }
    reader.readAsBinaryString(file)
    e.target.value = ''
  }

  /* ── Shopee calcs for display ── */
  const cpcC = calcCPC(shopeeData)
  const ndC = calcND(shopeeData)
  const liveC = calcLive(shopeeData)
  const sTotalGMV = shopeeData.s_cpc_doanh_so + shopeeData.s_nd_gmv + shopeeData.s_live_gmv
  const sTotalCP = shopeeData.s_cpc_chi_phi + shopeeData.s_nd_chi_phi + shopeeData.s_live_chi_phi
  const sTotalROAS = sTotalCP ? +(sTotalGMV / sTotalCP).toFixed(2) : 0

  /* ── TikTok calcs for display ── */
  const pgmC = calcPGM(tiktokData)
  const lgmC = calcLGM(tiktokData)
  const conC = calcCon(tiktokData)
  const brdC = calcBrd(tiktokData)
  const tTotalGMV = tiktokData.t_pgm_doanh_so + tiktokData.t_lgm_doanhthu
  const tTotalCP =
    tiktokData.t_pgm_chi_phi + tiktokData.t_lgm_chi_phi + tiktokData.t_con_chi_phi + tiktokData.t_brd_chi_phi
  const tTotalROI = tTotalCP ? +(tTotalGMV / tTotalCP).toFixed(2) : 0

  const wk = weekInfo ? (`w${weekInfo.weekNum}` as 'w1' | 'w2' | 'w3' | 'w4' | 'w5' | 'month') : 'w1'

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
    const newRaw: Record<string, string> = { ...rawInputs }
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
  function planKeyCell(plat: string, mk: string, w: string) {
    return `${plat}_${mk}_${w}`
  }
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
  /* Plan paste: vertical fills metrics down (in active keys for that platform), horizontal fills periods (w1→w2→...→month) */
  const PLAN_PERIOD_ORDER_PASTE = ['w1', 'w2', 'w3', 'w4', 'w5', 'month'] as const
  function handlePlanPaste(e: React.ClipboardEvent<HTMLInputElement>, plat: string, mk: string, w: string) {
    const text = e.clipboardData.getData('text')
    const lines = text.split(/\r?\n/).filter(l => l !== '')
    const grid = lines.map(l => l.split('\t'))
    if (grid.length === 1 && grid[0].length === 1) return
    e.preventDefault()
    const platKeys = activePlanKeys.filter(k => k.startsWith(plat === 'shopee' ? 's_' : 't_'))
    const startMetricIdx = platKeys.indexOf(mk)
    const startPeriodIdx = PLAN_PERIOD_ORDER_PASTE.indexOf(w as (typeof PLAN_PERIOD_ORDER_PASTE)[number])
    if (startMetricIdx === -1 || startPeriodIdx === -1) return
    const newInp = { ...planInputs }
    const newRaw = { ...planRawInputs }
    grid.forEach((cols, dr) => {
      const tgtMk = platKeys[startMetricIdx + dr]
      if (!tgtMk) return
      cols.forEach((cell, dc) => {
        const tgtPeriod = PLAN_PERIOD_ORDER_PASTE[startPeriodIdx + dc]
        if (!tgtPeriod) return
        const num = parseInt(String(cell).replace(/[^\d-]/g, ''), 10) || 0
        const cellKey = `${plat}_${tgtMk}_${tgtPeriod}`
        newInp[cellKey] = String(num)
        newRaw[cellKey] = num ? num.toLocaleString('vi-VN') : ''
      })
    })
    setPlanInputs(newInp)
    setPlanRawInputs(newRaw)
  }

  /* Sum W1..W5 for a metric to show alongside Month */
  function sumWeeksForMetric(plat: string, mk: string): number {
    let s = 0
    ;(['w1', 'w2', 'w3', 'w4', 'w5'] as const).forEach(w => {
      const key = planKeyCell(plat, mk, w)
      s += parseVN(planRawInputs[key] ?? planInputs[key] ?? '')
    })
    return s
  }
  if (!user) return null

  /* ════════════════════════
     RENDER
  ════════════════════════ */
  return (
    <>
      <div className="rw" style={{ paddingTop: 16 }}>
        {/* Toast */}
        <div id="toast" className={toast ? 'show' : ''}>
          <span
            className="toast-dot"
            style={{ background: toast?.type === 'error' ? '#EF4444' : '#10B981' }}
          />
          {toast?.msg}
        </div>

        {/* Header */}
        <div className="rw-hdr">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              Weekly Report Tool
            </h1>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn-s"
                style={{ fontSize: '.8rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                onClick={() => {
                  setPromptInput(effectivePrompt)
                  setPromptModal(true)
                }}
              >
                <span style={{ display: 'inline-flex' }}>{Icon.edit(13)}</span>AI Prompt
              </button>
              <button
                className="btn-s"
                style={{ fontSize: '.8rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                onClick={() => {
                  setKeyInput(
                    typeof window !== 'undefined' ? localStorage.getItem('mo_openai_key') || '' : '',
                  )
                  setKeyModal(true)
                }}
              >
                <span style={{ display: 'inline-flex', color: '#fbbf24' }}>{Icon.key(13)}</span>API Key
              </button>
            </div>
          </div>
          <p>
            Nhập data Actual → AI generate nhận xét → Copy mail gửi Lark. Framework DARA · TikTok Shop +
            Shopee.
          </p>
        </div>

        {/* Step tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24, overflowX: 'auto' }}>
          {(
            [
              { n: 1, label: 'Context', dispLabel: '1' },
              ...(shopeeChecked || tiktokChecked
                ? [
                    {
                      n: 1.5,
                      label:
                        shopeeChecked && tiktokChecked
                          ? 'Upload file'
                          : shopeeChecked
                            ? 'Upload Shopee'
                            : 'Upload TikTok',
                      dispLabel: '2',
                    },
                  ]
                : []),
              { n: 2, label: 'Nhập Data', dispLabel: shopeeChecked || tiktokChecked ? '3' : '2' },
              { n: 3, label: 'Preview & Copy', dispLabel: shopeeChecked || tiktokChecked ? '4' : '3' },
            ] as { n: number; label: string; dispLabel: string }[]
          ).map(s => (
            <div
              key={s.n}
              className={`step-tab2 ${step === s.n ? 'active' : step > s.n ? 'done' : 'disabled'}`}
              onClick={() => {
                if (step > s.n) setStep(s.n)
              }}
            >
              <span className="step-num">BƯỚC {s.dispLabel}</span>
              <span className="step-name">{s.label}</span>
            </div>
          ))}
        </div>

        {/* ══════════════ STEP 1 ══════════════ */}
        {step === 1 && (
          <div className="rc">
            <h2>Chọn Context</h2>
            <p>
              Chọn brand, platform, tháng và tuần cần báo cáo.{' '}
              <strong style={{ color: '#fbbf24' }}>Brand là optional</strong> — bỏ trống nếu chỉ cần upload +
              copy số nhanh (sẽ không lưu được report).
            </p>

            {/* Brand selector */}
            <div style={{ marginBottom: 14 }}>
              <label className="rl" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                Brand
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: 'rgba(148,163,184,.15)',
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '.05em',
                  }}
                >
                  Optional
                </span>
                {selectedBrand && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBrand('')
                      setBrandSearch('')
                    }}
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(239,68,68,.3)',
                      color: '#fca5a5',
                      padding: '2px 8px',
                      borderRadius: 6,
                      fontSize: 11,
                      cursor: 'pointer',
                    }}
                    title="Xoá brand đã chọn — dùng cho copy nhanh không lưu"
                  >
                    Bỏ chọn
                  </button>
                )}
              </label>
              <div className="brand-search-wrap" ref={brandRef}>
                <input
                  className="ri"
                  placeholder="Tìm brand... (hoặc bỏ trống nếu chỉ copy số)"
                  value={brandSearch}
                  onChange={e => {
                    setBrandSearch(e.target.value)
                    setShowBrandDrop(true)
                    // Clear selection if user empties the input
                    if (!e.target.value.trim()) setSelectedBrand('')
                  }}
                  onFocus={() => setShowBrandDrop(true)}
                />
                {showBrandDrop && filteredBrands.length > 0 && (
                  <div className="brand-dropdown">
                    {filteredBrands.map(b => (
                      <div
                        key={b.id}
                        className="brand-opt"
                        onClick={() => {
                          setSelectedBrand(b.brand_name)
                          setBrandSearch(b.brand_name)
                          setShowBrandDrop(false)
                        }}
                      >
                        {b.brand_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input
                  className="ri"
                  style={{ flex: 1 }}
                  placeholder="Thêm brand mới..."
                  value={addBrandInput}
                  onChange={e => setAddBrandInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addBrand()}
                />
                <button className="btn-s" onClick={addBrand}>
                  Thêm
                </button>
              </div>
              {selectedBrand && (
                <p style={{ marginTop: 6, fontSize: '.82rem', color: 'var(--blue)', fontWeight: 700 }}>
                  Đã chọn: {selectedBrand}
                </p>
              )}
              {user && brands.length === 0 && (
                <p style={{ marginTop: 6, fontSize: '.82rem', color: 'var(--warning)', fontWeight: 600 }}>
                  Bạn chưa được assign brand nào. Liên hệ Admin để được phân quyền.
                </p>
              )}
            </div>

            {/* Platform checkboxes */}
            <div style={{ marginBottom: 14 }}>
              <label className="rl">Platform</label>
              <div className="plat-row">
                <label className={`plat-chk ${shopeeChecked ? 'on' : ''}`}>
                  <input
                    type="checkbox"
                    checked={shopeeChecked}
                    onChange={e => setShopeeChecked(e.target.checked)}
                  />
                  Shopee Ads
                </label>
                <label className={`plat-chk ${tiktokChecked ? 'on' : ''}`}>
                  <input
                    type="checkbox"
                    checked={tiktokChecked}
                    onChange={e => setTiktokChecked(e.target.checked)}
                  />
                  TikTok Shop
                </label>
              </div>
            </div>

            {/* Month & Week */}
            <div className="rg" style={{ marginBottom: 14 }}>
              <div>
                <label className="rl">Tháng</label>
                <select className="rs" value={selMonth} onChange={e => setSelMonth(parseInt(e.target.value))}>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Tháng {i + 1}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="rl">Tuần</label>
                <select className="rs" value={selWeek} onChange={e => setSelWeek(parseInt(e.target.value))}>
                  {Array.from({ length: getWeeksInMonth(selMonth, selYear) }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      W{i + 1}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Week display */}
            {weekInfo && (
              <div className="wd">
                <div>
                  <div className="wd-lbl">{weekInfo.label}</div>
                  <div className="wd-rng">
                    {weekInfo.start} – {weekInfo.end}
                  </div>
                </div>
                <span className={`wd-badge ${weekInfo.isFull ? 'full' : 'short'}`}>
                  {weekInfo.isFull ? '7 ngày' : `${weekInfo.days} ngày (tuần lẻ)`}
                </span>
              </div>
            )}

            <button className="btn-p" onClick={goStep2} style={{ marginTop: 8 }}>
              Tiếp theo →
            </button>
          </div>
        )}

        {/* ══════════════ STEP 1.5 — Upload Shopee CSV ══════════════ */}
        {step === 1.5 &&
          weekInfo &&
          (() => {
            const hasAnyShopeeFile =
              !!uploadedFiles.shopee_cpc || !!uploadedFiles.shopee_branding || !!uploadedFiles.shopee_live
            const missingShopee: string[] = []
            if (!uploadedFiles.shopee_cpc) missingShopee.push('CPC')
            if (!uploadedFiles.shopee_branding) missingShopee.push('Branding')
            if (!uploadedFiles.shopee_live) missingShopee.push('Live')
            const allThreeShopee = missingShopee.length === 0
            const someShopeeMissing = hasAnyShopeeFile && missingShopee.length > 0

            const hasAnyTiktokFile = !!tiktokFiles.tiktok_pgm || !!tiktokFiles.tiktok_lgm
            const missingTiktok: string[] = []
            if (!tiktokFiles.tiktok_pgm) missingTiktok.push('PGM')
            if (!tiktokFiles.tiktok_lgm) missingTiktok.push('LGM')
            const allBothTiktok = missingTiktok.length === 0
            const someTiktokMissing = hasAnyTiktokFile && missingTiktok.length > 0

            const ctxNow = `${selectedBrand}|${selMonth}|${selYear}|${selWeek}`
            const ctxStale = !!uploadContext && uploadContext !== ctxNow

            const canAutoFill = !!shopeePivot || !!tiktokPivot

            return (
              <>
                {/* Context bar */}
                <div className="rc" style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      fontSize: '.88rem',
                    }}
                  >
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: 999,
                        background: selectedBrand ? 'rgba(59,130,246,.12)' : 'rgba(251,191,36,.12)',
                        color: selectedBrand ? '#60a5fa' : '#fbbf24',
                        fontWeight: 700,
                      }}
                    >
                      {selectedBrand || 'Không brand (copy-only)'}
                    </span>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: 999,
                        background: 'rgba(255,255,255,.05)',
                        color: '#cbd5e1',
                      }}
                    >
                      {weekInfo.label}
                    </span>
                    <span style={{ color: 'var(--muted)' }}>
                      · {weekInfo.start} → {weekInfo.end}
                    </span>
                  </div>
                  <p
                    style={{
                      color: 'var(--muted)',
                      fontSize: '.85rem',
                      marginTop: 10,
                      marginBottom: 0,
                      lineHeight: 1.55,
                    }}
                  >
                    Upload file xuất từ Shopee Seller Center và TikTok Ads Manager — tool tự parse + preview
                    pivot. File thiếu → field tương ứng = 0 (vẫn auto-fill được). Có thể bỏ qua để nhập tay.
                  </p>
                  {ctxStale && (
                    <div
                      style={{
                        marginTop: 12,
                        padding: '10px 14px',
                        background: 'rgba(251,191,36,.08)',
                        border: '1px solid rgba(251,191,36,.3)',
                        borderRadius: 8,
                        color: '#fbbf24',
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <span style={{ flexShrink: 0 }}>{Icon.alertTriangle(13)}</span>
                      Pivot đang hiển thị dữ liệu từ context khác. Xoá data + upload lại.
                    </div>
                  )}
                </div>

                {/* ── UNIFIED UPLOAD zone — Shopee CSV + TikTok xlsx vào 1 chỗ ── */}
                <div className="rc" style={{ marginBottom: 14 }}>
                  <UnifiedFileUploadZone
                    shopeeFiles={uploadedFiles}
                    tiktokFiles={tiktokFiles}
                    onShopeeChange={setUploadedFiles}
                    onTiktokChange={setTiktokFiles}
                    onError={msg => showToast(msg, 'error')}
                    acceptShopee={shopeeChecked}
                    acceptTiktok={tiktokChecked}
                  />

                  {/* Status row */}
                  <div
                    style={{
                      marginTop: 14,
                      display: 'flex',
                      gap: 10,
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      minHeight: 32,
                    }}
                  >
                    {parsing && (
                      <span
                        style={{
                          color: '#60a5fa',
                          fontSize: 13,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        {Icon.clock(13)} Đang parse Shopee...
                      </span>
                    )}
                    {!parsing && shopeePivot && (
                      <span
                        style={{
                          color: '#34d399',
                          fontSize: 13,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        {Icon.checkCircle(13)} Shopee: {shopeePivot.rows.length} row
                      </span>
                    )}
                    {parsingTiktok && (
                      <span
                        style={{
                          color: '#a78bfa',
                          fontSize: 13,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        {Icon.clock(13)} Đang parse TikTok... (PGM có thể tới 33K rows)
                      </span>
                    )}
                    {!parsingTiktok && tiktokPivot && (
                      <span
                        style={{
                          color: '#34d399',
                          fontSize: 13,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        {Icon.checkCircle(13)} TikTok: {tiktokPivot.rows.length} row
                      </span>
                    )}
                    {!parsing && hasAnyShopeeFile && (
                      <button
                        type="button"
                        onClick={clearUploadedData}
                        style={{
                          background: 'transparent',
                          border: '1px solid rgba(239,68,68,.25)',
                          color: '#fca5a5',
                          padding: '4px 10px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                        }}
                      >
                        {Icon.trash(12)} Xoá Shopee
                      </button>
                    )}
                    {!parsingTiktok && hasAnyTiktokFile && (
                      <button
                        type="button"
                        onClick={clearTiktokData}
                        style={{
                          background: 'transparent',
                          border: '1px solid rgba(239,68,68,.25)',
                          color: '#fca5a5',
                          padding: '4px 10px',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                        }}
                      >
                        {Icon.trash(12)} Xoá TikTok
                      </button>
                    )}
                  </div>

                  {/* Inline errors */}
                  {parseError && (
                    <div
                      style={{
                        marginTop: 12,
                        padding: '10px 14px',
                        background: 'rgba(239,68,68,.08)',
                        border: '1px solid rgba(239,68,68,.25)',
                        borderRadius: 8,
                        color: '#fca5a5',
                        fontSize: 13,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                      }}
                    >
                      <span style={{ flexShrink: 0, marginTop: 1 }}>{Icon.alertTriangle(14)}</span>
                      <div>
                        <strong>Shopee parse:</strong> {parseError}
                      </div>
                    </div>
                  )}
                  {tiktokParseError && (
                    <div
                      style={{
                        marginTop: 12,
                        padding: '10px 14px',
                        background: 'rgba(239,68,68,.08)',
                        border: '1px solid rgba(239,68,68,.25)',
                        borderRadius: 8,
                        color: '#fca5a5',
                        fontSize: 13,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                      }}
                    >
                      <span style={{ flexShrink: 0, marginTop: 1 }}>{Icon.alertTriangle(14)}</span>
                      <div>
                        <strong>TikTok parse:</strong> {tiktokParseError}
                      </div>
                    </div>
                  )}

                  {/* Summary banners */}
                  {shopeeChecked && shopeePivot && (
                    <div
                      style={{
                        marginTop: 10,
                        padding: '8px 12px',
                        background: allThreeShopee ? 'rgba(16,185,129,.06)' : 'rgba(59,130,246,.06)',
                        border: `1px solid ${allThreeShopee ? 'rgba(16,185,129,.2)' : 'rgba(59,130,246,.2)'}`,
                        borderRadius: 8,
                        color: allThreeShopee ? '#6ee7b7' : '#93c5fd',
                        fontSize: 12,
                      }}
                    >
                      {allThreeShopee ? Icon.checkCircle(12) : Icon.info(12)}{' '}
                      {allThreeShopee
                        ? 'Shopee: đủ 3 file — sẵn sàng auto-fill 12 field.'
                        : someShopeeMissing
                          ? `Shopee: thiếu ${missingShopee.join(', ')} — field tương ứng = 0.`
                          : 'Shopee: chưa có file.'}
                    </div>
                  )}
                  {tiktokChecked && tiktokPivot && (
                    <div
                      style={{
                        marginTop: 8,
                        padding: '8px 12px',
                        background: allBothTiktok ? 'rgba(16,185,129,.06)' : 'rgba(168,85,247,.08)',
                        border: `1px solid ${allBothTiktok ? 'rgba(16,185,129,.2)' : 'rgba(168,85,247,.25)'}`,
                        borderRadius: 8,
                        color: allBothTiktok ? '#6ee7b7' : '#c4b5fd',
                        fontSize: 12,
                      }}
                    >
                      {allBothTiktok ? Icon.checkCircle(12) : Icon.info(12)}{' '}
                      {allBothTiktok
                        ? 'TikTok: đủ 2 file PGM + LGM — sẵn sàng auto-fill 7 field.'
                        : someTiktokMissing
                          ? `TikTok: thiếu ${missingTiktok.join(', ')} — field tương ứng = 0.`
                          : 'TikTok: chưa có file.'}
                    </div>
                  )}
                </div>

                {/* Preview cards (separate per platform) */}
                {shopeePivot && (
                  <div className="rc" style={{ marginBottom: 14 }}>
                    <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: '1.05rem' }}>
                      Preview Shopee Pivot
                    </h3>
                    <ShopeePivotPreview pivot={shopeePivot} />
                  </div>
                )}
                {tiktokPivot && (
                  <div className="rc" style={{ marginBottom: 14 }}>
                    <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: '1.05rem' }}>
                      Preview TikTok Pivot
                    </h3>
                    <TiktokPivotPreview pivot={tiktokPivot} />
                  </div>
                )}

                {/* Action bar */}
                <div className="btn-row" style={{ marginTop: 16, flexWrap: 'wrap' }}>
                  <button className="btn-s" onClick={() => setStep(1)}>
                    ← Quay lại
                  </button>
                  <button className="btn-s" onClick={skipUploadStep}>
                    Bỏ qua, nhập tay
                  </button>
                  <button
                    className="btn-s"
                    onClick={saveFromUploadStep}
                    disabled={!canAutoFill || !selectedBrand || parsing || parsingTiktok || saving}
                    title={
                      !selectedBrand
                        ? 'Cần chọn brand ở Bước 1 mới lưu được. (Vẫn copy số được như bình thường.)'
                        : !canAutoFill
                          ? 'Upload + parse trước khi lưu'
                          : 'Lưu data tuần ngay (chưa cần chạy AI). Có thể quay lại sau để xuất báo cáo.'
                    }
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      opacity: !selectedBrand ? 0.5 : 1,
                    }}
                  >
                    {Icon.save(13)} {saving ? 'Đang lưu...' : 'Lưu data tuần'}
                    {!selectedBrand && <span style={{ fontSize: 10, opacity: 0.7 }}>(cần brand)</span>}
                  </button>
                  <button
                    className="btn-p"
                    onClick={applyAutoFillAndContinue}
                    disabled={!canAutoFill || parsing || parsingTiktok}
                    title={
                      !canAutoFill
                        ? 'Upload ít nhất 1 file để parse pivot'
                        : 'Auto-fill field theo pivot đã parse'
                    }
                  >
                    Auto-fill & tiếp tục →
                  </button>
                </div>
              </>
            )
          })()}

        {/* ══════════════ STEP 2 ══════════════ */}
        {step === 2 && weekInfo && (
          <div>
            {/* Actual XLSX Tools (top) */}
            <div className="rc">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '.82rem', color: 'var(--muted)', fontWeight: 600 }}>
                  XLSX Actual:
                </span>
                <button className="btn-s" style={{ fontSize: '.78rem' }} onClick={downloadActualTemplate}>
                  ⬇ Tải template Actual
                </button>
                <label className="btn-s" style={{ fontSize: '.78rem', cursor: 'pointer' }}>
                  ⬆ Upload Actual
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    style={{ display: 'none' }}
                    onChange={handleActualUpload}
                  />
                </label>
              </div>
            </div>

            {/* Plan warning / edit */}
            {!hasPlan ? (
              <div className="plan-warn">
                <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                <div style={{ flex: 1 }}>
                  <strong>
                    Chưa có Plan tháng {weekInfo.month}/{weekInfo.year} cho brand này
                  </strong>
                  <span style={{ display: 'block' }}>Nhập plan để xem % Plan theo tuần.</span>
                </div>
                <button className="btn-set-plan" onClick={openPlanModal}>
                  Set Plan
                </button>
              </div>
            ) : (
              <div className="plan-warn" style={{ background: '#ECFDF5', borderColor: '#A7F3D0' }}>
                <span style={{ fontSize: '1.2rem' }}>✓</span>
                <div style={{ flex: 1 }}>
                  <strong>
                    Đã có Plan tháng {weekInfo.month}/{weekInfo.year}
                  </strong>
                  <span style={{ display: 'block', fontSize: '.82rem', color: 'var(--muted)' }}>
                    Click &quot;Sửa Plan&quot; nếu cần điều chỉnh.
                  </span>
                </div>
                <button className="btn-s" onClick={openPlanModal}>
                  Sửa Plan
                </button>
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
                        <th style={{ textAlign: 'left' }}>Metric</th>
                        <th>Actual W</th>
                        <th>Plan W</th>
                        <th>% Plan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { key: 's_cpc_doanh_so', label: 'Doanh số Ads' },
                        { key: 's_cpc_chi_phi', label: 'Chi phí' },
                        { key: 's_cpc_luot_xem', label: 'Lượt xem' },
                        { key: 's_cpc_luot_click', label: 'Lượt click' },
                        { key: 's_cpc_don_hang', label: 'Đơn hàng' },
                      ].map(({ key, label }) => {
                        const planV = shopeePlan?.[key]?.[wk] || 0
                        const actual = shopeeData[key as keyof ShopeeData] as number
                        const pVal = planV ? pct(actual, planV) : null
                        return (
                          <tr key={key}>
                            <td className="mn">{label}</td>
                            <td>
                              <input
                                className="m-inp"
                                type="text"
                                inputMode="numeric"
                                value={rawInputs[key] ?? (actual ? actual.toLocaleString('vi-VN') : '')}
                                placeholder="0"
                                onChange={e => setActual(key, e.target.value)}
                                onBlur={() => blurActual(key)}
                                onPaste={e => handleActualPaste(e, key)}
                              />
                            </td>
                            <td className="plan-v">{planV ? planV.toLocaleString('vi-VN') : '—'}</td>
                            <td>
                              <span className={`pct ${pctClass(pVal)}`}>
                                {pVal !== null ? pVal + '%' : '—'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                      <tr>
                        <td className="mn" style={{ color: 'var(--faint)' }}>
                          ROAS (tự tính)
                        </td>
                        <td className="calc">{fmtNum(cpcC.roas, 'x')}</td>
                        <td></td>
                        <td></td>
                      </tr>
                      <tr>
                        <td className="mn" style={{ color: 'var(--faint)' }}>
                          CPC (tự tính)
                        </td>
                        <td className="calc">{fmtNum(cpcC.cpc, '₫')}</td>
                        <td></td>
                        <td></td>
                      </tr>
                      <tr>
                        <td className="mn" style={{ color: 'var(--faint)' }}>
                          CTR (tự tính)
                        </td>
                        <td className="calc">{fmtNum(cpcC.ctr, '%')}</td>
                        <td></td>
                        <td></td>
                      </tr>
                      <tr>
                        <td className="mn" style={{ color: 'var(--faint)' }}>
                          CR (tự tính)
                        </td>
                        <td className="calc">{fmtNum(cpcC.cr, '%')}</td>
                        <td></td>
                        <td></td>
                      </tr>
                      <tr>
                        <td className="mn" style={{ color: 'var(--faint)' }}>
                          AOV (tự tính)
                        </td>
                        <td className="calc">{fmtNum(cpcC.aov, '₫')}</td>
                        <td></td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* ND */}
                <div className="rc">
                  <div className="sub-h">Nhận Diện — Display Ads</div>
                  <table className="mt">
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left' }}>Metric</th>
                        <th>Actual W</th>
                        <th>Plan W</th>
                        <th>% Plan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { key: 's_nd_gmv', label: 'GMV' },
                        { key: 's_nd_chi_phi', label: 'Chi phí' },
                        { key: 's_nd_luot_xem', label: 'Lượt xem' },
                        { key: 's_nd_luot_click', label: 'Lượt click' },
                      ].map(({ key, label }) => {
                        const planV = shopeePlan?.[key]?.[wk] || 0
                        const actual = shopeeData[key as keyof ShopeeData] as number
                        const pVal = planV ? pct(actual, planV) : null
                        return (
                          <tr key={key}>
                            <td className="mn">{label}</td>
                            <td>
                              <input
                                className="m-inp"
                                type="text"
                                inputMode="numeric"
                                value={rawInputs[key] ?? (actual ? actual.toLocaleString('vi-VN') : '')}
                                placeholder="0"
                                onChange={e => setActual(key, e.target.value)}
                                onBlur={() => blurActual(key)}
                                onPaste={e => handleActualPaste(e, key)}
                              />
                            </td>
                            <td className="plan-v">{planV ? planV.toLocaleString('vi-VN') : '—'}</td>
                            <td>
                              <span className={`pct ${pctClass(pVal)}`}>
                                {pVal !== null ? pVal + '%' : '—'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                      <tr>
                        <td className="mn" style={{ color: 'var(--faint)' }}>
                          ROAS (tự tính)
                        </td>
                        <td className="calc">{fmtNum(ndC.roas, 'x')}</td>
                        <td></td>
                        <td></td>
                      </tr>
                      <tr>
                        <td className="mn" style={{ color: 'var(--faint)' }}>
                          CPC (tự tính)
                        </td>
                        <td className="calc">{fmtNum(ndC.cpc, '₫')}</td>
                        <td></td>
                        <td></td>
                      </tr>
                      <tr>
                        <td className="mn" style={{ color: 'var(--faint)' }}>
                          CTR (tự tính)
                        </td>
                        <td className="calc">{fmtNum(ndC.ctr, '%')}</td>
                        <td></td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Live */}
                <div className="rc">
                  <div className="sub-h">Livestream Ads</div>
                  <table className="mt">
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left' }}>Metric</th>
                        <th>Actual W</th>
                        <th>Plan W</th>
                        <th>% Plan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { key: 's_live_gmv', label: 'GMV' },
                        { key: 's_live_chi_phi', label: 'Chi phí' },
                        { key: 's_live_luot_xem', label: 'Lượt xem' },
                      ].map(({ key, label }) => {
                        const planV = shopeePlan?.[key]?.[wk] || 0
                        const actual = shopeeData[key as keyof ShopeeData] as number
                        const pVal = planV ? pct(actual, planV) : null
                        return (
                          <tr key={key}>
                            <td className="mn">{label}</td>
                            <td>
                              <input
                                className="m-inp"
                                type="text"
                                inputMode="numeric"
                                value={rawInputs[key] ?? (actual ? actual.toLocaleString('vi-VN') : '')}
                                placeholder="0"
                                onChange={e => setActual(key, e.target.value)}
                                onBlur={() => blurActual(key)}
                                onPaste={e => handleActualPaste(e, key)}
                              />
                            </td>
                            <td className="plan-v">{planV ? planV.toLocaleString('vi-VN') : '—'}</td>
                            <td>
                              <span className={`pct ${pctClass(pVal)}`}>
                                {pVal !== null ? pVal + '%' : '—'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                      <tr>
                        <td className="mn" style={{ color: 'var(--faint)' }}>
                          ROAS (tự tính)
                        </td>
                        <td className="calc">{fmtNum(liveC.roas, 'x')}</td>
                        <td></td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Shopee total box */}
                <div className="total-box">
                  <div style={{ fontWeight: 700, marginBottom: 10, fontSize: '.88rem' }}>Shopee — Tổng</div>
                  <table className="mt">
                    <tbody>
                      <tr className="total-row">
                        <td className="mn">GMV Ads (Tổng)</td>
                        <td className="calc">{fmtNum(sTotalGMV, '₫')}</td>
                        <td className="plan-v">
                          {shopeePlan?.['s_cpc_doanh_so']?.month
                            ? fmtNum(
                                (shopeePlan['s_cpc_doanh_so'].month || 0) +
                                  (shopeePlan['s_nd_gmv']?.month || 0) +
                                  (shopeePlan['s_live_gmv']?.month || 0),
                                '₫',
                              )
                            : '—'}
                        </td>
                        <td></td>
                      </tr>
                      <tr className="total-row">
                        <td className="mn">Chi phí (Tổng)</td>
                        <td className="calc">{fmtNum(sTotalCP, '₫')}</td>
                        <td></td>
                        <td></td>
                      </tr>
                      <tr className="total-row">
                        <td className="mn">ROAS (Tổng)</td>
                        <td className="calc">{fmtNum(sTotalROAS, 'x')}</td>
                        <td></td>
                        <td></td>
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
                      <tr>
                        <th style={{ textAlign: 'left' }}>Metric</th>
                        <th>Actual W</th>
                        <th>Plan W</th>
                        <th>% Plan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { key: 't_pgm_doanh_so', label: 'Doanh số' },
                        { key: 't_pgm_chi_phi', label: 'Chi phí' },
                        { key: 't_pgm_luot_xem', label: 'Lượt xem' },
                        { key: 't_pgm_luot_click', label: 'Lượt click' },
                        { key: 't_pgm_don_hang', label: 'Đơn hàng' },
                      ].map(({ key, label }) => {
                        const planV = tiktokPlan?.[key]?.[wk] || 0
                        const actual = tiktokData[key as keyof TiktokData] as number
                        const pVal = planV ? pct(actual, planV) : null
                        return (
                          <tr key={key}>
                            <td className="mn">{label}</td>
                            <td>
                              <input
                                className="m-inp"
                                type="text"
                                inputMode="numeric"
                                value={rawInputs[key] ?? (actual ? actual.toLocaleString('vi-VN') : '')}
                                placeholder="0"
                                onChange={e => setActual(key, e.target.value)}
                                onBlur={() => blurActual(key)}
                                onPaste={e => handleActualPaste(e, key)}
                              />
                            </td>
                            <td className="plan-v">{planV ? planV.toLocaleString('vi-VN') : '—'}</td>
                            <td>
                              <span className={`pct ${pctClass(pVal)}`}>
                                {pVal !== null ? pVal + '%' : '—'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                      <tr>
                        <td className="mn" style={{ color: 'var(--faint)' }}>
                          ROAS (tự tính)
                        </td>
                        <td className="calc">{fmtNum(pgmC.roas, 'x')}</td>
                        <td></td>
                        <td></td>
                      </tr>
                      <tr>
                        <td className="mn" style={{ color: 'var(--faint)' }}>
                          CPC (tự tính)
                        </td>
                        <td className="calc">{fmtNum(pgmC.cpc, '₫')}</td>
                        <td></td>
                        <td></td>
                      </tr>
                      <tr>
                        <td className="mn" style={{ color: 'var(--faint)' }}>
                          CTR (tự tính)
                        </td>
                        <td className="calc">{fmtNum(pgmC.ctr, '%')}</td>
                        <td></td>
                        <td></td>
                      </tr>
                      <tr>
                        <td className="mn" style={{ color: 'var(--faint)' }}>
                          CR (tự tính)
                        </td>
                        <td className="calc">{fmtNum(pgmC.cr, '%')}</td>
                        <td></td>
                        <td></td>
                      </tr>
                      <tr>
                        <td className="mn" style={{ color: 'var(--faint)' }}>
                          CPM (tự tính)
                        </td>
                        <td className="calc">{fmtNum(pgmC.cpm, '₫')}</td>
                        <td></td>
                        <td></td>
                      </tr>
                      <tr>
                        <td className="mn" style={{ color: 'var(--faint)' }}>
                          AOV (tự tính)
                        </td>
                        <td className="calc">{fmtNum(pgmC.aov, '₫')}</td>
                        <td></td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* LGM */}
                <div className="rc">
                  <div className="sub-h">LGM — Livestream GMV</div>
                  <table className="mt">
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left' }}>Metric</th>
                        <th>Actual W</th>
                        <th>Plan W</th>
                        <th>% Plan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { key: 't_lgm_doanhthu', label: 'Doanh thu Live' },
                        { key: 't_lgm_chi_phi', label: 'Chi phí' },
                      ].map(({ key, label }) => {
                        const planV = tiktokPlan?.[key]?.[wk] || 0
                        const actual = tiktokData[key as keyof TiktokData] as number
                        const pVal = planV ? pct(actual, planV) : null
                        return (
                          <tr key={key}>
                            <td className="mn">{label}</td>
                            <td>
                              <input
                                className="m-inp"
                                type="text"
                                inputMode="numeric"
                                value={rawInputs[key] ?? (actual ? actual.toLocaleString('vi-VN') : '')}
                                placeholder="0"
                                onChange={e => setActual(key, e.target.value)}
                                onBlur={() => blurActual(key)}
                                onPaste={e => handleActualPaste(e, key)}
                              />
                            </td>
                            <td className="plan-v">{planV ? planV.toLocaleString('vi-VN') : '—'}</td>
                            <td>
                              <span className={`pct ${pctClass(pVal)}`}>
                                {pVal !== null ? pVal + '%' : '—'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                      <tr>
                        <td className="mn" style={{ color: 'var(--faint)' }}>
                          ROI (tự tính)
                        </td>
                        <td className="calc">{fmtNum(lgmC.roi, 'x')}</td>
                        <td></td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Consideration */}
                <div className="rc">
                  <div className="sub-h">Consideration</div>
                  <table className="mt">
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left' }}>Metric</th>
                        <th>Actual W</th>
                        <th>Plan W</th>
                        <th>% Plan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { key: 't_con_nguoi', label: 'Người tiếp cận' },
                        { key: 't_con_chi_phi', label: 'Chi phí' },
                      ].map(({ key, label }) => {
                        const planV = tiktokPlan?.[key]?.[wk] || 0
                        const actual = tiktokData[key as keyof TiktokData] as number
                        const pVal = planV ? pct(actual, planV) : null
                        return (
                          <tr key={key}>
                            <td className="mn">{label}</td>
                            <td>
                              <input
                                className="m-inp"
                                type="text"
                                inputMode="numeric"
                                value={rawInputs[key] ?? (actual ? actual.toLocaleString('vi-VN') : '')}
                                placeholder="0"
                                onChange={e => setActual(key, e.target.value)}
                                onBlur={() => blurActual(key)}
                                onPaste={e => handleActualPaste(e, key)}
                              />
                            </td>
                            <td className="plan-v">{planV ? planV.toLocaleString('vi-VN') : '—'}</td>
                            <td>
                              <span className={`pct ${pctClass(pVal)}`}>
                                {pVal !== null ? pVal + '%' : '—'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                      <tr>
                        <td className="mn" style={{ color: 'var(--faint)' }}>
                          CPA (tự tính)
                        </td>
                        <td className="calc">{fmtNum(conC.cpa, '₫')}</td>
                        <td></td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Branding */}
                <div className="rc">
                  <div className="sub-h">Branding — Follow & View</div>
                  <table className="mt">
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left' }}>Metric</th>
                        <th>Actual W</th>
                        <th>Plan W</th>
                        <th>% Plan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { key: 't_brd_view', label: 'View' },
                        { key: 't_brd_follow', label: 'Follow' },
                        { key: 't_brd_chi_phi', label: 'Chi phí' },
                      ].map(({ key, label }) => {
                        const planV = tiktokPlan?.[key]?.[wk] || 0
                        const actual = tiktokData[key as keyof TiktokData] as number
                        const pVal = planV ? pct(actual, planV) : null
                        return (
                          <tr key={key}>
                            <td className="mn">{label}</td>
                            <td>
                              <input
                                className="m-inp"
                                type="text"
                                inputMode="numeric"
                                value={rawInputs[key] ?? (actual ? actual.toLocaleString('vi-VN') : '')}
                                placeholder="0"
                                onChange={e => setActual(key, e.target.value)}
                                onBlur={() => blurActual(key)}
                                onPaste={e => handleActualPaste(e, key)}
                              />
                            </td>
                            <td className="plan-v">{planV ? planV.toLocaleString('vi-VN') : '—'}</td>
                            <td>
                              <span className={`pct ${pctClass(pVal)}`}>
                                {pVal !== null ? pVal + '%' : '—'}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                      <tr>
                        <td className="mn" style={{ color: 'var(--faint)' }}>
                          CPA/Follow (tự tính)
                        </td>
                        <td className="calc">{fmtNum(brdC.cpa, '₫')}</td>
                        <td></td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* TikTok total box */}
                <div className="total-box">
                  <div style={{ fontWeight: 700, marginBottom: 10, fontSize: '.88rem' }}>TikTok — Tổng</div>
                  <table className="mt">
                    <tbody>
                      <tr className="total-row">
                        <td className="mn">GMV (PGM + LGM)</td>
                        <td className="calc">{fmtNum(tTotalGMV, '₫')}</td>
                        <td className="plan-v">
                          {tiktokPlan?.['t_pgm_doanh_so']?.month
                            ? fmtNum(
                                (tiktokPlan['t_pgm_doanh_so'].month || 0) +
                                  (tiktokPlan['t_lgm_doanhthu']?.month || 0),
                                '₫',
                              )
                            : '—'}
                        </td>
                        <td></td>
                      </tr>
                      <tr className="total-row">
                        <td className="mn">Chi phí (Tổng)</td>
                        <td className="calc">{fmtNum(tTotalCP, '₫')}</td>
                        <td></td>
                        <td></td>
                      </tr>
                      <tr className="total-row">
                        <td className="mn">ROI (Tổng)</td>
                        <td className="calc">{fmtNum(tTotalROI, 'x')}</td>
                        <td></td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── AI Section (V2 matrix editor) ── */}
            <div className="rc">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                  marginBottom: 16,
                }}
              >
                <div>
                  <h2 style={{ margin: 0 }}>AI Matrix — Đánh giá & Giải pháp</h2>
                  <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '.85rem' }}>
                    7 hạng mục × 4 cột. AI điền sau khi Generate; bạn check + edit trước khi save.
                    {previousSolutions && (
                      <>
                        {' '}
                        AI có tham chiếu{' '}
                        <strong>
                          Đề xuất tuần W{previousSolutions.week} T{previousSolutions.month}/
                          {previousSolutions.year}
                        </strong>{' '}
                        để đánh giá closed-loop.
                      </>
                    )}
                  </p>
                </div>
                <button className="btn-ai" onClick={generateAI} disabled={aiLoading}>
                  {aiLoading ? (
                    <>
                      <span className="spin" />
                      <span>Đang phân tích...</span>
                    </>
                  ) : (
                    <>
                      <span>✦</span>
                      <span>Generate AI nhận xét</span>
                    </>
                  )}
                </button>
              </div>

              <AIMatrixEditor
                value={aiResult}
                onChange={setAiResult}
                shopeeChecked={shopeeChecked}
                tiktokChecked={tiktokChecked}
                autosaveKey={
                  selectedBrand && weekInfo
                    ? `mo_ai_draft_${selectedBrand}_${weekInfo.year}_${weekInfo.month}_${weekInfo.weekNum}`
                    : undefined
                }
              />
            </div>

            {/* Navigation */}
            <div className="btn-row">
              <button className="btn-s" onClick={() => setStep(shopeeChecked || tiktokChecked ? 1.5 : 1)}>
                ← Quay lại
              </button>
              <button className="btn-p" onClick={goStep3}>
                Xem Preview →
              </button>
            </div>
          </div>
        )}

        {/* ══════════════ STEP 3 ══════════════ */}
        {step === 3 && weekInfo && (
          <div>
            {/* Hidden chart canvas — rendered offscreen, captured as image and embedded inside email body */}
            <div
              style={{
                position: 'absolute',
                left: '-9999px',
                top: 0,
                width: 900,
                height: 300,
                pointerEvents: 'none',
              }}
              aria-hidden
            >
              <canvas ref={chartRef} width={900} height={300} />
            </div>

            <div className="pv-wrap">
              <div className="pv-bar">
                <span className="pv-bar-lbl">Mail Preview</span>
                <div className="pv-acts" style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-s" onClick={exportPreviewXlsx}>
                    ⬇ Export XLSX
                  </button>
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
                <span className="save-info">
                  {user?.name} · {fmtDate(new Date())}
                </span>
                <button className="btn-p" onClick={saveReport} disabled={saving}>
                  {saving ? 'Đang lưu...' : 'Lưu báo cáo'}
                </button>
              </div>
            </div>

            <div className="btn-row" style={{ marginTop: 16 }}>
              <button className="btn-s" onClick={() => setStep(2)}>
                ← Quay lại
              </button>
            </div>
          </div>
        )}

        {/* ══════════════ KEY MODAL ══════════════ */}
        {keyModal && (
          <div className="mo open">
            <div className="mo-box" style={{ maxWidth: 480 }}>
              <div className="mo-hdr">
                <h3 style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ display: 'inline-flex', color: '#fbbf24' }}>{Icon.key(16)}</span>OpenAI API
                  Key
                </h3>
                <button className="mo-close" onClick={() => setKeyModal(false)}>
                  ×
                </button>
              </div>
              <div className="mo-body">
                <p style={{ fontSize: '.84rem', color: 'var(--muted)', marginBottom: 12 }}>
                  Key được lưu trong trình duyệt (localStorage). Không gửi lên server.
                </p>
                <input
                  className="ri"
                  type="password"
                  placeholder="sk-..."
                  value={keyInput}
                  onChange={e => setKeyInput(e.target.value)}
                  style={{ width: '100%', marginBottom: 8 }}
                />
              </div>
              <div className="mo-foot">
                <button className="btn-s" onClick={() => setKeyModal(false)}>
                  Hủy
                </button>
                <button
                  className="btn-p"
                  onClick={() => {
                    if (!keyInput.trim()) {
                      showToast('Key không được để trống', 'error')
                      return
                    }
                    if (typeof window !== 'undefined') localStorage.setItem('mo_openai_key', keyInput.trim())
                    setKeyModal(false)
                    showToast('Đã lưu OpenAI Key!')
                  }}
                >
                  Lưu Key
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ PROMPT MODAL ══════════════ */}
        {promptModal && (
          <div className="mo open">
            <div className="mo-box" style={{ maxWidth: 700 }}>
              <div className="mo-hdr">
                <h3 style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ display: 'inline-flex' }}>{Icon.edit(16)}</span>AI System Prompt
                </h3>
                <button className="mo-close" onClick={() => setPromptModal(false)}>
                  ×
                </button>
              </div>
              <div className="mo-body">
                <p style={{ fontSize: '.84rem', color: 'var(--muted)', marginBottom: 8 }}>
                  Tuỳ chỉnh prompt hệ thống cho AI. Lưu trong trình duyệt.
                </p>
                <textarea
                  style={{
                    width: '100%',
                    minHeight: 300,
                    fontFamily: 'monospace',
                    fontSize: '.8rem',
                    padding: 10,
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    resize: 'vertical',
                  }}
                  value={promptInput}
                  onChange={e => setPromptInput(e.target.value)}
                />
              </div>
              <div className="mo-foot">
                <button
                  className="btn-s"
                  onClick={() => {
                    setPromptInput(DEFAULT_SYS_PROMPT)
                    showToast('Đã reset về default')
                  }}
                >
                  Reset Default
                </button>
                <button className="btn-s" onClick={() => setPromptModal(false)}>
                  Hủy
                </button>
                <button
                  className="btn-p"
                  onClick={() => {
                    if (typeof window !== 'undefined') localStorage.setItem('mo_ai_prompt', promptInput)
                    setPromptModal(false)
                    showToast('Đã lưu AI Prompt!')
                  }}
                >
                  Lưu Prompt
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ PLAN MODAL ══════════════ */}
        <div className={`mo ${planModal ? 'open' : ''}`}>
          <div className="mo-box">
            <div className="mo-hdr">
              <h3>
                Set Plan — {selectedBrand} — Tháng {weekInfo?.month}/{weekInfo?.year}
              </h3>
              <button className="mo-close" onClick={() => setPlanModal(false)}>
                ×
              </button>
            </div>
            <div className="mo-body">
              {/* Plan XLSX Tools */}
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  marginBottom: 10,
                  paddingBottom: 8,
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <span style={{ fontSize: '.78rem', color: 'var(--muted)', fontWeight: 600 }}>XLSX:</span>
                <button
                  type="button"
                  className="btn-s"
                  style={{ fontSize: '.74rem' }}
                  onClick={downloadPlanTemplateXlsx}
                >
                  ⬇ Tải template Plan
                </button>
                <label className="btn-s" style={{ fontSize: '.74rem', cursor: 'pointer' }}>
                  ⬆ Upload Plan
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    style={{ display: 'none' }}
                    onChange={uploadPlanXlsx}
                  />
                </label>
              </div>
              {/* Plan grid header */}
              <div className="pg6" style={{ marginBottom: 8 }}>
                <div className="pg-head" style={{ textAlign: 'left' }}>
                  Metric
                </div>
                {['W1', 'W2', 'W3', 'W4', 'W5', 'Tháng'].map(h => (
                  <div key={h} className="pg-head">
                    {h}
                  </div>
                ))}
              </div>
              {PLAN_SECTIONS.map((sec, idx) => {
                if (sec.plat === 'shopee' && !shopeeChecked) return null
                if (sec.plat === 'tiktok' && !tiktokChecked) return null
                const keys = sec.keys.filter(k => activePlanKeys.includes(k))
                if (keys.length === 0) return null
                return (
                  <div key={sec.id}>
                    <div
                      className="pg-section"
                      style={{ gridColumn: '1/-1', marginBottom: 8, marginTop: idx === 0 ? 0 : 16 }}
                    >
                      {sec.label}
                    </div>
                    {keys.map(mk => {
                      const plat = sec.plat
                      const monthV = parseVN(
                        planRawInputs[`${plat}_${mk}_month`] ?? planInputs[`${plat}_${mk}_month`] ?? '',
                      )
                      const sumW = sumWeeksForMetric(plat, mk)
                      const diff = monthV - sumW
                      return (
                        <div key={mk} style={{ marginBottom: 6 }}>
                          <div className="pg6">
                            <div className="pg-lbl" style={{ fontSize: '.78rem' }}>
                              {planMetricLabels[mk] || mk}
                            </div>
                            {(['w1', 'w2', 'w3', 'w4', 'w5', 'month'] as const).map(w => (
                              <input
                                key={w}
                                className="pg-inp"
                                type="text"
                                inputMode="numeric"
                                placeholder="0"
                                value={planRawInputs[`${plat}_${mk}_${w}`] ?? ''}
                                onChange={e => setPlanRaw(plat, mk, w, e.target.value)}
                                onPaste={e => handlePlanPaste(e, plat, mk, w)}
                                onBlur={() => blurPlanRaw(plat, mk, w)}
                              />
                            ))}
                          </div>
                          {(monthV > 0 || sumW > 0) &&
                            monthV > 0 &&
                            (() => {
                              const isMatch = diff === 0
                              const color = isMatch ? '#10B981' : diff > 0 ? '#F59E0B' : '#EF4444'
                              const label = isMatch
                                ? 'khớp'
                                : `lệch ${diff > 0 ? '+' : ''}${diff.toLocaleString('vi-VN')}`
                              return (
                                <div
                                  style={{
                                    display: 'flex',
                                    gap: 8,
                                    alignItems: 'center',
                                    fontSize: '.72rem',
                                    color,
                                    paddingLeft: 4,
                                    marginTop: 2,
                                    fontWeight: 600,
                                  }}
                                >
                                  <span>{label}</span>
                                </div>
                              )
                            })()}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
            <div className="mo-foot">
              <button className="btn-s" onClick={() => setPlanModal(false)}>
                Hủy
              </button>
              <button className="btn-p" onClick={savePlan}>
                Lưu Plan →
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
