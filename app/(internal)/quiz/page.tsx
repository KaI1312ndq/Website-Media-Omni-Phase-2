'use client'
import { useEffect, useState } from 'react'
import { getSession, SessionUser } from '@/lib/auth'
import '@/app/(internal)/dashboard/dashboard.css'

// ── D1 Benchmark Data ──
const D1_DATA = [
  {p:"TikTok",o:"Reach",c:"—",a:"Lượt hiển thị",CPA:10,CPC:null,CPM:10000,CTR:null,CR:null},
  {p:"TikTok",o:"Traffic",c:"Website/App",a:"Lượt click",CPA:null,CPC:100,CPM:30000,CTR:10,CR:null},
  {p:"TikTok",o:"Community interaction",c:"—",a:"Lượt follow",CPA:2500,CPC:null,CPM:200000,CTR:null,CR:null},
  {p:"TikTok",o:"Community interaction",c:"—",a:"Lượt view video",CPA:12,CPC:null,CPM:14000,CTR:null,CR:null},
  {p:"TikTok",o:"Sales",c:"Website",a:"Purchase",CPA:50000,CPC:3000,CPM:50000,CTR:3,CR:2},
  {p:"TikTok",o:"Sales",c:"PGM",a:"GMV tổng",CPA:60000,CPC:1500,CPM:80000,CTR:1,CR:3},
  {p:"TikTok",o:"Sales",c:"LGM",a:"GMV tổng",CPA:50000,CPC:2000,CPM:40000,CTR:3,CR:5},
  {p:"Meta",o:"Awareness",c:"—",a:"Reach",CPA:20000,CPC:null,CPM:15000,CTR:null,CR:null},
  {p:"Meta",o:"Traffic",c:"Website/App",a:"Link click",CPA:500,CPC:500,CPM:15000,CTR:5,CR:null},
  {p:"Meta",o:"Engagement",c:"Post/Video",a:"Like/Comment/Share",CPA:900,CPC:null,CPM:18000,CTR:null,CR:null},
  {p:"Meta",o:"Engagement",c:"Post/Video",a:"ThruPlay 15s",CPA:100,CPC:null,CPM:18000,CTR:null,CR:null},
  {p:"Meta",o:"Engagement",c:"Page",a:"Page like",CPA:2500,CPC:null,CPM:35000,CTR:null,CR:null},
  {p:"Meta",o:"Leads",c:"Instant form",a:"Form submit",CPA:50000,CPC:500,CPM:35000,CTR:5,CR:25},
  {p:"Meta",o:"Leads",c:"Website",a:"Web lead submit",CPA:70000,CPC:500,CPM:35000,CTR:5,CR:40},
  {p:"Meta",o:"Leads",c:"Messenger",a:"Conversation start",CPA:25000,CPC:2500,CPM:45000,CTR:2.5,CR:null},
  {p:"Meta",o:"Sales",c:"Website",a:"Purchase",CPA:50000,CPC:3000,CPM:70000,CTR:3,CR:2.2},
  {p:"Meta",o:"Sales",c:"Messenger",a:"Purchase via chat",CPA:70000,CPC:5000,CPM:100000,CTR:2,CR:5},
  {p:"Meta",o:"Sales",c:"CPAS Shopee",a:"Purchase",CPA:30000,CPC:1500,CPM:50000,CTR:3,CR:2},
  {p:"Shopee",o:"Ads Product",c:"CPC Search",a:"Purchase",CPA:40000,CPC:2100,CPM:40000,CTR:2.3,CR:5},
  {p:"Shopee",o:"New Product",c:"New Product",a:"Purchase",CPA:75000,CPC:3000,CPM:35000,CTR:1.9,CR:4},
  {p:"Shopee",o:"Branding",c:"—",a:"Purchase",CPA:80000,CPC:8000,CPM:1000000,CTR:6,CR:10},
  {p:"Shopee",o:"Ads Shop",c:"Tăng nhận diện",a:"Purchase",CPA:67500,CPC:4500,CPM:45000,CTR:5,CR:6},
  {p:"Shopee",o:"Ads Shop",c:"Giá thầu tự động",a:"Purchase",CPA:76000,CPC:3800,CPM:40000,CTR:4,CR:5},
  {p:"Shopee",o:"Ads Live",c:"Thủ công",a:"Purchase",CPA:50000,CPC:null,CPM:60000,CTR:null,CR:null},
  {p:"Shopee",o:"Ads Live",c:"Tối ưu lượt xem",a:"Live View",CPA:50,CPC:null,CPM:40000,CTR:null,CR:null},
  {p:"Google",o:"Sales",c:"Search Ads",a:"Conversion",CPA:50000,CPC:3000,CPM:140000,CTR:5.5,CR:3.5},
  {p:"Google",o:"Sales",c:"Shopping Ads",a:"Purchase",CPA:50000,CPC:2000,CPM:80000,CTR:5,CR:3.2},
  {p:"Google",o:"Sales",c:"PMax",a:"Purchase",CPA:50000,CPC:1000,CPM:50000,CTR:6,CR:2.5},
  {p:"Google",o:"Traffic",c:"Display/GDN",a:"Click",CPA:null,CPC:100,CPM:10000,CTR:10,CR:null},
  {p:"Google",o:"Awareness",c:"YT Non-skip",a:"Impression",CPA:15,CPC:null,CPM:15000,CTR:null,CR:null},
  {p:"Google",o:"Awareness",c:"YT Skippable",a:"View 30s",CPA:200,CPC:null,CPM:35000,CTR:null,CR:null},
  {p:"Google",o:"Awareness",c:"YT Bumper 6s",a:"Impression",CPA:15,CPC:null,CPM:15000,CTR:null,CR:null},
  {p:"Google",o:"Local",c:"Local Campaign",a:"Direction click",CPA:20000,CPC:4000,CPM:150000,CTR:5,CR:null},
  {p:"Google",o:"Local",c:"Local Campaign",a:"Call click",CPA:50000,CPC:5000,CPM:150000,CTR:5,CR:null},
] as const

// ── D2 Chỉ số Data ──
const D2_DATA = [
  {q:'Chi phí (Ad Spend) là gì?',opts:['Tổng doanh thu từ chiến dịch','Tổng tiền đã chi để chạy quảng cáo','Tiền thu về sau khi trừ chi phí','Ngân sách tối đa được phê duyệt'],ans:1,explain:'Ad Spend = tổng tiền thực tế chi để hiển thị quảng cáo.'},
  {q:'GMV (Gross Merchandise Value) là gì?',opts:['Doanh thu sau khi trừ hoa hồng','Tổng giá trị đơn hàng đặt thành công kể cả đơn hủy và hoàn','Doanh thu thuần','Số đơn × giá bán'],ans:1,explain:'GMV = tổng giá trị đơn hàng tạo ra, kể cả hủy và hoàn.'},
  {q:'ROAS được tính theo công thức nào?',opts:['ROAS = GMV × Chi phí','ROAS = Chi phí ÷ GMV','ROAS = GMV ÷ Chi phí','ROAS = (GMV - Chi phí) ÷ Chi phí'],ans:2,explain:'ROAS = GMV ÷ Chi phí. Benchmark Media Omni: TikTok ~6, Shopee ~9.'},
  {q:'ROAS = 5 có nghĩa là gì?',opts:['5đ chi phí tạo 1đ GMV','1đ chi phí tạo 5đ GMV','Tỷ lệ chuyển đổi 5%','Doanh thu tăng 5%'],ans:1,explain:'ROAS = 5 → mỗi 1đ bỏ ra thu 5đ GMV.'},
  {q:'Impression (Lượt hiển thị) là gì?',opts:['Số người thực sự nhìn thấy QC','Số lần QC hiển thị kể cả cùng 1 người thấy nhiều lần','Số lần click vào QC','Số lần phân phối không nhất thiết được xem'],ans:1,explain:'Impression = số lần xuất hiện. Một người có thể tạo nhiều impression.'},
  {q:'Điểm khác biệt giữa Reach và Impression?',opts:['Reach tính click, Impression tính view','Reach là số người unique thấy QC, Impression là tổng lần hiển thị','Reach đo mobile, Impression đo tất cả','Reach là paid, Impression là organic'],ans:1,explain:'Reach = người unique. Impression = tổng lần hiển thị. Impression ÷ Reach = Frequency.'},
  {q:'Frequency được tính bằng công thức nào?',opts:['Frequency = Reach ÷ Impression','Frequency = Impression ÷ Reach','Frequency = Click ÷ Impression','Frequency = Impression ÷ Click'],ans:1,explain:'Frequency = Impression ÷ Reach.'},
  {q:'Frequency cao ảnh hưởng đến quảng cáo như thế nào?',opts:['Luôn tốt vì tăng nhận diện','Gây ad fatigue — CTR giảm, CPC tăng','Không ảnh hưởng đáng kể','Chỉ ảnh hưởng remarketing'],ans:1,explain:'Frequency cao (>3-5 trên Meta) gây ad fatigue: CTR giảm, CPC tăng.'},
  {q:'CPC được tính theo công thức nào?',opts:['CPC = Click ÷ Chi phí','CPC = Chi phí ÷ Click','CPC = Impression ÷ Click','CPC = Chi phí × Click'],ans:1,explain:'CPC = Chi phí ÷ Số click.'},
  {q:'Yếu tố nào KHÔNG ảnh hưởng đến CPC?',opts:['Chất lượng creative','Mức cạnh tranh auction','CVR sau click','CTR quảng cáo'],ans:2,explain:'CVR xảy ra sau click nên không ảnh hưởng ngược lại CPC.'},
  {q:'CPM là chi phí cho bao nhiêu lượt hiển thị?',opts:['10 lượt','100 lượt','1.000 lượt','10.000 lượt'],ans:2,explain:'CPM = Cost Per Mille = chi phí 1.000 lần hiển thị.'},
  {q:'Yếu tố nào làm CPM tăng cao trên Meta Ads?',opts:['Audience rộng, ít cạnh tranh','Audience nhỏ, mùa cao điểm, creative score thấp','CTR quá cao','Budget quá nhỏ'],ans:1,explain:'CPM tăng: audience nhỏ, mùa cao điểm, relevance thấp.'},
  {q:'CTR được tính theo công thức nào?',opts:['CTR = Click ÷ Reach × 100%','CTR = Click ÷ Impression × 100%','CTR = Impression ÷ Click × 100%','CTR = Conversion ÷ Click × 100%'],ans:1,explain:'CTR = Click ÷ Impression × 100%.'},
  {q:'CTR All và CTR Link Click khác nhau thế nào trên Meta?',opts:['CTR All chỉ tính link click','CTR All tính mọi click, CTR Link Click chỉ tính click vào destination URL','Hai chỉ số giống nhau','CTR All cho video, Link Click cho static'],ans:1,explain:'CTR Link Click = click vào landing page. Dùng Link Click để đo intent thực.'},
  {q:'Add to Cart Rate được tính như thế nào?',opts:['Số thêm giỏ ÷ Đơn hàng × 100%','Số thêm giỏ ÷ Lượt xem trang SP × 100%','Số thêm giỏ ÷ Click × 100%','Số thêm giỏ ÷ Impression × 100%'],ans:1,explain:'Add to Cart Rate = Số thêm giỏ ÷ Product Page View × 100%.'},
  {q:'Add to Cart cao nhưng Checkout thấp thường do đâu?',opts:['Creative không hấp dẫn','Giá không cạnh tranh, phí ship cao, UX checkout phức tạp','Audience targeting sai','Budget không đủ'],ans:1,explain:'Bottleneck giỏ hàng→checkout: shipping fee cao, thiếu payment method, UX phức tạp.'},
  {q:'CIR được tính bằng công thức nào?',opts:['CIR = GMV ÷ Chi phí × 100%','CIR = Chi phí ÷ GMV × 100%','CIR = (CP + Giá vốn) ÷ GMV × 100%','CIR = CP ÷ Lợi nhuận × 100%'],ans:1,explain:'CIR = Chi phí ÷ GMV × 100%. Nghịch đảo ROAS: ROAS = 7 → CIR ≈ 14.3%.'},
  {q:'ROI khác ROAS ở điểm quan trọng nào?',opts:['Là hai tên của cùng chỉ số','ROI tính trên lợi nhuận thực sau trừ giá vốn, ROAS tính trên GMV','ROAS tính lợi nhuận, ROI tính doanh thu','ROI chỉ dùng cho ecommerce'],ans:1,explain:'ROAS = GMV/Chi phí. ROI = (Lợi nhuận - CP)/CP × 100%.'},
  {q:'AOV được tính như thế nào?',opts:['AOV = Đơn ÷ GMV','AOV = GMV ÷ Đơn','AOV = GMV ÷ Số SP','AOV = Chi phí ÷ Đơn'],ans:1,explain:'AOV = GMV ÷ Số đơn.'},
  {q:'Yếu tố giúp tăng AOV hiệu quả nhất?',opts:['Giảm giá SP','Bundle, upsell, cross-sell và ngưỡng freeship','Tăng tần suất QC','Mở rộng audience'],ans:1,explain:'AOV tăng bằng: Bundle, Upsell, Cross-sell, Minimum order freeship.'},
  {q:'CPA được tính như thế nào?',opts:['CPA = Click ÷ Conversion','CPA = Chi phí ÷ Conversion','CPA = Conversion ÷ Chi phí','CPA = Chi phí ÷ Impression × 1000'],ans:1,explain:'CPA = Chi phí ÷ Số conversion.'},
  {q:'Benchmark ROAS phù hợp cho Shopee Ads theo Media Omni?',opts:['3-4','5-6','8-10','12+'],ans:2,explain:'Benchmark Shopee Media Omni: ROAS ~9. Range 8-10 là tốt.'},
  {q:'Tại sao ROAS Shopee (~9) cao hơn TikTok (~6)?',opts:['Shopee nhiều user hơn','Shopee = marketplace với intent mua cao; TikTok = social cần tạo demand trước','TikTok ads đắt hơn','Shopee tính ROAS khác'],ans:1,explain:'TikTok = demand creation. Shopee = intent capture: user đã muốn mua → CR cao.'},
  {q:'Drop-off lớn nhất trong funnel TikTok Shop thường ở đâu?',opts:['Impression → Click','Product View → Add to Cart','Add to Cart → Checkout','Checkout → Purchase'],ans:1,explain:'Drop-off lớn nhất ở Product View → Add to Cart.'},
  {q:'CPM tăng 30%, CTR tăng 30%, CPC thay đổi thế nào?',opts:['CPC tăng 30%','CPC giảm 30%','CPC không thay đổi','CPC tăng 60%'],ans:2,explain:'CPC = CPM/(CTR×10). Tăng cùng tỷ lệ → CPC giữ nguyên.'},
  {q:'Shopee GMV trực tiếp và gián tiếp khác nhau thế nào?',opts:['Direct = click rồi mua ngay; Indirect = xem, rời, quay lại mua trong attribution window','Direct = desktop; Indirect = mobile','Direct = mua SP được QC; Indirect = mua SP khác','Direct = paid; Indirect = organic'],ans:0,explain:'Direct GMV = đơn trong session click ads. Indirect = click ads, không mua ngay, quay lại trong window.'},
  {q:'Repeat Purchase Rate (RPR) phản ánh điều gì?',opts:['Tỷ lệ click QC lần 2','Tỷ lệ khách đã mua quay lại mua thêm','Số lần xem QC trung bình','Tỷ lệ quay lại trang sau bounce'],ans:1,explain:'RPR = Khách mua lại ÷ Tổng khách đã mua × 100%.'},
  {q:'ROAS tốt nhưng CIR cũng cao là dấu hiệu gì?',opts:['Campaign over-spend','Biên lợi nhuận thấp, cần review pricing','Audience bão hòa','Creative hết hiệu quả'],ans:1,explain:'CIR cao = chi phí ads chiếm tỷ trọng lớn trong GMV.'},
  {q:'Purchase Rate trong TikTok Shop được tính thế nào?',opts:['Đơn ÷ Impression × 100%','Đơn ÷ Click × 100%','Đơn ÷ Lượt xem trang SP × 100%','Đơn ÷ Thêm giỏ × 100%'],ans:2,explain:'Purchase Rate = Đơn ÷ Product Page View × 100%.'},
  {q:'Yếu tố ảnh hưởng nhiều nhất đến RPR?',opts:['Tần suất retargeting','Chất lượng SP, trải nghiệm mua và CS sau bán','CTR QC brand','Ngân sách campaign'],ans:1,explain:'RPR phụ thuộc chủ yếu vào trải nghiệm sau mua: chất lượng SP, giao hàng nhanh, CS hậu mãi.'},
]

const shuf = <T,>(a: T[]): T[] => [...a].sort(() => Math.random() - 0.5)
const fmtVi = (m: string, v: number | null) => {
  if (v == null) return '—'
  if (m === 'CTR' || m === 'CR') return v + '%'
  return v.toLocaleString('vi-VN') + 'đ'
}

type Screen = 'hub' | 'd1-setup' | 'd1-quiz' | 'd1-result' | 'd2-quiz' | 'd2-result'

export default function QuizPage() {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [screen, setScreen] = useState<Screen>('hub')

  // D2 state
  const [d2Idx, setD2Idx] = useState(0)
  const [d2Ans, setD2Ans] = useState<number[]>(new Array(D2_DATA.length).fill(-1))
  const [d2Score, setD2Score] = useState(0)
  const [saved, setSaved] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    const u = getSession()
    if (u) setUser(u)
  }, [])

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  // D2 pick answer
  function d2Pick(optIdx: number) {
    if (d2Ans[d2Idx] !== -1) return
    const newAns = [...d2Ans]; newAns[d2Idx] = optIdx; setD2Ans(newAns)
  }

  function d2Next() {
    if (d2Idx < D2_DATA.length - 1) { setD2Idx(i => i + 1); return }
    // Calculate score
    const sc = d2Ans.reduce((acc, a, i) => acc + (a === D2_DATA[i].ans ? 1 : 0), 0)
    setD2Score(sc); setScreen('d2-result')
  }

  async function saveScore(quizType: string, score: number, total: number) {
    if (saved || !user) return
    setSaved(true)
    await fetch('/api/quiz', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: user.username, name: user.name, quiz_type: quizType, score, total }) })
    showToast('✅ Đã lưu điểm!')
  }

  if (!user) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--f-mono)', color: 'var(--faint)' }}>Đang tải...</div>

  return (
    <>
      {toast && <div className="toast show success" style={{ position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 9999 }}><div className="toast-dot" /><span>{toast}</span></div>}

      <div style={{ padding: '16px 0 40px', maxWidth: 760, margin: '0 auto' }}>

        {/* HUB */}
        {screen === 'hub' && (
          <>
            <h1 style={{ fontFamily: 'var(--f-display)', fontSize: '2rem', fontWeight: 800, marginBottom: 8 }}>Quiz Hub</h1>
            <p style={{ color: 'var(--muted)', marginBottom: 32 }}>Chọn dạng bài để bắt đầu kiểm tra kiến thức.</p>
            <div style={{ display: 'grid', gap: 16 }}>
              <div className="rc" style={{ cursor: 'pointer' }} onClick={() => setScreen('d1-setup')}>
                <div style={{ fontSize: '2rem', marginBottom: 12 }}>⚡</div>
                <div style={{ fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: '1.1rem', marginBottom: 6 }}>Dạng 1 — Benchmark Ads Thị trường</div>
                <div style={{ color: 'var(--muted)', fontSize: '.88rem', marginBottom: 14 }}>Kiểm tra benchmark thực chiến — CPA/CPC/CPM/CTR/CR theo từng platform. Câu sai lặp lại đến khi thuộc.</div>
                <span style={{ display: 'inline-block', padding: '.3rem .8rem', borderRadius: 20, background: 'rgba(16,185,129,.1)', color: '#059669', border: '1px solid rgba(16,185,129,.25)', fontSize: '.75rem', fontWeight: 700 }}>Sẵn sàng · ~{D1_DATA.length * 5} câu</span>
              </div>
              <div className="rc" style={{ cursor: 'pointer' }} onClick={() => { setD2Idx(0); setD2Ans(new Array(D2_DATA.length).fill(-1)); setSaved(false); setScreen('d2-quiz') }}>
                <div style={{ fontSize: '2rem', marginBottom: 12 }}>📊</div>
                <div style={{ fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: '1.1rem', marginBottom: 6 }}>Dạng 2 — Chỉ số Ads</div>
                <div style={{ color: 'var(--muted)', fontSize: '.88rem', marginBottom: 14 }}>18 chỉ số — định nghĩa, công thức, yếu tố tác động. {D2_DATA.length} câu trắc nghiệm 4 đáp án.</div>
                <span style={{ display: 'inline-block', padding: '.3rem .8rem', borderRadius: 20, background: 'var(--border2)', color: 'var(--muted)', border: '1px solid var(--border)', fontSize: '.75rem', fontWeight: 700 }}>Sẵn sàng · {D2_DATA.length} câu</span>
              </div>
            </div>
          </>
        )}

        {/* D1 SETUP */}
        {screen === 'd1-setup' && <D1Quiz user={user} onDone={(sc,tot) => { saveScore('Benchmark Ads (D1)', sc, tot) }} onBack={() => setScreen('hub')} />}

        {/* D2 QUIZ */}
        {screen === 'd2-quiz' && (() => {
          const q = D2_DATA[d2Idx]; const answered = d2Ans[d2Idx] !== -1
          return (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <button className="btn-s" onClick={() => setScreen('hub')}>← Quay lại</button>
                <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 4 }}>
                  <div style={{ height: '100%', width: `${(d2Idx / D2_DATA.length) * 100}%`, background: 'var(--blue)', borderRadius: 4, transition: 'width .3s' }} />
                </div>
                <span style={{ fontFamily: 'var(--f-mono)', fontSize: '.75rem', color: 'var(--faint)' }}>{d2Idx + 1}/{D2_DATA.length}</span>
              </div>
              <div className="rc">
                <div style={{ fontFamily: 'var(--f-mono)', fontSize: '.65rem', fontWeight: 700, color: 'var(--faint)', textTransform: 'uppercase', marginBottom: 10 }}>Câu hỏi {d2Idx + 1}</div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 20, lineHeight: 1.5 }}>{q.q}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {q.opts.map((opt, i) => {
                    const isAnswered = d2Ans[d2Idx] !== -1
                    let bg = 'var(--paper)'; let border = 'var(--border)'; let color = 'var(--ink)'
                    if (isAnswered) {
                      if (i === q.ans) { bg = 'rgba(5,150,105,.08)'; border = '#059669'; color = '#059669' }
                      else if (i === d2Ans[d2Idx] && i !== q.ans) { bg = 'rgba(239,68,68,.08)'; border = 'var(--error)'; color = 'var(--error)' }
                    }
                    return (
                      <div key={i} onClick={() => d2Pick(i)} style={{ display: 'flex', gap: 12, padding: '12px 16px', borderRadius: 10, border: `1.5px solid ${border}`, background: bg, color, cursor: isAnswered ? 'default' : 'pointer', transition: 'all .2s' }}>
                        <span style={{ fontFamily: 'var(--f-mono)', fontSize: '.7rem', fontWeight: 700, minWidth: 20, paddingTop: 2 }}>{['A','B','C','D'][i]}</span>
                        <span style={{ fontSize: '.9rem' }}>{opt}</span>
                      </div>
                    )
                  })}
                </div>
                {answered && q.explain && (
                  <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(37,99,235,.06)', borderRadius: 10, border: '1px solid rgba(37,99,235,.2)', fontSize: '.85rem', color: 'var(--muted)' }}>
                    💡 {q.explain}
                  </div>
                )}
                {answered && (
                  <button className="btn-p" style={{ marginTop: 20 }} onClick={d2Next}>
                    {d2Idx === D2_DATA.length - 1 ? 'Nộp bài →' : 'Câu tiếp →'}
                  </button>
                )}
              </div>
            </div>
          )
        })()}

        {/* D2 RESULT */}
        {screen === 'd2-result' && (
          <div className="rc" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>{d2Score >= D2_DATA.length * 0.8 ? '🏆' : d2Score >= D2_DATA.length * 0.5 ? '👍' : '📚'}</div>
            <h2 style={{ fontFamily: 'var(--f-display)', fontSize: '1.8rem', fontWeight: 800 }}>Kết quả</h2>
            <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--blue)', margin: '12px 0' }}>{d2Score}/{D2_DATA.length}</div>
            <div style={{ color: 'var(--muted)', marginBottom: 24 }}>{Math.round(d2Score / D2_DATA.length * 100)}% — {d2Score >= D2_DATA.length * 0.8 ? 'Xuất sắc!' : d2Score >= D2_DATA.length * 0.5 ? 'Khá tốt, tiếp tục ôn luyện!' : 'Cần ôn thêm nhé!'}</div>
            <div className="btn-row" style={{ justifyContent: 'center' }}>
              <button className="btn-s" onClick={() => setScreen('hub')}>← Quay lại Hub</button>
              <button className="btn-p" onClick={() => { if (!saved) saveScore('Chỉ số Ads (D2)', d2Score, D2_DATA.length); else showToast('Đã lưu rồi!') }}>
                {saved ? '✅ Đã lưu điểm' : '💾 Lưu điểm'}
              </button>
              <button className="btn-s" onClick={() => { setD2Idx(0); setD2Ans(new Array(D2_DATA.length).fill(-1)); setSaved(false); setScreen('d2-quiz') }}>🔄 Làm lại</button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ── D1 Component ──
type D1Entry = { row: typeof D1_DATA[number]; metric: string; rev: boolean; opts: unknown[]; ci: number; mastered: boolean; failCount: number }

function D1Quiz({ user, onDone, onBack }: { user: SessionUser; onDone: (sc: number, tot: number) => void; onBack: () => void }) {
  const METRICS = ['CPA','CPC','CPM','CTR','CR']
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
  const [saved, setSaved] = useState(false)
  const [toast, setToast] = useState('')

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  function buildAndStart() {
    const filtered = D1_DATA.filter(r => platFilter === 'ALL' || r.p === platFilter)
    const mets = metFilter === 'ALL' ? METRICS : [metFilter]
    const ent: Record<string, D1Entry> = {}
    filtered.forEach(row => {
      mets.forEach(m => {
        const v = row[m as keyof typeof row]
        if (v == null) return
        const id = `${row.p}_${row.o}_${row.c}_${row.a}_${m}`
        const pool = D1_DATA.filter(r => r !== row && r[m as keyof typeof r] != null && r[m as keyof typeof r] !== v).map(r => r[m as keyof typeof r] as number)
        const uniq = Array.from(new Set(pool))
        const wrong = shuf(uniq).slice(0, 3)
        while (wrong.length < 3) wrong.push(Math.round((v as number) * (0.5 + Math.random()) / 100) * 100 || 1)
        const opts = shuf([v as number, ...wrong])
        ent[id] = { row, metric: m, rev: false, opts, ci: opts.indexOf(v as number), mastered: false, failCount: 0 }
      })
    })
    const q = shuf(Object.keys(ent))
    setEntries(ent); setQueue(q); setQi(0); setRetries([]); setRoundN(1); setStreak(0); setFails(0); setPicked(null); setMastered(0); setStarted(true); setSaved(false)
  }

  function pick(i: number) {
    if (picked !== null) return
    setPicked(i)
    const id = queue[qi]; const e = entries[id]; const ok = i === e.ci
    const newEnt = { ...entries }
    newEnt[id] = { ...e, mastered: ok, failCount: ok ? e.failCount : e.failCount + 1 }
    setEntries(newEnt)
    if (ok) { setStreak(s => s + 1); setMastered(m => m + 1) }
    else { setStreak(0); setFails(f => f + 1); if (!retries.includes(id)) setRetries(r => [...r, id]) }
  }

  function next() {
    setPicked(null)
    const nextQi = qi + 1
    if (nextQi >= queue.length) {
      if (retries.length === 0) { setDone(true); onDone(mastered, Object.keys(entries).length); return }
      setRoundN(r => r + 1); setQueue(shuf([...retries])); setRetries([]); setQi(0)
    } else { setQi(nextQi) }
  }

  if (done) {
    const total = Object.keys(entries).length; const pct = Math.round(mastered / total * 100)
    return (
      <div className="rc" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>{pct >= 80 ? '🏆' : '👍'}</div>
        <h2 style={{ fontFamily: 'var(--f-display)', fontSize: '1.6rem', fontWeight: 800 }}>Hoàn thành!</h2>
        <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--blue)', margin: '12px 0' }}>{mastered}/{total}</div>
        <div style={{ color: 'var(--muted)', marginBottom: 24 }}>{pct}% — {fails} câu sai</div>
        <div className="btn-row" style={{ justifyContent: 'center' }}>
          <button className="btn-s" onClick={onBack}>← Quay lại Hub</button>
          <button className="btn-p" onClick={() => { if (!saved) { setSaved(true); showToast('✅ Đã lưu điểm!') } else showToast('Đã lưu rồi!') }}>
            {saved ? '✅ Đã lưu' : '💾 Lưu điểm'}
          </button>
        </div>
        {toast && <div style={{ marginTop: 12, color: 'var(--success)' }}>{toast}</div>}
      </div>
    )
  }

  if (!started) {
    return (
      <div>
        <button className="btn-s" onClick={onBack} style={{ marginBottom: 20 }}>← Quay lại Hub</button>
        <div className="rc">
          <h2 style={{ fontFamily: 'var(--f-display)', fontWeight: 800, marginBottom: 20 }}>⚡ Dạng 1 — Benchmark Ads</h2>
          <div style={{ marginBottom: 16 }}>
            <label className="rl">Platform</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              {['ALL','TikTok','Meta','Shopee','Google'].map(p => (
                <button key={p} className={platFilter === p ? 'btn-p' : 'btn-s'} style={{ padding: '8px 16px' }} onClick={() => setPlatFilter(p)}>{p}</button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 24 }}>
            <label className="rl">Metric</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              {['ALL','CPA','CPC','CPM','CTR','CR'].map(m => (
                <button key={m} className={metFilter === m ? 'btn-p' : 'btn-s'} style={{ padding: '8px 16px' }} onClick={() => setMetFilter(m)}>{m}</button>
              ))}
            </div>
          </div>
          <button className="btn-p" onClick={buildAndStart}>Bắt đầu →</button>
        </div>
      </div>
    )
  }

  const id = queue[qi]; const e = entries[id]; const tot = Object.keys(entries).length

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 4 }}>
          <div style={{ height: '100%', width: `${(mastered / tot) * 100}%`, background: 'var(--blue)', borderRadius: 4, transition: 'width .3s' }} />
        </div>
        <span style={{ fontFamily: 'var(--f-mono)', fontSize: '.72rem', color: 'var(--faint)' }}>{mastered}/{tot} thuộc</span>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, fontFamily: 'var(--f-mono)', fontSize: '.72rem' }}>
        <span style={{ color: 'var(--success)' }}>✅ {mastered}</span>
        <span style={{ color: 'var(--error)' }}>❌ {fails}</span>
        <span style={{ color: 'var(--blue)' }}>🔥 Streak {streak}</span>
        <span style={{ color: 'var(--faint)' }}>Vòng {roundN}</span>
      </div>

      <div className="rc">
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <span style={{ padding: '.2rem .6rem', borderRadius: 6, background: 'rgba(37,99,235,.1)', color: 'var(--blue)', fontSize: '.72rem', fontWeight: 700 }}>{e.row.p}</span>
          <span style={{ padding: '.2rem .6rem', borderRadius: 6, background: 'var(--border2)', color: 'var(--muted)', fontSize: '.72rem' }}>{e.row.o}</span>
          {e.failCount > 0 && <span style={{ padding: '.2rem .6rem', borderRadius: 6, background: 'rgba(239,68,68,.1)', color: 'var(--error)', fontSize: '.72rem', fontWeight: 700 }}>🔴 Câu khó</span>}
        </div>
        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 20, lineHeight: 1.5 }}>
          {e.metric} của <strong>{e.row.p} · {e.row.c} · {e.row.a}</strong> là bao nhiêu?
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(e.opts as number[]).map((v, i) => {
            const isAnswered = picked !== null
            let bg = 'var(--paper)'; let border = 'var(--border)'; let color = 'var(--ink)'
            if (isAnswered) {
              if (i === e.ci) { bg = 'rgba(5,150,105,.08)'; border = '#059669'; color = '#059669' }
              else if (i === picked && i !== e.ci) { bg = 'rgba(239,68,68,.08)'; border = 'var(--error)'; color = 'var(--error)' }
            }
            return (
              <div key={i} onClick={() => pick(i)} style={{ display: 'flex', gap: 12, padding: '12px 16px', borderRadius: 10, border: `1.5px solid ${border}`, background: bg, color, cursor: isAnswered ? 'default' : 'pointer', transition: 'all .2s' }}>
                <span style={{ fontFamily: 'var(--f-mono)', fontSize: '.7rem', fontWeight: 700, minWidth: 20 }}>{['A','B','C','D'][i]}</span>
                <span>{fmtVi(e.metric, v)}</span>
              </div>
            )
          })}
        </div>
        {picked !== null && (
          <div style={{ marginTop: 16, padding: '12px 16px', background: picked === e.ci ? 'rgba(5,150,105,.06)' : 'rgba(239,68,68,.06)', borderRadius: 10, border: `1px solid ${picked === e.ci ? 'rgba(5,150,105,.2)' : 'rgba(239,68,68,.2)'}`, fontSize: '.85rem', color: 'var(--muted)' }}>
            {picked === e.ci ? `✅ Đúng! ${e.metric} = ${fmtVi(e.metric, (e.opts as number[])[e.ci])}` : `❌ Sai. Đáp án đúng: ${fmtVi(e.metric, (e.opts as number[])[e.ci])}`}
          </div>
        )}
        {picked !== null && (
          <button className="btn-p" style={{ marginTop: 16 }} onClick={next}>
            {qi + 1 >= queue.length && retries.length === 0 ? 'Xem kết quả →' : qi + 1 >= queue.length ? 'Ôn câu sai →' : 'Câu tiếp →'}
          </button>
        )}
      </div>
    </div>
  )
}
