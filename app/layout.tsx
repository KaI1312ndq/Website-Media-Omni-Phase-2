import type { Metadata, Viewport } from 'next'
import { Sora, Be_Vietnam_Pro, Roboto_Mono } from 'next/font/google'
import Script from 'next/script'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import Nav from '@/components/Nav'

// NOTE: Sora và Roboto Mono trên Google Fonts không có subset 'vietnamese' riêng
// nhưng có 'latin-ext' bao gồm các glyph Vietnamese (ư, ơ, đ, ấ, ầ, ...).
// Be Vietnam Pro dùng subset 'vietnamese' chuẩn cho body.
// CSS fallback chuỗi (xem globals.css) đảm bảo glyph thiếu sẽ fallback Be Vietnam Pro.
const sora = Sora({
  subsets: ['latin', 'latin-ext'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
  preload: true,
})

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
  preload: true,
})

const robotoMono = Roboto_Mono({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
  preload: false,
})

const GA_ID = process.env.NEXT_PUBLIC_GA_ID

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a1628',
}

export const metadata: Metadata = {
  metadataBase: new URL('https://www.mediaomni.site'),
  title: {
    default: 'Media Omni — Performance Marketing Team | UpBase Vietnam',
    template: '%s | Media Omni',
  },
  description:
    'Media Omni vận hành performance marketing đa kênh cho 100+ brands — TikTok Shop, Shopee, Meta, Google. 356B NMV · >7x ROAS · 12 Growth Operators.',
  keywords: [
    'performance marketing Vietnam',
    'media agency Vietnam',
    'TikTok Shop partner',
    'Shopee ads',
    'Meta ads CPAS',
    'Google ads',
    'ecommerce marketing Vietnam',
    'UpBase Vietnam',
    'Media Omni',
    'agency performance',
    'quảng cáo đa kênh',
  ],
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  alternates: { canonical: 'https://www.mediaomni.site' },
  openGraph: {
    type: 'website',
    url: 'https://www.mediaomni.site',
    siteName: 'Media Omni',
    title: 'Media Omni — Performance Marketing Team | UpBase Vietnam',
    description:
      'Vận hành performance marketing đa kênh cho 100+ brands ecommerce hàng đầu Việt Nam. 356B NMV · >7x ROAS · 12 Growth Operators.',
    locale: 'vi_VN',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: { url: '/apple-touch-icon.png', sizes: '180x180' },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${sora.variable} ${beVietnamPro.variable} ${robotoMono.variable}`}>
      <head>
        <link rel="preconnect" href="https://cdn.sanity.io" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.sanity.io" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Media Omni',
              alternateName: 'MediaOmni',
              url: 'https://www.mediaomni.site',
              logo: 'https://www.mediaomni.site/favicon.svg',
              description:
                'Performance marketing agency vận hành đa kênh cho 100+ brands ecommerce tại Việt Nam.',
              parentOrganization: { '@type': 'Organization', name: 'UpBase Vietnam' },
              areaServed: 'VN',
              knowsAbout: ['Performance Marketing', 'TikTok Shop', 'Shopee Ads', 'Meta Ads', 'Google Ads'],
            }),
          }}
        />
      </head>
      <body>
        <div id="sp" />
        <Nav />
        {children}
        <Analytics />
        {/* Google Analytics 4 — only when GA ID is configured. Loaded after interactive to avoid blocking LCP. */}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="gtag-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  )
}
