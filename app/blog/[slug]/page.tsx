import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PortableText } from '@portabletext/react'
import Link from 'next/link'
import Image from 'next/image'
import { client, urlFor } from '@/lib/sanity'
import { blogPostQuery, blogSlugsQuery } from '@/lib/queries'

export const revalidate = 600
export const dynamicParams = true

const hasSanity = Boolean(
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID &&
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID !== 'placeholder'
)

/* ─── Static params ─── */
export async function generateStaticParams() {
  if (!hasSanity) return []
  const slugs: { slug: string }[] = await client.fetch(blogSlugsQuery).catch(() => [])
  return slugs.map(s => ({ slug: s.slug }))
}

/* ─── Metadata ─── */
export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  const post = await client.fetch(blogPostQuery, { slug: params.slug }).catch(() => null)
  if (!post) return { title: 'Bài viết không tồn tại' }

  const ogImg = post.ogImage?.asset
    ? urlFor(post.ogImage).width(1200).height(630).url()
    : post.coverImage?.asset
    ? urlFor(post.coverImage).width(1200).height(630).url()
    : 'https://www.mediaomni.site/og-image.png'

  return {
    title: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt,
    openGraph: {
      title: post.seoTitle ?? post.title,
      description: post.seoDescription ?? post.excerpt,
      url: `https://www.mediaomni.site/blog/${params.slug}`,
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author ?? 'Media Omni'],
      tags: post.tags,
      images: [{ url: ogImg, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seoTitle ?? post.title,
      description: post.seoDescription ?? post.excerpt,
      images: [ogImg],
    },
  }
}

/* ─── Portable Text components ─── */
const ptComponents = {
  types: {
    image: ({ value }: { value: { asset: unknown; alt?: string; caption?: string } }) => {
      if (!value?.asset) return null
      return (
        <figure className="pt-image">
          <Image
            src={urlFor(value.asset as Parameters<typeof urlFor>[0]).width(900).url()}
            alt={value.alt ?? ''}
            width={900}
            height={600}
            sizes="(max-width: 768px) 100vw, 900px"
            style={{ width: '100%', height: 'auto' }}
            loading="lazy"
          />
          {value.caption && <figcaption>{value.caption}</figcaption>}
        </figure>
      )
    },
  },
  block: {
    h2: ({ children }: { children?: React.ReactNode }) => <h2 className="pt-h2">{children}</h2>,
    h3: ({ children }: { children?: React.ReactNode }) => <h3 className="pt-h3">{children}</h3>,
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <blockquote className="pt-blockquote">{children}</blockquote>
    ),
    normal: ({ children }: { children?: React.ReactNode }) => <p className="pt-p">{children}</p>,
  },
  marks: {
    link: ({ children, value }: { children?: React.ReactNode; value?: { href: string } }) => (
      <a href={value?.href} target="_blank" rel="noopener noreferrer" className="pt-link">
        {children}
      </a>
    ),
    code: ({ children }: { children?: React.ReactNode }) => (
      <code className="pt-code">{children}</code>
    ),
  },
}

/* ─── Page ─── */
export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await client.fetch(blogPostQuery, { slug: params.slug }).catch(() => null)
  if (!post) notFound()

  const publishedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('vi-VN', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post._updatedAt ?? post.publishedAt,
    author: { '@type': 'Person', name: post.author ?? 'Media Omni' },
    publisher: {
      '@type': 'Organization',
      name: 'Media Omni',
      logo: { '@type': 'ImageObject', url: 'https://www.mediaomni.site/favicon.svg' },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://www.mediaomni.site/blog/${params.slug}`,
    },
    url: `https://www.mediaomni.site/blog/${params.slug}`,
    ...(post.coverImage?.asset && {
      image: urlFor(post.coverImage).width(1200).height(630).url(),
    }),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="post-page">
        {/* BACK */}
        <div className="post-back-bar">
          <div className="container">
            <Link href="/blog" className="post-back-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Quay lại Blog
            </Link>
          </div>
        </div>

        {/* HERO */}
        <header className="post-hero">
          {post.coverImage?.asset ? (
            <div className="post-cover" style={{ position: 'relative', aspectRatio: '5 / 2' }}>
              <Image
                src={urlFor(post.coverImage).width(1400).height(560).url()}
                alt={post.coverImage.alt ?? post.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 1400px"
                style={{ objectFit: 'cover' }}
              />
            </div>
          ) : (
            <div
              className="post-cover-grad"
              style={{
                background: post.bgGradient
                  ? `var(--grad-${post.bgGradient}, linear-gradient(135deg,#0f172a,#1e3a8a))`
                  : 'linear-gradient(135deg,#0f172a,#1e3a8a)',
              }}
            />
          )}

          <div className="container">
            <div className="post-hero-inner">
              {/* Tags */}
              {post.tags && (
                <div className="post-tags">
                  {post.tags.map((t: string) => (
                    <Link key={t} href={`/blog?tag=${encodeURIComponent(t)}`} className="tag">
                      {t}
                    </Link>
                  ))}
                </div>
              )}

              <h1 className="post-title">{post.title}</h1>
              {post.excerpt && <p className="post-excerpt">{post.excerpt}</p>}

              <div className="post-meta">
                <span className="post-meta-author">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  {post.author ?? 'Media Omni'}
                </span>
                {publishedDate && (
                  <span className="post-meta-date">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    {publishedDate}
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <div className="container">
          <div className="post-body">
            {post.content ? (
              <PortableText value={post.content} components={ptComponents as Parameters<typeof PortableText>[0]['components']} />
            ) : (
              <p className="pt-p" style={{ color: 'var(--muted)' }}>Nội dung đang được cập nhật...</p>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="post-cta-bar">
          <div className="container">
            <div className="post-cta-inner">
              <p>Muốn trao đổi về performance marketing?</p>
              <a href="mailto:quangnd@upbase.asia" className="btn-primary">
                Liên hệ Media Omni →
              </a>
            </div>
          </div>
        </div>
      </article>

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
              <a href="/quiz">Quiz Hub</a>
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
