import type { Metadata } from 'next'
import { Sora, Be_Vietnam_Pro, Roboto_Mono } from 'next/font/google'
import './globals.css'
import Nav from '@/components/Nav'

const sora = Sora({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
})

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-body',
  display: 'swap',
})

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://www.mediaomni.site'),
  title: {
    default: 'Media Omni — Performance Marketing Team | UpBase Vietnam',
    template: '%s | Media Omni',
  },
  description:
    'Media Omni vận hành performance marketing đa kênh cho 100+ brands — TikTok Shop, Shopee, Meta, Google. 356B NMV · >7x ROAS · 12 Growth Operators.',
  keywords: [
    'performance marketing Vietnam', 'media agency Vietnam', 'TikTok Shop partner',
    'Shopee ads', 'Meta ads CPAS', 'Google ads', 'ecommerce marketing Vietnam',
    'UpBase Vietnam', 'Media Omni', 'agency performance', 'quảng cáo đa kênh',
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
    images: [{ url: 'https://www.mediaomni.site/og-image.png', width: 1200, height: 630, alt: 'Media Omni — Performance Marketing Team' }],
    locale: 'vi_VN',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@mediaomni',
    title: 'Media Omni — Performance Marketing Team',
    description: 'Vận hành performance marketing đa kênh cho 100+ brands ecommerce hàng đầu Việt Nam.',
    images: ['https://www.mediaomni.site/og-image.png'],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Media Omni',
              alternateName: 'MediaOmni',
              url: 'https://mediaomni.site',
              logo: 'https://mediaomni.site/favicon.svg',
              description:
                'Performance marketing agency vận hành đa kênh cho 100+ brands ecommerce tại Việt Nam.',
              parentOrganization: { '@type': 'Organization', name: 'UpBase Vietnam' },
              areaServed: 'VN',
              knowsAbout: [
                'Performance Marketing', 'TikTok Shop', 'Shopee Ads', 'Meta Ads', 'Google Ads',
              ],
            }),
          }}
        />
        {/* Google Analytics 4 */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-TYTP82G06N" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-TYTP82G06N');`,
          }}
        />
      </head>
      <body>
        <div id="sp" />
        <Nav />
        {children}
      </body>
    </html>
  )
}
