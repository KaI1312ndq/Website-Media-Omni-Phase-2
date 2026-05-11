# Brief — Weekly Report Tool (`/hub/report`)

> Tài liệu deep-dive về tool báo cáo tuần. Dùng để brainstorm Phase 2 cùng Claude chat (paste file này vào để Claude có full context, không cần explain lại).

---

## 1. Mục đích

Tool nội bộ cho team Media Omni làm **báo cáo performance tuần** cho từng brand đang quản lý. Workflow:

```
Chọn brand + tuần → Nhập số liệu actual + plan → AI phân tích → Preview email → Lưu DB → Copy gửi Lark
```

**Output cuối:** một email HTML có biểu đồ trend (PNG embedded) + bảng so sánh actual vs plan + 3 khối nhận xét AI (thực trạng / vấn đề / giải pháp) cho mỗi platform (Shopee + TikTok). User copy → paste vào Lark / Slack / email gửi client.

**Stats:** 100+ brands × ~52 tuần/năm = ~5,200 reports/năm. Đây là tool **chạy hàng ngày**, quan trọng nhất trong hub.

---

## 2. User journey (3 steps)

### Step 1 — Setup

**Mục tiêu:** xác định brand + tuần báo cáo + platform.

User chọn:

- **Brand** (dropdown search, auto-load từ Supabase `brands` table; có thể "Add brand" nếu thiếu)
- **Platform**: Shopee ✓ / TikTok ✓ (cả 2 mặc định bật, có thể tắt 1)
- **Tháng / Năm** (default = current)
- **Tuần** (1-5; theo lịch UpBase: tuần bắt đầu thứ 6, kết thúc thứ 5)

Khi click "Tiếp theo":

- Fetch plan từ `monthly_plans` cho (brand, month, year)
- Fetch lịch sử báo cáo tuần từ `weekly_reports` (cùng tháng + 10 tuần gần nhất cho chart)
- Compute `WeekInfo`: start/end date, số ngày trong tuần (có thể <7 nếu đầu/cuối tháng)
- Chuyển sang Step 2

URL deep-link: `?brand=X&month=11&year=2025&week=2` → auto-skip Step 1.

### Step 2 — Nhập số liệu + AI phân tích

**Mục tiêu:** nhập actual data + chỉnh plan nếu cần + run AI.

UI có 3 vùng:

**A. Bảng Plan vs Actual** (cho mỗi platform):

- **Shopee**: 12 metric (CPC 5, ND 4, Live 3) — Doanh số, Chi phí, Lượt xem, Lượt click, Đơn hàng
- **TikTok**: 12 metric (PGM 5, LGM 2, Consideration 2, Branding 3)
- Mỗi row hiển thị: tên metric · plan tuần · actual · % đạt (highlight xanh/vàng/đỏ) · các chỉ số derived (ROAS/CPC/CTR/CR/AOV/...)
- User gõ actual → format VN auto (100.000.000) · support biểu thức toán (`100+200`)
- Có nút "Paste từ Sheet" — paste cột số từ Google Sheet, auto fill đúng thứ tự `ACTUAL_KEYS_ORDER`

**B. Plan modal** (icon ✏️ trên đầu)

- Modal xổ ra để chỉnh plan cho cả tháng (6 cột: month + w1-w5)
- Có nút "Download plan template XLSX" + "Upload plan XLSX" để team plan offline
- Save → POST `/api/report?action=savePlan` → upsert `monthly_plans`

**C. AI block**

- Nút "AI Phân tích" → gửi snapshot data + plan + lịch sử tuần trước → OpenAI GPT-4.1
- Trả về JSON 8 trường: `highlight, lowlight, shopee_{thuc_trang/van_de/giai_phap}, tiktok_{...}`
- Có nút Prompt (✏️) để edit prompt — override theo thứ tự: localStorage `mo_ai_prompt` → Sanity `siteSettings.reportAIPrompt` → default `lib/report/ai-prompt.ts`
- Có nút API Key — user paste OpenAI key (lưu localStorage); nếu không có thì fallback gọi `/api/report?action=analyze` (dùng `OPENAI_API_KEY` env của site)

Click "Tiếp theo" → Step 3.

### Step 3 — Preview + Export

**Mục tiêu:** preview email HTML + save + copy.

UI hiển thị:

- **Email Subject** (auto-generated, editable): `[Brand] Báo cáo tuần W{n} T{m}/{y}`
- **Email HTML preview** với:
  - Header brand
  - Bảng tóm tắt actual vs plan
  - Chart trend 10 tuần gần nhất (Chart.js render → toDataURL → PNG embedded vào HTML)
  - 8 khối nhận xét AI
  - Footer signature
- 3 actions:
  - **Lưu DB** (`/api/report?action=saveWeekly` → upsert `weekly_reports`) + notify admin
  - **Copy → Lark** (clipboard write rich HTML)
  - **Export XLSX** (download file để archive)

---

## 3. Cấu trúc file (sau Phase 7 refactor)

```
app/(internal)/hub/report/
└── page.tsx                  # 4,124 dòng — UI orchestrator + 3 step JSX
                              # Components inline: ReportPage (Suspense wrap) → ReportPageInner

app/api/report/
├── route.ts                  # 285 dòng — GET/POST handlers
│   GET  ?action=plan         → fetch monthly_plans → flatToJsonb()
│   GET  ?action=history      → fetch weekly_reports (month-scoped OR last 10)
│   POST action=savePlan      → upsert monthly_plans (jsonbToFlat)
│   POST action=saveWeekly    → upsert weekly_reports + notifyAdmins
│   POST action=analyze       → call OpenAI (server-side fallback)
│   POST action=addBrand      → insert brands
└── prompt/route.ts           # GET → Sanity siteSettings.reportAIPrompt (cache 5min)

lib/report/
├── types.ts                  # Brand, PlanData, WeekInfo, ShopeeData, TiktokData, AIResult
├── utils.ts                  # 18 funcs: fmtDate, fmtVN, parseVN, evalExpr, pct, getWeekInfo, calc{CPC,ND,Live,PGM,LGM,Con,Brd}
├── constants.ts              # ACTUAL_KEYS_ORDER (24 keys), PLAN_PERIODS_ORDER, EMPTY_{SHOPEE,TIKTOK}
└── ai-prompt.ts              # DEFAULT_SYS_PROMPT (~30 lines, JSON-schema instruction)

sanity/schemas/siteSettings.ts
└── group "internal" → reportAIPrompt (text, 30 rows)
                              # Admin tunable không cần deploy

scripts/migrations/
├── 00-rebuild.sql            # CREATE TABLE weekly_reports, monthly_plans, brands
└── 01-add-plan-cols.sql      # 24 metrics × 6 periods = 144 plan columns on monthly_plans
```

---

## 4. Data model

### Table `brands`

```
id              uuid PK
brand_name      text unique
assigned_members text  (default 'all' hoặc 'user1,user2')
active          bool
```

Quyền truy cập brand được resolve qua [app/api/brands/route.ts](app/api/brands/route.ts) dựa vào `assigned_members`.

### Table `monthly_plans`

```
id              uuid PK
username        text          (người tạo plan)
brand_name      text
month, year     int
{metric}__plan_{period}  bigint × 144 columns
                              # 24 metrics × 6 periods (month, w1..w5)
                              # vd: s_cpc_doanh_so__plan_w1, t_pgm_chi_phi__plan_month
unique          (brand_name, month, year)
```

Lý do flat format thay vì JSONB: dễ query SQL trực tiếp (analytics, BI), index column được, Supabase studio UI dễ xem.

### Table `weekly_reports`

```
id              uuid PK
username        text
brand_name      text
month, year     int
week_num        int (1..5)
week_start, week_end  date

# 24 actual metric columns
s_cpc_doanh_so, s_cpc_chi_phi, s_cpc_luot_xem, s_cpc_luot_click, s_cpc_don_hang
s_nd_gmv, s_nd_chi_phi, s_nd_luot_xem, s_nd_luot_click
s_live_gmv, s_live_chi_phi, s_live_luot_xem
t_pgm_doanh_so, t_pgm_chi_phi, t_pgm_luot_xem, t_pgm_luot_click, t_pgm_don_hang
t_lgm_doanhthu, t_lgm_chi_phi
t_con_nguoi, t_con_chi_phi
t_brd_view, t_brd_follow, t_brd_chi_phi

# AI output
highlight, lowlight  text
nhan_xet_thuc_trang  text   # gộp shopee + tiktok thuc_trang
nhan_xet_van_de      text
nhan_xet_giai_phap   text

unique          (username, brand_name, year, month, week_num)
```

### Metric keys naming convention

- `s_` = Shopee, `t_` = TikTok
- `s_cpc_*` = Shopee Ads CPC (Search)
- `s_nd_*` = Shopee Ads Nhận Diện (Brand Display)
- `s_live_*` = Shopee Livestream Ads
- `t_pgm_*` = TikTok Ads_PGM (Performance GMV)
- `t_lgm_*` = TikTok Ads_LGM (Live GMV)
- `t_con_*` = TikTok Consideration_Ads
- `t_brd_*` = TikTok Branding_Ads

### Derived metrics (computed client-side trong `lib/report/utils.ts`)

- **ROAS** = doanh_so / chi_phi
- **CPC** = chi_phi / luot_click
- **CTR** = luot_click / luot_xem × 100
- **CR** = don_hang / luot_click × 100
- **AOV** = doanh_so / don_hang
- **CPM** = chi_phi / luot_xem × 1000 (chỉ TikTok PGM)
- **CPA** = chi_phi / {nguoi | follow} (Consideration + Branding)

---

## 5. API endpoints

| Endpoint                     | Method                   | Mục đích                                                             |
| ---------------------------- | ------------------------ | -------------------------------------------------------------------- |
| `/api/brands?...`            | GET                      | List brands user có quyền                                            |
| `/api/report?action=plan`    | GET                      | Fetch plan cho 1 (brand, month, year, platform) — trả JSONB filtered |
| `/api/report?action=history` | GET                      | Fetch weekly_reports (1 tháng) hoặc 10 tuần gần nhất                 |
| `/api/report`                | POST `action=savePlan`   | Upsert monthly plan (jsonbToFlat)                                    |
| `/api/report`                | POST `action=saveWeekly` | Upsert weekly report + notifyAdmins                                  |
| `/api/report`                | POST `action=analyze`    | Server-side OpenAI fallback (nếu user không có API key)              |
| `/api/report`                | POST `action=addBrand`   | Insert brand mới                                                     |
| `/api/report/prompt`         | GET                      | Fetch AI prompt từ Sanity (cache 5min)                               |

---

## 6. AI integration

### Prompt resolution (3 layers)

```
1. localStorage 'mo_ai_prompt'         (user override per browser)
   ↓ fallback
2. Sanity siteSettings.reportAIPrompt  (admin global, edit qua /studio)
   ↓ fallback
3. lib/report/ai-prompt.ts             (code default)
```

### Model

- **Client-side** (when user has API key): GPT-4.1 (full), `response_format: json_object`, max_tokens 4096
- **Server-side fallback** (no user key): GPT-4o-mini, max_tokens 1500 (cheaper, less quality)

### Input format (user message)

```
Brand: [brand_name]
Tuần: W[n] Tháng [m]/[y]
Số ngày: [days] (full week / partial)

SHOPEE (nếu enabled):
  Ads CPC: Doanh số [actual] / [plan] = [%] | Chi phí ... | ROAS ... | CTR ... | CR ...
  Ads ND:  GMV ... | Chi phí ... | CTR ...
  Ads Live: GMV ... | Chi phí ... | ROAS ...

TIKTOK (nếu enabled):
  PGM: Doanh số ... | Chi phí ... | ROAS ... | CTR ... | CR ... | CPM ...
  LGM: Doanh thu ... | Chi phí ... | ROI ...
  Consideration: Người ... | Chi phí ... | CPP ...
  Branding: View ... | Follow ... | Chi phí ... | CPA ...

WoW comparison (nếu có data tuần trước):
  Shopee GMV: [thisWeek] vs [lastWeek] → [±%] WoW
  TikTok GMV: [thisWeek] vs [lastWeek] → [±%] WoW
```

### Output format (JSON strict)

```json
{
  "highlight": "• ... • ...",
  "lowlight": "• ... • ...",
  "shopee_thuc_trang": "...",
  "shopee_van_de": "• ... • ...",
  "shopee_giai_phap": "• ... • ...",
  "tiktok_thuc_trang": "...",
  "tiktok_van_de": "• ... • ...",
  "tiktok_giai_phap": "• ... • ..."
}
```

### Default prompt (rút gọn)

**Persona:** Senior Performance Marketing Manager 7 năm, chuyên Shopee + TikTok Shop VN.
**Scope:** chỉ technical ads — bid, budget, targeting, thuật toán. Không đề cập creative/content/KOC.
**Rules:**

- Phân tích Shopee theo cơ chế từng loại Ads (CPC/ND/Live), không áp logic TikTok vào.
- Phân tích TikTok theo cơ chế thuật toán (learning phase, ROI target, audience overlap, GMV Boost...).
- Số format VN (100,000 không có ₫).
- Bullets `•` mỗi dòng riêng (`\n`).
- TUYỆT ĐỐI không trộn logic giữa 2 platform.

Full prompt: [lib/report/ai-prompt.ts](lib/report/ai-prompt.ts)

---

## 7. State management (page.tsx, ReportPageInner)

### Step 1

```
user, step, toast
brands, brandSearch, showBrandDrop, selectedBrand
shopeeChecked, tiktokChecked
selMonth, selYear, selWeek, weekInfo
```

### Step 2

```
shopeePlan: PlanData | null       # JSONB { metric: { w1..w5, month } }
tiktokPlan: PlanData | null
hasPlan: boolean                  # đã có plan chưa? nếu chưa → warn + mở plan modal
shopeeData: ShopeeData            # 12 actual fields, default 0
tiktokData: TiktokData            # 12 actual fields, default 0
rawInputs: Record<key, string>    # display string "100.000.000" cho mỗi input
planRawInputs                     # tương tự cho plan modal
aiResult: AIResult                # 8 fields output
aiLoading
sanityPrompt                      # cached từ /api/report/prompt
effectivePrompt                   # resolved 3-layer
weekHistory                       # full month rows
chartHistory                      # last 10 weeks for chart
```

### Step 3

```
mailSubject, mailHTML, copied, saving, chartDataUrl
```

### Modals

```
planModal, planInputs
keyModal, promptModal, keyInput, promptInput
addBrandInput
```

---

## 8. XLSX integration

Dùng `xlsx` (SheetJS) — code-split dynamic import (~600KB).

**Download Plan Template** (Step 2):

- Generate sheet 24 rows (metric) × 6 cols (month + w1..w5)
- Empty values cho user fill
- Filename: `Plan_{brand}_T{m}_{y}.xlsx`

**Upload Plan**:

- Parse sheet → match metric key bằng row label
- Update planInputs → preview trong modal → user click Save

**Export Actual XLSX** (Step 3):

- Generate sheet snapshot: plan vs actual vs % cho cả tuần
- Filename: `Report_{brand}_W{n}_T{m}_{y}.xlsx`

---

## 9. Chart (Chart.js)

Render trên canvas ẩn (Step 3) → 10 tuần gần nhất qua các tháng:

- Line chart 2 datasets: Shopee GMV total + TikTok GMV total
- X axis: `W{n} T{m}`
- Y axis: VND
- Sau khi render → `canvas.toDataURL('image/png')` → embed vào email HTML

---

## 10. Email HTML structure (Step 3 output)

```html
<div style="font-family: Arial; max-width: 760px;">
  <header>
    <h1>[Brand]</h1>
    <p>Báo cáo tuần W{n} T{m}/{y} · {start} → {end} · {days} ngày</p>
  </header>

  <section>
    <!-- Summary table -->
    <table>
      <thead>
        <tr>
          <th>Metric</th>
          <th>Plan</th>
          <th>Actual</th>
          <th>% đạt</th>
        </tr>
      </thead>
      <tbody>
        ...
      </tbody>
    </table>
  </section>

  <section>
    <!-- Chart -->
    <img src="data:image/png;base64,..." alt="Trend chart" />
  </section>

  <section>
    <!-- AI insights -->
    <h2>Highlight</h2>
    <p>{aiResult.highlight}</p>
    <h2>Lowlight</h2>
    <p>{aiResult.lowlight}</p>
    <h2>Shopee — Thực trạng / Vấn đề / Giải pháp</h2>
    <h2>TikTok — Thực trạng / Vấn đề / Giải pháp</h2>
  </section>

  <footer>Made by Media Omni — UpBase Vietnam</footer>
</div>
```

Copy to clipboard: dùng `ClipboardItem` rich HTML để paste vào Lark giữ format.

---

## 11. Pain points & tech debt hiện tại

| #   | Vấn đề                                                           | Mức độ   | Ghi chú                                                                   |
| --- | ---------------------------------------------------------------- | -------- | ------------------------------------------------------------------------- |
| 1   | `page.tsx` 4,124 dòng monolithic                                 | 🔴 cao   | UI + 3 step + 5 modals + chart + xlsx + email render đều inline           |
| 2   | Không có e2e test cho flow                                       | 🔴 cao   | Refactor nguy hiểm, sửa 1 chỗ break chỗ khác mà không biết                |
| 3   | 24 actual columns + 144 plan columns flat SQL                    | 🟡 trung | Schema cứng — thêm metric mới phải migration. Không support tuần >5       |
| 4   | Server-side analyze dùng `gpt-4o-mini` + prompt ngắn khác client | 🟡 trung | Chất lượng phân tích kém hơn nhiều. Có 2 nguồn prompt cùng tồn tại        |
| 5   | OpenAI API key lưu localStorage client                           | 🟡 trung | Mỗi user phải tự nhập, dễ leak khi share device. Nên dùng env server thôi |
| 6   | Plan modal có 6 cột × 24 row = 144 inputs                        | 🟡 trung | UX nhập tay khó chịu — dùng XLSX upload tốt hơn nhưng dễ sai format       |
| 7   | Email HTML cứng trong code                                       | 🟡 trung | Template không thể customize per-brand hoặc theme                         |
| 8   | Chart chỉ có GMV tổng                                            | 🟢 thấp  | Không hiển thị từng kênh con (CPC vs ND vs Live)                          |
| 9   | Không có "save draft" — user mất data nếu reload giữa chừng      | 🟡 trung | Auto-save localStorage có sẵn? Chưa rõ                                    |
| 10  | Không có version history weekly report                           | 🟢 thấp  | Upsert ghi đè, không log lại lần edit trước                               |
| 11  | Không có comparison view tuần trước rõ ràng trên UI              | 🟡 trung | Chỉ WoW trong AI message, UI không show side-by-side                      |
| 12  | AI gọi không streaming — user chờ 15-30s không feedback          | 🟡 trung | Stream sẽ feel snappy hơn nhiều                                           |
| 13  | Brand assignment dùng `assigned_members` string CSV              | 🟢 thấp  | Khó query — nên normalize qua bảng join                                   |
| 14  | Không track ai sửa report khi nào                                | 🟡 trung | Audit log thiếu — đặc biệt khi nhiều người chung 1 brand                  |
| 15  | Không có notification "deadline submit" cho user                 | 🟡 trung | Hiện chỉ notif khi đã submit, không nhắc trước                            |

---

## 12. Ý tưởng Phase 2 — brainstorm prompts

Khi brainstorm với Claude chat, đây là các hướng có thể đào sâu:

### A. UX / Productivity

- [ ] Auto-save draft mỗi 10s vào localStorage / Supabase
- [ ] Streaming AI response (Server-Sent Events) — user thấy text generate dần
- [ ] Side-by-side WoW comparison trên UI (không chỉ trong AI prompt)
- [ ] Inline edit AI result trước khi save (đôi khi AI viết sai term)
- [ ] Keyboard shortcut: Tab navigate giữa inputs, Cmd+S save
- [ ] Bulk paste từ Sheet thông minh hơn — detect platform tự động
- [ ] Quick-fill: "Lấy plan tháng trước" / "Copy actual tuần trước"

### B. AI & Insights

- [ ] Prompt template per brand category (Skincare khác Fashion khác FMCG)
- [ ] Few-shot examples trong prompt từ các tuần đã được rating cao
- [ ] AI suggest plan cho tuần tới dựa trên trend 4 tuần
- [ ] Anomaly detection: tự flag metric lệch >30% so prevailing pattern
- [ ] AI generate XLSX template với plan đề xuất, user chỉ confirm
- [ ] So sánh với industry benchmark (Media Omni knowledge base)
- [ ] Voice input cho ghi chú thêm trước khi AI phân tích

### C. Data model & Architecture

- [ ] Migrate plan storage flat columns → JSONB column duy nhất `plan_data: jsonb`
  - Pros: thêm metric không cần migration; tuần 6 vẫn lưu được
  - Cons: mất khả năng SQL query trực tiếp, BI tool khó dùng
- [ ] Tách `weekly_reports` thành 2 bảng: `weekly_metrics` (numbers) + `weekly_notes` (AI text) — separate concerns
- [ ] Audit log table — log mỗi lần edit (who, when, diff)
- [ ] Version history — soft delete + revision khi upsert
- [ ] Brand-user relationship → bảng join chuẩn `brand_assignments(brand_id, user_id)`

### D. Collaboration

- [ ] Multi-user trên cùng 1 report tuần (Account Manager + Planner cùng làm)
- [ ] Comments trên từng metric (như Google Sheets)
- [ ] Approval flow: Planner submit → Team Lead review → publish
- [ ] Slack/Telegram bot: nhắc deadline + summary auto
- [ ] Real-time co-editing (CRDT? Y-Doc + Liveblocks?)

### E. Output / Distribution

- [ ] Template email theo brand (logo, brand color, signature riêng)
- [ ] Export PDF (như analytics) — print CSS hoặc react-pdf
- [ ] Auto-send email tới client qua Resend/SendGrid (skip copy-paste Lark)
- [ ] Public share link read-only (cho client xem trực tiếp)
- [ ] PowerPoint export cho client review slide-form
- [ ] Embed report vào client portal (multi-tenant SaaS direction)

### F. Analytics over time

- [ ] Cross-brand dashboard: trend toàn portfolio (cái này hub/analytics có nhưng còn cơ bản)
- [ ] Forecast: ML model dự đoán performance tuần tới dựa lịch sử
- [ ] "What-if" scenario: thay đổi 1 plan number, AI dự đoán impact
- [ ] Cohort: nhóm brand cùng industry → benchmark nội bộ

### G. Free Audit Tool (lead magnet, đã đề xuất Phase 7)

Liên quan vì reuse được nhiều logic:

- User public nhập URL TikTok Shop / Shopee → crawl basic data → run same AI prompt → output mini-report → CTA "Để Media Omni làm cho bạn → submit lead"
- Có thể tách metric calc + AI logic ra `lib/report/` để cả 2 (internal + public) cùng dùng

---

## 13. Câu hỏi để brainstorm

Khi paste file này vào Claude chat, bắt đầu bằng:

> "Đây là context tool Weekly Report của agency Media Omni. Tôi muốn brainstorm Phase 2 — đặc biệt là: [chọn 1-2 hướng từ section 12]. Hãy đặt câu hỏi để hiểu thêm về tình hình hiện tại + đề xuất 3-5 ý tưởng cụ thể với tradeoff."

Các câu hỏi nên hỏi Claude:

- "AI hiện viết output bị sai chỗ X — sửa prompt thế nào?"
- "Migrate flat columns → JSONB có nên không? Cost migration là gì?"
- "Free Audit Tool: scope MVP, tech stack đề xuất?"
- "Streaming AI: implement SSE trên Next.js App Router thế nào?"
- "Approval flow: state machine 3 status (draft/review/published)?"
- "Auto-save: debounce localStorage vs server-side draft?"

---

## 14. Links

- Code chính: [app/(internal)/hub/report/page.tsx](<../app/(internal)/hub/report/page.tsx>)
- API: [app/api/report/route.ts](../app/api/report/route.ts) + [prompt/route.ts](../app/api/report/prompt/route.ts)
- Utils: [lib/report/](../lib/report/)
- Sanity prompt field: Studio → Site Settings → Internal — AI Prompt
- Migrations: [scripts/migrations/00-rebuild.sql](../scripts/migrations/00-rebuild.sql), [01-add-plan-cols.sql](../scripts/migrations/01-add-plan-cols.sql)

---

**Ngày tạo:** 2026-05-11
**Maintainer:** [Nguyễn Đức Quảng](https://nguyenducquang.website)
