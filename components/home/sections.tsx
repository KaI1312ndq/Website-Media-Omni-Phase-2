'use client'

import { useState } from 'react'
import Image from 'next/image'

export interface SanityBrand {
  _id: string
  name: string
  category: 'skincare' | 'fashion' | 'baby' | 'fmcg' | 'electronics'
  logoUrl?: string
}

export interface FaqItem { q?: string; a?: string }

interface ServiceCardProps {
  icon: React.ReactNode
  iconBg: string
  name: string
  sub: string
  chips: string[]
  delay: string
  scopes: { name: string; desc: string }[]
}

export function ServiceCard({ icon, iconBg, name, sub, chips, delay, scopes }: ServiceCardProps) {
  return (
    <div className={`svc-detail-card rv ${delay}`}>
      <div className="svc-detail-left">
        <div className="svc-detail-icon" style={{ background: iconBg }}>{icon}</div>
        <h3 className="svc-detail-name">{name}</h3>
        <p className="svc-detail-sub">{sub}</p>
        <div className="svc-chips" style={{ marginTop: 16 }}>
          {chips.map(c => <span key={c} className="chip">{c}</span>)}
        </div>
      </div>
      <div className="svc-detail-right">
        <div className="svc-scope-title">Scope of Work</div>
        <div className="svc-scope-grid">
          {scopes.map(s => (
            <div key={s.name} className="svc-scope-item">
              <div className="ssi-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <div><div className="ssi-name">{s.name}</div><div className="ssi-desc">{s.desc}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const CATEGORY_ROWS: Record<string, { perItem: number; rev: boolean }> = {
  skincare:    { perItem: 1.6, rev: false },
  fashion:     { perItem: 1.7, rev: true  },
  baby:        { perItem: 1.6, rev: false },
  fmcg:        { perItem: 1.7, rev: true  },
  electronics: { perItem: 1.6, rev: false },
}

const FALLBACK_BRANDS: SanityBrand[] = [
  { _id: 'f1',  name: 'The Ordinary',   category: 'skincare'    },
  { _id: 'f2',  name: "Paula's Choice", category: 'skincare'    },
  { _id: 'f3',  name: 'Anessa',         category: 'skincare'    },
  { _id: 'f4',  name: 'Hada Labo',      category: 'skincare'    },
  { _id: 'f5',  name: 'CeraVe',         category: 'skincare'    },
  { _id: 'f6',  name: 'La Roche-Posay', category: 'skincare'    },
  { _id: 'f7',  name: 'Nón Sơn',        category: 'fashion'     },
  { _id: 'f8',  name: "Biti's",         category: 'fashion'     },
  { _id: 'f9',  name: 'Vascara',        category: 'fashion'     },
  { _id: 'f10', name: 'Coolmate',       category: 'fashion'     },
  { _id: 'f11', name: 'CANIFA',         category: 'fashion'     },
  { _id: 'f12', name: 'Elise',          category: 'fashion'     },
  { _id: 'f13', name: 'Huggies',        category: 'baby'        },
  { _id: 'f14', name: 'Pampers',        category: 'baby'        },
  { _id: 'f15', name: 'Bobby',          category: 'baby'        },
  { _id: 'f16', name: 'Pigeon',         category: 'baby'        },
  { _id: 'f17', name: 'Chicco',         category: 'baby'        },
  { _id: 'f18', name: 'Vinamilk',       category: 'fmcg'        },
  { _id: 'f19', name: 'TH True Milk',   category: 'fmcg'        },
  { _id: 'f20', name: 'NutiFood',       category: 'fmcg'        },
  { _id: 'f21', name: 'Nestlé',         category: 'fmcg'        },
  { _id: 'f22', name: 'Kinh Đô',        category: 'fmcg'        },
  { _id: 'f23', name: 'Sunhouse',       category: 'electronics' },
  { _id: 'f24', name: 'Kangaroo',       category: 'electronics' },
  { _id: 'f25', name: 'Philips',        category: 'electronics' },
  { _id: 'f26', name: 'Panasonic',      category: 'electronics' },
  { _id: 'f27', name: 'Samsung',        category: 'electronics' },
]

export function BrandsSection({ brands }: { brands: SanityBrand[] }) {
  const source = brands.length > 0 ? brands : FALLBACK_BRANDS
  const rowOrder: SanityBrand['category'][] = ['skincare', 'fashion', 'baby', 'fmcg', 'electronics']
  const rows = rowOrder
    .map(cat => {
      const items = source.filter(b => b.category === cat)
      const cfg = CATEGORY_ROWS[cat]
      const dur = `${Math.max(14, Math.round(items.length * cfg.perItem))}s`
      return { cat, items, dur, rev: cfg.rev }
    })
    .filter(r => r.items.length > 0)

  return (
    <section id="brands">
      <div className="container">
        <div className="sec-hd rv" style={{ textAlign: 'center', alignItems: 'center' }}>
          <div className="sec-label" style={{ justifyContent: 'center' }}>Brand Portfolio</div>
          <h2 className="sec-title">100+ Brands.<br />Mọi ngành hàng.</h2>
          <p className="sec-sub" style={{ margin: '0 auto' }}>Từ skincare đến FMCG, từ fashion đến electronics — Media Omni vận hành đa dạng ngành hàng trên mọi nền tảng.</p>
        </div>
      </div>
      <div className="brands-container rv">
        {rows.map((row, i) => (
          <div
            key={i}
            className={`brands-track${row.rev ? ' brands-track-reverse' : ''}`}
            style={{ ['--marquee-speed' as string]: row.dur }}
          >
            {[...row.items, ...row.items, ...row.items].map((b, j) => (
              <div key={j} className={`brand-pill${b.logoUrl ? ' brand-pill-logo' : ''}`} title={b.name}>
                {b.logoUrl
                  ? <Image src={b.logoUrl} alt={b.name} width={120} height={36} sizes="120px" style={{ maxHeight: 36, maxWidth: 120, width: 'auto', height: 'auto', objectFit: 'contain' }} loading="lazy" />
                  : <span>{b.name}</span>}
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}

export function PartnersSection() {
  const partners = [
    {
      name: 'TikTok Shop', tier: 'Kim Cương 2025', badgeClass: 'partner-badge--diamond',
      desc: 'TikTok Shop Partner xuất sắc — Top partner theo GMV toàn quốc.',
      iconBg: undefined,
      icon: <svg width="32" height="32" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.77 0 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-6.13 6.33 6.34 6.34 0 0 0 12.67 0V8.69a8.28 8.28 0 0 0 4.83 1.54V6.77a4.85 4.85 0 0 1-1.07-.08z" fill="#010101" /></svg>,
    },
    {
      name: 'Shopee', tier: 'Strategic Partner', badgeClass: 'partner-badge--premium',
      desc: 'Shopee Strategic Partner — Top 5 Đối tác Toàn diện Xuất sắc 2025.',
      iconBg: 'linear-gradient(145deg,#ff6533,#ee4d2d)',
      icon: <svg viewBox="0 0 48 48" width="40" height="40"><path d="M24 8c-4.4 0-8 3.5-8 7.8H13L10 40h28l-3-24.2h-3C32 11.5 28.4 8 24 8zm0 3.2c3 0 5.4 2.2 5.8 5H18.2c.4-2.8 2.8-5 5.8-5zm0 10.8c-3.8 0-7-2.5-8.2-6h2.5c.9 2 2.9 3.4 5.7 3.4s4.8-1.4 5.7-3.4h2.5c-1.2 3.5-4.4 6-8.2 6z" fill="white" /></svg>,
    },
    {
      name: 'Google', tier: 'Google Partner', badgeClass: 'partner-badge--google',
      desc: 'Google Partner certified — Search, Shopping, YouTube, Performance Max.',
      iconBg: 'white',
      icon: <svg viewBox="0 0 48 48" width="40" height="40"><path d="M6.3 15.7l6.6 4.8C14.6 17 19 14 24 14c3 0 5.8 1.1 7.9 3l5.7-5.7C34 8.1 29.3 6 24 6c-7.6 0-14.2 4.3-17.7 9.7z" fill="#EA4335" /><path d="M24 44c5.2 0 9.7-1.7 13.1-4.7l-6.1-5c-1.7 1.2-3.9 1.9-7 1.9-5.4 0-10-3.8-11.2-9H2.7v5.2C6.1 39.6 14.5 44 24 44z" fill="#34A853" /><path d="M43.6 20H24v8h11.3c-.5 2.6-2 4.9-4.2 6.4l6.1 5c3.5-3.3 5.8-8.2 5.8-14.5 0-1.2-.1-2.5-.4-3.5z" fill="#4285F4" /><path d="M6.3 15.7C4.9 18.2 4 21 4 24s.9 5.8 2.3 8.3l6.6-5.1c-.5-1-.8-2.1-.8-3.2s.3-2.2.8-3.2L6.3 15.7z" fill="#FBBC05" /></svg>,
    },
    {
      name: 'Meta', tier: 'Business Partner', badgeClass: 'partner-badge--meta',
      desc: 'Meta Business Partner — Facebook, Instagram Ads và CPAS specialist.',
      iconBg: undefined,
      icon: <svg width="32" height="32" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#0866FF" /></svg>,
    },
  ]

  return (
    <section id="partners">
      <div className="container">
        <div className="sec-hd rv" style={{ textAlign: 'center', alignItems: 'center' }}>
          <div className="sec-label" style={{ justifyContent: 'center' }}>Platform Partners</div>
          <h2 className="sec-title">Đối tác chính thức<br />trên mọi nền tảng.</h2>
          <p className="sec-sub" style={{ margin: '0 auto' }}>Được công nhận bởi các nền tảng hàng đầu — TikTok Shop Partner, Shopee Strategic Partner, Google Partner, Meta Business Partner.</p>
        </div>
        <div className="partners-grid rv">
          {partners.map(p => (
            <div key={p.name} className="partner-card">
              <div className="partner-logo-wrap" style={p.iconBg ? { background: p.iconBg, borderRadius: 18, ...(p.iconBg === 'white' ? { border: '1.5px solid #e8eaed' } : {}) } : undefined}>
                {p.icon}
              </div>
              <div className="partner-name">{p.name}</div>
              <div className="partner-tier">
                <span className={`partner-badge ${p.badgeClass}`}>{p.tier}</span>
              </div>
              <div className="partner-desc">{p.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function FaqSection({ intro, faq }: { intro?: string; faq: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section id="faq" style={{ padding: '90px 0', background: 'var(--paper2)' }}>
      <div className="container" style={{ maxWidth: 880 }}>
        <div className="sec-hd rv" style={{ textAlign: 'center', alignItems: 'center', marginBottom: 32 }}>
          <div className="sec-label" style={{ justifyContent: 'center' }}>FAQ</div>
          <h2 className="sec-title">Câu hỏi thường gặp.</h2>
          {intro && <p className="sec-sub" style={{ margin: '0 auto' }}>{intro}</p>}
        </div>
        <div className="rv" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {faq.map((item, i) => {
            const isOpen = open === i
            return (
              <div key={i} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', overflow: 'hidden', transition: 'border-color .2s' }}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  style={{ width: '100%', textAlign: 'left', padding: '18px 22px', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, fontFamily: 'var(--f-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--ink)' }}
                  aria-expanded={isOpen}
                >
                  <span>{item.q}</span>
                  <span style={{ flexShrink: 0, transform: isOpen ? 'rotate(45deg)' : 'rotate(0)', transition: 'transform .25s var(--ease,ease)', color: 'var(--blue)', fontSize: '1.4rem', lineHeight: 1, fontWeight: 300 }}>+</span>
                </button>
                <div style={{ maxHeight: isOpen ? 400 : 0, transition: 'max-height .3s ease', overflow: 'hidden' }}>
                  <div style={{ padding: '0 22px 18px', color: 'var(--muted)', fontSize: '.95rem', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{item.a}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export function SocialIcon({ platform }: { platform?: string }) {
  switch ((platform ?? '').toLowerCase()) {
    case 'facebook':
      return <svg viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
    case 'tiktok':
      return <svg viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.77 0 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-6.13 6.33 6.34 6.34 0 0 0 12.67 0V8.69a8.28 8.28 0 0 0 4.83 1.54V6.77a4.85 4.85 0 0 1-1.07-.08z" /></svg>
    case 'linkedin':
      return <svg viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
    case 'youtube':
      return <svg viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
    case 'instagram':
      return <svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" /></svg>
    default:
      return <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>
  }
}
