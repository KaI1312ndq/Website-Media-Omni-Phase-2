'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { urlFor } from '@/lib/sanity'

interface SiteSettings {
  ticker?: string[]
  heroTitle?: string
  heroSub?: string
  operatorCount?: number
  brandCount?: number
  nmv?: string
}

interface TeamMember {
  _id: string
  name: string
  role: string
  isLead?: boolean
  avatar?: { asset: { url: string } }
}

interface BlogPost {
  _id: string
  title: string
  slug: { current: string }
  excerpt?: string
  tags?: string[]
  publishedAt?: string
  bgGradient?: string
  coverImage?: { asset: { url: string }; alt?: string }
}

interface Props {
  settings: SiteSettings | null
  team: TeamMember[]
  posts: BlogPost[]
}

const TICKER_DEFAULT = [
  '356B NMV', '100+ Brands', '>7x ROAS', '12 Operators',
  'TikTok Shop', 'Shopee', 'Meta', 'Google', 'UpBase Vietnam',
]

const BG_GRADIENTS: Record<string, string> = {
  blue: 'linear-gradient(135deg,#1e3a8a,#2563eb)',
  teal: 'linear-gradient(135deg,#134e4a,#0d9488)',
  purple: 'linear-gradient(135deg,#4c1d95,#7c3aed)',
  orange: 'linear-gradient(135deg,#7c2d12,#ea580c)',
  navy: 'linear-gradient(135deg,#0f172a,#1e3a8a)',
}

function getGradient(key?: string) {
  if (!key) return BG_GRADIENTS.navy
  return BG_GRADIENTS[key] ?? BG_GRADIENTS.navy
}

function formatDate(iso?: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

export default function HomeClient({ settings, team, posts }: Props) {
  const tickerItems = settings?.ticker ?? TICKER_DEFAULT

  useEffect(() => {
    // Build ticker
    const track = document.getElementById('ticker-track')
    if (track) {
      const items = [...tickerItems, ...tickerItems]
      track.innerHTML = items
        .map(t => `<span class="ticker-item">${t}</span>`)
        .join('<span class="ticker-sep">·</span>')
    }

    // Scroll-reveal
    const revealEls = document.querySelectorAll<HTMLElement>('.rv')
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { (e.target as HTMLElement).classList.add('visible'); io.unobserve(e.target) } }),
      { threshold: 0.1 }
    )
    revealEls.forEach(el => io.observe(el))

    // Team carousel
    buildTeamCarousel(team)

    // Login modal
    const modal = document.getElementById('login-modal')
    const closeBtn = document.getElementById('modal-close')
    closeBtn?.addEventListener('click', () => modal?.classList.remove('open'))
    modal?.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open') })

    return () => io.disconnect()
  }, [tickerItems, team])

  return (
    <>
      {/* HERO */}
      <section id="hero">
        <div className="hero-glow-1" />
        <div className="hero-glow-2" />
        <div className="hero-grid-bg" />
        <div className="hero-wrap">
          <div>
            <div className="hero-eyebrow">
              <span className="tag tag--white">
                <span className="live-dot" />
                UpBase Vietnam · Ecommerce Enabler
              </span>
            </div>
            <h1 className="hero-title">
              <span className="hero-line"><span className="hero-line-inner ld1">Media Omni</span></span>
              <span className="hero-line"><span className="hero-line-inner ld2"><span className="grad-text">Dream Team</span></span></span>
              <span className="hero-line"><span className="hero-line-inner ld3">2025.</span></span>
            </h1>
            <p className="hero-sub">
              {settings?.heroSub ?? '12 Growth Operators. 100+ Brands. 356B NMV. Vận hành performance marketing đa kênh — TikTok Shop, Shopee, Meta, Google — với kết quả đo lường bằng số thật.'}
            </p>
            <div className="hero-actions">
              <a href="#services" className="btn-primary">
                Khám phá năng lực
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </a>
              <button className="btn-ghost" onClick={() => document.getElementById('login-modal')?.classList.add('open')}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                Team Hub
              </button>
            </div>
            <div className="hero-stats">
              <div className="hs-item"><div className="hs-val"><span className="blue-grad">{settings?.nmv ?? '356B'}</span></div><div className="hs-lbl">NMV 2025</div></div>
              <div className="hs-item"><div className="hs-val"><span className="blue-grad">&gt;7x</span></div><div className="hs-lbl">ROAS TB</div></div>
              <div className="hs-item"><div className="hs-val"><span className="blue-grad">{settings?.brandCount ? `${settings.brandCount}+` : '100+'}</span></div><div className="hs-lbl">Brands</div></div>
              <div className="hs-item"><div className="hs-val"><span className="blue-grad">{settings?.operatorCount ?? 12}</span></div><div className="hs-lbl">Operators</div></div>
            </div>
          </div>
          <div className="hero-dash" style={{ position: 'relative' }}>
            <div className="float-card fc-top">
              <div className="fc-ico" style={{ background: 'rgba(52,211,153,.15)' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.2" strokeLinecap="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
              </div>
              <div><div className="fc-lbl">NMV Total 2025</div><div className="fc-val">{settings?.nmv ?? '356B'} ↑</div></div>
            </div>
            <div className="dash-card">
              <div className="dash-hdr">
                <div className="dash-title-row">
                  <div className="dash-icon">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                  </div>
                  <span className="dash-name">Media Omni Dashboard</span>
                </div>
                <div className="dash-live"><span className="live-dot" />Live 2025</div>
              </div>
              <div className="dash-metrics">
                <div className="dm-card"><div className="dm-lbl">GMV Ads</div><div className="dm-val">323B</div><div className="dm-up"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5"><polyline points="18 15 12 9 6 15" /></svg>YoY</div></div>
                <div className="dm-card"><div className="dm-lbl">ROAS TB</div><div className="dm-val">&gt;7x</div><div className="dm-up"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5"><polyline points="18 15 12 9 6 15" /></svg>Target</div></div>
                <div className="dm-card"><div className="dm-lbl">Budget</div><div className="dm-val">62B</div><div className="dm-up"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5"><polyline points="18 15 12 9 6 15" /></svg>Active</div></div>
              </div>
              <div className="dash-chart-bg">
                <svg className="c-svg" viewBox="0 0 300 46" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="grad-line" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#2563EB" /><stop offset="100%" stopColor="#06B6D4" />
                    </linearGradient>
                    <linearGradient id="grad-area" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563EB" stopOpacity=".3" /><stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path className="c-area" d="M0,42 L0,34 C60,28 80,22 120,16 C160,10 180,6 220,3 C260,0 280,1 300,0 L300,42Z" />
                  <path className="c-line" d="M0,34 C60,28 80,22 120,16 C160,10 180,6 220,3 C260,0 280,1 300,0" />
                  <circle className="c-dot" cx="120" cy="16" r="3" fill="#06B6D4" />
                  <circle className="c-dot" cx="300" cy="0" r="3.5" fill="#2563EB" />
                </svg>
              </div>
              <div className="dash-platforms">
                {[
                  { title: 'TikTok', svg: <svg width="16" height="16" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.77 0 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-6.13 6.33 6.34 6.34 0 0 0 12.67 0V8.69a8.28 8.28 0 0 0 4.83 1.54V6.77a4.85 4.85 0 0 1-1.07-.08z" fill="white" /></svg> },
                  { title: 'Shopee', svg: <svg width="16" height="16" viewBox="0 0 24 24"><path d="M12 2C9.5 2 7.5 3.9 7.5 6.3H6L4.5 20h15L18 6.3h-1.5C16.5 3.9 14.5 2 12 2zm0 1.8c1.8 0 3.2 1.3 3.4 3H8.6C8.8 5.1 10.2 3.8 12 3.8zm0 6.5c-2.3 0-4.2-1.5-4.8-3.5h1.5c.5 1.2 1.7 2 3.3 2s2.8-.8 3.3-2h1.5c-.6 2-2.5 3.5-4.8 3.5z" fill="white" /></svg> },
                  { title: 'Meta', svg: <svg width="16" height="16" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="white" /></svg> },
                  { title: 'Google', svg: <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="white" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="white" opacity=".8" /></svg> },
                ].map(({ title, svg }) => (
                  <div key={title} className="plat-btn" title={title}>{svg}</div>
                ))}
                <div className="plat-btn plat-more"><span style={{ color: 'var(--cyan)', fontSize: '.5rem', fontWeight: 700, lineHeight: 1.3 }}>+40<br />shops</span></div>
              </div>
            </div>
            <div className="float-card fc-bot">
              <div className="fc-ico" style={{ background: 'rgba(37,99,235,.2)' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              </div>
              <div><div className="fc-lbl">ROAS Trung bình</div><div className="fc-val">&gt;7x</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* TICKER */}
      <section id="ticker">
        <div className="ticker-track" id="ticker-track" />
      </section>

      {/* SERVICES — kept as static HTML for fidelity */}
      <section id="services">
        <div className="container">
          <div className="sec-hd rv">
            <div className="sec-label">Scope of Work</div>
            <h2 className="sec-title">Vận hành đa kênh.<br />Mỗi platform, một playbook riêng.</h2>
            <p className="sec-sub">Media Omni không chỉ chạy ads — chúng tôi vận hành toàn bộ hệ thống performance marketing từ strategy đến execution.</p>
          </div>
          <ServiceCard
            icon={<svg width="28" height="28" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.77 0 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-6.13 6.33 6.34 6.34 0 0 0 12.67 0V8.69a8.28 8.28 0 0 0 4.83 1.54V6.77a4.85 4.85 0 0 1-1.07-.08z" fill="white" /></svg>}
            iconBg="linear-gradient(135deg,#010101,#2d2d2d)"
            name="TikTok Ads & Shop"
            sub="Demand creation — bùng nổ GMV từ content đến conversion"
            chips={['GMV Growth', 'Shop Ads', 'Live Boost', 'ROAS ~6x']}
            delay="d1"
            scopes={[
              { name: 'Video Ads', desc: 'Setup, optimize In-Feed Ads, TopView, Brand Takeover. A/B test creative liên tục.' },
              { name: 'Shop Ads (PGM/LGM)', desc: 'Vận hành Product Guarantee & Live Guarantee Ads. Tối ưu ROAS theo từng SKU.' },
              { name: 'Live Commerce Boost', desc: 'Boost traffic vào phiên live. Kết hợp Affiliate + Ads để maximize concurrent viewers.' },
              { name: 'Performance Reporting', desc: 'Dashboard realtime, phân tích GMV/ROAS/CPO daily. Điều chỉnh budget theo signal.' },
            ]}
          />
          <ServiceCard
            icon={<svg width="28" height="28" viewBox="0 0 24 24"><path d="M12 2C9.5 2 7.5 3.9 7.5 6.3H6L4.5 20h15L18 6.3h-1.5C16.5 3.9 14.5 2 12 2zm0 1.8c1.8 0 3.2 1.3 3.4 3H8.6C8.8 5.1 10.2 3.8 12 3.8zm0 6.5c-2.3 0-4.2-1.5-4.8-3.5h1.5c.5 1.2 1.7 2 3.3 2s2.8-.8 3.3-2h1.5c-.6 2-2.5 3.5-4.8 3.5z" fill="white" /></svg>}
            iconBg="linear-gradient(135deg,#EE4D2D,#ff7849)"
            name="Shopee Ads"
            sub="Intent capture — convert khách hàng đang có nhu cầu mua"
            chips={['Search Ads', 'Discovery', 'ROAS ~9x', 'Flash Sale']}
            delay="d2"
            scopes={[
              { name: 'Search & Discovery Ads', desc: 'Keyword research, bidding strategy, tối ưu CPC. Phủ đầy từ khóa category và brand.' },
              { name: 'Flash Sale & Mega Campaign', desc: 'Chuẩn bị campaign cho 9.9, 10.10, 11.11 — từ budget allocation đến creative brief.' },
              { name: 'Shop & Listing Optimization', desc: 'Tối ưu listing, ảnh, mô tả cho SEO Shopee. Phối hợp với team Content.' },
              { name: 'ROAS Tracking & Optimization', desc: 'Monitor Direct/Indirect GMV, optimize toward ROAS ~9x. Weekly review với client.' },
            ]}
          />
          <ServiceCard
            icon={<svg width="28" height="28" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="white" /></svg>}
            iconBg="linear-gradient(135deg,#0866FF,#3b82f6)"
            name="Meta Ads & CPAS"
            sub="Scaling đúng đối tượng — Facebook, Instagram và CPAS kết hợp marketplace"
            chips={['CPAS', 'Retargeting', 'Scaling', 'Lead Gen']}
            delay="d3"
            scopes={[
              { name: 'Audience Strategy', desc: 'Xây dựng audience stack: cold → warm → retarget. Custom + Lookalike theo từng objective.' },
              { name: 'CPAS — Collaborative Ads', desc: 'Kết nối catalog Shopee/Lazada vào Meta Ads. Drive traffic có intent thẳng vào gian hàng.' },
              { name: 'Creative Testing', desc: 'DCO, A/B test format (video/carousel/static). Phối hợp với Content team brief đúng spec.' },
              { name: 'Lead Generation', desc: 'Instant Form, Messenger, Website Lead. CRM sync, nurturing flow cho brand offline.' },
            ]}
          />
          <ServiceCard
            icon={<svg width="28" height="28" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="white" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="white" opacity=".8" /></svg>}
            iconBg="linear-gradient(135deg,#4285F4,#34A853)"
            name="Google Ads"
            sub="Capture đúng intent — Search, Shopping, YouTube, Performance Max"
            chips={['Search', 'Shopping', 'PMax', 'YouTube']}
            delay="d4"
            scopes={[
              { name: 'Search Campaigns', desc: 'Keyword strategy, match type, ad copy. Tối ưu Quality Score và CPC.' },
              { name: 'Shopping & PMax', desc: 'Feed optimization, product group bidding. Performance Max với asset group theo ngành.' },
              { name: 'YouTube Ads', desc: 'Skippable, Non-skip, Bumper 6s. Brand awareness và remarketing video.' },
              { name: 'Local & GDN', desc: 'Local campaigns cho chuỗi cửa hàng. GDN retargeting theo hành vi website.' },
            ]}
          />
        </div>
      </section>

      {/* BRANDS — static marquee rows */}
      <BrandsSection />

      {/* PARTNERS */}
      <PartnersSection />

      {/* TEAM */}
      <section id="team">
        <div className="container">
          <div className="sec-hd rv">
            <div className="sec-label">Đội ngũ</div>
            <h2 className="sec-title">{settings?.operatorCount ?? 12} Growth Operators.</h2>
            <p className="sec-sub">Mỗi người một thế mạnh — cùng một hệ thống vận hành.</p>
          </div>
          <div className="team-scroll-wrap rv" id="team-scroll-wrap">
            <div className="team-row" id="team-row" />
          </div>
          <div className="team-dots" id="team-dots" />
        </div>
      </section>

      {/* QUIZ PREVIEW */}
      <section id="quiz-preview">
        <div className="quiz-glow-1" /><div className="quiz-glow-2" /><div className="quiz-grid-bg" />
        <div className="container quiz-inner">
          <div className="sec-hd-flex rv">
            <div>
              <div className="sec-label sec-label--white">Quiz Hub</div>
              <h2 className="sec-title sec-title--white">Học hỏi. Thực hành.<br />Nâng tầm.</h2>
              <p className="sec-sub sec-sub--white">Bài kiểm tra nội bộ theo từng platform — đăng nhập để làm bài và theo dõi tiến trình.</p>
            </div>
            <button className="btn-primary" onClick={() => document.getElementById('login-modal')?.classList.add('open')} style={{ alignSelf: 'flex-end', flexShrink: 0 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              Đăng nhập làm bài
            </button>
          </div>
          <div className="qp-grid" id="quiz-grid" />
        </div>
      </section>

      {/* BLOG PREVIEW */}
      <section id="blog">
        <div className="container">
          <div className="sec-hd-flex rv">
            <div>
              <div className="sec-label">Insights & Blog</div>
              <h2 className="sec-title">Kiến thức thực chiến<br />từ Media Omni.</h2>
              <p className="sec-sub">Case study, framework và playbook — chia sẻ để cùng grow.</p>
            </div>
            <Link href="/blog" className="btn-outline">
              Xem tất cả bài viết
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
          </div>
          <div className="blog-grid">
            {posts.length > 0 ? posts.map(p => (
              <Link key={p._id} href={`/blog/${p.slug.current}`} className="blog-prev-card" style={{ background: getGradient(p.bgGradient) }}>
                <div className="bpc-tags">
                  {(p.tags ?? []).slice(0, 2).map(t => <span key={t} className="tag tag--white">{t}</span>)}
                </div>
                <h3 className="bpc-title">{p.title}</h3>
                {p.excerpt && <p className="bpc-excerpt">{p.excerpt}</p>}
                <div className="bpc-footer">
                  <span className="bpc-date">{formatDate(p.publishedAt)}</span>
                  <span className="bpc-read">Đọc bài →</span>
                </div>
              </Link>
            )) : (
              <p style={{ color: 'var(--muted)', gridColumn: '1/-1' }}>Chưa có bài viết nào.</p>
            )}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact">
        <div className="contact-glow-1" /><div className="contact-glow-2" /><div className="contact-grid-bg" />
        <div className="container">
          <div className="contact-inner rv">
            <div className="sec-label sec-label--white" style={{ justifyContent: 'center', marginBottom: 16 }}>Liên hệ</div>
            <h2 className="sec-title sec-title--white" style={{ fontSize: 'clamp(2rem,4vw,3.2rem)', marginBottom: 16, textAlign: 'center' }}>Làm việc cùng<br />Media Omni.</h2>
            <p className="sec-sub sec-sub--white" style={{ margin: '0 auto 36px', textAlign: 'center' }}>Thương hiệu cần tăng trưởng đa kênh? Data-driven, performance-focused, results-guaranteed.</p>
            <div className="contact-actions">
              <a href="mailto:quangnd@upbase.asia" className="btn-primary" style={{ fontSize: '1rem', padding: '16px 36px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                quangnd@upbase.asia
              </a>
              <button className="btn-ghost" style={{ fontSize: '1rem', padding: '16px 36px' }} onClick={() => document.getElementById('login-modal')?.classList.add('open')}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                Đăng nhập Team Hub
              </button>
            </div>
            <div className="contact-info">
              <span className="contact-info-item">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="1.8" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                quangnd@upbase.asia
              </span>
              <span className="contact-info-item">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="1.8" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                UpBase Vietnam
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-brand-name">MediaOmni / UpBase</div>
              <p>Team Performance Marketing thuộc UpBase — Ecommerce Enabler hàng đầu Việt Nam.</p>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <a href="#hero">Giới thiệu</a><a href="#team">Đội ngũ</a><a href="mailto:quangnd@upbase.asia">Liên hệ</a>
            </div>
            <div className="footer-col">
              <h4>Services</h4>
              <a href="#services">TikTok Ads</a><a href="#services">Shopee Ads</a><a href="#services">Meta Ads</a><a href="#services">Google Ads</a>
            </div>
            <div className="footer-col">
              <h4>Resources</h4>
              <a href="/blog">Blog</a><a href="/quiz">Quiz Hub</a><a href="/dashboard">Team Hub</a><a href="/admin">CMS Admin</a>
            </div>
          </div>
          <div className="footer-bottom">
            <span className="footer-copy">© 2026 UpBase Media Omni. All rights reserved.</span>
            <div className="footer-soc">
              <a href="#"><svg viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg></a>
              <a href="#"><svg viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.77 0 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-6.13 6.33 6.34 6.34 0 0 0 12.67 0V8.69a8.28 8.28 0 0 0 4.83 1.54V6.77a4.85 4.85 0 0 1-1.07-.08z" /></svg></a>
            </div>
          </div>
        </div>
      </footer>

      {/* LOGIN MODAL */}
      <div className="modal-overlay" id="login-modal">
        <div className="modal-box">
          <button className="modal-close" id="modal-close">✕</button>
          <div className="modal-logo">
            <div className="modal-mark">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            </div>
            <div className="modal-title">MediaOmni</div>
            <div className="modal-sub">Đăng nhập để truy cập Team Hub</div>
          </div>
          <div className="modal-field"><label className="modal-label">Username</label><input className="modal-input" type="text" id="login-user" placeholder="username" autoComplete="off" /></div>
          <div className="modal-field"><label className="modal-label">Password</label><input className="modal-input" type="password" id="login-pass" placeholder="••••••••" /></div>
          <button className="modal-btn" onClick={doLogin}>Đăng nhập →</button>
          <div className="modal-error" id="login-error">Sai username hoặc password.</div>
        </div>
      </div>
      <div id="toast"><div className="toast-dot" /><span id="toast-msg" /></div>
    </>
  )
}

function doLogin() {
  const user = (document.getElementById('login-user') as HTMLInputElement)?.value.trim()
  const pass = (document.getElementById('login-pass') as HTMLInputElement)?.value
  const err = document.getElementById('login-error')
  if (user === 'mediaomni' && pass === 'upbase2025') {
    document.getElementById('login-modal')?.classList.remove('open')
    window.location.href = '/dashboard'
  } else {
    if (err) err.style.display = 'block'
    setTimeout(() => { if (err) err.style.display = 'none' }, 3000)
  }
}

function buildTeamCarousel(team: TeamMember[]) {
  const row = document.getElementById('team-row')
  const dots = document.getElementById('team-dots')
  if (!row) return

  const members = team.length > 0 ? team : PLACEHOLDER_TEAM
  row.innerHTML = members.map(m => `
    <div class="team-card${m.isLead ? ' team-card--lead' : ''}">
      <div class="tc-avatar">
        ${m.avatar?.asset?.url ? `<img src="${m.avatar.asset.url}" alt="${m.name}" />` : `<div class="tc-initials">${m.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}</div>`}
      </div>
      <div class="tc-name">${m.name}</div>
      <div class="tc-role">${m.role}</div>
      ${m.isLead ? '<div class="tc-lead-badge">Lead</div>' : ''}
    </div>
  `).join('')
}

const PLACEHOLDER_TEAM: TeamMember[] = [
  { _id: '1', name: 'Quang Nguyen', role: 'Team Lead · Performance', isLead: true },
  { _id: '2', name: 'Operator 2', role: 'TikTok Specialist' },
  { _id: '3', name: 'Operator 3', role: 'Shopee Ads' },
  { _id: '4', name: 'Operator 4', role: 'Meta Ads' },
]

interface ServiceCardProps {
  icon: React.ReactNode
  iconBg: string
  name: string
  sub: string
  chips: string[]
  delay: string
  scopes: { name: string; desc: string }[]
}

function ServiceCard({ icon, iconBg, name, sub, chips, delay, scopes }: ServiceCardProps) {
  return (
    <div className={`svc-detail-card rv ${delay}`}>
      <div className="svc-detail-left">
        <div className="svc-detail-icon" style={{ background: iconBg }}>{icon}</div>
        <h3 className="svc-detail-name">{name}</h3>
        <p className="svc-detail-sub">{sub}</p>
        <div className="svc-chips" style={{ marginTop: 16 }}>
          {chips.map(c => <span key={c} className="chip">{c}</span>)}
        </div>
      </div>
      <div className="svc-detail-right">
        <div className="svc-scope-title">Scope of Work</div>
        <div className="svc-scope-grid">
          {scopes.map(s => (
            <div key={s.name} className="svc-scope-item">
              <div className="ssi-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <div><div className="ssi-name">{s.name}</div><div className="ssi-desc">{s.desc}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const BRAND_ROWS = [
  { names: ['The Ordinary', 'Paula\'s Choice', 'Anessa', 'Hada Labo', 'Bioderma', 'CeraVe', 'La Roche-Posay', 'Neutrogena', 'Eucerin', 'Innisfree'], dur: '55s', rev: false },
  { names: ['Nón Sơn', 'Biti\'s', 'Vascara', 'Owen', 'Coolmate', 'CANIFA', 'Aristino', 'Routine', 'The KAFi', 'Elise'], dur: '65s', rev: true },
  { names: ['Huggies', 'Pampers', 'Bobby', 'Mamamy', 'Cussons', 'Pigeon', 'Chicco', 'NUK', 'Graco', 'Cybex'], dur: '50s', rev: false },
  { names: ['Vinamilk', 'TH True Milk', 'NutiFood', 'Nestlé', 'Abbott', 'Mead Johnson', 'Dutch Lady', 'Fami', 'Bibica', 'Kinh Đô'], dur: '70s', rev: true },
  { names: ['Sunhouse', 'Kangaroo', 'Karofi', 'Lock&Lock', 'Tefal', 'Philips', 'Panasonic', 'Electrolux', 'Samsung', 'LG'], dur: '60s', rev: false },
]

function BrandsSection() {
  return (
    <section id="brands">
      <div className="container">
        <div className="sec-hd rv" style={{ textAlign: 'center', alignItems: 'center' }}>
          <div className="sec-label" style={{ justifyContent: 'center' }}>Brand Portfolio</div>
          <h2 className="sec-title">100+ Brands.<br />Mọi ngành hàng.</h2>
          <p className="sec-sub" style={{ margin: '0 auto' }}>Từ skincare đến FMCG, từ fashion đến electronics — Media Omni vận hành đa dạng ngành hàng trên mọi nền tảng.</p>
        </div>
      </div>
      <div className="brands-container rv">
        {BRAND_ROWS.map((row, i) => (
          <div
            key={i}
            className={`brands-track${row.rev ? ' brands-track-reverse' : ''}`}
            style={{ animationDuration: row.dur }}
          >
            {[...row.names, ...row.names].map((name, j) => (
              <div key={j} className="brand-pill">{name}</div>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}

function PartnersSection() {
  const partners = [
    {
      name: 'TikTok Shop', tier: 'Kim Cương 2025', badgeClass: 'partner-badge--diamond',
      desc: 'TikTok Shop Partner xuất sắc — Top partner theo GMV toàn quốc.',
      iconBg: undefined,
      icon: <svg width="32" height="32" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.77 0 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-6.13 6.33 6.34 6.34 0 0 0 12.67 0V8.69a8.28 8.28 0 0 0 4.83 1.54V6.77a4.85 4.85 0 0 1-1.07-.08z" fill="#010101" /></svg>,
    },
    {
      name: 'Shopee', tier: 'Strategic Partner', badgeClass: 'partner-badge--premium',
      desc: 'Shopee Strategic Partner — Top 5 Đối tác Toàn diện Xuất sắc 2025.',
      iconBg: 'linear-gradient(145deg,#ff6533,#ee4d2d)',
      icon: <svg viewBox="0 0 48 48" width="40" height="40"><path d="M24 8c-4.4 0-8 3.5-8 7.8H13L10 40h28l-3-24.2h-3C32 11.5 28.4 8 24 8zm0 3.2c3 0 5.4 2.2 5.8 5H18.2c.4-2.8 2.8-5 5.8-5zm0 10.8c-3.8 0-7-2.5-8.2-6h2.5c.9 2 2.9 3.4 5.7 3.4s4.8-1.4 5.7-3.4h2.5c-1.2 3.5-4.4 6-8.2 6z" fill="white" /></svg>,
    },
    {
      name: 'Google', tier: 'Google Partner', badgeClass: 'partner-badge--google',
      desc: 'Google Partner certified — Search, Shopping, YouTube, Performance Max.',
      iconBg: 'white',
      icon: <svg viewBox="0 0 48 48" width="40" height="40"><path d="M6.3 15.7l6.6 4.8C14.6 17 19 14 24 14c3 0 5.8 1.1 7.9 3l5.7-5.7C34 8.1 29.3 6 24 6c-7.6 0-14.2 4.3-17.7 9.7z" fill="#EA4335" /><path d="M24 44c5.2 0 9.7-1.7 13.1-4.7l-6.1-5c-1.7 1.2-3.9 1.9-7 1.9-5.4 0-10-3.8-11.2-9H2.7v5.2C6.1 39.6 14.5 44 24 44z" fill="#34A853" /><path d="M43.6 20H24v8h11.3c-.5 2.6-2 4.9-4.2 6.4l6.1 5c3.5-3.3 5.8-8.2 5.8-14.5 0-1.2-.1-2.5-.4-3.5z" fill="#4285F4" /><path d="M6.3 15.7C4.9 18.2 4 21 4 24s.9 5.8 2.3 8.3l6.6-5.1c-.5-1-.8-2.1-.8-3.2s.3-2.2.8-3.2L6.3 15.7z" fill="#FBBC05" /></svg>,
    },
    {
      name: 'Meta', tier: 'Business Partner', badgeClass: 'partner-badge--meta',
      desc: 'Meta Business Partner — Facebook, Instagram Ads và CPAS specialist.',
      iconBg: undefined,
      icon: <svg width="32" height="32" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#0866FF" /></svg>,
    },
  ]

  return (
    <section id="partners">
      <div className="container">
        <div className="sec-hd rv" style={{ textAlign: 'center', alignItems: 'center' }}>
          <div className="sec-label" style={{ justifyContent: 'center' }}>Platform Partners</div>
          <h2 className="sec-title">Đối tác chính thức<br />trên mọi nền tảng.</h2>
          <p className="sec-sub" style={{ margin: '0 auto' }}>Được công nhận bởi các nền tảng hàng đầu — TikTok Shop Partner, Shopee Strategic Partner, Google Partner, Meta Business Partner.</p>
        </div>
        <div className="partners-grid rv">
          {partners.map(p => (
            <div key={p.name} className="partner-card">
              <div className="partner-logo-wrap" style={p.iconBg ? { background: p.iconBg, borderRadius: 18, ...(p.iconBg === 'white' ? { border: '1.5px solid #e8eaed' } : {}) } : undefined}>
                {p.icon}
              </div>
              <div className="partner-name">{p.name}</div>
              <div className="partner-tier">
                <span className={`partner-badge ${p.badgeClass}`}>{p.tier}</span>
              </div>
              <div className="partner-desc">{p.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
