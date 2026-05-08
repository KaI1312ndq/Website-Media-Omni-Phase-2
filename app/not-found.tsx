import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '404 — Trang không tồn tại',
  description: 'Trang bạn đang tìm không tồn tại hoặc đã được di chuyển.',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg,#050F2C 0%,#0D1F4F 40%,#0A2A6E 70%,#0E3A80 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
      fontFamily: 'var(--f-body, "Be Vietnam Pro", system-ui, sans-serif)',
    }}>
      {/* glows */}
      <div style={{ position:'absolute',top:'-10%',right:'-5%',width:600,height:600,borderRadius:'50%',background:'radial-gradient(ellipse 80% 60% at 60% 30%,rgba(37,99,235,.35),transparent 70%)',pointerEvents:'none' }} />
      <div style={{ position:'absolute',bottom:'-20%',left:'-5%',width:500,height:500,borderRadius:'50%',background:'radial-gradient(ellipse 60% 50% at 20% 80%,rgba(6,182,212,.2),transparent 60%)',pointerEvents:'none' }} />
      {/* grid */}
      <div style={{ position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(37,99,235,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(37,99,235,.06) 1px,transparent 1px)',backgroundSize:'60px 60px',pointerEvents:'none' }} />

      <div style={{ position:'relative',zIndex:2,textAlign:'center',padding:'0 24px',maxWidth:560 }}>
        {/* MO logo */}
        <div style={{ width:52,height:52,borderRadius:14,background:'linear-gradient(135deg,#2563EB,#06B6D4)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 32px',boxShadow:'0 8px 32px rgba(37,99,235,.5)',fontFamily:'var(--f-display,"Sora",system-ui,sans-serif)',fontWeight:800,fontSize:'1rem',color:'#fff' }}>
          MO
        </div>

        {/* 404 */}
        <div style={{ fontFamily:'var(--f-display,"Sora",system-ui,sans-serif)',fontSize:'clamp(5rem,15vw,9rem)',fontWeight:800,letterSpacing:'-.06em',lineHeight:1,background:'linear-gradient(90deg,#60A5FA,#06B6D4,#34D399)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text',marginBottom:16 }}>
          404
        </div>

        <h1 style={{ fontFamily:'var(--f-display,"Sora",system-ui,sans-serif)',fontSize:'clamp(1.2rem,3vw,1.7rem)',fontWeight:800,color:'#fff',letterSpacing:'-.03em',marginBottom:12,lineHeight:1.2 }}>
          Trang không tồn tại
        </h1>
        <p style={{ fontSize:'1rem',color:'rgba(255,255,255,.6)',lineHeight:1.75,marginBottom:40,maxWidth:420,margin:'0 auto 40px' }}>
          Trang bạn đang tìm đã được di chuyển hoặc không tồn tại.<br />Quay về trang chủ để tiếp tục.
        </p>

        <div style={{ display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap' }}>
          <Link href="/" style={{ display:'inline-flex',alignItems:'center',gap:8,background:'linear-gradient(135deg,#2563EB,#06B6D4)',color:'#fff',fontWeight:700,fontSize:'.95rem',padding:'12px 28px',borderRadius:100,border:'none',boxShadow:'0 4px 24px rgba(37,99,235,.4)',textDecoration:'none' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M3 12L12 3l9 9"/><path d="M9 21V12h6v9"/></svg>
            Về trang chủ
          </Link>
          <Link href="/blog" style={{ display:'inline-flex',alignItems:'center',gap:8,background:'rgba(255,255,255,.1)',color:'#fff',fontWeight:600,fontSize:'.95rem',padding:'12px 28px',borderRadius:100,border:'1.5px solid rgba(255,255,255,.22)',textDecoration:'none' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            Xem Blog
          </Link>
        </div>
      </div>
    </div>
  )
}
