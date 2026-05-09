import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { PortableText, type PortableTextBlock } from '@portabletext/react'
import { client, urlFor } from '@/lib/sanity'
import { sopBySlugQuery, sopSlugsQuery, relatedSopQuery } from '@/lib/queries'
import '../sop.css'

export const revalidate = 300
export const dynamicParams = true

const hasSanity = Boolean(
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID &&
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID !== 'placeholder'
)

const CATEGORY_LABEL: Record<string, string> = {
  process: 'Quy trình', template: 'Templates', checklist: 'Checklists',
  training: 'Training', playbook: 'Playbook', tools: 'Tools',
}

const CALLOUT_ICON: Record<string, string> = {
  info: 'ℹ️', warning: '⚠️', success: '✅', danger: '🚫',
}

const FILE_BADGE: Record<string, string> = {
  pdf: 'PDF', xlsx: 'XLS', docx: 'DOC', figma: 'FIG',
  drive: 'DRV', notion: 'NTN', sheet: 'SHT', other: 'FILE',
}

function slugify(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function blockText(block: PortableTextBlock): string {
  if (!block || !Array.isArray((block as { children?: unknown }).children)) return ''
  const children = (block as { children: Array<{ text?: string }> }).children
  return children.map(c => c.text || '').join('')
}

export async function generateStaticParams() {
  if (!hasSanity) return []
  const slugs: string[] = await client.fetch(sopSlugsQuery).catch(() => [])
  return (slugs || []).map(slug => ({ slug }))
}

export async function generateMetadata(
  { params }: { params: { slug: string } },
): Promise<Metadata> {
  if (!hasSanity) return { title: 'SOP — Media Omni' }
  const doc = await client.fetch(sopBySlugQuery, { slug: params.slug }).catch(() => null)
  if (!doc) return { title: 'Tài liệu không tồn tại' }
  return {
    title: `${doc.title} — SOP & Resources`,
    description: doc.excerpt,
  }
}

export default async function SopDetailPage({ params }: { params: { slug: string } }) {
  if (!hasSanity) notFound()
  const doc = await client.fetch(sopBySlugQuery, { slug: params.slug }).catch(() => null)
  if (!doc) notFound()

  const related = await client
    .fetch(relatedSopQuery, { category: doc.category, slug: params.slug })
    .catch(() => [])

  // TOC from h2/h3
  const toc: Array<{ id: string; text: string; level: 2 | 3 }> = []
  if (Array.isArray(doc.content)) {
    for (const b of doc.content as PortableTextBlock[]) {
      const style = (b as { style?: string }).style
      if (style === 'h2' || style === 'h3') {
        const text = blockText(b)
        if (text) toc.push({ id: slugify(text), text, level: style === 'h2' ? 2 : 3 })
      }
    }
  }

  const ptComponents = {
    block: {
      h2: ({ children, value }: { children?: React.ReactNode; value: PortableTextBlock }) => (
        <h2 id={slugify(blockText(value))}>{children}</h2>
      ),
      h3: ({ children, value }: { children?: React.ReactNode; value: PortableTextBlock }) => (
        <h3 id={slugify(blockText(value))}>{children}</h3>
      ),
      h4: ({ children }: { children?: React.ReactNode }) => <h4>{children}</h4>,
      blockquote: ({ children }: { children?: React.ReactNode }) => (
        <blockquote className="sop-quote">{children}</blockquote>
      ),
    },
    marks: {
      code: ({ children }: { children?: React.ReactNode }) => (
        <code className="sop-code">{children}</code>
      ),
      link: ({ children, value }: { children?: React.ReactNode; value?: { href?: string } }) => (
        <a href={value?.href} target="_blank" rel="noopener noreferrer">{children}</a>
      ),
    },
    types: {
      image: ({ value }: { value: { asset?: unknown; alt?: string; caption?: string } }) => {
        if (!value?.asset) return null
        const src = urlFor(value.asset as Parameters<typeof urlFor>[0]).width(900).url()
        return (
          <figure className="sop-figure">
            <Image src={src} alt={value.alt || ''} width={900} height={600}
              sizes="(max-width: 768px) 100vw, 900px"
              style={{ width: '100%', height: 'auto' }} />
            {value.caption && <figcaption>{value.caption}</figcaption>}
          </figure>
        )
      },
      callout: ({ value }: { value: { type?: string; text?: string } }) => {
        const type = value?.type || 'info'
        return (
          <div className={`sop-callout sop-callout-${type}`}>
            <span className="sop-callout-icon">{CALLOUT_ICON[type] || 'ℹ️'}</span>
            <span>{value?.text}</span>
          </div>
        )
      },
      fileLink: ({ value }: { value: { label?: string; url?: string; fileType?: string } }) => {
        if (!value?.url) return null
        const badge = FILE_BADGE[value.fileType || 'other'] || 'FILE'
        return (
          <a href={value.url} target="_blank" rel="noopener noreferrer" className="sop-file-link">
            <span className="sop-file-icon">{badge}</span>
            <span>{value.label || value.url}</span>
          </a>
        )
      },
    },
  }

  const publishedDate = doc.publishedAt
    ? new Date(doc.publishedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : null
  const updatedDate = doc._updatedAt
    ? new Date(doc._updatedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : null

  return (
    <div className="sop-wrap">
      <Link href="/hub/sop" className="sop-detail-back">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Quay lại SOP Hub
      </Link>

      <div className="sop-breadcrumb">
        <Link href="/hub/sop">SOP & Resources</Link>
        <span className="sop-breadcrumb-sep">/</span>
        <span>{CATEGORY_LABEL[doc.category] ?? doc.category}</span>
        <span className="sop-breadcrumb-sep">/</span>
        <span>{doc.title}</span>
      </div>

      <header className="sop-detail-hero">
        <div className="sop-detail-icon">{doc.icon || '📋'}</div>
        <h1 className="sop-detail-title">{doc.title}</h1>
        <p className="sop-detail-excerpt">{doc.excerpt}</p>
        <div className="sop-detail-meta">
          <span className="sop-cat-badge">{CATEGORY_LABEL[doc.category] ?? doc.category}</span>
          {doc.level && <span className={`sop-level-pill ${doc.level}`}>{doc.level}</span>}
          {(doc.platform || []).map((p: string) => (
            <span key={p} className="sop-plat-tag">{p}</span>
          ))}
          {doc.author && <span className="sop-meta-item">· {doc.author}</span>}
          {publishedDate && <span className="sop-meta-item">· {publishedDate}</span>}
        </div>
      </header>

      <div className="sop-twocol">
        <article className="sop-content-card">
          {Array.isArray(doc.content) && doc.content.length > 0 ? (
            <PortableText
              value={doc.content}
              components={ptComponents as Parameters<typeof PortableText>[0]['components']}
            />
          ) : (
            <p style={{ color: '#64748b' }}>Tài liệu này chưa có nội dung chi tiết.</p>
          )}
        </article>

        <aside className="sop-side">
          {toc.length > 0 && (
            <div className="sop-side-card">
              <h4>Mục lục</h4>
              <ul className="sop-toc-list">
                {toc.map(t => (
                  <li key={t.id}>
                    <a href={`#${t.id}`} className={t.level === 3 ? 'lvl-3' : ''}>{t.text}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {doc.tags && doc.tags.length > 0 && (
            <div className="sop-side-card">
              <h4>Tags</h4>
              <div className="sop-tag-row">
                {doc.tags.map((t: string) => <span key={t} className="sop-tag">{t}</span>)}
              </div>
            </div>
          )}

          <div className="sop-side-card">
            <h4>Thông tin</h4>
            <div style={{ fontSize: '0.84rem', color: '#cbd5e1', lineHeight: 1.6 }}>
              {doc.author && <div><b style={{ color: '#94a3b8', fontWeight: 500 }}>Tác giả:</b> {doc.author}</div>}
              {publishedDate && <div><b style={{ color: '#94a3b8', fontWeight: 500 }}>Đăng:</b> {publishedDate}</div>}
              {updatedDate && updatedDate !== publishedDate && (
                <div><b style={{ color: '#94a3b8', fontWeight: 500 }}>Cập nhật:</b> {updatedDate}</div>
              )}
            </div>
          </div>

          <a
            href={`/studio/structure/sopDoc;${doc._id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="sop-edit-link"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Sửa trong Sanity
          </a>
        </aside>
      </div>

      {Array.isArray(related) && related.length > 0 && (
        <div className="sop-related">
          <div className="sop-section-title">Tài liệu liên quan</div>
          <div className="sop-related-grid">
            {related.map((r: {
              _id: string; title: string; slug: { current: string };
              category: string; icon?: string; excerpt: string; level?: string
            }) => (
              <Link key={r._id} href={`/hub/sop/${r.slug.current}`} className="sop-card">
                <div className="sop-card-icon">{r.icon || '📋'}</div>
                <div className="sop-card-title">{r.title}</div>
                <div className="sop-card-excerpt">{r.excerpt}</div>
                <div className="sop-card-foot">
                  <span className="sop-cat-badge">{CATEGORY_LABEL[r.category] ?? r.category}</span>
                  {r.level && <span className={`sop-level-pill ${r.level}`}>{r.level}</span>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
