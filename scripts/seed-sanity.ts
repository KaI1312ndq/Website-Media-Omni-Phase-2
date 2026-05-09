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

  console.log(`\n[seed-sanity] Done. Upserted 1 siteSettings, ${BRAND_LIST.length} brands.`)
}

main().catch(err => {
  console.error('[seed-sanity] FAILED:', err)
  process.exit(1)
})
