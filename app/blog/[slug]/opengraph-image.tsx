import { ImageResponse } from 'next/og'
import { client } from '@/lib/sanity'
import { blogPostQuery } from '@/lib/queries'

export const runtime = 'edge'
export const alt = 'Media Omni — Blog Post'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

type Post = {
  title?: string
  excerpt?: string
  author?: string
  publishedAt?: string
}

export default async function BlogOGImage({ params }: { params: { slug: string } }) {
  const post: Post | null = await client
    .fetch(blogPostQuery, { slug: params.slug })
    .catch(() => null)

  const title = post?.title || 'Media Omni — Blog'
  const author = post?.author || 'Media Omni'
  const dateStr = post?.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('vi-VN', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : ''

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background:
            'linear-gradient(135deg,#0a1628 0%,#0d1f4f 45%,#1e3a8a 100%)',
          padding: '64px 72px',
          position: 'relative',
          fontFamily: 'system-ui, sans-serif',
          color: '#fff',
        }}
      >
        {/* decorative glows */}
        <div
          style={{
            position: 'absolute',
            top: -160,
            right: -120,
            width: 540,
            height: 540,
            borderRadius: '50%',
            background:
              'radial-gradient(closest-side, rgba(37,99,235,.45), transparent 70%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -200,
            right: -80,
            width: 480,
            height: 480,
            borderRadius: '50%',
            background:
              'radial-gradient(closest-side, rgba(6,182,212,.30), transparent 70%)',
            display: 'flex',
          }}
        />

        {/* logo + brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: 'linear-gradient(135deg,#2563EB,#06B6D4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              fontWeight: 800,
              boxShadow: '0 10px 32px rgba(37,99,235,.55)',
            }}
          >
            MO
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 1 }}>
              MEDIA OMNI
            </div>
            <div style={{ fontSize: 16, color: 'rgba(255,255,255,.55)' }}>
              Performance Marketing · Blog
            </div>
          </div>
        </div>

        {/* main title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: 'auto',
            marginBottom: 'auto',
            maxWidth: 1000,
          }}
        >
          <div
            style={{
              fontSize: 60,
              fontWeight: 800,
              letterSpacing: -1.5,
              lineHeight: 1.1,
              color: '#fff',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {title}
          </div>
          <div
            style={{
              marginTop: 24,
              display: 'flex',
              gap: 16,
              fontSize: 22,
              color: 'rgba(255,255,255,.65)',
            }}
          >
            <span style={{ display: 'flex' }}>✍️ {author}</span>
            {dateStr && <span style={{ display: 'flex' }}>· {dateStr}</span>}
          </div>
        </div>

        {/* footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 'auto',
            fontSize: 20,
            color: 'rgba(255,255,255,.5)',
          }}
        >
          <div style={{ display: 'flex' }}>
            mediaomni.site/blog/{params.slug}
          </div>
          <div style={{ display: 'flex' }}>UpBase Vietnam</div>
        </div>
      </div>
    ),
    { ...size }
  )
}
