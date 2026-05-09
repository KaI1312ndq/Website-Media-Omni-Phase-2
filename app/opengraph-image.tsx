import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Media Omni — Performance Marketing Team'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background:
            'linear-gradient(135deg,#050F2C 0%,#0D1F4F 40%,#0A2A6E 70%,#0E3A80 100%)',
          padding: '64px 72px',
          position: 'relative',
          fontFamily: 'system-ui, sans-serif',
          color: '#fff',
        }}
      >
        {/* glow */}
        <div
          style={{
            position: 'absolute',
            top: -180,
            right: -120,
            width: 600,
            height: 600,
            borderRadius: '50%',
            background:
              'radial-gradient(closest-side, rgba(37,99,235,.55), transparent 70%)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -200,
            left: -100,
            width: 540,
            height: 540,
            borderRadius: '50%',
            background:
              'radial-gradient(closest-side, rgba(6,182,212,.35), transparent 70%)',
            display: 'flex',
          }}
        />

        {/* logo + brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              background: 'linear-gradient(135deg,#2563EB,#06B6D4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              fontWeight: 800,
              boxShadow: '0 12px 40px rgba(37,99,235,.55)',
            }}
          >
            MO
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>
              Media Omni
            </div>
            <div style={{ fontSize: 18, color: 'rgba(255,255,255,.6)' }}>
              UpBase Vietnam · Ecommerce Enabler
            </div>
          </div>
        </div>

        {/* main */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: 'auto',
            marginBottom: 'auto',
          }}
        >
          <div
            style={{
              fontSize: 88,
              fontWeight: 800,
              letterSpacing: -3,
              lineHeight: 1.05,
              backgroundImage: 'linear-gradient(90deg,#60A5FA,#06B6D4,#34D399)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Performance
          </div>
          <div
            style={{
              fontSize: 88,
              fontWeight: 800,
              letterSpacing: -3,
              lineHeight: 1.05,
            }}
          >
            Marketing Team
          </div>
          <div
            style={{
              marginTop: 24,
              fontSize: 30,
              color: 'rgba(255,255,255,.78)',
              fontWeight: 500,
            }}
          >
            100+ Brands · 356B NMV · &gt;7x ROAS
          </div>
        </div>

        {/* footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 'auto',
            fontSize: 22,
            color: 'rgba(255,255,255,.55)',
          }}
        >
          <div style={{ display: 'flex' }}>mediaomni.site</div>
          <div style={{ display: 'flex' }}>TikTok · Shopee · Meta · Google</div>
        </div>
      </div>
    ),
    { ...size }
  )
}
