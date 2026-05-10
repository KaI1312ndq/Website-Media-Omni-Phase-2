'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import LeadForm from './LeadForm'
import { ServiceCard, BrandsSection, PartnersSection, FaqSection, SocialIcon, type SanityBrand as SanityBrandType, type FaqItem } from './home/sections'
import { TICKER_DEFAULT, buildTeamCarousel, doLogin } from './home/helpers'

interface TickerItem { val?: string; lbl?: string; sub?: string }
interface ServiceItem { name?: string; desc?: string; icon?: string }
interface CtaConfig { title?: string; body?: string; buttonText?: string; buttonUrl?: string }
interface SocialLink { platform?: string; url?: string }
interface ImageRef { asset?: { url?: string }; alt?: string }

interface SiteSettings {
  ticker?: TickerItem[]
  heroBadge?: string
  heroTitle?: string
  heroSub?: string
  heroImage?: ImageRef
  operatorCount?: number
  growthOpsCount?: string
  brandCount?: string | number
  nmv?: string
  aboutTitle?: string
  aboutBody?: string
  aboutImage?: ImageRef
  servicesIntro?: string
  services?: ServiceItem[]
  faqIntro?: string
  faq?: FaqItem[]
  cta?: CtaConfig
  footerText?: string
  socialLinks?: SocialLink[]
}

interface TeamMember {
  _id: string
  name: string
  role: string
  isLead?: boolean
  avatar?: { asset: { url: string } }
}

export type SanityBrand = SanityBrandType

export interface LatestPost {
  _id: string
  title: string
  slug: { current: string }
  excerpt?: string
  publishedAt?: string
  coverImage?: { asset: { url: string }; alt?: string }
  bgGradient?: string
}

export interface FeaturedCaseStudy {
  _id: string
  title: string
  slug: { current: string }
  brandName: string
  industry?: string
  platforms?: string[]
  excerpt?: string
  coverUrl?: string
  logoUrl?: string
  topResult?: { metric?: string; before?: string; after?: string; change?: string }
}

interface Props {
  settings: SiteSettings | null
  team: TeamMember[]
  brands: SanityBrand[]
  posts?: LatestPost[]
  caseStudies?: FeaturedCaseStudy[]
}

export default function HomeClient({ settings, team, brands, posts = [], caseStudies = [] }: Props) {
  useEffect(() => {
    // Build ticker — use Sanity ticker if provided, else fallback
    const track = document.getElementById('ticker-track')
    if (track) {
      const source = (settings?.ticker && settings.ticker.length > 0)
        ? settings.ticker.map(t => ({ val: t.val ?? '', lbl: t.lbl ?? '', sub: t.sub ?? '' }))
        : TICKER_DEFAULT
      const items = [...source, ...source]
      track.innerHTML = items.map(d => `
        <div class="ticker-item">
          <div class="ticker-val"><span class="blue-grad">${d.val}</span></div>
          <div><span class="ticker-lbl">${d.lbl}</span><span class="ticker-sub">${d.sub}</span></div>
          <div class="ticker-dot"></div>
        </div>`).join('')
    }

    // Scroll-reveal
    const revealEls = document.querySelectorAll<HTMLElement>('.rv,.rv-l,.rv-r')
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { (e.target as HTMLElement).classList.add('on'); io.unobserve(e.target) } }),
      { threshold: 0.1 }
    )
    revealEls.forEach(el => io.observe(el))

    // Team carousel
    buildTeamCarousel(team)

    // Team carousel drag-scroll
    const wrap = document.getElementById('team-scroll-wrap') as HTMLElement | null
    if (wrap) {
      let isDragging = false, startX = 0, scrollLeft = 0
      const onDown = (e: MouseEvent) => { isDragging = true; startX = e.pageX - wrap.offsetLeft; scrollLeft = wrap.scrollLeft }
      const onUp = () => { isDragging = false }
      const onMove = (e: MouseEvent) => { if (!isDragging) return; e.preventDefault(); wrap.scrollLeft = scrollLeft - (e.pageX - wrap.offsetLeft - startX) }
      wrap.addEventListener('mousedown', onDown)
      wrap.addEventListener('mouseup', onUp)
      wrap.addEventListener('mouseleave', onUp)
      wrap.addEventListener('mousemove', onMove)
    }

    // Login modal
    const modal = document.getElementById('login-modal')
    const closeBtn = document.getElementById('modal-close')
    closeBtn?.addEventListener('click', () => modal?.classList.remove('open'))
    modal?.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open') })
    // Enter key on password field
    document.getElementById('login-pass')?.addEventListener('keydown', (e: Event) => {
      if ((e as KeyboardEvent).key === 'Enter') doLogin()
    })

    return () => io.disconnect()
  }, [team, settings])

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
                {settings?.heroBadge ?? 'UpBase Vietnam · Ecommerce Enabler'}
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
              <div className="hs-item"><div className="hs-val"><span className="blue-grad">{settings?.brandCount ? String(settings.brandCount) : '100+'}</span></div><div className="hs-lbl">Brands</div></div>
              <div className="hs-item"><div className="hs-val"><span className="blue-grad">{settings?.growthOpsCount ?? settings?.operatorCount ?? 12}</span></div><div className="hs-lbl">Operators</div></div>
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

      {/* ABOUT — only renders when Sanity has aboutTitle / aboutBody */}
      {(settings?.aboutTitle || settings?.aboutBody) && (
        <section id="about" style={{ padding: '80px 0', background: 'var(--paper)' }}>
          <div className="container">
            <div className="rv" style={{ display: 'grid', gridTemplateColumns: settings?.aboutImage?.asset?.url ? '1.2fr 1fr' : '1fr', gap: 48, alignItems: 'center' }}>
              <div>
                {settings?.aboutTitle && <h2 className="sec-title" style={{ marginBottom: 16 }}>{settings.aboutTitle}</h2>}
                {settings?.aboutBody && <p className="sec-sub" style={{ whiteSpace: 'pre-wrap' }}>{settings.aboutBody}</p>}
              </div>
              {settings?.aboutImage?.asset?.url && (
                <Image
                  src={settings.aboutImage.asset.url}
                  alt={settings.aboutImage.alt ?? 'About Media Omni'}
                  width={800}
                  height={600}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  style={{ width: '100%', height: 'auto', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)' }}
                  loading="lazy"
                />
              )}
            </div>
          </div>
        </section>
      )}

      {/* SERVICES — kept as static HTML for fidelity */}
      <section id="services">
        <div className="container">
          <div className="sec-hd rv">
            <div className="sec-label">Scope of Work</div>
            <h2 className="sec-title">Vận hành đa kênh.<br />Mỗi platform, một playbook riêng.</h2>
            <p className="sec-sub">{settings?.servicesIntro ?? 'Media Omni không chỉ chạy ads — chúng tôi vận hành toàn bộ hệ thống performance marketing từ strategy đến execution.'}</p>
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

      {/* BRANDS */}
      <BrandsSection brands={brands} />

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

      {/* FAQ — render only when Sanity has FAQ items */}
      {settings?.faq && settings.faq.length > 0 && (
        <FaqSection intro={settings.faqIntro} faq={settings.faq} />
      )}

      {/* CASE STUDIES — featured */}
      {caseStudies.length > 0 && (
        <section id="case-studies-home" className="cs-home-section">
          <div className="container">
            <div className="sec-hd rv" style={{ textAlign: 'center', alignItems: 'center' }}>
              <div className="sec-label" style={{ justifyContent: 'center' }}>Kết quả thực tế</div>
              <h2 className="sec-title">Case Studies.<br />Số liệu đo lường được.</h2>
              <p className="sec-sub" style={{ margin: '0 auto' }}>
                Cách Media Omni scale brands ecommerce hàng đầu Việt Nam — TikTok Shop, Shopee, Meta, Google.
              </p>
            </div>
            <div className="cs-home-grid rv">
              {caseStudies.map(cs => (
                <Link key={cs._id} href={`/case-studies/${cs.slug.current}`} className="cs-home-card">
                  <div className="cs-home-cover">
                    {cs.coverUrl ? (
                      <Image src={cs.coverUrl} alt={cs.title} fill sizes="(max-width: 768px) 100vw, 33vw" style={{ objectFit: 'cover' }} loading="lazy" />
                    ) : (
                      <div className="cs-home-cover-grad" />
                    )}
                    {cs.logoUrl && (
                      <div className="cs-home-logo">
                        <Image src={cs.logoUrl} alt={cs.brandName} width={48} height={48} style={{ objectFit: 'contain' }} />
                      </div>
                    )}
                  </div>
                  <div className="cs-home-body">
                    <div className="cs-home-brand">{cs.brandName}</div>
                    <h3 className="cs-home-title">{cs.title}</h3>
                    {cs.topResult && (
                      <div className="cs-home-result">
                        <span className="cs-home-result-metric">{cs.topResult.metric}</span>
                        <span className="cs-home-result-change">{cs.topResult.change}</span>
                      </div>
                    )}
                    {cs.excerpt && <p className="cs-home-excerpt">{cs.excerpt}</p>}
                    <div className="cs-home-cta">
                      Xem case study
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="home-blog-foot">
              <Link href="/case-studies" className="btn-outline" style={{ fontSize: '.92rem', padding: '12px 26px' }}>
                Xem tất cả case studies
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* BLOG CTA */}
      <section id="blog" className="blog-cta-section">
        <div className="container">
          <div className="sec-hd rv" style={{ textAlign: 'center', alignItems: 'center' }}>
            <div className="sec-label" style={{ justifyContent: 'center' }}>Insights & Resources</div>
            <h2 className="sec-title">Bài viết mới nhất<br />từ Media Omni.</h2>
            <p className="sec-sub" style={{ margin: '0 auto' }}>Case study, framework và playbook — cập nhật liên tục từ đội ngũ Growth Operators.</p>
          </div>
          {posts.length > 0 && (
            <div className="home-blog-grid rv">
              {posts.map(p => (
                <Link key={p._id} href={`/blog/${p.slug.current}`} className="home-blog-card">
                  <div className="home-blog-cover" style={{ position: 'relative', aspectRatio: '16 / 10' }}>
                    {p.coverImage?.asset?.url ? (
                      <Image
                        src={p.coverImage.asset.url}
                        alt={p.coverImage.alt ?? p.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        style={{ objectFit: 'cover' }}
                        loading="lazy"
                      />
                    ) : null}
                  </div>
                  <div className="home-blog-body">
                    <h3 className="home-blog-title">{p.title}</h3>
                    {p.excerpt && <p className="home-blog-excerpt">{p.excerpt}</p>}
                    <div className="home-blog-meta">
                      {p.publishedAt && (
                        <span>{new Date(p.publishedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                      )}
                      <span className="home-blog-readmore">
                        Đọc thêm
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <div className="home-blog-foot">
            <Link href="/blog" className="btn-outline" style={{ fontSize: '.92rem', padding: '12px 26px' }}>
              Xem tất cả bài viết
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </div>
      </section>

      {/* LEAD CAPTURE */}
      <LeadForm />

      {/* CONTACT */}
      <section id="contact">
        <div className="contact-glow-1" /><div className="contact-glow-2" /><div className="contact-grid-bg" />
        <div className="container">
          <div className="contact-inner rv">
            <div className="sec-label sec-label--white" style={{ justifyContent: 'center', marginBottom: 16 }}>Liên hệ</div>
            <h2 className="sec-title sec-title--white" style={{ fontSize: 'clamp(2rem,4vw,3.2rem)', marginBottom: 16, textAlign: 'center' }}>{settings?.cta?.title ?? 'Làm việc cùng Media Omni.'}</h2>
            <p className="sec-sub sec-sub--white" style={{ margin: '0 auto 36px', textAlign: 'center' }}>{settings?.cta?.body ?? 'Thương hiệu cần tăng trưởng đa kênh? Data-driven, performance-focused, results-guaranteed.'}</p>
            <div className="contact-actions">
              <a href={settings?.cta?.buttonUrl ?? 'mailto:quangnd@upbase.asia'} className="btn-primary" style={{ fontSize: '1rem', padding: '16px 36px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                {settings?.cta?.buttonText ?? 'quangnd@upbase.asia'}
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
            <span className="footer-copy">{settings?.footerText ?? '© 2026 UpBase Media Omni. All rights reserved.'}</span>
            <div className="footer-soc">
              {settings?.socialLinks && settings.socialLinks.length > 0 ? (
                settings.socialLinks.map((s, i) => (
                  <a key={i} href={s.url ?? '#'} target="_blank" rel="noopener noreferrer" aria-label={s.platform ?? 'social'}>
                    <SocialIcon platform={s.platform} />
                  </a>
                ))
              ) : (
                <>
                  <a href="#"><svg viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg></a>
                  <a href="#"><svg viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.77 0 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-6.13 6.33 6.34 6.34 0 0 0 12.67 0V8.69a8.28 8.28 0 0 0 4.83 1.54V6.77a4.85 4.85 0 0 1-1.07-.08z" /></svg></a>
                </>
              )}
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
