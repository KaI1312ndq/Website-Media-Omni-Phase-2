import { ImageResponse } from 'next/og'
import { client } from '@/lib/sanity'
import { caseStudyBySlugQuery } from '@/lib/queries'

export const runtime = 'edge'
export const alt = 'Media Omni — Case Study'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

type CS = {
  title?: string
  brandName?: string
  excerpt?: string
  results?: { metric?: string; change?: string }[]
}

export default async function CSOGImage({ params }: { params: { slug: string } }) {
  const cs: CS | null = await client.fetch(caseStudyBySlugQuery, { slug: params.slug }).catch(() => null)
  const title = cs?.title || 'Media Omni — Case Study'
  const brand = cs?.brandName || ''
  const topResult = cs?.results?.[0]

  return new ImageResponse(
    (
      <div style={{
        width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
        background: 'linear-gradient(135deg,#0a1628 0%,#0d1f4f 45%,#1e3a8a 100%)',
        padding: '64px 72px', position: 'relative', fontFamily: 'system-ui, sans-serif', color: '#fff',
      }}>
        <div style={{
          position: 'absolute', top: -160, right: -120, width: 540, height: 540, borderRadius: '50%',
          background: 'radial-gradient(closest-side, rgba(37,99,235,.45), transparent 70%)', display: 'flex',
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'linear-gradient(135deg,#2563EB,#06B6D4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, fontWeight: 800, boxShadow: '0 10px 32px rgba(37,99,235,.55)',
          }}>MO</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 1 }}>MEDIA OMNI</div>
            <div style={{ fontSize: 16, color: 'rgba(255,255,255,.55)' }}>Case Study · {brand}</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto', marginBottom: 'auto', maxWidth: 1000 }}>
          <div style={{
            fontSize: 56, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.1, color: '#fff',
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>{title}</div>
          {topResult && (
            <div style={{ marginTop: 28, display: 'flex', gap: 16, fontSize: 28, color: '#06B6D4', fontWeight: 700 }}>
              <span style={{ display: 'flex' }}>{topResult.metric}: {topResult.change}</span>
            </div>
          )}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 'auto', fontSize: 20, color: 'rgba(255,255,255,.5)',
        }}>
          <div style={{ display: 'flex' }}>mediaomni.site/case-studies/{params.slug}</div>
          <div style={{ display: 'flex' }}>UpBase Vietnam</div>
        </div>
      </div>
    ),
    { ...size }
  )
}
