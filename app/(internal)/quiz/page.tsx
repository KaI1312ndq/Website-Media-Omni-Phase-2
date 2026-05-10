'use client'
import { useEffect, useRef, useState } from 'react'
import { getSession, SessionUser } from '@/lib/auth'
import { Icon } from '@/lib/icons'
import '@/app/(internal)/dashboard/dashboard.css'
import './quiz.css'

// ── D1 Benchmark Data ──
const D1_DATA = [
  {
    p: 'TikTok',
    o: 'Reach',
    c: '—',
    a: 'Lượt hiển thị',
    CPA: 10,
    CPC: null,
    CPM: 10000,
    CTR: null,
    CR: null,
  },
  {
    p: 'TikTok',
    o: 'Traffic',
    c: 'Website/App',
    a: 'Lượt click',
    CPA: null,
    CPC: 100,
    CPM: 30000,
    CTR: 10,
    CR: null,
  },
  {
    p: 'TikTok',
    o: 'Community interaction',
    c: '—',
    a: 'Lượt follow',
    CPA: 2500,
    CPC: null,
    CPM: 200000,
    CTR: null,
    CR: null,
  },
  {
    p: 'TikTok',
    o: 'Community interaction',
    c: '—',
    a: 'Lượt view video',
    CPA: 12,
    CPC: null,
    CPM: 14000,
    CTR: null,
    CR: null,
  },
  { p: 'TikTok', o: 'Sales', c: 'Website', a: 'Purchase', CPA: 50000, CPC: 3000, CPM: 50000, CTR: 3, CR: 2 },
  { p: 'TikTok', o: 'Sales', c: 'PGM', a: 'GMV tổng', CPA: 60000, CPC: 1500, CPM: 80000, CTR: 1, CR: 3 },
  { p: 'TikTok', o: 'Sales', c: 'LGM', a: 'GMV tổng', CPA: 50000, CPC: 2000, CPM: 40000, CTR: 3, CR: 5 },
  { p: 'Meta', o: 'Awareness', c: '—', a: 'Reach', CPA: 20000, CPC: null, CPM: 15000, CTR: null, CR: null },
  {
    p: 'Meta',
    o: 'Traffic',
    c: 'Website/App',
    a: 'Link click',
    CPA: 500,
    CPC: 500,
    CPM: 15000,
    CTR: 5,
    CR: null,
  },
  {
    p: 'Meta',
    o: 'Engagement',
    c: 'Post/Video',
    a: 'Like/Comment/Share',
    CPA: 900,
    CPC: null,
    CPM: 18000,
    CTR: null,
    CR: null,
  },
  {
    p: 'Meta',
    o: 'Engagement',
    c: 'Post/Video',
    a: 'ThruPlay 15s',
    CPA: 100,
    CPC: null,
    CPM: 18000,
    CTR: null,
    CR: null,
  },
  {
    p: 'Meta',
    o: 'Engagement',
    c: 'Page',
    a: 'Page like',
    CPA: 2500,
    CPC: null,
    CPM: 35000,
    CTR: null,
    CR: null,
  },
  {
    p: 'Meta',
    o: 'Leads',
    c: 'Instant form',
    a: 'Form submit',
    CPA: 50000,
    CPC: 500,
    CPM: 35000,
    CTR: 5,
    CR: 25,
  },
  {
    p: 'Meta',
    o: 'Leads',
    c: 'Website',
    a: 'Web lead submit',
    CPA: 70000,
    CPC: 500,
    CPM: 35000,
    CTR: 5,
    CR: 40,
  },
  {
    p: 'Meta',
    o: 'Leads',
    c: 'Messenger',
    a: 'Conversation start',
    CPA: 25000,
    CPC: 2500,
    CPM: 45000,
    CTR: 2.5,
    CR: null,
  },
  { p: 'Meta', o: 'Sales', c: 'Website', a: 'Purchase', CPA: 50000, CPC: 3000, CPM: 70000, CTR: 3, CR: 2.2 },
  {
    p: 'Meta',
    o: 'Sales',
    c: 'Messenger',
    a: 'Purchase via chat',
    CPA: 70000,
    CPC: 5000,
    CPM: 100000,
    CTR: 2,
    CR: 5,
  },
  {
    p: 'Meta',
    o: 'Sales',
    c: 'CPAS Shopee',
    a: 'Purchase',
    CPA: 30000,
    CPC: 1500,
    CPM: 50000,
    CTR: 3,
    CR: 2,
  },
  {
    p: 'Shopee',
    o: 'Ads Product',
    c: 'CPC Search',
    a: 'Purchase',
    CPA: 40000,
    CPC: 2100,
    CPM: 40000,
    CTR: 2.3,
    CR: 5,
  },
  {
    p: 'Shopee',
    o: 'New Product',
    c: 'New Product',
    a: 'Purchase',
    CPA: 75000,
    CPC: 3000,
    CPM: 35000,
    CTR: 1.9,
    CR: 4,
  },
  { p: 'Shopee', o: 'Branding', c: '—', a: 'Purchase', CPA: 80000, CPC: 8000, CPM: 1000000, CTR: 6, CR: 10 },
  {
    p: 'Shopee',
    o: 'Ads Shop',
    c: 'Tăng nhận diện',
    a: 'Purchase',
    CPA: 67500,
    CPC: 4500,
    CPM: 45000,
    CTR: 5,
    CR: 6,
  },
  {
    p: 'Shopee',
    o: 'Ads Shop',
    c: 'Giá thầu tự động',
    a: 'Purchase',
    CPA: 76000,
    CPC: 3800,
    CPM: 40000,
    CTR: 4,
    CR: 5,
  },
  {
    p: 'Shopee',
    o: 'Ads Live',
    c: 'Thủ công',
    a: 'Purchase',
    CPA: 50000,
    CPC: null,
    CPM: 60000,
    CTR: null,
    CR: null,
  },
  {
    p: 'Shopee',
    o: 'Ads Live',
    c: 'Tối ưu lượt xem',
    a: 'Live View',
    CPA: 50,
    CPC: null,
    CPM: 40000,
    CTR: null,
    CR: null,
  },
  {
    p: 'Google',
    o: 'Sales',
    c: 'Search Ads',
    a: 'Conversion',
    CPA: 50000,
    CPC: 3000,
    CPM: 140000,
    CTR: 5.5,
    CR: 3.5,
  },
  {
    p: 'Google',
    o: 'Sales',
    c: 'Shopping Ads',
    a: 'Purchase',
    CPA: 50000,
    CPC: 2000,
    CPM: 80000,
    CTR: 5,
    CR: 3.2,
  },
  { p: 'Google', o: 'Sales', c: 'PMax', a: 'Purchase', CPA: 50000, CPC: 1000, CPM: 50000, CTR: 6, CR: 2.5 },
  {
    p: 'Google',
    o: 'Traffic',
    c: 'Display/GDN',
    a: 'Click',
    CPA: null,
    CPC: 100,
    CPM: 10000,
    CTR: 10,
    CR: null,
  },
  {
    p: 'Google',
    o: 'Awareness',
    c: 'YT Non-skip',
    a: 'Impression',
    CPA: 15,
    CPC: null,
    CPM: 15000,
    CTR: null,
    CR: null,
  },
  {
    p: 'Google',
    o: 'Awareness',
    c: 'YT Skippable',
    a: 'View 30s',
    CPA: 200,
    CPC: null,
    CPM: 35000,
    CTR: null,
    CR: null,
  },
  {
    p: 'Google',
    o: 'Awareness',
    c: 'YT Bumper 6s',
    a: 'Impression',
    CPA: 15,
    CPC: null,
    CPM: 15000,
    CTR: null,
    CR: null,
  },
  {
    p: 'Google',
    o: 'Local',
    c: 'Local Campaign',
    a: 'Direction click',
    CPA: 20000,
    CPC: 4000,
    CPM: 150000,
    CTR: 5,
    CR: null,
  },
  {
    p: 'Google',
    o: 'Local',
    c: 'Local Campaign',
    a: 'Call click',
    CPA: 50000,
    CPC: 5000,
    CPM: 150000,
    CTR: 5,
    CR: null,
  },
] as const

// ── D2 Chỉ số Data ──
const D2_DATA = [
  {
    q: 'Chi phí (Ad Spend) là gì?',
    opts: [
      'Tổng doanh thu từ chiến dịch',
      'Tổng tiền đã chi để chạy quảng cáo',
      'Tiền thu về sau khi trừ chi phí',
      'Ngân sách tối đa được phê duyệt',
    ],
    ans: 1,
    explain: 'Ad Spend = tổng tiền thực tế chi để hiển thị quảng cáo.',
  },
  {
    q: 'GMV (Gross Merchandise Value) là gì?',
    opts: [
      'Doanh thu sau khi trừ hoa hồng',
      'Tổng giá trị đơn hàng đặt thành công kể cả đơn hủy và hoàn',
      'Doanh thu thuần',
      'Số đơn × giá bán',
    ],
    ans: 1,
    explain: 'GMV = tổng giá trị đơn hàng tạo ra, kể cả hủy và hoàn.',
  },
  {
    q: 'ROAS được tính theo công thức nào?',
    opts: [
      'ROAS = GMV × Chi phí',
      'ROAS = Chi phí ÷ GMV',
      'ROAS = GMV ÷ Chi phí',
      'ROAS = (GMV - Chi phí) ÷ Chi phí',
    ],
    ans: 2,
    explain: 'ROAS = GMV ÷ Chi phí. Benchmark Media Omni: TikTok ~6, Shopee ~9.',
  },
  {
    q: 'ROAS = 5 có nghĩa là gì?',
    opts: ['5đ chi phí tạo 1đ GMV', '1đ chi phí tạo 5đ GMV', 'Tỷ lệ chuyển đổi 5%', 'Doanh thu tăng 5%'],
    ans: 1,
    explain: 'ROAS = 5 → mỗi 1đ bỏ ra thu 5đ GMV.',
  },
  {
    q: 'Impression (Lượt hiển thị) là gì?',
    opts: [
      'Số người thực sự nhìn thấy QC',
      'Số lần QC hiển thị kể cả cùng 1 người thấy nhiều lần',
      'Số lần click vào QC',
      'Số lần phân phối không nhất thiết được xem',
    ],
    ans: 1,
    explain: 'Impression = số lần xuất hiện. Một người có thể tạo nhiều impression.',
  },
  {
    q: 'Điểm khác biệt giữa Reach và Impression?',
    opts: [
      'Reach tính click, Impression tính view',
      'Reach là số người unique thấy QC, Impression là tổng lần hiển thị',
      'Reach đo mobile, Impression đo tất cả',
      'Reach là paid, Impression là organic',
    ],
    ans: 1,
    explain: 'Reach = người unique. Impression = tổng lần hiển thị. Impression ÷ Reach = Frequency.',
  },
  {
    q: 'Frequency được tính bằng công thức nào?',
    opts: [
      'Frequency = Reach ÷ Impression',
      'Frequency = Impression ÷ Reach',
      'Frequency = Click ÷ Impression',
      'Frequency = Impression ÷ Click',
    ],
    ans: 1,
    explain: 'Frequency = Impression ÷ Reach.',
  },
  {
    q: 'Frequency cao ảnh hưởng đến quảng cáo như thế nào?',
    opts: [
      'Luôn tốt vì tăng nhận diện',
      'Gây ad fatigue — CTR giảm, CPC tăng',
      'Không ảnh hưởng đáng kể',
      'Chỉ ảnh hưởng remarketing',
    ],
    ans: 1,
    explain: 'Frequency cao (>3-5 trên Meta) gây ad fatigue: CTR giảm, CPC tăng.',
  },
  {
    q: 'CPC được tính theo công thức nào?',
    opts: [
      'CPC = Click ÷ Chi phí',
      'CPC = Chi phí ÷ Click',
      'CPC = Impression ÷ Click',
      'CPC = Chi phí × Click',
    ],
    ans: 1,
    explain: 'CPC = Chi phí ÷ Số click.',
  },
  {
    q: 'Yếu tố nào KHÔNG ảnh hưởng đến CPC?',
    opts: ['Chất lượng creative', 'Mức cạnh tranh auction', 'CVR sau click', 'CTR quảng cáo'],
    ans: 2,
    explain: 'CVR xảy ra sau click nên không ảnh hưởng ngược lại CPC.',
  },
  {
    q: 'CPM là chi phí cho bao nhiêu lượt hiển thị?',
    opts: ['10 lượt', '100 lượt', '1.000 lượt', '10.000 lượt'],
    ans: 2,
    explain: 'CPM = Cost Per Mille = chi phí 1.000 lần hiển thị.',
  },
  {
    q: 'Yếu tố nào làm CPM tăng cao trên Meta Ads?',
    opts: [
      'Audience rộng, ít cạnh tranh',
      'Audience nhỏ, mùa cao điểm, creative score thấp',
      'CTR quá cao',
      'Budget quá nhỏ',
    ],
    ans: 1,
    explain: 'CPM tăng: audience nhỏ, mùa cao điểm, relevance thấp.',
  },
  {
    q: 'CTR được tính theo công thức nào?',
    opts: [
      'CTR = Click ÷ Reach × 100%',
      'CTR = Click ÷ Impression × 100%',
      'CTR = Impression ÷ Click × 100%',
      'CTR = Conversion ÷ Click × 100%',
    ],
    ans: 1,
    explain: 'CTR = Click ÷ Impression × 100%.',
  },
  {
    q: 'CTR All và CTR Link Click khác nhau thế nào trên Meta?',
    opts: [
      'CTR All chỉ tính link click',
      'CTR All tính mọi click, CTR Link Click chỉ tính click vào destination URL',
      'Hai chỉ số giống nhau',
      'CTR All cho video, Link Click cho static',
    ],
    ans: 1,
    explain: 'CTR Link Click = click vào landing page. Dùng Link Click để đo intent thực.',
  },
  {
    q: 'Add to Cart Rate được tính như thế nào?',
    opts: [
      'Số thêm giỏ ÷ Đơn hàng × 100%',
      'Số thêm giỏ ÷ Lượt xem trang SP × 100%',
      'Số thêm giỏ ÷ Click × 100%',
      'Số thêm giỏ ÷ Impression × 100%',
    ],
    ans: 1,
    explain: 'Add to Cart Rate = Số thêm giỏ ÷ Product Page View × 100%.',
  },
  {
    q: 'Add to Cart cao nhưng Checkout thấp thường do đâu?',
    opts: [
      'Creative không hấp dẫn',
      'Giá không cạnh tranh, phí ship cao, UX checkout phức tạp',
      'Audience targeting sai',
      'Budget không đủ',
    ],
    ans: 1,
    explain: 'Bottleneck giỏ hàng→checkout: shipping fee cao, thiếu payment method, UX phức tạp.',
  },
  {
    q: 'CIR được tính bằng công thức nào?',
    opts: [
      'CIR = GMV ÷ Chi phí × 100%',
      'CIR = Chi phí ÷ GMV × 100%',
      'CIR = (CP + Giá vốn) ÷ GMV × 100%',
      'CIR = CP ÷ Lợi nhuận × 100%',
    ],
    ans: 1,
    explain: 'CIR = Chi phí ÷ GMV × 100%. Nghịch đảo ROAS: ROAS = 7 → CIR ≈ 14.3%.',
  },
  {
    q: 'ROI khác ROAS ở điểm quan trọng nào?',
    opts: [
      'Là hai tên của cùng chỉ số',
      'ROI tính trên lợi nhuận thực sau trừ giá vốn, ROAS tính trên GMV',
      'ROAS tính lợi nhuận, ROI tính doanh thu',
      'ROI chỉ dùng cho ecommerce',
    ],
    ans: 1,
    explain: 'ROAS = GMV/Chi phí. ROI = (Lợi nhuận - CP)/CP × 100%.',
  },
  {
    q: 'AOV được tính như thế nào?',
    opts: ['AOV = Đơn ÷ GMV', 'AOV = GMV ÷ Đơn', 'AOV = GMV ÷ Số SP', 'AOV = Chi phí ÷ Đơn'],
    ans: 1,
    explain: 'AOV = GMV ÷ Số đơn.',
  },
  {
    q: 'Yếu tố giúp tăng AOV hiệu quả nhất?',
    opts: [
      'Giảm giá SP',
      'Bundle, upsell, cross-sell và ngưỡng freeship',
      'Tăng tần suất QC',
      'Mở rộng audience',
    ],
    ans: 1,
    explain: 'AOV tăng bằng: Bundle, Upsell, Cross-sell, Minimum order freeship.',
  },
  {
    q: 'CPA được tính như thế nào?',
    opts: [
      'CPA = Click ÷ Conversion',
      'CPA = Chi phí ÷ Conversion',
      'CPA = Conversion ÷ Chi phí',
      'CPA = Chi phí ÷ Impression × 1000',
    ],
    ans: 1,
    explain: 'CPA = Chi phí ÷ Số conversion.',
  },
  {
    q: 'Benchmark ROAS phù hợp cho Shopee Ads theo Media Omni?',
    opts: ['3-4', '5-6', '8-10', '12+'],
    ans: 2,
    explain: 'Benchmark Shopee Media Omni: ROAS ~9. Range 8-10 là tốt.',
  },
  {
    q: 'Tại sao ROAS Shopee (~9) cao hơn TikTok (~6)?',
    opts: [
      'Shopee nhiều user hơn',
      'Shopee = marketplace với intent mua cao; TikTok = social cần tạo demand trước',
      'TikTok ads đắt hơn',
      'Shopee tính ROAS khác',
    ],
    ans: 1,
    explain: 'TikTok = demand creation. Shopee = intent capture: user đã muốn mua → CR cao.',
  },
  {
    q: 'Drop-off lớn nhất trong funnel TikTok Shop thường ở đâu?',
    opts: [
      'Impression → Click',
      'Product View → Add to Cart',
      'Add to Cart → Checkout',
      'Checkout → Purchase',
    ],
    ans: 1,
    explain: 'Drop-off lớn nhất ở Product View → Add to Cart.',
  },
  {
    q: 'CPM tăng 30%, CTR tăng 30%, CPC thay đổi thế nào?',
    opts: ['CPC tăng 30%', 'CPC giảm 30%', 'CPC không thay đổi', 'CPC tăng 60%'],
    ans: 2,
    explain: 'CPC = CPM/(CTR×10). Tăng cùng tỷ lệ → CPC giữ nguyên.',
  },
  {
    q: 'Shopee GMV trực tiếp và gián tiếp khác nhau thế nào?',
    opts: [
      'Direct = click rồi mua ngay; Indirect = xem, rời, quay lại mua trong attribution window',
      'Direct = desktop; Indirect = mobile',
      'Direct = mua SP được QC; Indirect = mua SP khác',
      'Direct = paid; Indirect = organic',
    ],
    ans: 0,
    explain:
      'Direct GMV = đơn trong session click ads. Indirect = click ads, không mua ngay, quay lại trong window.',
  },
  {
    q: 'Repeat Purchase Rate (RPR) phản ánh điều gì?',
    opts: [
      'Tỷ lệ click QC lần 2',
      'Tỷ lệ khách đã mua quay lại mua thêm',
      'Số lần xem QC trung bình',
      'Tỷ lệ quay lại trang sau bounce',
    ],
    ans: 1,
    explain: 'RPR = Khách mua lại ÷ Tổng khách đã mua × 100%.',
  },
  {
    q: 'ROAS tốt nhưng CIR cũng cao là dấu hiệu gì?',
    opts: [
      'Campaign over-spend',
      'Biên lợi nhuận thấp, cần review pricing',
      'Audience bão hòa',
      'Creative hết hiệu quả',
    ],
    ans: 1,
    explain: 'CIR cao = chi phí ads chiếm tỷ trọng lớn trong GMV.',
  },
  {
    q: 'Purchase Rate trong TikTok Shop được tính thế nào?',
    opts: [
      'Đơn ÷ Impression × 100%',
      'Đơn ÷ Click × 100%',
      'Đơn ÷ Lượt xem trang SP × 100%',
      'Đơn ÷ Thêm giỏ × 100%',
    ],
    ans: 2,
    explain: 'Purchase Rate = Đơn ÷ Product Page View × 100%.',
  },
  {
    q: 'Yếu tố ảnh hưởng nhiều nhất đến RPR?',
    opts: [
      'Tần suất retargeting',
      'Chất lượng SP, trải nghiệm mua và CS sau bán',
      'CTR QC brand',
      'Ngân sách campaign',
    ],
    ans: 1,
    explain: 'RPR phụ thuộc chủ yếu vào trải nghiệm sau mua: chất lượng SP, giao hàng nhanh, CS hậu mãi.',
  },
]

const SECONDS_PER_QUESTION = 30

const shuf = <T,>(a: T[]): T[] => [...a].sort(() => Math.random() - 0.5)
const fmtVi = (m: string, v: number | null) => {
  if (v == null) return '—'
  if (m === 'CTR' || m === 'CR') return v + '%'
  return v.toLocaleString('vi-VN') + 'đ'
}

type Screen = 'hub' | 'd1-setup' | 'd1-quiz' | 'd2-quiz' | 'd2-result'

// ── Timer ring component ──
function TimerRing({ seconds, total }: { seconds: number; total: number }) {
  const C = 2 * Math.PI * 18
  const offset = C * (1 - seconds / total)
  const tone = seconds <= 5 ? 'danger' : seconds <= 10 ? 'warn' : ''
  return (
    <div className={`qz-timer${tone === 'danger' ? ' danger' : ''}`} title={`${seconds}s còn lại`}>
      <svg viewBox="0 0 44 44">
        <circle className="qz-timer-bg" cx="22" cy="22" r="18" strokeWidth="3.5" fill="none" />
        <circle
          className={`qz-timer-fg ${tone}`}
          cx="22"
          cy="22"
          r="18"
          strokeWidth="3.5"
          fill="none"
          strokeDasharray={C}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="qz-timer-num">{seconds}</span>
    </div>
  )
}

// ── Quiz exit guard ──
function useExitGuard(active: boolean) {
  useEffect(() => {
    if (!active) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [active])
}

// ── Toast ──
function Toast({ msg }: { msg: string }) {
  if (!msg) return null
  return (
    <div
      className="toast show success"
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
      }}
    >
      <div className="toast-dot" />
      <span>{msg}</span>
    </div>
  )
}

export default function QuizPage() {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [screen, setScreen] = useState<Screen>('hub')

  // D2 state
  const [d2Idx, setD2Idx] = useState(0)
  const [d2Ans, setD2Ans] = useState<number[]>(new Array(D2_DATA.length).fill(-1))
  const [d2Score, setD2Score] = useState(0)
  const [d2Time, setD2Time] = useState(SECONDS_PER_QUESTION)
  const [d2Streak, setD2Streak] = useState(0)
  const [d2NextIn, setD2NextIn] = useState<number | null>(null)
  const [saved, setSaved] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    const u = getSession()
    if (u) setUser(u)
  }, [])

  // D2 timer: count down while on a question that hasn't been answered
  useEffect(() => {
    if (screen !== 'd2-quiz') return
    if (d2Ans[d2Idx] !== -1) return
    if (d2Time <= 0) {
      // Time out → mark as wrong (record -2 to distinguish from timeout)
      setD2Ans(prev => {
        const n = [...prev]
        n[d2Idx] = -2
        return n
      })
      setD2Streak(0)
      return
    }
    const t = setTimeout(() => setD2Time(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [screen, d2Idx, d2Time, d2Ans])

  useExitGuard(screen === 'd2-quiz' || screen === 'd1-quiz')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function startD2() {
    setD2Idx(0)
    setD2Ans(new Array(D2_DATA.length).fill(-1))
    setSaved(false)
    setD2Time(SECONDS_PER_QUESTION)
    setD2Streak(0)
    setScreen('d2-quiz')
  }

  function d2Pick(optIdx: number) {
    if (d2Ans[d2Idx] !== -1) return
    const newAns = [...d2Ans]
    newAns[d2Idx] = optIdx
    setD2Ans(newAns)
    const correct = optIdx === D2_DATA[d2Idx].ans
    if (correct) setD2Streak(s => s + 1)
    else setD2Streak(0)
    // Auto-advance: shorter for correct (read explanation briefly), longer for wrong
    setD2NextIn(correct ? 1500 : 3000)
  }

  function d2Goto(target: number) {
    if (target < 0 || target >= D2_DATA.length) return
    setD2Idx(target)
    setD2Time(d2Ans[target] === -1 ? SECONDS_PER_QUESTION : 0)
    setD2NextIn(null)
  }

  function d2Next() {
    setD2NextIn(null)
    if (d2Idx < D2_DATA.length - 1) {
      d2Goto(d2Idx + 1)
      return
    }
    const sc = d2Ans.reduce((acc, a, i) => acc + (a === D2_DATA[i].ans ? 1 : 0), 0)
    setD2Score(sc)
    setScreen('d2-result')
  }

  // Auto-advance for D2 after pick (or timeout)
  useEffect(() => {
    if (screen !== 'd2-quiz') return
    if (d2NextIn === null) return
    const t = setTimeout(d2Next, d2NextIn)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d2NextIn, screen, d2Idx])

  // Auto-schedule next when timeout (-2) recorded
  useEffect(() => {
    if (screen !== 'd2-quiz') return
    if (d2Ans[d2Idx] === -2 && d2NextIn === null) setD2NextIn(2500)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d2Ans, d2Idx, screen])

  async function saveScore(quizType: string, score: number, total: number) {
    if (saved || !user) return
    setSaved(true)
    await fetch('/api/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: user.username, name: user.name, quiz_type: quizType, score, total }),
    })
    showToast('Đã lưu điểm!')
  }

  if (!user) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#94a3b8',
        }}
      >
        Đang tải...
      </div>
    )
  }

  return (
    <>
      <Toast msg={toast} />
      <div className="qz-shell">
        {screen === 'hub' && (
          <>
            <h1 className="qz-page-title">Quiz Hub</h1>
            <p className="qz-page-sub">Chọn dạng bài để bắt đầu kiểm tra kiến thức.</p>
            <div className="qz-hub-grid">
              <button
                className="qz-hub-card"
                onClick={() => setScreen('d1-setup')}
                style={{ border: 'none', textAlign: 'left' }}
              >
                <div className="qz-hub-card-icon amber">{Icon.zap(28)}</div>
                <div className="qz-hub-card-title">Dạng 1 — Benchmark Ads Thị trường</div>
                <div className="qz-hub-card-desc">
                  Kiểm tra benchmark thực chiến — CPA/CPC/CPM/CTR/CR theo từng platform. Câu sai lặp lại đến
                  khi thuộc.
                </div>
                <span className="qz-hub-card-tag">
                  {Icon.checkCircle(12)} Sẵn sàng · ~{D1_DATA.length * 5} câu
                </span>
              </button>
              <button className="qz-hub-card" onClick={startD2} style={{ border: 'none', textAlign: 'left' }}>
                <div className="qz-hub-card-icon cyan">{Icon.barChart(28)}</div>
                <div className="qz-hub-card-title">Dạng 2 — Chỉ số Ads</div>
                <div className="qz-hub-card-desc">
                  18 chỉ số — định nghĩa, công thức, yếu tố tác động. {D2_DATA.length} câu trắc nghiệm 4 đáp
                  án, {SECONDS_PER_QUESTION}s mỗi câu.
                </div>
                <span className="qz-hub-card-tag">
                  {Icon.checkCircle(12)} Sẵn sàng · {D2_DATA.length} câu
                </span>
              </button>
            </div>
          </>
        )}

        {screen === 'd1-setup' && (
          <D1Quiz user={user} onSaveScore={saveScore} onBack={() => setScreen('hub')} />
        )}

        {screen === 'd2-quiz' &&
          (() => {
            const q = D2_DATA[d2Idx]
            const userAns = d2Ans[d2Idx]
            const answered = userAns !== -1
            const correct = userAns === q.ans
            const timedOut = userAns === -2
            const answeredCount = d2Ans.filter(a => a !== -1).length
            const correctCount = d2Ans.reduce((acc, a, i) => acc + (a === D2_DATA[i].ans ? 1 : 0), 0)

            return (
              <div>
                <div className="qz-guard">
                  <span className="qz-guard-icon">{Icon.lock(16)}</span>
                  <span>Đang làm bài. Đừng đóng tab — tiến độ sẽ mất.</span>
                </div>

                <div className="qz-topbar">
                  <div className="qz-progress-track">
                    <div
                      className="qz-progress-fill"
                      style={{ width: `${((d2Idx + (answered ? 1 : 0)) / D2_DATA.length) * 100}%` }}
                    />
                  </div>
                  <span className="qz-progress-label">
                    {d2Idx + 1}/{D2_DATA.length}
                  </span>
                  {!answered && <TimerRing seconds={d2Time} total={SECONDS_PER_QUESTION} />}
                </div>

                <div className="qz-stats">
                  <span className="qz-chip success">
                    {Icon.checkCircle(12)} {correctCount} đúng
                  </span>
                  <span className="qz-chip error">
                    {Icon.xCircle(12)} {answeredCount - correctCount} sai
                  </span>
                  <span className={`qz-chip streak${d2Streak >= 3 ? ' hot' : ''}`}>
                    {Icon.flame(12)} Streak {d2Streak}
                  </span>
                </div>

                <div className="qz-card">
                  <div className="qz-q-num">Câu hỏi {d2Idx + 1}</div>
                  <div className="qz-q-text">{q.q}</div>
                  <div className="qz-opts">
                    {q.opts.map((opt, i) => {
                      const isCorrect = i === q.ans
                      const isPicked = i === userAns
                      let cls = 'qz-opt'
                      if (answered) {
                        if (isCorrect) cls += ' correct'
                        else if (isPicked) cls += ' wrong'
                      }
                      return (
                        <button
                          key={i}
                          type="button"
                          className={cls}
                          disabled={answered}
                          onClick={() => d2Pick(i)}
                        >
                          <span className="qz-opt-letter">{['A', 'B', 'C', 'D'][i]}</span>
                          <span style={{ flex: 1 }}>{opt}</span>
                          {answered && isCorrect && (
                            <span className="qz-opt-icon correct">{Icon.checkCircle(20)}</span>
                          )}
                          {answered && isPicked && !isCorrect && (
                            <span className="qz-opt-icon wrong">{Icon.xCircle(20)}</span>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {answered && (
                    <div className={`qz-explain ${timedOut ? 'wrong' : correct ? 'correct' : 'wrong'}`}>
                      <span className="qz-explain-icon">
                        {timedOut ? Icon.clock(18) : correct ? Icon.checkCircle(18) : Icon.xCircle(18)}
                      </span>
                      <div>
                        {timedOut ? (
                          <strong>Hết giờ!</strong>
                        ) : correct ? (
                          <strong>Chính xác!</strong>
                        ) : (
                          <strong>Chưa đúng.</strong>
                        )}{' '}
                        {q.explain}
                      </div>
                    </div>
                  )}

                  <div className="qz-actions">
                    <button
                      className="qz-btn qz-btn-ghost"
                      onClick={() => d2Goto(d2Idx - 1)}
                      disabled={d2Idx === 0}
                    >
                      {Icon.arrowLeft(14)} Câu trước
                    </button>
                    {answered && (
                      <button className="qz-btn qz-btn-primary" onClick={d2Next}>
                        {d2Idx === D2_DATA.length - 1 ? 'Nộp bài' : 'Bỏ qua chờ'} {Icon.arrowRight(14)}
                      </button>
                    )}
                  </div>
                  {answered && d2NextIn !== null && (
                    <div className="qz-autonext">
                      <div className="qz-autonext-bar" style={{ animationDuration: `${d2NextIn}ms` }} />
                      <span>{d2Idx === D2_DATA.length - 1 ? 'Đang chấm điểm…' : 'Tự chuyển câu tiếp…'}</span>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <button
                    className="qz-btn qz-btn-ghost"
                    onClick={() => {
                      if (confirm('Thoát bài? Tiến độ sẽ mất.')) setScreen('hub')
                    }}
                    style={{ fontSize: '.78rem', padding: '7px 14px' }}
                  >
                    Thoát bài
                  </button>
                </div>
              </div>
            )
          })()}

        {screen === 'd2-result' && (
          <ResultScreen
            score={d2Score}
            total={D2_DATA.length}
            saved={saved}
            onBack={() => setScreen('hub')}
            onSave={() => {
              if (!saved) saveScore('Chỉ số Ads (D2)', d2Score, D2_DATA.length)
              else showToast('Đã lưu rồi!')
            }}
            onRetry={startD2}
          />
        )}
      </div>
    </>
  )
}

// ── Result screen (shared) ──
function ResultScreen({
  score,
  total,
  saved,
  onBack,
  onSave,
  onRetry,
}: {
  score: number
  total: number
  saved: boolean
  onBack: () => void
  onSave: () => void
  onRetry: () => void
}) {
  const pct = Math.round((score / total) * 100)
  const tier = pct >= 80 ? 'gold' : pct >= 50 ? 'silver' : 'bronze'
  const tierIcon = pct >= 80 ? Icon.trophy(40) : pct >= 50 ? Icon.checkCircle(40) : Icon.bookOpen(40)
  const message =
    pct >= 80 ? 'Xuất sắc!' : pct >= 50 ? 'Khá tốt — tiếp tục ôn luyện!' : 'Cần ôn thêm — đừng nản!'

  return (
    <div className="qz-result">
      <div className={`qz-result-icon ${tier}`}>{tierIcon}</div>
      <div className="qz-result-title">Kết quả</div>
      <div className="qz-result-score">
        {score}/{total}
      </div>
      <div className="qz-result-pct">
        {pct}% — {message}
      </div>
      <div className="qz-result-actions">
        <button className="qz-btn qz-btn-ghost" onClick={onBack}>
          {Icon.arrowLeft(14)} Quay lại Hub
        </button>
        <button className="qz-btn qz-btn-primary" onClick={onSave} disabled={saved}>
          {saved ? Icon.checkCircle(14) : Icon.save(14)} {saved ? 'Đã lưu điểm' : 'Lưu điểm'}
        </button>
        <button className="qz-btn qz-btn-ghost" onClick={onRetry}>
          {Icon.refresh(14)} Làm lại
        </button>
      </div>
    </div>
  )
}

// ── D1 Component ──
type D1Entry = {
  row: (typeof D1_DATA)[number]
  metric: string
  opts: number[]
  ci: number
  mastered: boolean
  failCount: number
}

function D1Quiz({
  user,
  onSaveScore,
  onBack,
}: {
  user: SessionUser
  onSaveScore: (qt: string, sc: number, tot: number) => void
  onBack: () => void
}) {
  const METRICS = ['CPA', 'CPC', 'CPM', 'CTR', 'CR']
  const [platFilter, setPlatFilter] = useState('ALL')
  const [metFilter, setMetFilter] = useState('ALL')
  const [started, setStarted] = useState(false)
  const [entries, setEntries] = useState<Record<string, D1Entry>>({})
  const [queue, setQueue] = useState<string[]>([])
  const [qi, setQi] = useState(0)
  const [retries, setRetries] = useState<string[]>([])
  const [roundN, setRoundN] = useState(1)
  const [streak, setStreak] = useState(0)
  const [fails, setFails] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [done, setDone] = useState(false)
  const [mastered, setMastered] = useState(0)
  const [time, setTime] = useState(SECONDS_PER_QUESTION)
  const [nextIn, setNextIn] = useState<number | null>(null)
  const [saved, setSaved] = useState(false)
  const startedRef = useRef(false)

  // D1 timer
  useEffect(() => {
    if (!started || done || picked !== null) return
    if (time <= 0) {
      setPicked(-1)
      setStreak(0)
      setFails(f => f + 1)
      return
    }
    const t = setTimeout(() => setTime(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [started, done, picked, time])

  function buildAndStart() {
    const filtered = D1_DATA.filter(r => platFilter === 'ALL' || r.p === platFilter)
    const mets = metFilter === 'ALL' ? METRICS : [metFilter]
    const ent: Record<string, D1Entry> = {}
    filtered.forEach(row => {
      mets.forEach(m => {
        const v = row[m as keyof typeof row]
        if (v == null) return
        const id = `${row.p}_${row.o}_${row.c}_${row.a}_${m}`
        const pool = D1_DATA.filter(
          r => r !== row && r[m as keyof typeof r] != null && r[m as keyof typeof r] !== v,
        ).map(r => r[m as keyof typeof r] as number)
        const uniq = Array.from(new Set(pool))
        const wrong = shuf(uniq).slice(0, 3)
        while (wrong.length < 3)
          wrong.push(Math.round(((v as number) * (0.5 + Math.random())) / 100) * 100 || 1)
        const opts = shuf([v as number, ...wrong])
        ent[id] = { row, metric: m, opts, ci: opts.indexOf(v as number), mastered: false, failCount: 0 }
      })
    })
    const q = shuf(Object.keys(ent))
    setEntries(ent)
    setQueue(q)
    setQi(0)
    setRetries([])
    setRoundN(1)
    setStreak(0)
    setFails(0)
    setPicked(null)
    setMastered(0)
    setTime(SECONDS_PER_QUESTION)
    setStarted(true)
    setSaved(false)
    startedRef.current = true
  }

  function pick(i: number) {
    if (picked !== null) return
    setPicked(i)
    const id = queue[qi]
    const e = entries[id]
    const ok = i === e.ci
    const newEnt = { ...entries }
    newEnt[id] = { ...e, mastered: ok, failCount: ok ? e.failCount : e.failCount + 1 }
    setEntries(newEnt)
    if (ok) {
      setStreak(s => s + 1)
      setMastered(m => m + 1)
    } else {
      setStreak(0)
      setFails(f => f + 1)
      if (!retries.includes(id)) setRetries(r => [...r, id])
    }
    setNextIn(ok ? 1500 : 3000)
  }

  // Auto-advance D1 after pick or timeout
  useEffect(() => {
    if (!started || done) return
    if (nextIn === null) return
    const t = setTimeout(() => next(), nextIn)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextIn, started, done])

  // Auto-schedule when timeout (-1) recorded
  useEffect(() => {
    if (!started || done) return
    if (picked === -1 && nextIn === null) setNextIn(2500)
  }, [picked, started, done, nextIn])

  function next() {
    setPicked(null)
    setTime(SECONDS_PER_QUESTION)
    setNextIn(null)
    const nextQi = qi + 1
    if (nextQi >= queue.length) {
      if (retries.length === 0) {
        setDone(true)
        onSaveScore('Benchmark Ads (D1)', mastered, Object.keys(entries).length)
        return
      }
      setRoundN(r => r + 1)
      setQueue(shuf([...retries]))
      setRetries([])
      setQi(0)
    } else {
      setQi(nextQi)
    }
  }

  if (done) {
    const total = Object.keys(entries).length
    return (
      <ResultScreen
        score={mastered}
        total={total}
        saved={saved}
        onBack={onBack}
        onSave={() => setSaved(true)}
        onRetry={buildAndStart}
      />
    )
  }

  if (!started) {
    return (
      <div>
        <button className="qz-btn qz-btn-ghost" onClick={onBack} style={{ marginBottom: 18 }}>
          {Icon.arrowLeft(14)} Quay lại Hub
        </button>
        <div className="qz-card">
          <h2
            style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              marginBottom: 6,
              color: '#f1f5f9',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ color: '#fbbf24' }}>{Icon.zap(22)}</span>Dạng 1 — Benchmark Ads
          </h2>
          <p style={{ color: '#94a3b8', marginBottom: 22 }}>
            Chọn platform và metric muốn ôn. Câu sai sẽ lặp lại đến khi thuộc.
          </p>

          <div className="qz-setup-row">
            <span className="qz-setup-label">Platform</span>
            <div className="qz-pill-group">
              {['ALL', 'TikTok', 'Meta', 'Shopee', 'Google'].map(p => (
                <button
                  key={p}
                  className={`qz-pill${platFilter === p ? ' active' : ''}`}
                  onClick={() => setPlatFilter(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="qz-setup-row">
            <span className="qz-setup-label">Metric</span>
            <div className="qz-pill-group">
              {['ALL', 'CPA', 'CPC', 'CPM', 'CTR', 'CR'].map(m => (
                <button
                  key={m}
                  className={`qz-pill${metFilter === m ? ' active' : ''}`}
                  onClick={() => setMetFilter(m)}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <button className="qz-btn qz-btn-primary" onClick={buildAndStart} style={{ marginTop: 8 }}>
            Bắt đầu {Icon.arrowRight(14)}
          </button>
        </div>
      </div>
    )
  }

  const id = queue[qi]
  const e = entries[id]
  const tot = Object.keys(entries).length
  const timedOut = picked === -1
  const correct = picked !== null && picked === e.ci

  return (
    <div>
      <div className="qz-guard">
        <span className="qz-guard-icon">{Icon.lock(16)}</span>
        <span>Đang làm bài. Đừng đóng tab — tiến độ sẽ mất.</span>
      </div>

      <div className="qz-topbar">
        <div className="qz-progress-track">
          <div className="qz-progress-fill" style={{ width: `${(mastered / tot) * 100}%` }} />
        </div>
        <span className="qz-progress-label">
          {mastered}/{tot} thuộc
        </span>
        {picked === null && <TimerRing seconds={time} total={SECONDS_PER_QUESTION} />}
      </div>

      <div className="qz-stats">
        <span className="qz-chip success">
          {Icon.checkCircle(12)} {mastered}
        </span>
        <span className="qz-chip error">
          {Icon.xCircle(12)} {fails}
        </span>
        <span className={`qz-chip streak${streak >= 3 ? ' hot' : ''}`}>
          {Icon.flame(12)} Streak {streak}
        </span>
        <span className="qz-chip">Vòng {roundN}</span>
      </div>

      <div className="qz-card">
        <div className="qz-q-tags">
          <span className="qz-tag">{e.row.p}</span>
          <span className="qz-tag muted">{e.row.o}</span>
          {e.failCount > 0 && <span className="qz-tag danger">{Icon.alertTriangle(11)} Câu khó</span>}
        </div>
        <div className="qz-q-num">
          Câu hỏi {qi + 1}/{queue.length} · Vòng {roundN}
        </div>
        <div className="qz-q-text">
          <strong>{e.metric}</strong> của{' '}
          <span style={{ color: '#60a5fa' }}>
            {e.row.p} · {e.row.c} · {e.row.a}
          </span>{' '}
          là bao nhiêu?
        </div>
        <div className="qz-opts">
          {e.opts.map((v, i) => {
            const isCorrect = i === e.ci
            const isPicked = i === picked
            let cls = 'qz-opt'
            if (picked !== null) {
              if (isCorrect) cls += ' correct'
              else if (isPicked) cls += ' wrong'
            }
            return (
              <button
                key={i}
                type="button"
                className={cls}
                disabled={picked !== null}
                onClick={() => pick(i)}
              >
                <span className="qz-opt-letter">{['A', 'B', 'C', 'D'][i]}</span>
                <span style={{ flex: 1 }}>{fmtVi(e.metric, v)}</span>
                {picked !== null && isCorrect && (
                  <span className="qz-opt-icon correct">{Icon.checkCircle(20)}</span>
                )}
                {picked !== null && isPicked && !isCorrect && (
                  <span className="qz-opt-icon wrong">{Icon.xCircle(20)}</span>
                )}
              </button>
            )
          })}
        </div>

        {picked !== null && (
          <div className={`qz-explain ${timedOut ? 'wrong' : correct ? 'correct' : 'wrong'}`}>
            <span className="qz-explain-icon">
              {timedOut ? Icon.clock(18) : correct ? Icon.checkCircle(18) : Icon.xCircle(18)}
            </span>
            <div>
              {timedOut ? (
                <>
                  <strong>Hết giờ.</strong>{' '}
                </>
              ) : correct ? (
                <>
                  <strong>Chính xác!</strong>{' '}
                </>
              ) : (
                <>
                  <strong>Sai.</strong>{' '}
                </>
              )}
              Đáp án đúng: <strong>{fmtVi(e.metric, e.opts[e.ci])}</strong>
            </div>
          </div>
        )}

        <div className="qz-actions">
          <span className="qz-progress-label">Câu sai sẽ lặp lại tới khi thuộc</span>
          {picked !== null && (
            <button className="qz-btn qz-btn-primary" onClick={next}>
              {qi + 1 >= queue.length && retries.length === 0
                ? 'Xem kết quả'
                : qi + 1 >= queue.length
                  ? 'Ôn câu sai'
                  : 'Bỏ qua chờ'}{' '}
              {Icon.arrowRight(14)}
            </button>
          )}
        </div>
        {picked !== null && nextIn !== null && (
          <div className="qz-autonext">
            <div className="qz-autonext-bar" style={{ animationDuration: `${nextIn}ms` }} />
            <span>Tự chuyển câu tiếp…</span>
          </div>
        )}
      </div>

      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <button
          className="qz-btn qz-btn-ghost"
          onClick={() => {
            if (confirm('Thoát bài? Tiến độ sẽ mất.')) onBack()
          }}
          style={{ fontSize: '.78rem', padding: '7px 14px' }}
        >
          Thoát bài
        </button>
      </div>
    </div>
  )
}
