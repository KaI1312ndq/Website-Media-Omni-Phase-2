import { withSentryConfig } from '@sentry/nextjs'

const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.sanity.io' },
      { protocol: 'https', hostname: '**.sanity.io' },
      { protocol: 'https', hostname: 'scontent.fhan14-1.fna.fbcdn.net' },
      { protocol: 'https', hostname: '**.fbcdn.net' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  compress: true,
  productionBrowserSourceMaps: false,
}

export default withSentryConfig(nextConfig, {
  org: 'media-omni',
  project: 'mediaomni-website',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  tunnelRoute: '/monitoring',
})
