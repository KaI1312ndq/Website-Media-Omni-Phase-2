import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PortableText } from '@portabletext/react'
import Link from 'next/link'
import Image from 'next/image'
import { client } from '@/lib/sanity'
import { caseStudyBySlugQuery, caseStudySlugsQuery, relatedCaseStudiesQuery } from '@/lib/queries'

export const revalidate = 600
export const dynamicParams = true

const hasSanity = Boolean(
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID &&
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID !== 'placeholder'
)

const INDUSTRY_LABELS: Record<string, string> = {
  skincare: 'Skincare & Beauty',
  fashion: 'Fashion & Lifestyle',
  baby: 'Baby & Kids',
  fmcg: 'FMCG & Food',
  electronics: 'Electronics & Home',
  pharma: 'Health & Pharma',
}

export async function generateStaticParams() {
  if (!hasSanity) return []
  const slugs: { slug: string }[] = await client.fetch(caseStudySlugsQuery).catch(() => [])
  return slugs.map(s => ({ slug: s.slug }))
}

export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const cs = await client.fetch(caseStudyBySlugQuery, { slug: params.slug }).catch(() => null)
  if (!cs) return { title: 'Case study không tồn tại' }
  const ogImg = cs.coverUrl ?? null
  return {
    title: `${cs.title} — Case Study`,
    description: cs.excerpt,
    openGraph: {
      title: cs.title,
      description: cs.excerpt,
      url: `https://www.mediaomni.site/case-studies/${params.slug}`,
      type: 'article',
      ...(ogImg ? { images: [{ url: ogImg, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: cs.title,
      description: cs.excerpt,
      ...(ogImg ? { images: [ogImg] } : {}),
    },
  }
}

const ptComponents = {
  block: {
    h2: ({ children }: { children?: React.ReactNode }) => <h2 className="pt-h2">{children}</h2>,
    h3: ({ children }: { children?: React.ReactNode }) => <h3 className="pt-h3">{children}</h3>,
    blockquote: ({ children }: { children?: React.ReactNode }) => <blockquote className="pt-blockquote">{children}</blockquote>,
    normal: ({ children }: { children?: React.ReactNode }) => <p className="pt-p">{children}</p>,
  },
}

function formatPeriod(start?: string, end?: string) {
  if (!start && !end) return null
  const fmt = (d?: string) => d ? new Date(d).toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' }) : ''
  return [fmt(start), fmt(end)].filter(Boolean).join(' → ')
}

export default async function CaseStudyDetailPage({ params }: { params: { slug: string } }) {
  const cs = await client.fetch(caseStudyBySlugQuery, { slug: params.slug }).catch(() => null)
  if (!cs) notFound()

  const related = cs.industry
    ? await client.fetch(relatedCaseStudiesQuery, { industry: cs.industry, slug: params.slug }).catch(() => [])
    : []

  const period = formatPeriod(cs.periodStart, cs.periodEnd)
  const topResults = (cs.results ?? []).slice(0, 4)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: cs.title,
    description: cs.excerpt,
    datePublished: cs.publishedAt,
    dateModified: cs._updatedAt ?? cs.publishedAt,
    author: { '@type': 'Organization', name: 'Media Omni' },
    publisher: {
      '@type': 'Organization',
      name: 'Media Omni',
      logo: { '@type': 'ImageObject', url: 'https://www.mediaomni.site/favicon.svg' },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://www.mediaomni.site/case-studies/${params.slug}`,
    },
    url: `https://www.mediaomni.site/case-studies/${params.slug}`,
    ...(cs.coverUrl ? { image: cs.coverUrl } : {}),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <article className="cs-page">
        {/* BACK */}
        <div className="post-back-bar">
          <div className="container">
            <Link href="/case-studies" className="post-back-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
              Quay lại Case Studies
            </Link>
          </div>
        </div>

        {/* HERO */}
        <header className="cs-detail-hero">
          {cs.coverUrl && (
            <div className="cs-detail-cover" style={{ position: 'relative' }}>
              <Image
                src={cs.coverUrl}
                alt={cs.title}
                fill
                sizes="100vw"
                style={{ objectFit: 'cover' }}
                priority
                fetchPriority="high"
              />
            </div>
          )}
          <div className="cs-detail-hero-overlay" />
          <div className="container">
            <div className="cs-detail-hero-inner">
              {cs.logoUrl && (
                <div className="cs-detail-logo">
                  <Image src={cs.logoUrl} alt={cs.brandName} width={80} height={80} style={{ objectFit: 'contain' }} />
                </div>
              )}
              <div className="cs-detail-brand">{cs.brandName}</div>
              <h1 className="cs-detail-title">{cs.title}</h1>
              {cs.excerpt && <p className="cs-detail-excerpt">{cs.excerpt}</p>}
              <div className="cs-detail-meta">
                {cs.industry && <span>{INDUSTRY_LABELS[cs.industry] ?? cs.industry}</span>}
                {period && <span>· {period}</span>}
                {cs.platforms && cs.platforms.length > 0 && (
                  <span>· {cs.platforms.join(', ')}</span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* STATS ROW */}
        {topResults.length > 0 && (
          <section className="cs-stats-row">
            <div className="container">
              <div className="cs-stats-grid">
                {topResults.map((r: { metric?: string; before?: string; after?: string; change?: string }, i: number) => (
                  <div key={i} className="cs-stat-card">
                    <div className="cs-stat-metric">{r.metric}</div>
                    <div className="cs-stat-after">{r.after}</div>
                    <div className="cs-stat-change">{r.change}</div>
                    {r.before && <div className="cs-stat-before">Trước: {r.before}</div>}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* MAIN BODY */}
        <div className="container cs-detail-container">
          <div className="cs-detail-grid">
            <div className="cs-detail-main">
              {cs.challenge && (
                <section className="cs-section">
                  <div className="cs-section-label">01 — Challenge</div>
                  <h2 className="cs-section-title">Vấn đề / Bài toán</h2>
                  <div className="post-body">
                    <PortableText value={cs.challenge} components={ptComponents as Parameters<typeof PortableText>[0]['components']} />
                  </div>
                </section>
              )}
              {cs.solution && (
                <section className="cs-section">
                  <div className="cs-section-label">02 — Solution</div>
                  <h2 className="cs-section-title">Giải pháp / Approach</h2>
                  <div className="post-body">
                    <PortableText value={cs.solution} components={ptComponents as Parameters<typeof PortableText>[0]['components']} />
                  </div>
                </section>
              )}
              {cs.results && cs.results.length > 0 && (
                <section className="cs-section">
                  <div className="cs-section-label">03 — Results</div>
                  <h2 className="cs-section-title">Kết quả chi tiết</h2>
                  <div className="cs-results-table">
                    <div className="cs-results-head">
                      <span>Chỉ số</span><span>Trước</span><span>Sau</span><span>Δ</span>
                    </div>
                    {cs.results.map((r: { metric?: string; before?: string; after?: string; change?: string }, i: number) => (
                      <div key={i} className="cs-results-row">
                        <span className="cs-results-metric">{r.metric}</span>
                        <span className="cs-results-before">{r.before ?? '—'}</span>
                        <span className="cs-results-after">{r.after ?? '—'}</span>
                        <span className="cs-results-change">{r.change ?? '—'}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <aside className="cs-detail-aside">
              <div className="cs-aside-card">
                <div className="cs-aside-title">Brand Info</div>
                {cs.logoUrl && (
                  <div className="cs-aside-logo">
                    <Image src={cs.logoUrl} alt={cs.brandName} width={64} height={64} style={{ objectFit: 'contain' }} />
                  </div>
                )}
                <div className="cs-aside-brand">{cs.brandName}</div>
                {cs.industry && <div className="cs-aside-row"><span>Ngành:</span> {INDUSTRY_LABELS[cs.industry] ?? cs.industry}</div>}
                {cs.platforms && cs.platforms.length > 0 && (
                  <div className="cs-aside-row"><span>Platforms:</span> {cs.platforms.join(', ')}</div>
                )}
                {period && <div className="cs-aside-row"><span>Period:</span> {period}</div>}
              </div>

              {cs.testimonial?.quote && (
                <div className="cs-aside-card cs-quote-card">
                  <svg className="cs-quote-mark" width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M9.5 7c-3 0-5.5 2.5-5.5 5.5v5h5.5v-5.5h-3c.2-1.4 1.4-2.5 3-2.5v-2.5zm10 0c-3 0-5.5 2.5-5.5 5.5v5h5.5v-5.5h-3c.2-1.4 1.4-2.5 3-2.5v-2.5z" /></svg>
                  <p className="cs-quote-text">{cs.testimonial.quote}</p>
                  <div className="cs-quote-author">
                    {cs.testimonial.authorPhotoUrl && (
                      <Image src={cs.testimonial.authorPhotoUrl} alt={cs.testimonial.authorName ?? ''} width={40} height={40} style={{ borderRadius: '50%', objectFit: 'cover' }} />
                    )}
                    <div>
                      {cs.testimonial.authorName && <div className="cs-quote-name">{cs.testimonial.authorName}</div>}
                      {cs.testimonial.authorRole && <div className="cs-quote-role">{cs.testimonial.authorRole}</div>}
                    </div>
                  </div>
                </div>
              )}

              {cs.tags && cs.tags.length > 0 && (
                <div className="cs-aside-card">
                  <div className="cs-aside-title">Tags</div>
                  <div className="cs-aside-tags">
                    {cs.tags.map((t: string) => <span key={t} className="tag">{t}</span>)}
                  </div>
                </div>
              )}

              <div className="cs-aside-card cs-cta-card">
                <div className="cs-cta-title">Cũng muốn kết quả tương tự?</div>
                <p className="cs-cta-body">Liên hệ Media Omni để audit miễn phí performance marketing hiện tại.</p>
                <Link href="/#lead-form" className="btn-primary cs-cta-btn">
                  Đặt lịch tư vấn
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </Link>
              </div>
            </aside>
          </div>

          {cs.galleryUrls && cs.galleryUrls.length > 0 && (
            <section className="cs-gallery-section">
              <h2 className="cs-section-title">Gallery</h2>
              <div className="cs-gallery-grid">
                {cs.galleryUrls.map((url: string, i: number) => (
                  <div key={i} className="cs-gallery-item">
                    <Image src={url} alt={`Gallery ${i + 1}`} width={600} height={400} sizes="(max-width: 768px) 100vw, 33vw" style={{ width: '100%', height: 'auto', objectFit: 'cover' }} loading="lazy" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {related.length > 0 && (
            <section className="cs-related-section">
              <h2 className="cs-section-title">Case studies liên quan</h2>
              <div className="cs-related-grid">
                {related.map((r: { _id: string; title: string; slug: { current: string }; brandName: string; excerpt?: string; coverUrl?: string }) => (
                  <Link key={r._id} href={`/case-studies/${r.slug.current}`} className="cs-related-card">
                    {r.coverUrl && (
                      <div className="cs-related-cover" style={{ position: 'relative', aspectRatio: '16 / 10' }}>
                        <Image src={r.coverUrl} alt={r.title} fill sizes="33vw" style={{ objectFit: 'cover' }} loading="lazy" />
                      </div>
                    )}
                    <div className="cs-related-body">
                      <div className="cs-related-brand">{r.brandName}</div>
                      <h3 className="cs-related-title">{r.title}</h3>
                      {r.excerpt && <p className="cs-related-excerpt">{r.excerpt}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </article>

      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-brand-name">MediaOmni / UpBase</div>
              <p>Team Performance Marketing thuộc UpBase — Ecommerce Enabler hàng đầu Việt Nam.</p>
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
