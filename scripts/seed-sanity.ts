/**
 * Seed Sanity with siteSettings + brand portfolio.
 *
 *   npm run seed:sanity
 *
 * Required env vars (.env.local):
 *   NEXT_PUBLIC_SANITY_PROJECT_ID
 *   NEXT_PUBLIC_SANITY_DATASET
 *   SANITY_API_TOKEN          (must have read+write permission)
 */
import { config } from 'dotenv'
config({ path: '.env.local' })
config()
import { createClient } from '@sanity/client'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
const token = process.env.SANITY_API_TOKEN

if (!projectId || projectId === 'placeholder' || !dataset || !token) {
  console.error('\n[seed-sanity] Missing required env vars.')
  console.error('  NEXT_PUBLIC_SANITY_PROJECT_ID =', projectId || '(unset)')
  console.error('  NEXT_PUBLIC_SANITY_DATASET    =', dataset || '(unset)')
  console.error('  SANITY_API_TOKEN              =', token ? '(set)' : '(unset)')
  console.error('\nFix: copy .env.local.example -> .env.local and fill in values.\n')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  token,
  useCdn: false,
})

/* ── siteSettings document (singleton, _id = "siteSettings") ── */
const siteSettingsDoc = {
  _id: 'siteSettings',
  _type: 'siteSettings',
  heroBadge: 'Performance Marketing · UpBase Vietnam',
  heroTitle: 'Vận hành performance marketing đa kênh.',
  heroSub: '12 Growth Operators. 100+ Brands. 356B NMV. Vận hành performance marketing đa kênh — TikTok Shop, Shopee, Meta, Google — với kết quả đo lường bằng số thật.',
  operatorCount: 12,
  growthOpsCount: '12',
  brandCount: '100+',
  nmv: '356B',
  ticker: [
    { _key: 't1', val: '356B', lbl: 'NMV', sub: 'Net Merchandise Value' },
    { _key: 't2', val: '7x+', lbl: 'ROAS', sub: 'Return on Ad Spend' },
    { _key: 't3', val: '100+', lbl: 'Brands', sub: 'Đang vận hành' },
    { _key: 't4', val: '12', lbl: 'Operators', sub: 'Growth marketers' },
  ],
  servicesIntro: 'Media Omni không chỉ chạy ads — chúng tôi vận hành toàn bộ hệ thống performance marketing từ strategy đến execution.',
  services: [
    { _key: 's1', name: 'Video Ads', desc: 'In-Feed, TopView, Brand Takeover. A/B test creative, optimize ROAS realtime.', icon: '🎬' },
    { _key: 's2', name: 'Search & Discovery Ads', desc: 'Keyword research, bidding strategy, intent capture trên Shopee và Google.', icon: '🔍' },
    { _key: 's3', name: 'Lead Generation', desc: 'Instant Form, Messenger, Website Lead. CRM sync và nurturing flow.', icon: '🎯' },
    { _key: 's4', name: 'YouTube Ads', desc: 'Skippable, Non-skip, Bumper 6s. Brand awareness và video remarketing.', icon: '📺' },
  ],
  faqIntro: 'Mọi điều bạn muốn biết về cách Media Omni vận hành performance marketing.',
  faq: [
    { _key: 'f1', q: 'Media Omni khác gì agency truyền thống?', a: 'Chúng tôi vận hành full-funnel performance marketing đa nền tảng (TikTok Shop, Shopee, Meta, Google) với in-house team 12 Growth Operators chuyên sâu từng platform — không outsource.' },
    { _key: 'f2', q: 'ROAS trung bình là bao nhiêu?', a: '>7x ROAS trên portfolio 100+ brands. Mỗi brand đều có target riêng theo category và budget tier.' },
    { _key: 'f3', q: 'Quy trình lên campaign mất bao lâu?', a: 'Setup ban đầu 3–5 ngày làm việc: audit account hiện tại → đề xuất chiến lược → setup tracking + creative brief → launch.' },
    { _key: 'f4', q: 'Brand mới chưa có data lịch sử có chạy được không?', a: 'Có. Bắt đầu với learning phase ngân sách thấp, A/B test creative + audience, scale dần khi tìm winning combo. Thường 2–4 tuần đầu để stabilize.' },
    { _key: 'f5', q: 'Báo cáo tần suất thế nào?', a: 'Daily monitoring + weekly report (DARA framework: Data → Analysis → Root cause → Action) + monthly business review.' },
  ],
  cta: {
    title: 'Sẵn sàng scale brand của bạn?',
    body: 'Liên hệ team Media Omni để audit miễn phí performance marketing hiện tại.',
    buttonText: 'Liên hệ ngay',
    buttonUrl: 'mailto:contact@upbase.asia',
  },
  footerText: '© 2025 Media Omni × UpBase Vietnam. Performance marketing in-house cho ecommerce brands.',
  socialLinks: [
    { _key: 'sl1', platform: 'facebook', url: 'https://facebook.com/upbase.asia' },
    { _key: 'sl2', platform: 'linkedin', url: 'https://linkedin.com/company/upbase-asia' },
    { _key: 'sl3', platform: 'youtube', url: 'https://youtube.com/@upbase' },
  ],
}

/* ── Brand portfolio (43 brands from Supabase BrandList) ── */
type Cat = 'skincare' | 'fashion' | 'baby' | 'fmcg' | 'electronics'

const BRAND_LIST: { name: string; category: Cat }[] = [
  { name: '82X_HN', category: 'skincare' },
  { name: 'Babe', category: 'skincare' },
  { name: 'Baniphar', category: 'skincare' },
  { name: 'Ekseption', category: 'skincare' },
  { name: 'Eubos', category: 'skincare' },
  { name: 'Lipit', category: 'skincare' },
  { name: 'Meracine', category: 'skincare' },
  { name: 'Nabizam', category: 'skincare' },
  { name: "Nature's Way", category: 'fmcg' },
  { name: 'Nucos', category: 'skincare' },
  { name: 'Vitabiotics', category: 'fmcg' },
  { name: 'Hitachi', category: 'electronics' },
  { name: 'Keyshu', category: 'skincare' },
  { name: "L'Occitane Việt Nam", category: 'skincare' },
  { name: 'SCC Saigon Cosmetics', category: 'skincare' },
  { name: 'Hoarient', category: 'skincare' },
  { name: 'Bye Bye Blemish', category: 'skincare' },
  { name: '4PM', category: 'fashion' },
  { name: 'Fresh', category: 'skincare' },
  { name: 'Mine', category: 'fashion' },
  { name: 'HLA Garment Vietnam', category: 'fashion' },
  { name: 'Baegayul', category: 'skincare' },
  { name: 'Docilee', category: 'baby' },
  { name: 'Cathy Doll', category: 'skincare' },
  { name: 'Revision', category: 'skincare' },
  { name: 'CM24', category: 'skincare' },
  { name: 'Venus', category: 'fashion' },
  { name: 'UpBeauty', category: 'skincare' },
  { name: 'Blissberry', category: 'skincare' },
  { name: 'Natural Care', category: 'skincare' },
  { name: 'Face republic', category: 'skincare' },
  { name: 'Lasy VN', category: 'skincare' },
  { name: 'Rejuran', category: 'skincare' },
  { name: 'pHCare', category: 'skincare' },
  { name: 'GREE', category: 'electronics' },
  { name: 'Ladofoods', category: 'fmcg' },
  { name: 'The Vigo', category: 'fmcg' },
  { name: 'DOJI VIETNAM', category: 'fashion' },
  { name: 'Nativis', category: 'skincare' },
  { name: 'TM Clean', category: 'fmcg' },
  { name: 'HDT', category: 'skincare' },
  { name: 'ORGALIFE', category: 'fmcg' },
]

/* ── Case Studies (sample marketing assets) ── */
type CSResult = { metric: string; before: string; after: string; change: string }
type CSTestimonial = { quote: string; authorName: string; authorRole: string }
type CSItem = {
  title: string
  slug: string
  brandName: string
  industry: 'skincare' | 'fashion' | 'baby' | 'fmcg' | 'electronics' | 'pharma'
  platforms: string[]
  excerpt: string
  featured: boolean
  order: number
  results: CSResult[]
  testimonial?: CSTestimonial
}

const SAMPLE_CASE_STUDIES: CSItem[] = [
  {
    title: 'Meracine: 8.5x ROAS qua 6 tháng — TikTok Shop scale từ 0 → 1.2B GMV',
    slug: 'meracine-tiktok-shop-scale',
    brandName: 'Meracine',
    industry: 'skincare',
    platforms: ['tiktok', 'shopee'],
    excerpt: 'Brand mỹ phẩm khoa học scale từ 0 GMV trên TikTok Shop lên 1.2B GMV/tháng trong 6 tháng nhờ chiến lược PGM + LGM kết hợp.',
    featured: true,
    order: 1,
    results: [
      { metric: 'ROAS', before: '3.2x', after: '8.5x', change: '+165%' },
      { metric: 'GMV/tháng', before: '0', after: '1.2B', change: '+∞' },
      { metric: 'Chi phí/đơn', before: '180k', after: '95k', change: '-47%' },
    ],
    testimonial: {
      quote: 'Media Omni đã scale TikTok Shop của Meracine từ 0 lên top 3 ngành skincare trong 6 tháng. Chỉ số đo lường được, optimize realtime.',
      authorName: 'Brand Manager',
      authorRole: 'Meracine Vietnam',
    },
  },
  {
    title: 'Bye Bye Blemish: Top 1 Shopee Skincare nhập khẩu sau 4 tháng',
    slug: 'byebyeblemish-shopee-top1',
    brandName: 'Bye Bye Blemish',
    industry: 'skincare',
    platforms: ['shopee'],
    excerpt: 'Triple GMV qua 4 tháng nhờ tối ưu Shopee CPC + ND + Live ads parallel. ROAS Shopee đạt 9.2x — cao hơn industry benchmark 35%.',
    featured: true,
    order: 2,
    results: [
      { metric: 'GMV', before: '450M', after: '1.4B', change: '+211%' },
      { metric: 'ROAS', before: '5.8x', after: '9.2x', change: '+58%' },
      { metric: 'Rank Shopee', before: 'Top 18', after: 'Top 1', change: '↑17 ranks' },
    ],
  },
  {
    title: 'Cathy Doll: Scale 4 platforms đồng thời — 320M ngân sách/tháng',
    slug: 'cathydoll-multichannel-scale',
    brandName: 'Cathy Doll',
    industry: 'skincare',
    platforms: ['shopee', 'tiktok', 'meta', 'google'],
    excerpt: 'Vận hành đa kênh full-funnel 4 platforms với budget 320M/tháng. Audit + reallocation budget hàng tuần dựa trên ROAS thực tế từng channel.',
    featured: true,
    order: 3,
    results: [
      { metric: 'Total GMV', before: '780M', after: '2.4B', change: '+208%' },
      { metric: 'Blended ROAS', before: '4.5x', after: '7.5x', change: '+67%' },
      { metric: 'Channels', before: '1 (Shopee only)', after: '4', change: '+3 channels' },
    ],
  },
]

/* ── Team Members (13 users from Supabase users) ── */
const TEAM_LIST: { name: string; role: string; isLead?: boolean; order: number }[] = [
  { name: 'Nguyễn Đức Quảng',       role: 'Team Lead — Performance Marketing', isLead: true, order: 1 },
  { name: 'Nguyễn Trần Khánh Linh', role: 'Performance Marketing Manager',     order: 2 },
  { name: 'Chu Khánh Duy',           role: 'Performance Marketing Manager',     order: 3 },
  { name: 'Thiều Anh Đức',           role: 'Performance Marketing Manager',     order: 4 },
  { name: 'Đoàn Khánh Linh',         role: 'Performance Marketing Specialist',  order: 5 },
  { name: 'Đỗ Phương Thảo',          role: 'Performance Marketing Specialist',  order: 6 },
  { name: 'Đỗ Thị Hằng',             role: 'Performance Marketing Specialist',  order: 7 },
  { name: 'Đặng Hữu Trung',          role: 'Performance Marketing Specialist',  order: 8 },
  { name: 'Phạm Quyền Anh',          role: 'Performance Marketing Specialist',  order: 9 },
  { name: 'Nguyễn Minh Khánh',       role: 'Performance Marketing Specialist',  order: 10 },
  { name: 'Hoàng Bảo Ngọc',          role: 'Performance Marketing Specialist',  order: 11 },
  { name: 'Nguyễn Mai Phương',       role: 'Performance Marketing Specialist',  order: 12 },
]

/* ── SOP & Resources sample docs ── */
type SopBlock =
  | { _key: string; _type: 'block'; style?: string; listItem?: 'bullet' | 'number'; level?: number; markDefs?: unknown[]; children: Array<{ _key: string; _type: 'span'; text: string; marks?: string[] }> }
  | { _key: string; _type: 'callout'; type: 'info' | 'warning' | 'success' | 'danger'; text: string }

type SopItem = {
  title: string
  slug: string
  category: 'process' | 'template' | 'checklist' | 'training' | 'playbook' | 'tools'
  platform: string[]
  level: 'beginner' | 'intermediate' | 'advanced'
  excerpt: string
  icon: string
  pinned: boolean
  order: number
  author: string
  content: SopBlock[]
  tags: string[]
}

const SAMPLE_SOPS: SopItem[] = [
  {
    title: 'SOP — Setup Shopee CPC campaign từ A đến Z',
    slug: 'sop-shopee-cpc-setup',
    category: 'process',
    platform: ['shopee'],
    level: 'beginner',
    excerpt: 'Quy trình 8 bước setup Shopee CPC campaign chuẩn — từ keyword research đến launch + monitoring tuần đầu.',
    icon: '🛍️',
    pinned: true,
    order: 1,
    author: 'Media Omni Lead',
    content: [
      { _key: 'b1', _type: 'block', style: 'h2', children: [{ _key: 's1', _type: 'span', text: 'Bước 1 — Keyword Research' }] },
      { _key: 'b2', _type: 'block', children: [{ _key: 's2', _type: 'span', text: 'Dùng Shopee Marketing Tool → Tìm kiếm keyword theo category brand. Export top 50 keyword có search volume cao + relevance.' }] },
      { _key: 'b3', _type: 'block', style: 'h2', children: [{ _key: 's3', _type: 'span', text: 'Bước 2 — Phân loại keyword' }] },
      { _key: 'b4', _type: 'block', children: [{ _key: 's4', _type: 'span', text: 'Chia 3 nhóm: Brand keyword (CPC thấp, conversion cao), Generic (CPC cao, traffic lớn), Competitor (CPC trung bình).' }] },
      { _key: 'b5', _type: 'callout', type: 'warning', text: 'Không dùng broad match cho competitor keyword — dễ bị Shopee ban hoặc penalty.' },
      { _key: 'b6', _type: 'block', style: 'h2', children: [{ _key: 's6', _type: 'span', text: 'Bước 3-8 — Setup, Launch, Monitor' }] },
      { _key: 'b7', _type: 'block', children: [{ _key: 's7', _type: 'span', text: 'Setup ad group theo từng nhóm keyword với CPC bid riêng. Launch sau khi check creative + landing page. Monitor daily 7 ngày đầu, optimize bid + negative keyword theo performance.' }] },
    ],
    tags: ['shopee', 'cpc', 'keyword', 'setup'],
  },
  {
    title: 'Checklist — Pre-launch campaign TikTok PGM',
    slug: 'checklist-tiktok-pgm-prelaunch',
    category: 'checklist',
    platform: ['tiktok'],
    level: 'intermediate',
    excerpt: 'Checklist 12 mục cần verify trước khi launch TikTok PGM campaign — tracking, creative, budget, audience.',
    icon: '✅',
    pinned: true,
    order: 2,
    author: 'Performance Team',
    content: [
      { _key: 'b1', _type: 'block', style: 'h2', children: [{ _key: 's1', _type: 'span', text: 'Tracking & Pixel' }] },
      { _key: 'b2', _type: 'block', listItem: 'bullet', level: 1, children: [{ _key: 's2', _type: 'span', text: 'TikTok Pixel đã verify trên website' }] },
      { _key: 'b3', _type: 'block', listItem: 'bullet', level: 1, children: [{ _key: 's3', _type: 'span', text: 'Conversion events đã setup (Add to cart, Purchase)' }] },
      { _key: 'b4', _type: 'block', style: 'h2', children: [{ _key: 's4', _type: 'span', text: 'Creative' }] },
      { _key: 'b5', _type: 'block', listItem: 'bullet', level: 1, children: [{ _key: 's5', _type: 'span', text: '3+ video creative, mỗi video < 30s' }] },
      { _key: 'b6', _type: 'block', listItem: 'bullet', level: 1, children: [{ _key: 's6', _type: 'span', text: 'Aspect ratio 9:16 (full screen)' }] },
      { _key: 'b7', _type: 'block', style: 'h2', children: [{ _key: 's7', _type: 'span', text: 'Budget & Audience' }] },
      { _key: 'b8', _type: 'block', listItem: 'bullet', level: 1, children: [{ _key: 's8', _type: 'span', text: 'Budget tối thiểu 50–100 đơn/ngày để qua learning phase' }] },
      { _key: 'b9', _type: 'block', listItem: 'bullet', level: 1, children: [{ _key: 's9', _type: 'span', text: 'Audience không overlap với campaign khác đang chạy' }] },
    ],
    tags: ['tiktok', 'pgm', 'checklist', 'launch'],
  },
  {
    title: 'Template — Weekly Report DARA framework',
    slug: 'template-weekly-report-dara',
    category: 'template',
    platform: ['general'],
    level: 'beginner',
    excerpt: 'Template báo cáo tuần theo framework DARA: Data → Analysis → Root cause → Action. Dùng cho mọi platform.',
    icon: '📋',
    pinned: false,
    order: 3,
    author: 'Operations',
    content: [
      { _key: 'b1', _type: 'block', children: [{ _key: 's1', _type: 'span', text: 'DARA framework giúp report có structure rõ ràng và action-oriented.' }] },
      { _key: 'b2', _type: 'block', style: 'h3', children: [{ _key: 's2', _type: 'span', text: 'D — Data' }] },
      { _key: 'b3', _type: 'block', children: [{ _key: 's3', _type: 'span', text: 'Số liệu cụ thể: GMV, Chi phí, ROAS, CTR, CR, AOV. So sánh vs Plan + tuần trước.' }] },
      { _key: 'b4', _type: 'block', style: 'h3', children: [{ _key: 's4', _type: 'span', text: 'A — Analysis' }] },
      { _key: 'b5', _type: 'block', children: [{ _key: 's5', _type: 'span', text: 'Phân tích trend, anomaly, breakdown theo loại ads (CPC/ND/Live cho Shopee, PGM/LGM/Con/Brand cho TikTok).' }] },
      { _key: 'b6', _type: 'block', style: 'h3', children: [{ _key: 's6', _type: 'span', text: 'R — Root cause' }] },
      { _key: 'b7', _type: 'block', children: [{ _key: 's7', _type: 'span', text: 'Tìm nguyên nhân gốc (bid thấp, audience overlap, learning phase, etc).' }] },
      { _key: 'b8', _type: 'block', style: 'h3', children: [{ _key: 's8', _type: 'span', text: 'A — Action' }] },
      { _key: 'b9', _type: 'block', children: [{ _key: 's9', _type: 'span', text: '2-3 action cụ thể tuần tới: tăng/giảm bid, shift budget, A/B test, etc.' }] },
    ],
    tags: ['weekly', 'report', 'dara', 'template'],
  },
  {
    title: 'Onboarding — 7 ngày đầu cho Performance Marketing Specialist',
    slug: 'onboarding-7days-pms',
    category: 'training',
    platform: ['general'],
    level: 'beginner',
    excerpt: 'Lộ trình onboarding 7 ngày cho specialist mới — học platform, tools, quy trình team Media Omni.',
    icon: '🎓',
    pinned: false,
    order: 4,
    author: 'HR & Training',
    content: [
      { _key: 'b1', _type: 'block', style: 'h2', children: [{ _key: 's1', _type: 'span', text: 'Day 1-2: Platform basics' }] },
      { _key: 'b2', _type: 'block', children: [{ _key: 's2', _type: 'span', text: 'Tổng quan TikTok Shop, Shopee, Meta, Google. Account access + tool setup.' }] },
      { _key: 'b3', _type: 'block', style: 'h2', children: [{ _key: 's3', _type: 'span', text: 'Day 3-4: DARA framework + Reporting' }] },
      { _key: 'b4', _type: 'block', children: [{ _key: 's4', _type: 'span', text: 'Học framework DARA, làm thử weekly report cho 1 brand thực tế (shadowing senior).' }] },
      { _key: 'b5', _type: 'block', style: 'h2', children: [{ _key: 's5', _type: 'span', text: 'Day 5-7: Hands-on' }] },
      { _key: 'b6', _type: 'block', children: [{ _key: 's6', _type: 'span', text: 'Được assign 1-2 brand pilot. Quiz Dạng 1 + Dạng 2 (target 80%+).' }] },
    ],
    tags: ['onboarding', 'training', 'team'],
  },
  {
    title: 'Playbook — Scale từ 50M lên 200M ngân sách/tháng',
    slug: 'playbook-scale-50m-200m',
    category: 'playbook',
    platform: ['shopee', 'tiktok'],
    level: 'advanced',
    excerpt: 'Strategic playbook khi scale ngân sách brand từ 50M lên 200M/tháng — phòng tránh ROAS drop.',
    icon: '🚀',
    pinned: false,
    order: 5,
    author: 'Senior Lead',
    content: [
      { _key: 'b1', _type: 'block', children: [{ _key: 's1', _type: 'span', text: 'Scaling 4x ngân sách trong 1-2 tháng cần chiến lược cẩn thận để không bị ROAS drop > 30%.' }] },
      { _key: 'b2', _type: 'callout', type: 'info', text: 'Rule of thumb: scale 25-30% mỗi tuần, không nhảy hơn 50% trong 1 lần.' },
      { _key: 'b3', _type: 'block', style: 'h2', children: [{ _key: 's3', _type: 'span', text: 'Phase 1 (Week 1-2): Audit + Reallocation' }] },
      { _key: 'b4', _type: 'block', children: [{ _key: 's4', _type: 'span', text: 'Identify top-performing ad sets/keywords. Cut bottom 20% performers. Reallocate budget vào top 30%.' }] },
      { _key: 'b5', _type: 'block', style: 'h2', children: [{ _key: 's5', _type: 'span', text: 'Phase 2 (Week 3-6): Gradual scale' }] },
      { _key: 'b6', _type: 'block', children: [{ _key: 's6', _type: 'span', text: 'Tăng budget 25% mỗi tuần trên winning campaigns. Monitor ROAS daily. Nếu drop >15% → hold scale, optimize trước.' }] },
    ],
    tags: ['scale', 'playbook', 'advanced', 'budget'],
  },
]

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function main() {
  console.log(`[seed-sanity] projectId=${projectId} dataset=${dataset}`)

  // 1) Upsert siteSettings (createOrReplace — predictable singleton)
  await client.createOrReplace(siteSettingsDoc)
  console.log('[seed-sanity] ✓ siteSettings upserted (id=siteSettings)')

  // 2) Upsert brands as a single transaction
  const tx = client.transaction()
  BRAND_LIST.forEach((b, i) => {
    const _id = `brand-${slugify(b.name)}`
    tx.createOrReplace({
      _id,
      _type: 'brand',
      name: b.name,
      category: b.category,
      active: true,
      order: i + 1,
    })
  })
  await tx.commit()
  console.log(`[seed-sanity] ✓ Upserted ${BRAND_LIST.length} brands`)

  // 3) Upsert team members
  const teamTx = client.transaction()
  TEAM_LIST.forEach(m => {
    const _id = `team-${slugify(m.name)}`
    teamTx.createOrReplace({
      _id,
      _type: 'teamMember',
      name: m.name,
      role: m.role,
      isLead: m.isLead || false,
      order: m.order,
    })
  })
  await teamTx.commit()
  console.log(`[seed-sanity] ✓ Upserted ${TEAM_LIST.length} team members`)

  // 4) Upsert case studies
  const csTx = client.transaction()
  SAMPLE_CASE_STUDIES.forEach(cs => {
    const _id = `caseStudy-${cs.slug}`
    csTx.createOrReplace({
      _id,
      _type: 'caseStudy',
      title: cs.title,
      slug: { _type: 'slug', current: cs.slug },
      brandName: cs.brandName,
      industry: cs.industry,
      platforms: cs.platforms,
      excerpt: cs.excerpt,
      featured: cs.featured,
      order: cs.order,
      results: cs.results.map((r, i) => ({ _key: `r${i}`, _type: 'resultItem', ...r })),
      ...(cs.testimonial ? { testimonial: cs.testimonial } : {}),
      publishedAt: new Date().toISOString(),
    })
  })
  await csTx.commit()
  console.log(`[seed-sanity] ✓ Upserted ${SAMPLE_CASE_STUDIES.length} case studies`)

  // 5) Upsert SOP docs
  const sopTx = client.transaction()
  SAMPLE_SOPS.forEach(s => {
    const _id = `sopDoc-${s.slug}`
    sopTx.createOrReplace({
      _id,
      _type: 'sopDoc',
      title: s.title,
      slug: { _type: 'slug', current: s.slug },
      category: s.category,
      platform: s.platform,
      level: s.level,
      excerpt: s.excerpt,
      icon: s.icon,
      pinned: s.pinned,
      order: s.order,
      author: s.author,
      content: s.content,
      tags: s.tags,
      publishedAt: new Date().toISOString(),
    })
  })
  await sopTx.commit()
  console.log(`[seed-sanity] ✓ Upserted ${SAMPLE_SOPS.length} SOP docs`)

  console.log(`\n[seed-sanity] Done. Upserted 1 siteSettings, ${BRAND_LIST.length} brands, ${TEAM_LIST.length} team members, ${SAMPLE_CASE_STUDIES.length} case studies, ${SAMPLE_SOPS.length} SOP docs.`)
}

main().catch(err => {
  console.error('[seed-sanity] FAILED:', err)
  process.exit(1)
})
