'use client'
import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body style={{ background: '#0a1628', color: '#e2e8f0', padding: 40, fontFamily: 'system-ui' }}>
        <h1>Có lỗi xảy ra</h1>
        <p>Đã ghi nhận lỗi và đội ngũ kỹ thuật sẽ kiểm tra.</p>
        <a href="/" style={{ color: '#06b6d4' }}>← Về trang chủ</a>
      </body>
    </html>
  )
}
