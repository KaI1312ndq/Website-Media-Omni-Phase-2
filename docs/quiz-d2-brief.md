# Brief — Test Chỉ số Ads (Dạng 2 / D2)

> Tài liệu này tổng hợp toàn bộ data + UX logic + design system + API contract của bài quiz **"Chỉ số Ads"** trên Media Omni Hub, dùng để port sang website khác.

---

## 1. Mục đích bài test

Quiz trắc nghiệm về **chỉ số quảng cáo digital** dùng để training nội bộ — giúp team Media Omni nắm vững khái niệm, công thức, ý nghĩa các metric trước khi vào việc thực chiến với khách hàng.

- **Số câu:** 30
- **Thời gian/câu:** 30 giây (đếm ngược)
- **Format:** Trắc nghiệm 4 đáp án (A/B/C/D)
- **Sau khi chọn:** hiện đáp án đúng + giải thích, auto chuyển câu tiếp
- **Đối tượng:** team marketing / planner / sales chạy Ads ecommerce VN

---

## 2. 30 câu hỏi (toàn bộ nội dung)

### Câu 1 — Chi phí (Ad Spend) là gì?

- A. Tổng doanh thu từ chiến dịch
- **B. ✅ Tổng tiền đã chi để chạy quảng cáo**
- C. Tiền thu về sau khi trừ chi phí
- D. Ngân sách tối đa được phê duyệt

> **Giải thích:** Ad Spend = tổng tiền thực tế chi để hiển thị quảng cáo.

---

### Câu 2 — GMV (Gross Merchandise Value) là gì?

- A. Doanh thu sau khi trừ hoa hồng
- **B. ✅ Tổng giá trị đơn hàng đặt thành công kể cả đơn hủy và hoàn**
- C. Doanh thu thuần
- D. Số đơn × giá bán

> **Giải thích:** GMV = tổng giá trị đơn hàng tạo ra, kể cả hủy và hoàn.

---

### Câu 3 — ROAS được tính theo công thức nào?

- A. ROAS = GMV × Chi phí
- B. ROAS = Chi phí ÷ GMV
- **C. ✅ ROAS = GMV ÷ Chi phí**
- D. ROAS = (GMV - Chi phí) ÷ Chi phí

> **Giải thích:** ROAS = GMV ÷ Chi phí. Benchmark Media Omni: TikTok ~6, Shopee ~9.

---

### Câu 4 — ROAS = 5 có nghĩa là gì?

- A. 5đ chi phí tạo 1đ GMV
- **B. ✅ 1đ chi phí tạo 5đ GMV**
- C. Tỷ lệ chuyển đổi 5%
- D. Doanh thu tăng 5%

> **Giải thích:** ROAS = 5 → mỗi 1đ bỏ ra thu 5đ GMV.

---

### Câu 5 — Impression (Lượt hiển thị) là gì?

- A. Số người thực sự nhìn thấy QC
- **B. ✅ Số lần QC hiển thị kể cả cùng 1 người thấy nhiều lần**
- C. Số lần click vào QC
- D. Số lần phân phối không nhất thiết được xem

> **Giải thích:** Impression = số lần xuất hiện. Một người có thể tạo nhiều impression.

---

### Câu 6 — Điểm khác biệt giữa Reach và Impression?

- A. Reach tính click, Impression tính view
- **B. ✅ Reach là số người unique thấy QC, Impression là tổng lần hiển thị**
- C. Reach đo mobile, Impression đo tất cả
- D. Reach là paid, Impression là organic

> **Giải thích:** Reach = người unique. Impression = tổng lần hiển thị. Impression ÷ Reach = Frequency.

---

### Câu 7 — Frequency được tính bằng công thức nào?

- A. Frequency = Reach ÷ Impression
- **B. ✅ Frequency = Impression ÷ Reach**
- C. Frequency = Click ÷ Impression
- D. Frequency = Impression ÷ Click

> **Giải thích:** Frequency = Impression ÷ Reach.

---

### Câu 8 — Frequency cao ảnh hưởng đến quảng cáo như thế nào?

- A. Luôn tốt vì tăng nhận diện
- **B. ✅ Gây ad fatigue — CTR giảm, CPC tăng**
- C. Không ảnh hưởng đáng kể
- D. Chỉ ảnh hưởng remarketing

> **Giải thích:** Frequency cao (>3-5 trên Meta) gây ad fatigue: CTR giảm, CPC tăng.

---

### Câu 9 — CPC được tính theo công thức nào?

- A. CPC = Click ÷ Chi phí
- **B. ✅ CPC = Chi phí ÷ Click**
- C. CPC = Impression ÷ Click
- D. CPC = Chi phí × Click

> **Giải thích:** CPC = Chi phí ÷ Số click.

---

### Câu 10 — Yếu tố nào KHÔNG ảnh hưởng đến CPC?

- A. Chất lượng creative
- B. Mức cạnh tranh auction
- **C. ✅ CVR sau click**
- D. CTR quảng cáo

> **Giải thích:** CVR xảy ra sau click nên không ảnh hưởng ngược lại CPC.

---

### Câu 11 — CPM là chi phí cho bao nhiêu lượt hiển thị?

- A. 10 lượt
- B. 100 lượt
- **C. ✅ 1.000 lượt**
- D. 10.000 lượt

> **Giải thích:** CPM = Cost Per Mille = chi phí 1.000 lần hiển thị.

---

### Câu 12 — Yếu tố nào làm CPM tăng cao trên Meta Ads?

- A. Audience rộng, ít cạnh tranh
- **B. ✅ Audience nhỏ, mùa cao điểm, creative score thấp**
- C. CTR quá cao
- D. Budget quá nhỏ

> **Giải thích:** CPM tăng: audience nhỏ, mùa cao điểm, relevance thấp.

---

### Câu 13 — CTR được tính theo công thức nào?

- A. CTR = Click ÷ Reach × 100%
- **B. ✅ CTR = Click ÷ Impression × 100%**
- C. CTR = Impression ÷ Click × 100%
- D. CTR = Conversion ÷ Click × 100%

> **Giải thích:** CTR = Click ÷ Impression × 100%.

---

### Câu 14 — CTR All và CTR Link Click khác nhau thế nào trên Meta?

- A. CTR All chỉ tính link click
- **B. ✅ CTR All tính mọi click, CTR Link Click chỉ tính click vào destination URL**
- C. Hai chỉ số giống nhau
- D. CTR All cho video, Link Click cho static

> **Giải thích:** CTR Link Click = click vào landing page. Dùng Link Click để đo intent thực.

---

### Câu 15 — Add to Cart Rate được tính như thế nào?

- A. Số thêm giỏ ÷ Đơn hàng × 100%
- **B. ✅ Số thêm giỏ ÷ Lượt xem trang SP × 100%**
- C. Số thêm giỏ ÷ Click × 100%
- D. Số thêm giỏ ÷ Impression × 100%

> **Giải thích:** Add to Cart Rate = Số thêm giỏ ÷ Product Page View × 100%.

---

### Câu 16 — Add to Cart cao nhưng Checkout thấp thường do đâu?

- A. Creative không hấp dẫn
- **B. ✅ Giá không cạnh tranh, phí ship cao, UX checkout phức tạp**
- C. Audience targeting sai
- D. Budget không đủ

> **Giải thích:** Bottleneck giỏ hàng→checkout: shipping fee cao, thiếu payment method, UX phức tạp.

---

### Câu 17 — CIR được tính bằng công thức nào?

- A. CIR = GMV ÷ Chi phí × 100%
- **B. ✅ CIR = Chi phí ÷ GMV × 100%**
- C. CIR = (CP + Giá vốn) ÷ GMV × 100%
- D. CIR = CP ÷ Lợi nhuận × 100%

> **Giải thích:** CIR = Chi phí ÷ GMV × 100%. Nghịch đảo ROAS: ROAS = 7 → CIR ≈ 14.3%.

---

### Câu 18 — ROI khác ROAS ở điểm quan trọng nào?

- A. Là hai tên của cùng chỉ số
- **B. ✅ ROI tính trên lợi nhuận thực sau trừ giá vốn, ROAS tính trên GMV**
- C. ROAS tính lợi nhuận, ROI tính doanh thu
- D. ROI chỉ dùng cho ecommerce

> **Giải thích:** ROAS = GMV/Chi phí. ROI = (Lợi nhuận - CP)/CP × 100%.

---

### Câu 19 — AOV được tính như thế nào?

- A. AOV = Đơn ÷ GMV
- **B. ✅ AOV = GMV ÷ Đơn**
- C. AOV = GMV ÷ Số SP
- D. AOV = Chi phí ÷ Đơn

> **Giải thích:** AOV = GMV ÷ Số đơn.

---

### Câu 20 — Yếu tố giúp tăng AOV hiệu quả nhất?

- A. Giảm giá SP
- **B. ✅ Bundle, upsell, cross-sell và ngưỡng freeship**
- C. Tăng tần suất QC
- D. Mở rộng audience

> **Giải thích:** AOV tăng bằng: Bundle, Upsell, Cross-sell, Minimum order freeship.

---

### Câu 21 — CPA được tính như thế nào?

- A. CPA = Click ÷ Conversion
- **B. ✅ CPA = Chi phí ÷ Conversion**
- C. CPA = Conversion ÷ Chi phí
- D. CPA = Chi phí ÷ Impression × 1000

> **Giải thích:** CPA = Chi phí ÷ Số conversion.

---

### Câu 22 — Benchmark ROAS phù hợp cho Shopee Ads theo Media Omni?

- A. 3-4
- B. 5-6
- **C. ✅ 8-10**
- D. 12+

> **Giải thích:** Benchmark Shopee Media Omni: ROAS ~9. Range 8-10 là tốt.

---

### Câu 23 — Tại sao ROAS Shopee (~9) cao hơn TikTok (~6)?

- A. Shopee nhiều user hơn
- **B. ✅ Shopee = marketplace với intent mua cao; TikTok = social cần tạo demand trước**
- C. TikTok ads đắt hơn
- D. Shopee tính ROAS khác

> **Giải thích:** TikTok = demand creation. Shopee = intent capture: user đã muốn mua → CR cao.

---

### Câu 24 — Drop-off lớn nhất trong funnel TikTok Shop thường ở đâu?

- A. Impression → Click
- **B. ✅ Product View → Add to Cart**
- C. Add to Cart → Checkout
- D. Checkout → Purchase

> **Giải thích:** Drop-off lớn nhất ở Product View → Add to Cart.

---

### Câu 25 — CPM tăng 30%, CTR tăng 30%, CPC thay đổi thế nào?

- A. CPC tăng 30%
- B. CPC giảm 30%
- **C. ✅ CPC không thay đổi**
- D. CPC tăng 60%

> **Giải thích:** CPC = CPM/(CTR×10). Tăng cùng tỷ lệ → CPC giữ nguyên.

---

### Câu 26 — Shopee GMV trực tiếp và gián tiếp khác nhau thế nào?

- **A. ✅ Direct = click rồi mua ngay; Indirect = xem, rời, quay lại mua trong attribution window**
- B. Direct = desktop; Indirect = mobile
- C. Direct = mua SP được QC; Indirect = mua SP khác
- D. Direct = paid; Indirect = organic

> **Giải thích:** Direct GMV = đơn trong session click ads. Indirect = click ads, không mua ngay, quay lại trong window.

---

### Câu 27 — Repeat Purchase Rate (RPR) phản ánh điều gì?

- A. Tỷ lệ click QC lần 2
- **B. ✅ Tỷ lệ khách đã mua quay lại mua thêm**
- C. Số lần xem QC trung bình
- D. Tỷ lệ quay lại trang sau bounce

> **Giải thích:** RPR = Khách mua lại ÷ Tổng khách đã mua × 100%.

---

### Câu 28 — ROAS tốt nhưng CIR cũng cao là dấu hiệu gì?

- A. Campaign over-spend
- **B. ✅ Biên lợi nhuận thấp, cần review pricing**
- C. Audience bão hòa
- D. Creative hết hiệu quả

> **Giải thích:** CIR cao = chi phí ads chiếm tỷ trọng lớn trong GMV.

---

### Câu 29 — Purchase Rate trong TikTok Shop được tính thế nào?

- A. Đơn ÷ Impression × 100%
- B. Đơn ÷ Click × 100%
- **C. ✅ Đơn ÷ Lượt xem trang SP × 100%**
- D. Đơn ÷ Thêm giỏ × 100%

> **Giải thích:** Purchase Rate = Đơn ÷ Product Page View × 100%.

---

### Câu 30 — Yếu tố ảnh hưởng nhiều nhất đến RPR?

- A. Tần suất retargeting
- **B. ✅ Chất lượng SP, trải nghiệm mua và CS sau bán**
- C. CTR QC brand
- D. Ngân sách campaign

> **Giải thích:** RPR phụ thuộc chủ yếu vào trải nghiệm sau mua: chất lượng SP, giao hàng nhanh, CS hậu mãi.

---

## 3. Data format (TypeScript / JSON)

```ts
type Question = {
  q: string // câu hỏi
  opts: string[] // 4 đáp án
  ans: number // index 0..3 — đáp án đúng
  explain: string // hiện sau khi user pick
}

const D2_DATA: Question[] = [
  /* 30 phần tử */
]
```

JSON tương đương — sẵn sàng paste vào CMS / database:

```json
[
  {
    "q": "Chi phí (Ad Spend) là gì?",
    "opts": [
      "Tổng doanh thu từ chiến dịch",
      "Tổng tiền đã chi để chạy quảng cáo",
      "Tiền thu về sau khi trừ chi phí",
      "Ngân sách tối đa được phê duyệt"
    ],
    "ans": 1,
    "explain": "Ad Spend = tổng tiền thực tế chi để hiển thị quảng cáo."
  }
  /* ... 29 câu còn lại theo cùng format */
]
```

---

## 4. UX Flow

```
HUB
 ├─ Card "Dạng 2 — Chỉ số Ads" → click
 │
 ▼
QUIZ (Câu 1/30)
 ├─ Top bar: progress bar + timer ring 30s + chuông "đang làm bài"
 ├─ Stat chips: số đúng / số sai / streak
 ├─ Câu hỏi + 4 options A/B/C/D
 │
 ├─ User click 1 option:
 │    ├─ Đúng → option scale-pop + viền xanh + check icon + streak +1
 │    ├─ Sai → option shake + viền đỏ + X icon, đáp án đúng cũng highlight
 │    ├─ Banner giải thích hiện
 │    └─ Auto-advance: 1.5s (đúng) / 3s (sai)  ← có nút "Bỏ qua chờ"
 │
 ├─ Hết 30s không chọn:
 │    ├─ Tự đánh sai (timeout)
 │    ├─ Hiện đáp án đúng + giải thích
 │    └─ Auto-advance 2.5s
 │
 └─ Nút "Câu trước" — có thể xem lại câu cũ (read-only, không sửa được)

(Lặp đến hết 30 câu)
 │
 ▼
RESULT
 ├─ Tier badge: 🏆 Gold (≥80%) / ✓ Silver (≥50%) / 📖 Bronze
 ├─ Score X/30 + phần trăm
 └─ Nút: Lưu điểm / Làm lại / Quay lại Hub
```

---

## 5. Anti-cheat / Anti-skip

| Rule                | Cài đặt                                   |
| ------------------- | ----------------------------------------- |
| Đóng tab giữa chừng | `beforeunload` listener — browser confirm |
| Nút Thoát bài       | Yêu cầu confirm trước khi rời             |
| Banner cảnh báo     | Hiện ở đầu khi quiz active                |
| Đếm ngược 30s = 0   | Auto đánh sai, không cho đoán muộn        |
| Đã chọn rồi         | Không sửa được — option bị disabled       |
| Câu trước           | Cho xem lại nhưng read-only               |

---

## 6. Design tokens

| Element             | Value                                                            |
| ------------------- | ---------------------------------------------------------------- |
| **Background card** | `linear-gradient(180deg, rgba(15,30,61,.6), rgba(10,22,40,.45))` |
| **Border**          | `1px solid rgba(96,165,250,.12)` border-radius `18px`            |
| **Correct color**   | `#10b981` (emerald)                                              |
| **Wrong color**     | `#ef4444` (red)                                                  |
| **Streak color**    | `#fb923c` (orange — glow khi ≥3)                                 |
| **Timer normal**    | `#22d3ee` (cyan)                                                 |
| **Timer warn**      | `#fbbf24` (amber, ≤10s)                                          |
| **Timer danger**    | `#ef4444` (red, ≤5s, pulse animation)                            |
| **Question font**   | 1.18rem · weight 800 · letter-spacing -.01em                     |
| **Option**          | 1.5px border · 12px radius · hover translateX(3px)               |
| **Auto-next bar**   | linear gradient `#3b82f6 → #06b6d4`, shrink linear               |

### Animations

- `qz-pop`: scale(.95→1.025→1) khi đúng (0.35s)
- `qz-shake`: translateX ±7px khi sai (0.4s)
- `qz-pulse`: scale(1→1.12) timer danger (0.6s alternate infinite)
- `qz-glow`: box-shadow streak (1.4s infinite)
- `qz-shrink`: scaleX(1→0) auto-next progress
- `qz-bounce-in`: result tier badge (scale 0→1.1→1)

---

## 7. API contract (lưu điểm)

`POST /api/quiz`

```json
{
  "username": "user_a",
  "name": "Nguyễn Văn A",
  "quiz_type": "Chỉ số Ads (D2)",
  "score": 23,
  "total": 30
}
```

Lưu vào table `quiz_scores` (Supabase) với schema:

```sql
quiz_scores (
  id uuid PRIMARY KEY,
  username text,
  name text,
  quiz_type text,
  score int,
  total int,
  created_at timestamptz DEFAULT now()
)
```

---

## 8. Tham số có thể tune

| Biến                   | Default | Vai trò                       |
| ---------------------- | ------- | ----------------------------- |
| `SECONDS_PER_QUESTION` | 30      | Thời gian/câu                 |
| Auto-advance đúng      | 1500ms  | Sau pick đúng                 |
| Auto-advance sai       | 3000ms  | Sau pick sai (đọc giải thích) |
| Auto-advance timeout   | 2500ms  | Sau hết giờ                   |
| Tier gold              | ≥80%    | Trophy icon                   |
| Tier silver            | ≥50%    | CheckCircle icon              |
| Tier bronze            | <50%    | BookOpen icon                 |
| Streak hot             | ≥3      | Glow animation                |

---

## 9. Files trong repo

| File                                                                | Vai trò                                                                                                                            |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| [`app/(internal)/quiz/page.tsx`](<../app/(internal)/quiz/page.tsx>) | Component React (cả D1 + D2). `D2_DATA` ~ dòng 50–90, component D2 ~ dòng 850–990                                                  |
| [`app/(internal)/quiz/quiz.css`](<../app/(internal)/quiz/quiz.css>) | Toàn bộ design system (`qz-*` classes)                                                                                             |
| [`lib/icons.tsx`](../lib/icons.tsx)                                 | SVG icons: `clock, checkCircle, xCircle, flame, trophy, bookOpen, arrowLeft, arrowRight, lock, refresh, save, alertTriangle, info` |
| [`app/api/quiz/route.ts`](../app/api/quiz/route.ts)                 | API endpoint lưu điểm                                                                                                              |

---

## 10. Checklist khi port sang website khác

- [ ] Copy `D2_DATA` (30 câu) vào CMS / DB / static JSON
- [ ] Copy CSS classes `.qz-*` (đổi tên prefix nếu conflict)
- [ ] Copy SVG icons cần dùng
- [ ] Implement React component với:
  - [ ] State: `idx`, `answers`, `time`, `streak`, `nextIn`
  - [ ] Timer countdown (decrement 1s, dừng khi đã pick)
  - [ ] Auto-advance setTimeout sau pick / timeout
  - [ ] Visual feedback (scale-pop / shake)
  - [ ] beforeunload guard
- [ ] Endpoint POST score (hoặc localStorage nếu không cần lưu)
- [ ] Result screen với 3 tier
- [ ] Test responsive mobile

---

**Ngày tạo:** 2026-05-11
**Maintainer:** [Nguyễn Đức Quảng](https://nguyenducquang.website)
