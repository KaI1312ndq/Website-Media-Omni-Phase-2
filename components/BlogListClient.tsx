'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface BlogPost {
  _id: string
  title: string
  slug: { current: string }
  excerpt?: string
  tags?: string[]
  author?: string
  publishedAt?: string
  bgGradient?: string
  coverImage?: { asset: { url: string }; alt?: string }
}

interface Props {
  initialPosts: BlogPost[]
}

const BG_GRADIENTS: Record<string, string> = {
  blue:   'linear-gradient(135deg,#1e3a8a,#2563eb)',
  teal:   'linear-gradient(135deg,#134e4a,#0d9488)',
  purple: 'linear-gradient(135deg,#4c1d95,#7c3aed)',
  orange: 'linear-gradient(135deg,#7c2d12,#ea580c)',
  navy:   'linear-gradient(135deg,#0f172a,#1e3a8a)',
}
const GRADIENTS = Object.values(BG_GRADIENTS)

function getGradient(key?: string, fallbackIdx = 0) {
  if (key && BG_GRADIENTS[key]) return BG_GRADIENTS[key]
  return GRADIENTS[fallbackIdx % GRADIENTS.length]
}

function formatDate(iso?: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function readTime(excerpt?: string) {
  const words = (excerpt ?? '').split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200))
}

export default function BlogListClient({ initialPosts }: Props) {
  const [activeTag, setActiveTag] = useState('Tất cả')
  const [query, setQuery]         = useState('')

  const allTags = useMemo(() => {
    const set = new Set<string>()
    initialPosts.forEach(p => p.tags?.forEach(t => set.add(t)))
    return ['Tất cả', ...Array.from(set)]
  }, [initialPosts])

  const filtered = useMemo(() => {
    return initialPosts.filter(p => {
      const matchTag  = activeTag === 'Tất cả' || p.tags?.includes(activeTag)
      const q         = query.toLowerCase()
      const matchText = !q ||
        p.title.toLowerCase().includes(q) ||
        (p.excerpt ?? '').toLowerCase().includes(q) ||
        (p.tags ?? []).some(t => t.toLowerCase().includes(q))
      return matchTag && matchText
    })
  }, [initialPosts, activeTag, query])

  return (
    <>
      {/* BLOG HERO */}
      <section className="blog-hero">
        <div className="blog-hero-glow" />
        <div className="container">
          <div className="blog-hero-inner">
            <div className="sec-label">Insights & Blog</div>
            <h1 className="blog-hero-title">Kiến thức thực chiến<br />từ Media Omni.</h1>
            <p className="blog-hero-sub">
              Case study, framework và playbook — chia sẻ để cùng grow cùng nhau.
            </p>

            {/* SEARCH */}
            <div className="blog-search-wrap">
              <svg className="blog-search-ico" width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                className="blog-search"
                type="text"
                placeholder="Tìm bài viết..."
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
              {query && (
                <button className="blog-search-clear" onClick={() => setQuery('')} aria-label="Xoá">✕</button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* TAG FILTERS */}
      <div className="blog-tags-bar">
        <div className="container">
          <div className="blog-tag-list">
            {allTags.map(tag => (
              <button
                key={tag}
                className={`blog-tag-btn${activeTag === tag ? ' active' : ''}`}
                onClick={() => setActiveTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* POST GRID */}
      <section className="blog-list-section">
        <div className="container">
          {filtered.length === 0 ? (
            <div className="blog-empty">
              <div className="blog-empty-ico">🔍</div>
              <p>Không tìm thấy bài viết nào{activeTag !== 'Tất cả' ? ` trong "${activeTag}"` : ''}.</p>
              <button className="btn-outline" onClick={() => { setActiveTag('Tất cả'); setQuery('') }}>
                Xem tất cả
              </button>
            </div>
          ) : (
            <div className="blog-card-grid">
              {filtered.map((p, i) => (
                <Link
                  key={p._id}
                  href={`/blog/${p.slug.current}`}
                  className="blog-card"
                >
                  {/* Cover / gradient header */}
                  {p.coverImage?.asset?.url ? (
                    <div className="blog-card-cover" style={{ position: 'relative' }}>
                      <Image
                        src={p.coverImage.asset.url}
                        alt={p.coverImage.alt ?? p.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        style={{ objectFit: 'cover' }}
                        loading={i < 3 ? 'eager' : 'lazy'}
                      />
                    </div>
                  ) : (
                    <div
                      className="blog-card-cover blog-card-cover--grad"
                      style={{ background: getGradient(p.bgGradient, i) }}
                    >
                      <div className="blog-card-cover-tags">
                        {(p.tags ?? []).slice(0, 2).map(t => (
                          <span key={t} className="tag tag--white">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="blog-card-body">
                    {/* Tags row */}
                    {p.tags && p.tags.length > 0 && (
                      <div className="blog-card-tags">
                        {p.tags.slice(0, 3).map(t => (
                          <span key={t} className="tag">{t}</span>
                        ))}
                      </div>
                    )}

                    <h2 className="blog-card-title">{p.title}</h2>
                    {p.excerpt && (
                      <p className="blog-card-excerpt">{p.excerpt}</p>
                    )}

                    <div className="blog-card-meta">
                      <span className="blog-card-author">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        {p.author ?? 'Media Omni'}
                      </span>
                      <span className="blog-card-date">{formatDate(p.publishedAt)}</span>
                      <span className="blog-card-rt">{readTime(p.excerpt)} min read</span>
                    </div>

                    <div className="blog-card-cta">
                      Đọc bài viết
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
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
              <a href="/#team">Đội ngũ</a>
              <a href="mailto:quangnd@upbase.asia">Liên hệ</a>
            </div>
            <div className="footer-col">
              <h4>Services</h4>
              <a href="/#services">TikTok Ads</a>
              <a href="/#services">Shopee Ads</a>
              <a href="/#services">Meta Ads</a>
              <a href="/#services">Google Ads</a>
            </div>
            <div className="footer-col">
              <h4>Resources</h4>
              <Link href="/blog">Blog</Link>
              <a href="/quiz">Quiz Hub</a>
              <a href="/dashboard">Team Hub</a>
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
