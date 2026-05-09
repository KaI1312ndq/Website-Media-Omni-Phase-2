import React from 'react'

interface SkeletonProps {
  width?: string | number
  height?: string | number
  rounded?: string | number
  dark?: boolean
  style?: React.CSSProperties
  className?: string
}

export function Skeleton({ width, height = 16, rounded = 8, dark, style, className }: SkeletonProps) {
  return (
    <div
      className={`${dark ? 'skeleton-dark' : 'skeleton'} ${className || ''}`.trim()}
      style={{
        width: width ?? '100%',
        height,
        borderRadius: rounded,
        ...style,
      }}
    />
  )
}

export function HubPageSkeleton({ title = 'Đang tải...' }: { title?: string }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)', paddingTop: 88 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px 80px' }}>
        <Skeleton width={220} height={28} style={{ marginBottom: 8 }} />
        <Skeleton width={360} height={16} style={{ marginBottom: 28 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12, padding: 18 }}>
              <Skeleton width={'70%'} height={18} style={{ marginBottom: 10 }} />
              <Skeleton width={'100%'} height={12} style={{ marginBottom: 8 }} />
              <Skeleton width={'60%'} height={12} />
            </div>
          ))}
        </div>
        <span className="sr-only">{title}</span>
      </div>
    </div>
  )
}
