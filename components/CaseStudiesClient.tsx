'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export interface CaseStudyListItem {
  _id: string
  title: string
  slug: { current: string }
  brandName: string
  industry?: string
  platforms?: string[]
  excerpt?: string
  featured?: boolean
  publishedAt?: string
  tags?: string[]
  coverUrl?: string
  logoUrl?: string
  results?: { metric?: string; before?: string; after?: string; change?: string }[]
}

interface Props {
  initialCaseStudies: CaseStudyListItem[]
}

const INDUSTRIES: { value: string; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'skincare', label: 'Skincare' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'baby', label: 'Baby & Kids' },
  { value: 'fmcg', label: 'FMCG' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'pharma', label: 'Pharma' },
]

const PLATFORMS: { value: string; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'shopee', label: 'Shopee' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'meta', label: 'Meta' },
  { value: 'google', label: 'Google' },
  { value: 'livestream', label: 'Livestream' },
]

export default function CaseStudiesClient({ initialCaseStudies }: Props) {
  const [industry, setIndustry] = useState('all')
  const [platform, setPlatform] = useState('all')

  const filtered = useMemo(() => {
    return initialCaseStudies.filter(cs => {
      const indOk = industry === 'all' || cs.industry === industry
      const platOk = platform === 'all' || (cs.platforms ?? []).includes(platform)
      return indOk && platOk
    })
  }, [initialCaseStudies, industry, platform])

  return (
    <>
      {/* HERO */}
      <section className="cs-hero">
        <div className="cs-hero-glow" />
        <div className="container">
          <div className="cs-hero-inner">
            <div className="sec-label">Case Studies</div>
            <h1 className="cs-hero-title">
              Real results.<br />Real brands.
            </h1>
            <p className="cs-hero-sub">
              Cách Media Omni scale 100+ brands ecommerce — từ TikTok Shop, Shopee, Meta đến Google.
              Số liệu thật, ROAS đo lường được, không phải vanity metrics.
            </p>
          </div>
        </div>
      </section>

      {/* FILTERS */}
      <div className="cs-filter-bar">
        <div className="container">
          <div className="cs-filter-row">
            <div className="cs-filter-label">Ngành:</div>
            <div className="cs-filter-list">
              {INDUSTRIES.map(i => (
                <button
                  key={i.value}
                  className={`cs-chip${industry === i.value ? ' active' : ''}`}
                  onClick={() => setIndustry(i.value)}
                >
                  {i.label}
                </button>
              ))}
            </div>
          </div>
          <div className="cs-filter-row">
            <div className="cs-filter-label">Platform:</div>
            <div className="cs-filter-list">
              {PLATFORMS.map(p => (
                <button
                  key={p.value}
                  className={`cs-chip${platform === p.value ? ' active' : ''}`}
                  onClick={() => setPlatform(p.value)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* GRID */}
      <section className="cs-list-section">
        <div className="container">
          {filtered.length === 0 ? (
            <div className="cs-empty">
              <div className="cs-empty-ico">🎯</div>
              <p>Chưa có case study nào phù hợp với bộ lọc.</p>
              <button className="btn-outline" onClick={() => { setIndustry('all'); setPlatform('all') }}>
                Reset bộ lọc
              </button>
            </div>
          ) : (
            <div className="cs-grid">
              {filtered.map((cs, i) => (
                <Link key={cs._id} href={`/case-studies/${cs.slug.current}`} className="cs-card">
                  <div className="cs-card-cover">
                    {cs.coverUrl ? (
                      <Image
                        src={cs.coverUrl}
                        alt={cs.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        style={{ objectFit: 'cover' }}
                        loading={i < 3 ? 'eager' : 'lazy'}
                        priority={i === 0}
                      />
                    ) : (
                      <div className="cs-card-cover-grad" />
                    )}
                    {cs.logoUrl && (
                      <div className="cs-card-logo">
                        <Image src={cs.logoUrl} alt={cs.brandName} width={60} height={60} style={{ objectFit: 'contain' }} />
                      </div>
                    )}
                    {cs.featured && <div className="cs-card-badge">⭐ Featured</div>}
                  </div>
                  <div className="cs-card-body">
                    <div className="cs-card-brand">{cs.brandName}</div>
                    <h2 className="cs-card-title">{cs.title}</h2>
                    {cs.excerpt && <p className="cs-card-excerpt">{cs.excerpt}</p>}
                    {cs.results && cs.results.length > 0 && (
                      <div className="cs-card-results">
                        {cs.results.slice(0, 3).map((r, idx) => (
                          <div key={idx} className="cs-card-result-chip">
                            <span className="cs-result-metric">{r.metric}</span>
                            <span className="cs-result-change">{r.change}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {cs.tags && cs.tags.length > 0 && (
                      <div className="cs-card-tags">
                        {cs.tags.slice(0, 3).map(t => <span key={t} className="tag">{t}</span>)}
                      </div>
                    )}
                    <div className="cs-card-cta">
                      Xem case study
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
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
              <Link href="/">Trang chủ</Link>
              <a href="mailto:quangnd@upbase.asia">Liên hệ</a>
            </div>
            <div className="footer-col">
              <h4>Resources</h4>
              <Link href="/blog">Blog</Link>
              <Link href="/case-studies">Case Studies</Link>
            </div>
          </div>
          <div className="footer-bottom">
            <span className="footer-copy">© 2026 UpBase Media Omni. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </>
  )
}
